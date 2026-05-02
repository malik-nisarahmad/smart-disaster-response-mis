/**
 * Migration: Set current_latitude/current_longitude for existing rescue teams
 * that were inserted without GPS coordinates.
 * 
 * Run once: node database/migrate_team_coords.js
 */
require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'disaster_response_mis',
  options: { encrypt: false, trustServerCertificate: true },
  authentication: process.env.DB_USER
    ? { type: 'default', options: { userName: process.env.DB_USER, password: process.env.DB_PASSWORD } }
    : { type: 'ntlm', options: { domain: '', userName: '', password: '' } },
};

// Real Pakistan coordinates for seeded teams (in case they are NULL)
const TEAM_COORDS = [
  { id: 1, lat: 33.6844, lon: 73.0479 }, // Alpha Medical Unit – Islamabad G-10
  { id: 2, lat: 31.5204, lon: 74.3587 }, // Bravo Fire Squad – Lahore Mall Road
  { id: 3, lat: 33.7294, lon: 73.0931 }, // Charlie Rescue Team – Blue Area ISB
  { id: 4, lat: 34.0151, lon: 71.5249 }, // Delta Search Unit – Peshawar
  { id: 5, lat: 24.8607, lon: 67.0011 }, // Echo Medical – Karachi Clifton
  { id: 6, lat: 33.6000, lon: 73.0500 }, // Foxtrot Hazmat – Islamabad
  { id: 7, lat: 31.5000, lon: 74.3500 }, // Golf Rescue – Lahore
  { id: 8, lat: 25.3960, lon: 68.3578 }, // Hotel Fire – Hyderabad
];

async function migrate() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('Connected to MSSQL');

    for (const t of TEAM_COORDS) {
      const result = await pool.request()
        .input('lat', sql.Decimal(10, 7), t.lat)
        .input('lon', sql.Decimal(10, 7), t.lon)
        .input('id', sql.Int, t.id)
        .query(`
          UPDATE rescue_teams
          SET current_latitude = @lat, current_longitude = @lon
          WHERE id = @id AND (current_latitude IS NULL OR current_longitude IS NULL)
        `);
      if (result.rowsAffected[0] > 0) {
        console.log(`  Updated team #${t.id} (${t.lat}, ${t.lon})`);
      } else {
        console.log(`  Team #${t.id} already has coordinates — skipped`);
      }
    }

    console.log('\nMigration complete. All rescue teams now have GPS coordinates.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    if (pool) await pool.close();
  }
}

migrate();
