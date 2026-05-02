const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.query(
      'SELECT u.id, u.full_name, u.email, u.is_active, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user.' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Audit logging middleware — captures old values for UPDATE operations
const auditLog = (action, tableName) => {
  return async (req, res, next) => {
    // Capture old values before the operation for PUT/PATCH (UPDATE) requests
    let oldValues = null;
    if ((req.method === 'PUT' || req.method === 'PATCH') && req.params.id && tableName) {
      try {
        const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [parseInt(req.params.id)]);
        if (rows && rows.length > 0) {
          const { password_hash, ...safeRow } = rows[0];
          oldValues = JSON.stringify(safeRow);
        }
      } catch (err) {
        // Non-fatal: continue even if old-value capture fails
        console.error('Audit old-value capture error:', err.message);
      }
    }

    const originalJson = res.json.bind(res);
    res.json = async function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          const recordId = data?.id || data?.data?.id || (req.params.id ? parseInt(req.params.id) : null);
          await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, action, tableName, recordId, oldValues, JSON.stringify(req.body || {}), req.ip]
          );
        } catch (err) {
          console.error('Audit log error:', err.message);
        }
      }
      return originalJson(data);
    };
    next();
  };
};

// Input validation helper
const validate = (fields) => {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rules] of Object.entries(fields)) {
      const val = req.body[field];
      if (rules.required && (val === undefined || val === null || val === '')) {
        errors.push(`'${field}' is required.`);
        continue;
      }
      if (val !== undefined && val !== null && val !== '') {
        if (rules.type === 'number' && isNaN(Number(val))) errors.push(`'${field}' must be a number.`);
        if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) errors.push(`'${field}' must be a valid email.`);
        if (rules.min !== undefined && Number(val) < rules.min) errors.push(`'${field}' must be at least ${rules.min}.`);
        if (rules.max !== undefined && Number(val) > rules.max) errors.push(`'${field}' must not exceed ${rules.max}.`);
        if (rules.maxLength !== undefined && String(val).length > rules.maxLength) errors.push(`'${field}' must not exceed ${rules.maxLength} characters.`);
        if (rules.enum && !rules.enum.includes(val)) errors.push(`'${field}' must be one of: ${rules.enum.join(', ')}.`);
      }
    }
    if (errors.length > 0) return res.status(400).json({ error: 'Validation failed.', details: errors });
    next();
  };
};

module.exports = { authenticate, authorize, auditLog, validate };
