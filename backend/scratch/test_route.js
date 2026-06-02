require('dotenv').config();
const axios = require('axios');

async function testRoute() {
  try {
    // We can't easily test with authentication here without a token,
    // but we can check if the route exists by seeing if it returns 401 instead of 500 (syntax error).
    const url = 'http://localhost:5000/api/profile/resume-feedback';
    console.log(`Testing route: ${url}`);
    const res = await axios.get(url).catch(err => err.response);
    console.log(`Status: ${res.status}`);
    if (res.status === 500) {
      console.log('Error data:', res.data);
    } else if (res.status === 401) {
      console.log('Success: Route exists (Unauthorized as expected)');
    } else {
      console.log('Unexpected status:', res.status);
    }
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testRoute();
