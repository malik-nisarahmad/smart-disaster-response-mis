const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace SELECT ... FROM tableName WHERE id = ? FOR UPDATE
  // with SELECT ... FROM tableName WITH (UPDLOCK, ROWLOCK) WHERE id = ?
  const forUpdateRegex = /SELECT (\*|.*?) FROM (\w+) WHERE (.+?) FOR UPDATE/g;
  content = content.replace(forUpdateRegex, 'SELECT $1 FROM $2 WITH (UPDLOCK, ROWLOCK) WHERE $3');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated FOR UPDATE syntax in ${file}`);
  }
});
console.log('All FOR UPDATE syntax replaced with MSSQL syntax.');
