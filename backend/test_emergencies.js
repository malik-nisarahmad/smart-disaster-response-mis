const db = require('./database/connection');

async function test() {
  try {
    const [r] = await db.query(`SELECT er.*, dt.name AS disaster_type_name, u.full_name AS operator_name FROM emergency_reports er JOIN disaster_types dt ON er.disaster_type_id = dt.id LEFT JOIN users u ON er.assigned_operator_id = u.id WHERE 1=1 ORDER BY CASE er.severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Moderate' THEN 3 WHEN 'Low' THEN 4 ELSE 5 END, er.reported_at DESC OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY`);
    console.log(r);
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
test();
