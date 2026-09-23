const fs = require('node:fs');
const path = require('node:path');
const { lockRun } = require('./backtest-core-v120.cjs');

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error('Usage: node scripts/lock-skill-run-v120.cjs <manifest.json> [lock.json]');
  process.exit(2);
}

try {
  const lock = lockRun(manifestPath, process.cwd());
  const outputPath = process.argv[3] ? path.resolve(process.argv[3]) : path.join(path.dirname(path.resolve(manifestPath)), 'lock.json');
  if (fs.existsSync(outputPath)) throw new Error(`refusing to overwrite existing lock ${outputPath}`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
  console.log(outputPath);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
