const fs = require('node:fs');
const path = require('node:path');
const { readJson, verifyLock } = require('./backtest-core-v180.cjs');

function protectedDatesFromRun(lock, manifest, memosByPath, benchmarkRows) {
  const protectedDates = new Set();
  const standardHorizons = manifest.outcomePolicy.holdingTradingDays;
  for (const selection of manifest.selections) {
    const memo = memosByPath[selection.memoPath];
    const anchor = (memo.selectionState === 'High-priority selection' ? memo.actionableAt : memo.researchReadyAt).slice(0, 10);
    const entryIndex = benchmarkRows.findIndex((row) => row.date > anchor);
    if (entryIndex < 0) continue;
    protectedDates.add(benchmarkRows[entryIndex].date);
    const r = memo.expectedRealization;
    const horizons = [...new Set([...standardHorizons, r.earliestTradingDays, r.baseTradingDays, r.latestTradingDays])];
    for (const h of horizons) {
      const exit = benchmarkRows[entryIndex + h - 1];
      if (exit) protectedDates.add(exit.date);
    }
  }
  return protectedDates;
}

function alignInteriorSuspensions(prices, protectedDates) {
  const out = JSON.parse(JSON.stringify(prices));
  const benchmarkTicker = Object.keys(out.series).find((ticker) => ticker === '000300.SH') ?? Object.keys(out.series)[0];
  const benchmark = out.series[benchmarkTicker]?.adjusted ?? out.series[benchmarkTicker];
  const benchmarkDates = benchmark.map((row) => row.date);

  for (const [ticker, node] of Object.entries(out.series)) {
    if (ticker === benchmarkTicker) continue;
    const rows = node.adjusted ?? node;
    if (!Array.isArray(rows) || rows.length < 2) continue;
    const map = new Map(rows.map((row) => [row.date, row]));
    const first = rows[0].date;
    const last = rows.at(-1).date;
    const filled = [];
    let prev = null;
    for (const date of benchmarkDates) {
      if (date < first || date > last) continue;
      const actual = map.get(date);
      if (actual) {
        const clean = { ...actual, syntheticSuspensionCarry: false };
        filled.push(clean);
        prev = clean;
        continue;
      }
      if (!prev || protectedDates.has(date)) continue;
      filled.push({
        date,
        open: prev.close,
        close: prev.close,
        high: prev.close,
        low: prev.close,
        volume: 0,
        syntheticSuspensionCarry: true
      });
    }
    node.adjusted = filled;
    node.suspensionFillPolicy = {
      method: 'interior_forward_fill_only',
      protectedTradeDatesNotFilled: [...protectedDates].sort(),
      syntheticRowCount: filled.filter((row) => row.syntheticSuspensionCarry).length
    };
  }
  out.suspensionAdjustment = {
    policy: 'Only interior benchmark-calendar suspension gaps are forward-filled at the prior actual close. Entry and target exit dates are protected and never synthesized.',
    preparedAt: new Date().toISOString()
  };
  return out;
}

function main() {
  const [lockPath, pricesPath, outputPath] = process.argv.slice(2);
  if (!lockPath || !pricesPath || !outputPath) {
    console.error('Usage: node scripts/prepare-suspension-aware-prices.cjs <lock.json> <prices.raw.json> <prices.json>');
    process.exit(2);
  }
  const root = process.cwd();
  const lock = readJson(lockPath);
  const mismatches = verifyLock(lock, root);
  if (mismatches.length) throw new Error('frozen run was modified after lock:\n- ' + mismatches.join('\n- '));
  const manifestEntry = lock.files.find((file) => file.role === 'manifest');
  const manifest = readJson(path.resolve(root, manifestEntry.path));
  const memosByPath = {};
  for (const file of lock.files.filter((item) => item.role === 'memo')) {
    memosByPath[file.path] = readJson(path.resolve(root, file.path));
  }
  const prices = readJson(pricesPath);
  const benchmarkNode = prices.series[manifest.benchmark.ticker];
  const benchmarkRows = benchmarkNode.adjusted ?? benchmarkNode;
  const protectedDates = protectedDatesFromRun(lock, manifest, memosByPath, benchmarkRows);
  const aligned = alignInteriorSuspensions(prices, protectedDates);
  const absolute = path.resolve(outputPath);
  if (fs.existsSync(absolute)) throw new Error('refusing to overwrite existing suspension-aware prices ' + absolute);
  fs.writeFileSync(absolute, JSON.stringify(aligned, null, 2) + '\n', 'utf8');
  console.log(absolute);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { alignInteriorSuspensions, protectedDatesFromRun };
