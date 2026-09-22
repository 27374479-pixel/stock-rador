const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { verifyAuditUniverseLock } = require('../scripts/audit-universe-lock-core.cjs');

function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

test('audit-universe lock verification detects any frozen-universe mutation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-audit-lock-'));
  fs.mkdirSync(path.join(root, 'data'));
  const universePath = path.join(root, 'data', 'universe.json');
  const universe = {
    schemaVersion: '1.0',
    universeVersion: 'u1',
    asOfDate: '2026-09-22',
    included: [{ ticker: '000001.SZ' }, { ticker: '600000.SH' }]
  };
  fs.writeFileSync(universePath, JSON.stringify(universe));
  const digest = crypto.createHash('sha256').update('000001.SZ\n600000.SH').digest('hex');
  const lock = {
    schemaVersion: '1.0',
    prospective: true,
    universeVersion: 'u1',
    includedTickerCount: 2,
    includedTickerDigest: digest,
    files: [{ role: 'audit_universe', path: 'data/universe.json', sha256: sha(universePath) }]
  };
  assert.deepEqual(verifyAuditUniverseLock(lock, root), []);
  universe.included.push({ ticker: '300001.SZ' });
  fs.writeFileSync(universePath, JSON.stringify(universe));
  assert.ok(verifyAuditUniverseLock(lock, root).some((x) => x.includes('locked file changed')));
});
