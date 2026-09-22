const fs = require('node:fs');
const path = require('node:path');
const { readJson: readBacktestJson, verifyLock } = require('./backtest-core.cjs');
const { auditMissedOpportunities, readJson } = require('./discovery-core.cjs');

const lockPath = process.argv[2];
const auditPath = process.argv[3];
const outputPath = process.argv[4];

if (!lockPath || !auditPath || !outputPath) {
  console.error('Usage: node scripts/audit-discovery-recall.cjs <lock.json> <missed-opportunities.json> <discovery-audit.json>');
  process.exit(2);
}

try {
  const root = process.cwd();
  const lock = readBacktestJson(lockPath);
  const mismatches = verifyLock(lock, root);
  if (mismatches.length) throw new Error(`refusing discovery audit because frozen run changed:\n- ${mismatches.join('\n- ')}`);

  const sourcePackEntry = lock.files.find((file) => file.role === 'source_pack');
  if (!sourcePackEntry) throw new Error('lock missing source_pack');
  const pack = readJson(path.resolve(root, sourcePackEntry.path));
  const audit = readJson(path.resolve(auditPath));
  const { errors, report } = auditMissedOpportunities(lock, pack, audit);
  if (errors.length) throw new Error(`invalid missed-opportunity audit:\n- ${errors.join('\n- ')}`);

  const absolute = path.resolve(outputPath);
  if (fs.existsSync(absolute)) throw new Error(`refusing to overwrite existing discovery audit ${absolute}`);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(absolute);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
