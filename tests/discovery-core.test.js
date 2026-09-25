const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SOURCE_ROLES,
  auditMissedOpportunities,
  summarizeDiscoveryPack,
  validateDiscoveryPack,
  validateDiscoveryScreening
} = require('../scripts/discovery-core.cjs');

function manifest() {
  return {
    schemaVersion: '1.4',
    runId: 'd1',
    discoveryPolicy: {
      requiredLanes: ['official_primary', 'reputable_news', 'community_weak_signal'],
      minimumCoveredLanes: 2,
      screeningTarget: 'event_cluster',
      postOutcomeMissAudit: {
        candidateUniverse: 'all eligible A-shares in frozen universe',
        candidateRule: 'top outcome cases under frozen rule',
        causalEligibilityRule: 'pre-cutoff causal evidence required',
        samePeriodMayTuneSkill: false
      }
    }
  };
}

function pack() {
  return {
    schemaVersion: '2.0',
    runId: 'd1',
    cutoffAt: '2025-12-31T23:59:59+08:00',
    lanes: [
      { laneId: 'official_primary', purpose: 'official data', coverageStatus: 'complete' },
      { laneId: 'reputable_news', purpose: 'news', coverageStatus: 'partial', limitations: 'limited publishers' },
      { laneId: 'community_weak_signal', purpose: 'weak signals', coverageStatus: 'unavailable', limitations: 'not connected' }
    ],
    sourceItems: [
      {
        itemId: 's1', laneId: 'official_primary', sourceType: 'primary', contentKind: 'dataset',
        publishedAt: '2025-10-01T00:00:00Z', availableAt: '2025-10-01T00:00:00Z',
        originGroup: 'origin-a'
      },
      {
        itemId: 's2', laneId: 'reputable_news', sourceType: 'reputable_news', contentKind: 'commentary',
        publishedAt: '2025-10-02T00:00:00Z', availableAt: '2025-10-02T00:00:00Z',
        originGroup: 'origin-a'
      },
      {
        itemId: 's3', laneId: 'reputable_news', sourceType: 'reputable_news', contentKind: 'original',
        publishedAt: '2025-10-03T00:00:00Z', availableAt: '2025-10-03T00:00:00Z',
        originGroup: 'origin-b'
      }
    ],
    eventClusters: [
      {
        eventId: 'e1',
        statement: 'supply tightened',
        changeType: 'supply',
        noveltyAssessment: 'new',
        firstAvailableAt: '2025-10-01T00:00:00Z',
        memberItemIds: ['s1', 's2', 's3'],
        independentOriginGroups: ['origin-a', 'origin-b'],
        affectedValueChain: ['upstream'],
        contradictionSearchNotes: '',
        researchQuestion: 'is it material?'
      }
    ]
  };
}

test('discovery pack counts syndicated/derived coverage by origin group, not headline count', () => {
  const p = pack();
  assert.deepEqual(validateDiscoveryPack(p, manifest()), []);
  const summary = summarizeDiscoveryPack(p);
  assert.equal(summary.sourceItemCount, 3);
  assert.equal(summary.uniqueOriginGroupCount, 2);
  assert.equal(summary.eventClusterCount, 1);
});

test('event cluster origin groups must exactly match member source origins', () => {
  const p = pack();
  p.eventClusters[0].independentOriginGroups = ['origin-a', 'origin-b', 'fake'];
  assert.ok(validateDiscoveryPack(p, manifest()).some((error) => error.includes('independentOriginGroups')));
});

test('event cluster firstAvailableAt must be the earliest member availability time', () => {
  const p = pack();
  p.eventClusters[0].firstAvailableAt = '2025-10-02T00:00:00Z';
  assert.ok(validateDiscoveryPack(p, manifest()).some((error) => error.includes('firstAvailableAt')));
});

test('screening must make exactly one decision for every frozen event cluster', () => {
  const p = pack();
  const good = {
    runId: 'd1',
    reviewItemCount: 1,
    reviewDecisions: [{
      itemId: 'e1', decisionTargetType: 'event_cluster',
      decision: 'promote', reasonCode: 'economic_change', rationale: 'test'
    }]
  };
  assert.deepEqual(validateDiscoveryScreening(good, p, manifest()), []);

  const missing = { runId: 'd1', reviewItemCount: 0, reviewDecisions: [] };
  assert.ok(validateDiscoveryScreening(missing, p, manifest()).some((error) => error.includes('no screening decision')));
});

