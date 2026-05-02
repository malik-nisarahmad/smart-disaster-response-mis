const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database/connection');
const { authenticate, validate } = require('../middleware/auth');

const router = express.Router();

// --- Rate Limiter (in-memory, no extra packages needed) ---
// Tracks: ip -> { count, firstRequestAt }
const loginAttempts = new Map();
const RATE_LIMIT = 5;          // max attempts
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const rateLimitLogin = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (entry) {
    // Reset window if expired
    if (now - entry.firstRequestAt > RATE_WINDOW_MS) {
      loginAttempts.set(ip, { count: 1, firstRequestAt: now });
      return next();
    }
    if (entry.count >= RATE_LIMIT) {
      const retryAfter = Math.ceil((RATE_WINDOW_MS - (now - entry.firstRequestAt)) / 1000);
      res.set('Retry-After', retryAfter);
      return res.status(429).json({
        error: `Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minute(s).`
      });
    }
    entry.count++;
  } else {
    loginAttempts.set(ip, { count: 1, firstRequestAt: now });
  }
  next();
};

// Clear a successful login from rate limiter
const clearRateLimit = (ip) => loginAttempts.delete(ip);

// POST /api/auth/signup
router.post('/signup',
  validate({
    full_name: { required: true, maxLength: 100 },
    email:     { required: true, type: 'email', maxLength: 150 },
    password:  { required: true, maxLength: 128 },
  }),
  async (req, res) => {
  try {
    const { full_name, email, password, phone, role_id } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const roleId = role_id || 2;

    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, phone, role_id) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, password_hash, phone || null, roleId]
    );

    const token = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    const [roles] = await pool.query('SELECT name FROM roles WHERE id = ?', [roleId]);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: result.insertId, full_name, email, role: roles[0]?.name || 'Emergency Operator' }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
router.post('/login',
  rateLimitLogin,
  validate({
    email:    { required: true, type: 'email' },
    password: { required: true },
  }),
  async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    const [users] = await pool.query(
      'SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Clear rate-limit counter on successful login
    clearRateLimit(ip);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    // Audit log the login
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, table_name, ip_address) VALUES (?, ?, ?, ?)',
      [user.id, 'LOGIN', 'users', req.ip]
    );

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT u.id, u.full_name, u.email, u.phone, u.is_active, u.created_at, r.name as role, r.id as role_id FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [req.user.id]
    );
    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/roles
router.get('/roles', async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles ORDER BY id');
    res.json({ roles });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/auth/users/:id - Admin: update user role or active status
router.patch('/users/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Administrator access required.' });
    }
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) return res.status(400).json({ error: 'Cannot modify your own account.' });

    const { role_id, is_active } = req.body;
    const updates = [];
    const params = [];

    if (role_id !== undefined) {
      // Validate role exists
      const [roles] = await pool.query('SELECT id FROM roles WHERE id = ?', [parseInt(role_id)]);
      if (roles.length === 0) return res.status(400).json({ error: 'Invalid role_id.' });
      updates.push('role_id = ?');
      params.push(parseInt(role_id));
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });

    params.push(userId);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    // Audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES (?,?,?,?,?,?)',
      [req.user.id, 'ADMIN_UPDATE_USER', 'users', userId, JSON.stringify(req.body), req.ip]
    );

    res.json({ message: 'User updated.', id: userId });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/switch-role (For testing purposes only)
router.post('/switch-role', authenticate, async (req, res) => {
  try {
    const { role } = req.body;
    
    // Find role_id for the given role name
    const [roleResult] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
    if (roleResult.length === 0) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    
    const roleId = roleResult[0].id;

    // Update user's role in the database
    await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, req.user.id]);

    // Fetch updated user to generate new token
    const [users] = await pool.query(
      'SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [req.user.id]
    );
    const updatedUser = users[0];

    // Generate new token
    const token = jwt.sign({ userId: updatedUser.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    res.json({
      message: 'Role switched successfully.',
      token,
      user: { id: updatedUser.id, full_name: updatedUser.full_name, email: updatedUser.email, role: updatedUser.role, phone: updatedUser.phone }
    });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
