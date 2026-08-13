const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

const unwrapFn = `
// Unwrap helper to support both direct payload access and backward-compatible .data access
const unwrap = (r: any) => {
  const d = r.data;
  if (d && typeof d === 'object') {
    Object.defineProperty(d, 'data', { value: d, enumerable: false, writable: true });
  }
  return d;
};
`;

code = code.replace(/(api\.interceptors\.response\.use.*?\n\}\);)/s, '$1\n' + unwrapFn);
code = code.replace(/\.then\(r => r\.data\)/g, '.then(unwrap)');

fs.writeFileSync('src/lib/api.ts', code);
