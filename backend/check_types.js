const { query } = require('./src/config/database');

async function check() {
  const res = await query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE column_name IN ('id', 'user_id') 
    AND table_schema = 'public'
    AND data_type = 'integer';
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
check();
