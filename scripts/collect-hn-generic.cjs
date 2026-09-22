const fs = require('node:fs');
const path = require('node:path');

const ENDPOINT = 'https://hn.algolia.com/api/v1/search_by_date';
const TYPES = ['story', 'comment'];
const HITS_PER_PAGE = 100;
const DEFAULT_MAX_PAGES = 3;
const DEFAULT_REVIEW_LIMIT = 120;
const CHANGE_QUERIES = [
  'shortage',
  'lead time',
  'backlog',
  'price increase',
  'supply constrained',
  'allocation',
  'sold out',
  'capacity cut',
  'restocking'
];
const SIGNAL_FAMILIES = {
  shortage: ['shortage', 'shortages', 'scarcity', 'supply crunch', 'constrained', 'constraint', 'allocation', 'sold out'],
  price: ['price increase', 'price increases', 'price hike', 'price hikes', 'price spike', 'prices rose', 'prices rising', 'more expensive'],
  orders: ['order', 'orders', 'backlog', 'booked', 'booking', 'contract', 'contracts', 'waitlist'],
  leadTime: ['lead time', 'lead times', 'delivery time', 'delivery times', 'wait time', 'wait times'],
  capacity: ['capacity cut', 'capacity cuts', 'capacity expansion', 'capacity constrained', 'production cut', 'production cuts', 'factory shutdown', 'plant shutdown'],
  inventory: ['inventory shortage', 'inventories low', 'inventory low', 'restocking', 'destocking', 'stockpile'],
  demand: ['demand surge', 'demand spike', 'strong demand', 'demand exceeds', 'demand outstrips', 'weak demand']
};

