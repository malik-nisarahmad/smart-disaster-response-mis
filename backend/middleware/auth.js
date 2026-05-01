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

// Audit logging middleware
const auditLog = (action, tableName) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, action, tableName, data?.id || data?.data?.id || null, JSON.stringify(req.body || {}), req.ip]
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

module.exports = { authenticate, authorize, auditLog };
