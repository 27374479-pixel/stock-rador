const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyCompanyPriceDislocation, validateOpportunityMemo } = require('../scripts/backtest-core-v150.cjs');

function manifest() {
  return {
    schemaVersion: '1.4',
    runId: 'v150-test',
    skill: { path: 'skills/stock-rador/versions/1.5.0/SKILL.md', version: '1.5.0' },
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
    skillVersion: '1.5.0',
    equityReturnArchetype: 'ordinary_growth_compounder',
    acceptableExpressionSet: [{
      ticker: '000001.SZ',
      role: 'preferred',
      directExposure: 'clear',
      earningsConversion: 'clear',
      balanceSheetOrSurvival: 'pass',
      expectationFit: 'clear',
      downsideContainment: 'credible',
      conclusion: 'acceptable',
      rationale: 'Direct exposure and earnings bridge are adequate without requiring exact peer superiority.',
      evidenceRefs: ['e1']
    }],
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
    companyEngineTimingOverrideTest: { overallConclusion: 'not_applicable' },
    hypothesisDecompositionTest: {
      unitOfAnalysis: 'single_product_market',
      productMarketScope: 'one economically coherent product/customer market',
      geographicScope: 'China with explicitly frozen cross-border inputs',
      customerScope: 'verified exposed customers',
      decompositionNeeded: false,
      siblingHypothesisIds: [],
      rationale: 'no materially divergent product, geography, customer or time-horizon causal path is being averaged together',
      evidenceRefs: ['e1'],
      conclusion: 'well_scoped'
    },
    evidenceHorizonMatrix: {
      nearTerm: { direction: 'positive', driver: 'current operating KPI acceleration', horizon: 'current quarter', evidenceRefs: ['e1'] },
      mediumTerm: { direction: 'positive', driver: 'earnings conversion inside base horizon', horizon: 'next 60 trading days', evidenceRefs: ['e1'] },
      structural: { direction: 'positive', driver: 'durable share/product mechanism', horizon: 'next several quarters', evidenceRefs: ['e1'] },
      conflictType: 'aligned',
      resolutionRule: 'keep each horizon explicit and do not average contradictory evidence away',
      conclusion: 'coherent'
    },
    leaderDivergenceTest: {
      sectorSignal: 'positive',
      companySignal: 'positive',
      divergence: 'none',
      companyEvidenceConclusion: 'clear',
      rationale: 'company and sector operating evidence point in the same direction',
      evidenceRefs: ['e1']
    },
    highAbsorptionContinuationTest: {
      applicable: false,
      absorptionState: 'moderate',
      freshIncrementalDriver: { conclusion: 'credible', rationale: 'new operating evidence is identifiable', evidenceRefs: ['e1'] },
      realizedEarningsSupport: { conclusion: 'clear', rationale: 'earnings support is realized', evidenceRefs: ['e1'] },
      revisionVelocity: { conclusion: 'credible', rationale: 'revision path remains measurable', evidenceRefs: ['e1'] },
      durationMechanism: { conclusion: 'credible', rationale: 'duration mechanism is explicit', evidenceRefs: ['e1'] },
      narrativeRepetitionRisk: 'moderate',
      falsifier: 'no new earnings-path information appears inside the base horizon',
      conclusion: 'not_applicable'
    },
    expressionPurityTest: {
      preferredTicker: '000001.SZ',
      purestTicker: '000001.SZ',
      purityIsDecisionDriver: false,
      expectationBurdenComparison: 'preferred expression is not chosen solely for thematic purity',
      earningsQualityComparison: 'earnings quality remains a co-equal criterion',
      downsideComparison: 'downside containment remains a co-equal criterion',
      evidenceRefs: ['e1'],
      conclusion: 'balanced'
    },
    expectationPathTest: {
      baselinePath: {
        basis: 'consensus',
        nearTerm: 'current-year earnings already reflect the known operating baseline',
        nextPeriod: 'next-year earnings grow at a moderate rate embedded in consensus',
        laterPeriod: 'later earnings normalize toward a stable compound path',
        rationale: 'freeze the market earnings path rather than a point multiple',
        evidenceRefs: ['e1']
      },
      thesisPath: {
        nearTermChange: 'near-term earnings can exceed the frozen baseline',
        nextPeriodChange: 'the identified engine remains stronger than the frozen next-period baseline',
        laterPeriodChange: 'the advantage remains economically relevant without requiring perpetual acceleration',
        mechanism: 'realized operating conversion and still-underreflected duration improve the full earnings path',
        evidenceRefs: ['e1']
      },
      pathShape: 'stable_compound',
      incrementalPathAdvantage: {
        conclusion: 'credible',
        rationale: 'the thesis improves more than the current quarter and is not already fully in the frozen baseline',
        evidenceRefs: ['e1']
      },
      durationRisk: {
        conclusion: 'moderate',
        rationale: 'valuation depends on continued execution but not on an extreme multi-year growth assumption',
        evidenceRefs: ['e1']
      },
      falsifier: 'next-period or later-period earnings path fails to improve versus the frozen baseline',
      overallConclusion: 'credible_path_room'
    }
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

test('v1.5 keeps the normal sector-confirmed High-priority route', () => {
  assert.deepEqual(validateOpportunityMemo(baseMemo(), 'memo.json', manifest()), []);
});

test('v1.5 allows a strict company-engine override under adverse broad timing', () => {
  assert.deepEqual(validateOpportunityMemo(overrideMemo(), 'memo.json', manifest()), []);
});

test('v1.5 company-engine override requires realized, not merely quantitatively bridged, conversion', () => {
  const m = overrideMemo();
  m.earningsConversionBridge.status = 'quantitatively_bridged';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires realized earnings conversion')));
});

test('v1.5 company-engine override cannot use turning-point convexity', () => {
  const m = overrideMemo();
  m.expressionArchetype = 'turning_point_convexity';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('only allowed for quality_revision')));
});

