const test = require('node:test');
const assert = require('node:assert/strict');
const { addDays, parseTencent, tickerToTencent } = require('../scripts/fetch-backtest-prices.cjs');

test('ticker mapping is deterministic for Shanghai and Shenzhen', () => {
  assert.equal(tickerToTencent('000300.SH'), 'sh000300');
  assert.equal(tickerToTencent('300308.SZ'), 'sz300308');
  assert.throws(() => tickerToTencent('AAPL'), /unsupported ticker/);
});

test('date range arithmetic is UTC stable', () => {
  assert.equal(addDays('2025-03-31', 1), '2025-04-01');
  assert.equal(addDays('2025-03-31', -15), '2025-03-16');
});

test('index adjusted parsing can conservatively fall back to day series', () => {
  const payload = { data: { sh000300: { day: [['2025-04-01','1','2','3','0.5','100']] } } };
  assert.deepEqual(parseTencent(payload, 'sh000300', true, true)[0], {
    date:'2025-04-01', open:1, close:2, high:3, low:0.5, volume:100
  });
});