function parseArgs(argv) {
  const options = { maxPages: DEFAULT_MAX_PAGES, reviewLimit: DEFAULT_REVIEW_LIMIT };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--start' && next) { options.start = next; i += 1; }
    else if (arg === '--end' && next) { options.end = next; i += 1; }
    else if (arg === '--out' && next) { options.out = next; i += 1; }
    else if (arg === '--max-pages' && next) { options.maxPages = Number(next); i += 1; }
    else if (arg === '--review-limit' && next) { options.reviewLimit = Number(next); i += 1; }
    else throw new Error(`unknown or incomplete option ${arg}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.start || '')) throw new Error('--start YYYY-MM-DD is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.end || '')) throw new Error('--end YYYY-MM-DD is required (exclusive)');
  if (options.start >= options.end) throw new Error('--start must be before --end');
  if (!Number.isInteger(options.maxPages) || options.maxPages < 1 || options.maxPages > 20) throw new Error('--max-pages must be 1..20');
  if (!Number.isInteger(options.reviewLimit) || options.reviewLimit < 1 || options.reviewLimit > 1000) throw new Error('--review-limit must be 1..1000');
  return options;
}

function epochSeconds(date) {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 1000);
}

function buildUrl({ query, type, page, start, end }) {
  const params = new URLSearchParams({
    query,
    tags: type,
    numericFilters: `created_at_i>=${epochSeconds(start)},created_at_i<${epochSeconds(end)}`,
    hitsPerPage: String(HITS_PER_PAGE),
    page: String(page)
  });
  return `${ENDPOINT}?${params}`;
}

function normalizeText(value, limit = 6000) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function sourceText(hit, type) {
  if (type === 'comment') return hit.comment_text;
  return [hit.title, hit.story_text].filter(Boolean).join(' ');
}

function scoreText(text) {
  const lower = text.toLowerCase();
  const matchedFamilies = {};
  for (const [family, terms] of Object.entries(SIGNAL_FAMILIES)) {
    const matched = terms.filter((term) => lower.includes(term));
    if (matched.length) matchedFamilies[family] = matched;
  }
  return { score: Object.keys(matchedFamilies).length, matchedFamilies };
}

function normalizeHit(hit, match, observedAt) {
  const text = normalizeText(sourceText(hit, match.type));
  const signal = scoreText(text);
  return {
    objectID: String(hit.objectID),
    type: match.type,
    rootStoryId: match.type === 'story' ? String(hit.objectID) : String(hit.story_id || 'unknown'),
    author: hit.author || null,
    createdAt: hit.created_at || null,
    createdAtEpoch: Number.isInteger(hit.created_at_i) ? hit.created_at_i : null,
    observedAt,
    itemUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
    originalUrl: match.type === 'story' ? (hit.url || null) : null,
    title: match.type === 'story' ? normalizeText(hit.title, 500) || null : normalizeText(hit.story_title, 500) || null,
    text,
    signal,
    classification: signal.score >= 2 ? 'review_candidate' : 'low_signal',
    matches: [match]
  };
}

function mergeHit(map, hit, match, observedAt) {
  const id = String(hit.objectID);
  const existing = map.get(id);
  if (!existing) {
    map.set(id, normalizeHit(hit, match, observedAt));
    return;
  }
  if (!existing.matches.some((item) => item.query === match.query && item.type === match.type)) existing.matches.push(match);
}

function stableRank(items) {
  return [...items].sort((a, b) =>
    b.signal.score - a.signal.score ||
    b.matches.length - a.matches.length ||
    String(a.createdAt || '').localeCompare(String(b.createdAt || '')) ||
    a.objectID.localeCompare(b.objectID, 'en', { numeric: true })
  );
}

function diversify(items, limit) {
  const selected = [];
  const chosen = new Set();
  const roots = new Set();
  const authors = new Set();
  for (const item of items) {
    if (selected.length >= limit) break;
    if (!roots.has(item.rootStoryId)) {
      selected.push(item); chosen.add(item.objectID); roots.add(item.rootStoryId); if (item.author) authors.add(item.author);
    }
  }
  for (const item of items) {
    if (selected.length >= limit) break;
    if (!chosen.has(item.objectID) && item.author && !authors.has(item.author)) {
      selected.push(item); chosen.add(item.objectID); authors.add(item.author);
    }
  }
  for (const item of items) {
    if (selected.length >= limit) break;
    if (!chosen.has(item.objectID)) { selected.push(item); chosen.add(item.objectID); }
  }
  return selected;
}

function validatePayload(payload, request) {
  if (!payload || !Array.isArray(payload.hits)) throw new Error('response payload missing hits array');
  if (!Number.isInteger(payload.nbPages) || payload.nbPages < 0) throw new Error('response payload has invalid nbPages');
  const start = epochSeconds(request.start);
  const end = epochSeconds(request.end);
  for (const hit of payload.hits) {
    if (hit.objectID === undefined || hit.objectID === null) throw new Error('hit missing objectID');
    if (!Array.isArray(hit._tags) || !hit._tags.includes(request.type)) throw new Error(`hit ${hit.objectID} lacks requested type ${request.type}`);
    if (!Number.isInteger(hit.created_at_i) || hit.created_at_i < start || hit.created_at_i >= end) throw new Error(`hit ${hit.objectID} outside requested window`);
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'stock-rador-historical-replay/0.2' }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

async function collect(options) {
  const observedAt = new Date().toISOString();
  const map = new Map();
  const requests = [];
  let rawHitCount = 0;
  for (const query of CHANGE_QUERIES) {
    for (const type of TYPES) {
      const firstUrl = buildUrl({ query, type, page: 0, start: options.start, end: options.end });
      const first = await fetchJson(firstUrl);
      validatePayload(first, { type, start: options.start, end: options.end });
      const pageCount = Math.min(options.maxPages, first.nbPages);
      for (let page = 0; page < pageCount; page += 1) {
        const url = page === 0 ? firstUrl : buildUrl({ query, type, page, start: options.start, end: options.end });
        const payload = page === 0 ? first : await fetchJson(url);
        if (page > 0) validatePayload(payload, { type, start: options.start, end: options.end });
        requests.push({ query, type, page, url, hitCount: payload.hits.length });
        rawHitCount += payload.hits.length;
        for (const hit of payload.hits) mergeHit(map, hit, { query, type, page }, observedAt);
      }
    }
  }
  const items = stableRank([...map.values()]);
  const candidates = items.filter((item) => item.classification === 'review_candidate');
  const reviewItems = diversify(candidates, options.reviewLimit);
  return {
    schemaVersion: '1.0',
    collector: 'hn-generic-change-signals',
    observedAt,
    historicalWindow: { startDate: options.start, endDateExclusive: options.end },
    queryPolicy: {
      queries: CHANGE_QUERIES,
      types: TYPES,
      hitsPerPage: HITS_PER_PAGE,
      maxPagesPerQueryType: options.maxPages,
      reviewLimit: options.reviewLimit,
      candidateRule: 'at least two generic change-signal families in item text',
      industryWhitelist: false
    },
    availabilityCaveat: 'HN item creation timestamps are historical publication metadata. This source pack was collected later; historical Algolia indexing/visibility is not independently proven. Treat as historical replay, not forward evidence.',
    summary: {
      requestCount: requests.length,
      rawHitCount,
      uniqueItemCount: items.length,
      reviewCandidateCount: candidates.length,
      reviewItemCount: reviewItems.length,
      lowSignalCount: items.length - candidates.length
    },
    requests,
    reviewItems,
    rejectedIndex: items.filter((item) => item.classification !== 'review_candidate').map((item) => ({
      objectID: item.objectID,
      type: item.type,
      createdAt: item.createdAt,
      signalScore: item.signal.score,
      matches: item.matches
    }))
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const output = await collect(options);
  const outputPath = path.resolve(options.out || path.join('research', `hn-generic-${options.start}-${options.end}.json`));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  if (fs.existsSync(outputPath)) throw new Error(`refusing to overwrite existing output ${outputPath}`);
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(outputPath);
}

if (require.main === module) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { CHANGE_QUERIES, buildUrl, collect, diversify, parseArgs, scoreText, stableRank, validatePayload };
