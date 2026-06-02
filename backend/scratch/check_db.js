const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:837479@localhost:5432/smart_resume_verifier'
});

async function check() {
  const res = await pool.query('SELECT * FROM groups');
  console.log('Groups:', res.rows.map(r => ({ id: r.id, name: r.name })));
  
  const qRes = await pool.query('SELECT * FROM questions');
  console.log('Questions:', qRes.rows.map(r => ({ id: r.id, title: r.title, group_id: r.group_id, is_active: r.is_active, expires_at: r.expires_at })));
  
  const mRes = await pool.query('SELECT * FROM group_members');
  console.log('Members:', mRes.rows.map(r => ({ user_id: r.user_id, group_id: r.group_id })));
  
  const uRes = await pool.query('SELECT id, email FROM users');
  console.log('Users:', uRes.rows);

  pool.end();
}

check();
