const test = require('node:test');
const assert = require('node:assert/strict');
const { validateOpportunityMemo } = require('../scripts/backtest-core-v100.cjs');

function manifest() {
  return {
    schemaVersion: '1.4',
    runId: 'v100-test',
    skill: { path: 'skills/stock-rador/versions/1.0.0/SKILL.md', version: '1.0.0' },
    discoveryWindow: { startDate: '2024-10-01', endDate: '2024-12-31' },
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
    skillVersion: '1.0.0',
    cutoffAt: '2024-12-31T15:00:00+08:00',
    researchReadyAt: '2024-12-31T14:00:00+08:00',
    actionableAt: '2024-12-31T14:30:00+08:00',
    hypothesisId: 'h1',
    hypothesisState: 'High-priority hypothesis',
    selectionState: 'High-priority selection',
    expectedRealization: { earliestTradingDays: 20, baseTradingDays: 60, latestTradingDays: 120, rationale: 'test' },
    decisionValidityTradingDays: 60,
    expressionArchetype: 'quality_revision',
    timingRoute: 'sector_confirmed',
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
          switchCondition: 'control develops a stronger bridge',
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
          switchCondition: 'control develops a stronger bridge',
          netAsymmetry: 'selected'
        }
      ],
      overallConclusion: 'clear_asymmetry'
    },
    earningsConversionBridge: {
      driverType: 'mix',
      driverChange: 'reported product mix has already shifted toward higher-value products',
      earningsMechanism: 'higher realized mix lifts revenue and operating profit',
      nextObservableMetric: 'next-quarter mix, margin and operating profit',
      realizationWindowTradingDays: 60,
      status: 'realized',
      evidenceRefs: ['e1'],
      failureCondition: 'reported mix or operating profit reverses'
    },
    turningPointConvexityTest: { overallConclusion: 'not_applicable' },
    companyEngineTimingOverrideTest: { overallConclusion: 'not_applicable' }
  };
}

function overrideMemo() {
  const m = baseMemo();
  m.timingRoute = 'company_engine_override';
  m.opportunityTimingTest.priceRegime = {
    ...m.opportunityTimingTest.priceRegime,
    lookback20Excess: -0.12,
    lookback60Excess: -0.05,
    positiveBreadth20: 0.33,
    positiveBreadth60: 0.33,
    conclusion: 'adverse'
  };
  m.opportunityTimingTest.earningsRevisionBreadth = {
    conclusion: 'mixed',
    rationale: 'selected company revisions are strong while broad peers are mixed',
    evidenceRefs: ['e1']
  };
  m.opportunityTimingTest.overallConclusion = 'adverse';
  m.opportunityTimingTest.rationale = 'broad basket price regime is weak despite selected-company fundamentals';
  m.companyEngineTimingOverrideTest = {
    overrideMode: 'fundamental_price_divergence',
    realizedEngine: {
      conclusion: 'clear',
      rationale: 'reported revenue/profit already accelerated from the identified business engine',
      evidenceRefs: ['e1']
    },
    independentFundamentalConfirmation: {
      conclusion: 'credible',
      rationale: 'independent end-market evidence confirms the same demand mechanism',
      evidenceRefs: ['e2']
    },
    fundamentalPriceDivergence: {
      conclusion: 'clear',
      rationale: 'reported fundamentals accelerate while selected shares remain benchmark-relative weak',
      evidenceRefs: ['e1', 'e3']
    },
    nextCatalystWithinBase: {
      conclusion: 'credible',
      rationale: 'the next quarterly report lies inside the base horizon',
      evidenceRefs: ['e1']
    },
    engineHalfLife: {
      conclusion: 'multi_quarter',
      rationale: 'the selected company engine persists beyond the weak broad-sector event window',
      evidenceRefs: ['e1', 'e2']
    },
    priceWeaknessAttribution: {
      conclusion: 'non_company_fundamental',
      rationale: 'weakness is consistent with broad sector de-rating rather than deterioration in selected-company KPIs',
      evidenceRefs: ['e1', 'e3']
    },
    companyPriceDislocation: {
      selected20Excess: -0.18,
      selected60Excess: -0.07,
      conclusion: 'de_rated',
      evidenceRefs: ['e3']
    },
    falsifier: 'selected-company revenue, margin or profit decelerates before the broad sector regime recovers',
    evidenceRefs: ['e1', 'e2', 'e3'],
    overallConclusion: 'clear_override'
  };
  return m;
}

test('v1.0 keeps the normal sector-confirmed High-priority route', () => {
  assert.deepEqual(validateOpportunityMemo(baseMemo(), 'memo.json', manifest()), []);
});

test('v1.0 allows a strict company-engine override under adverse broad timing', () => {
  assert.deepEqual(validateOpportunityMemo(overrideMemo(), 'memo.json', manifest()), []);
});

test('v1.0 company-engine override requires realized, not merely quantitatively bridged, conversion', () => {
  const m = overrideMemo();
  m.earningsConversionBridge.status = 'quantitatively_bridged';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires realized earnings conversion')));
});

test('v1.0 company-engine override cannot use turning-point convexity', () => {
  const m = overrideMemo();
  m.expressionArchetype = 'turning_point_convexity';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('only allowed for quality_revision')));
});

test('v1.0 company-engine override requires valuation room, not merely tight', () => {
  const m = overrideMemo();
  m.crossSectionalAsymmetryTest.valuationSlack.conclusion = 'tight';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires valuationSlack room')));
});

test('v1.0 rejects override when price weakness is attributed to company fundamentals', () => {
  const m = overrideMemo();
  m.companyEngineTimingOverrideTest.priceWeaknessAttribution.conclusion = 'company_fundamental';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires price weakness attributed away from company fundamentals')));
});

test('v1.0 mechanically checks company-price dislocation labels', () => {
  const m = overrideMemo();
  m.companyEngineTimingOverrideTest.companyPriceDislocation.conclusion = 'not_dislocated';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('companyPriceDislocation conclusion is inconsistent')));
});

test('v1.0 sector-confirmed path still fails closed under adverse broad timing', () => {
  const m = baseMemo();
  m.opportunityTimingTest.priceRegime = {
    ...m.opportunityTimingTest.priceRegime,
    lookback20Excess: -0.04,
    lookback60Excess: -0.06,
    positiveBreadth20: 0.33,
    positiveBreadth60: 0.33,
    conclusion: 'adverse'
  };
  m.opportunityTimingTest.overallConclusion = 'adverse';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('unless a valid v1.0 company-engine override')));
});

test('v1.0 research_only route cannot be High-priority', () => {
  const m = baseMemo();
  m.timingRoute = 'research_only';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('cannot use research_only timingRoute')));
});

test('v1.0 override can survive a short-lived broad event when the company engine is multi-quarter', () => {
  const m = overrideMemo();
  m.opportunityTimingTest.eventHalfLife = {
    conclusion: 'short_lived',
    rationale: 'broad sector event is front-loaded',
    evidenceRefs: ['e1']
  };
  assert.deepEqual(validateOpportunityMemo(m, 'memo.json', manifest()), []);
});

test('v1.0 override rejects a short-lived company engine', () => {
  const m = overrideMemo();
  m.companyEngineTimingOverrideTest.engineHalfLife.conclusion = 'short_lived';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires structural or multi-quarter company-engine half-life')));
});

test('v1.0 override requires clear, not merely credible, cross-sectional asymmetry', () => {
  const m = overrideMemo();
  m.crossSectionalAsymmetryTest.overallConclusion = 'credible_asymmetry';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires clear asymmetry')));
});
