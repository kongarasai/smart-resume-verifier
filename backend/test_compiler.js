const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('https://emkc.org/api/v2/piston/runtimes');
    console.log("Success, found", res.data.length, "runtimes");
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