test('v1.5 company-engine override requires valuation room, not merely tight', () => {
  const m = overrideMemo();
  m.crossSectionalAsymmetryTest.valuationSlack.conclusion = 'tight';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires valuationSlack room')));
});

test('v1.5 rejects override when price weakness is attributed to company fundamentals', () => {
  const m = overrideMemo();
  m.companyEngineTimingOverrideTest.priceWeaknessAttribution.conclusion = 'company_fundamental';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires price weakness attributed away from company fundamentals')));
});

test('v1.5 mechanically rejects legacy company-price dislocation labels', () => {
  const m = overrideMemo();
  m.companyEngineTimingOverrideTest.companyPriceDislocation.conclusion = 'not_dislocated';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('companyPriceDislocation.conclusion is invalid')));
});

test('v1.5 sector-confirmed path still fails closed under adverse broad timing', () => {
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
  assert.ok(errors.some((x) => x.includes('unless a valid v1.1+ company-engine override')));
});

test('v1.5 research_only route cannot be High-priority', () => {
  const m = baseMemo();
  m.timingRoute = 'research_only';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('cannot use research_only timingRoute')));
});

test('v1.5 override can survive a short-lived broad event when the company engine is multi-quarter', () => {
  const m = overrideMemo();
  m.opportunityTimingTest.eventHalfLife = {
    conclusion: 'short_lived',
    rationale: 'broad sector event is front-loaded',
    evidenceRefs: ['e1']
  };
  assert.deepEqual(validateOpportunityMemo(m, 'memo.json', manifest()), []);
});

test('v1.5 override rejects a short-lived company engine', () => {
  const m = overrideMemo();
  m.companyEngineTimingOverrideTest.engineHalfLife.conclusion = 'short_lived';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires structural or multi-quarter company-engine half-life')));
});

test('v1.5 override requires clear, not merely credible, cross-sectional asymmetry', () => {
  const m = overrideMemo();
  m.crossSectionalAsymmetryTest.overallConclusion = 'credible_asymmetry';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires clear asymmetry')));
});

