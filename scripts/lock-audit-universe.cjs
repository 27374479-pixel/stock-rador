const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const discoveryLockPath = process.argv[2];
const universePath = process.argv[3];
const outputPath = process.argv[4];
if (!discoveryLockPath || !universePath || !outputPath) {
  console.error('Usage: node scripts/lock-audit-universe.cjs <discovery-lock.json> <audit-universe.json> <audit-universe-lock.json>');
  process.exit(2);
}

try {
  const root = process.cwd();
  const discoveryLock = JSON.parse(fs.readFileSync(discoveryLockPath, 'utf8'));
  const universe = JSON.parse(fs.readFileSync(universePath, 'utf8'));
  if (discoveryLock.evaluationMode !== 'forward') throw new Error('audit-universe addendum requires a forward discovery lock');
  if (universe.schemaVersion !== '1.0') throw new Error('unsupported universe schema');
  if (!Number.isInteger(universe?.summary?.includedCount) || universe.summary.includedCount < 1000) {
    throw new Error('audit universe includedCount is invalid');
  }
  const out = {
    schemaVersion: '1.0',
    runId: discoveryLock.runId,
    universeVersion: universe.universeVersion,
    lockedAt: new Date().toISOString(),
    prospective: true,
    note: 'This addendum was frozen after the discovery lock but before the registered future outcome horizon. It fixes the exact ticker denominator for future missed-opportunity auditing without modifying the original discovery snapshot.',
    files: [
      {
        role: 'discovery_lock',
        path: path.relative(root, path.resolve(discoveryLockPath)).replaceAll(path.sep, '/'),
        sha256: sha256(discoveryLockPath)
      },
      {
        role: 'audit_universe',
        path: path.relative(root, path.resolve(universePath)).replaceAll(path.sep, '/'),
        sha256: sha256(universePath)
      },
      {
        role: 'universe_fetcher',
        path: 'scripts/fetch-a-share-audit-universe-official.py',
        sha256: sha256(path.resolve(root, 'scripts/fetch-a-share-audit-universe-official.py'))
      },
      {
        role: 'universe_locker',
        path: 'scripts/lock-audit-universe.cjs',
        sha256: sha256(path.resolve(root, 'scripts/lock-audit-universe.cjs'))
      },
      {
        role: 'miss_candidate_core',
        path: 'scripts/missed-opportunity-candidates-core.cjs',
        sha256: sha256(path.resolve(root, 'scripts/missed-opportunity-candidates-core.cjs'))
      },
      {
        role: 'miss_candidate_cli',
        path: 'scripts/generate-missed-opportunity-candidates.cjs',
        sha256: sha256(path.resolve(root, 'scripts/generate-missed-opportunity-candidates.cjs'))
      }
    ],
    includedTickerCount: universe.summary.includedCount,
    includedTickerDigest: crypto.createHash('sha256')
      .update(universe.included.map((row) => row.ticker).sort().join('\n'))
      .digest('hex')
  };
  const absolute = path.resolve(outputPath);
  if (fs.existsSync(absolute)) throw new Error(`refusing to overwrite existing universe lock ${absolute}`);
  fs.writeFileSync(absolute, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(absolute);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
