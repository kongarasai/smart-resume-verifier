const axios = require('axios');

async function testPiston() {
  const language = 'python';
  const pistonLang = 'python';
  const code = 'print("Hello World")';
  const version = '3.10.0';
  const file_ext = 'py';

  try {
    console.log(`Testing Piston API with ${language} (${version})...`);
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: pistonLang,
      version: version,
      files: [{ name: `main.${file_ext}`, content: code }],
      stdin: ""
    }, { timeout: 15000 });

    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPiston();
