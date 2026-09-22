const fs = require('fs');
const path = require('path');

const ENDPOINT = 'https://hn.algolia.com/api/v1/search_by_date';
const START_ISO = '2026-06-01T00:00:00.000Z';
const END_ISO = '2026-09-22T00:00:00.000Z';
const THEMES = ['transformer', 'DRAM', 'MLCC', 'cooling'];
const TYPES = ['story', 'comment'];
const MAX_PAGES = 2;
const HITS_PER_PAGE = 100;
const KEYWORD_FAMILIES = {
  shortage: ['shortage', 'scarcity', 'sold out', 'allocation', 'constrained', 'supply crunch'],
  price: ['price increase', 'price hike', 'pricing', 'cost increase', 'more expensive'],
  orders: ['order', 'orders', 'backlog', 'booked', 'contract'],
  leadTime: ['lead time', 'lead times', 'delivery time', 'wait time', 'weeks', 'months']
};
const PHYSICAL_THEME_TESTS = {
  DRAM: text => /\b(?:dram|ddr(?:3|4|5)|hbm\d*|ram)\b/i.test(text) || /\bmemory\s+(?:chip|chips|maker|makers|shortage|shortages|price|prices|fab|fabs|factory|factories|capacity|inventory|inventories)\b/i.test(text),
  MLCC: text => /\bmlccs?\b/i.test(text) || /\bmulti[- ]?layer ceramic capacitors?\b/i.test(text),
  transformer: text => /\bpower\s+transformers?\b/i.test(text) || (/\btransformers?\b/i.test(text) && /\b(?:grid|utility|utilities|electrical|voltage|substation)\b/i.test(text)),
  cooling: text => /\bcooling\b/i.test(text) && /\b(?:data ?centers?|liquid|thermal|heat|chillers?|hvac|racks?|servers?|power|immersion)\b/i.test(text)
};

function epochSeconds(iso) {
  return Math.floor(Date.parse(iso) / 1000);
}

function effectiveEndEpoch(runStartedAt) {
  return Math.min(epochSeconds(END_ISO), epochSeconds(runStartedAt));
}

function buildUrl({ theme, type, page, effectiveEnd }) {
  const params = new URLSearchParams({
    query: theme,
    tags: type,
    numericFilters: `created_at_i>=${epochSeconds(START_ISO)},created_at_i<${effectiveEnd}`,
    hitsPerPage: String(HITS_PER_PAGE),
    page: String(page)
  });
  return `${ENDPOINT}?${params}`;
}

function normalizedText(value, limit = 4000) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function scoreText(text) {
  const lower = text.toLowerCase();
  const matchedFamilies = {};
  for (const [family, keywords] of Object.entries(KEYWORD_FAMILIES)) {
    const matches = keywords.filter(keyword => lower.includes(keyword));
    if (matches.length) matchedFamilies[family] = matches;
  }
  return { score: Object.keys(matchedFamilies).length, matchedFamilies };
}

function sourceText(hit, type) {
  if (type === 'comment') return hit.comment_text;
  return [hit.title, hit.story_text].filter(Boolean).join(' ');
}

