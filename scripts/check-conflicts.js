const { execSync } = require('node:child_process');

const markers = ['<'.repeat(7), '='.repeat(7), '>'.repeat(7)];
const pattern = `^(${markers.map((m) => `\\${m}`).join('|')})`;

try {
  const output = execSync(`git grep -n -E "${pattern}" -- .`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();

  if (output) {
    console.error('Merge conflict markers found:\n');
    console.error(output);
    process.exit(1);
  }
} catch (error) {
  // git grep exits non-zero when there are no matches
  if (error.status === 1) {
    console.log('No merge conflict markers found.');
    process.exit(0);
  }

  console.error('Failed to run conflict check:', error.message);
  process.exit(2);
}
