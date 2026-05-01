const express = require('express');
const pool = require('../database/connection');
const { authenticate, authorize, auditLog } = require('../middleware/auth');

const router = express.Router();

// GET /api/rescue-teams
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type } = req.query;
    let sql = 'SELECT * FROM vw_rescue_team_status WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (type) { sql += ' AND team_type = ?'; params.push(type); }
    sql += ` ORDER BY CASE status WHEN 'Available' THEN 1 WHEN 'Assigned' THEN 2 WHEN 'Busy' THEN 3 WHEN 'Completed' THEN 4 WHEN 'Off Duty' THEN 5 ELSE 6 END`;
    const [rows] = await pool.query(sql, params);
    res.json({ data: rows });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/rescue-teams
router.post('/', authenticate, authorize('Administrator', 'Field Officer'),
  auditLog('CREATE_TEAM', 'rescue_teams'),
  async (req, res) => {
    try {
      const { team_name, team_type, leader_name, member_count, phone } = req.body;
      const [result] = await pool.query(
        'INSERT INTO rescue_teams (team_name, team_type, leader_name, member_count, phone) VALUES (?,?,?,?,?)',
        [team_name, team_type, leader_name, member_count || 5, phone || null]
      );
      res.status(201).json({ message: 'Team created.', id: result.insertId });
    } catch (error) {
      console.error('Create team error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// POST /api/rescue-teams/:id/assign - ACID Transaction
router.post('/:id/assign', authenticate, authorize('Administrator', 'Field Officer', 'Emergency Operator'),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { emergency_id, notes } = req.body;
      const teamId = parseInt(req.params.id);

      // Lock team row for update
      const [team] = await conn.query('SELECT * FROM rescue_teams WITH (UPDLOCK, ROWLOCK) WHERE id = ?', [teamId]);
      if (team.length === 0) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Team not found.' }); }
      if (team[0].status !== 'Available') { await conn.rollback(); conn.release(); return res.status(400).json({ error: 'Team is not available.' }); }

      // Create assignment (trigger updates team status)
      await conn.query(
        'INSERT INTO team_assignments (team_id, emergency_id, assigned_by, notes) VALUES (?,?,?,?)',
        [teamId, parseInt(emergency_id), req.user.id, notes || null]);

      // Update emergency status
      await conn.query(
        `UPDATE emergency_reports SET status = 'In Progress', assigned_operator_id = ? WHERE id = ? AND status IN ('Pending','Acknowledged')`,
        [req.user.id, parseInt(emergency_id)]);

      await conn.commit();
      conn.release();

      // Audit log
      await pool.query(
        'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES (?,?,?,?,?,?)',
        [req.user.id, 'ASSIGN_TEAM', 'team_assignments', teamId, JSON.stringify({ team_id: teamId, emergency_id }), req.ip]);

      res.json({ message: 'Team assigned successfully.' });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.error('Assign team error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// PATCH /api/rescue-teams/:id/status
router.patch('/:id/status', authenticate, authorize('Administrator', 'Field Officer'),
  auditLog('UPDATE_TEAM_STATUS', 'rescue_teams'),
  async (req, res) => {
    try {
      const { status } = req.body;
      const teamId = parseInt(req.params.id);
      await pool.query('UPDATE rescue_teams SET status = ?, updated_at = GETDATE() WHERE id = ?', [status, teamId]);

      if (status === 'Available') {
        await pool.query(
          `UPDATE team_assignments SET status = 'Completed', completed_at = GETDATE() WHERE team_id = ? AND status != 'Completed'`, [teamId]);
      }

      res.json({ message: 'Team status updated.', id: teamId });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// GET /api/rescue-teams/activity/:id
router.get('/activity/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM team_activity_log WHERE team_id = ? ORDER BY logged_at DESC OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY',
      [parseInt(req.params.id)]);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
