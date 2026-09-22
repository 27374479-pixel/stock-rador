const fs = require('node:fs');
const path = require('node:path');
const { backtestEvent } = require('../src/strict-event-backtest');

const LOCK_PATH = path.join(__dirname, '..', 'frozen', 'v2_2022_03_selection.json');
const CONFIG_PATH = path.join(__dirname, '..', 'config', 'v2_window_2022_03.json');
const OUTPUT_JSON = path.join(__dirname, '..', 'research', 'v2_2022_03_outcomes.json');
const OUTPUT_MD = path.join(__dirname, '..', 'research', 'v2_2022_03_outcomes.md');
const LOCK = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const HORIZONS = [20, 60, 120, 250];
const PRICE_START = '2022-02-01';
const PRICE_END = '2023-06-30';
const BUY_COST = 0.001;
const SELL_COST = 0.001;
const BENCHMARK = { symbol: 'sh000300', ticker: '000300.SH', name: '沪深300' };

function round(value, digits = 6) {
  return value === null || value === undefined ? value : Number(value.toFixed(digits));
}

function pct(value) {
  return value === null || value === undefined ? 'n/a' : `${(value * 100).toFixed(1)}%`;
}

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

function candidateMeta(ticker) {
  for (const lead of CONFIG.leads) {
    const candidate = lead.candidates.find((row) => row.ticker === ticker);
    if (candidate) return candidate;
  }
  throw new Error(`No config candidate for ${ticker}`);
}

function maxDrawdownFromEntry(bars, entryDate, exitDate, entryPrice) {
  const slice = bars.filter((bar) => bar.date >= entryDate && bar.date <= exitDate);
  if (!slice.length) return null;
  let trough = 0;
  for (const bar of slice) trough = Math.min(trough, bar.low / entryPrice - 1);
  return trough;
}

async function main() {
  if (LOCK.outcomeDataPresent !== false || LOCK.windowId !== 'v2-2022-03') {
    throw new Error('Selection lock is missing or already contains outcomes');
  }

  const lockedCandidates = new Map();
  for (const lead of LOCK.leads) {
    for (const candidate of lead.candidateBasket) lockedCandidates.set(candidate.ticker, candidate);
  }

  const market = {};
  for (const ticker of lockedCandidates.keys()) {
    const meta = candidateMeta(ticker);
    const [adjustedResponse, rawResponse] = await Promise.all([
      fetchJson(url(meta.symbol, 'qfq')),
      fetchJson(url(meta.symbol, 'none'))
    ]);
    market[ticker] = {
      adjusted: parse(adjustedResponse, meta.symbol, 'qfq'),
      unadjusted: parse(rawResponse, meta.symbol, 'none'),
      meta
    };
  }

  const benchmarkResponse = await fetchJson(url(BENCHMARK.symbol, 'none'));
  const benchmarkBars = parse(benchmarkResponse, BENCHMARK.symbol, 'none', true);

  const leads = LOCK.leads.map((lead) => {
    const evaluated = lead.candidateBasket.map((locked) => {
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
          buyCostRate: BUY_COST,
          sellCostRate: SELL_COST
        });
        if (result.status === 'executed') {
          horizons[String(days)] = {
            status: result.status,
            entryDate: result.entryDate,
            exitDate: result.exitDate,
            netReturn: round(result.netReturn),
            benchmarkReturn: round(result.benchmarkReturn),
            excessReturn: round(result.excessReturn),
            maxDrawdownFromEntry: round(maxDrawdownFromEntry(
              bars, result.entryDate, result.exitDate, result.entryPrice
            ))
          };
        } else {
          horizons[String(days)] = {
            status: result.status,
            reason: result.reason ?? result.entryExecution?.reason ?? result.exitExecution?.reason ?? null,
            entryDate: result.entryDate ?? null,
            exitDate: result.exitDate ?? null
          };
        }
      }
      return {
        ticker: locked.ticker,
        name: locked.name,
        lockedScore: locked.score,
        isPrimaryPick: lead.primaryPick?.ticker === locked.ticker,
        horizons
      };
    });

    const basket = {};
    for (const days of HORIZONS) {
      const valid = evaluated.map((row) => row.horizons[String(days)]).filter((h) => h.status === 'executed');
      if (valid.length !== evaluated.length || !valid.length) {
        basket[String(days)] = { status: 'incomplete' };
      } else {
        basket[String(days)] = {
          status: 'executed',
          constituentCount: valid.length,
          equalWeightNetReturn: round(valid.reduce((sum, h) => sum + h.netReturn, 0) / valid.length),
          benchmarkReturn: round(valid[0].benchmarkReturn),
          equalWeightExcessReturn: round(valid.reduce((sum, h) => sum + h.excessReturn, 0) / valid.length),
          worstConstituentDrawdown: round(Math.min(...valid.map((h) => h.maxDrawdownFromEntry)))
        };
      }
    }
    return { ...lead, evaluation: evaluated, candidateBasketEvaluation: basket };
  });

  const output = {
    schemaVersion: '2.0',
    windowId: LOCK.windowId,
    generatedAt: new Date().toISOString(),
    selectionLock: {
      artifactDigest: LOCK.sourceArtifact?.artifactDigest ?? null,
      lockRule: LOCK.rule,
      outcomeDataPresentAtLock: LOCK.outcomeDataPresent
    },
    assumptions: {
      benchmark: BENCHMARK,
      entry: 'T+1 open',
      buyCostRate: BUY_COST,
      sellCostRate: SELL_COST,
      horizonsTradingDays: HORIZONS,
      adjustedReturns: true,
      unadjustedExecutionChecks: true
    },
    leads
  };

  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(output, null, 2)}\n`);

  const sections = leads.map((lead) => {
    const rows = lead.evaluation.map((row) => {
      const cells = HORIZONS.map((days) => {
        const h = row.horizons[String(days)];
        if (h.status !== 'executed') return h.status;
        return `${pct(h.excessReturn)} (DD ${pct(h.maxDrawdownFromEntry)})`;
      });
      return `| ${row.isPrimaryPick ? '**' : ''}${row.name}${row.isPrimaryPick ? '**' : ''} | ${row.lockedScore} | ${cells.join(' | ')} |`;
    }).join('\n');
    const basketCells = HORIZONS.map((days) => {
      const h = lead.candidateBasketEvaluation[String(days)];
      return h.status === 'executed' ? pct(h.equalWeightExcessReturn) : h.status;
    }).join(' | ');
    return `## ${lead.id}

Signal date: ${lead.signalDate}

| Locked candidate | Score | 20d excess | 60d excess | 120d excess | 250d excess |
| --- | ---: | ---: | ---: | ---: | ---: |
${rows}
| Equal-weight locked basket | — | ${basketCells} |
`;
  }).join('\n');

  fs.writeFileSync(OUTPUT_MD, `# V2 March 2022 outcome evaluation

Selections came exclusively from \`frozen/v2_2022_03_selection.json\`, which was committed before this evaluator was added. The output therefore does not alter the historical selection.

Trading assumptions: T+1 open, 0.10% cost each side, adjusted prices for returns, unadjusted daily bars for suspension/one-price price-limit blockers, CSI 300 benchmark. DD is max drawdown from entry during that horizon.

${sections}`);

  console.log(JSON.stringify(leads.map((lead) => ({
    id: lead.id,
    primaryPick: lead.primaryPick,
    primaryOutcomes: lead.evaluation.find((row) => row.isPrimaryPick)?.horizons,
    basket: lead.candidateBasketEvaluation
  })), null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
