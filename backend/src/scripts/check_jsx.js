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
console.log('Total files:', files.length);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // 1. Check for {expr && <
    const matches = line.matchAll(/\{([^&{<]+)&&\s*(<[^>]+)/g);
    for (const match of matches) {
      const cond = match[1].trim();
      const isSafe = cond.startsWith('Boolean(') || cond.startsWith('!!') ||
                     cond.includes('===') || cond.includes('!==') ||
                     cond.includes('>') || cond.includes('<') ||
                     cond.includes('>=') || cond.includes('<=') ||
                     cond.includes('typeof') || cond.startsWith('is') ||
                     cond.startsWith('has') || cond.startsWith('show') ||
                     cond.startsWith('loading') || cond.startsWith('saving') ||
                     cond.startsWith('verifying') || cond.startsWith('refreshing') ||
                     cond.startsWith('active');
      if (!isSafe) {
        console.log(`[UNSAFE COND] ${file}:${idx+1} -> '${cond}' | Line: ${line.trim()}`);
      }
    }

    // 2. Check for text directly inside JSX without Text
    // e.g. <View> something </View>
    const textMatch = line.match(/>([^<>{}\r\n]+)</g);
    if (textMatch) {
      textMatch.forEach(m => {
        const text = m.slice(1, -1).trim();
        if (text && !line.includes('<Text') && !line.includes('</Text>') && !line.includes('title=') && !line.includes('label=')) {
          console.log(`[RAW TEXT OUTSIDE TEXT COMPONENT] ${file}:${idx+1} -> '${text}' | Line: ${line.trim()}`);
        }
      });
    }
  });
});
