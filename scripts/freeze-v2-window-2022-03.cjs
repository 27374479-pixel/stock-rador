const fs = require('node:fs');
const path = require('node:path');
const { scoreCandidateV2 } = require('../src/v2-lead-score');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'v2_window_2022_03.json');
const OUTPUT_JSON = path.join(__dirname, '..', 'research', 'v2_2022_03_selection.json');
const OUTPUT_MD = path.join(__dirname, '..', 'research', 'v2_2022_03_selection.md');
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

function tencentUrl(symbol, startDate, endDate) {
  return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,${startDate},${endDate},500,qfq`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

function parseRows(response, symbol) {
  const rows = response?.data?.[symbol]?.qfqday;
  if (!Array.isArray(rows) || rows.length < 2) throw new Error(`No qfqday rows for ${symbol}`);
  return rows.map((row) => ({
    date: row[0],
    open: Number(row[1]),
    close: Number(row[2]),
    high: Number(row[3]),
    low: Number(row[4]),
    volume: Number(row[5])
  })).filter((row) => [row.open, row.close, row.high, row.low, row.volume].every(Number.isFinite));
}

function trailingReturn(rows, signalDate, days) {
  const eligible = rows.filter((row) => row.date <= signalDate);
  if (eligible.length <= days) return null;
  const end = eligible.at(-1);
  const start = eligible[eligible.length - 1 - days];
  return end.close / start.close - 1;
}

function round(value, digits = 6) {
  return value === null ? null : Number(value.toFixed(digits));
}

function pct(value) {
  return value === null ? 'n/a' : `${(value * 100).toFixed(1)}%`;
}

async function main() {
  const marketData = {};
  const symbols = new Set(CONFIG.leads.flatMap((lead) => lead.candidates.map((candidate) => candidate.symbol)));
  for (const symbol of symbols) {
    const latestSignal = CONFIG.leads
      .flatMap((lead) => lead.candidates.some((candidate) => candidate.symbol === symbol) ? [lead.signalDate] : [])
      .sort()
      .at(-1);
    const url = tencentUrl(symbol, CONFIG.priceHistoryStart, latestSignal);
    const response = await fetchJson(url);
    marketData[symbol] = { rows: parseRows(response, symbol), url, latestSignal };
    if (marketData[symbol].rows.some((row) => row.date > latestSignal)) {
      throw new Error(`future price leaked for ${symbol}: ${latestSignal}`);
    }
  }

  const leads = CONFIG.leads.map((lead) => {
    const candidates = lead.candidates.map((candidate) => {
      const rows = marketData[candidate.symbol].rows.filter((row) => row.date <= lead.signalDate);
      const prior60Return = trailingReturn(rows, lead.signalDate, 60);
      const prior180Return = trailingReturn(rows, lead.signalDate, 180);
      const pricing = {
        ...candidate.pricingBase,
        prior60Return,
        prior180Return
      };
      const score = scoreCandidateV2({
        evidence: lead.evidence,
        asOf: `${lead.signalDate}T23:59:59.000Z`,
        exposure: candidate.exposure,
        surprise: candidate.surprise,
        pricing
      });
      return {
        ticker: candidate.ticker,
        symbol: candidate.symbol,
        name: candidate.name,
        pointInTimeEvidence: candidate.pointInTimeEvidence,
        pricing: {
          ...candidate.pricingBase,
          prior60Return: round(prior60Return),
          prior180Return: round(prior180Return)
        },
        score
      };
    }).sort((a, b) =>
      b.score.total - a.score.total ||
      b.score.exposureScore - a.score.exposureScore ||
      a.ticker.localeCompare(b.ticker));

    const basket = candidates.filter((candidate) => candidate.score.decision === 'Candidate');
    return {
      id: lead.id,
      signalDate: lead.signalDate,
      claim: lead.claim,
      evidence: lead.evidence,
      candidates,
      primaryPick: basket[0] ?? null,
      candidateBasket: basket
    };
  });

  const output = {
    schemaVersion: '2.0',
    windowId: CONFIG.windowId,
    generatedAt: new Date().toISOString(),
    selectionLockedBeforeOutcomeFetch: true,
    outcomeDataPresent: false,
    selectionPolicy: CONFIG.selectionPolicy,
    retrospectiveCaveat: CONFIG.retrospectiveCaveat,
    leads,
    priceInputs: Object.fromEntries([...symbols].map((symbol) => [
      symbol,
      {
        source: marketData[symbol].url,
        maxFetchedDate: marketData[symbol].latestSignal
      }
    ]))
  };

  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(output, null, 2)}\n`);

  const sections = leads.map((lead) => {
    const rows = lead.candidates.map((candidate) =>
      `| ${candidate.name} | ${candidate.score.decision} | ${candidate.score.total} | ${candidate.score.exposureScore} | ${candidate.score.surpriseScore} | ${candidate.score.pricedInPenalty} | ${pct(candidate.pricing.prior60Return)} | ${pct(candidate.pricing.prior180Return)} |`
    ).join('\n');
    return `## ${lead.id}

信号日：${lead.signalDate}

${lead.claim}

Primary pick: **${lead.primaryPick ? `${lead.primaryPick.name} (${lead.primaryPick.ticker}), score=${lead.primaryPick.score.total}` : 'No trade'}**

| Candidate | Decision | Total | Exposure | Surprise | Priced-in penalty | Prior 60d | Prior 180d |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
  }).join('\n');

  fs.writeFileSync(OUTPUT_MD, `# V2 2022-03 selection lock

**No post-signal price data is present in this artifact.** Every market-data request ends at the relevant signal date. This file must be committed before an outcome evaluator is added or run.

${CONFIG.retrospectiveCaveat}

${sections}`);

  console.log(JSON.stringify({
    outputJson: OUTPUT_JSON,
    outputMarkdown: OUTPUT_MD,
    leads: leads.map((lead) => ({
      id: lead.id,
      primaryPick: lead.primaryPick ? {
        ticker: lead.primaryPick.ticker,
        name: lead.primaryPick.name,
        total: lead.primaryPick.score.total
      } : null,
      basket: lead.candidateBasket.map((candidate) => ({
        ticker: candidate.ticker,
        name: candidate.name,
        total: candidate.score.total
      }))
    }))
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
