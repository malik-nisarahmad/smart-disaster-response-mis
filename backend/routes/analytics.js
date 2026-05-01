const express = require('express');
const { query } = require('../database/connection');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/dashboard
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const [stats] = await query('SELECT * FROM vw_dashboard_stats');
    res.json({ data: stats[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics/incidents
router.get('/incidents', authenticate, async (req, res) => {
  try {
    const [byType] = await query(
      `SELECT dt.name AS disaster_type, COUNT(*) AS count
       FROM emergency_reports er JOIN disaster_types dt ON er.disaster_type_id = dt.id
       GROUP BY dt.name ORDER BY count DESC`
    );
    const [bySeverity] = await query(
      `SELECT severity, COUNT(*) AS count FROM emergency_reports GROUP BY severity
       ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Moderate' THEN 3 WHEN 'Low' THEN 4 END`
    );
    const [byStatus] = await query(
      'SELECT status, COUNT(*) AS count FROM emergency_reports GROUP BY status'
    );
    const [timeline] = await query(
      `SELECT TOP 30 CONVERT(DATE, reported_at) AS date, COUNT(*) AS count
       FROM emergency_reports GROUP BY CONVERT(DATE, reported_at) ORDER BY date DESC`
    );
    res.json({ byType, bySeverity, byStatus, timeline });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics/resources
router.get('/resources', authenticate, async (req, res) => {
  try {
    const [byCategory] = await query(
      'SELECT category, SUM(quantity) AS total_quantity, COUNT(*) AS item_count FROM resources GROUP BY category'
    );
    const [lowStock] = await query(
      `SELECT * FROM vw_resource_inventory WHERE stock_status = 'LOW STOCK'`
    );
    const [byWarehouse] = await query(
      `SELECT w.name AS warehouse, COUNT(r.id) AS item_count, SUM(r.quantity) AS total_items
       FROM warehouses w LEFT JOIN resources r ON w.id = r.warehouse_id GROUP BY w.name`
    );
    res.json({ byCategory, lowStock, byWarehouse });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics/response-times
router.get('/response-times', authenticate, async (req, res) => {
  try {
    const [data] = await query(
      `SELECT dt.name AS disaster_type, er.severity,
       AVG(DATEDIFF(MINUTE, er.reported_at, er.resolved_at)) AS avg_response_minutes,
       MIN(DATEDIFF(MINUTE, er.reported_at, er.resolved_at)) AS min_response_minutes,
       MAX(DATEDIFF(MINUTE, er.reported_at, er.resolved_at)) AS max_response_minutes,
       COUNT(*) AS resolved_count
       FROM emergency_reports er
       JOIN disaster_types dt ON er.disaster_type_id = dt.id
       WHERE er.resolved_at IS NOT NULL
       GROUP BY dt.name, er.severity`
    );
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics/financial
router.get('/financial', authenticate, authorize('Administrator', 'Finance Officer'), async (req, res) => {
  try {
    const [summary] = await query('SELECT * FROM vw_financial_summary');
    const [monthly] = await query(
      `SELECT TOP 60 FORMAT(transaction_date, 'yyyy-MM') AS month, transaction_type,
       SUM(amount) AS total FROM financial_transactions
       WHERE status IN ('Approved','Completed')
       GROUP BY FORMAT(transaction_date, 'yyyy-MM'), transaction_type
       ORDER BY month DESC`
    );
    res.json({ summary, monthly });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics/audit-logs (changed from /api/audit-logs)
router.get('/audit-logs', authenticate, authorize('Administrator'), async (req, res) => {
  try {
    const [rows] = await query('SELECT TOP 100 * FROM vw_audit_log_detail ORDER BY logged_at DESC');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics/users
router.get('/users', authenticate, authorize('Administrator'), async (req, res) => {
  try {
    const [users] = await query(
      'SELECT u.id, u.full_name, u.email, u.phone, u.is_active, u.created_at, r.name as role FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC'
    );
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
