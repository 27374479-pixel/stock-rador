const test = require('node:test');
const assert = require('node:assert/strict');
const { alignInteriorSuspensions } = require('../scripts/prepare-suspension-aware-prices.cjs');

function row(date, close) { return { date, open: close, close, high: close, low: close, volume: 1 }; }

test('fills only interior suspension gaps and carries prior close', () => {
  const prices = { series: {
    '000300.SH': { adjusted: [row('2020-01-01',1),row('2020-01-02',1),row('2020-01-03',1),row('2020-01-04',1),row('2020-01-05',1)] },
    '000001.SZ': { adjusted: [row('2020-01-01',10),row('2020-01-02',11),row('2020-01-04',12),row('2020-01-05',13)], unadjusted:[row('2020-01-01',10)] }
  }};
  const out = alignInteriorSuspensions(prices, new Set());
  const gap = out.series['000001.SZ'].adjusted.find((x) => x.date === '2020-01-03');
  assert.equal(gap.close, 11);
  assert.equal(gap.syntheticSuspensionCarry, true);
  assert.equal(out.series['000001.SZ'].unadjusted.length, 1);
});

test('never fabricates protected entry or exit dates', () => {
  const prices = { series: {
    '000300.SH': { adjusted: [row('2020-01-01',1),row('2020-01-02',1),row('2020-01-03',1),row('2020-01-04',1),row('2020-01-05',1)] },
    '000001.SZ': { adjusted: [row('2020-01-01',10),row('2020-01-03',11),row('2020-01-05',12)] }
  }};
  const out = alignInteriorSuspensions(prices, new Set(['2020-01-02','2020-01-04']));
  const dates = out.series['000001.SZ'].adjusted.map((x) => x.date);
  assert.equal(dates.includes('2020-01-02'), false);
  assert.equal(dates.includes('2020-01-04'), false);
});
