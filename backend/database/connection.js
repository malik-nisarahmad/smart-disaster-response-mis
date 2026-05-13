require('dotenv').config();
const { Pool } = require('pg');

// Vercel Postgres provides POSTGRES_URL, or use a local fallback
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/disaster_response_mis';

const pool = new Pool({
  connectionString,
  // Use SSL for Vercel production, disable for local development
  ssl: process.env.NODE_ENV === 'production' || connectionString.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error (PostgreSQL):', err.message);
  } else {
    console.log('Database connected successfully (PostgreSQL)');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

/**
 * Executes a SQL query with parameters.
 * Automatically translates `?` placeholders to PostgreSQL `$1, $2` format.
 */
async function executeQuery(queryStr, params = []) {
  try {
    let pgQuery = queryStr;
    let paramCount = 1;
    
    // Replace ? with $1, $2, etc.
    pgQuery = pgQuery.replace(/\?/g, () => `$${paramCount++}`);

    // If it's an INSERT, append RETURNING id to get the insertId (equivalent to SCOPE_IDENTITY)
    if (pgQuery.trim().toUpperCase().startsWith('INSERT') && !pgQuery.toUpperCase().includes('RETURNING')) {
      pgQuery += ' RETURNING id AS "insertId"';
    }

    const result = await pool.query(pgQuery, params);

    // Format response to match the old MSSQL behavior
    if (pgQuery.trim().toUpperCase().startsWith('INSERT') || 
        pgQuery.trim().toUpperCase().startsWith('UPDATE') || 
        pgQuery.trim().toUpperCase().startsWith('DELETE')) {
      
      let insertId;
      if (result.rows && result.rows.length > 0 && result.rows[0].insertId !== undefined) {
        insertId = result.rows[0].insertId;
      }
      return [{ insertId: insertId, affectedRows: result.rowCount || 0 }];
    }

    // For SELECT queries
    if (result.rows) {
      return [result.rows, [result.rows]];
    } else {
      return [{ affectedRows: result.rowCount || 0 }];
    }

  } catch (error) {
    console.error('Database Query Error:', error.message);
    // Add context to error
    if (error.code === '23505') {
      throw { message: 'A record with this unique value already exists.', status: 409 };
    }
    throw {
      message: 'Database query failed',
      error: error.message,
      status: 500
    };
  }
}

module.exports = {
  query: executeQuery,
  getConnection: async () => {
    if (!pool) throw new Error('Database pool failed to initialize.');
    const transaction = new sql.Transaction(pool);
    return {
      beginTransaction: async () => {
        await transaction.begin();
      },
      commit: async () => {
        await transaction.commit();
      },
      rollback: async () => {
        await transaction.rollback();
      },
      release: () => {
        // Nothing to do for MSSQL
      },
      query: async (queryStr, params = []) => {
        const request = new sql.Request(transaction);
        return await executeQuery(request, queryStr, params);
      }
    };
  }
};