require('dotenv').config();
const { query } = require('./src/config/database');

async function test() {
  try {
    const hrRes = await query('SELECT * FROM hr_profiles');
    console.log("hr_profiles rows:", hrRes.rows.length);
  } catch(e) {
    console.error("SQL Error:", e.message);
  }
  process.exit(0);
}
test();
