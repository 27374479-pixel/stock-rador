const fs = require('node:fs');

const ALLOWED_STATUSES = new Set([
  'ok',
  'insufficient_history',
  'delisted',
  'suspended',
  'price_missing',
  'execution_blocked'
]);

function selectMissedOpportunityCandidates(universe, snapshot, options = {}) {
  const errors = [];
  const percentile = options.percentile ?? 0.01;
  const absoluteExcessThreshold = options.absoluteExcessThreshold ?? 0.50;
  const horizonTradingDays = options.horizonTradingDays ?? 120;

  if (universe?.schemaVersion !== '1.0') errors.push('unsupported audit universe schema');
  if (snapshot?.schemaVersion !== '1.0') errors.push('unsupported outcome snapshot schema');
  if (snapshot?.horizonTradingDays !== horizonTradingDays) {
    errors.push(`outcome snapshot horizonTradingDays must be ${horizonTradingDays}`);
  }
  if (snapshot?.runId !== options.runId) errors.push('outcome snapshot runId must match expected runId');
  if (snapshot?.benchmarkTicker !== options.benchmarkTicker) {
    errors.push('outcome snapshot benchmarkTicker must match expected benchmark');
  }

  const universeTickers = new Set((universe?.included ?? []).map((row) => row.ticker));
  const rows = Array.isArray(snapshot?.rows) ? snapshot.rows : [];
  const seen = new Set();

  for (const row of rows) {
    if (typeof row?.ticker !== 'string' || !row.ticker) {
      errors.push('every outcome row requires ticker');
      continue;
    }
    if (seen.has(row.ticker)) errors.push(`duplicate outcome ticker ${row.ticker}`);
    seen.add(row.ticker);
    if (!universeTickers.has(row.ticker)) errors.push(`outcome ticker is outside frozen universe: ${row.ticker}`);
    if (!ALLOWED_STATUSES.has(row?.status)) errors.push(`invalid outcome status for ${row.ticker}: ${row?.status}`);
    if (row.status === 'ok') {
      for (const field of ['netReturn','benchmarkReturn','excessReturn']) {
        if (!Number.isFinite(row?.[field])) errors.push(`${row.ticker} status ok requires finite ${field}`);
      }
      if (Number.isFinite(row?.netReturn) && Number.isFinite(row?.benchmarkReturn) &&
          Math.abs((row.netReturn - row.benchmarkReturn) - row.excessReturn) > 1e-9) {
        errors.push(`${row.ticker} excessReturn does not equal netReturn - benchmarkReturn`);
      }
    }
  }

  for (const ticker of universeTickers) {
    if (!seen.has(ticker)) errors.push(`frozen-universe ticker missing from outcome snapshot: ${ticker}`);
  }
  if (rows.length !== universeTickers.size) {
    errors.push(`outcome row count ${rows.length} must equal frozen universe size ${universeTickers.size}`);
  }
  if (errors.length) return { errors, result: null };

  const evaluable = rows
    .filter((row) => row.status === 'ok')
    .sort((a, b) => b.excessReturn - a.excessReturn || a.ticker.localeCompare(b.ticker));

  const topCount = evaluable.length ? Math.max(1, Math.ceil(evaluable.length * percentile)) : 0;
  const topPercentileTickers = new Set(evaluable.slice(0, topCount).map((row) => row.ticker));
  const absoluteThresholdTickers = new Set(
    evaluable.filter((row) => row.excessReturn >= absoluteExcessThreshold).map((row) => row.ticker)
  );
  const candidateTickers = new Set([...topPercentileTickers, ...absoluteThresholdTickers]);
  const candidates = evaluable
    .filter((row) => candidateTickers.has(row.ticker))
    .map((row, index) => ({
      caseId: `outcome-${horizonTradingDays}d-${row.ticker.replace('.', '-')}`,
      ticker: row.ticker,
      horizonTradingDays,
      netReturn: row.netReturn,
      benchmarkReturn: row.benchmarkReturn,
      excessReturn: row.excessReturn,
      rankAmongEvaluable: evaluable.findIndex((item) => item.ticker === row.ticker) + 1,
      percentileRuleHit: topPercentileTickers.has(row.ticker),
      absoluteThresholdHit: absoluteThresholdTickers.has(row.ticker)
    }));

  const statusCounts = {};
  for (const row of rows) statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;

  return {
    errors: [],
    result: {
      schemaVersion: '1.0',
      runId: snapshot.runId,
      label: 'mechanical_hindsight_case_generation_not_alpha_validation',
      horizonTradingDays,
      rule: {
        percentile,
        topCount,
        absoluteExcessThreshold,
        union: true
      },
      frozenUniverseCount: universeTickers.size,
      evaluableCount: evaluable.length,
      statusCounts,
      candidateCount: candidates.length,
      candidates
    }
  };
}

module.exports = { ALLOWED_STATUSES, selectMissedOpportunityCandidates };
