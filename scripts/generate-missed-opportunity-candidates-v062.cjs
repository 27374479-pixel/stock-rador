const fs = require('node:fs');
const path = require('node:path');
const { verifyAuditUniverseLock, resolveInside } = require('./audit-universe-lock-core.cjs');
const { selectMissedOpportunityCandidates } = require('./missed-opportunity-candidates-core.cjs');

const lockPath = process.argv[2];
const snapshotPath = process.argv[3];
const outputPath = process.argv[4];

if (!lockPath || !snapshotPath || !outputPath) {
  console.error('Usage: node scripts/generate-missed-opportunity-candidates-v062.cjs <audit-universe-lock.json> <120d-outcome-snapshot.json> <candidates.json>');
  process.exit(2);
}

try {
  const root = process.cwd();
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const mismatches = verifyAuditUniverseLock(lock, root);
  if (mismatches.length) throw new Error(`refusing candidate generation because audit universe changed:\n- ${mismatches.join('\n- ')}`);

  const universeEntry = lock.files.find((file) => file.role === 'audit_universe');
  const universe = JSON.parse(fs.readFileSync(resolveInside(root, universeEntry.path), 'utf8'));
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

  const { errors, result } = selectMissedOpportunityCandidates(universe, snapshot, {
    runId: lock.runId,
    benchmarkTicker: '000300.SH',
    horizonTradingDays: 120,
    percentile: 0.01,
    absoluteExcessThreshold: 0.50
  });
  if (errors.length) throw new Error(`invalid missed-opportunity outcome snapshot:\n- ${errors.join('\n- ')}`);

  const absolute = path.resolve(outputPath);
  if (fs.existsSync(absolute)) throw new Error(`refusing to overwrite existing candidates ${absolute}`);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const output = {
    ...result,
    auditUniverseLockPath: path.relative(root, path.resolve(lockPath)).replaceAll(path.sep, '/'),
    auditUniverseTickerDigest: lock.includedTickerDigest
  };
  fs.writeFileSync(absolute, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(absolute);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
