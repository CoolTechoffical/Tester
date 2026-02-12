const fs = require('node:fs');

const lockPath = 'package-lock.json';
const content = fs.readFileSync(lockPath, 'utf8');

const conflictRegex = /^(<<<<<<<|=======|>>>>>>>)$/m;
if (conflictRegex.test(content)) {
  console.error(`Merge conflict markers found in ${lockPath}.`);
  process.exit(1);
}

try {
  JSON.parse(content);
} catch (error) {
  console.error(`${lockPath} is not valid JSON: ${error.message}`);
  process.exit(1);
}

console.log(`${lockPath} is valid and conflict-free.`);
