require('dotenv').config();
const { query } = require('./src/config/database');

async function run() {
  try {
    await query("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachment_url TEXT;");
    await query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS attachment_url TEXT;");
    console.log("Altered tables successfully");
  } catch(e) {
    console.error("Error altering tables:", e.message);
  }
  process.exit(0);
}
run();
