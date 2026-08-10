const https = require('https');

const renderToken = "rnd_iqfREvOOA4mexgVH5kGvxQx9TFQZ";
const serviceIds = ["srv-d8np8l0k1i2s73dj7lag", "srv-d81b9u8sfn5c73a2v1kg"];

function checkDeploy(id) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/services/${id}/deploys?limit=3`,
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
        resolve({ id, statusCode: res.statusCode, data });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function run() {
  for (const id of serviceIds) {
    console.log(`Checking deploy status for ${id}...`);
    try {
      const res = await checkDeploy(id);
      if (res.statusCode === 200) {
        const parsed = JSON.parse(res.data);
        console.log(`Deploys for ${id}:`);
        parsed.forEach(d => {
          console.log(`- Commit: ${d.deploy.commit?.message || 'N/A'}`);
          console.log(`  Status: ${d.deploy.status}`);
          console.log(`  Created At: ${d.deploy.createdAt}`);
          console.log(`  Finished At: ${d.deploy.finishedAt || 'building/running'}`);
        });
      } else {
        console.log(`Failed with status ${res.statusCode}:`, res.data);
      }
      console.log('');
    } catch (err) {
      console.error(`Failed for ${id}:`, err);
    }
  }
}

run();
