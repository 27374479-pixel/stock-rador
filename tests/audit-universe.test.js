const test = require('node:test');
const assert = require('node:assert/strict');
const { boardFor, buildUniverse, exclusionReason } = require('../scripts/fetch-a-share-audit-universe.cjs');

test('audit universe includes main-board and ChiNext common A shares', () => {
  const rows = [
    { f12: '600000', f13: 1, f14: '浦发银行' },
    { f12: '000001', f13: 0, f14: '平安银行' },
    { f12: '300001', f13: 0, f14: '特锐德' },
    { f12: '301001', f13: 0, f14: '凯淳股份' }
  ];
  const u = buildUniverse(rows, { asOfDate: '2026-09-22' });
  assert.deepEqual(u.included.map((x) => x.ticker), ['000001.SZ','300001.SZ','301001.SZ','600000.SH']);
});

test('audit universe excludes STAR, ST, delisting and N/C recent listings', () => {
  const rows = [
    { f12: '688001', f13: 1, f14: '华兴源创' },
    { f12: '600001', f13: 1, f14: 'ST测试' },
    { f12: '000002', f13: 0, f14: '测试退' },
    { f12: '001001', f13: 0, f14: 'N测试' },
    { f12: '001002', f13: 0, f14: 'C测试' }
  ];
  const u = buildUniverse(rows, { asOfDate: '2026-09-22' });
  assert.equal(u.included.length, 0);
  assert.deepEqual(new Set(u.excluded.map((x) => x.exclusionReason)),
    new Set(['star_board','st','delisting_marker','recent_listing_marker']));
});

test('board mapping is explicit and fails outside the frozen board set', () => {
  assert.equal(boardFor('603001', 1), 'sh_main');
  assert.equal(boardFor('002001', 0), 'sz_main');
  assert.equal(boardFor('300001', 0), 'chinext');
  assert.equal(boardFor('688001', 1), 'star');
  assert.equal(boardFor('920001', 0), 'other');
  assert.equal(exclusionReason({ f12: '920001', f13: 0, f14: '北交样本' }), 'outside_frozen_boards');
});
