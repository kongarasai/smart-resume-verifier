require('dotenv').config();
const { query } = require('../src/config/database');

async function run() {
  try {
    console.log('Dropping constraint...');
    await query('ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_mode_check');
    console.log('Constraint dropped successfully');
    
    console.log('Checking table definition...');
    const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'interviews'");
    console.log('Columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
