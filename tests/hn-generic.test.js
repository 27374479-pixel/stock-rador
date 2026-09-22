const test = require('node:test');
const assert = require('node:assert/strict');
const { CHANGE_QUERIES, buildUrl, diversify, parseArgs, scoreText } = require('../scripts/collect-hn-generic.cjs');

test('generic discovery queries do not contain hard-coded sectors', () => {
  const joined = CHANGE_QUERIES.join(' ').toLowerCase();
  for (const forbidden of ['dram', 'mlcc', 'transformer', 'cooling', 'battery', 'semiconductor']) assert.equal(joined.includes(forbidden), false);
});

test('date window is explicit and end-exclusive in Algolia request', () => {
  const url = new URL(buildUrl({ query: 'shortage', type: 'story', page: 0, start: '2025-01-01', end: '2025-04-01' }));
  assert.equal(url.searchParams.get('query'), 'shortage');
  assert.equal(url.searchParams.get('tags'), 'story');
  assert.match(url.searchParams.get('numericFilters'), /^created_at_i>=\d+,created_at_i<\d+$/);
});

test('signal scoring requires independent generic families rather than repeated words', () => {
  assert.equal(scoreText('shortage shortage shortage').score, 1);
  assert.equal(scoreText('shortage caused a large backlog and longer lead time').score, 3);
});

test('CLI refuses implicit historical windows', () => {
  assert.throws(() => parseArgs([]), /--start/);
  assert.deepEqual(parseArgs(['--start','2025-01-01','--end','2025-04-01','--review-limit','50']), {
    start: '2025-01-01', end: '2025-04-01', reviewLimit: 50, maxPages: 3
  });
});

test('review diversification prefers distinct root stories', () => {
  const items = [
    { objectID:'1', rootStoryId:'a', author:'u1' },
    { objectID:'2', rootStoryId:'a', author:'u2' },
    { objectID:'3', rootStoryId:'b', author:'u1' }
  ];
  assert.deepEqual(diversify(items, 3).map((x) => x.objectID), ['1','3','2']);
});
