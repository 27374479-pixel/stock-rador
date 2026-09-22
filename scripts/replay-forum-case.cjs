const fs = require('node:fs');
const path = require('node:path');

const EVENT_DATE = '2024-04-26';
const ONE_WAY_COST_RATE = 0.001;
const START_DATE = '2024-04-20';
const END_DATE = '2024-09-30';
const OUTPUT_JSON = path.join(__dirname, '..', 'research', 'forum_replay.json');
const OUTPUT_MD = path.join(__dirname, '..', 'research', 'forum_replay.md');

const INSTRUMENTS = [
  { ticker: '688676.SH', name: '金盘科技', symbol: 'sh688676', kind: 'stock', limitRate: 0.20 },
  { ticker: '301291.SZ', name: '明阳电气', symbol: 'sz301291', kind: 'stock', limitRate: 0.20 },
  { ticker: '000300.SH', name: '沪深300', symbol: 'sh000300', kind: 'benchmark' }
];

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

function parseRows(response, symbol, adjusted, allowUnadjustedFallback = false) {
  const node = response?.data?.[symbol];
  const key = adjusted ? 'qfqday' : 'day';
  const rows = node?.[key] ?? (adjusted && allowUnadjustedFallback ? node?.day : undefined);
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`Tencent returned no ${key} rows for ${symbol}`);
  return rows.map((row) => {
    const parsed = {
      date: row[0], open: Number(row[1]), close: Number(row[2]), high: Number(row[3]),
      low: Number(row[4]), volume: Number(row[5])
    };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ||
        ![parsed.open, parsed.close, parsed.high, parsed.low, parsed.volume].every(Number.isFinite)) {
      throw new Error(`Invalid Tencent row for ${symbol}: ${JSON.stringify(row)}`);
    }
    return parsed;
  });
}

function maxCloseDrawdown(values) {
  if (!Array.isArray(values) || values.length === 0) throw new Error('Cannot calculate drawdown from an empty path');
  let peak = values[0].value;
  let maxDrawdown = 0;
  let peakDate = values[0].date;
  let troughDate = values[0].date;
  let activePeakDate = values[0].date;
  for (const point of values) {
    if (point.value > peak) {
      peak = point.value;
      activePeakDate = point.date;
    }
    const drawdown = point.value / peak - 1;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      peakDate = activePeakDate;
      troughDate = point.date;
    }
  }
  return { value: round(maxDrawdown), peakDate, troughDate };
}

function returnAfterCost(entryOpen, exitClose, oneWayCostRate = ONE_WAY_COST_RATE) {
  if (!(entryOpen > 0) || !(exitClose > 0)) throw new Error('Prices must be positive');
  return exitClose / entryOpen * (1 - oneWayCostRate) / (1 + oneWayCostRate) - 1;
}

function entryExecutionCheck(rows, entryIndex, limitRate) {
  const row = rows[entryIndex];
  const previous = rows[entryIndex - 1];
  if (!row || !previous) throw new Error('Entry execution check requires entry and previous trading day');
  const suspended = row.volume <= 0;
  const onePrice = row.open === row.high && row.high === row.low && row.low === row.close;
  const moveFromPreviousClose = row.open / previous.close - 1;
  const onePriceLimitUp = onePrice && moveFromPreviousClose >= limitRate - 0.005;
  return {
    status: 'unverified',
    reason: suspended
      ? 'daily bar has zero volume; entry is not executable'
      : onePriceLimitUp
        ? 'daily bar is consistent with a one-price limit-up; entry is not assumed executable'
        : 'daily OHLC and volume show no suspension or one-price limit-up, but cannot prove a fill at the opening price',
    suspended,
    onePriceLimitUp,
    unadjustedBar: row,
    previousUnadjustedClose: previous.close,
    moveFromPreviousClose: round(moveFromPreviousClose)
  };
}

function findEntryIndex(rows) {
  const index = rows.findIndex((row) => row.date > EVENT_DATE);
  if (index < 1) throw new Error(`No usable next trading day after ${EVENT_DATE}`);
  return index;
}

function findByDate(rows, date, label) {
  const row = rows.find((item) => item.date === date);
  if (!row) throw new Error(`Missing ${label} row for ${date}`);
  return row;
}

