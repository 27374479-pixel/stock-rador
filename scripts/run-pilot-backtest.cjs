const fs = require('node:fs');
const path = require('node:path');
const { backtestEvent } = require('../src/strict-event-backtest');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'pilot_cases.json');
const OUTPUT_JSON = path.join(__dirname, '..', 'research', 'pilot_backtest.json');
const OUTPUT_MD = path.join(__dirname, '..', 'research', 'pilot_backtest.md');
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

function round(value, digits = 6) {
  return value === null || value === undefined ? value : Number(value.toFixed(digits));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

const PRICE_CHUNKS = [
  ['2022-05-01', '2023-06-30'],
  ['2023-07-01', '2024-08-31'],
  ['2024-09-01', '2025-12-31']
];

function tencentUrl(symbol, adjustment, startDate, endDate) {
  return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,${startDate},${endDate},500,${adjustment}`;
}

function mergeRows(chunks) {
  const byDate = new Map();
  for (const rows of chunks) {
    for (const row of rows) byDate.set(row.date, row);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchSeries(symbol, adjustment, isIndex = false) {
  const chunks = [];
  const urls = [];
  for (const [startDate, endDate] of PRICE_CHUNKS) {
    const url = tencentUrl(symbol, adjustment, startDate, endDate);
    const response = await fetchJson(url);
    chunks.push(parseRows(response, symbol, adjustment, isIndex));
    urls.push(url);
  }
  const rows = mergeRows(chunks);
  if (rows[0]?.date > CONFIG.policy.priceStart || rows.at(-1)?.date < CONFIG.policy.priceEnd) {
    throw new Error(`Incomplete merged history for ${symbol}: ${rows[0]?.date}..${rows.at(-1)?.date}`);
  }
  return { rows, urls };
}

function parseRows(response, symbol, adjustment, isIndex = false) {
  const node = response?.data?.[symbol];
  const preferred = adjustment === 'qfq' ? 'qfqday' : 'day';
  const rows = node?.[preferred] ?? (isIndex ? node?.day : undefined);
  if (!Array.isArray(rows) || rows.length < 2) throw new Error(`No ${preferred} rows for ${symbol}`);
  return rows.map((row) => {
    const parsed = {
      date: row[0],
      open: Number(row[1]),
      close: Number(row[2]),
      high: Number(row[3]),
      low: Number(row[4]),
      volume: Number(row[5])
    };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ||
        ![parsed.open, parsed.close, parsed.high, parsed.low, parsed.volume].every(Number.isFinite)) {
      throw new Error(`Invalid row for ${symbol}: ${JSON.stringify(row)}`);
    }
    return parsed;
  });
}

function lastIndexOnOrBefore(rows, date) {
  let result = -1;
  for (let index = 0; index < rows.length; index += 1) {
    if (rows[index].date <= date) result = index;
    else break;
  }
  return result;
}

function trailingReturn(rows, signalDate, tradingDays) {
  const end = lastIndexOnOrBefore(rows, signalDate);
  const start = end - tradingDays;
  if (end < 0 || start < 0) return null;
  return rows[end].close / rows[start].close - 1;
}

function penaltyForCandidate(testCase, candidate, past) {
  const rules = CONFIG.policy.noveltyPenalty;
  const parts = [];
  let total = 0;
  if (testCase.themeSeenBefore) {
    total += rules.themeSeenBefore;
    parts.push({ reason: 'themeSeenBefore', penalty: rules.themeSeenBefore });
  }
  if (candidate.companyAlreadyDisclosedTheme) {
    total += rules.companyAlreadyDisclosedTheme;
    parts.push({ reason: 'companyAlreadyDisclosedTheme', penalty: rules.companyAlreadyDisclosedTheme });
  }
  if (past.prior60 !== null && past.prior60 > rules.prior60ReturnAbove.threshold) {
    total += rules.prior60ReturnAbove.penalty;
    parts.push({ reason: 'prior60ReturnAbove', penalty: rules.prior60ReturnAbove.penalty, value: past.prior60 });
  }
  if (past.prior180 !== null && past.prior180 > rules.prior180ReturnAbove.threshold) {
    total += rules.prior180ReturnAbove.penalty;
    parts.push({ reason: 'prior180ReturnAbove', penalty: rules.prior180ReturnAbove.penalty, value: past.prior180 });
  }
  return { total, parts };
}

function percent(value) {
  return value === null || value === undefined ? 'n/a' : `${(value * 100).toFixed(1)}%`;
}

function scoreCandidates(testCase, marketData) {
  return testCase.candidateUniverse.map((candidate) => {
    const data = marketData[candidate.symbol];
    const past = {
      prior60: trailingReturn(data.adjusted, testCase.signalDate, 60),
      prior180: trailingReturn(data.adjusted, testCase.signalDate, 180)
    };
    const penalty = penaltyForCandidate(testCase, candidate, past);
    const score = testCase.sourceQualityScore + candidate.pointInTimeExposureScore - penalty.total;
    return {
      ticker: candidate.ticker,
      symbol: candidate.symbol,
      name: candidate.name,
      sourceQualityScore: testCase.sourceQualityScore,
      pointInTimeExposureScore: candidate.pointInTimeExposureScore,
      past: { prior60: round(past.prior60), prior180: round(past.prior180) },
      noveltyPenalty: penalty,
      decisionScore: score,
      evidence: candidate.evidence
    };
  }).sort((a, b) => b.decisionScore - a.decisionScore || a.ticker.localeCompare(b.ticker));
}

function evaluateCandidate(testCase, candidate, marketData, benchmarkBars) {
  const data = marketData[candidate.symbol];
  const adjustedBars = data.adjusted.map((bar) => ({ ...bar, limitRate: candidate.limitRate }));
  const executionBars = data.unadjusted.map((bar) => ({ ...bar, limitRate: candidate.limitRate }));
  const horizons = {};
  for (const days of CONFIG.policy.holdingTradingDays) {
    const result = backtestEvent({
      bars: adjustedBars,
      executionBars,
      benchmarkBars,
      signalDate: testCase.signalDate,
      holdingTradingDays: days,
      entryDelayBars: CONFIG.policy.entryDelayBars,
      buyCostRate: CONFIG.policy.buyCostRate,
      sellCostRate: CONFIG.policy.sellCostRate
    });
    horizons[String(days)] = result.status === 'executed'
      ? {
          status: result.status,
          entryDate: result.entryDate,
          exitDate: result.exitDate,
          netReturn: round(result.netReturn),
          benchmarkReturn: round(result.benchmarkReturn),
          excessReturn: round(result.excessReturn)
        }
      : {
          status: result.status,
          reason: result.reason ?? result.entryExecution?.reason ?? result.exitExecution?.reason ?? null,
          entryDate: result.entryDate ?? null,
          exitDate: result.exitDate ?? null
        };
  }
  return {
    ticker: candidate.ticker,
    name: candidate.name,
    horizons
  };
}

function renderMarkdown(output) {
  const sections = output.cases.map((item) => {
    const ranking = item.selection.ranking.map((row) =>
      `| ${row.name} | ${row.decisionScore} | ${percent(row.past.prior60)} | ${percent(row.past.prior180)} | ${row.noveltyPenalty.total} |`
    ).join('\n');
    const evaluated = item.evaluation.map((row) => {
      const cells = CONFIG.policy.holdingTradingDays.map((days) => {
        const h = row.horizons[String(days)];
        return h.status === 'executed' ? `${percent(h.excessReturn)}` : h.status;
      });
      return `| ${row.name} | ${cells.join(' | ')} |`;
    }).join('\n');
    const horizonHeaders = CONFIG.policy.holdingTradingDays.map((days) => `${days}日超额`).join(' | ');
    const selected = item.selection.selected
      ? `${item.selection.selected.name}（score=${item.selection.selected.decisionScore}）`
      : '不交易（没有候选达到冻结阈值）';
    return `## ${item.id}

- 信号日：${item.signalDate}
- 主题：${item.theme}
- 来源：${item.source.url}
- **点时选择：${selected}**

### 只使用信号日前数据的候选排名

| 候选 | decision score | 前60交易日 | 前180交易日 | novelty penalty |
| --- | ---: | ---: | ---: | ---: |
${ranking}

### 信号后的价格评估（只用于评价，不参与选择）

| 候选 | ${horizonHeaders} |
| --- | ${CONFIG.policy.holdingTradingDays.map(() => '---:').join(' | ')} |
${evaluated}
`;
  }).join('\n');

  return `# Forum-lead point-in-time pilot

本报告是快速回放，不是统计显著性的 alpha 证明。候选选择和 novelty 规则在抓取未来收益前固定在 \`config/pilot_cases.json\`。选择阶段只读取：论坛信号日期、信号日前已公开的公司暴露证据，以及信号日前 60/180 个交易日价格。信号后的价格只进入 evaluation。

冻结阈值：decision score >= ${CONFIG.policy.decisionThreshold}。交易假设：T+1 开盘，双边各 ${(CONFIG.policy.buyCostRate * 100).toFixed(2)}% 成本；停牌、一字涨停买入、一字跌停卖出不假设成交；收益用前复权，执行障碍用不复权日线。

${sections}
`;
}

async function main() {
  const benchmark = CONFIG.policy.benchmark;
  const candidates = CONFIG.cases.flatMap((item) => item.candidateUniverse);
  const unique = new Map(candidates.map((candidate) => [candidate.symbol, candidate]));
  const marketData = {};
  const rawSources = {};

  for (const [symbol] of unique) {
    const [adjusted, unadjusted] = await Promise.all([
      fetchSeries(symbol, 'qfq'),
      fetchSeries(symbol, 'none')
    ]);
    marketData[symbol] = {
      adjusted: adjusted.rows,
      unadjusted: unadjusted.rows
    };
    rawSources[symbol] = { qfqUrls: adjusted.urls, rawUrls: unadjusted.urls };
  }

  const benchmarkSeries = await fetchSeries(benchmark.symbol, 'none', true);
  const benchmarkBars = benchmarkSeries.rows;

  const cases = CONFIG.cases.map((testCase) => {
    const ranking = scoreCandidates(testCase, marketData);
    const top = ranking[0];
    const selected = top && top.decisionScore >= CONFIG.policy.decisionThreshold ? top : null;
    const evaluation = testCase.candidateUniverse.map((candidate) =>
      evaluateCandidate(testCase, candidate, marketData, benchmarkBars));
    return {
      id: testCase.id,
      signalDate: testCase.signalDate,
      theme: testCase.theme,
      source: testCase.source,
      selection: {
        threshold: CONFIG.policy.decisionThreshold,
        ranking,
        selected
      },
      evaluation
    };
  });

  const output = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    frozenAt: CONFIG.frozenAt,
    policy: CONFIG.policy,
    antiLeakage: {
      selectionUsesFutureReturns: false,
      selectionInputs: [
        'forum signal date and source metadata',
        'company evidence published no later than signalDate',
        'adjusted stock prices no later than signalDate for prior 60/180 trading-day novelty checks'
      ],
      futureReturnsUsedOnlyFor: 'post-selection evaluation'
    },
    cases,
    marketDataSources: {
      provider: 'Tencent public daily K-line endpoint',
      adjusted: 'qfqday',
      execution: 'day',
      benchmark: benchmarkSeries.urls,
      chunks: PRICE_CHUNKS,
      symbols: rawSources
    }
  };

  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  fs.writeFileSync(OUTPUT_MD, renderMarkdown(output), 'utf8');
  console.log(JSON.stringify({
    outputJson: OUTPUT_JSON,
    outputMarkdown: OUTPUT_MD,
    selections: cases.map((item) => ({
      id: item.id,
      selected: item.selection.selected ? {
        ticker: item.selection.selected.ticker,
        name: item.selection.selected.name,
        score: item.selection.selected.decisionScore
      } : null
    }))
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
