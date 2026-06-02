const axios = require('axios');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'health_monitor.log');

async function checkHealth() {
  const timestamp = new Date().toISOString();
  try {
    const start = Date.now();
    const res = await axios.get('http://localhost:5000/health', { 
      timeout: 5000,
      headers: { 'Authorization': 'Bearer test' } // Just to trigger a real response
    });
    const duration = Date.now() - start;
    fs.appendFileSync(LOG_FILE, `[${timestamp}] BACKEND: OK (${res.status}) - ${duration}ms\n`);
  } catch (err) {
    const status = err.response ? err.response.status : 'DOWN';
    const message = err.message;
    fs.appendFileSync(LOG_FILE, `[${timestamp}] BACKEND: ERROR (${status}) - ${message}\n`);
  }

  try {
    const start = Date.now();
    await axios.get('http://localhost:3000', { timeout: 5000 });
    const duration = Date.now() - start;
    fs.appendFileSync(LOG_FILE, `[${timestamp}] FRONTEND: OK - ${duration}ms\n`);
  } catch (err) {
    fs.appendFileSync(LOG_FILE, `[${timestamp}] FRONTEND: ERROR - ${err.message}\n`);
  }
}

console.log('Monitoring started...');
setInterval(checkHealth, 10000);
checkHealth();