function normalizeHit(hit, match, observedAt) {
  const type = match.type;
  const text = normalizedText(sourceText(hit, type));
  const ranking = scoreText(text);
  const rootStoryId = type === 'story' ? String(hit.objectID) : String(hit.story_id || 'unknown');
  return {
    objectID: String(hit.objectID),
    type,
    rootStoryId,
    author: hit.author || null,
    createdAt: hit.created_at || null,
    createdAtEpoch: Number.isFinite(hit.created_at_i) ? hit.created_at_i : null,
    observedAt,
    itemUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
    originalUrl: type === 'story' ? (hit.url || null) : null,
    title: type === 'story' ? normalizedText(hit.title, 500) || null : normalizedText(hit.story_title, 500) || null,
    text,
    textOrigin: type === 'comment' ? 'comment_text' : (hit.story_text ? 'story_title_and_text' : 'story_title'),
    engagementSnapshot: {
      observedAt,
      points: Number.isFinite(hit.points) ? hit.points : null,
      commentCount: Number.isFinite(hit.num_comments) ? hit.num_comments : null,
      warning: 'Current API snapshot; not historical popularity at publication.'
    },
    ranking,
    classification: ranking.score > 0 ? 'candidate' : 'rejected_no_signal_keyword',
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
  if (!existing.matches.some(item => item.theme === match.theme && item.type === match.type)) {
    existing.matches.push(match);
  }
}

function stableRank(items) {
  return [...items].sort((a, b) =>
    b.ranking.score - a.ranking.score ||
    String(a.createdAt || '').localeCompare(String(b.createdAt || '')) ||
    a.objectID.localeCompare(b.objectID, 'en', { numeric: true })
  );
}

function diversify(items) {
  const result = [];
  const chosen = new Set();
  const roots = new Set();
  const authors = new Set();
  for (const item of items) {
    if (!roots.has(item.rootStoryId)) {
      result.push(item); chosen.add(item.objectID); roots.add(item.rootStoryId);
      if (item.author) authors.add(item.author);
    }
  }
  for (const item of items) {
    if (!chosen.has(item.objectID) && item.author && !authors.has(item.author)) {
      result.push(item); chosen.add(item.objectID); authors.add(item.author);
    }
  }
  for (const item of items) if (!chosen.has(item.objectID)) result.push(item);
  return result;
}

function pagesToFetch(payload) {
  const reported = Number.isInteger(payload?.nbPages) ? payload.nbPages : 0;
  return Math.min(MAX_PAGES, reported);
}

function summarize(items, rawHitCount) {
  const candidates = items.filter(item => item.classification === 'candidate');
  const rejected = items.filter(item => item.classification !== 'candidate');
  return {
    rawHitCount,
    uniqueItemCount: items.length,
    duplicateHitCount: rawHitCount - items.length,
    candidateCount: candidates.length,
    rejectedCount: rejected.length,
    candidateDistinctRootStoryCount: new Set(candidates.map(item => item.rootStoryId)).size,
    candidateDistinctAuthorCount: new Set(candidates.map(item => item.author).filter(Boolean)).size,
    rejectedDistinctRootStoryCount: new Set(rejected.map(item => item.rootStoryId)).size,
    rejectedDistinctAuthorCount: new Set(rejected.map(item => item.author).filter(Boolean)).size
  };
}

function auditItems(items) {
  return items.map(item => {
    const qualifyingThemes = [...new Set(item.matches.map(match => match.theme).filter(theme => PHYSICAL_THEME_TESTS[theme]?.(item.text)))];
    let auditedClassification = 'candidate';
    let auditReason = 'Strict physical-theme gate and at least one signal-keyword family matched.';
    if (!qualifyingThemes.length) {
      auditedClassification = 'rejected_theme_mismatch';
      auditReason = 'No strict physical-theme term/context match in the item text.';
    } else if (item.ranking.score === 0) {
      auditedClassification = 'rejected_no_signal_keyword';
      auditReason = 'Physical theme matched, but no shortage/price/orders/lead-time keyword family matched.';
    }
    return { ...item, audit: { version: '2.0-amendment', qualifyingThemes, auditedClassification, auditReason } };
  });
}

function validatePayload(payload, request) {
  if (!payload || !Array.isArray(payload.hits)) throw new Error('Response payload is missing a hits array');
  if (!Number.isInteger(payload.nbPages) || payload.nbPages < 0) throw new Error('Response payload has invalid nbPages');
  const start = epochSeconds(START_ISO);
  for (const hit of payload.hits) {
    if (hit.objectID === undefined || hit.objectID === null || String(hit.objectID).length === 0) throw new Error('Hit has invalid objectID');
    if (!Array.isArray(hit._tags) || !hit._tags.includes(request.type)) throw new Error(`Hit ${hit.objectID} lacks requested ${request.type} tag`);
    if (!Number.isInteger(hit.created_at_i) || hit.created_at_i < start || hit.created_at_i >= request.effectiveEnd) throw new Error(`Hit ${hit.objectID} is outside the effective window`);
    if (!hit.created_at || epochSeconds(hit.created_at) !== hit.created_at_i) throw new Error(`Hit ${hit.objectID} has inconsistent timestamps`);
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function fetchPage(request) {
  const observedAt = new Date().toISOString();
  const url = buildUrl(request);
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'stock-rador-research/0.1 (public HN capture)' },
    signal: AbortSignal.timeout(20000)
  });
  const body = await response.text();
  let payload;
  try { payload = JSON.parse(body); } catch (error) {
    const failure = new Error(`Invalid JSON (${response.status}) for ${request.theme}/${request.type}/page-${request.page}`);
    failure.details = { observedAt, url, httpStatus: response.status, responseBody: body.slice(0, 2000) };
    throw failure;
  }
  if (!response.ok) {
    const failure = new Error(`HTTP ${response.status} for ${request.theme}/${request.type}/page-${request.page}`);
    failure.details = { observedAt, url, httpStatus: response.status, payload };
    throw failure;
  }
  try { validatePayload(payload, request); } catch (error) {
    const failure = new Error(`Invalid payload for ${request.theme}/${request.type}/page-${request.page}: ${error.message}`);
    failure.details = { observedAt, url, httpStatus: response.status, validationError: error.message, payload };
    throw failure;
  }
  return { observedAt, url, httpStatus: response.status, payload };
}

function writeAudit(root, runDirectory) {
  const runDir = path.resolve(root, runDirectory);
  const normalized = JSON.parse(fs.readFileSync(path.join(runDir, 'items.json'), 'utf8'));
  const items = auditItems(normalized.items);
  const counts = {
    total: items.length,
    candidates: items.filter(item => item.audit.auditedClassification === 'candidate').length,
    rejectedThemeMismatch: items.filter(item => item.audit.auditedClassification === 'rejected_theme_mismatch').length,
    rejectedNoSignalKeyword: items.filter(item => item.audit.auditedClassification === 'rejected_no_signal_keyword').length,
    candidateDistinctRootStoryCount: new Set(items.filter(item => item.audit.auditedClassification === 'candidate').map(item => item.rootStoryId)).size,
    candidateDistinctAuthorCount: new Set(items.filter(item => item.audit.auditedClassification === 'candidate').map(item => item.author).filter(Boolean)).size
  };
  writeJson(path.join(runDir, 'audited-items.json'), { schemaVersion: '2.0-amendment', derivedAt: new Date().toISOString(), source: path.relative(root, path.join(runDir, 'items.json')), preregistered: false, counts, items });
  return counts;
}

