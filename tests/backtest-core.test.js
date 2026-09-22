const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { evaluateRun, lockRun, returnAfterCost, validateManifest, validateMemoEvidenceRefs, verifyLock } = require('../scripts/backtest-core.cjs');

function manifest() {
  return {
    schemaVersion: '1.1',
    runId: 'demo-001',
    evaluationMode: 'historical_replay',
    createdAt: '2026-09-22T12:00:00.000Z',
    skill: { path: 'skills/SKILL.md', version: '0.4.0' },
    model: { name: 'test-model', reasoning: 'high' },
    screeningPath: 'screening.json',
    implementationPaths: ['impl.js'],
    discoveryWindow: { startDate: '2024-01-01', endDate: '2024-12-31' },
    contaminationControls: { modelMemoryRisk: 'known_uncontrolled', sourcePackPath: 'sources.json', identityStressPath: 'identity.json' },
    benchmark: { ticker: '000300.SH', name: '沪深300' },
    trackedMemoStates: ['Research', 'High-priority research'],
    primarySignalStates: ['High-priority research'],
    outcomePolicy: { entryRule: 'next_trading_day_open_after_cutoff_date', holdingTradingDays: [2], oneWayCostRate: 0.001, matchedControlStatistic: 'equal_weight_mean' },
    selections: [{ memoPath: 'memo.json', hypothesisId: 'h1', ticker: '000001.SZ', limitRate: 0.10 }]
  };
}

function memo() {
  return {
    schemaVersion: '0.3',
    skillVersion: '0.4.0',
    cutoffAt: '2024-01-02T15:00:00.000+08:00',
    researchReadyAt: '2024-01-02T14:00:00.000+08:00',
    actionableAt: null,
    expectedRealization: { earliestTradingDays: 1, baseTradingDays: 2, latestTradingDays: 2, rationale: 'test' },
    hypothesisId: 'h1',
    state: 'Research',
    aShareCandidates: [{ ticker: '000001.SZ', name: 'Example' }],
    matchedControls: [],
    matchedControlException: null
  };
}

function prices() {
  const benchmark = [
    { date: '2024-01-02', open: 100, close: 100, high: 101, low: 99, volume: 1 },
    { date: '2024-01-03', open: 100, close: 101, high: 102, low: 99, volume: 1 },
    { date: '2024-01-04', open: 101, close: 102, high: 103, low: 100, volume: 1 }
  ];
  const stock = [
    { date: '2024-01-02', open: 10, close: 10, high: 10, low: 10, volume: 10 },
    { date: '2024-01-03', open: 10, close: 11, high: 11, low: 10, volume: 10 },
    { date: '2024-01-04', open: 11, close: 12, high: 12, low: 10.5, volume: 10 }
  ];
  const controlA = [
    { date: '2024-01-02', open: 20, close: 20, high: 20, low: 20, volume: 10 },
    { date: '2024-01-03', open: 20, close: 20.5, high: 21, low: 20, volume: 10 },
    { date: '2024-01-04', open: 20.5, close: 21, high: 21.2, low: 20.4, volume: 10 }
  ];
  const controlB = [
    { date: '2024-01-02', open: 30, close: 30, high: 30, low: 30, volume: 10 },
    { date: '2024-01-03', open: 30, close: 30.5, high: 31, low: 30, volume: 10 },
    { date: '2024-01-04', open: 30.5, close: 31, high: 31.2, low: 30.4, volume: 10 }
  ];
  return { series: {
    '000300.SH': { adjusted: benchmark },
    '000001.SZ': { adjusted: stock, unadjusted: stock },
    '000002.SZ': { adjusted: controlA, unadjusted: controlA },
    '000003.SZ': { adjusted: controlB, unadjusted: controlB }
  } };
}

test('historical manifests require explicit contamination controls', () => {
  const item = manifest();
  delete item.contaminationControls.sourcePackPath;
  assert.ok(validateManifest(item).some((error) => error.includes('sourcePackPath')));
});