test('v1.5 deterministically distinguishes de-rated, early-turn, late-reversal and sustained-strength states', () => {
  assert.equal(classifyCompanyPriceDislocation(-0.18, -0.07), 'de_rated');
  assert.equal(classifyCompanyPriceDislocation(0.08, -0.14), 'early_turn');
  assert.equal(classifyCompanyPriceDislocation(-0.06, 0.27), 'late_reversal');
  assert.equal(classifyCompanyPriceDislocation(0.08, 0.14), 'sustained_strength');
});

test('v1.5 allows early-turn company-engine override', () => {
  const m = overrideMemo();
  m.companyEngineTimingOverrideTest.companyPriceDislocation = {
    selected20Excess: 0.08,
    selected60Excess: -0.14,
    conclusion: 'early_turn',
    evidenceRefs: ['e3']
  };
  assert.deepEqual(validateOpportunityMemo(m, 'memo.json', manifest()), []);
});

test('v1.5 blocks late-reversal company-engine override even when fundamentals remain strong', () => {
  const m = overrideMemo();
  m.companyEngineTimingOverrideTest.companyPriceDislocation = {
    selected20Excess: -0.06,
    selected60Excess: 0.27,
    conclusion: 'late_reversal',
    evidenceRefs: ['e3']
  };
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires de_rated or early_turn company price dislocation')));
});

test('v1.5 blocks sustained-strength company-engine override because the override is not an already-rerated chase route', () => {
  const m = overrideMemo();
  m.companyEngineTimingOverrideTest.companyPriceDislocation = {
    selected20Excess: 0.08,
    selected60Excess: 0.14,
    conclusion: 'sustained_strength',
    evidenceRefs: ['e3']
  };
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires de_rated or early_turn company price dislocation')));
});

test('v1.5 rejects a mislabeled early-turn / late-reversal state', () => {
  const m = overrideMemo();
  m.companyEngineTimingOverrideTest.companyPriceDislocation = {
    selected20Excess: -0.06,
    selected60Excess: 0.27,
    conclusion: 'early_turn',
    evidenceRefs: ['e3']
  };
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('companyPriceDislocation conclusion is inconsistent')));
});


test('v1.5 blocks High-priority when the thesis only extends near-term earnings but does not improve the frozen path', () => {
  const m = baseMemo();
  m.expectationPathTest.pathShape = 'peak_cycle_decline';
  m.expectationPathTest.baselinePath.nearTerm = 'current-year super-profit remains high';
  m.expectationPathTest.baselinePath.nextPeriod = 'consensus already expects profit to decline next year';
  m.expectationPathTest.baselinePath.laterPeriod = 'later earnings normalize further as supply arrives';
  m.expectationPathTest.thesisPath.nearTermChange = 'the shortage may keep current-year profit high for one more quarter';
  m.expectationPathTest.thesisPath.nextPeriodChange = 'no evidence that next-year decline is better than consensus';
  m.expectationPathTest.thesisPath.laterPeriodChange = 'no evidence that normalized later earnings improve';
  m.expectationPathTest.incrementalPathAdvantage.conclusion = 'mixed';
  m.expectationPathTest.durationRisk.conclusion = 'high';
  m.expectationPathTest.overallConclusion = 'mixed';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires clear/credible incremental earnings-path advantage')));
  assert.ok(errors.some((x) => x.includes('requires low/moderate expectation-duration risk')));
  assert.ok(errors.some((x) => x.includes('requires clear/credible expectation-path room')));
});

test('v1.5 blocks premium growth when the frozen baseline already capitalizes long-duration exceptional growth', () => {
  const m = baseMemo();
  m.expectationPathTest.pathShape = 'long_duration_growth';
  m.expectationPathTest.baselinePath.nearTerm = 'very high current growth is already expected';
  m.expectationPathTest.baselinePath.nextPeriod = 'near-doubling next-period earnings are already embedded';
  m.expectationPathTest.baselinePath.laterPeriod = 'later-period superior growth remains embedded in the premium';
  m.expectationPathTest.thesisPath.nearTermChange = 'current earnings can still beat';
  m.expectationPathTest.thesisPath.nextPeriodChange = 'no independent evidence of growth above the already-exceptional baseline';
  m.expectationPathTest.thesisPath.laterPeriodChange = 'no incremental evidence on duration';
  m.expectationPathTest.incrementalPathAdvantage.conclusion = 'mixed';
  m.expectationPathTest.durationRisk.conclusion = 'high';
  m.expectationPathTest.overallConclusion = 'mixed';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('expectation-duration risk')));
});

