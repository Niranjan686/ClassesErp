const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const frontendFiles = walk(path.join(__dirname, '../frontend/src'));
const apiCalls = [];

const regex = /(?:axios|apiClient|api)\.(get|post|put|delete|patch)\(\s*[`'"]([^`'"]+)[`'"]/g;

frontendFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    apiCalls.push({
      file: path.relative(path.join(__dirname, '../frontend/src'), f),
      method: match[1].toUpperCase(),
      endpoint: match[2]
    });
  }
});

console.log(`Found ${apiCalls.length} API calls in frontend source files.\n`);

// Group by file
const byFile = {};
apiCalls.forEach(call => {
  if (!byFile[call.file]) byFile[call.file] = [];
  byFile[call.file].push(`${call.method} ${call.endpoint}`);
});

for (const [file, calls] of Object.entries(byFile)) {
  console.log(`📁 ${file} (${calls.length} calls):`);
  calls.forEach(c => console.log(`   - ${c}`));
}
