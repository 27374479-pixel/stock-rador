# Source Upgrade Experiment — Findings and Next Design

## Question

Does replacing the old concentrated discovery layer with a broader, research-first, cross-checked source system materially improve A-share selection frequency and 60-trading-day hit rate?

## Source registry v2

Implemented in `config/source-registry-v2.json`.

The new registry is balanced across:

- sell-side research;
- issuer filings and IR;
- official macro/policy;
- industry physical data;
- high-quality news cross-check;
- consumer/channel and alternative operating data.

Mandatory weekly coverage families:

- technology hardware;
- power/energy;
- resources/materials;
- industrial machinery;
- transport/shipping;
- consumer;
- healthcare;
- agriculture;
- auto;
- financial/market structure;
- property;
- chemicals.

Research-report mirrors are transport only. Independence is assigned to the original broker/research house.

## Experiment 1 — naive expansion

2025 event-time old pool:

- 7 selections;
- 6/7 positive 60d;
- 6/7 beat CSI300 = 85.7%.

Adding two non-tech candidates discovered only after source broadening:

- Midea;
- Sany Heavy Industry.

Expanded pool:

- 9 selections;
- 8/9 positive 60d = 88.9%;
- only 6/9 beat CSI300 = 66.7%.

Conclusion: wider discovery raises recall but can dilute relative-return precision.

## Experiment 2 — retrospective research-source quorum

Experimental quorum:

1. physical/official/specialist evidence for the state change;
2. selected-company first-party filing/IR evidence;
3. independent sell-side/research report with forward earnings/valuation/expectation analysis.

2025 expanded pool:

- quorum pass: 6/6 beat CSI300;
- quorum fail: 0/3 beat CSI300.

This looked very strong, but it was a retrospective small-sample diagnostic and therefore could not be accepted as a rule.

## Experiment 3 — 2026 cross-window check

Nearly all six 2026H1 weekly selections already satisfied the same high-quality three-source structure.

Result:

- 3/6 positive;
- 3/6 beat CSI300.

Pooling 2025 event-time + 2026H1:

- no quorum filter: 9/13 excess wins = 69.2%;
- source-quorum subset: 9/12 excess wins = 75.0%.

The uplift is small and fragile. High-quality sources did not solve the 2026 failures.

## Experiment 4 — held-out 2023 source-quality test

To reduce retrospective bias, 2023Q2-Q4 source packs and memos were inspected without reading outcomes.

Eight selected historical hypotheses were classified first and committed:

`4f782b29871e46cb4cd8dc8ea58fd481d9b6a5dd`

Only after the classification commit were 2023 outcomes read.

Results:

### Quorum pass

4 selections:

- 1/4 positive 60d;
- 1/4 excess win = 25%;
- median net return -12.96%;
- median excess -7.25%.

### Quorum fail

4 selections:

- 1/4 positive 60d;
- 2/4 excess wins = 50%;
- median net return -9.60%;
- median excess -4.06%.

The source-quality hypothesis did not replicate. One-sided Fisher exact p-value for quorum improving excess-win probability was ~0.929.

## Main conclusion

**Better sources do not directly create a large robust increase in 60d hit rate.**

They are still strategically important because they improve:

- event recall;
- sector breadth;
- company mapping accuracy;
- earnings-path quantification;
- valuation/consensus measurement;
- contradiction discovery;
- the ability to detect when a thesis is already consensus.

But the dominant selection failures remain:

1. price absorption / entering too late;
2. company earnings conversion not yet mature;
3. broad-market opportunity cost;
4. event half-life mismatch;
5. stale repeat re-underwrite;
6. uncalibrated Primary labels.

Therefore source quality is a **research-input quality feature**, not a standalone promotion rule.

## Next paired experiment

Freeze downstream selection logic and compare four arms on an untouched window:

### A — old discovery

Old concentrated source families.

### B — source registry v2

Balanced weekly source coverage, no change to downstream gates.

Primary question:
Does B increase independent opportunity weeks without destroying excess-win rate?

### C — source registry v2 + evidence-quality feature

Same as B, plus source-quorum as a confidence feature only.

Primary question:
Does evidence completeness improve company mapping and remove false expressions without becoming an over-restrictive buy gate?

### D — source registry v2 + separately validated timing improvements

Same broad high-quality sources plus:

- stronger price-absorption audit;
- company-realization state;
- benchmark opportunity-cost test;
- event half-life;
- fresh-state requirement for repeat cluster+ticker re-underwrite.

Primary question:
Can D improve both frequency and 60d excess-win rate?

## Acceptance metrics

Track simultaneously:

- independent opportunity weeks / 52;
- sector-family entropy and missing-family count;
- 60d positive rate;
- 60d CSI300 excess-win rate;
- median 60d net return;
- median 60d excess;
- median/P90 drawdown;
- Research -> actionable conversion;
- repeat-thesis failure rate;
- source-quorum completeness.

Do not adopt a rule based only on already-revealed 2024-2026 cases.