async function main() {
  const root = path.join(__dirname, '..');
  const outputDir = path.join(root, 'research', 'hn_capture');
  if (process.argv[2] === '--audit-latest') {
    const latest = JSON.parse(fs.readFileSync(path.join(outputDir, 'latest.json'), 'utf8'));
    const counts = writeAudit(root, latest.runDirectory);
    console.log(`audited: ${counts.candidates} candidates; ${counts.rejectedThemeMismatch} theme mismatches; ${counts.rejectedNoSignalKeyword} no-signal rejections`);
    return;
  }
  const runStartedAt = new Date().toISOString();
  const runId = runStartedAt.replace(/[:.]/g, '-');
  const runDir = path.join(outputDir, 'runs', runId);
  const rawDir = path.join(runDir, 'raw');
  if (fs.existsSync(runDir)) throw new Error(`Refusing to overwrite existing run directory: ${runDir}`);
  const effectiveEnd = effectiveEndEpoch(runStartedAt);
  const itemMap = new Map();
  const requests = [];
  const failures = [];
  let rawHitCount = 0;

  for (const theme of THEMES) {
    for (const type of TYPES) {
      let pageCount = 1;
      for (let page = 0; page < pageCount && page < MAX_PAGES; page += 1) {
        const request = { theme, type, page, effectiveEnd };
        const rawFile = path.join(rawDir, `${theme.toLowerCase()}-${type}-p${page}.json`);
        try {
          const result = await fetchPage(request);
          writeJson(rawFile, { request: { ...request, url: result.url }, response: { observedAt: result.observedAt, httpStatus: result.httpStatus, payload: result.payload } });
          const hits = Array.isArray(result.payload.hits) ? result.payload.hits : [];
          rawHitCount += hits.length;
          for (const hit of hits) mergeHit(itemMap, hit, { theme, type, page }, result.observedAt);
          pageCount = pagesToFetch(result.payload);
          requests.push({ theme, type, page, url: result.url, observedAt: result.observedAt, httpStatus: result.httpStatus, hitCount: hits.length, nbHits: result.payload.nbHits, nbPages: result.payload.nbPages, truncated: Number(result.payload.nbPages) > MAX_PAGES });
        } catch (error) {
          const failure = { theme, type, page, message: error.message, ...(error.details || {}) };
          failures.push(failure);
          requests.push({ ...failure, failed: true });
          writeJson(rawFile, { request, failure });
          break;
        }
      }
    }
  }

  const ranked = stableRank([...itemMap.values()]);
  const candidates = ranked.filter(item => item.classification === 'candidate');
  const diversifiedCandidates = diversify(candidates);
  const counts = summarize(ranked, rawHitCount);
  const status = failures.length ? 'failed' : (ranked.length ? 'ok' : 'zero_data');
  const finishedAt = new Date().toISOString();
  writeJson(path.join(runDir, 'items.json'), {
    schemaVersion: '1.0', runStartedAt, finishedAt,
    warning: 'Untrusted public discussion corpus. Rankings are unverified discovery signals and current engagement is not historical heat.',
    counts,
    diversifiedCandidateOrder: diversifiedCandidates.map(item => item.objectID),
    items: ranked
  });
  writeJson(path.join(runDir, 'run.json'), {
    schemaVersion: '1.0', status, runStartedAt, finishedAt,
    requestedWindow: { startInclusive: START_ISO, endExclusive: END_ISO },
    effectiveWindow: { startInclusive: START_ISO, endExclusive: new Date(effectiveEnd * 1000).toISOString(), rule: 'min(requested endExclusive, runStartedAt)' },
    coverage: { themes: THEMES, types: TYPES, maxPagesPerQueryType: MAX_PAGES, hitsPerPage: HITS_PER_PAGE, explicitlyTruncated: requests.some(request => request.truncated === true) },
    counts, requests, failures,
    output: { runDirectory: path.relative(root, runDir), rawDirectory: path.relative(root, rawDir), items: path.relative(root, path.join(runDir, 'items.json')) }
  });
  writeAudit(root, path.relative(root, runDir));
  writeJson(path.join(outputDir, 'latest.json'), { runId, runDirectory: path.relative(root, runDir), status, finishedAt });
  console.log(`${status}: ${counts.uniqueItemCount} unique items; ${counts.candidateCount} candidates; ${counts.rejectedCount} rejections; ${failures.length} failed requests`);
  if (failures.length) process.exitCode = 1;
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });

module.exports = { auditItems, buildUrl, diversify, effectiveEndEpoch, mergeHit, pagesToFetch, scoreText, stableRank, summarize, validatePayload };
