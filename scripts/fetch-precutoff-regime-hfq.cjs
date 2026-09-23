const fs = require('node:fs');
const path = require('node:path');

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

function parseTencent(response, symbol, allowIndexFallback = false) {
  const node = response?.data?.[symbol];
  const rows = node?.hfqday ?? (allowIndexFallback ? node?.day : undefined);
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`Tencent returned no rows for ${symbol}`);
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
    headers: { 'User-Agent': 'stock-rador-regime-hfq/1.3' },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

function trailingReturn(rows, cutoffDate, tradingDays) {
  const usable = rows.filter((row) => row.date <= cutoffDate);
  if (usable.length <= tradingDays) {
    throw new Error(`need at least ${tradingDays + 1} rows through ${cutoffDate}`);
  }
  const end = usable.at(-1);
  const start = usable[usable.length - 1 - tradingDays];
  if (!(start.close > 0) || !(end.close > 0)) throw new Error('non-positive close');
  return {
    startDate: start.date,
    endDate: end.date,
    return: end.close / start.close - 1
  };
}

function mean(values) {
  return values.reduce((sum, x) => sum + x, 0) / values.length;
}

function classifyPriceRegime(metrics) {
  const favorable =
    metrics.lookback20Excess >= 0 &&
    metrics.lookback60Excess >= 0 &&
    metrics.positiveBreadth20 >= 0.5 &&
    metrics.positiveBreadth60 >= 0.5;
  const adverse =
    metrics.lookback20Excess < 0 &&
    metrics.lookback60Excess < 0 &&
    metrics.positiveBreadth20 < 0.5 &&
    metrics.positiveBreadth60 < 0.5;
  if (favorable) return 'favorable';
  if (adverse) return 'adverse';
  return 'neutral';
}

async function main() {
  const configPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!configPath || !outputPath) {
    console.error('Usage: node scripts/fetch-precutoff-regime.cjs <config.json> <output.json>');
    process.exit(2);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.cutoffDate ?? '')) throw new Error('cutoffDate must be YYYY-MM-DD');
  if (!Array.isArray(config.opportunityTickers) || config.opportunityTickers.length < 2) {
    throw new Error('opportunityTickers must contain at least 2 frozen names');
  }
  const benchmarkTicker = config.benchmarkTicker ?? '000300.SH';
  const tickers = [...new Set([benchmarkTicker, ...config.opportunityTickers])];
  const start = addDays(config.cutoffDate, -180);
  const series = {};
  const sourceUrls = {};

  for (const ticker of tickers) {
    const symbol = tickerToTencent(ticker);
    const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,${start},${config.cutoffDate},300,hfq`;
    const response = await fetchJson(url);
    series[ticker] = parseTencent(response, symbol, ticker === benchmarkTicker);
    sourceUrls[ticker] = url;
  }

  const horizons = [20, 60];
  const benchmark = {};
  const names = {};
  for (const n of horizons) {
    benchmark[n] = trailingReturn(series[benchmarkTicker], config.cutoffDate, n);
    names[n] = config.opportunityTickers.map((ticker) => {
      const item = trailingReturn(series[ticker], config.cutoffDate, n);
      return {
        ticker,
        startDate: item.startDate,
        endDate: item.endDate,
        return: item.return,
        benchmarkReturn: benchmark[n].return,
        excessReturn: item.return - benchmark[n].return
      };
    });
  }

  const metrics = {
    lookback20Excess: mean(names[20].map((x) => x.excessReturn)),
    lookback60Excess: mean(names[60].map((x) => x.excessReturn)),
    positiveBreadth20: names[20].filter((x) => x.excessReturn > 0).length / names[20].length,
    positiveBreadth60: names[60].filter((x) => x.excessReturn > 0).length / names[60].length
  };

  const output = {
    schemaVersion: '1.0',
    snapshotId: config.snapshotId ?? path.basename(configPath, '.json'),
    cutoffDate: config.cutoffDate,
    fetchedAt: new Date().toISOString(),
    provider: 'Tencent public daily hfq kline',
    benchmarkTicker,
    opportunityTickers: config.opportunityTickers,
    methodology: {
      lookbacksTradingDays: horizons,
      basketStatistic: 'equal_weight_mean',
      breadthDefinition: 'fraction of frozen opportunity names with positive benchmark-relative trailing return',
      cutoffGuard: 'all bars are requested no later than cutoffDate',
      adjustmentPolicy: 'backward-adjusted (hfq) series is used to preserve corporate-action-adjusted historical returns and avoid negative long-history qfq levels; no post-cutoff bars are requested',
      favorableRule: '20d and 60d basket excess >= 0 and both breadth >= 0.5',
      adverseRule: '20d and 60d basket excess < 0 and both breadth < 0.5',
      otherwise: 'neutral'
    },
    benchmark,
    names,
    metrics,
    conclusion: classifyPriceRegime(metrics),
    sourceUrls
  };

  const absolute = path.resolve(outputPath);
  if (fs.existsSync(absolute)) throw new Error(`refusing to overwrite existing snapshot ${absolute}`);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(absolute);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { classifyPriceRegime, trailingReturn };
