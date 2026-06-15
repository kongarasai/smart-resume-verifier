require('dotenv').config();
const { query } = require('./src/config/database');

async function fixDefaults() {
  const cols = await query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE column_name = 'id'
    AND table_schema = 'public'
    AND data_type = 'character varying';
  `);

  for(let col of cols.rows) {
     try {
       await query(`ALTER TABLE "${col.table_name}" ALTER COLUMN id SET DEFAULT gen_random_uuid()::varchar;`);
       console.log(`Set default for ${col.table_name}.id`);
     } catch(e) {
       console.log(`Failed for ${col.table_name}.id: ${e.message}`);
     }
  }
  process.exit(0);
}
fixDefaults();
