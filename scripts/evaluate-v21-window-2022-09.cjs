const fs = require('node:fs');
const path = require('node:path');
const { backtestEvent } = require('../src/strict-event-backtest');

const LOCK = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'frozen', 'v21_2022_09_selection.json'), 'utf8'));
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'v21_window_2022_09.json'), 'utf8'));
const OUTPUT_JSON = path.join(__dirname, '..', 'research', 'v21_2022_09_outcomes.json');
const OUTPUT_MD = path.join(__dirname, '..', 'research', 'v21_2022_09_outcomes.md');

const HORIZONS = [20, 60, 120, 250];
const PRICE_START = '2022-08-01';
const PRICE_END = '2023-10-31';
const BENCHMARK = { symbol: 'sh000300', ticker: '000300.SH', name: '沪深300' };
const COST = 0.001;

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

function url(symbol, adjustment) {
  return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,${PRICE_START},${PRICE_END},500,${adjustment}`;
}

function parse(response, symbol, adjustment, isIndex = false) {
  const node = response?.data?.[symbol];
  const key = adjustment === 'qfq' ? 'qfqday' : 'day';
  const rows = node?.[key] ?? (isIndex ? node?.day : undefined);
  if (!Array.isArray(rows) || rows.length < 2) throw new Error(`Missing ${key} for ${symbol}`);
  return rows.map((row) => ({
    date: row[0],
    open: Number(row[1]),
    close: Number(row[2]),
    high: Number(row[3]),
    low: Number(row[4]),
    volume: Number(row[5])
  })).filter((bar) => [bar.open, bar.close, bar.high, bar.low, bar.volume].every(Number.isFinite));
}

function metaFor(ticker) {
  for (const lead of CONFIG.leads) {
    const found = lead.candidates.find((candidate) => candidate.ticker === ticker);
    if (found) return found;
  }
  throw new Error(`Missing candidate metadata for ${ticker}`);
}

function round(value, digits = 6) {
  return value === null || value === undefined ? value : Number(value.toFixed(digits));
}

function pct(value) {
  return value === null || value === undefined ? 'n/a' : `${(value * 100).toFixed(1)}%`;
}

function maxDrawdownFromEntry(bars, entryDate, exitDate, entryPrice) {
  const slice = bars.filter((bar) => bar.date >= entryDate && bar.date <= exitDate);
  return slice.length ? Math.min(...slice.map((bar) => bar.low / entryPrice - 1), 0) : null;
}

function evaluateOne(locked, lead, market, benchmarkBars, role) {
  const data = market[locked.ticker];
  const bars = data.adjusted.map((bar) => ({ ...bar, limitRate: data.meta.limitRate }));
  const executionBars = data.unadjusted.map((bar) => ({ ...bar, limitRate: data.meta.limitRate }));
  const horizons = {};
  for (const days of HORIZONS) {
    const result = backtestEvent({
      bars,
      executionBars,
      benchmarkBars,
      signalDate: lead.signalDate,
      holdingTradingDays: days,
      buyCostRate: COST,
      sellCostRate: COST
    });
    horizons[String(days)] = result.status === 'executed'
      ? {
          status: 'executed',
          entryDate: result.entryDate,
          exitDate: result.exitDate,
          netReturn: round(result.netReturn),
          benchmarkReturn: round(result.benchmarkReturn),
          excessReturn: round(result.excessReturn),
          maxDrawdownFromEntry: round(maxDrawdownFromEntry(
            bars, result.entryDate, result.exitDate, result.entryPrice
          ))
        }
      : {
          status: result.status,
          reason: result.reason ?? result.entryExecution?.reason ?? result.exitExecution?.reason ?? null,
          entryDate: result.entryDate ?? null,
          exitDate: result.exitDate ?? null
        };
  }
  return {
    ticker: locked.ticker,
    name: locked.name,
    lockedScore: locked.score,
    role,
    horizons
  };
}

async function main() {
  if (LOCK.outcomeDataPresent !== false) throw new Error('Lock must be outcome-free');

  const locked = new Map();
  for (const lead of LOCK.leads) {
    for (const row of lead.candidateBasket ?? []) locked.set(row.ticker, row);
    for (const row of lead.watch ?? []) locked.set(row.ticker, row);
  }

  const market = {};
  for (const ticker of locked.keys()) {
    const meta = metaFor(ticker);
    const [qfq, raw] = await Promise.all([
      fetchJson(url(meta.symbol, 'qfq')),
      fetchJson(url(meta.symbol, 'none'))
    ]);
    market[ticker] = {
      meta,
      adjusted: parse(qfq, meta.symbol, 'qfq'),
      unadjusted: parse(raw, meta.symbol, 'none')
    };
  }

  const benchmarkResponse = await fetchJson(url(BENCHMARK.symbol, 'none'));
  const benchmarkBars = parse(benchmarkResponse, BENCHMARK.symbol, 'none', true);

  const leads = LOCK.leads.map((lead) => {
    const selected = (lead.candidateBasket ?? []).map((row) =>
      evaluateOne(row, lead, market, benchmarkBars, row.ticker === lead.primaryPick?.ticker ? 'primary' : 'selected'));
    const watchDiagnostics = (lead.watch ?? []).map((row) =>
      evaluateOne(row, lead, market, benchmarkBars, 'watch-diagnostic'));

    const selectedBasket = {};
    for (const days of HORIZONS) {
      const hs = selected.map((row) => row.horizons[String(days)]);
      if (!hs.length) {
        selectedBasket[String(days)] = { status: 'no_trade' };
      } else if (hs.some((h) => h.status !== 'executed')) {
        selectedBasket[String(days)] = { status: 'incomplete' };
      } else {
        selectedBasket[String(days)] = {
          status: 'executed',
          constituentCount: hs.length,
          equalWeightNetReturn: round(hs.reduce((sum, h) => sum + h.netReturn, 0) / hs.length),
          benchmarkReturn: round(hs[0].benchmarkReturn),
          equalWeightExcessReturn: round(hs.reduce((sum, h) => sum + h.excessReturn, 0) / hs.length),
          worstConstituentDrawdown: round(Math.min(...hs.map((h) => h.maxDrawdownFromEntry)))
        };
      }
    }

    return {
      id: lead.id,
      signalDate: lead.signalDate,
      frozenPrimaryPick: lead.primaryPick ?? null,
      selected,
      selectedBasket,
      watchDiagnostics,
      frozenNoTrade: (lead.candidateBasket ?? []).length === 0
    };
  });

  const output = {
    schemaVersion: '2.1',
    windowId: LOCK.windowId,
    generatedAt: new Date().toISOString(),
    selectionChangedAfterOutcome: false,
    note: 'Only rows in candidateBasket count as strategy selections. Watch outcomes are diagnostics and do not count as trades.',
    assumptions: {
      benchmark: BENCHMARK,
      entry: 'T+1 open',
      costPerSide: COST,
      horizonsTradingDays: HORIZONS,
      adjustedReturns: true,
      unadjustedExecutionChecks: true
    },
    leads
  };

  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(output, null, 2)}\n`);

  const sections = leads.map((lead) => {
    const selectedRows = lead.selected.length
      ? lead.selected.map((row) => {
          const cells = HORIZONS.map((days) => {
            const h = row.horizons[String(days)];
            return h.status === 'executed'
              ? `${pct(h.excessReturn)} (DD ${pct(h.maxDrawdownFromEntry)})`
              : h.status;
          });
          return `| ${row.role === 'primary' ? '**' : ''}${row.name}${row.role === 'primary' ? '**' : ''} | ${row.lockedScore} | ${cells.join(' | ')} |`;
        }).join('\n')
      : '| — | — | no_trade | no_trade | no_trade | no_trade |';

    const watchRows = lead.watchDiagnostics.length
      ? lead.watchDiagnostics.map((row) => {
          const cells = HORIZONS.map((days) => {
            const h = row.horizons[String(days)];
            return h.status === 'executed'
              ? `${pct(h.excessReturn)}`
              : h.status;
          });
          return `| ${row.name} | ${row.lockedScore} | ${cells.join(' | ')} |`;
        }).join('\n')
      : '| — | — | — | — | — | — |';

    const basketCells = HORIZONS.map((days) => {
      const h = lead.selectedBasket[String(days)];
      return h.status === 'executed' ? pct(h.equalWeightExcessReturn) : h.status;
    }).join(' | ');

    return `## ${lead.id}

| Frozen selected candidate | Score | 20d excess | 60d excess | 120d excess | 250d excess |
| --- | ---: | ---: | ---: | ---: | ---: |
${selectedRows}
| Equal-weight selected basket | — | ${basketCells} |

Watch rows below are opportunity-cost diagnostics only:

| Watch candidate | Score | 20d excess | 60d excess | 120d excess | 250d excess |
| --- | ---: | ---: | ---: | ---: | ---: |
${watchRows}
`;
  }).join('\n');

  fs.writeFileSync(OUTPUT_MD, `# V2.1 September 2022 outcome evaluation

The selection lock was committed before this evaluator existed. No post-signal result can change the frozen selection.

Trading assumptions: T+1 open, 0.10% cost per side, adjusted prices for returns, unadjusted daily bars for suspension/one-price limit blockers, CSI 300 benchmark.

${sections}`);

  console.log(JSON.stringify(leads, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
