const test = require('node:test');
const assert = require('node:assert/strict');
const {
  evidenceQuality,
  scoreCandidateV2,
  verifyClaim,
  wasAvailableBy
} = require('../src/v2-lead-score');

function ev(overrides = {}) {
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
    publishedAt: '2023-01-02T00:00:00.000Z',
    availableAt: '2023-01-02T00:00:00.000Z',
    independenceGroup: 'g1',
    ...overrides
  };
}

test('future evidence is excluded at the historical cutoff', () => {
  assert.equal(wasAvailableBy(ev(), '2023-01-03T00:00:00.000Z'), true);
  assert.equal(wasAvailableBy(ev({ availableAt: '2023-01-04T00:00:00.000Z' }), '2023-01-03T00:00:00.000Z'), false);
});

test('syndicated copies do not multiply evidence because groups are capped', () => {
  const a = ev({ independenceGroup: 'same-wire', sourceClass: 'professional_data' });
  const b = ev({ independenceGroup: 'same-wire', sourceClass: 'professional_data', identityKnown: false });
  const result = verifyClaim([a, b], '2023-01-03T00:00:00.000Z');
  assert.equal(result.independentSupportGroups, 1);
});

test('a practitioner lead plus independent professional confirmation can be confirmed', () => {
  const result = verifyClaim([
    ev({ independenceGroup: 'practitioner' }),
    ev({
      independenceGroup: 'trade-data',
      sourceClass: 'professional_data',
      firsthand: false,
      methodologyVisible: true
    })
  ], '2023-01-03T00:00:00.000Z');
  assert.equal(result.status, 'confirmed');
});

test('strong independent primary contradiction prevents confirmation', () => {
  const result = verifyClaim([
    ev({ independenceGroup: 'practitioner' }),
    ev({
      independenceGroup: 'official',
      relation: 'contradicts',
      sourceClass: 'primary_official',
      firsthand: false,
      methodologyVisible: true
    })
  ], '2023-01-03T00:00:00.000Z');
  assert.notEqual(result.status, 'confirmed');
});

test('promotional ticker pitching lowers evidence quality', () => {
  const clean = evidenceQuality(ev());
  const promoted = evidenceQuality(ev({ promotional: true, tickerPitch: true }));
  assert.ok(promoted < clean);
});

test('V2 can keep a public theme alive when magnitude surprise and estimate lag remain large', () => {
  const result = scoreCandidateV2({
    asOf: '2023-01-03T00:00:00.000Z',
    evidence: [
      ev({ independenceGroup: 'field' }),
      ev({
        independenceGroup: 'trade-data',
        sourceClass: 'professional_data',
        firsthand: false,
        methodologyVisible: true
      })
    ],
    exposure: {
      productDirectness: 3,
      revenueMateriality: 3,
      geographyCustomerMatch: 2,
      capacityReadiness: 2,
      diversificationPenalty: 1,
      substitutionPenalty: 0
    },
    surprise: {
      magnitudeAcceleration: 3,
      consensusGap: 3,
      estimateRevisionLag: 2,
      durationPersistence: 2
    },
    pricing: {
      mediaSaturation: 1,
      valuationStretch: 1,
      estimateRevisionCompletion: 0,
      prior60Return: 0.25,
      prior180Return: 0.60
    }
  });
  assert.equal(result.decision, 'Candidate');
  assert.equal(result.rationale.noSimplePublicDisclosurePenalty, true);
});

test('weak exposure remains Watch even with strong chatter', () => {
  const result = scoreCandidateV2({
    asOf: '2023-01-03T00:00:00.000Z',
    evidence: [
      ev({ independenceGroup: 'field' }),
      ev({
        independenceGroup: 'trade-data',
        sourceClass: 'professional_data',
        methodologyVisible: true
      })
    ],
    exposure: {
      productDirectness: 1,
      revenueMateriality: 1,
      geographyCustomerMatch: 1,
      capacityReadiness: 1,
      diversificationPenalty: 0,
      substitutionPenalty: 0
    },
    surprise: {
      magnitudeAcceleration: 3,
      consensusGap: 3,
      estimateRevisionLag: 2,
      durationPersistence: 2
    },
    pricing: {
      mediaSaturation: 0,
      valuationStretch: 0,
      estimateRevisionCompletion: 0,
      prior60Return: 0,
      prior180Return: 0
    }
  });
  assert.equal(result.decision, 'Watch');
});
