const express = require('express');
const pool = require('../database/connection');
const { authenticate, authorize, auditLog } = require('../middleware/auth');

const router = express.Router();

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

// POST /api/hospitals
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

// POST /api/hospitals/:id/admit - ACID Transaction
router.post('/:id/admit', authenticate, authorize('Administrator', 'Emergency Operator'),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { patient_name, age, gender, condition_severity, emergency_id, notes } = req.body;
      const hospitalId = parseInt(req.params.id);

      // Lock hospital row
      const [hospital] = await conn.query('SELECT * FROM hospitals WITH (UPDLOCK, ROWLOCK) WHERE id = ?', [hospitalId]);
      if (hospital.length === 0) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Hospital not found.' }); }
      if (hospital[0].available_beds <= 0) {
        await conn.rollback(); conn.release();
        return res.status(400).json({ error: 'No beds available at this hospital.' });
      }

      // Admit patient (trigger updates bed count)
      const [result] = await conn.query(
        'INSERT INTO hospital_patients (hospital_id, emergency_id, patient_name, age, gender, condition_severity, notes) VALUES (?,?,?,?,?,?,?)',
        [hospitalId, emergency_id ? parseInt(emergency_id) : null, patient_name, age ? parseInt(age) : null,
         gender || null, condition_severity || 'Stable', notes || null]);

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

module.exports = router;
