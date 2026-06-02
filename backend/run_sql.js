require('dotenv').config();
const { query } = require('./src/config/database');
const fs = require('fs');

async function run() {
  try {
    const sql = fs.readFileSync('new_tables.sql', 'utf8');
    await query(sql);
    console.log("Tables created successfully");
  } catch(e) {
    console.error("Error creating tables:", e.message);
  }
  process.exit(0);
}
run();
