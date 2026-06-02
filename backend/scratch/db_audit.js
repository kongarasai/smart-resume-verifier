const { Client } = require('pg');

const client = new Client('postgresql://smart_resume_verifier_user:4jXmqoyMaOmquO1GaZEWwGK3W11Wuiwr@dpg-d81bbp8g4nts739borgg-a.ohio-postgres.render.com/smart_resume_verifier');

async function audit() {
  try {
    await client.connect();
    console.log('Connected to DB');
    
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables found:', tables.rows.map(r => r.table_name));
    
    if (tables.rows.length === 0) {
      console.log('NO TABLES FOUND! Migrations failed.');
    }
    
    const usersCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    console.log('Users columns:', usersCols.rows.map(r => r.column_name));
    
    await client.end();
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
}

audit();
