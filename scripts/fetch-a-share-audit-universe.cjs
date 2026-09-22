const fs = require('node:fs');
const path = require('node:path');

const EASTMONEY_BASE =
  'https://push2.eastmoney.com/api/qt/clist/get?po=1&np=1&fltt=2&invt=2&fid=f3&fs=m%3A0%2Bt%3A6%2Cm%3A0%2Bt%3A80%2Cm%3A1%2Bt%3A2%2Cm%3A1%2Bt%3A23&fields=f12%2Cf13%2Cf14';
const PAGE_SIZE = 100;
const EASTMONEY_URL = `${EASTMONEY_BASE}&pn=1&pz=${PAGE_SIZE}`;

function normalizeName(name) {
  return String(name ?? '').trim();
}

function boardFor(code, market) {
  if (market === 1 && /^(600|601|603|605)\d{3}$/.test(code)) return 'sh_main';
  if (market === 0 && /^(000|001|002|003)\d{3}$/.test(code)) return 'sz_main';
  if (market === 0 && /^(300|301)\d{3}$/.test(code)) return 'chinext';
  if (market === 1 && /^688\d{3}$/.test(code)) return 'star';
  return 'other';
}

function exclusionReason(row) {
  const code = String(row?.f12 ?? '').trim();
  const name = normalizeName(row?.f14);
  const market = Number(row?.f13);
  const board = boardFor(code, market);

  if (!/^\d{6}$/.test(code)) return 'invalid_code';
  if (!name) return 'missing_name';
  if (board === 'star') return 'star_board';
  if (!['sh_main', 'sz_main', 'chinext'].includes(board)) return 'outside_frozen_boards';
  if (/\*?ST/i.test(name)) return 'st';
  if (/退/.test(name)) return 'delisting_marker';
  if (/^[NC]/i.test(name)) return 'recent_listing_marker';
  return null;
}

function tickerFor(row) {
  const code = String(row.f12);
  return `${code}.${Number(row.f13) === 1 ? 'SH' : 'SZ'}`;
}

function buildUniverse(rows, metadata = {}) {
  const included = [];
  const excluded = [];
  for (const row of rows) {
    const reason = exclusionReason(row);
    const item = {
      ticker: /^\d{6}$/.test(String(row?.f12 ?? '')) ? tickerFor(row) : null,
      code: String(row?.f12 ?? ''),
      name: normalizeName(row?.f14),
      marketCode: Number(row?.f13),
      board: boardFor(String(row?.f12 ?? ''), Number(row?.f13))
    };
    if (reason) excluded.push({ ...item, exclusionReason: reason });
    else included.push(item);
  }
  included.sort((a, b) => a.ticker.localeCompare(b.ticker));
  excluded.sort((a, b) => (a.ticker ?? a.code).localeCompare(b.ticker ?? b.code));

  const exclusionCounts = {};
  for (const row of excluded) exclusionCounts[row.exclusionReason] = (exclusionCounts[row.exclusionReason] ?? 0) + 1;

  return {
    schemaVersion: '1.0',
    universeVersion: 'cn-a-share-main-chinext-v1',
    generatedAt: metadata.generatedAt ?? new Date().toISOString(),
    asOfDate: metadata.asOfDate ?? null,
    source: {
      provider: 'Eastmoney public quote list',
      url: metadata.url ?? EASTMONEY_URL,
      retrievedAt: metadata.retrievedAt ?? null
    },
    inclusionRule: {
      exchanges: ['Shanghai', 'Shenzhen'],
      boards: ['Shanghai main board', 'Shenzhen main board', 'ChiNext'],
      includePrefixes: ['600','601','603','605','000','001','002','003','300','301'],
      exclusions: [
        'STAR Market (688xxx)',
        'ST/*ST names',
        'names containing delisting marker 退',
        'N/C recent-listing markers',
        'codes outside the frozen prefix/board set'
      ],
      note: 'This universe is for prospective missed-opportunity auditing. It is not retroactively substituted into historical runs whose exact universe was not frozen.'
    },
    summary: {
      rawCount: rows.length,
      includedCount: included.length,
      excludedCount: excluded.length,
      exclusionCounts
    },
    included,
    excluded
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(page) {
  const url = `${EASTMONEY_BASE}&pn=${page}&pz=${PAGE_SIZE}`;
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'stock-rador-audit-universe/0.6' },
        signal: AbortSignal.timeout(30000)
      });
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable) throw new Error(`HTTP ${response.status}: Eastmoney universe page ${page}`);
        throw new Error(`retryable HTTP ${response.status}: Eastmoney universe page ${page}`);
      }
      const body = await response.json();
      const rows = body?.data?.diff;
      if (!Array.isArray(rows)) throw new Error(`unexpected Eastmoney page ${page} payload`);
      return { rows, total: Number(body?.data?.total), url, attempts: attempt };
    } catch (error) {
      lastError = error;
      if (attempt === 5) break;
      await sleep(500 * (2 ** (attempt - 1)) + page * 15);
    }
  }
  throw new Error(`Eastmoney universe page ${page} failed after retries: ${lastError?.message ?? 'unknown error'}`);
}

