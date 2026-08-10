const https = require('https');

const renderToken = "rnd_iqfREvOOA4mexgVH5kGvxQx9TFQZ";
const serviceIds = ["srv-d8np8l0k1i2s73dj7lag", "srv-d81b9u8sfn5c73a2v1kg"];

function deployService(id) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/services/${id}/deploys`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${renderToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        resolve({ id, statusCode: res.statusCode, data });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ clearCache: 'do_not_clear' }));
    req.end();
  });
}

async function run() {
  for (const id of serviceIds) {
    console.log(`Triggering deploy for ${id}...`);
    try {
      const res = await deployService(id);
      console.log(`Status for ${id}:`, res.statusCode);
      console.log(`Response for ${id}:`, res.data);
    } catch (err) {
      console.error(`Failed for ${id}:`, err);
    }
  }
}

run();
