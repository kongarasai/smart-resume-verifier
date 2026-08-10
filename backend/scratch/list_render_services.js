const https = require('https');

const renderToken = "rnd_iqfREvOOA4mexgVH5kGvxQx9TFQZ";

const options = {
  hostname: 'api.render.com',
  port: 443,
  path: '/v1/services?limit=20',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${renderToken}`,
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Services:');
      parsed.forEach(s => {
        console.log(`- Name: ${s.service.name}`);
        console.log(`  ID: ${s.service.id}`);
        console.log(`  URL: ${s.service.serviceDetails.url || s.service.url}`);
        console.log(`  Repo: ${s.service.repo}`);
        console.log(`  Branch: ${s.service.branch}`);
        console.log(`  Status: ${s.service.status}`);
        console.log(`  Updated At: ${s.service.updatedAt}`);
        console.log('');
      });
    } catch (e) {
      console.log('Failed to parse:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.end();
