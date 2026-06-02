require('dotenv').config();
const { query } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const sqlPath = path.join(__dirname, '../fix_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await query(sql);
    console.log("Missing tables created successfully");
  } catch(e) {
    console.error("Error creating tables:", e.message);
  }
  process.exit(0);
}
run();
