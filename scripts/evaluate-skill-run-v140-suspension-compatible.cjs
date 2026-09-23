const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { evaluateRun, readJson, verifyLock } = require('./backtest-core-v140.cjs');

function carryForwardSuspensions(prices, benchmarkTicker) {
  const out = structuredClone(prices);
  const benchmark = out?.series?.[benchmarkTicker]?.adjusted;
  if (!Array.isArray(benchmark)) throw new Error('missing benchmark adjusted series');
  const benchmarkDates = benchmark.map((r) => r.date);
  const patches = [];

  for (const [ticker, node] of Object.entries(out.series ?? {})) {
    if (ticker === benchmarkTicker) continue;
    const adjusted = node?.adjusted;
    const unadjusted = node?.unadjusted;
    if (!Array.isArray(adjusted) || !Array.isArray(unadjusted)) continue;
    const adjustedByDate = new Map(adjusted.map((r) => [r.date, r]));
    const rawDates = new Set(unadjusted.map((r) => r.date));
    const minDate = adjusted[0]?.date;
    const maxDate = adjusted.at(-1)?.date;
    if (!minDate || !maxDate) continue;

    let previous = null;
    const filled = [];
    for (const date of benchmarkDates) {
      if (date < minDate || date > maxDate) continue;
      const actual = adjustedByDate.get(date);
      if (actual) {
        previous = actual;
        filled.push(actual);
        continue;
      }
      if (rawDates.has(date)) {
        throw new Error(`${ticker} adjusted series missing ${date} while raw bar exists; refusing synthetic fill`);
      }
      if (!previous) throw new Error(`${ticker} cannot carry forward missing ${date} without prior adjusted close`);
      const synthetic = {
        date,
        open: previous.close,
        close: previous.close,
        high: previous.close,
        low: previous.close,
        volume: 0,
        syntheticSuspensionCarry: true
      };
      filled.push(synthetic);
      previous = synthetic;
      patches.push({ticker,date,reason:'missing in adjusted and raw series on benchmark trading day; carried prior adjusted close for path accounting only'});
    }
    const before = adjusted.filter((r)=>r.date < minDate);
    const after = adjusted.filter((r)=>r.date > maxDate);
    node.adjusted = [...before,...filled,...after].sort((a,b)=>a.date.localeCompare(b.date));
  }
  return {prices:out,patches};
}

const lockPath = process.argv[2];
const pricesPath = process.argv[3];
const outputPath = process.argv[4];
if (!lockPath || !pricesPath || !outputPath) {
  console.error('Usage: node scripts/evaluate-skill-run-v140-suspension-compatible.cjs <lock.json> <prices.json> <outcome.json>');
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
  const frozenPrices = readJson(pricesPath);
  const compatible = carryForwardSuspensions(frozenPrices, manifest.benchmark.ticker);
  const evaluated = evaluateRun(manifest, memosByPath, compatible.prices);
  const output = {
    schemaVersion:'1.1',
    evaluatorVersion:'1.4-hypothesis-resolution-suspension-compatible',
    runId:lock.runId,
    evaluatedAt:new Date().toISOString(),
    frozenLockSha256:crypto.createHash('sha256').update(fs.readFileSync(lockPath)).digest('hex'),
    priceSource:{provider:frozenPrices.provider??null,fetchedAt:frozenPrices.fetchedAt??null,path:path.relative(root,path.resolve(pricesPath)).replaceAll(path.sep,'/')},
    compatibilityPatch:{
      type:'suspension_carry_forward_for_path_accounting_only',
      selectionAndHorizonChanges:false,
      returnEndpointsChanged:false,
      patches:compatible.patches
    },
    ...evaluated
  };
  if (fs.existsSync(outputPath)) throw new Error(`refusing to overwrite existing outcome ${outputPath}`);
  fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n','utf8');
  console.log(outputPath);
} catch (error) {
  console.error(error.message);
  process.exitCode=1;
}
