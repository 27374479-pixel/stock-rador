const test = require('node:test');
const assert = require('node:assert/strict');
const { entryExecutionCheck, maxCloseDrawdown, returnAfterCost } = require('../scripts/replay-forum-case.cjs');

test('buy and sell costs use a multiplicative round-trip convention', () => {
  assert.equal(returnAfterCost(100, 110, 0.001), 1.1 * 0.999 / 1.001 - 1);
});

test('close-path drawdown tracks peak before trough', () => {
  assert.deepEqual(maxCloseDrawdown([
    { date: 'entry', value: 1 },
    { date: '2024-01-02', value: 1.2 },
    { date: '2024-01-03', value: 0.9 },
    { date: '2024-01-04', value: 1.1 }
  ]), { value: -0.25, peakDate: '2024-01-02', troughDate: '2024-01-03' });
});

test('one-price limit-up is flagged but overall execution remains unverified', () => {
  const rows = [
    { date: '2024-01-01', open: 10, close: 10, high: 10, low: 10, volume: 100 },
    { date: '2024-01-02', open: 12, close: 12, high: 12, low: 12, volume: 50 }
  ];
  const result = entryExecutionCheck(rows, 1, 0.20);
  assert.equal(result.onePriceLimitUp, true);
  assert.equal(result.status, 'unverified');
});
