const fs = require('fs');
let code = fs.readFileSync('src/controllers/practiceController.js', 'utf8');
code = code.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('src/controllers/practiceController.js', code);