test('run lock hashes screening, skill, source pack, manifest and memo and detects mutation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-'));
  fs.mkdirSync(path.join(root, 'skills'));
  fs.writeFileSync(path.join(root, 'skills', 'SKILL.md'), 'skill');
  fs.writeFileSync(path.join(root, 'sources.json'), '{}');
  fs.writeFileSync(path.join(root, 'screening.json'), JSON.stringify({
    runId: 'demo-001',
    reviewItemCount: 1,
    reviewDecisions: [{ itemId: 'x1', decision: 'reject', reasonCode: 'noise', rationale: 'test' }]
  }));
  fs.writeFileSync(path.join(root, 'identity.json'), JSON.stringify({
    runId: 'demo-001',
    status: 'passed',
    performedBeforeReveal: true,
    method: 'masked test'
  }));
  fs.writeFileSync(path.join(root, 'impl.js'), 'implementation');
  fs.writeFileSync(path.join(root, 'memo.json'), JSON.stringify(memo()));
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest()));
  const lock = lockRun(path.join(root, 'manifest.json'), root);
  assert.equal(lock.candidateCount, 1);
  assert.equal(verifyLock(lock, root).length, 0);
  assert.ok(lock.files.some((file) => file.role === 'screening'));
  assert.ok(lock.files.some((file) => file.role === 'implementation'));
  assert.ok(lock.files.some((file) => file.role === 'identity_stress'));
  fs.appendFileSync(path.join(root, 'memo.json'), '\n');
  assert.ok(verifyLock(lock, root).some((item) => item.includes('memo.json')));
});

test('research candidates are tracked but excluded from primary signal metric', () => {
  const item = manifest();
  const evaluated = evaluateRun(item, { 'memo.json': memo() }, prices());
  assert.equal(evaluated.results[0].entryDate, '2024-01-03');
  assert.equal(evaluated.results[0].horizons['2'].exitDate, '2024-01-04');
  assert.equal(evaluated.aggregate.tickerLevel['2'].count, 1);
  assert.equal(evaluated.aggregate.primaryTickerLevel['2'].count, 0);
  assert.equal(evaluated.aggregate.primaryThesisBase.count, 0);
});

test('high-priority candidate enters from actionableAt and counts as primary', () => {
  const item = manifest();
  const action = memo();
  action.state = 'High-priority research';
  action.actionableAt = '2024-01-02T14:30:00.000+08:00';
  action.matchedControls = [
    {
      ticker: '000002.SZ',
      name: 'Control A',
      controlType: 'peer',
      fairCounterfactualReason: 'same test industry',
      whySelectedCompanyShouldOutperform: 'selected has stronger test exposure',
      evidenceRefs: []
    },
    {
      ticker: '000003.SZ',
      name: 'Control B',
      controlType: 'near_miss',
      fairCounterfactualReason: 'same test hypothesis',
      whySelectedCompanyShouldOutperform: 'selected has stronger test expectation gap',
      evidenceRefs: []
    }
  ];
  const evaluated = evaluateRun(item, { 'memo.json': action }, prices());
  assert.equal(evaluated.results[0].isPrimarySignal, true);
  assert.equal(evaluated.aggregate.primaryTickerLevel['2'].count, 1);
  assert.ok(evaluated.aggregate.primaryThesisBase.meanExcessReturn > 0);
  assert.ok(evaluated.aggregate.primaryThesisBase.meanMatchedControlExcess > 0);
  assert.equal(evaluated.results[0].thesisBaseOutcome.selectedRank, 1);
  assert.equal(evaluated.results[0].thesisBaseOutcome.matchedSetSize, 3);
  assert.equal(evaluated.results[0].thesisBaseOutcome.rankPercentile, 1);
});

test('high-priority memo without matched controls fails v0.4 validation', () => {
  const item = manifest();
  const action = memo();
  action.state = 'High-priority research';
  action.actionableAt = '2024-01-02T14:30:00.000+08:00';
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-controls-'));
  fs.mkdirSync(path.join(root, 'skills'));
  fs.writeFileSync(path.join(root, 'skills', 'SKILL.md'), 'skill');
  fs.writeFileSync(path.join(root, 'sources.json'), '{}');
  fs.writeFileSync(path.join(root, 'screening.json'), JSON.stringify({
    runId: 'demo-001', reviewItemCount: 1,
    reviewDecisions: [{ itemId: 'x1', decision: 'promote', reasonCode: 'economic_change', rationale: 'test' }]
  }));
  fs.writeFileSync(path.join(root, 'identity.json'), JSON.stringify({
    runId: 'demo-001', status: 'passed', performedBeforeReveal: true, method: 'masked test'
  }));
  fs.writeFileSync(path.join(root, 'impl.js'), 'implementation');
  fs.writeFileSync(path.join(root, 'memo.json'), JSON.stringify(action));
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(item));
  assert.throws(() => lockRun(path.join(root, 'manifest.json'), root), /2-5 matched controls/);
});

