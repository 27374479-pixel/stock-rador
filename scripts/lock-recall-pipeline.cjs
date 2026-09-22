const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { verifyAuditUniverseLock } = require('./audit-universe-lock-core.cjs');

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const universeLockPath = process.argv[2];
const outputPath = process.argv[3];
if (!universeLockPath || !outputPath) {
  console.error('Usage: node scripts/lock-recall-pipeline.cjs <audit-universe-lock.json> <recall-pipeline-lock.json>');
  process.exit(2);
}

try {
  const root = process.cwd();
  const universeLock = JSON.parse(fs.readFileSync(universeLockPath, 'utf8'));
  const mismatches = verifyAuditUniverseLock(universeLock, root);
  if (mismatches.length) throw new Error(`audit universe is not immutable:\n- ${mismatches.join('\n- ')}`);

  const relativeUniverseLock = path.relative(root, path.resolve(universeLockPath)).replaceAll(path.sep, '/');
  const lockedPaths = [
    ['audit_universe_lock', relativeUniverseLock],
    ['audit_universe_verifier', 'scripts/audit-universe-lock-core.cjs'],
    ['candidate_selector_core', 'scripts/missed-opportunity-candidates-core.cjs'],
    ['candidate_selector_cli', 'scripts/generate-missed-opportunity-candidates-v062.cjs'],
    ['miss_audit_core', 'scripts/discovery-core.cjs'],
    ['miss_audit_cli', 'scripts/audit-discovery-recall.cjs'],
    ['outcome_snapshot_schema', 'skills/stock-rador/versions/0.6.0/120d-outcome-snapshot.template.json'],
    ['discovery_contract', 'skills/stock-rador/versions/0.6.0/DISCOVERY.md']
  ];
  const files = lockedPaths.map(([role, relative]) => {
    const absolute = path.resolve(root, relative);
    if (!fs.existsSync(absolute)) throw new Error(`recall-pipeline file missing: ${relative}`);
    return { role, path: relative, sha256: sha256(absolute) };
  });

  const result = {
    schemaVersion: '1.0',
    runId: universeLock.runId,
    lockedAt: new Date().toISOString(),
    prospective: true,
    auditUniverseTickerDigest: universeLock.includedTickerDigest,
    candidateRule: {
      horizonTradingDays: 120,
      benchmarkTicker: '000300.SH',
      percentile: 0.01,
      absoluteExcessThreshold: 0.50,
      union: true,
      requireEveryFrozenTickerInSnapshot: true,
      samePeriodMayTuneSkill: false
    },
    note: 'Frozen before the 120-trading-day outcome exists. Any later code or schema mutation requires a new prospective pipeline version and cannot replace this lock.',
    files
  };

  const absoluteOutput = path.resolve(outputPath);
  if (fs.existsSync(absoluteOutput)) throw new Error(`refusing to overwrite existing recall pipeline lock ${absoluteOutput}`);
  fs.writeFileSync(absoluteOutput, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(absoluteOutput);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
