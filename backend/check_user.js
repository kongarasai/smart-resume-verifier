require('dotenv').config();
const { query } = require('./src/config/database');

async function check() {
  const res = await query("SELECT id, email, role, full_name FROM users");
  console.log(res.rows);
  process.exit(0);
}
check();
