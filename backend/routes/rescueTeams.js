const express = require('express');
const pool = require('../database/connection');
const { authenticate, authorize, auditLog } = require('../middleware/auth');

const router = express.Router();

// ─── Haversine distance formula — returns distance in km ─────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/rescue-teams
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type } = req.query;
    let sql = 'SELECT * FROM vw_rescue_team_status WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (type)   { sql += ' AND team_type = ?'; params.push(type); }
    sql += ` ORDER BY CASE status WHEN 'Available' THEN 1 WHEN 'Assigned' THEN 2 WHEN 'Busy' THEN 3 WHEN 'Completed' THEN 4 WHEN 'Off Duty' THEN 5 ELSE 6 END`;
    const [rows] = await pool.query(sql, params);
    res.json({ data: rows });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/rescue-teams/auto-assign — Proximity-based auto-assignment
// Finds the nearest available team to the emergency location using Haversine formula
router.post('/auto-assign', authenticate, authorize('Administrator', 'Field Officer', 'Emergency Operator'),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { emergency_id, team_type, notes } = req.body;

      if (!emergency_id) {
        await conn.rollback(); conn.release();
        return res.status(400).json({ error: 'emergency_id is required.' });
      }

      // Get emergency location
      const [emergencies] = await conn.query(
        'SELECT id, latitude, longitude, location_description, severity FROM emergency_reports WHERE id = ?',
        [parseInt(emergency_id)]
      );
      if (emergencies.length === 0) {
        await conn.rollback(); conn.release();
        return res.status(404).json({ error: 'Emergency not found.' });
      }
      const emergency = emergencies[0];

      if (!emergency.latitude || !emergency.longitude) {
        await conn.rollback(); conn.release();
        return res.status(400).json({ error: 'Emergency has no GPS coordinates. Cannot auto-assign by proximity.' });
      }

      // Get all available teams with their current GPS coordinates
      let teamSql = `SELECT rt.id, rt.team_name, rt.team_type, rt.leader_name, rt.phone,
                       rt.current_latitude, rt.current_longitude, rt.status
                     FROM rescue_teams rt
                     WHERE rt.status = 'Available'`;
      const teamParams = [];
      if (team_type) { teamSql += ' AND rt.team_type = ?'; teamParams.push(team_type); }

      const [teams] = await conn.query(teamSql, teamParams);

      if (!teams || teams.length === 0) {
        await conn.rollback(); conn.release();
        return res.status(503).json({ error: 'No available rescue teams found.' });
      }

      // Calculate Haversine distance from each team's current position to the emergency
      const teamsWithDistance = teams.map(team => ({
        ...team,
        distance_km: haversineKm(
          parseFloat(team.current_latitude),
          parseFloat(team.current_longitude),
          parseFloat(emergency.latitude),
          parseFloat(emergency.longitude)
        )
      }));

      // Sort by distance — nearest first
      teamsWithDistance.sort((a, b) => a.distance_km - b.distance_km);
      const nearest = teamsWithDistance[0];

      // Assign the nearest team (ACID)
      await conn.query(
        'INSERT INTO team_assignments (team_id, emergency_id, assigned_by, notes) VALUES (?,?,?,?)',
        [nearest.id, parseInt(emergency_id), req.user.id,
         notes || `Auto-assigned (${nearest.distance_km === Infinity ? 'no GPS' : nearest.distance_km.toFixed(1) + 'km away'})`]
      );

      // Update emergency status
      await conn.query(
        `UPDATE emergency_reports SET status = 'In Progress', assigned_operator_id = ? WHERE id = ? AND status IN ('Pending','Acknowledged')`,
        [req.user.id, parseInt(emergency_id)]
      );

      // Audit
      await conn.query(
        'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES (?,?,?,?,?,?)',
        [req.user.id, 'AUTO_ASSIGN_TEAM', 'team_assignments', nearest.id,
         JSON.stringify({ team_id: nearest.id, team_name: nearest.team_name, emergency_id, distance_km: nearest.distance_km.toFixed(2) }), req.ip]
      );

      await conn.commit();
      conn.release();

      // Return sorted list so caller can see all candidates
      res.json({
        message: `Team "${nearest.team_name}" auto-assigned (${nearest.distance_km === Infinity ? 'no GPS' : nearest.distance_km.toFixed(1) + 'km away'}).`,
        assigned_team: {
          id: nearest.id,
          name: nearest.team_name,
          type: nearest.team_type,
          leader: nearest.leader_name,
          distance_km: nearest.distance_km === Infinity ? null : parseFloat(nearest.distance_km.toFixed(2))
        },
        all_candidates: teamsWithDistance.slice(0, 5).map(t => ({
          id: t.id, name: t.team_name, type: t.team_type,
          distance_km: t.distance_km === Infinity ? null : parseFloat(t.distance_km.toFixed(2))
        }))
      });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.error('Auto-assign team error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// POST /api/rescue-teams — Create team
router.post('/', authenticate, authorize('Administrator', 'Field Officer'),
  auditLog('CREATE_TEAM', 'rescue_teams'),
  async (req, res) => {
    try {
      const { team_name, team_type, leader_name, member_count, phone, current_latitude, current_longitude } = req.body;
      const [result] = await pool.query(
        'INSERT INTO rescue_teams (team_name, team_type, leader_name, member_count, phone, current_latitude, current_longitude) VALUES (?,?,?,?,?,?,?)',
        [team_name, team_type, leader_name, member_count || 5, phone || null,
         current_latitude ? parseFloat(current_latitude) : null,
         current_longitude ? parseFloat(current_longitude) : null]
      );
      res.status(201).json({ message: 'Team created.', id: result.insertId });
    } catch (error) {
      console.error('Create team error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// POST /api/rescue-teams/:id/assign — Manual assign (ACID)
router.post('/:id/assign', authenticate, authorize('Administrator', 'Field Officer', 'Emergency Operator'),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { emergency_id, notes } = req.body;
      const teamId = parseInt(req.params.id);

      const [team] = await conn.query('SELECT * FROM rescue_teams WITH (UPDLOCK, ROWLOCK) WHERE id = ?', [teamId]);
      if (team.length === 0) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Team not found.' }); }
      if (team[0].status !== 'Available') { await conn.rollback(); conn.release(); return res.status(400).json({ error: 'Team is not available.' }); }

      await conn.query(
        'INSERT INTO team_assignments (team_id, emergency_id, assigned_by, notes) VALUES (?,?,?,?)',
        [teamId, parseInt(emergency_id), req.user.id, notes || null]
      );

      await conn.query(
        `UPDATE emergency_reports SET status = 'In Progress', assigned_operator_id = ? WHERE id = ? AND status IN ('Pending','Acknowledged')`,
        [req.user.id, parseInt(emergency_id)]
      );

      await conn.commit();
      conn.release();

      await pool.query(
        'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES (?,?,?,?,?,?)',
        [req.user.id, 'ASSIGN_TEAM', 'team_assignments', teamId,
         JSON.stringify({ team_id: teamId, emergency_id }), req.ip]
      );

      // Fetch emergency info to confirm assignment in response
      const [emergency] = await pool.query(
        'SELECT id, status, location_description, severity FROM emergency_reports WHERE id = ?',
        [parseInt(emergency_id)]
      );

      res.json({
        message: `Team "${team[0].team_name}" assigned to Emergency #${emergency_id}.`,
        team: { id: teamId, name: team[0].team_name },
        emergency: emergency.length > 0 ? emergency[0] : null
      });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.error('Assign team error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// PATCH /api/rescue-teams/:id/location — Update team's current GPS position
router.patch('/:id/location', authenticate, authorize('Administrator', 'Field Officer', 'Emergency Operator'),
  async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const { current_latitude, current_longitude, location_name } = req.body;
      if (current_latitude == null || current_longitude == null) {
        return res.status(400).json({ error: 'current_latitude and current_longitude are required.' });
      }
      await pool.query(
        'UPDATE rescue_teams SET current_latitude = ?, current_longitude = ?, updated_at = GETDATE() WHERE id = ?',
        [parseFloat(current_latitude), parseFloat(current_longitude), teamId]
      );
      // Log location update in activity log
      await pool.query(
        'INSERT INTO team_activity_log (team_id, activity_type, description) VALUES (?,?,?)',
        [teamId, 'LOCATION_UPDATE',
         `Location updated to (${parseFloat(current_latitude).toFixed(5)}, ${parseFloat(current_longitude).toFixed(5)})${location_name ? ' — ' + location_name : ''}`]
      );
      res.json({ message: 'Location updated.', id: teamId, current_latitude, current_longitude });
    } catch (error) {
      console.error('Update location error:', error);
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
          `UPDATE team_assignments SET status = 'Completed', completed_at = GETDATE() WHERE team_id = ? AND status != 'Completed'`,
          [teamId]
        );
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
      [parseInt(req.params.id)]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
