const fs = require('node:fs');
const path = require('node:path');

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8'); }

const lockPath = process.argv[2];
const rawPath = process.argv[3];
const outPath = process.argv[4];
const auditPath = process.argv[5];
if (!lockPath || !rawPath || !outPath || !auditPath) {
  console.error('Usage: node scripts/fill-suspension-days-postlock.cjs <lock.json> <raw-prices.json> <filled-prices.json> <audit.json>');
  process.exit(2);
}

const root = process.cwd();
const lock = readJson(lockPath);
const raw = readJson(rawPath);
const manifestEntry = lock.files.find((x) => x.role === 'manifest');
if (!manifestEntry) throw new Error('lock has no manifest');
const manifest = readJson(path.resolve(root, manifestEntry.path));
const benchmarkTicker = manifest.benchmark.ticker;
const benchmark = raw.series?.[benchmarkTicker];
if (!benchmark) throw new Error('missing benchmark price series');
const benchmarkRows = benchmark.adjusted ?? benchmark;
const benchmarkDates = benchmarkRows.map((r) => r.date);

const memoByPath = {};
for (const f of lock.files.filter((x) => x.role === 'memo')) {
  memoByPath[f.path] = readJson(path.resolve(root, f.path));
}

const protectedEntries = new Map();
function protect(ticker, date) {
  if (!protectedEntries.has(ticker)) protectedEntries.set(ticker, new Set());
  protectedEntries.get(ticker).add(date);
}
for (const selection of manifest.selections ?? []) {
  const memo = memoByPath[selection.memoPath];
  if (!memo) continue;
  const isPrimary = (manifest.primarySelectionStates ?? []).includes(memo.selectionState);
  const anchor = (isPrimary ? memo.actionableAt : memo.researchReadyAt)?.slice(0, 10);
  if (!anchor) continue;
  const entryDate = benchmarkDates.find((d) => d > anchor);
  if (!entryDate) continue;
  protect(selection.ticker, entryDate);
  for (const control of memo.matchedControls ?? []) protect(control.ticker, entryDate);
}

function fillRows(rows, ticker, kind) {
  if (!Array.isArray(rows) || rows.length === 0) return { rows, fills: [] };
  const sorted = [...rows].sort((a,b) => a.date.localeCompare(b.date));
  const byDate = new Map(sorted.map((r) => [r.date, r]));
  const first = sorted[0].date;
  const last = sorted[sorted.length - 1].date;
  let prev = null;
  const result = [];
  const fills = [];
  for (const date of benchmarkDates) {
    if (date < first || date > last) continue;
    const actual = byDate.get(date);
    if (actual) {
      result.push(actual);
      prev = actual;
      continue;
    }
    if (!prev) continue;
    if (protectedEntries.get(ticker)?.has(date)) {
      throw new Error(`${ticker} is suspended/missing on protected entry date ${date}; refusing synthetic entry`);
    }
    const px = prev.close;
    const synthetic = {
      date,
      open:px, close:px, high:px, low:px, volume:0,
      syntheticSuspensionFill:true
    };
    result.push(synthetic);
    prev = synthetic;
    fills.push(date);
  }
  // Preserve any non-benchmark rows outside/already not represented only if needed is unnecessary:
  // evaluator operates on benchmark trading dates.
  return { rows:result, fills };
}

const output = JSON.parse(JSON.stringify(raw));
output.adjustmentPolicy = (raw.adjustmentPolicy ?? '') + ' | post-lock diagnostic suspension mark-to-market fill';
output.postLockDiagnostic = {
  type:'suspension_mark_to_market_fill',
  rawPricePath:path.relative(root, path.resolve(rawPath)).replaceAll(path.sep,'/'),
  note:'Missing internal benchmark trading dates are forward-filled at prior close with zero volume. Entry dates are never synthesized.'
};

const audit = {
  schemaVersion:'1.0',
  runId:lock.runId,
  diagnosticOnly:true,
  samePeriodMayTuneSkill:false,
  policy:'Forward-fill only internal missing benchmark dates between the instrument first/last actual bars. Never synthesize an entry date. Synthetic rows are mark-to-market only and not evidence of executable trading.',
  tickers:{}
};

for (const [ticker, series] of Object.entries(raw.series ?? {})) {
  if (ticker === benchmarkTicker) continue;
  const adj = fillRows(series.adjusted ?? series, ticker, 'adjusted');
  const unadj = fillRows(series.unadjusted ?? series.adjusted ?? series, ticker, 'unadjusted');
  output.series[ticker] = {
    ...series,
    adjusted:adj.rows,
    unadjusted:unadj.rows
  };
  const allDates = [...new Set([...adj.fills, ...unadj.fills])].sort();
  audit.tickers[ticker] = {
    syntheticDateCount:allDates.length,
    syntheticDates:allDates,
    protectedEntryDates:[...(protectedEntries.get(ticker) ?? [])].sort()
  };
}

writeJson(outPath, output);
writeJson(auditPath, audit);
console.log(outPath);
console.log(auditPath);
