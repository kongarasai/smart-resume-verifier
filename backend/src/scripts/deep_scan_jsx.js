const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') res = res.concat(walk(p));
    } else if (f.endsWith('.tsx') || f.endsWith('.jsx')) {
      res.push(p);
    }
  });
  return res;
}

const files = walk('mobile/src');
console.log('Deep scanning', files.length, 'files...');

const riskyPatterns = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check for const is... = a && b
    const isAssign = line.match(/(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+);/);
    if (isAssign) {
      const varName = isAssign[2];
      const expr = isAssign[3].trim();
      if (expr.includes('&&') && !expr.startsWith('Boolean(') && !expr.startsWith('!!')) {
        // If expr has parts that could evaluate to string/number
        if (!expr.includes('===') && !expr.includes('!==') && !expr.includes('typeof') && !expr.includes('> 0') && !expr.includes('< 0')) {
          console.log(`[RISKY VAR ASSIGN] ${file}:${idx+1} -> const ${varName} = ${expr}`);
        }
      }
    }

    // Check for {variable && <...
    const jsxCond = line.matchAll(/\{([^{}]+)&&\s*(<[^>]+)/g);
    for (const m of jsxCond) {
      const cond = m[1].trim();
      if (!cond.startsWith('Boolean(') && !cond.startsWith('!!') &&
          !cond.includes('===') && !cond.includes('!==') &&
          !cond.includes('>') && !cond.includes('<') &&
          !cond.includes('>=') && !cond.includes('<=') &&
          !cond.includes('typeof') && !cond.startsWith('is') &&
          !cond.startsWith('has') && !cond.startsWith('show') &&
          !cond.startsWith('loading') && !cond.startsWith('saving') &&
          !cond.startsWith('verifying') && !cond.startsWith('refreshing') &&
          !cond.startsWith('active')) {
        console.log(`[POTENTIAL NON-BOOLEAN JSX COND] ${file}:${idx+1} -> condition: '${cond}' | Line: ${line.trim()}`);
      }
    }
  });
});
