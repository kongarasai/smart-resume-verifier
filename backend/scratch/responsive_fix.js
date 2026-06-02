const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../../frontend/src/app');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
}

const files = walkSync(targetDir);

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace grid-cols-2 with grid-cols-1 md:grid-cols-2
  content = content.replace(/(?<!md:|lg:|sm:|xl:)\bgrid-cols-2\b/g, 'grid-cols-1 md:grid-cols-2');
  
  // Replace grid-cols-3 with grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  content = content.replace(/(?<!md:|lg:|sm:|xl:)\bgrid-cols-3\b/g, 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3');
  
  // Replace grid-cols-4 with grid-cols-1 md:grid-cols-2 lg:grid-cols-4
  content = content.replace(/(?<!md:|lg:|sm:|xl:)\bgrid-cols-4\b/g, 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4');
  
  // Replace w-[500px] or other hardcoded widths that might break mobile
  content = content.replace(/\bw-\[([3-9]\d{2,})px\]\b/g, 'w-full max-w-[$1px]');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Done. Updated ${changedFiles} files.`);
