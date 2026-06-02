require('dotenv').config();
const { query } = require('./src/config/database');
const fs = require('fs');

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node run_any_sql.js <filename>");
    process.exit(1);
  }
  try {
    const sql = fs.readFileSync(file, 'utf8');
    const res = await query(sql);
    console.log(`Executed ${file} successfully:`, JSON.stringify(res.rows, null, 2));
  } catch(e) {
    console.error("Error executing SQL:", e.message);
  }
  process.exit(0);
}
run();