test('v1.5 requires an explicit near / next / later market baseline path', () => {
  const m = baseMemo();
  m.expectationPathTest.baselinePath.laterPeriod = '';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('baselinePath.laterPeriod is required')));
});

test('v1.5 allows a de-rated cyclical High-priority case when the thesis credibly improves the full path, not just spot earnings', () => {
  const m = overrideMemo();
  m.expectationPathTest = {
    baselinePath: {
      basis: 'published_forecast',
      nearTerm: 'current high earnings are expected to persist through the present year',
      nextPeriod: 'market expects partial normalization but still-profitable operations',
      laterPeriod: 'normalized earnings remain positive rather than collapsing to a loss',
      rationale: 'the baseline explicitly separates current windfall from normalized profitability',
      evidenceRefs: ['e1']
    },
    thesisPath: {
      nearTermChange: 'realized earnings remain above the frozen current-year baseline',
      nextPeriodChange: 'supply constraints and low-cost operations extend elevated earnings into the next period',
      laterPeriodChange: 'cost position supports normalized earnings above the frozen later-period baseline',
      mechanism: 'persistent low-cost advantage changes both duration and normalized earnings, not only spot profit',
      evidenceRefs: ['e1', 'e2']
    },
    pathShape: 'peak_cycle_decline',
    incrementalPathAdvantage: {
      conclusion: 'credible',
      rationale: 'the thesis improves both the normalization slope and the later earnings floor',
      evidenceRefs: ['e1', 'e2']
    },
    durationRisk: {
      conclusion: 'moderate',
      rationale: 'cycle normalization remains a risk but the thesis does not require permanent peak pricing',
      evidenceRefs: ['e1']
    },
    falsifier: 'next-period forecast or normalized earnings floor falls back to or below the frozen baseline',
    overallConclusion: 'credible_path_room'
  };
  assert.deepEqual(validateOpportunityMemo(m, 'memo.json', manifest()), []);
});

test('v1.5 Research selection may preserve a mixed expectation path without being silently promoted', () => {
  const m = baseMemo();
  m.selectionState = 'Research selection';
  m.actionableAt = null;
  m.expectationPathTest.incrementalPathAdvantage.conclusion = 'mixed';
  m.expectationPathTest.durationRisk.conclusion = 'high';
  m.expectationPathTest.overallConclusion = 'mixed';
  assert.deepEqual(validateOpportunityMemo(m, 'memo.json', manifest()), []);
});

test('v1.5 allows a High-priority acceptable expression without beating every frozen control', () => {
  const m = baseMemo();
  m.selectionState = 'High-priority selection';
  m.hypothesisState = 'High-priority hypothesis';
  m.actionableAt = m.researchReadyAt;
  m.crossSectionalAsymmetryTest.overallConclusion = 'mixed';
  m.crossSectionalAsymmetryTest.pairwise[0].netAsymmetry = 'mixed';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(!errors.some((x) => x.includes('must beat every frozen control')));
  assert.ok(!errors.some((x) => x.includes('requires clear/credible cross-sectional asymmetry')));
});

test('v1.5 still blocks a clearly inferior expression', () => {
  const m = baseMemo();
  m.selectionState = 'High-priority selection';
  m.hypothesisState = 'High-priority hypothesis';
  m.actionableAt = m.researchReadyAt;
  m.crossSectionalAsymmetryTest.overallConclusion = 'mixed';
  m.crossSectionalAsymmetryTest.pairwise[0].netAsymmetry = 'control';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('cannot be clearly inferior or insufficient')));
});