test('missed-opportunity audit reports diagnostic recall but forbids same-period tuning', () => {
  const p = pack();
  const lock = { runId: 'd1' };
  const good = {
    schemaVersion: '1.0',
    runId: 'd1',
    samePeriodMayTuneSkill: false,
    cases: [
      { caseId: 'c1', detectableExAnte: true, linkedFrozenEventIds: ['e1'], missStage: 'detected', description: 'found' },
      { caseId: 'c2', detectableExAnte: true, linkedFrozenEventIds: [], missStage: 'retrieval_miss', description: 'missed' },
      { caseId: 'c3', detectableExAnte: false, linkedFrozenEventIds: [], missStage: 'unforeseeable', description: 'future shock' }
    ]
  };
  const result = auditMissedOpportunities(lock, p, good);
  assert.deepEqual(result.errors, []);
  assert.equal(result.report.detectableCaseCount, 2);
  assert.equal(result.report.detectedCaseCount, 1);
  assert.equal(result.report.diagnosticRecall, 0.5);
  assert.equal(result.report.label, 'hindsight_diagnostic_not_alpha_validation');

  const bad = structuredClone(good);
  bad.samePeriodMayTuneSkill = true;
  assert.ok(auditMissedOpportunities(lock, p, bad).errors.some((error) => error.includes('samePeriodMayTuneSkill')));
});


test('expanded discovery schema requires explicit cross-role coverage without weakening old packs', () => {
  const m = manifest();
  m.discoveryPolicy.requiredSourceRoles = [
    'official_policy_regulatory',
    'official_statistics_customs',
    'specialist_trade_pricing',
    'reputable_news_wire',
    'international_chain_primary',
    'community_forum_weak_signal'
  ];
  m.discoveryPolicy.minimumCoveredSourceRoles = 5;

  const p = pack();
  p.schemaVersion = '2.1';
  p.sourceRoles = [
    { roleId: 'official_policy_regulatory', purpose: 'policy changes', coverageStatus: 'complete' },
    { roleId: 'official_statistics_customs', purpose: 'official operating data', coverageStatus: 'complete' },
    { roleId: 'specialist_trade_pricing', purpose: 'product pricing and lead times', coverageStatus: 'partial', limitations: 'selected publications' },
    { roleId: 'reputable_news_wire', purpose: 'broad attributed reporting', coverageStatus: 'complete' },
    { roleId: 'international_chain_primary', purpose: 'overseas customer and supplier evidence', coverageStatus: 'partial', limitations: 'selected markets' },
    { roleId: 'community_forum_weak_signal', purpose: 'weak-signal discovery only', coverageStatus: 'unavailable', limitations: 'historical archive unavailable' }
  ];
  p.sourceItems[0].sourceRoleId = 'official_policy_regulatory';
  p.sourceItems[1].sourceRoleId = 'reputable_news_wire';
  p.sourceItems[2].sourceRoleId = 'specialist_trade_pricing';

  assert.deepEqual(validateDiscoveryPack(p, m), []);
  const summary = summarizeDiscoveryPack(p);
  assert.equal(summary.coveredSourceRoleCount, 5);
  assert.equal(summary.bySourceRole.reputable_news_wire.sourceItemCount, 1);
  assert.ok(SOURCE_ROLES.includes('procurement_tender_orders'));
});

test('expanded discovery schema fails closed when a source item hides behind a broad lane without a source role', () => {
  const m = manifest();
  m.discoveryPolicy.requiredSourceRoles = ['official_policy_regulatory'];
  m.discoveryPolicy.minimumCoveredSourceRoles = 1;

  const p = pack();
  p.schemaVersion = '2.1';
  p.sourceRoles = [
    { roleId: 'official_policy_regulatory', purpose: 'policy changes', coverageStatus: 'complete' }
  ];

  const errors = validateDiscoveryPack(p, m);
  assert.ok(errors.some((error) => error.includes('sourceRoleId')));
});
