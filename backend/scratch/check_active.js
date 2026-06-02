const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:837479@localhost:5432/smart_resume_verifier'
});

async function check() {
  const gRes = await pool.query('SELECT id, name FROM groups');
  const groups = gRes.rows;
  
  for (const g of groups) {
    const qRes = await pool.query('SELECT COUNT(*) FROM questions WHERE group_id=$1 AND is_active=TRUE', [g.id]);
    const qAllRes = await pool.query('SELECT COUNT(*) FROM questions WHERE group_id=$1', [g.id]);
    console.log(`Group: ${g.name} (${g.id}) | Active Questions: ${qRes.rows[0].count} | Total Questions: ${qAllRes.rows[0].count}`);
  }
  
  pool.end();
}

check();
