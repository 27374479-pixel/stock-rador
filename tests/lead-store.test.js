const test = require('node:test');
const assert = require('node:assert/strict');
const { reviewLead, validateStore } = require('../src/lead-store');

const t = '2026-09-20T00:00:00.000Z';

function evidence(overrides = {}) {
  return {
    id: 'ev-1',
    relation: 'supports',
    sourceType: 'primary',
    url: 'https://issuer.example/filing',
    title: 'Filing',
    publisher: 'Issuer',
    publishedAt: t,
    availableAt: t,
    accessedAt: t,
    independenceGroup: 'issuer-filing',
    ...overrides
  };
}

function lead(overrides = {}) {
  return {
    id: 'lead-1',
    observedAt: t,
    availableAt: t,
    source: {
      kind: 'forum', platform: 'Example forum', url: 'https://example.com/post', title: 'Post',
      publishedAt: t, datePrecision: 'timestamp', accessedAt: t, accessMethod: 'public web',
      accessStatus: 'accessible', textAvailability: 'full', contentKind: 'original_discussion'
    },
    claim: { summary: 'A testable supply claim', category: 'supply', entities: ['product'] },
    truthStatus: 'supported',
    truthAssessedAt: t,
    verificationEvidence: [evidence(), evidence({ id: 'ev-2', sourceType: 'secondary', independenceGroup: 'industry-data' })],
    invalidationIndicators: [{ indicator: 'Lead time returns below 8 weeks', observationMethod: 'monthly supplier check', status: 'unknown' }],
    aShareMappings: [{
      ticker: '000001.SZ', name: 'Example',
      exposure: { status: 'verified', summary: 'Revenue exposure disclosed', evidenceRefs: ['ev-1'] },
      valuationExpectations: { status: 'verified', asOf: t, summary: 'Consensus omits volume change', evidenceRefs: ['ev-2'] }
    }],
    ...overrides
  };
}

function store(item) {
  return {
    schemaVersion: '1.0', createdAt: t, updatedAt: t,
    accessScope: { description: 'Public pages checked manually', collectionMethod: 'manual', includedPlatforms: ['Example'], limitations: ['No login-only pages'] },
    leads: [item]
  };
}

test('a complete record reaches S research priority', () => {
  assert.equal(reviewLead(lead()).gate, 'S');
});

test('unknown remains unknown and cannot reach S', () => {
  const result = reviewLead(lead({ truthStatus: 'unknown' }));
  assert.equal(result.gate, 'A');
  assert.match(result.reasons.join(' '), /unknown/);
});

test('verified exposure without dated valuation evidence cannot reach S', () => {
  const item = lead();
  item.aShareMappings[0].valuationExpectations = { status: 'claimed', summary: 'Possible gap', evidenceRefs: ['ev-2'] };
  assert.equal(reviewLead(item).gate, 'A');
});

test('two citations from one independence group do not satisfy S', () => {
  const item = lead();
  item.verificationEvidence[1].independenceGroup = 'issuer-filing';
  assert.equal(reviewLead(item).gate, 'A');
});

test('syndicated copies of one origin count as one independent group', () => {
  const item = lead();
  item.verificationEvidence[0].url = 'https://domain-a.example/wire-copy';
  item.verificationEvidence[1].url = 'https://domain-b.example/wire-copy';
  item.verificationEvidence[1].independenceGroup = item.verificationEvidence[0].independenceGroup;
  assert.equal(reviewLead(item).gate, 'A');
});

test('missing timing and invalidation fields fail validation instead of passing silently', () => {
  const item = lead();
  delete item.availableAt;
  item.invalidationIndicators = [];
  const errors = validateStore(store(item));
  assert.ok(errors.some((message) => message.includes('availableAt')));
  assert.ok(errors.some((message) => message.includes('invalidationIndicators')));
});

test('contradicted evidence status is rejected', () => {
  assert.equal(reviewLead(lead({ truthStatus: 'contradicted' })).gate, 'Reject');
});

test('future evidence cannot pass an historical as-of review', () => {
  const item = lead();
  item.verificationEvidence[1].availableAt = '2026-10-01T00:00:00.000Z';
  item.verificationEvidence[1].accessedAt = '2026-10-01T00:00:00.000Z';
  const result = reviewLead(item, { asOf: '2026-09-21T00:00:00.000Z' });
  assert.equal(result.gate, 'A');
  assert.match(result.reasons.join(' '), /was excluded/);
});

test('a triggered invalidation indicator is rejected', () => {
  const item = lead();
  item.invalidationIndicators[0].status = 'triggered';
  item.invalidationIndicators[0].checkedAt = t;
  assert.equal(reviewLead(item).gate, 'Reject');
});

test('partial forum text cannot upgrade beyond Watch', () => {
  const item = lead();
  item.source.textAvailability = 'snippet_only';
  assert.equal(reviewLead(item).gate, 'Watch');
});

test('unknown publication time can be stored honestly but cannot upgrade', () => {
  const item = lead();
  item.source.publishedAt = null;
  item.source.datePrecision = 'unknown';
  assert.deepEqual(validateStore(store(item)), []);
  assert.equal(reviewLead(item).gate, 'Watch');
});

