const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function resolveInside(rootDir, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`path must be repository-relative: ${relativePath}`);
  }
  const root = path.resolve(rootDir);
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`path escapes repository root: ${relativePath}`);
  }
  return resolved;
}

function verifyAuditUniverseLock(lock, rootDir) {
  const errors = [];
  if (lock?.schemaVersion !== '1.0') errors.push('unsupported audit-universe lock schema');
  if (lock?.prospective !== true) errors.push('audit-universe lock must be prospective');
  if (!Array.isArray(lock?.files) || !lock.files.length) errors.push('audit-universe lock files missing');
  if (errors.length) return errors;

  for (const file of lock.files) {
    try {
      const absolute = resolveInside(rootDir, file.path);
      if (!fs.existsSync(absolute)) {
        errors.push(`locked file missing: ${file.path}`);
        continue;
      }
      const actual = sha256File(absolute);
      if (actual !== file.sha256) errors.push(`locked file changed: ${file.path}`);
    } catch (error) {
      errors.push(error.message);
    }
  }

  const universeEntry = lock.files.find((file) => file.role === 'audit_universe');
  if (!universeEntry) {
    errors.push('audit-universe lock missing audit_universe file');
    return errors;
  }
  try {
    const universe = JSON.parse(fs.readFileSync(resolveInside(rootDir, universeEntry.path), 'utf8'));
    const tickers = (universe?.included ?? []).map((row) => row.ticker).sort();
    if (tickers.length !== lock.includedTickerCount) {
      errors.push(`includedTickerCount mismatch: lock=${lock.includedTickerCount} universe=${tickers.length}`);
    }
    const digest = sha256Text(tickers.join('\n'));
    if (digest !== lock.includedTickerDigest) errors.push('includedTickerDigest mismatch');
    if (universe.universeVersion !== lock.universeVersion) errors.push('universeVersion mismatch');
    if (universe.asOfDate !== '2026-09-22') errors.push(`unexpected frozen universe asOfDate: ${universe.asOfDate}`);
  } catch (error) {
    errors.push(`cannot verify audit universe: ${error.message}`);
  }
  return errors;
}

module.exports = { resolveInside, sha256File, sha256Text, verifyAuditUniverseLock };