test('round-trip costs are multiplicative', () => {
  assert.equal(returnAfterCost(100, 110, 0.001), 1.1 * 0.999 / 1.001 - 1);
});


function manifestV5() {
  return {
    schemaVersion: '1.2',
    runId: 'demo-v5',
    evaluationMode: 'historical_replay',
    createdAt: '2026-09-22T14:00:00.000Z',
    skill: { path: 'skills/SKILL.md', version: '0.5.0' },
    model: { name: 'test-model', reasoning: 'high' },
    screeningPath: 'screening.json',
    implementationPaths: ['impl.js'],
    discoveryWindow: { startDate: '2024-01-01', endDate: '2024-12-31' },
    contaminationControls: {
      modelMemoryRisk: 'known_uncontrolled',
      sourcePackPath: 'sources.json',
      identityStressPath: 'identity.json'
    },
    benchmark: { ticker: '000300.SH', name: '沪深300' },
    trackedHypothesisStates: ['Research hypothesis', 'High-priority hypothesis'],
    trackedSelectionStates: ['No selection', 'Research selection', 'High-priority selection'],
    primarySelectionStates: ['High-priority selection'],
    outcomePolicy: {
      entryRule: 'next_trading_day_open_after_cutoff_date',
      holdingTradingDays: [2],
      oneWayCostRate: 0.001,
      matchedControlStatistic: 'equal_weight_mean'
    },
    hypothesisMemoPaths: ['memo.json'],
    selections: [{ memoPath: 'memo.json', hypothesisId: 'h1', ticker: '000001.SZ', limitRate: 0.10 }]
  };
}

function memoV5(selectionState = 'High-priority selection') {
  const primary = selectionState === 'High-priority selection';
  return {
    schemaVersion: '0.4',
    skillVersion: '0.5.0',
    cutoffAt: '2024-01-02T15:00:00.000+08:00',
    researchReadyAt: '2024-01-02T14:00:00.000+08:00',
    actionableAt: primary ? '2024-01-02T14:30:00.000+08:00' : null,
    hypothesisId: 'h1',
    hypothesisState: 'High-priority hypothesis',
    selectionState,
    expectedRealization: {
      earliestTradingDays: 1,
      baseTradingDays: 2,
      latestTradingDays: 2,
      rationale: 'test'
    },
    evidenceLedger: [
      { id: 'e1', sourcePackRef: 'evidenceDocuments', relation: 'supports', supportsClaim: 'test evidence one' },
      { id: 'e2', sourcePackRef: 'evidenceDocuments', relation: 'context', supportsClaim: 'test evidence two' }
    ],
    aShareCandidates: [{ ticker: '000001.SZ', name: 'Selected' }],
    matchedControls: [
      {
        ticker: '000002.SZ',
        name: 'Control A',
        controlType: 'peer',
        fairCounterfactualReason: 'same industry',
        whySelectedCompanyShouldOutperform: 'stronger earnings sensitivity',
        evidenceRefs: ['e1']
      },
      {
        ticker: '000003.SZ',
        name: 'Control B',
        controlType: 'near_miss',
        fairCounterfactualReason: 'same thesis',
        whySelectedCompanyShouldOutperform: 'less saturated expectations',
        evidenceRefs: ['e2']
      }
    ],
    selectionComparison: {
      selectedTicker: '000001.SZ',
      pairwise: [
        {
          controlTicker: '000002.SZ',
          selectedAdvantages: ['stronger earnings sensitivity'],
          selectedDisadvantages: ['higher valuation'],
          netEdge: primary ? 'selected' : 'mixed',
          evidenceRefs: ['e1']
        },
        {
          controlTicker: '000003.SZ',
          selectedAdvantages: ['less saturated expectations'],
          selectedDisadvantages: ['weaker balance sheet'],
          netEdge: primary ? 'mixed' : 'mixed',
          evidenceRefs: ['e2']
        }
      ],
      selectionEdgeConclusion: primary ? 'credible' : 'mixed',
      rationale: primary ? 'selected has a credible price-relative edge' : 'company ranking remains mixed'
    }
  };
}

function sourcePackV5() {
  return {
    reviewItems: [],
    evidenceDocuments: [
      { id: 'e1', publishedAt: '2024-01-01T00:00:00Z' },
      { id: 'e2', publishedAt: '2024-01-01T00:00:00Z' }
    ]
  };
}

