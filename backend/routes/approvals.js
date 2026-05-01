const express = require('express');
const pool = require('../database/connection');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/approvals
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT ar.*, u.full_name AS requested_by_name, u2.full_name AS resolved_by_name
      FROM approval_requests ar
      JOIN users u ON ar.requested_by = u.id
      LEFT JOIN users u2 ON ar.resolved_by = u2.id WHERE 1=1`;
    const params = [];
    if (status) { sql += ' AND ar.status = ?'; params.push(status); }
    sql += ` ORDER BY CASE ar.priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 ELSE 5 END, ar.requested_at DESC`;
    const [rows] = await pool.query(sql, params);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/approvals/history/:id
router.get('/history/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ah.*, u.full_name AS action_by_name
       FROM approval_history ah JOIN users u ON ah.action_by = u.id
       WHERE ah.approval_id = ? ORDER BY ah.action_at DESC`,
      [parseInt(req.params.id)]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/approvals/:id - Approve or reject (ACID Transaction)
router.patch('/:id', authenticate, authorize('Administrator'),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { action, comment } = req.body;
      const approvalId = parseInt(req.params.id);

      if (!['Approved', 'Rejected'].includes(action)) {
        await conn.rollback(); conn.release();
        return res.status(400).json({ error: 'Invalid action. Use Approved or Rejected.' });
      }

      // Lock approval row
      const [request] = await conn.query('SELECT * FROM approval_requests WITH (UPDLOCK, ROWLOCK) WHERE id = ?', [approvalId]);
      if (request.length === 0) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Request not found.' }); }
      if (request[0].status !== 'Pending') { await conn.rollback(); conn.release(); return res.status(400).json({ error: 'Request already processed.' }); }

      // Update approval
      await conn.query(
        'UPDATE approval_requests SET status = ?, resolved_at = GETDATE(), resolved_by = ? WHERE id = ?',
        [action, req.user.id, approvalId]);

      // Record in history
      await conn.query(
        'INSERT INTO approval_history (approval_id, action, action_by, comment) VALUES (?,?,?,?)',
        [approvalId, action, req.user.id, comment || null]);

      // If approved, cascade action to referenced table
      if (action === 'Approved') {
        const ref = request[0];
        if (ref.reference_table === 'resource_allocations') {
          await conn.query(`UPDATE resource_allocations SET status = 'Dispatched' WHERE id = ?`, [ref.reference_id]);
        } else if (ref.reference_table === 'financial_transactions') {
          await conn.query(`UPDATE financial_transactions SET status = 'Approved' WHERE id = ?`, [ref.reference_id]);
        }
      }

      await conn.commit();
      conn.release();

      // Audit
      await pool.query(
        'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES (?,?,?,?,?,?)',
        [req.user.id, `APPROVAL_${action.toUpperCase()}`, 'approval_requests', approvalId,
        JSON.stringify({ action, comment }), req.ip]);

      res.json({ message: `Request ${action.toLowerCase()}.`, id: approvalId });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.error('Approval error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