test('v1.5 supports up to three acceptable expressions and one optional preferred expression', () => {
  const m = baseMemo();
  m.acceptableExpressionSet = [
    {
      ticker: '000001.SZ', role: 'preferred', directExposure: 'clear', earningsConversion: 'clear',
      balanceSheetOrSurvival: 'pass', expectationFit: 'clear', downsideContainment: 'credible',
      conclusion: 'acceptable', rationale: 'Preferred but not required to be peer-best.', evidenceRefs: ['e1']
    },
    {
      ticker: '000004.SZ', role: 'acceptable', directExposure: 'credible', earningsConversion: 'credible',
      balanceSheetOrSurvival: 'pass', expectationFit: 'credible', downsideContainment: 'credible',
      conclusion: 'acceptable', rationale: 'Good-enough expression of the same opportunity.', evidenceRefs: ['e1']
    }
  ];
  assert.deepEqual(validateOpportunityMemo(m, 'memo.json', manifest()), []);
});

test('v1.5 requires an equity-return archetype', () => {
  const m = baseMemo();
  delete m.equityReturnArchetype;
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('equityReturnArchetype is required')));
});


test('v1.5 requires hypothesis decomposition audit', () => {
  const m = baseMemo();
  delete m.hypothesisDecompositionTest;
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires hypothesisDecompositionTest')));
});

test('v1.5 blocks selection from an aggregate that still requires decomposition', () => {
  const m = baseMemo();
  m.hypothesisDecompositionTest.decompositionNeeded = true;
  m.hypothesisDecompositionTest.conclusion = 'split_required';
  m.hypothesisDecompositionTest.siblingHypothesisIds = ['h-sibling'];
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('must be well_scoped before selection')));
});

test('v1.5 requires explicit evidence horizon resolution', () => {
  const m = baseMemo();
  m.evidenceHorizonMatrix.conclusion = 'unresolved';
  m.evidenceHorizonMatrix.conflictType = 'time_horizon_conflict';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('cannot keep evidence-horizon conflict unresolved')));
});

test('v1.5 requires high-absorption diagnostic consistency', () => {
  const m = baseMemo();
  m.highAbsorptionContinuationTest.applicable = true;
  m.highAbsorptionContinuationTest.absorptionState = 'high';
  m.highAbsorptionContinuationTest.conclusion = 'not_applicable';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('applicable highAbsorptionContinuationTest cannot conclude not_applicable')));
});

test('v1.5 audits expression purity against the frozen preferred ticker', () => {
  const m = baseMemo();
  m.expressionPurityTest.preferredTicker = '000002.SZ';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('preferredTicker must match selectionComparison.selectedTicker')));
});


function baseHorizonMemo() {
  const m = baseMemo();
  m.timingRoute = 'base_horizon_convexity';
  m.opportunityTimingTest.priceRegime.conclusion = 'favorable';
  m.opportunityTimingTest.overallConclusion = 'neutral';
  m.opportunityTimingTest.eventHalfLife.conclusion = 'short_lived';
  m.opportunityTimingTest.lateCycleRisk.conclusion = 'high';
  m.expectationBurdenTest.conclusion = 'tight';
  m.expectationBurdenTest.catalystOrTimingBridge = 'Catalyst is expected inside the pre-registered base horizon.';
  m.expectationPathTest.incrementalPathAdvantage.conclusion = 'credible';
  m.expectationPathTest.durationRisk.conclusion = 'high';
  m.expectationPathTest.overallConclusion = 'mixed';
  m.crossSectionalAsymmetryTest.valuationSlack.conclusion = 'tight';
  m.crossSectionalAsymmetryTest.catalystReachability.conclusion = 'clear';
  m.crossSectionalAsymmetryTest.downsideContainment.conclusion = 'credible';
  m.baseHorizonConvexityTest = {
    bridgeStatus: m.earningsConversionBridge.status,
    freshIncrementalEvidence: {
      conclusion: 'clear',
      rationale: 'new orders, prices or operating evidence arrived after the earlier narrative',
      evidenceRefs: ['e1']
    },
    baseHorizonExpectationGap: {
      conclusion: 'credible',
      rationale: 'the frozen market baseline still leaves measurable room inside the base horizon',
      evidenceRefs: ['e1']
    },
    catalystWithinBase: {
      conclusion: 'clear',
      rationale: 'the next operating or earnings catalyst occurs before the frozen re-underwrite point',
      evidenceRefs: ['e1']
    },
    catalystLatestTradingDays: 20,
    reunderwriteTradingDays: 40,
    normalizationEarliestTradingDays: 60,
    normalizationRisk: 'high',
    exitDiscipline: 'Re-underwrite at day 40 and do not carry the short-horizon thesis beyond normalization without a new frozen memo.',
    falsifier: 'The expected operating catalyst fails before the re-underwrite point.',
    evidenceRefs: ['e1', 'e2'],
    conclusion: 'credible_route'
  };
  return m;
}

