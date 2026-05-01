const express = require('express');
const pool = require('../database/connection');
const { authenticate, authorize, auditLog } = require('../middleware/auth');

const router = express.Router();

// GET /api/resources/warehouses
router.get('/warehouses', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT w.*, u.full_name as manager_name FROM warehouses w LEFT JOIN users u ON w.manager_id = u.id ORDER BY w.name'
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/resources/alerts - Low stock alerts
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM vw_resource_inventory WHERE stock_status = 'LOW STOCK' ORDER BY quantity ASC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/resources/allocations
router.get('/allocations', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ra.*, r.name AS resource_name, r.unit, r.category,
       w.name AS warehouse_name, u.full_name AS allocated_by_name
       FROM resource_allocations ra
       JOIN resources r ON ra.resource_id = r.id
       JOIN warehouses w ON r.warehouse_id = w.id
       JOIN users u ON ra.allocated_by = u.id
       ORDER BY ra.allocated_at DESC OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/resources - List resources
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, low_stock } = req.query;
    let sql = 'SELECT * FROM vw_resource_inventory WHERE 1=1';
    const params = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (low_stock === 'true') { sql += ` AND stock_status = 'LOW STOCK'`; }
    sql += ' ORDER BY stock_status DESC, category, name';
    const [rows] = await pool.query(sql, params);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/resources
router.post('/', authenticate, authorize('Administrator', 'Warehouse Manager'),
  auditLog('CREATE_RESOURCE', 'resources'),
  async (req, res) => {
    try {
      const { name, category, warehouse_id, quantity, unit, threshold_min } = req.body;
      const [result] = await pool.query(
        'INSERT INTO resources (name, category, warehouse_id, quantity, unit, threshold_min) VALUES (?,?,?,?,?,?)',
        [name, category, parseInt(warehouse_id), parseInt(quantity) || 0, unit || 'units', parseInt(threshold_min) || 50]
      );
      res.status(201).json({ message: 'Resource created.', id: result.insertId });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// PUT /api/resources/:id
router.put('/:id', authenticate, authorize('Administrator', 'Warehouse Manager'),
  auditLog('UPDATE_RESOURCE', 'resources'),
  async (req, res) => {
    try {
      const { quantity, threshold_min } = req.body;
      await pool.query(
        'UPDATE resources SET quantity = ?, threshold_min = ?, last_restocked = GETDATE() WHERE id = ?',
        [parseInt(quantity), parseInt(threshold_min), parseInt(req.params.id)]
      );
      res.json({ message: 'Resource updated.', id: parseInt(req.params.id) });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// POST /api/resources/allocate - ACID Transaction
router.post('/allocate', authenticate, authorize('Administrator', 'Warehouse Manager'),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { resource_id, emergency_id, quantity_allocated, notes } = req.body;

      // Lock resource row
      const [resource] = await conn.query('SELECT * FROM resources WITH (UPDLOCK, ROWLOCK) WHERE id = ?', [parseInt(resource_id)]);
      if (resource.length === 0) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Resource not found.' }); }
      if (resource[0].quantity < parseInt(quantity_allocated)) {
        await conn.rollback(); conn.release();
        return res.status(400).json({ error: `Insufficient stock. Available: ${resource[0].quantity}` });
      }

      // Create allocation record
      const [result] = await conn.query(
        'INSERT INTO resource_allocations (resource_id, emergency_id, quantity_allocated, allocated_by, notes) VALUES (?,?,?,?,?)',
        [parseInt(resource_id), emergency_id ? parseInt(emergency_id) : null, parseInt(quantity_allocated), req.user.id, notes || null]);

      // Create approval request
      await conn.query(
        `INSERT INTO approval_requests (request_type, reference_id, reference_table, requested_by, priority, description) VALUES (?,?,?,?,?,?)`,
        ['Resource Distribution', result.insertId, 'resource_allocations', req.user.id, 'High',
         `Allocate ${quantity_allocated} ${resource[0].unit} of ${resource[0].name}`]);

      await conn.commit();
      conn.release();
      res.status(201).json({ message: 'Resource allocation request created.', id: result.insertId });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.error('Allocate error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
