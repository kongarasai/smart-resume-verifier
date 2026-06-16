// Quick test script to verify practice sessions load 50 questions each
const axios = require('axios');

const BASE = 'http://localhost:5000/api';

async function test() {
  console.log('🔐 Logging in as sai@gmail.com...');
  const loginRes = await axios.post(`${BASE}/auth/login`, {
    email: 'sai@gmail.com',
    password: '789456123'
  });
  
  const token = loginRes.data.token;
  if (!token) {
    console.error('❌ Login failed - no token returned:', loginRes.data);
    process.exit(1);
  }
  console.log('✅ Login successful!\n');

  const headers = { Authorization: `Bearer ${token}` };
  const categories = ['aptitude', 'technical_mcq', 'coding', 'hr'];

  for (const cat of categories) {
    try {
      const res = await axios.post(`${BASE}/practice/start`, { category: cat }, { headers });
      const questions = res.data;
      const count = Array.isArray(questions) ? questions.length : 0;
      const emoji = count >= 50 ? '✅' : count > 0 ? '⚠️' : '❌';
      console.log(`${emoji} ${cat.toUpperCase().padEnd(16)} → ${count} questions loaded`);
      if (count > 0) {
        console.log(`   First: "${questions[0].title}" (${questions[0].difficulty})`);
        console.log(`   Last:  "${questions[count-1].title}" (${questions[count-1].difficulty})`);
      }
    } catch (err) {
      console.error(`❌ ${cat.toUpperCase().padEnd(16)} → ERROR: ${err.response?.data?.error || err.message}`);
    }
  }
  
  console.log('\n🏁 Practice session verification complete!');
}

test().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
