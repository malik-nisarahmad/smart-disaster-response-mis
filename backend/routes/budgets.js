const express = require('express');
const pool = require('../database/connection');
const { authenticate, authorize, auditLog, validate } = require('../middleware/auth');

const router = express.Router();

// GET /api/budgets - List all budgets with emergency info
router.get('/', authenticate, authorize('Administrator', 'Finance Officer'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, er.location_description AS emergency_location,
        dt.name AS disaster_type, er.severity, er.status AS emergency_status,
        (b.total_budget - b.spent) AS remaining,
        ROUND(CAST(b.spent AS FLOAT) / NULLIF(b.total_budget,0) * 100, 1) AS utilization_pct
      FROM budgets b
      JOIN emergency_reports er ON b.emergency_id = er.id
      JOIN disaster_types dt ON er.disaster_type_id = dt.id
      ORDER BY b.created_at DESC
    `);
    res.json({ data: rows });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/budgets/emergency/:emergencyId - Get budget for a specific emergency
router.get('/emergency/:emergencyId', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, er.location_description AS emergency_location,
        dt.name AS disaster_type, er.severity,
        (b.total_budget - b.spent) AS remaining,
        ROUND(CAST(b.spent AS FLOAT) / NULLIF(b.total_budget,0) * 100, 1) AS utilization_pct
      FROM budgets b
      JOIN emergency_reports er ON b.emergency_id = er.id
      JOIN disaster_types dt ON er.disaster_type_id = dt.id
      WHERE b.emergency_id = ?
    `, [parseInt(req.params.emergencyId)]);

    if (rows.length === 0) return res.status(404).json({ error: 'No budget found for this emergency.' });
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/budgets/summary - Overall financial summary across all budgets
router.get('/summary', authenticate, authorize('Administrator', 'Finance Officer'), async (req, res) => {
  try {
    const [summary] = await pool.query(`
      SELECT
        COUNT(*) AS total_budgets,
        SUM(total_budget) AS total_allocated,
        SUM(spent) AS total_spent,
        SUM(total_budget - spent) AS total_remaining,
        ROUND(CAST(SUM(spent) AS FLOAT) / NULLIF(SUM(total_budget),0) * 100, 1) AS overall_utilization_pct
      FROM budgets
    `);
    res.json({ data: summary[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/budgets - Create a budget for an emergency (ACID Transaction)
router.post('/',
  authenticate,
  authorize('Administrator', 'Finance Officer'),
  validate({
    emergency_id:  { required: true, type: 'number', min: 1 },
    total_budget:  { required: true, type: 'number', min: 0 },
  }),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { emergency_id, total_budget } = req.body;

      // Ensure emergency exists
      const [emergencies] = await conn.query('SELECT id FROM emergency_reports WHERE id = ?', [parseInt(emergency_id)]);
      if (emergencies.length === 0) {
        await conn.rollback(); conn.release();
        return res.status(404).json({ error: 'Emergency report not found.' });
      }

      // Check for duplicate budget
      const [existing] = await conn.query('SELECT id FROM budgets WHERE emergency_id = ?', [parseInt(emergency_id)]);
      if (existing.length > 0) {
        await conn.rollback(); conn.release();
        return res.status(409).json({ error: 'A budget already exists for this emergency. Use PUT to update it.' });
      }

      const [result] = await conn.query(
        'INSERT INTO budgets (emergency_id, total_budget, spent) VALUES (?, ?, 0)',
        [parseInt(emergency_id), parseFloat(total_budget)]
      );

      // Create approval request for large budgets (> 10,000)
      if (parseFloat(total_budget) > 10000) {
        await conn.query(
          `INSERT INTO approval_requests (request_type, reference_id, reference_table, requested_by, priority, description)
           VALUES (?,?,?,?,?,?)`,
          ['Budget Allocation', result.insertId, 'budgets', req.user.id, 'High',
           `Budget allocation of $${parseFloat(total_budget).toLocaleString()} for Emergency #${emergency_id}`]
        );
      }

      // Audit log
      await conn.query(
        'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES (?,?,?,?,?,?)',
        [req.user.id, 'CREATE_BUDGET', 'budgets', result.insertId,
         JSON.stringify({ emergency_id, total_budget }), req.ip]
      );

      await conn.commit();
      conn.release();
      res.status(201).json({ message: 'Budget created.', id: result.insertId });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.error('Create budget error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// PUT /api/budgets/:id - Update budget allocation or mark spending
router.put('/:id',
  authenticate,
  authorize('Administrator', 'Finance Officer'),
  auditLog('UPDATE_BUDGET', 'budgets'),
  validate({
    total_budget: { type: 'number', min: 0 },
  }),
  async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      const { total_budget, spent } = req.body;

      const updates = [];
      const params = [];
      if (total_budget !== undefined) { updates.push('total_budget = ?'); params.push(parseFloat(total_budget)); }
      if (spent !== undefined) { updates.push('spent = ?'); params.push(parseFloat(spent)); }

      if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });

      updates.push('updated_at = GETDATE()');
      params.push(budgetId);

      await pool.query(`UPDATE budgets SET ${updates.join(', ')} WHERE id = ?`, params);
      res.json({ message: 'Budget updated.', id: budgetId });
    } catch (error) {
      console.error('Update budget error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// DELETE /api/budgets/:id - Remove a budget (Admin only)
router.delete('/:id',
  authenticate,
  authorize('Administrator'),
  auditLog('DELETE_BUDGET', 'budgets'),
  async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      await pool.query('DELETE FROM budgets WHERE id = ?', [budgetId]);
      res.json({ message: 'Budget deleted.', id: budgetId });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
