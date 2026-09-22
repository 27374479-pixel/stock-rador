const fs = require('node:fs');
const path = require('node:path');
const { scoreCandidateV21 } = require('../src/v21-lead-score');
const { verifyClaim } = require('../src/v2-lead-score');
const { assertNoViewedOutcomeCandidates } = require('../src/contamination-guard');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'v21_window_2022_09.json');
const OUTPUT_JSON = path.join(__dirname, '..', 'research', 'v21_2022_09_selection.json');
const OUTPUT_MD = path.join(__dirname, '..', 'research', 'v21_2022_09_selection.md');
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
  return eligible.at(-1).close / eligible[eligible.length - 1 - days].close - 1;
}

function round(value, digits = 6) {
  return value === null ? null : Number(value.toFixed(digits));
}

function pct(value) {
  return value === null ? 'n/a' : `${(value * 100).toFixed(1)}%`;
}

async function main() {
  const allCandidates = CONFIG.leads.flatMap((lead) => lead.candidates);
  assertNoViewedOutcomeCandidates(allCandidates, CONFIG.consumedOutcomeTickers);

  const symbols = new Map();
  for (const lead of CONFIG.leads) {
    for (const candidate of lead.candidates) {
      const prior = symbols.get(candidate.symbol);
      if (!prior || lead.signalDate > prior.latestSignal) {
        symbols.set(candidate.symbol, { latestSignal: lead.signalDate });
      }
    }
  }

  const marketData = {};
  for (const [symbol, meta] of symbols) {
    const url = tencentUrl(symbol, CONFIG.priceHistoryStart, meta.latestSignal);
    const response = await fetchJson(url);
    const rows = parseRows(response, symbol);
    if (rows.some((row) => row.date > meta.latestSignal)) {
      throw new Error(`future price leaked for ${symbol}`);
    }
    marketData[symbol] = { rows, url, maxFetchedDate: meta.latestSignal };
  }

  const leads = CONFIG.leads.map((lead) => {
    const asOf = `${lead.signalDate}T23:59:59.000+08:00`;
    const verification = verifyClaim(lead.evidence, asOf);
    const candidates = lead.candidates.map((candidate) => {
      const rows = marketData[candidate.symbol].rows.filter((row) => row.date <= lead.signalDate);
      const prior60Return = trailingReturn(rows, lead.signalDate, 60);
      const prior180Return = trailingReturn(rows, lead.signalDate, 180);
      const pricing = { ...candidate.pricingBase, prior60Return, prior180Return };
      const score = scoreCandidateV21({
        evidence: lead.evidence,
        asOf,
        exposure: candidate.exposure,
        surprise: candidate.surprise,
        pricing,
        monetization: candidate.monetization,
        reversalRisk: candidate.reversalRisk
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
      b.score.monetizationScore - a.score.monetizationScore ||
      a.ticker.localeCompare(b.ticker));

    const basket = candidates.filter((candidate) => candidate.score.decision === 'Candidate');
    return {
      id: lead.id,
      signalDate: lead.signalDate,
      claim: lead.claim,
      verification,
      abstainReason: lead.abstainReason ?? null,
      evidence: lead.evidence,
      candidates,
      primaryPick: basket[0] ?? null,
      candidateBasket: basket
    };
  });

  const output = {
    schemaVersion: '2.1',
    windowId: CONFIG.windowId,
    generatedAt: new Date().toISOString(),
    selectionLockedBeforeOutcomeFetch: true,
    outcomeDataPresent: false,
    contaminationGuard: {
      viewedOutcomeCandidatesForbidden: true,
      consumedOutcomeTickers: CONFIG.consumedOutcomeTickers
    },
    selectionPolicy: CONFIG.selectionPolicy,
    retrospectiveCaveat: CONFIG.retrospectiveCaveat,
    leads,
    priceInputs: Object.fromEntries(
      [...symbols.keys()].map((symbol) => [symbol, {
        source: marketData[symbol].url,
        maxFetchedDate: marketData[symbol].maxFetchedDate
      }])
    )
  };
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(output, null, 2)}\n`);

  const sections = leads.map((lead) => {
    const rows = lead.candidates.length
      ? lead.candidates.map((candidate) =>
          `| ${candidate.name} | ${candidate.score.decision} | ${candidate.score.total} | ${candidate.score.exposureScore} | ${candidate.score.surpriseScore} | ${candidate.score.monetizationScore} | ${candidate.score.pricedInPenalty} | ${candidate.score.reversalRiskPenalty} | ${pct(candidate.pricing.prior60Return)} | ${pct(candidate.pricing.prior180Return)} |`
        ).join('\n')
      : '| — | Watch | — | — | — | — | — | — | — | — |';
    const primary = lead.primaryPick
      ? `${lead.primaryPick.name} (${lead.primaryPick.ticker}), score=${lead.primaryPick.score.total}`
      : 'No trade';
    return `## ${lead.id}

Signal date: ${lead.signalDate}

${lead.claim}

Verification: **${lead.verification.status}**. Frozen primary decision: **${primary}**.

${lead.abstainReason ? `Abstention rationale: ${lead.abstainReason}\n` : ''}
| Candidate | Decision | Total | Exposure | Surprise | Monetization | Priced-in | Reversal risk | Prior 60d | Prior 180d |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
  }).join('\n');

  fs.writeFileSync(OUTPUT_MD, `# V2.1 September 2022 selection freeze

**No post-signal price data is present.** Every market-data request ends on or before the relevant signal date. Candidates whose future paths were already viewed in earlier consumed windows are rejected by code.

${CONFIG.retrospectiveCaveat}

${sections}`);

  console.log(JSON.stringify(leads.map((lead) => ({
    id: lead.id,
    verification: lead.verification.status,
    primaryPick: lead.primaryPick ? {
      ticker: lead.primaryPick.ticker,
      name: lead.primaryPick.name,
      total: lead.primaryPick.score.total
    } : null,
    candidates: lead.candidates.map((candidate) => ({
      ticker: candidate.ticker,
      name: candidate.name,
      decision: candidate.score.decision,
      total: candidate.score.total,
      prior60Return: candidate.pricing.prior60Return,
      prior180Return: candidate.pricing.prior180Return,
      pricedIn: candidate.score.pricedInPenalty
    }))
  })), null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
