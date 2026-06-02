const axios = require('axios');

async function testProfile() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'candidate_test@example.com',
      password: 'Password123!'
    });
    const token = loginRes.data.token;
    console.log('Token received.');

    console.log('Fetching profile...');
    const profileRes = await axios.get('http://localhost:5000/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Profile Response Status:', profileRes.status);
    console.log('Profile Data Keys:', Object.keys(profileRes.data));

    console.log('Updating profile...');
    const updateRes = await axios.put('http://localhost:5000/api/profile', {
      headline: 'Full Stack Enthusiast ' + Date.now()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Update Response Status:', updateRes.status);
    console.log('Update Response:', JSON.stringify(updateRes.data, null, 2));

  } catch (error) {
    console.error('Error Status:', error.response?.status);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error Message:', error.message);
  }
}

testProfile();
