require('dotenv').config();
const { query } = require('./src/config/database');

async function run() {
  const fks = await query(`
    SELECT
      tc.table_name, 
      tc.constraint_name 
    FROM 
      information_schema.table_constraints AS tc 
    WHERE constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
  `);
  
  for(let fk of fks.rows) {
     await query(`ALTER TABLE "${fk.table_name}" DROP CONSTRAINT IF EXISTS "${fk.constraint_name}" CASCADE;`);
  }
  console.log("Dropped all FKs");

  const cols = await query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE column_name IN ('id', 'user_id', 'candidate_id', 'hr_id', 'mentor_id', 'teacher_id', 'group_id', 'workspace_id', 'question_id', 'assignment_id') 
    AND table_schema = 'public'
    AND data_type = 'integer';
  `);

  for(let col of cols.rows) {
     try {
       await query(`ALTER TABLE "${col.table_name}" ALTER COLUMN "${col.column_name}" TYPE VARCHAR(255) USING "${col.column_name}"::varchar;`);
       console.log(`Altered ${col.table_name}.${col.column_name}`);
     } catch(e) {
       console.log(`Failed to alter ${col.table_name}.${col.column_name}: ${e.message}`);
     }
  }

  // Also drop default value on 'id' columns if it's a sequence
  for(let col of cols.rows) {
     if (col.column_name === 'id') {
       try {
         await query(`ALTER TABLE "${col.table_name}" ALTER COLUMN id DROP DEFAULT;`);
       } catch(e) {}
     }
  }
  
  process.exit(0);
}
run();
