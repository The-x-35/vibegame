const fs = require('fs');
const path = require('path');

const migrationName = process.argv[2];
if (!migrationName) {
  console.error('Please provide a migration name');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const fileName = `${timestamp}_${migrationName}.sql`;
const migrationsDir = path.join(__dirname, '..', 'migrations');

if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const filePath = path.join(migrationsDir, fileName);
fs.writeFileSync(filePath, '-- Add your SQL migration here\n');

console.log(`Created new migration: ${fileName}`); 