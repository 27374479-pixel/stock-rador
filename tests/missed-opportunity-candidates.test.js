const test = require('node:test');
const assert = require('node:assert/strict');
const { selectMissedOpportunityCandidates } = require('../scripts/missed-opportunity-candidates-core.cjs');

function universe(n = 200) {
  return {
    schemaVersion: '1.0',
    included: Array.from({ length: n }, (_, i) => ({
      ticker: `${String(i + 1).padStart(6, '0')}.SZ`
    }))
  };
}

function snapshot(n = 200) {
  return {
    schemaVersion: '1.0',
    runId: 'fwd',
    benchmarkTicker: '000300.SH',
    horizonTradingDays: 120,
    rows: Array.from({ length: n }, (_, i) => {
      const excess = (n - i) / 1000;
      return {
        ticker: `${String(i + 1).padStart(6, '0')}.SZ`,
        status: 'ok',
        netReturn: excess + 0.1,
        benchmarkReturn: 0.1,
        excessReturn: excess
      };
    })
  };
}

test('candidate generation mechanically unions top 1% and >=50% excess names', () => {
  const u = universe(200);
  const s = snapshot(200);
  s.rows[10].netReturn = 0.7;
  s.rows[10].benchmarkReturn = 0.1;
  s.rows[10].excessReturn = 0.6;
  const { errors, result } = selectMissedOpportunityCandidates(u, s, {
    runId: 'fwd', benchmarkTicker: '000300.SH'
  });
  assert.deepEqual(errors, []);
  assert.equal(result.rule.topCount, 2);
  assert.ok(result.candidates.some((x) => x.ticker === '000001.SZ' && x.percentileRuleHit));
  assert.equal(result.candidates.some((x) => x.ticker === '000002.SZ'), false);
  assert.ok(result.candidates.some((x) => x.ticker === '000011.SZ' && x.percentileRuleHit && x.absoluteThresholdHit));
});

test('candidate generation refuses survivor-biased snapshots with missing universe names', () => {
  const u = universe(10);
  const s = snapshot(10);
  s.rows.pop();
  const { errors } = selectMissedOpportunityCandidates(u, s, {
    runId: 'fwd', benchmarkTicker: '000300.SH'
  });
  assert.ok(errors.some((x) => x.includes('missing from outcome snapshot')));
});

test('non-ok statuses remain in denominator but are not ranked as winners', () => {
  const u = universe(10);
  const s = snapshot(10);
  s.rows[0] = { ticker: '000001.SZ', status: 'delisted' };
  const { errors, result } = selectMissedOpportunityCandidates(u, s, {
    runId: 'fwd', benchmarkTicker: '000300.SH'
  });
  assert.deepEqual(errors, []);
  assert.equal(result.frozenUniverseCount, 10);
  assert.equal(result.evaluableCount, 9);
  assert.equal(result.statusCounts.delisted, 1);
  assert.equal(result.candidates.some((x) => x.ticker === '000001.SZ'), false);
});

test('status ok requires internally consistent excess return', () => {
  const u = universe(2);
  const s = snapshot(2);
  s.rows[0].excessReturn = 99;
  const { errors } = selectMissedOpportunityCandidates(u, s, {
    runId: 'fwd', benchmarkTicker: '000300.SH'
  });
  assert.ok(errors.some((x) => x.includes('does not equal')));
});
