const https = require('https');

const renderToken = "rnd_iqfREvOOA4mexgVH5kGvxQx9TFQZ";
const id = "srv-d81b9u8sfn5c73a2v1kg";

const options = {
  hostname: 'api.render.com',
  port: 443,
  path: `/v1/services/${id}`,
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
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.end();