function calculateStock(adjusted, unadjusted, commonDates, benchmarkAdjusted, instrument) {
  const entry = findByDate(adjusted, commonDates.entryDate, `${instrument.ticker} entry`);
  const entryIndex = adjusted.findIndex((row) => row.date === entry.date);
  const rawEntryIndex = unadjusted.findIndex((row) => row.date === entry.date);
  if (rawEntryIndex < 1) throw new Error(`Missing unadjusted entry data for ${instrument.ticker}`);
  const execution = entryExecutionCheck(unadjusted, rawEntryIndex, instrument.limitRate);
  const horizons = {};
  for (const holdingDays of [20, 60]) {
    const exitDate = commonDates.exits[String(holdingDays)];
    const exit = findByDate(adjusted, exitDate, `${instrument.ticker} ${holdingDays}-day exit`);
    const exitIndex = adjusted.findIndex((row) => row.date === exitDate);
    const benchmarkEntry = findByDate(benchmarkAdjusted, entry.date, 'benchmark entry');
    const benchmarkExit = findByDate(benchmarkAdjusted, exit.date, 'benchmark exit');
    const netReturn = returnAfterCost(entry.open, exit.close);
    const benchmarkReturn = benchmarkExit.close / benchmarkEntry.open - 1;
    const closeRows = adjusted.slice(entryIndex, exitIndex + 1);
    if (closeRows.length !== holdingDays) throw new Error(`${instrument.ticker} does not have ${holdingDays} aligned trading bars through ${exitDate}`);
    const equityPath = [{ date: `${entry.date} entry`, value: 1 }].concat(closeRows.map((row) => ({
      date: row.date,
      value: row.close / entry.open * (1 - ONE_WAY_COST_RATE) / (1 + ONE_WAY_COST_RATE)
    })));
    horizons[String(holdingDays)] = {
      exitDate: exit.date,
      exitAdjustedClose: exit.close,
      netReturn: round(netReturn),
      benchmarkReturn: round(benchmarkReturn),
      relativeToBenchmark: round(netReturn - benchmarkReturn),
      closePathMaxDrawdown: maxCloseDrawdown(equityPath)
    };
  }
  return {
    ticker: instrument.ticker,
    name: instrument.name,
    entryDate: entry.date,
    entryAdjustedOpen: entry.open,
    oneWayCostRate: ONE_WAY_COST_RATE,
    execution,
    horizons
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

function tencentUrl(symbol, adjustment) {
  return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,${START_DATE},${END_DATE},200,${adjustment}`;
}

function percent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function percentagePoints(value) {
  const points = value * 100;
  return `${points > 0 ? '+' : ''}${points.toFixed(2)} pp`;
}

function renderMarkdown(output) {
  const rows = output.results.flatMap((result) => [20, 60].map((days) => {
    const h = result.horizons[String(days)];
    return `| ${result.name} | ${days} | ${result.entryDate} 开盘 | ${h.exitDate} 收盘 | ${percent(h.netReturn)} | ${percent(h.benchmarkReturn)} | ${percentagePoints(h.relativeToBenchmark)} | ${percent(h.closePathMaxDrawdown.value)} | ${result.execution.status} |`;
  })).join('\n');
  return `# 2024-04-26 变压器论坛线索：探索性价格回放

## 结论边界

这是一次后见的最小价格回放，不是 alpha 回测，也没有证明社区提前发现了机会。论坛线索来自 2024-04-26，但金盘科技、明阳电气的映射是在 2026-09-21 才通过今天的搜索和公司资料建立，无法证明 2024 年当时已经能形成同样的候选集合。样本也由今天仍可搜索到的帖子出发，存在搜索幸存者偏差。

为避免看结果选股，本轮抓价前已锁定唯一事件、两只已有映射股票和沪深 300，不新增表现更好的股票。帖子只有日期、没有可核的具体发布时间，因此保守地把下一交易日开盘作为假设入口。

## 固定规则

- 事件：Reddit r/electricians，2024-04-26 “Equipment Lead times”。
- 标的：金盘科技（688676）、明阳电气（301291）；基准：沪深 300。
- 入口：帖子日期后的下一交易日，前复权开盘价。
- 出口：第 20、60 个持有交易日的前复权收盘价，入口日计为第 1 日。
- 成本：买入和卖出各 0.1%，净值按 \`exit / entry × (1 - 0.001) / (1 + 0.001)\`；基准仅作价格比较，未扣成本。
- 回撤：从入口成交前初始资金 1 开始，随后只观察入口日至出口日每日收盘的可变现价值；不引入入口开盘前价格，也不反映日内回撤。
- 执行检查：不复权日线检查停牌、零成交量和一字涨停。日线无法证明开盘价真实可成交，所以执行状态一律保守标为 unverified。

## 结果

| 标的 | 持有交易日 | 假设入口 | 出口 | 净收益 | 沪深300收益 | 收益差（百分点） | 收盘路径最大回撤 | 执行性 |
| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | --- |
${rows}

上述数字只回答“事后按固定入口和窗口，价格空间、持续超额与回撤风险如何”，不能回答当时是否能识别 A 股映射、是否能以开盘价成交、论坛讨论是否领先市场，或未来策略是否有效。标的是今天才认可的映射，涨跌无法判断社区规则是否成功；即使结果为负，也不能单独证明产业方向无效。沪深 300 只控制同期大盘，没有控制变压器行业差异。公司证据仍显示美国瓶颈到 A 股利润的链条未闭合。

## 数据与复现

行情来自腾讯公开日线接口。股票前复权 OHLC 用于收益和回撤，不复权 OHLC/成交量用于执行障碍检查；沪深 300 使用接口返回的普通指数 \`day\` 序列，不涉及股票式公司行动复权。完整请求 URL、实际序列键、抓取时间和原始响应缓存于 [forum_replay.json](./forum_replay.json)。

\`\`\`powershell
node scripts/replay-forum-case.cjs
\`\`\`
`;
}

async function main() {
  const fetchedAt = new Date().toISOString();
  const fetched = {};
  for (const instrument of INSTRUMENTS) {
    const adjustedUrl = tencentUrl(instrument.symbol, 'qfq');
    const unadjustedUrl = tencentUrl(instrument.symbol, 'none');
    const [adjustedResponse, unadjustedResponse] = await Promise.all([
      fetchJson(adjustedUrl), fetchJson(unadjustedUrl)
    ]);
    fetched[instrument.symbol] = {
      adjusted: { url: adjustedUrl, response: adjustedResponse },
      unadjusted: { url: unadjustedUrl, response: unadjustedResponse },
      adjustedRows: parseRows(adjustedResponse, instrument.symbol, true, instrument.kind === 'benchmark'),
      unadjustedRows: parseRows(unadjustedResponse, instrument.symbol, false)
    };
  }

  const benchmarkRows = fetched.sh000300.adjustedRows;
  const benchmarkEntryIndex = findEntryIndex(benchmarkRows);
  const commonDates = {
    entryDate: benchmarkRows[benchmarkEntryIndex].date,
    exits: {
      '20': benchmarkRows[benchmarkEntryIndex + 19]?.date,
      '60': benchmarkRows[benchmarkEntryIndex + 59]?.date
    }
  };
  if (!commonDates.exits['20'] || !commonDates.exits['60']) throw new Error('Benchmark lacks complete 20/60-day windows');
  const results = INSTRUMENTS.filter((item) => item.kind === 'stock').map((instrument) =>
    calculateStock(fetched[instrument.symbol].adjustedRows, fetched[instrument.symbol].unadjustedRows, commonDates, benchmarkRows, instrument));
  const output = {
    schemaVersion: '1.0',
    fetchedAt,
    experiment: {
      eventDate: EVENT_DATE,
      eventUrl: 'https://www.reddit.com/r/electricians/comments/1cdvmi4/equipment_lead_times/',
      selectionLockedBeforePriceFetch: true,
      selectedTickers: ['688676.SH', '301291.SZ'],
      benchmark: '000300.SH',
      entryRule: 'next trading day open after event date; exact post time unavailable',
      holdingTradingDays: [20, 60],
      oneWayCostRate: ONE_WAY_COST_RATE,
      commonTradingCalendar: '沪深300',
      caveat: 'Mappings were identified on 2026-09-21 with hindsight; exploratory replay only, not point-in-time alpha validation.'
    },
    results,
    sources: Object.fromEntries(INSTRUMENTS.map((instrument) => [instrument.ticker, {
      provider: 'Tencent',
      adjusted: {
        url: fetched[instrument.symbol].adjusted.url,
        seriesKey: instrument.kind === 'benchmark' ? 'day (index series)' : 'qfqday',
        rawResponse: fetched[instrument.symbol].adjusted.response
      },
      unadjusted: { url: fetched[instrument.symbol].unadjusted.url, seriesKey: 'day', rawResponse: fetched[instrument.symbol].unadjusted.response }
    }]))
  };
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  fs.writeFileSync(OUTPUT_MD, renderMarkdown(output), 'utf8');
  console.log(OUTPUT_JSON);
  console.log(OUTPUT_MD);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { entryExecutionCheck, maxCloseDrawdown, returnAfterCost };
