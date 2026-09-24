const test = require('node:test');
const assert = require('node:assert/strict');
const { auditVariableBase } = require('../scripts/audit-variable-base-horizon.cjs');

test('variable-base audit uses each memo frozen thesisBaseOutcome instead of a common 60d horizon', () => {
  const outcome = {
    runId: 'x',
    results: [
      {
        hypothesisId: 'short',
        ticker: 'A',
        isPrimarySignal: true,
        expectedRealization: { baseTradingDays: 20 },
        thesisBaseOutcome: { netReturn: 0.07, excessReturn: 0.08, matchedControlExcess: 0.04, excessVsBestControl: 0.02, winsAllControls: true },
        horizons: { '60': { netReturn: -0.1, excessReturn: -0.08 } }
      },
      {
        hypothesisId: 'long',
        ticker: 'B',
        isPrimarySignal: true,
        expectedRealization: { baseTradingDays: 60 },
        thesisBaseOutcome: { netReturn: 0.01, excessReturn: 0.03, matchedControlExcess: -0.02, excessVsBestControl: -0.1, winsAllControls: false }
      }
    ]
  };
  const report = auditVariableBase(outcome);
  assert.equal(report.aggregate.count, 2);
  assert.equal(report.aggregate.directionCaptureRate, 1);
  assert.equal(report.aggregate.positiveBasketRate, 1);
  assert.equal(report.hypothesisRows.find((x)=>x.hypothesisId==='short').baseTradingDays, 20);
  assert.equal(report.hypothesisRows.find((x)=>x.hypothesisId==='short').excessReturn, 0.08);
});

test('variable-base audit averages multiple acceptable expressions within one hypothesis at the frozen base', () => {
  const outcome = {
    runId: 'x',
    results: [
      { hypothesisId:'h', ticker:'A', isPrimarySignal:true, expectedRealization:{baseTradingDays:20}, thesisBaseOutcome:{netReturn:0.1,excessReturn:0.08} },
      { hypothesisId:'h', ticker:'B', isPrimarySignal:true, expectedRealization:{baseTradingDays:20}, thesisBaseOutcome:{netReturn:0.2,excessReturn:0.12} }
    ]
  };
  const report = auditVariableBase(outcome);
  assert.equal(report.aggregate.count, 1);
  assert.equal(report.hypothesisRows[0].tickerCount, 2);
  assert.equal(report.hypothesisRows[0].netReturn, 0.15000000000000002);
  assert.equal(report.hypothesisRows[0].excessReturn, 0.1);
});
