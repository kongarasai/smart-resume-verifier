const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const btoaPolyfill = (input) => {
  let str = input;
  let output = '';
  for (let block = 0, charCode, i = 0, map = chars;
       str.charAt(i | 0) || (map = '=', i % 1);
       output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
    charCode = str.charCodeAt(i += 3 / 4);
    block = block << 8 | charCode;
  }
  return output;
};

const base64UrlEncode = (str) => {
  return btoaPolyfill(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const generateMockFirebaseToken = (email, name) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const uid = email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  const payload = {
    uid,
    user_id: uid,
    sub: uid,
    email: email.toLowerCase(),
    name: name || email.split('@')[0],
  };
  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}.mocksignature`;
};

async function testMobileFlow() {
  const email = 'mentor@gmail.com';
  const mockToken = generateMockFirebaseToken(email, 'mentor');

  console.log('1. Simulating Mobile /api/auth/login with mock token...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mockToken}`
    },
    body: JSON.stringify({ email, password: 'password123' })
  });

  const loginData = await loginRes.json();
  console.log('Login Response Status:', loginRes.status);
  console.log('User ID returned:', loginData.user?.id);
  console.log('User Role returned:', loginData.user?.role);

  if (!loginData.token) {
    console.error('Failed to get token:', loginData);
    process.exit(1);
  }

  console.log('\n2. Simulating Mobile GET /api/groups with session token...');
  const groupsRes = await fetch('http://localhost:5000/api/groups', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${loginData.token}`
    }
  });

  const groupsData = await groupsRes.json();
  console.log('Groups Response Status:', groupsRes.status);
  console.log(`Groups received (${groupsData.length}):`);
  groupsData.forEach(g => {
    console.log(`- ${g.name} (${g.workspace_name}): ${g.member_count} members`);
  });

  const totalCandidates = groupsData.reduce((s, g) => s + (parseInt(g.member_count) || 0), 0);
  console.log(`\nActive Groups: ${groupsData.length}`);
  console.log(`Total Candidates: ${totalCandidates}`);

  process.exit(0);
}

testMobileFlow().catch(e => { console.error(e); process.exit(1); });
