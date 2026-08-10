const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = 'super_secret_jwt_key_for_dev_only_12345';
const userId = 'e4dbcfe260507eba97f0bea7701c1afe';

const token = jwt.sign(
  { id: userId, email: 'sai@gmail.com', role: 'candidate' },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('Generated Token:', token);

const endpoints = [
  { name: 'GET /api/profile', method: 'get', url: 'http://localhost:5000/api/profile' },
  { name: 'GET /api/score', method: 'get', url: 'http://localhost:5000/api/score' },
  { name: 'GET /api/verification/summary', method: 'get', url: 'http://localhost:5000/api/verification/summary' },
  { name: 'GET /api/profile/timeline', method: 'get', url: 'http://localhost:5000/api/profile/timeline' },
  { name: 'POST /api/score/calculate', method: 'post', url: 'http://localhost:5000/api/score/calculate' }
];

async function runTests() {
  for (const ep of endpoints) {
    console.log(`\nTesting ${ep.name}...`);
    try {
      let res;
      if (ep.method === 'get') {
        res = await axios.get(ep.url, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        res = await axios.post(ep.url, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
      console.log(`STATUS: ${res.status}`);
      console.log('RESPONSE:', JSON.stringify(res.data).substring(0, 500));
    } catch (err) {
      console.error(`ERROR: ${err.message}`);
      if (err.response) {
        console.error(`STATUS: ${err.response.status}`);
        console.error('ERROR DATA:', err.response.data);
      }
    }
  }
}

runTests();
