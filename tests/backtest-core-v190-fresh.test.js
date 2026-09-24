const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateFreshIncrementalEscalationTest,
  validateFreshIncrementalSourceLink
} = require('../scripts/backtest-core-v190.cjs');

function manifest() {
  return { skill: { version: '1.9.0' } };
}

function freshMemo() {
  return {
    selectionState: 'High-priority selection',
    cutoffAt: '2024-12-31T15:00:00+08:00',
    timingRoute: 'base_horizon_convexity',
    expectedRealization: { baseTradingDays: 60 },
    earningsConversionBridge: { status: 'realized' },
    expectationEvidenceStatus: 'measured_burden',
    expectationBurdenTest: { conclusion: 'tight' },
    crossSectionalAsymmetryTest: {
      valuationSlack: { conclusion: 'tight' },
      qualityFloor: { conclusion: 'pass' },
      catalystReachability: { conclusion: 'clear' }
    },
    highAbsorptionContinuationTest: {
      freshIncrementalDriver: { conclusion: 'clear' }
    },
    opportunityTimingTest: {
      priceRegime: { conclusion: 'neutral' }
    },
    baseHorizonConvexityTest: { conclusion: 'credible_route' },
    adversarialEvidenceTest: {
      searchCompleteness: 'complete',
      counterThesisSeverity: 'moderate',
      conclusion: 'proceed_with_caveats'
    },
    selectionComparison: {
      pairwise: [{ controlTicker: '000002.SZ', netEdge: 'mixed' }]
    },
    freshIncrementalEscalationTest: {
      applicable: true,
      eventId: 'event-new',
      discoveryNovelty: 'new',
      eventFirstAvailableAt: '2024-12-20T09:00:00+08:00',
      baselineAsOfAt: '2024-12-10T15:00:00+08:00',
      freshDriverEvidenceRefs: ['event-e1'],
      baselineEvidenceRefs: ['baseline-e1'],
      evidenceRefs: ['event-e1', 'baseline-e1'],
      boundedRiskContainment: {
        conclusion: 'credible',
        rationale: 'Risk is bounded by a pre-registered base-horizon exit.',
        evidenceRefs: ['risk-e1']
      },
      riskWindowTradingDays: 60,
      exitDiscipline: 'Exit or fully re-underwrite by the 60-trading-day base horizon.',
      falsifier: 'The new driver fails to change the next observable company earnings metric.',
      conclusion: 'credible_route'
    }
  };
}

function sourcePack(novelty = 'new') {
  return {
    eventClusters: [{
      eventId: 'event-new',
      noveltyAssessment: novelty,
      firstAvailableAt: '2024-12-20T09:00:00+08:00',
      memberItemIds: ['event-e1']
    }],
    sourceItems: [{
      itemId: 'event-e1',
      availableAt: '2024-12-20T09:00:00+08:00'
    }],
    evidenceDocuments: [{
      id: 'baseline-e1',
      availableAt: '2024-12-10T14:00:00+08:00'
    }, {
      id: 'risk-e1',
      availableAt: '2024-12-15T14:00:00+08:00'
    }]
  };
}

test('v1.9 accepts a tightly bounded fresh incremental escalation shape', () => {
  assert.deepEqual(
    validateFreshIncrementalEscalationTest(freshMemo(), 'memo.json', manifest()),
    []
  );
});

test('v1.9 positive fresh route requires discovery novelty new', () => {
  const m = freshMemo();
  m.freshIncrementalEscalationTest.discoveryNovelty = 'continuation';
  const errors = validateFreshIncrementalEscalationTest(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires discovery novelty new')));
});

test('v1.9 fresh route rejects unresolved expectation burden', () => {
  const m = freshMemo();
  m.expectationBurdenTest.conclusion = 'unresolved';
  const errors = validateFreshIncrementalEscalationTest(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires room/tight expectation burden')));
});

test('v1.9 fresh route rejects unresolved valuation slack', () => {
  const m = freshMemo();
  m.crossSectionalAsymmetryTest.valuationSlack.conclusion = 'unresolved';
  const errors = validateFreshIncrementalEscalationTest(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires room/tight valuation slack')));
});

test('v1.9 fresh route still refuses adverse broad timing', () => {
  const m = freshMemo();
  m.opportunityTimingTest.priceRegime.conclusion = 'adverse';
  const errors = validateFreshIncrementalEscalationTest(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires favorable or neutral broad timing')));
});

test('v1.9 fresh route risk window cannot exceed the base horizon', () => {
  const m = freshMemo();
  m.freshIncrementalEscalationTest.riskWindowTradingDays = 61;
  const errors = validateFreshIncrementalEscalationTest(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('risk window cannot exceed the base horizon')));
});

test('v1.9 fresh route rejects post-cutoff event timestamps', () => {
  const m = freshMemo();
  m.freshIncrementalEscalationTest.eventFirstAvailableAt = '2025-01-01T09:00:00+08:00';
  const errors = validateFreshIncrementalEscalationTest(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('event cannot be post-cutoff')));
});

test('v1.9 fresh route baseline must predate the event', () => {
  const m = freshMemo();
  m.freshIncrementalEscalationTest.baselineAsOfAt = '2024-12-21T15:00:00+08:00';
  const errors = validateFreshIncrementalEscalationTest(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('baseline must predate the new event')));
});

test('v1.9 source link accepts a matching frozen new event', () => {
  assert.deepEqual(
    validateFreshIncrementalSourceLink(freshMemo(), 'memo.json', sourcePack(), manifest()),
    []
  );
});

test('v1.9 source link cannot relabel a frozen continuation event', () => {
  const errors = validateFreshIncrementalSourceLink(
    freshMemo(), 'memo.json', sourcePack('continuation'), manifest()
  );
  assert.ok(errors.some((x) => x.includes('discoveryNovelty does not match')));
  assert.ok(errors.some((x) => x.includes('cannot link to a continuation event')));
});

test('v1.9 source link requires event-member fresh evidence', () => {
  const m = freshMemo();
  m.freshIncrementalEscalationTest.freshDriverEvidenceRefs = ['baseline-e1'];
  const errors = validateFreshIncrementalSourceLink(m, 'memo.json', sourcePack(), manifest());
  assert.ok(errors.some((x) => x.includes('must include a member source')));
});

test('v1.9 source link requires baseline evidence to exist by baselineAsOfAt', () => {
  const pack = sourcePack();
  pack.evidenceDocuments[0].availableAt = '2024-12-11T14:00:00+08:00';
  const errors = validateFreshIncrementalSourceLink(freshMemo(), 'memo.json', pack, manifest());
  assert.ok(errors.some((x) => x.includes('baseline evidence was not available by baselineAsOfAt')));
});

test('v1.9 explicit non-applicable audit remains valid for an ordinary selected memo', () => {
  const m = {
    selectionState: 'Research selection',
    freshIncrementalEscalationTest: {
      applicable: false,
      discoveryNovelty: 'not_applicable',
      conclusion: 'not_applicable'
    }
  };
  assert.deepEqual(validateFreshIncrementalEscalationTest(m, 'memo.json', manifest()), []);
});
