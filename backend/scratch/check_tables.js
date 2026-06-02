require('dotenv').config();
const { query } = require('../src/config/database');

async function checkTables() {
  try {
    const res = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Tables in public schema:');
    res.rows.forEach(row => console.log(`- ${row.table_name}`));
  } catch (err) {
    console.error('Failed to check tables:', err);
  } finally {
    process.exit();
  }
}

checkTables();
