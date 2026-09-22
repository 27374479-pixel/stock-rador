const test = require('node:test');
const assert = require('node:assert/strict');
const {
  backtestEvent,
  executionCheck,
  returnAfterCost
} = require('../src/strict-event-backtest');

function bar(date, open, close = open, volume = 100, extra = {}) {
  return {
    date,
    open,
    close,
    high: Math.max(open, close),
    low: Math.min(open, close),
    volume,
    limitRate: 0.10,
    ...extra
  };
}

test('T+1 entry uses the first trading session strictly after the signal date', () => {
  const bars = [
    bar('2026-01-02', 10),
    bar('2026-01-05', 10.2),
    bar('2026-01-06', 10.5)
  ];
  const result = backtestEvent({
    bars,
    signalDate: '2026-01-02',
    holdingTradingDays: 2
  });
  assert.equal(result.status, 'executed');
  assert.equal(result.entryDate, '2026-01-05');
  assert.equal(result.exitDate, '2026-01-06');
});

test('entryDelayBars adds explicit latency after the T+1 target', () => {
  const bars = [
    bar('2026-01-02', 10),
    bar('2026-01-05', 10.1),
    bar('2026-01-06', 10.2),
    bar('2026-01-07', 10.3)
  ];
  const result = backtestEvent({
    bars,
    signalDate: '2026-01-02',
    holdingTradingDays: 2,
    entryDelayBars: 1
  });
  assert.equal(result.status, 'executed');
  assert.equal(result.entryDate, '2026-01-06');
  assert.equal(result.exitDate, '2026-01-07');
});

test('one-price limit-up blocks a strict buy fill', () => {
  const bars = [
    bar('2026-01-02', 10),
    bar('2026-01-05', 11, 11, 100, { high: 11, low: 11 })
  ];
  const result = backtestEvent({
    bars,
    signalDate: '2026-01-02',
    holdingTradingDays: 1
  });
  assert.equal(result.status, 'blocked_entry');
  assert.equal(result.entryExecution.onePriceLimitUp, true);
});

test('zero-volume entry is blocked', () => {
  const bars = [
    bar('2026-01-02', 10),
    bar('2026-01-05', 10.1, 10.1, 0)
  ];
  const result = backtestEvent({
    bars,
    signalDate: '2026-01-02',
    holdingTradingDays: 1
  });
  assert.equal(result.status, 'blocked_entry');
  assert.equal(result.entryExecution.suspended, true);
});

test('one-price limit-down blocks a strict sell fill', () => {
  const bars = [
    bar('2026-01-02', 10),
    bar('2026-01-05', 10),
    bar('2026-01-06', 9, 9, 100, { high: 9, low: 9 })
  ];
  const result = backtestEvent({
    bars,
    signalDate: '2026-01-02',
    holdingTradingDays: 2
  });
  assert.equal(result.status, 'blocked_exit');
  assert.equal(result.exitExecution.onePriceLimitDown, true);
});

test('round-trip costs are multiplicative', () => {
  assert.equal(returnAfterCost(100, 110, 0.001, 0.001), 1.1 * 0.999 / 1.001 - 1);
});

test('benchmark return is aligned to the stock entry and exit dates', () => {
  const bars = [
    bar('2026-01-02', 10),
    bar('2026-01-05', 10),
    bar('2026-01-06', 11)
  ];
  const benchmarkBars = [
    bar('2026-01-02', 100),
    bar('2026-01-05', 100),
    bar('2026-01-06', 102)
  ];
  const result = backtestEvent({
    bars,
    benchmarkBars,
    signalDate: '2026-01-02',
    holdingTradingDays: 2,
    buyCostRate: 0,
    sellCostRate: 0
  });
  assert.equal(result.status, 'executed');
  assert.ok(Math.abs(result.netReturn - 0.10) < 1e-12);
  assert.ok(Math.abs(result.benchmarkReturn - 0.02) < 1e-12);
  assert.ok(Math.abs(result.excessReturn - 0.08) < 1e-12);
});

test('historical limit rate is explicit instead of inferred from the ticker', () => {
  const bars = [
    bar('2026-01-02', 10, 10, 100, { limitRate: 0.20 }),
    bar('2026-01-05', 11, 11, 100, { high: 11, low: 11, limitRate: 0.20 })
  ];
  const check = executionCheck(bars, 1, 'buy');
  assert.equal(check.onePriceLimitUp, false);
  assert.equal(check.limitRate, 0.20);
});
