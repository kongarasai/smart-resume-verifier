const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'SMART_RESUME_VERIFIER_2026_PROJECT_KEY';
const token = jwt.sign({ id: '7a2795d6-c5ce-4b7b-a87c-ff6c94379b0b', role: 'teacher' }, JWT_SECRET);

async function testGen() {
  try {
    const res = await axios.post('http://localhost:5000/api/questions/generate', {
      topic: 'React Server Components',
      count: 2,
      difficulty: 'hard'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('SUCCESS:');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('FAILED:');
    console.error(err.response ? err.response.data : err.message);
  }
}

testGen();
