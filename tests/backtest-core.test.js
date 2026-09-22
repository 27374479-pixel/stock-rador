const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { evaluateRun, lockRun, returnAfterCost, validateManifest, verifyLock } = require('../scripts/backtest-core.cjs');

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