function writeV5Run(root, memoValue) {
  fs.mkdirSync(path.join(root, 'skills'));
  fs.writeFileSync(path.join(root, 'skills', 'SKILL.md'), 'skill');
  fs.writeFileSync(path.join(root, 'sources.json'), JSON.stringify(sourcePackV5()));
  fs.writeFileSync(path.join(root, 'screening.json'), JSON.stringify({
    runId: 'demo-v5',
    reviewItemCount: 1,
    reviewDecisions: [{ itemId: 'x1', decision: 'promote', reasonCode: 'economic_change', rationale: 'test' }]
  }));
  fs.writeFileSync(path.join(root, 'identity.json'), JSON.stringify({
    runId: 'demo-v5',
    status: 'passed',
    performedBeforeReveal: true,
    method: 'masked test'
  }));
  fs.writeFileSync(path.join(root, 'impl.js'), 'implementation');
  fs.writeFileSync(path.join(root, 'memo.json'), JSON.stringify(memoValue));
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifestV5()));
}

test('v0.5 manifest accepts separate hypothesis and selection state machines', () => {
  assert.deepEqual(validateManifest(manifestV5()), []);
});

test('v0.5 high-priority selection requires a credible pairwise edge and enters primary metric', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-v5-'));
  const item = memoV5('High-priority selection');
  writeV5Run(root, item);
  const lock = lockRun(path.join(root, 'manifest.json'), root);
  assert.equal(lock.candidateCount, 1);

  const evaluated = evaluateRun(manifestV5(), { 'memo.json': item }, prices());
  const result = evaluated.results[0];
  assert.equal(result.hypothesisState, 'High-priority hypothesis');
  assert.equal(result.selectionState, 'High-priority selection');
  assert.equal(result.isPrimarySignal, true);
  assert.equal(result.thesisBaseOutcome.bestControlTicker, '000002.SZ');
  assert.ok(result.thesisBaseOutcome.excessVsBestControl > 0);
  assert.equal(result.thesisBaseOutcome.winsAllControls, true);
  assert.equal(evaluated.aggregate.primaryThesisBase.winsAllControlsRate, 1);
});

test('v0.5 mixed company ranking stays research selection even when hypothesis is high-priority', () => {
  const item = memoV5('Research selection');
  const evaluated = evaluateRun(manifestV5(), { 'memo.json': item }, prices());
  assert.equal(evaluated.results[0].hypothesisState, 'High-priority hypothesis');
  assert.equal(evaluated.results[0].selectionState, 'Research selection');
  assert.equal(evaluated.results[0].isPrimarySignal, false);
  assert.equal(evaluated.aggregate.primaryThesisBase.count, 0);
});

test('v0.5 rejects high-priority selection when overall edge is mixed', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-v5-mixed-'));
  const item = memoV5('High-priority selection');
  item.selectionComparison.selectionEdgeConclusion = 'mixed';
  writeV5Run(root, item);
  assert.throws(
    () => lockRun(path.join(root, 'manifest.json'), root),
    /High-priority selection requires clear or credible selection edge/
  );
});

test('v0.5 rejects high-priority selection when a frozen control has the pairwise edge', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-v5-control-'));
  const item = memoV5('High-priority selection');
  item.selectionComparison.pairwise[1].netEdge = 'control';
  writeV5Run(root, item);
  assert.throws(
    () => lockRun(path.join(root, 'manifest.json'), root),
    /cannot have control\/insufficient pairwise edge/
  );
});


