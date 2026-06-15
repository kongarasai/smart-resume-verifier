const https = require('https');
const fs = require('fs');

const renderToken = "rnd_iqfREvOOA4mexgVH5kGvxQx9TFQZ";
const ownerId = "tea-d81b4fbrjlhs73b101a0";

const envContent = fs.readFileSync('backend/.env', 'utf8');
const firebaseContent = fs.readFileSync('backend/firebase-service-account.json', 'utf8');

const envVars = [
  { key: 'FIREBASE_SERVICE_ACCOUNT', value: firebaseContent.trim() }
];

envContent.split('\n').forEach(line => {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const i = t.indexOf('=');
    const k = t.substring(0, i);
    const v = t.substring(i + 1);
    // don't push port or local urls
    if (k !== 'PORT' && k !== 'FRONTEND_URL' && k !== 'GOOGLE_APPLICATION_CREDENTIALS') {
      envVars.push({ key: k, value: v });
    }
  }
});

const payload = JSON.stringify({
  type: 'web_service',
  name: 'smart-resume-backend',
  ownerId: ownerId,
  repo: 'https://github.com/kongarasai/smart-resume-verifier.git',
  branch: 'main',
  autoDeploy: 'yes',
  rootDir: 'backend',
  serviceDetails: {
    env: 'node',
    envSpecificDetails: {
      buildCommand: 'npm install',
      startCommand: 'npm start'
    },
    plan: 'free',
    envVars: envVars
  }
});

const options = {
  hostname: 'api.render.com',
  port: 443,
  path: '/v1/services',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${renderToken}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(payload);
req.end();
