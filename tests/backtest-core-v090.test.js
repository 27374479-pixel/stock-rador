const test = require('node:test');
const assert = require('node:assert/strict');
const { validateOpportunityMemo } = require('../scripts/backtest-core-v090.cjs');

function manifest() {
  return {
    schemaVersion: '1.4',
    runId: 'v09-test',
    skill: { path: 'skills/stock-rador/versions/0.9.0/SKILL.md', version: '0.9.0' },
    discoveryWindow: { startDate: '2025-04-01', endDate: '2025-06-30' },
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
    skillVersion: '0.9.0',
    cutoffAt: '2025-06-30T15:00:00+08:00',
    researchReadyAt: '2025-06-30T14:00:00+08:00',
    actionableAt: '2025-06-30T14:30:00+08:00',
    hypothesisId: 'h1',
    hypothesisState: 'High-priority hypothesis',
    selectionState: 'High-priority selection',
    expectedRealization: { earliestTradingDays: 20, baseTradingDays: 60, latestTradingDays: 120, rationale: 'test' },
    decisionValidityTradingDays: 60,
    expressionArchetype: 'quality_revision',
    matchedControls: [{ ticker: '000002.SZ' }, { ticker: '000003.SZ' }],
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
        lookback20Excess: 0.03, lookback60Excess: 0.08,
        positiveBreadth20: 0.67, positiveBreadth60: 0.67,
        conclusion: 'favorable', evidenceRefs: ['e1']
      },
      fundamentalImpulse: { conclusion: 'accelerating', rationale: 'KPIs accelerate', evidenceRefs: ['e1'] },
      earningsRevisionBreadth: { conclusion: 'broad_positive', rationale: 'revisions broad', evidenceRefs: ['e1'] },
      eventHalfLife: { conclusion: 'multi_quarter', rationale: 'persists', evidenceRefs: ['e1'] },
      lateCycleRisk: { conclusion: 'moderate', rationale: 'not extreme', evidenceRefs: ['e1'] },
      overallConclusion: 'favorable',
      rationale: 'timing aligned'
    },
    crossSectionalAsymmetryTest: {
      selectedTicker: '000001.SZ',
      qualityFloor: { conclusion: 'pass', rationale: 'quality passes', evidenceRefs: ['e1'] },
      revisionHeadroom: { conclusion: 'clear', rationale: 'revision room', evidenceRefs: ['e1'] },
      valuationSlack: { conclusion: 'room', rationale: 'valuation room', evidenceRefs: ['e1'] },
      catalystReachability: { conclusion: 'credible', rationale: 'catalyst reachable', evidenceRefs: ['e1'] },
      downsideContainment: { conclusion: 'credible', rationale: 'downside contained', evidenceRefs: ['e1'] },
      pairwise: [
        {
          controlTicker: '000002.SZ',
          revisionAdvantage: 'selected has a larger direct earnings bridge',
          valuationAdvantage: 'selected has more room',
          qualityTradeoff: 'both pass',
          catalystAdvantage: 'selected converts sooner',
          downsideTradeoff: 'selected downside no worse',
          evidenceRefs: ['e1'],
          switchCondition: 'control develops a stronger conversion bridge',
          netAsymmetry: 'selected'
        },
        {
          controlTicker: '000003.SZ',
          revisionAdvantage: 'selected has a larger direct earnings bridge',
          valuationAdvantage: 'selected has more room',
          qualityTradeoff: 'both pass',
          catalystAdvantage: 'selected converts sooner',
          downsideTradeoff: 'selected downside no worse',
          evidenceRefs: ['e1'],
          switchCondition: 'control develops a stronger conversion bridge',
          netAsymmetry: 'selected'
        }
      ],
      overallConclusion: 'clear_asymmetry'
    },
    earningsConversionBridge: {
      driverType: 'volume',
      driverChange: 'reported shipment growth already exceeds the frozen baseline',
      earningsMechanism: 'higher volume at stable unit margin raises revenue and operating profit',
      nextObservableMetric: 'next-quarter shipment and operating profit',
      realizationWindowTradingDays: 60,
      status: 'realized',
      evidenceRefs: ['e1'],
      failureCondition: 'shipment growth does not translate into operating profit'
    },
    turningPointConvexityTest: { overallConclusion: 'not_applicable' }
  };
}

