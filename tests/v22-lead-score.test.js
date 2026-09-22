const test = require('node:test');
const assert = require('node:assert/strict');
const {
  scoreCandidateV22,
  scoreIncrementalEarningsBridge
} = require('../src/v22-lead-score');

function evidence(overrides = {}) {
  return {
    relation: 'supports',
    sourceClass: 'professional_data',
    identityKnown: true,
    firsthand: false,
    specificity: 'high',
    methodologyVisible: true,
    originalUrl: true,
    timestampTraceable: true,
    promotional: false,
    tickerPitch: false,
    editedAfterCutoff: false,
    publishedAt: '2023-08-01T00:00:00.000Z',
    availableAt: '2023-08-01T00:00:00.000Z',
    independenceGroup: 'industry-data',
    ...overrides
  };
}

function base() {
  return {
    asOf: '2023-09-14T23:59:59.000Z',
    evidence: [
      evidence(),
      evidence({
        sourceClass: 'primary_official',
        firsthand: true,
        methodologyVisible: false,
        independenceGroup: 'official'
      })
    ],
    exposure: {
      productDirectness: 3,
      revenueMateriality: 2,
      geographyCustomerMatch: 2,
      capacityReadiness: 2,
      diversificationPenalty: 0,
      substitutionPenalty: 0
    },
    surprise: {
      magnitudeAcceleration: 3,
      consensusGap: 2,
      estimateRevisionLag: 1,
      durationPersistence: 2
    },
    pricing: {
      mediaSaturation: 1,
      valuationStretch: 1,
      estimateRevisionCompletion: 1,
      prior60Return: 0.15,
      prior180Return: 0.20
    },
    monetization: {
      canDeliverIntoBottleneck: 3,
      documentedSubstitutionOrShareGain: 2,
      marginCapture: 1,
      persistenceAfterNormalization: 2,
      inputConstraintExposure: 0
    },
    reversalRisk: {
      priceMomentumRollingOver: 0,
      inventoryBuild: 0,
      demandDestruction: 0
    },
    earningsBridge: {
      bottleneckSpecificRevenueMateriality: 2,
      shipmentOrOrderProof: 3,
      unitEconomicsLeverage: 1,
      durationVisibility: 2,
      adjacencyPenalty: 0
    }
  };
}

test('earnings bridge penalizes generic adjacency', () => {
  assert.equal(scoreIncrementalEarningsBridge({
    bottleneckSpecificRevenueMateriality: 1,
    shipmentOrOrderProof: 1,
    unitEconomicsLeverage: 1,
    durationVisibility: 2,
    adjacencyPenalty: 3
  }), 2);
});

test('existing shipment proof can support an emerging product before revenue is fully material', () => {
  assert.equal(scoreIncrementalEarningsBridge({
    bottleneckSpecificRevenueMateriality: 1,
    shipmentOrOrderProof: 3,
    unitEconomicsLeverage: 2,
    durationVisibility: 2,
    adjacencyPenalty: 0
  }), 8);
});

test('strong bottleneck-specific earnings bridge can pass V2.2', () => {
  const result = scoreCandidateV22(base());
  assert.equal(result.decision, 'Candidate');
  assert.ok(result.earningsBridgeScore >= 5);
});

test('broad segment exposure without bottleneck-specific proof is Watch', () => {
  const input = base();
  input.earningsBridge = {
    bottleneckSpecificRevenueMateriality: 1,
    shipmentOrOrderProof: 1,
    unitEconomicsLeverage: 1,
    durationVisibility: 2,
    adjacencyPenalty: 2
  };
  const result = scoreCandidateV22(input);
  assert.equal(result.decision, 'Watch');
  assert.equal(result.hardGateDetails.bridgeSpecificityGate, false);
});

test('future evidence remains unavailable through V2.2 verification', () => {
  const input = base();
  input.evidence.push(evidence({
    relation: 'contradicts',
    sourceClass: 'primary_official',
    independenceGroup: 'future',
    publishedAt: '2023-09-20T00:00:00.000Z',
    availableAt: '2023-09-20T00:00:00.000Z'
  }));
  const result = scoreCandidateV22(input);
  assert.notEqual(result.verification.status, 'contradicted');
});
