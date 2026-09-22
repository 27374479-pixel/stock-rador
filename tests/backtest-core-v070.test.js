const test = require('node:test');
const assert = require('node:assert/strict');
const { validateOpportunityMemo } = require('../scripts/backtest-core-v070.cjs');

function manifest() {
  return {
    schemaVersion: '1.4',
    runId: 'v07-test',
    skill: { path: 'skills/stock-rador/versions/0.7.0/SKILL.md', version: '0.7.0' },
    discoveryWindow: { startDate: '2026-04-01', endDate: '2026-06-30' },
    trackedHypothesisStates: ['Research hypothesis', 'High-priority hypothesis'],
    trackedSelectionStates: ['No selection', 'Research selection', 'High-priority selection'],
    primarySelectionStates: ['High-priority selection']
  };
}

function component(conclusion = 'clear') {
  return { conclusion, rationale: 'pre-cutoff evidence supports this component', evidenceRefs: ['e1'] };
}

function memo(overrides = {}) {
  return {
    skillVersion: '0.7.0',
    cutoffAt: '2026-06-30T15:00:00+08:00',
    researchReadyAt: '2026-06-30T14:00:00+08:00',
    actionableAt: '2026-06-30T14:30:00+08:00',
    hypothesisId: 'h1',
    hypothesisState: 'High-priority hypothesis',
    selectionState: 'High-priority selection',
    expectedRealization: { earliestTradingDays: 20, baseTradingDays: 60, latestTradingDays: 120, rationale: 'test' },
    matchedControls: [],
    selectionComparison: { selectedTicker: '000001.SZ', pairwise: [], selectionEdgeConclusion: 'credible', rationale: 'test' },
    expectationBurdenTest: {
      valuationMethod: 'forward earnings',
      referencePriceAtCutoff: null,
      marketBaseline: 'baseline',
      thesisScenario: 'scenario',
      breakevenCondition: 'condition',
      ordinaryScenarioFailure: 'failure',
      catalystOrTimingBridge: '',
      evidenceRefs: ['e1'],
      conclusion: 'unresolved'
    },
    expectationEvidenceStatus: 'reset_substitute',
    expectationResetTest: {
      fundamentalAcceleration: component(),
      realizedCompanyConfirmation: component(),
      crossSectionalConfirmation: component('credible'),
      baselineLag: { baselineType: 'prior_run_rate', ...component('credible') },
      priceAbsorption: { risk: 'moderate', checkMethod: 'pre-cutoff price reaction versus earnings reset', evidenceRefs: ['e1'] },
      unresolvedReason: 'measurement_gap_only',
      conclusion: 'credible_reset'
    },
    ...overrides
  };
}

test('v0.7 allows unresolved conventional burden only through strict reset substitute', () => {
  assert.deepEqual(validateOpportunityMemo(memo(), 'memo.json', manifest()), []);
});

test('v0.7 rejects reset substitute when unresolved reason is evidence conflict', () => {
  const m = memo();
  m.expectationResetTest.unresolvedReason = 'evidence_conflict';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('measurement_gap_only')));
});

test('v0.7 rejects reset substitute when price absorption risk is high', () => {
  const m = memo();
  m.expectationResetTest.priceAbsorption.risk = 'high';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('low or moderate priceAbsorption risk')));
});

test('v0.7 rejects reset substitute when any required component is mixed', () => {
  const m = memo();
  m.expectationResetTest.baselineLag.conclusion = 'mixed';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('baselineLag clear or credible')));
});

test('v0.7 still blocks fully priced high-priority selections', () => {
  const m = memo();
  m.expectationBurdenTest.conclusion = 'fully_priced';
  m.expectationEvidenceStatus = 'measured_burden';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('fully_priced')));
});
