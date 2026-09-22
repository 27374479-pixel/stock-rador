const fs = require('node:fs');
const path = require('node:path');
const { readJson, verifyLock } = require('./backtest-core.cjs');

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function tickerToTencent(ticker) {
  const match = /^(\d{6})\.(SH|SZ)$/.exec(ticker);
  if (!match) throw new Error(`unsupported ticker ${ticker}`);
  return `${match[2] === 'SH' ? 'sh' : 'sz'}${match[1]}`;
}

function parseTencent(response, symbol, adjusted, allowIndexFallback = false) {
  const node = response?.data?.[symbol];
  const key = adjusted ? 'qfqday' : 'day';
  const rows = node?.[key] ?? (adjusted && allowIndexFallback ? node?.day : undefined);
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`Tencent returned no ${key} rows for ${symbol}`);
  return rows.map((row) => ({
    date: row[0],
    open: Number(row[1]),
    close: Number(row[2]),
    high: Number(row[3]),
    low: Number(row[4]),
    volume: Number(row[5])
  }));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'stock-rador-backtest/0.2' },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

function tencentUrl(symbol, start, end, adjustment) {
  return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,${start},${end},400,${adjustment}`;
}

async function main() {
  const lockPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!lockPath || !outputPath) {
    console.error('Usage: node scripts/fetch-backtest-prices.cjs <lock.json> <prices.json>');
    process.exit(2);
  }

  const root = process.cwd();
  const lock = readJson(lockPath);
  const mismatches = verifyLock(lock, root);
  if (mismatches.length) throw new Error(`refusing outcome reveal because frozen run changed:\n- ${mismatches.join('\n- ')}`);

  const manifestEntry = lock.files.find((file) => file.role === 'manifest');
  if (!manifestEntry) throw new Error('lock missing manifest');
  const manifest = readJson(path.resolve(root, manifestEntry.path));

  const memoFiles = Object.fromEntries(lock.files.filter((file) => file.role === 'memo').map((file) => [
    file.path,
    readJson(path.resolve(root, file.path))
  ]));
  const cutoffDates = manifest.selections.map((selection) => memoFiles[selection.memoPath]?.cutoffAt?.slice(0, 10));
  if (cutoffDates.some((date) => !/^\d{4}-\d{2}-\d{2}$/.test(date || ''))) throw new Error('invalid memo cutoff date');
  const anchorDates = cutoffDates.length ? cutoffDates : [manifest.discoveryWindow.endDate];

  const start = addDays([...anchorDates].sort()[0], -15);
  const memoHorizons = Object.values(memoFiles).flatMap((memo) => {
    const r = memo.expectedRealization;
    return r ? [r.earliestTradingDays, r.baseTradingDays, r.latestTradingDays] : [];
  });
  const maxTradingDays = Math.max(...manifest.outcomePolicy.holdingTradingDays, ...memoHorizons);
  const end = addDays([...anchorDates].sort().at(-1), maxTradingDays * 2 + 45);
  const controlTickers = Object.values(memoFiles).flatMap((memo) =>
    Array.isArray(memo.matchedControls) ? memo.matchedControls.map((control) => control.ticker).filter(Boolean) : []
  );
  const tickers = [...new Set([
    manifest.benchmark.ticker,
    ...manifest.selections.map((selection) => selection.ticker),
    ...controlTickers
  ])];
  const fetchedAt = new Date().toISOString();
  const series = {};

  for (const ticker of tickers) {
    const symbol = tickerToTencent(ticker);
    const isBenchmark = ticker === manifest.benchmark.ticker;
    const adjustedUrl = tencentUrl(symbol, start, end, 'qfq');
    const adjustedResponse = await fetchJson(adjustedUrl);
    const adjusted = parseTencent(adjustedResponse, symbol, true, isBenchmark);

    if (isBenchmark) {
      series[ticker] = {
        adjusted,
        source: { provider: 'Tencent', adjustedUrl, adjustedSeriesKey: adjustedResponse?.data?.[symbol]?.qfqday ? 'qfqday' : 'day' }
      };
      continue;
    }

    const unadjustedUrl = tencentUrl(symbol, start, end, 'none');
    const unadjustedResponse = await fetchJson(unadjustedUrl);
    const unadjusted = parseTencent(unadjustedResponse, symbol, false);
    series[ticker] = {
      adjusted,
      unadjusted,
      source: { provider: 'Tencent', adjustedUrl, unadjustedUrl, adjustedSeriesKey: 'qfqday', unadjustedSeriesKey: 'day' }
    };
  }

  const output = {
    schemaVersion: '1.0',
    runId: lock.runId,
    provider: 'Tencent public daily kline',
    fetchedAt,
    revealGuard: {
      lockVerifiedBeforeNetworkFetch: true,
      lockedAt: lock.lockedAt,
      frozenCandidateCount: lock.candidateCount
    },
    requestedWindow: { startDate: start, endDate: end },
    series
  };

  const absoluteOutput = path.resolve(outputPath);
  if (fs.existsSync(absoluteOutput)) throw new Error(`refusing to overwrite existing prices ${absoluteOutput}`);
  fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
  fs.writeFileSync(absoluteOutput, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(absoluteOutput);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { addDays, parseTencent, tickerToTencent };
