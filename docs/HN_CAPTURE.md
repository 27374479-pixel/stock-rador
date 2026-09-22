# Hacker News public discussion capture

This is a fixed, reproducible discovery pass over the public Hacker News Algolia API. It finds falsifiable physical-supply claims for later human verification. It does not verify claims, infer historical attention, map claims to A-share companies, or produce investment recommendations.

## Frozen protocol

The protocol was written before the first live request.

- Requested time window: `2026-06-01T00:00:00.000Z` inclusive through `2026-09-22T00:00:00.000Z` exclusive. The effective upper bound is `min(endExclusive, runStartedAt)`, preventing future-dated records when collection occurs before the requested calendar bound. Both bounds are recorded in `run.json` and the effective epoch bound is sent to the API.
- Queries: `transformer`, `DRAM`, `MLCC`, and `cooling`, each searched separately.
- Item types: `story` and `comment`, each searched separately using the API `tags` filter.
- Endpoint: `https://hn.algolia.com/api/v1/search_by_date`.
- Coverage ceiling: pages 0 and 1 only, with `hitsPerPage=100`, for each query/type pair. A pair is explicitly marked truncated when another page may exist. This is bounded discovery, not a census of HN.
- Deduplication: global by Algolia `objectID`. A retained item records every query/type request that matched it.
- Timing: item `created_at`/`created_at_i` is the source timestamp. `observedAt` is the live collection time. Story points and comment counts are current API snapshots observed then, not historical heat at publication.
- Text: story title and story/comment text are retained from the public API response. Normalized titles are bounded to 500 characters and item text to 4,000 characters. Raw public responses are saved per request page.
- Discovery ranking: case-insensitive, transparent keyword families only: shortage (`shortage`, `scarcity`, `sold out`, `allocation`, `constrained`, `supply crunch`), price (`price increase`, `price hike`, `pricing`, `cost increase`, `more expensive`), orders (`order`, `orders`, `backlog`, `booked`, `contract`), and lead time (`lead time`, `lead times`, `delivery time`, `wait time`, `weeks`, `months`). One point is awarded per matched family. Items scoring zero are retained as rejections. Stable order is score descending, source time ascending, then `objectID`. Summary counts also report distinct root stories and authors; candidate selection is greedily diversified by root story and then author so repeated comments in one viral thread do not imply independent observations.
- Interpretation: ranking only identifies text worth reading. It does not establish truth, economics, novelty, investability, company exposure, or an A-share mapping. API text is untrusted corpus data and is never interpreted as an instruction to the collector.
- Access: public API only, without login, proxy bypass, or paywall circumvention.

## Post-run quality amendment (v2)

This amendment was added after inspecting the first run and is not claimed as preregistered. Algolia's broad query matching returned obvious substring and semantic false positives: `DRAM` matched “drama,” `MLCC` matched unrelated strings, and `transformer` commonly referred to AI models. The immutable v1 raw and normalized artifacts remain unchanged.

The v2 offline audit requires a strict local theme match independent of the signal-keyword score. `DRAM` requires a standalone physical-memory term; `MLCC` requires `MLCC`/`MLCCs` or “multilayer ceramic capacitor”; `transformer` requires a transformer term plus power-grid/manufacturing context; `cooling` requires a cooling term plus data-center/thermal equipment context. A v1 keyword candidate failing this theme gate is retained with `rejected_theme_mismatch`. A relevant item with no signal family remains `rejected_no_signal_keyword`.

Future fetches also fail on a missing/non-array `hits` payload and validate every hit's `objectID`, requested type tag, source timestamp, epoch consistency, and effective-window membership. The first run showed `nbHits` moving between pages because the remote index is live; `run.json` therefore records a per-request observation only and must not be read as completeness or historical attention.

The API is a live index. Deleted, edited, missing, or incompletely indexed HN material can create coverage gaps. `search_by_date` ordering and the two-page cap mean retrieval is explicitly truncated where `nbPages > 2` or the run stops before all reported hits can be fetched.

## Run

```powershell
node scripts/collect-hn.cjs
node scripts/collect-hn.cjs --audit-latest
node --test tests/hn-collector.test.js
```

Outputs are written below `research/hn_capture/`:

- `protocol.json`: machine-readable copy of the frozen protocol.
- `runs/<runId>/raw/*.json`: exact parsed API payload plus request URL, query metadata, HTTP status, and observation time for each requested page.
- `runs/<runId>/items.json`: globally deduplicated items, their match provenance, current engagement snapshot, score details, and candidate/rejection classification.
- `runs/<runId>/audited-items.json`: v2 strict-theme audit produced offline from the immutable normalized items.
- `runs/<runId>/manual-review.json`: human review of every v2 keyword candidate, including false-positive and same-thread reasons.
- `runs/<runId>/quality-audit.json`: post-run data-quality findings such as live-index count movement.
- `runs/<runId>/run.json`: run status, request outcomes, coverage and truncation metadata, and all candidate/rejection counts.
- `latest.json`: a replaceable pointer to the latest immutable run directory.

A completed request set with no hits writes `status: "zero_data"` and exits successfully. Any request or parse failure writes `status: "failed"`, preserves request failure metadata, and exits nonzero. A normal nonempty run writes `status: "ok"`. A run refuses to reuse an existing run directory.
