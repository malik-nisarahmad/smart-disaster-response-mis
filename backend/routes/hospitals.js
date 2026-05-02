const express = require('express');
const pool = require('../database/connection');
const { authenticate, authorize, auditLog } = require('../middleware/auth');

const router = express.Router();

// ─── Haversine formula — returns distance in km between two lat/lng points ───
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Static routes MUST come before dynamic /:id routes in Express
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/hospitals/load-balance
router.get('/load-balance', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.id, h.name, h.location, h.total_beds, h.available_beds, h.available_icu, h.status,
        ROUND(CAST(h.total_beds - h.available_beds AS FLOAT) / NULLIF(h.total_beds,0) * 100, 1) AS occupancy_pct,
        COUNT(hp.id) AS active_patients,
        SUM(CASE WHEN hp.condition_severity = 'Critical' THEN 1 ELSE 0 END) AS critical_patients
      FROM hospitals h
      LEFT JOIN hospital_patients hp ON h.id = hp.hospital_id AND hp.status IN ('Admitted','In Treatment')
      GROUP BY h.id, h.name, h.location, h.total_beds, h.available_beds, h.available_icu, h.status
      ORDER BY occupancy_pct ASC
    `);
    res.json({ data: rows });
  } catch (error) {
    console.error('Load balance error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/hospitals/auto-assign — Load-balancing: pick best hospital by capacity
router.post('/auto-assign', authenticate, authorize('Administrator', 'Emergency Operator'),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { patient_name, age, gender, condition_severity, emergency_id, notes } = req.body;

      if (!patient_name) {
        await conn.rollback(); conn.release();
        return res.status(400).json({ error: 'patient_name is required.' });
      }

      // Load-balancing: pick hospital with most available capacity
      // Critical → prefer hospitals with available ICU beds
      let query;
      if (condition_severity === 'Critical') {
        [query] = await conn.query(`
          SELECT TOP 1 id, name, available_beds, available_icu FROM hospitals
          WHERE status = 'Operational' AND available_icu > 0
          ORDER BY available_icu DESC
        `);
      } else {
        [query] = await conn.query(`
          SELECT TOP 1 id, name, available_beds, available_icu FROM hospitals
          WHERE status = 'Operational' AND available_beds > 0
          ORDER BY available_beds DESC
        `);
      }

      if (!query || query.length === 0) {
        await conn.rollback(); conn.release();
        return res.status(503).json({ error: 'No hospital with available capacity found.' });
      }

      const hospital = query[0];

      const [result] = await conn.query(
        'INSERT INTO hospital_patients (hospital_id, emergency_id, patient_name, age, gender, condition_severity, notes) VALUES (?,?,?,?,?,?,?)',
        [hospital.id, emergency_id ? parseInt(emergency_id) : null, patient_name,
         age ? parseInt(age) : null, gender || null, condition_severity || 'Stable', notes || null]
      );

      // Audit
      await conn.query(
        'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES (?,?,?,?,?,?)',
        [req.user.id, 'AUTO_ASSIGN_PATIENT', 'hospital_patients', result.insertId,
         JSON.stringify({ hospital_id: hospital.id, hospital_name: hospital.name, patient_name, condition_severity }), req.ip]
      );

      await conn.commit();
      conn.release();
      res.status(201).json({
        message: `Patient auto-assigned to ${hospital.name}.`,
        id: result.insertId,
        hospital: { id: hospital.id, name: hospital.name }
      });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.error('Auto-assign error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// POST /api/hospitals/patients/:id/escalate — Escalation workflow
router.post('/patients/:id/escalate', authenticate, authorize('Administrator', 'Emergency Operator'),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const patientId = parseInt(req.params.id);
      const { reason, target_hospital_id } = req.body;

      const [patients] = await conn.query('SELECT * FROM hospital_patients WITH (UPDLOCK, ROWLOCK) WHERE id = ?', [patientId]);
      if (patients.length === 0) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Patient not found.' }); }
      const patient = patients[0];

      await conn.query(
        `UPDATE hospital_patients SET condition_severity = 'Critical', notes = ? WHERE id = ?`,
        [`[ESCALATED] ${reason || 'Condition deteriorated'} | Previous: ${patient.notes || ''}`, patientId]
      );

      let targetHospitalId = target_hospital_id ? parseInt(target_hospital_id) : null;
      if (!targetHospitalId) {
        const [candidates] = await conn.query(`
          SELECT TOP 1 id FROM hospitals
          WHERE status = 'Operational' AND available_icu > 0 AND id != ?
          ORDER BY available_icu DESC
        `, [patient.hospital_id]);
        if (candidates && candidates.length > 0) targetHospitalId = candidates[0].id;
      }

      const [approvalResult] = await conn.query(
        `INSERT INTO approval_requests (request_type, reference_id, reference_table, requested_by, priority, description) VALUES (?,?,?,?,?,?)`,
        ['Rescue Deployment', patientId, 'hospital_patients', req.user.id, 'Urgent',
         `ESCALATION: Patient #${patientId} (${patient.patient_name}) requires ICU transfer. Reason: ${reason || 'Critical condition'}${targetHospitalId ? '. Target Hospital ID: ' + targetHospitalId : ''}`]
      );

      await conn.query(
        'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES (?,?,?,?,?,?)',
        [req.user.id, 'PATIENT_ESCALATION', 'hospital_patients', patientId,
         JSON.stringify({ reason, target_hospital_id: targetHospitalId, approval_id: approvalResult.insertId }), req.ip]
      );

      await conn.commit();
      conn.release();
      res.json({ message: 'Patient escalated. Approval request created.', approval_id: approvalResult.insertId, target_hospital_id: targetHospitalId });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.error('Escalation error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// PATCH /api/hospitals/patients/:id/discharge
router.patch('/patients/:id/discharge', authenticate, authorize('Administrator', 'Emergency Operator'),
  auditLog('DISCHARGE_PATIENT', 'hospital_patients'),
  async (req, res) => {
    try {
      await pool.query(
        `UPDATE hospital_patients SET status = 'Discharged', discharged_at = GETDATE() WHERE id = ?`,
        [parseInt(req.params.id)]
      );
      res.json({ message: 'Patient discharged.', id: parseInt(req.params.id) });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─── Dynamic routes (/:id) AFTER static routes ───────────────────────────────

// GET /api/hospitals
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vw_hospital_capacity ORDER BY occupancy_pct DESC');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/hospitals/:id/patients
router.get('/:id/patients', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM hospital_patients WHERE hospital_id = ? AND status IN ('Admitted','In Treatment') ORDER BY admitted_at DESC`,
      [parseInt(req.params.id)]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/hospitals/:id/admit — Manual admit (ACID)
router.post('/:id/admit', authenticate, authorize('Administrator', 'Emergency Operator'),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { patient_name, age, gender, condition_severity, emergency_id, notes } = req.body;
      const hospitalId = parseInt(req.params.id);

      const [hospital] = await conn.query('SELECT * FROM hospitals WITH (UPDLOCK, ROWLOCK) WHERE id = ?', [hospitalId]);
      if (hospital.length === 0) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Hospital not found.' }); }
      if (hospital[0].available_beds <= 0) {
        await conn.rollback(); conn.release();
        return res.status(400).json({ error: 'No beds available at this hospital.' });
      }

      const [result] = await conn.query(
        'INSERT INTO hospital_patients (hospital_id, emergency_id, patient_name, age, gender, condition_severity, notes) VALUES (?,?,?,?,?,?,?)',
        [hospitalId, emergency_id ? parseInt(emergency_id) : null, patient_name,
         age ? parseInt(age) : null, gender || null, condition_severity || 'Stable', notes || null]
      );

      await conn.commit();
      conn.release();
      res.status(201).json({ message: 'Patient admitted.', id: result.insertId });
    } catch (error) {
      await conn.rollback();
      conn.release();
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// POST /api/hospitals — Create hospital
router.post('/', authenticate, authorize('Administrator'),
  auditLog('CREATE_HOSPITAL', 'hospitals'),
  async (req, res) => {
    try {
      const { name, location, latitude, longitude, total_beds, icu_beds, phone } = req.body;
      const [result] = await pool.query(
        'INSERT INTO hospitals (name, location, latitude, longitude, total_beds, available_beds, icu_beds, available_icu, phone) VALUES (?,?,?,?,?,?,?,?,?)',
        [name, location, latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null,
         parseInt(total_beds) || 100, parseInt(total_beds) || 100, parseInt(icu_beds) || 0, parseInt(icu_beds) || 0, phone || null]
      );
      res.status(201).json({ message: 'Hospital created.', id: result.insertId });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
