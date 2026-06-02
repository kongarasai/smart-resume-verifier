require('dotenv').config();
const { query } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log('🚀 Starting Database Migration...');

    // 1. Ensure uuid-ossp extension exists
    console.log('Enabling uuid-ossp extension...');
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // 2. Run schema.sql from root (if exists and DB not initialized)
    const rootSchemaPath = path.join(__dirname, '..', 'db-schema', 'schema.sql');
    if (fs.existsSync(rootSchemaPath)) {
      const dbCheck = await query("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users')");
      if (!dbCheck.rows[0].exists) {
        console.log('Running main schema.sql...');
        const rootSql = fs.readFileSync(rootSchemaPath, 'utf8');
        await query(rootSql);
        console.log('✅ Main schema applied.');
      } else {
        console.log('Database already initialized, skipping main schema.sql.');
      }
    }

    // 3. Run new_tables.sql
    const sqlPath = path.join(__dirname, 'new_tables.sql');
    if (fs.existsSync(sqlPath)) {
      console.log('Running new_tables.sql schema...');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await query(sql);
      console.log('✅ New tables applied.');
    } else {
      console.warn('⚠️ new_tables.sql not found, skipping schema application.');
    }

    // 4. Run schema_v3_patch.sql
    const patchPath = path.join(__dirname, '..', 'db-schema', 'schema_v3_patch.sql');
    if (fs.existsSync(patchPath)) {
      console.log('Running schema_v3_patch.sql schema...');
      const patchSql = fs.readFileSync(patchPath, 'utf8');
      await query(patchSql);
      console.log('✅ V3 Patch applied.');
    } else {
      console.warn('⚠️ schema_v3_patch.sql not found, skipping patch application.');
    }

    // 5. Run add_fraud_columns.sql
    const fraudPath = path.join(__dirname, 'src', 'scripts', 'add_fraud_columns.sql');
    if (fs.existsSync(fraudPath)) {
      console.log('Running add_fraud_columns.sql...');
      const fraudSql = fs.readFileSync(fraudPath, 'utf8');
      await query(fraudSql);
      console.log('✅ Fraud columns applied.');
    } else {
      console.warn('⚠️ add_fraud_columns.sql not found, skipping.');
    }

    // 6. Run add_indexes.sql
    const indexesPath = path.join(__dirname, 'src', 'scripts', 'add_indexes.sql');
    if (fs.existsSync(indexesPath)) {
      console.log('Running add_indexes.sql...');
      const indexesSql = fs.readFileSync(indexesPath, 'utf8');
      await query(indexesSql);
      console.log('✅ Indexes applied.');
    } else {
      console.warn('⚠️ add_indexes.sql not found, skipping.');
    }

    // 3. Run individual alter commands (backward compatibility)
    console.log('Applying incremental updates...');
    try {
      await query("ALTER TABLE hr_evaluations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP");
      await query("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE");
      await query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE");
    } catch (e) {
      console.warn('Incremental migration warning:', e.message);
    }
    
    console.log('🎉 Migration completed successfully!');
    return true;
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    return false;
  }
}

module.exports = migrate;