test('A requires primary evidence and verified economic exposure', () => {
  const item = lead({ truthStatus: 'unknown' });
  item.verificationEvidence = [evidence({ sourceType: 'secondary' })];
  item.aShareMappings[0].exposure.evidenceRefs = ['ev-1'];
  item.aShareMappings[0].valuationExpectations.evidenceRefs = ['ev-1'];
  assert.equal(reviewLead(item).gate, 'Watch');
});

test('review fails closed for an invalid record', () => {
  const item = lead();
  delete item.availableAt;
  const result = reviewLead(item);
  assert.equal(result.gate, 'Watch');
  assert.equal(result.valid, false);
});

test('mapping references must resolve to evidence IDs', () => {
  const item = lead();
  item.aShareMappings[0].exposure.evidenceRefs = ['missing'];
  assert.ok(validateStore(store(item)).some((message) => message.includes('does not resolve')));
});

test('past day-precision publication dates are stored and reviewed conservatively', () => {
  const item = lead();
  item.source.publishedAt = '2026-09-19';
  item.source.datePrecision = 'date';
  assert.deepEqual(validateStore(store(item)), []);
  assert.equal(reviewLead(item, { asOf: '2026-09-20T00:00:00.000Z' }).gate, 'S');
  assert.equal(reviewLead(item, { asOf: '2026-09-19T12:00:00.000Z' }).gate, 'Watch');
});

test('duplicate evidence IDs fail validation', () => {
  const item = lead();
  item.verificationEvidence[1].id = 'ev-1';
  assert.ok(validateStore(store(item)).some((message) => message.includes('duplicates ev-1')));
});

test('future publication and assessment cannot pass a historical cutoff', () => {
  const item = lead();
  item.source.publishedAt = '2026-10-01T00:00:00.000Z';
  item.truthAssessedAt = '2026-10-01T00:00:00.000Z';
  const result = reviewLead(item, { asOf: '2026-09-21T00:00:00.000Z' });
  assert.equal(result.gate, 'Watch');
});

test('contradicting evidence cannot prove mapping exposure', () => {
  const item = lead();
  item.verificationEvidence[0].relation = 'contradicts';
  assert.ok(validateStore(store(item)).some((message) => message.includes('must reference supports')));
});

test('invalid calendar dates and impossible source ordering fail validation', () => {
  const item = lead();
  item.source.publishedAt = '2026-02-30T00:00:00.000Z';
  assert.ok(validateStore(store(item)).some((message) => message.includes('source.publishedAt')));
  item.source.publishedAt = '2026-09-21T00:00:00.000Z';
  assert.ok(validateStore(store(item)).some((message) => message.includes('must be at or before availableAt')));
});

test('future observedAt cannot pass an historical cutoff', () => {
  const item = lead();
  item.observedAt = '2026-10-01T00:00:00.000Z';
  item.availableAt = '2026-10-01T00:00:00.000Z';
  item.source.accessedAt = '2026-10-01T00:00:00.000Z';
  assert.equal(reviewLead(item, { asOf: '2026-09-21T00:00:00.000Z' }).gate, 'Watch');
});

test('a contradiction assessed after cutoff does not rewrite historical status', () => {
  const item = lead({ truthStatus: 'contradicted', truthAssessedAt: '2026-10-01T00:00:00.000Z' });
  assert.equal(reviewLead(item, { asOf: '2026-09-21T00:00:00.000Z' }).gate, 'A');
});

test('future published evidence is excluded even when availableAt is backdated', () => {
  const item = lead();
  item.verificationEvidence[1].publishedAt = '2026-10-01T00:00:00.000Z';
  item.verificationEvidence[1].availableAt = '2026-09-20T00:00:00.000Z';
  const result = reviewLead(item, { asOf: '2026-09-21T00:00:00.000Z' });
  assert.equal(result.gate, 'Watch');
  assert.equal(result.valid, false);
});

test('news reposts remain Watch as a comparison sample', () => {
  const item = lead();
  item.source.contentKind = 'news_repost';
  assert.equal(reviewLead(item).gate, 'Watch');
});

test('forum-domain evidence cannot satisfy independent primary gate', () => {
  const item = lead();
  item.verificationEvidence[0].url = 'https://example.com/another-post';
  item.verificationEvidence[1].sourceType = 'secondary';
  assert.equal(reviewLead(item).gate, 'Watch');
});

test('default review records a finite current cutoff', () => {
  const result = reviewLead(lead());
  assert.match(result.asOf, /^\d{4}-\d{2}-\d{2}T/);
  assert.ok(Number.isFinite(Date.parse(result.asOf)));
});

test('unknown evidence publication date can support current research from availableAt', () => {
  const item = lead();
  item.verificationEvidence[0].publishedAt = null;
  item.verificationEvidence[0].datePrecision = 'unknown';
  assert.equal(reviewLead(item, { asOf: '2026-09-21T00:00:00.000Z' }).gate, 'S');
});

test('unknown publication evidence cannot leak before its availableAt', () => {
  const item = lead();
  item.verificationEvidence[0].publishedAt = null;
  item.verificationEvidence[0].datePrecision = 'unknown';
  item.verificationEvidence[0].availableAt = '2026-09-21T00:00:00.000Z';
  item.verificationEvidence[0].accessedAt = '2026-09-21T00:00:00.000Z';
  assert.equal(reviewLead(item, { asOf: '2026-09-20T23:59:59.999Z' }).gate, 'Watch');
});
