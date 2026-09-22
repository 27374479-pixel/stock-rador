const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateRun } = require('../scripts/backtest-core-v061.cjs');

function basePrices() {
  const benchmark = [
    { date: '2024-01-02', open: 100, close: 100, high: 101, low: 99, volume: 1 },
    { date: '2024-01-03', open: 100, close: 101, high: 102, low: 99, volume: 1 },
    { date: '2024-01-04', open: 101, close: 102, high: 103, low: 100, volume: 1 }
  ];
  const stock = [
    { date: '2024-01-02', open: 10, close: 10, high: 10, low: 10, volume: 10 },
    { date: '2024-01-03', open: 10, close: 11, high: 11, low: 10, volume: 10 },
    { date: '2024-01-04', open: 11, close: 12, high: 12, low: 10.5, volume: 10 }
  ];
  return { series: { '000300.SH': { adjusted: benchmark }, '000001.SZ': { adjusted: stock, unadjusted: stock } } };
}

function manifest(primary = false) {
  return {
    schemaVersion: '1.1',
    runId: 'partial-demo',
    benchmark: { ticker: '000300.SH', name: '沪深300' },
    trackedMemoStates: ['Research', 'High-priority research'],
    primarySignalStates: ['High-priority research'],
    outcomePolicy: {
      entryRule: 'next_trading_day_open_after_cutoff_date',
      holdingTradingDays: [2, 4],
      oneWayCostRate: 0.001
    },
    selections: [{ memoPath: 'memo.json', hypothesisId: 'h1', ticker: '000001.SZ', limitRate: 0.10 }],
    evaluationMode: 'historical_replay'
  };
}

function memo({ primary = false, base = 2 } = {}) {
  return {
    cutoffAt: '2024-01-02T15:00:00+08:00',
    researchReadyAt: '2024-01-02T14:00:00+08:00',
    actionableAt: primary ? '2024-01-02T14:30:00+08:00' : null,
    hypothesisId: 'h1',
    state: primary ? 'High-priority research' : 'Research',
    expectedRealization: {
      earliestTradingDays: 2,
      baseTradingDays: base,
      latestTradingDays: 4,
      rationale: 'test'
    },
    matchedControls: []
  };
}

test('v0.6.1 computes matured horizons and marks later horizons pending', () => {
  const evaluated = evaluateRun(manifest(false), { 'memo.json': memo() }, basePrices());
  const result = evaluated.results[0];
  assert.ok(result.horizons['2']);
  assert.equal(result.horizons['4'], undefined);
  assert.equal(result.pendingHorizons.length, 1);
  assert.equal(result.pendingHorizons[0].holdingDays, 4);
  assert.equal(result.pendingHorizons[0].status, 'pending');
  assert.ok(result.thesisBaseOutcome);
});

test('v0.6.1 keeps primary base metric pending instead of failing when base horizon is immature', () => {
  const evaluated = evaluateRun(manifest(true), { 'memo.json': memo({ primary: true, base: 4 }) }, basePrices());
  assert.equal(evaluated.results[0].isPrimarySignal, true);
  assert.equal(evaluated.results[0].thesisBaseOutcome, null);
  assert.equal(evaluated.aggregate.primaryThesisBase.count, 0);
  assert.equal(evaluated.aggregate.primaryThesisBase.pendingBaseCount, 1);
});
