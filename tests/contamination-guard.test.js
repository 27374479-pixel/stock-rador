const test = require('node:test');
const assert = require('node:assert/strict');
const { assertNoViewedOutcomeCandidates } = require('../src/contamination-guard');

test('untouched candidates pass the viewed-outcome guard', () => {
  assert.equal(
    assertNoViewedOutcomeCandidates([{ ticker: '000921.SZ' }], ['300327.SZ']),
    true
  );
});

test('candidate whose future path was already inspected is rejected', () => {
  assert.throws(
    () => assertNoViewedOutcomeCandidates(
      [{ ticker: '300327.SZ' }, { ticker: '000921.SZ' }],
      ['300327.SZ', '603416.SH']
    ),
    /candidate outcome contamination: 300327\.SZ/
  );
});
