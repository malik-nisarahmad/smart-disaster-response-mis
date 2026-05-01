require('dotenv').config();
const sql = require('mssql/msnodesqlv8');

const config = {
  server: process.env.DB_HOST || 'localhost\\SQLEXPRESS',
  database: process.env.DB_NAME || 'disaster_response_mis',
  driver: 'ODBC Driver 17 for SQL Server',
  options: {
    trustedConnection: true,
    encrypt: false,
    trustServerCertificate: true,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Database connected successfully (MSSQL)');
    return pool;
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
  });

async function executeQuery(request, queryStr, params = []) {
  params.forEach((param, index) => {
    if (param === null || param === undefined) {
      request.input(`param${index}`, sql.NVarChar, '');
    } else if (typeof param === 'number') {
      if (Number.isInteger(param)) request.input(`param${index}`, sql.Int, param);
      else request.input(`param${index}`, sql.Float, param);
    } else if (typeof param === 'boolean') {
      request.input(`param${index}`, sql.Bit, param);
    } else if (param instanceof Date) {
      request.input(`param${index}`, sql.DateTime, param);
    } else {
      request.input(`param${index}`, sql.NVarChar, param.toString());
    }
  });
  
  let mssqlQuery = queryStr;
  let paramCount = 0;
  mssqlQuery = mssqlQuery.replace(/\?/g, () => `@param${paramCount++}`);
  
  if (mssqlQuery.trim().toUpperCase().startsWith('INSERT') && !mssqlQuery.toUpperCase().includes('SCOPE_IDENTITY')) {
     mssqlQuery += '; SELECT SCOPE_IDENTITY() AS insertId;';
  }
  
  const result = await request.query(mssqlQuery);
  
  if (mssqlQuery.trim().toUpperCase().startsWith('INSERT') || mssqlQuery.trim().toUpperCase().startsWith('UPDATE') || mssqlQuery.trim().toUpperCase().startsWith('DELETE')) {
     let insertId;
     if (result.recordsets && result.recordsets.length > 0 && result.recordsets[result.recordsets.length - 1].length > 0) {
        insertId = result.recordsets[result.recordsets.length - 1][0].insertId;
     } else if (result.recordset && result.recordset.length > 0 && result.recordset[0].insertId !== undefined) {
        insertId = result.recordset[0].insertId;
     }
     return [{ insertId: insertId, affectedRows: result.rowsAffected ? result.rowsAffected[0] : 0 }];
  }
  
  if (result.recordset) {
     return [result.recordset, result.recordsets];
  }
  else {
     return [{ affectedRows: result.rowsAffected ? result.rowsAffected[0] : 0 }];
  }
}

module.exports = {
  query: async (queryStr, params = []) => {
    try {
      const pool = await poolPromise;
      if (!pool) throw new Error('Database pool failed to initialize.');
      const request = pool.request();
      return await executeQuery(request, queryStr, params);
    } catch (err) {
      throw err;
    }
  },
  getConnection: async () => {
    const pool = await poolPromise;
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
