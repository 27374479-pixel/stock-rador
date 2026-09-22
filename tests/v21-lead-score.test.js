const test = require('node:test');
const assert = require('node:assert/strict');
const {
  scoreCandidateV21,
  scoreMonetization,
  scoreReversalRisk
} = require('../src/v21-lead-score');

function evidence(overrides = {}) {
  return {
    relation: 'supports',
    sourceClass: 'practitioner_firsthand',
    identityKnown: true,
    firsthand: true,
    specificity: 'high',
    methodologyVisible: false,
    originalUrl: true,
    timestampTraceable: true,
    promotional: false,
    tickerPitch: false,
    editedAfterCutoff: false,
    publishedAt: '2022-06-01T00:00:00.000Z',
    availableAt: '2022-06-01T00:00:00.000Z',
    independenceGroup: 'field',
    ...overrides
  };
}

function base() {
  return {
    asOf: '2022-06-14T23:59:59.000Z',
    evidence: [
      evidence(),
      evidence({
        sourceClass: 'professional_data',
        firsthand: false,
        methodologyVisible: true,
        independenceGroup: 'data'
      })
    ],
    exposure: {
      productDirectness: 3,
      revenueMateriality: 3,
      geographyCustomerMatch: 2,
      capacityReadiness: 2,
      diversificationPenalty: 0,
      substitutionPenalty: 0
    },
    surprise: {
      magnitudeAcceleration: 2,
      consensusGap: 2,
      estimateRevisionLag: 2,
      durationPersistence: 2
    },
    pricing: {
      mediaSaturation: 1,
      valuationStretch: 1,
      estimateRevisionCompletion: 1,
      prior60Return: 0.1,
      prior180Return: 0.2
    },
    monetization: {
      canDeliverIntoBottleneck: 3,
      documentedSubstitutionOrShareGain: 3,
      marginCapture: 2,
      persistenceAfterNormalization: 1,
      inputConstraintExposure: 0
    },
    reversalRisk: {
      priceMomentumRollingOver: 0,
      inventoryBuild: 0,
      demandDestruction: 0
    }
  };
}

test('monetization penalizes a supplier constrained by the same bottleneck', () => {
  assert.equal(scoreMonetization({
    canDeliverIntoBottleneck: 1,
    documentedSubstitutionOrShareGain: 1,
    marginCapture: 1,
    persistenceAfterNormalization: 1,
    inputConstraintExposure: 3
  }), 1);
});

test('cycle reversal evidence has its own penalty instead of being hidden in price momentum', () => {
  assert.equal(scoreReversalRisk({
    priceMomentumRollingOver: 3,
    inventoryBuild: 2,
    demandDestruction: 3
  }), 8);
});

test('documented ability to deliver and gain share can pass V2.1', () => {
  const result = scoreCandidateV21(base());
  assert.equal(result.decision, 'Candidate');
  assert.ok(result.monetizationScore >= 5);
});

test('a real shortage does not qualify if the mapped company cannot monetize it', () => {
  const input = base();
  input.monetization = {
    canDeliverIntoBottleneck: 1,
    documentedSubstitutionOrShareGain: 0,
    marginCapture: 1,
    persistenceAfterNormalization: 1,
    inputConstraintExposure: 2
  };
  const result = scoreCandidateV21(input);
  assert.equal(result.decision, 'Watch');
});

test('strong reversal evidence can block an otherwise attractive theme', () => {
  const input = base();
  input.reversalRisk = {
    priceMomentumRollingOver: 3,
    inventoryBuild: 1,
    demandDestruction: 3
  };
  const result = scoreCandidateV21(input);
  assert.equal(result.decision, 'Watch');
});

test('future contradictory evidence remains unavailable at cutoff through V2 verification', () => {
  const input = base();
  input.evidence.push(evidence({
    relation: 'contradicts',
    sourceClass: 'primary_official',
    independenceGroup: 'future-official',
    publishedAt: '2022-06-20T00:00:00.000Z',
    availableAt: '2022-06-20T00:00:00.000Z'
  }));
  const result = scoreCandidateV21(input);
  assert.notEqual(result.verification.status, 'contradicted');
});
