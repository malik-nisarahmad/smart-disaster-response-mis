const express = require('express');
const pool = require('../database/connection');
const { authenticate, authorize, auditLog } = require('../middleware/auth');

const router = express.Router();

// GET /api/emergencies - List all emergencies
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, severity, disaster_type } = req.query;
    let sql = `SELECT er.*, dt.name AS disaster_type_name, u.full_name AS operator_name
      FROM emergency_reports er
      JOIN disaster_types dt ON er.disaster_type_id = dt.id
      LEFT JOIN users u ON er.assigned_operator_id = u.id WHERE 1=1`;
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

// GET /api/emergencies/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT er.*, dt.name AS disaster_type_name, u.full_name AS operator_name
       FROM emergency_reports er
       JOIN disaster_types dt ON er.disaster_type_id = dt.id
       LEFT JOIN users u ON er.assigned_operator_id = u.id
       WHERE er.id = ?`,
      [parseInt(req.params.id)]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Emergency not found.' });
    res.json({ data: rows[0] });
  } catch (error) {
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
      [reporter_name, reporter_phone, parseInt(disaster_type_id), severity || 'Moderate', parseFloat(latitude), parseFloat(longitude), location_description, description]
    );

    res.status(201).json({ message: 'Emergency report submitted.', id: result.insertId });
  } catch (error) {
    console.error('Create emergency error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/emergencies/:id/status
router.patch('/:id/status', authenticate, authorize('Administrator', 'Emergency Operator'),
  auditLog('UPDATE_EMERGENCY_STATUS', 'emergency_reports'),
  async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['Pending', 'Acknowledged', 'In Progress', 'Resolved', 'Closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
      }

      let sql, params;
      if (status === 'Resolved' || status === 'Closed') {
        sql = 'UPDATE emergency_reports SET status = ?, resolved_at = GETDATE(), updated_at = GETDATE() WHERE id = ?';
        params = [status, parseInt(req.params.id)];
      } else if (status === 'Acknowledged' || status === 'In Progress') {
        sql = 'UPDATE emergency_reports SET status = ?, assigned_operator_id = ?, updated_at = GETDATE() WHERE id = ?';
        params = [status, req.user.id, parseInt(req.params.id)];
      } else {
        sql = 'UPDATE emergency_reports SET status = ?, updated_at = GETDATE() WHERE id = ?';
        params = [status, parseInt(req.params.id)];
      }

      await pool.query(sql, params);
      res.json({ message: 'Status updated.', id: parseInt(req.params.id) });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
