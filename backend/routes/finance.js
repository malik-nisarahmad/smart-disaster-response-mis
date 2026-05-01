const express = require('express');
const pool = require('../database/connection');
const { authenticate, authorize, auditLog } = require('../middleware/auth');

const router = express.Router();

// GET /api/finance/transactions
router.get('/transactions', authenticate, authorize('Administrator', 'Finance Officer'), async (req, res) => {
  try {
    const { type, status } = req.query;
    let sql = 'SELECT * FROM vw_finance_officer_data WHERE 1=1';
    const params = [];
    if (type) { sql += ' AND transaction_type = ?'; params.push(type); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY transaction_date DESC OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY';
    const [rows] = await pool.query(sql, params);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/finance/transactions - ACID Transaction
router.post('/transactions', authenticate, authorize('Administrator', 'Finance Officer'),
  auditLog('CREATE_TRANSACTION', 'financial_transactions'),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { transaction_type, category, amount, donor_name, emergency_id, description } = req.body;

      if (!transaction_type || !amount) {
        await conn.rollback(); conn.release();
        return res.status(400).json({ error: 'Type and amount are required.' });
      }

      const txStatus = transaction_type === 'Donation' ? 'Completed' : 'Pending';

      const [result] = await conn.query(
        'INSERT INTO financial_transactions (transaction_type, category, amount, donor_name, emergency_id, description, recorded_by, status) VALUES (?,?,?,?,?,?,?,?)',
        [transaction_type, category || null, parseFloat(amount), donor_name || null,
         emergency_id ? parseInt(emergency_id) : null, description || null, req.user.id, txStatus]
      );

      // If expense or procurement, auto-create approval request
      if (transaction_type === 'Expense' || transaction_type === 'Procurement') {
        await conn.query(
          'INSERT INTO approval_requests (request_type, reference_id, reference_table, requested_by, priority, description) VALUES (?,?,?,?,?,?)',
          ['Financial Approval', result.insertId, 'financial_transactions', req.user.id, 'Medium',
           `${transaction_type}: $${amount} - ${description || category || ''}`]
        );
      }

      await conn.commit();
      conn.release();
      res.status(201).json({ message: 'Transaction recorded.', id: result.insertId });
    } catch (error) {
      await conn.rollback();
      conn.release();
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// GET /api/finance/summary
router.get('/summary', authenticate, authorize('Administrator', 'Finance Officer'), async (req, res) => {
  try {
    const [summary] = await pool.query('SELECT * FROM vw_financial_summary');
    const [totals] = await pool.query(`
      SELECT
        ISNULL(SUM(CASE WHEN transaction_type='Donation' AND status IN ('Approved','Completed') THEN amount ELSE 0 END),0) AS total_donations,
        ISNULL(SUM(CASE WHEN transaction_type='Expense' AND status IN ('Approved','Completed') THEN amount ELSE 0 END),0) AS total_expenses,
        ISNULL(SUM(CASE WHEN transaction_type='Procurement' AND status IN ('Approved','Completed') THEN amount ELSE 0 END),0) AS total_procurement,
        ISNULL(SUM(CASE WHEN transaction_type='Distribution' AND status IN ('Approved','Completed') THEN amount ELSE 0 END),0) AS total_distribution
      FROM financial_transactions
    `);
    res.json({ summary, totals: totals[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
