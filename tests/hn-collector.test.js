const test = require('node:test');
const assert = require('node:assert/strict');
const {
  auditItems,
  buildUrl,
  diversify,
  effectiveEndEpoch,
  mergeHit,
  pagesToFetch,
  scoreText,
  stableRank,
  summarize,
  validatePayload
} = require('../scripts/collect-hn.cjs');

test('effective end never extends beyond observation time or requested bound', () => {
  assert.equal(effectiveEndEpoch('2026-09-21T12:34:56.999Z'), 1789994096);
  assert.equal(effectiveEndEpoch('2026-09-23T00:00:00.000Z'), 1790035200);
});

test('request sends inclusive start, exclusive effective end, type, and pagination', () => {
  const url = new URL(buildUrl({ theme: 'DRAM', type: 'comment', page: 1, effectiveEnd: 1790001296 }));
  assert.equal(url.searchParams.get('query'), 'DRAM');
  assert.equal(url.searchParams.get('tags'), 'comment');
  assert.equal(url.searchParams.get('page'), '1');
  assert.equal(url.searchParams.get('hitsPerPage'), '100');
  assert.equal(url.searchParams.get('numericFilters'), 'created_at_i>=1780272000,created_at_i<1790001296');
});

test('pagination respects reported page count and hard two-page ceiling', () => {
  assert.equal(pagesToFetch({ nbPages: 0 }), 0);
  assert.equal(pagesToFetch({ nbPages: 1 }), 1);
  assert.equal(pagesToFetch({ nbPages: 9 }), 2);
});

test('deduplication preserves one item and all query match provenance', () => {
  const map = new Map();
  const hit = { objectID: '42', created_at: '2026-06-02T00:00:00Z', created_at_i: 1780358400, title: 'Supply shortage and price hike', author: 'a', points: 3, num_comments: 1 };
  mergeHit(map, hit, { theme: 'DRAM', type: 'story', page: 0 }, '2026-09-21T00:00:00Z');
  mergeHit(map, hit, { theme: 'MLCC', type: 'story', page: 0 }, '2026-09-21T00:00:01Z');
  assert.equal(map.size, 1);
  assert.deepEqual(map.get('42').matches.map(match => match.theme), ['DRAM', 'MLCC']);
  assert.equal(map.get('42').ranking.score, 2);
  assert.equal(summarize([...map.values()], 2).duplicateHitCount, 1);
});

test('stable ranking uses score, timestamp, then numeric object ID', () => {
  const items = [
    { objectID: '10', createdAt: '2026-06-02', ranking: { score: 1 } },
    { objectID: '2', createdAt: '2026-06-02', ranking: { score: 1 } },
    { objectID: '5', createdAt: '2026-07-01', ranking: { score: 2 } }
  ];
  assert.deepEqual(stableRank(items).map(item => item.objectID), ['5', '2', '10']);
});

test('keyword scoring counts families rather than repeated words', () => {
  assert.deepEqual(scoreText('Orders, orders, and backlog; lead time is now months.'), {
    score: 2,
    matchedFamilies: { orders: ['order', 'orders', 'backlog'], leadTime: ['lead time', 'months'] }
  });
});

test('diversification puts distinct root stories first while retaining every candidate', () => {
  const items = [
    { objectID: '1', rootStoryId: 'a', author: 'u1' },
    { objectID: '2', rootStoryId: 'a', author: 'u2' },
    { objectID: '3', rootStoryId: 'b', author: 'u1' }
  ];
  assert.deepEqual(diversify(items).map(item => item.objectID), ['1', '3', '2']);
});

test('post-run audit rejects substring noise independently of keyword score', () => {
  const base = { objectID: '1', type: 'comment', rootStoryId: '9', author: 'u', createdAt: '2026-09-01T00:00:00Z', ranking: { score: 1 }, classification: 'candidate' };
  const audited = auditItems([
    { ...base, text: 'The drama contract ended after weeks.', matches: [{ theme: 'DRAM', type: 'comment', page: 0 }] },
    { ...base, objectID: '2', text: 'Power transformers now have 24 month lead times.', matches: [{ theme: 'transformer', type: 'comment', page: 0 }] }
  ]);
  assert.equal(audited[0].audit.auditedClassification, 'rejected_theme_mismatch');
  assert.equal(audited[1].audit.auditedClassification, 'candidate');
});

test('payload validation fails closed on missing hits and bad timestamps', () => {
  const request = { type: 'story', effectiveEnd: 1789994096 };
  assert.throws(() => validatePayload({ nbPages: 0 }, request), /missing a hits array/);
  assert.throws(() => validatePayload({ nbPages: 1, hits: [{ objectID: '1', _tags: ['story'], created_at: '2026-06-02T00:00:01Z', created_at_i: 1780358400 }] }, request), /inconsistent timestamps/);
  assert.throws(() => validatePayload({ nbPages: 1, hits: [{ objectID: '1', _tags: ['comment'], created_at: '2026-06-02T00:00:00Z', created_at_i: 1780358400 }] }, request), /lacks requested story tag/);
  assert.throws(() => validatePayload({ nbPages: 1, hits: [{ objectID: '1', _tags: ['story'], created_at: '2026-09-22T00:00:00Z', created_at_i: 1790035200 }] }, request), /outside the effective window/);
  assert.doesNotThrow(() => validatePayload({ nbPages: 1, hits: [{ objectID: '1', _tags: ['story'], created_at: '2026-06-02T00:00:00Z', created_at_i: 1780358400 }] }, request));
});
