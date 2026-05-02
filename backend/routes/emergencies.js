const express = require('express');
const pool = require('../database/connection');
const { authenticate, authorize, auditLog } = require('../middleware/auth');

const router = express.Router();

// GET /api/emergencies - List all emergencies with rescue teams, patients, and finance
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, severity, disaster_type } = req.query;
    let sql = `
      SELECT
        er.*,
        dt.name AS disaster_type_name,
        u.full_name AS operator_name,
        -- Rescue team summary for this emergency
        (SELECT COUNT(*) FROM team_assignments ta WHERE ta.emergency_id = er.id AND ta.status = 'Active') AS active_teams,
        (SELECT STRING_AGG(rt.team_name, ', ') FROM team_assignments ta JOIN rescue_teams rt ON ta.team_id = rt.id WHERE ta.emergency_id = er.id AND ta.status = 'Active') AS assigned_teams,
        -- Patient count from hospital_patients linked to this emergency
        (SELECT COUNT(*) FROM hospital_patients hp WHERE hp.emergency_id = er.id AND hp.status IN ('Admitted','In Treatment')) AS admitted_patients,
        -- Budget info
        (SELECT TOP 1 b.total_budget FROM budgets b WHERE b.emergency_id = er.id) AS allocated_budget,
        (SELECT TOP 1 b.spent FROM budgets b WHERE b.emergency_id = er.id) AS spent_budget
      FROM emergency_reports er
      JOIN disaster_types dt ON er.disaster_type_id = dt.id
      LEFT JOIN users u ON er.assigned_operator_id = u.id
      WHERE 1=1`;
    const params = [];

    if (status) { sql += ' AND er.status = ?'; params.push(status); }
    if (severity) { sql += ' AND er.severity = ?'; params.push(severity); }
    if (disaster_type) { sql += ' AND er.disaster_type_id = ?'; params.push(parseInt(disaster_type)); }

    sql += ` ORDER BY CASE er.severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Moderate' THEN 3 WHEN 'Low' THEN 4 ELSE 5 END, er.reported_at DESC OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY`;

    const [rows] = await pool.query(sql, params);
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM emergency_reports');
    res.json({ data: rows, total: countResult[0].total });
  } catch (error) {
    console.error('Get emergencies error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/emergencies/types/list
router.get('/types/list', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM disaster_types ORDER BY name');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/emergencies/:id — Single emergency with full detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const emergencyId = parseInt(req.params.id);

    const [rows] = await pool.query(`
      SELECT er.*, dt.name AS disaster_type_name, u.full_name AS operator_name
      FROM emergency_reports er
      JOIN disaster_types dt ON er.disaster_type_id = dt.id
      LEFT JOIN users u ON er.assigned_operator_id = u.id
      WHERE er.id = ?`, [emergencyId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Emergency not found.' });

    // Fetch assigned rescue teams
    const [teams] = await pool.query(`
      SELECT ta.id AS assignment_id, ta.status AS assignment_status, ta.assigned_at, ta.notes AS assignment_notes,
        rt.id AS team_id, rt.team_name, rt.team_type, rt.leader_name, rt.phone, rt.status AS team_status,
        u.full_name AS assigned_by_name
      FROM team_assignments ta
      JOIN rescue_teams rt ON ta.team_id = rt.id
      LEFT JOIN users u ON ta.assigned_by = u.id
      WHERE ta.emergency_id = ?
      ORDER BY ta.assigned_at DESC`, [emergencyId]);

    // Fetch admitted patients for this emergency
    const [patients] = await pool.query(`
      SELECT hp.*, h.name AS hospital_name
      FROM hospital_patients hp
      JOIN hospitals h ON hp.hospital_id = h.id
      WHERE hp.emergency_id = ?
      ORDER BY hp.admitted_at DESC`, [emergencyId]);

    // Fetch financial transactions linked to this emergency
    const [transactions] = await pool.query(`
      SELECT ft.*, u.full_name AS recorded_by_name
      FROM financial_transactions ft
      LEFT JOIN users u ON ft.recorded_by = u.id
      WHERE ft.emergency_id = ?
      ORDER BY ft.transaction_date DESC`, [emergencyId]);

    // Budget
    const [budget] = await pool.query(`
      SELECT *, (total_budget - spent) AS remaining,
        ROUND(CAST(spent AS FLOAT)/NULLIF(total_budget,0)*100,1) AS utilization_pct
      FROM budgets WHERE emergency_id = ?`, [emergencyId]);

    res.json({
      data: rows[0],
      teams,
      patients,
      transactions,
      budget: budget.length > 0 ? budget[0] : null
    });
  } catch (error) {
    console.error('Get emergency error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/emergencies - Create new emergency report (public)
router.post('/', async (req, res) => {
  try {
    const { reporter_name, reporter_phone, disaster_type_id, severity, latitude, longitude, location_description, description } = req.body;
    if (!disaster_type_id || !latitude || !longitude) {
      return res.status(400).json({ error: 'Disaster type, latitude, and longitude are required.' });
    }
    const [result] = await pool.query(
      `INSERT INTO emergency_reports (reporter_name, reporter_phone, disaster_type_id, severity, latitude, longitude, location_description, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [reporter_name, reporter_phone, parseInt(disaster_type_id), severity || 'Moderate',
       parseFloat(latitude), parseFloat(longitude), location_description, description]
    );
    res.status(201).json({ message: 'Emergency report submitted.', id: result.insertId });
  } catch (error) {
    console.error('Create emergency error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/emergencies/:id/status — With bed reallocation on Resolved/Closed
router.patch('/:id/status', authenticate, authorize('Administrator', 'Emergency Operator'),
  auditLog('UPDATE_EMERGENCY_STATUS', 'emergency_reports'),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { status } = req.body;
      const emergencyId = parseInt(req.params.id);
      const validStatuses = ['Pending', 'Acknowledged', 'In Progress', 'Resolved', 'Closed'];
      if (!validStatuses.includes(status)) {
        await conn.rollback(); conn.release();
        return res.status(400).json({ error: 'Invalid status.' });
      }

      let sql, params;
      if (status === 'Resolved' || status === 'Closed') {
        sql = 'UPDATE emergency_reports SET status = ?, resolved_at = GETDATE(), updated_at = GETDATE() WHERE id = ?';
        params = [status, emergencyId];
      } else if (status === 'Acknowledged' || status === 'In Progress') {
        sql = 'UPDATE emergency_reports SET status = ?, assigned_operator_id = ?, updated_at = GETDATE() WHERE id = ?';
        params = [status, req.user.id, emergencyId];
      } else {
        sql = 'UPDATE emergency_reports SET status = ?, updated_at = GETDATE() WHERE id = ?';
        params = [status, emergencyId];
      }
      await conn.query(sql, params);

      // ── BED REALLOCATION: When emergency is Resolved or Closed ──────────────
      // Discharge all active patients linked to this emergency → triggers add beds back
      if (status === 'Resolved' || status === 'Closed') {
        const [activePts] = await conn.query(
          `SELECT id FROM hospital_patients WHERE emergency_id = ? AND status IN ('Admitted','In Treatment')`,
          [emergencyId]
        );

        if (activePts.length > 0) {
          await conn.query(
            `UPDATE hospital_patients SET status = 'Discharged', discharged_at = GETDATE()
             WHERE emergency_id = ? AND status IN ('Admitted','In Treatment')`,
            [emergencyId]
          );
          // Note: If a DB trigger handles available_beds increment on discharge,
          // it fires automatically. If not, manually increment:
          // Get distinct hospitals and how many patients were discharged per hospital
          const [hospitalGroups] = await conn.query(
            `SELECT hospital_id, COUNT(*) AS cnt
             FROM hospital_patients
             WHERE emergency_id = ? AND status = 'Discharged' AND discharged_at >= DATEADD(SECOND,-5,GETDATE())
             GROUP BY hospital_id`,
            [emergencyId]
          );
          for (const hg of hospitalGroups) {
            await conn.query(
              'UPDATE hospitals SET available_beds = available_beds + ? WHERE id = ?',
              [hg.cnt, hg.hospital_id]
            );
          }
        }

        // Mark all active rescue team assignments for this emergency as Completed
        await conn.query(
          `UPDATE team_assignments SET status = 'Completed', completed_at = GETDATE()
           WHERE emergency_id = ? AND status = 'Active'`,
          [emergencyId]
        );

        // Free up the rescue teams (set back to Available)
        await conn.query(
          `UPDATE rescue_teams SET status = 'Available', updated_at = GETDATE()
           WHERE id IN (
             SELECT team_id FROM team_assignments WHERE emergency_id = ?
           )`,
          [emergencyId]
        );

        // Audit the reallocation
        await conn.query(
          'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES (?,?,?,?,?,?)',
          [req.user.id, 'EMERGENCY_RESOLVED_REALLOCATION', 'emergency_reports', emergencyId,
           JSON.stringify({ status, patients_discharged: activePts.length }), req.ip]
        );
      }

      await conn.commit();
      conn.release();
      res.json({ message: 'Status updated.', id: emergencyId });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.error('Status update error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
