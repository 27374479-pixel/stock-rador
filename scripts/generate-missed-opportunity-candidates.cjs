const fs = require('node:fs');
const path = require('node:path');
const { selectMissedOpportunityCandidates } = require('./missed-opportunity-candidates-core.cjs');

const universePath = process.argv[2];
const snapshotPath = process.argv[3];
const outputPath = process.argv[4];
const runId = process.argv[5];
const benchmarkTicker = process.argv[6] ?? '000300.SH';

if (!universePath || !snapshotPath || !outputPath || !runId) {
  console.error('Usage: node scripts/generate-missed-opportunity-candidates.cjs <audit-universe.json> <120d-outcome-snapshot.json> <candidates.json> <run-id> [benchmark-ticker]');
  process.exit(2);
}

try {
  const universe = JSON.parse(fs.readFileSync(universePath, 'utf8'));
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const { errors, result } = selectMissedOpportunityCandidates(universe, snapshot, {
    runId,
    benchmarkTicker,
    horizonTradingDays: 120,
    percentile: 0.01,
    absoluteExcessThreshold: 0.50
  });
  if (errors.length) throw new Error(`invalid missed-opportunity outcome snapshot:\n- ${errors.join('\n- ')}`);
  const absolute = path.resolve(outputPath);
  if (fs.existsSync(absolute)) throw new Error(`refusing to overwrite existing candidates ${absolute}`);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(absolute);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