async function fetchRows() {
  const first = await fetchPage(1);
  if (!Number.isInteger(first.total) || first.total < 1000) {
    throw new Error(`unexpected Eastmoney universe total: ${first.total}`);
  }
  const pageCount = Math.ceil(first.total / PAGE_SIZE);
  const pages = [{ page: 1, ...first }];

  for (let start = 2; start <= pageCount; start += 2) {
    const numbers = Array.from(
      { length: Math.min(2, pageCount - start + 1) },
      (_, index) => start + index
    );
    const batch = await Promise.all(numbers.map(async (page) => ({ page, ...(await fetchPage(page)) })));
    pages.push(...batch);
  }

  pages.sort((a, b) => a.page - b.page);
  const byCode = new Map();
  for (const page of pages) {
    for (const row of page.rows) {
      const key = `${row?.f13}:${row?.f12}`;
      if (byCode.has(key)) throw new Error(`duplicate Eastmoney security across pages: ${key}`);
      byCode.set(key, row);
    }
  }

  const rows = [...byCode.values()];
  if (rows.length < Math.min(first.total, 1000)) {
    throw new Error(`unexpected paged Eastmoney universe payload: ${rows.length}/${first.total} rows`);
  }
  return {
    rows,
    total: first.total,
    pageCount,
    maxAttemptsUsed: Math.max(...pages.map((page) => page.attempts ?? 1))
  };
}

async function main() {
  const outputPath = process.argv[2];
  const asOfDate = process.argv[3] ?? new Date().toISOString().slice(0, 10);
  if (!outputPath) {
    console.error('Usage: node scripts/fetch-a-share-audit-universe.cjs <output.json> [as-of-date]');
    process.exit(2);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) throw new Error('as-of-date must be YYYY-MM-DD');
  const fetched = await fetchRows();
  const retrievedAt = new Date().toISOString();
  const universe = buildUniverse(fetched.rows, { asOfDate, retrievedAt, generatedAt: retrievedAt, url: EASTMONEY_URL });
  universe.source.reportedTotal = fetched.total;
  universe.source.pageCount = fetched.pageCount;
  universe.source.pageSize = PAGE_SIZE;
  universe.source.maxAttemptsUsed = fetched.maxAttemptsUsed;
  if (universe.summary.includedCount < 1000) {
    throw new Error(`included universe unexpectedly small: ${universe.summary.includedCount}`);
  }
  const absolute = path.resolve(outputPath);
  if (fs.existsSync(absolute)) throw new Error(`refusing to overwrite existing universe ${absolute}`);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(universe, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(universe.summary));
  console.log(absolute);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { EASTMONEY_URL, PAGE_SIZE, boardFor, buildUniverse, exclusionReason, tickerFor };
