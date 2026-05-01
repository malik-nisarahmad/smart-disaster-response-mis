/**
 * Database initialization script for MySQL
 * Run: node database/init.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  // Connect without specific database first
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    console.log('Connected to MySQL server.');

    // Create database
    const dbName = process.env.DB_NAME || 'disaster_response_mis';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    console.log(`Database "${dbName}" ready.`);

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by DELIMITER to handle triggers properly
    const sections = schema.split(/DELIMITER\s+\/\//i);

    // Execute the first section (tables, before any triggers)
    const firstSection = sections[0];
    const statements = firstSection.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;
      try {
        await connection.query(trimmed);
        if (trimmed.includes('CREATE TABLE')) {
          const tableName = trimmed.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1];
          if (tableName) console.log(`  Created table: ${tableName}`);
        } else if (trimmed.includes('CREATE OR REPLACE VIEW')) {
          const viewName = trimmed.match(/CREATE OR REPLACE VIEW (\w+)/i)?.[1];
          if (viewName) console.log(`  Created view: ${viewName}`);
        } else if (trimmed.includes('CREATE INDEX')) {
          const indexName = trimmed.match(/CREATE INDEX (\w+)/i)?.[1];
          if (indexName) console.log(`  Created index: ${indexName}`);
        }
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME') {
          // Ignore "already exists" errors
        } else {
          console.error(`  SQL Error: ${err.message}`);
        }
      }
    }

    // Process trigger sections
    for (let i = 1; i < sections.length; i++) {
      const parts = sections[i].split(/DELIMITER\s+;/i);
      const triggerBody = parts[0];
      const afterDelimiter = parts[1] || '';

      // Execute trigger (ends with //)
      const triggerSQL = triggerBody.replace(/\/\/\s*$/, '').trim();
      if (triggerSQL) {
        try {
          // Drop trigger if exists first
          const triggerName = triggerSQL.match(/CREATE TRIGGER (\w+)/i)?.[1];
          if (triggerName) {
            await connection.query(`DROP TRIGGER IF EXISTS ${triggerName}`);
            await connection.query(triggerSQL);
            console.log(`  Created trigger: ${triggerName}`);
          }
        } catch (err) {
          console.error(`  Trigger error: ${err.message}`);
        }
      }

      // Execute remaining statements after DELIMITER ;
      if (afterDelimiter.trim()) {
        const stmts = afterDelimiter.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
        for (const stmt of stmts) {
          const trimmed = stmt.trim();
          if (!trimmed || trimmed.startsWith('--')) continue;
          try {
            await connection.query(trimmed);
            if (trimmed.includes('CREATE OR REPLACE VIEW')) {
              const name = trimmed.match(/CREATE OR REPLACE VIEW (\w+)/i)?.[1];
              if (name) console.log(`  Created view: ${name}`);
            } else if (trimmed.includes('CREATE INDEX')) {
              const name = trimmed.match(/CREATE INDEX (\w+)/i)?.[1];
              if (name) console.log(`  Created index: ${name}`);
            }
          } catch (err) {
            if (err.code !== 'ER_DUP_KEYNAME') {
              console.error(`  SQL Error: ${err.message}`);
            }
          }
        }
      }
    }

    console.log('\nDatabase initialized successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }

  process.exit(0);
}

initDatabase();
