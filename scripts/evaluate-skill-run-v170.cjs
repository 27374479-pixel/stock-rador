const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { evaluateRun, readJson, verifyLock } = require('./backtest-core-v170.cjs');

const lockPath = process.argv[2];
const pricesPath = process.argv[3];
if (!lockPath || !pricesPath) {
  console.error('Usage: node scripts/evaluate-skill-run-v170.cjs <lock.json> <prices.json> [outcome.json]');
  process.exit(2);
}
try {
  const root = process.cwd();
  const lock = readJson(lockPath);
  const mismatches = verifyLock(lock, root);
  if (mismatches.length) throw new Error(`frozen run was modified after lock:\n- ${mismatches.join('\n- ')}`);
  const manifestEntry = lock.files.find((file) => file.role === 'manifest');
  if (!manifestEntry) throw new Error('lock does not contain a manifest');
  const manifest = readJson(path.resolve(root, manifestEntry.path));
  const memosByPath = {};
  for (const file of lock.files.filter((item) => item.role === 'memo')) {
    memosByPath[file.path] = readJson(path.resolve(root, file.path));
  }
  const prices = readJson(pricesPath);
  const evaluated = evaluateRun(manifest, memosByPath, prices);
  const output = {
    schemaVersion: '1.1',
    evaluatorVersion: '1.7-adversarial-research-completeness',
    runId: lock.runId,
    evaluatedAt: new Date().toISOString(),
    frozenLockSha256: crypto.createHash('sha256').update(fs.readFileSync(lockPath)).digest('hex'),
    priceSource: {
      provider: prices.provider ?? null,
      fetchedAt: prices.fetchedAt ?? null,
      path: path.relative(root, path.resolve(pricesPath)).replaceAll(path.sep, '/')
    },
    ...evaluated
  };
  const outputPath = process.argv[4] ? path.resolve(process.argv[4]) : path.join(path.dirname(path.resolve(lockPath)), 'outcome.json');
  if (fs.existsSync(outputPath)) throw new Error(`refusing to overwrite existing outcome ${outputPath}`);
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(outputPath);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
