const test = require('node:test');
const assert = require('node:assert/strict');
const { validateOpportunityMemo } = require('../scripts/backtest-core-v080.cjs');
const { classifyPriceRegime } = require('../scripts/fetch-precutoff-regime.cjs');

function manifest() {
  return {
    schemaVersion: '1.4',
    runId: 'v08-test',
    skill: { path: 'skills/stock-rador/versions/0.8.0/SKILL.md', version: '0.8.0' },
    discoveryWindow: { startDate: '2025-07-01', endDate: '2025-09-30' },
    trackedHypothesisStates: ['Research hypothesis', 'High-priority hypothesis'],
    trackedSelectionStates: ['No selection', 'Research selection', 'High-priority selection'],
    primarySelectionStates: ['High-priority selection']
  };
}

function ev(conclusion = 'clear') {
  return { conclusion, rationale: 'frozen pre-cutoff evidence', evidenceRefs: ['e1'] };
}

function baseMemo() {
  return {
    skillVersion: '0.8.0',
    cutoffAt: '2025-09-30T15:00:00+08:00',
    researchReadyAt: '2025-09-30T14:00:00+08:00',
    actionableAt: '2025-09-30T14:30:00+08:00',
    hypothesisId: 'h1',
    hypothesisState: 'High-priority hypothesis',
    selectionState: 'High-priority selection',
    expectedRealization: { earliestTradingDays: 20, baseTradingDays: 60, latestTradingDays: 120, rationale: 'test' },
    matchedControls: [
      { ticker: '000002.SZ' },
      { ticker: '000003.SZ' }
    ],
    selectionComparison: { selectedTicker: '000001.SZ' },
    expectationBurdenTest: {
      valuationMethod: 'forward earnings',
      referencePriceAtCutoff: 10,
      marketBaseline: 'baseline',
      thesisScenario: 'scenario',
      breakevenCondition: 'condition',
      ordinaryScenarioFailure: 'failure',
      catalystOrTimingBridge: 'next reporting cycle',
      evidenceRefs: ['e1'],
      conclusion: 'room'
    },
    expectationEvidenceStatus: 'measured_burden',
    expectationResetTest: {
      fundamentalAcceleration: ev(),
      realizedCompanyConfirmation: ev(),
      crossSectionalConfirmation: ev(),
      baselineLag: { baselineType: 'consensus', ...ev() },
      priceAbsorption: { risk: 'moderate', checkMethod: 'compare price with revision baseline', evidenceRefs: ['e1'] },
      unresolvedReason: 'other',
      conclusion: 'credible_reset'
    },
    opportunityTimingTest: {
      priceRegime: {
        method: 'equal-weight frozen opportunity basket versus CSI300',
        lookback20Excess: 0.03,
        lookback60Excess: 0.08,
        positiveBreadth20: 0.67,
        positiveBreadth60: 0.67,
        conclusion: 'favorable',
        evidenceRefs: ['e1']
      },
      fundamentalImpulse: { conclusion: 'accelerating', rationale: 'operating KPIs continue to accelerate', evidenceRefs: ['e1'] },
      earningsRevisionBreadth: { conclusion: 'broad_positive', rationale: 'multiple valid peers have upward revisions', evidenceRefs: ['e1'] },
      eventHalfLife: { conclusion: 'multi_quarter', rationale: 'mechanism persists across reporting cycles', evidenceRefs: ['e1'] },
      lateCycleRisk: { conclusion: 'moderate', rationale: 'not early, but no clear reversal/crowding failure', evidenceRefs: ['e1'] },
      overallConclusion: 'favorable',
      rationale: 'fundamentals, revisions and pre-cutoff opportunity-basket regime are aligned'
    },
    crossSectionalAsymmetryTest: {
      selectedTicker: '000001.SZ',
      qualityFloor: { conclusion: 'pass', rationale: 'cash flow and balance sheet clear the floor', evidenceRefs: ['e1'] },
      revisionHeadroom: { conclusion: 'clear', rationale: 'selected baseline lags new operating evidence more than controls', evidenceRefs: ['e1'] },
      valuationSlack: { conclusion: 'room', rationale: 'selected does not require a richer favorable scenario than controls', evidenceRefs: ['e1'] },
      catalystReachability: { conclusion: 'credible', rationale: 'next reporting cycle can expose the revision gap', evidenceRefs: ['e1'] },
      downsideContainment: { conclusion: 'credible', rationale: 'ordinary scenario does not require thesis failure to avoid large downside', evidenceRefs: ['e1'] },
      pairwise: [
        {
          controlTicker: '000002.SZ',
          revisionAdvantage: 'selected has more unreflected earnings revision headroom',
          valuationAdvantage: 'selected has more room at frozen price',
          qualityTradeoff: 'both pass quality floor',
          catalystAdvantage: 'selected catalyst arrives no later',
          downsideTradeoff: 'selected downside is no worse',
          evidenceRefs: ['e1'],
          switchCondition: 'control receives a larger revision with comparable valuation',
          netAsymmetry: 'selected'
        },
        {
          controlTicker: '000003.SZ',
          revisionAdvantage: 'selected has more unreflected earnings revision headroom',
          valuationAdvantage: 'selected has more room at frozen price',
          qualityTradeoff: 'both pass quality floor',
          catalystAdvantage: 'selected catalyst arrives no later',
          downsideTradeoff: 'selected downside is no worse',
          evidenceRefs: ['e1'],
          switchCondition: 'control receives a larger revision with comparable valuation',
          netAsymmetry: 'selected'
        }
      ],
      overallConclusion: 'clear_asymmetry'
    }
  };
}