test('v0.5 locks high-priority hypothesis with no stock selection', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-v5-noselection-'));
  const item = memoV5('Research selection');
  item.selectionState = 'No selection';
  item.actionableAt = null;
  item.aShareCandidates = [];
  item.matchedControls = [];
  item.matchedControlException = null;
  item.selectionComparison = {
    selectedTicker: null,
    pairwise: [],
    selectionEdgeConclusion: 'insufficient',
    rationale: 'Opportunity is strong, but no company has a defensible cross-sectional edge.'
  };

  const manifestItem = manifestV5();
  manifestItem.selections = [];
  manifestItem.hypothesisMemoPaths = ['memo.json'];

  fs.mkdirSync(path.join(root, 'skills'));
  fs.writeFileSync(path.join(root, 'skills', 'SKILL.md'), 'skill');
  fs.writeFileSync(path.join(root, 'sources.json'), JSON.stringify(sourcePackV5()));
  fs.writeFileSync(path.join(root, 'screening.json'), JSON.stringify({
    runId: 'demo-v5',
    reviewItemCount: 1,
    reviewDecisions: [{ itemId: 'x1', decision: 'promote', reasonCode: 'economic_change', rationale: 'test' }]
  }));
  fs.writeFileSync(path.join(root, 'identity.json'), JSON.stringify({
    runId: 'demo-v5',
    status: 'passed',
    performedBeforeReveal: true,
    method: 'masked test'
  }));
  fs.writeFileSync(path.join(root, 'impl.js'), 'implementation');
  fs.writeFileSync(path.join(root, 'memo.json'), JSON.stringify(item));
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifestItem));

  const lock = lockRun(path.join(root, 'manifest.json'), root);
  assert.equal(lock.candidateCount, 0);
  assert.ok(lock.files.some((file) => file.role === 'memo' && file.path === 'memo.json'));

  const evaluated = evaluateRun(manifestItem, { 'memo.json': item }, prices());
  assert.equal(evaluated.hypothesisMemoSummary.count, 1);
  assert.equal(evaluated.hypothesisMemoSummary.highPriorityHypothesisCount, 1);
  assert.equal(evaluated.hypothesisMemoSummary.noSelectionCount, 1);
  assert.equal(evaluated.results.length, 0);
  assert.equal(evaluated.aggregate.primaryThesisBase.count, 0);
});

test('v0.5 manifest requires every selected memo to be included in hypothesisMemoPaths', () => {
  const item = manifestV5();
  item.hypothesisMemoPaths = [];
  assert.ok(validateManifest(item).some((error) => error.includes('included in hypothesisMemoPaths')));
});


test('v0.5 forward run freezes its source pack even without historical identity stress', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-v5-forward-'));
  const item = memoV5('High-priority selection');
  writeV5Run(root, item);
  const manifestItem = manifestV5();
  manifestItem.evaluationMode = 'forward';
  delete manifestItem.contaminationControls.identityStressPath;
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifestItem));
  const lock = lockRun(path.join(root, 'manifest.json'), root);
  assert.ok(lock.files.some((file) => file.role === 'source_pack' && file.path === 'sources.json'));
  assert.equal(lock.files.some((file) => file.role === 'identity_stress'), false);
});


test('v0.5 evidence refs resolve across reviewItems and evidenceDocuments', () => {
  const memoItem = {
    cutoffAt: '2026-09-22T21:00:00+08:00',
    evidenceLedger: [
      { id: 'disc-1', sourcePackRef: 'reviewItems' },
      { id: 'doc-1', sourcePackRef: 'evidenceDocuments' }
    ],
    causalChain: [{ evidenceRefs: ['disc-1', 'doc-1'] }]
  };
  const sourcePack = {
    reviewItems: [{ itemId: 'disc-1', publishedAt: '2026-09-20T00:00:00Z' }],
    evidenceDocuments: [{ id: 'doc-1', publishedAt: '2026-09-21T00:00:00Z' }]
  };
  assert.deepEqual(validateMemoEvidenceRefs(memoItem, 'memo.json', sourcePack), []);
});

test('v0.5 evidence audit rejects orphan and post-cutoff references', () => {
  const memoItem = {
    cutoffAt: '2026-09-22T21:00:00+08:00',
    evidenceLedger: [
      { id: 'disc-1', sourcePackRef: 'reviewItems' },
      { id: 'missing-doc', sourcePackRef: 'evidenceDocuments' }
    ],
    causalChain: [{ evidenceRefs: ['future-doc', 'orphan-ledger-ref'] }]
  };
  const sourcePack = {
    reviewItems: [{ itemId: 'disc-1', publishedAt: '2026-09-20T00:00:00Z' }],
    evidenceDocuments: [{ id: 'future-doc', publishedAt: '2026-09-23T00:00:00Z' }]
  };
  const errors = validateMemoEvidenceRefs(memoItem, 'memo.json', sourcePack);
  assert.ok(errors.some((x) => x.includes('missing-doc') && x.includes('missing from frozen source pack')));
  assert.ok(errors.some((x) => x.includes('future-doc') && x.includes('not declared in evidenceLedger')));
  assert.ok(errors.some((x) => x.includes('orphan-ledger-ref') && x.includes('missing from frozen source pack')));
});