test('v1.5 allows a strict base-horizon convexity High-priority route', () => {
  assert.deepEqual(validateOpportunityMemo(baseHorizonMemo(), 'memo.json', manifest()), []);
});

test('v1.5 base-horizon route does not waive fresh incremental information', () => {
  const m = baseHorizonMemo();
  m.baseHorizonConvexityTest.freshIncrementalEvidence.conclusion = 'mixed';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires fresh incremental evidence')));
});

test('v1.5 base-horizon route forces catalyst before re-underwrite', () => {
  const m = baseHorizonMemo();
  m.baseHorizonConvexityTest.catalystLatestTradingDays = 50;
  m.baseHorizonConvexityTest.reunderwriteTradingDays = 40;
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('catalyst must occur by the re-underwrite point')));
});

test('v1.5 base-horizon route forces re-underwrite before normalization', () => {
  const m = baseHorizonMemo();
  m.baseHorizonConvexityTest.reunderwriteTradingDays = 70;
  m.baseHorizonConvexityTest.normalizationEarliestTradingDays = 60;
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('re-underwrite must not occur after expected normalization begins')));
});

test('v1.5 base-horizon route cannot extend re-underwrite beyond base horizon', () => {
  const m = baseHorizonMemo();
  m.baseHorizonConvexityTest.reunderwriteTradingDays = m.expectedRealization.baseTradingDays + 1;
  m.baseHorizonConvexityTest.normalizationEarliestTradingDays = m.expectedRealization.baseTradingDays + 10;
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('re-underwrite cannot exceed the pre-registered base horizon')));
});

test('v1.5 base-horizon route refuses adverse broad timing', () => {
  const m = baseHorizonMemo();
  m.opportunityTimingTest.priceRegime = {
    ...m.opportunityTimingTest.priceRegime,
    lookback20Excess: -0.05,
    lookback60Excess: -0.08,
    positiveBreadth20: 0.3,
    positiveBreadth60: 0.3,
    conclusion: 'adverse'
  };
  m.opportunityTimingTest.overallConclusion = 'adverse';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires favorable or neutral broad price regime')));
});

test('v1.5 base-horizon route still requires acceptable downside containment', () => {
  const m = baseHorizonMemo();
  m.crossSectionalAsymmetryTest.downsideContainment.conclusion = 'mixed';
  for (const expression of m.acceptableExpressionSet) expression.downsideContainment = 'mixed';
  const errors = validateOpportunityMemo(m, 'memo.json', manifest());
  assert.ok(errors.some((x) => x.includes('requires clear/credible downside containment')));
  assert.ok(errors.some((x) => x.includes('requires clear/credible downsideContainment')));
});

test('v1.5 does not allow base-horizon route under older skill version', () => {
  const m = baseHorizonMemo();
  const oldManifest = manifest();
  oldManifest.skill.version = '1.4.0';
  oldManifest.skill.path = 'skills/stock-rador/versions/1.4.0/SKILL.md';
  const errors = validateOpportunityMemo(m, 'memo.json', oldManifest);
  assert.ok(errors.some((x) => x.includes('timingRoute is invalid for skill version')));
});