test('v0.8 accepts a High-priority memo only when timing and asymmetry are both strong', () => {
  assert.deepEqual(validateOpportunityMemo(baseMemo(), 'memo.json', manifest()), []);
});

test('v0.8 blocks High-priority when opportunity timing is adverse even if company evidence is strong', () => {
  const m = baseMemo();
  m.opportunityTimingTest.priceRegime = {
    ...m.opportunityTimingTest.priceRegime,
    lookback20Excess: -0.03,
    lookback60Excess: -0.08,
    positiveBreadth20: 0.33,
    positiveBreadth60: 0.33,
    conclusion: 'adverse'
  };
  m.opportunityTimingTest.overallConclusion = 'adverse';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires favorable opportunity timing')));
  assert.ok(errors.some((x) => x.includes('requires favorable pre-cutoff industry price regime')));
});

test('v0.8 fails closed if favorable price-regime label contradicts frozen 20/60d breadth', () => {
  const m = baseMemo();
  m.opportunityTimingTest.priceRegime.lookback20Excess = -0.01;
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('favorable priceRegime is inconsistent')));
});

test('v0.8 blocks quality-first ranking when a control has better net asymmetry', () => {
  const m = baseMemo();
  m.crossSectionalAsymmetryTest.pairwise[1].netAsymmetry = 'control';
  m.crossSectionalAsymmetryTest.overallConclusion = 'mixed';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires clear/credible cross-sectional asymmetry')));
  assert.ok(errors.some((x) => x.includes('must beat every frozen control on net asymmetry')));
});

test('v0.8 keeps v0.7 reset-substitute path but still requires timing/asymmetry gates', () => {
  const m = baseMemo();
  m.expectationBurdenTest.conclusion = 'unresolved';
  m.expectationEvidenceStatus = 'reset_substitute';
  m.expectationResetTest.unresolvedReason = 'measurement_gap_only';
  m.expectationResetTest.conclusion = 'credible_reset';
  assert.deepEqual(validateOpportunityMemo(m, 'memo.json', manifest()), []);
});

test('v0.8 allows adverse timing for Research selection but never silently promotes it', () => {
  const m = baseMemo();
  m.selectionState = 'Research selection';
  m.actionableAt = null;
  m.opportunityTimingTest.priceRegime = {
    ...m.opportunityTimingTest.priceRegime,
    lookback20Excess: -0.03,
    lookback60Excess: -0.08,
    positiveBreadth20: 0.33,
    positiveBreadth60: 0.33,
    conclusion: 'adverse'
  };
  m.opportunityTimingTest.overallConclusion = 'adverse';
  assert.deepEqual(validateOpportunityMemo(m, 'memo.json', manifest()), []);
});

test('v0.8 deterministic regime classifier follows frozen sign/breadth rules', () => {
  assert.equal(classifyPriceRegime({
    lookback20Excess: 0.01, lookback60Excess: 0.02,
    positiveBreadth20: 0.5, positiveBreadth60: 0.75
  }), 'favorable');
  assert.equal(classifyPriceRegime({
    lookback20Excess: -0.01, lookback60Excess: -0.02,
    positiveBreadth20: 0.25, positiveBreadth60: 0.25
  }), 'adverse');
  assert.equal(classifyPriceRegime({
    lookback20Excess: 0.01, lookback60Excess: -0.02,
    positiveBreadth20: 0.75, positiveBreadth60: 0.25
  }), 'neutral');
});