function manifestV6() {
  const item = manifestV5();
  item.schemaVersion = '1.3';
  item.runId = 'demo-v6';
  item.skill = { path: 'skills/SKILL.md', version: '0.6.0' };
  return item;
}

function memoV6(selectionState = 'High-priority selection') {
  const item = memoV5(selectionState);
  item.schemaVersion = '0.5';
  item.skillVersion = '0.6.0';
  for (const pair of item.selectionComparison.pairwise) {
    pair.switchCondition = `control becomes preferable if its earnings revisions improve while selected expectations do not`;
  }
  item.expectationBurdenTest = {
    valuationMethod: 'forward PE with frozen consensus earnings',
    referencePriceAtCutoff: 100,
    marketBaseline: 'Frozen consensus implies normalized earnings of 10 per share.',
    thesisScenario: 'The thesis requires earnings to reach 12 per share within the realization window.',
    breakevenCondition: 'At least 20% earnings upside versus the frozen baseline without a lower relative multiple versus controls.',
    ordinaryScenarioFailure: 'Earnings meet consensus but do not exceed it, leaving no price-relative edge versus controls.',
    catalystOrTimingBridge: 'A scheduled reporting update inside the base horizon can reveal the earnings delta.',
    evidenceRefs: ['e1', 'e2'],
    conclusion: 'room'
  };
  return item;
}

function writeV6Run(root, memoValue) {
  fs.mkdirSync(path.join(root, 'skills'));
  fs.writeFileSync(path.join(root, 'skills', 'SKILL.md'), 'skill');
  fs.writeFileSync(path.join(root, 'sources.json'), JSON.stringify(sourcePackV5()));
  fs.writeFileSync(path.join(root, 'screening.json'), JSON.stringify({
    runId: 'demo-v6',
    reviewItemCount: 1,
    reviewDecisions: [{ itemId: 'x1', decision: 'promote', reasonCode: 'economic_change', rationale: 'test' }]
  }));
  fs.writeFileSync(path.join(root, 'identity.json'), JSON.stringify({
    runId: 'demo-v6',
    status: 'passed',
    performedBeforeReveal: true,
    method: 'masked test'
  }));
  fs.writeFileSync(path.join(root, 'impl.js'), 'implementation');
  fs.writeFileSync(path.join(root, 'memo.json'), JSON.stringify(memoValue));
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifestV6()));
}

test('v0.6 manifest accepts schema 1.3', () => {
  assert.deepEqual(validateManifest(manifestV6()), []);
});

test('v0.6 high-priority selection requires auditable expectation burden and switch conditions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-v6-'));
  const item = memoV6('High-priority selection');
  writeV6Run(root, item);
  const lock = lockRun(path.join(root, 'manifest.json'), root);
  assert.equal(lock.candidateCount, 1);
});

test('v0.6 rejects fully-priced high-priority selection', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-v6-priced-'));
  const item = memoV6('High-priority selection');
  item.expectationBurdenTest.conclusion = 'fully_priced';
  writeV6Run(root, item);
  assert.throws(
    () => lockRun(path.join(root, 'manifest.json'), root),
    /High-priority selection cannot have fully_priced expectation burden/
  );
});

test('v0.6 tight high-priority selection requires a catalyst or timing bridge', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-v6-tight-'));
  const item = memoV6('High-priority selection');
  item.expectationBurdenTest.conclusion = 'tight';
  item.expectationBurdenTest.catalystOrTimingBridge = '';
  writeV6Run(root, item);
  assert.throws(
    () => lockRun(path.join(root, 'manifest.json'), root),
    /tight High-priority selection requires catalystOrTimingBridge/
  );
});

test('v0.6 pairwise comparisons require explicit switch conditions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-v6-switch-'));
  const item = memoV6('High-priority selection');
  item.selectionComparison.pairwise[0].switchCondition = '';
  writeV6Run(root, item);
  assert.throws(
    () => lockRun(path.join(root, 'manifest.json'), root),
    /requires switchCondition/
  );
});

test('v0.6 research selection may remain unresolved on expectation burden', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-rador-v6-research-'));
  const item = memoV6('Research selection');
  item.expectationBurdenTest.conclusion = 'unresolved';
  item.expectationBurdenTest.catalystOrTimingBridge = '';
  writeV6Run(root, item);
  const lock = lockRun(path.join(root, 'manifest.json'), root);
  assert.equal(lock.candidateCount, 1);
});