function turningPointMemo() {
  const m = baseMemo();
  m.expressionArchetype = 'turning_point_convexity';
  m.crossSectionalAsymmetryTest.qualityFloor = {
    conclusion: 'fail',
    rationale: 'current trailing profit quality is weak because the cycle is at the trough',
    evidenceRefs: ['e1']
  };
  m.earningsConversionBridge = {
    driverType: 'price',
    driverChange: 'selling price/spread has already turned while unit costs are stable',
    earningsMechanism: 'small gross-margin recovery on a large revenue base creates disproportionate profit recovery',
    nextObservableMetric: 'gross margin and quarterly operating profit',
    realizationWindowTradingDays: 40,
    status: 'quantitatively_bridged',
    evidenceRefs: ['e1'],
    failureCondition: 'gross margin fails to recover or cash burn accelerates'
  };
  m.turningPointConvexityTest = {
    survivalFloor: {
      conclusion: 'pass',
      rationale: 'liquidity and balance sheet can fund the expected realization window without rescue financing',
      evidenceRefs: ['e1']
    },
    inflectionEvidence: {
      conclusion: 'credible',
      rationale: 'sequential price/spread and margin indicators have turned before the cutoff',
      evidenceRefs: ['e1']
    },
    operatingLeverage: {
      conclusion: 'clear',
      rationale: 'large fixed-cost base makes the frozen margin change economically material to profit',
      evidenceRefs: ['e1']
    },
    workingCapitalRisk: {
      conclusion: 'moderate',
      rationale: 'inventory/receivables are elevated but funded and not accelerating beyond the bridge',
      evidenceRefs: ['e1']
    },
    downsideFailure: 'price/spread reversal plus renewed inventory/cash burn invalidates the convexity case',
    evidenceRefs: ['e1'],
    overallConclusion: 'credible_convexity'
  };
  return m;
}

test('v0.9 accepts quality/revision High-priority only with a direct earnings-conversion bridge', () => {
  assert.deepEqual(validateOpportunityMemo(baseMemo(), 'memo.json', manifest()), []);
});

test('v0.9 blocks proxy-only catch-up evidence from High-priority', () => {
  const m = baseMemo();
  m.earningsConversionBridge.status = 'proxy_only';
  m.earningsConversionBridge.driverType = 'order_backlog';
  m.earningsConversionBridge.driverChange = 'contract liabilities and cash receipts improved';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires realized or quantitatively_bridged earnings conversion')));
});

test('v0.9 blocks a conversion bridge that cannot be observed by the base horizon', () => {
  const m = baseMemo();
  m.earningsConversionBridge.realizationWindowTradingDays = 90;
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('observable by the base thesis horizon')));
});

test('v0.9 allows turning-point convexity with weak trailing quality only under a strict survival/inflection bridge', () => {
  assert.deepEqual(validateOpportunityMemo(turningPointMemo(), 'memo.json', manifest()), []);
});

test('v0.9 rejects a turning-point candidate that fails the survival floor', () => {
  const m = turningPointMemo();
  m.turningPointConvexityTest.survivalFloor.conclusion = 'fail';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires survivalFloor pass')));
});

test('v0.9 rejects a turning-point candidate with high working-capital risk', () => {
  const m = turningPointMemo();
  m.turningPointConvexityTest.workingCapitalRisk.conclusion = 'high';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires low/moderate working-capital risk')));
});

test('v0.9 rejects speculative convexity even if the sector timing is favorable', () => {
  const m = turningPointMemo();
  m.earningsConversionBridge.status = 'speculative';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires realized or quantitatively_bridged earnings conversion')));
});

test('v0.9 decision validity is pinned to the pre-registered base horizon', () => {
  const m = baseMemo();
  m.decisionValidityTradingDays = 120;
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('must equal expectedRealization.baseTradingDays')));
});
