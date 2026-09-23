# Stock Rador v1.0 discovery contract

## Why discovery is a separate problem

A research skill can have excellent verification and stock-selection discipline and still
fail if it never sees the important economic change.

V1.3 therefore evaluates four separate layers:

1. source coverage;
2. event discovery / deduplication;
3. hypothesis quality;
4. stock-selection quality.

Do not infer discovery quality from the returns of the few ideas that survived screening.

## Source lanes

A run declares its actual coverage before research. Lanes are economic information roles,
not favored websites:

- official_primary;
- company_first_party;
- physical_industry;
- reputable_news;
- specialist_trade;
- community_weak_signal.

A run may add lanes when needed. Missing access is allowed only when explicitly recorded.
The manifest freezes a minimum number of covered lanes.

Different copies of the same underlying claim share one `originGroup`. A syndicated
headline does not create independent evidence.

## Event clustering

The AI converts source items into economic state-change clusters.

A cluster answers:
- what changed;
- when it first became available;
- which independent origins support it;
- whether it is new, a continuation, a repeat or uncertain;
- which value chain may be affected;
- what contradictory search is still required.

Code verifies membership, timestamps and independent origin groups. AI supplies the semantic
meaning.

Screening operates on **event clusters**, not raw headlines. Every frozen event cluster
gets exactly one decision.

## Novelty

Novelty is a discovery aid, not alpha proof.

Repeated coverage can mean:
- important new information;
- stale narrative amplification;
- one source copied many times.

The AI should compare an event with prior state and ask what information actually changed.
Do not promote an event merely because its mention count rose.

## Discovery funnel

For every run preserve:

source items -> unique origin groups -> event clusters -> promoted hypotheses -> researched
memos -> High-priority hypotheses -> Research/High-priority selections.

A small final list is acceptable. An invisible denominator is not.

## Missed-opportunity audit

After outcomes exist, create an independent missed-opportunity audit using a case-generation
rule frozen **before** reveal.

The audit classifies each hindsight case into one dominant stage:

- detected;
- source_universe_miss;
- retrieval_miss;
- dedup_clustering_miss;
- triage_miss;
- verification_miss;
- value_chain_mapping_miss;
- selection_gate_miss;
- execution_filtered;
- unforeseeable;
- not_valid_ex_ante_opportunity.

Only cases with genuine pre-cutoff causal evidence count as `detectableExAnte`.

`diagnosticRecall = detected / detectableExAnte`

This number is explicitly a hindsight diagnostic, not an alpha statistic.

## Anti-overfitting

The same period's missed cases may explain failure modes but may not directly tune the
reported Skill version.

Allowed:
- identify a general missing source lane;
- identify that derivative news was mistaken for independent confirmation;
- identify that a value-chain relation class was systematically omitted.

Not allowed:
- add a query for the exact winning company;
- add the exact winning sector to a whitelist;
- change thresholds to capture named missed winners;
- report improved recall on the same cases used to design the change.

Any rule change must be tested on a new holdout or future forward sample.

## Research grounding

This design is consistent with financial NLP research that treats structured events and
entity relations as more useful than raw sentiment alone. The implementation here remains
deliberately simpler: AI performs semantic extraction/reasoning, while deterministic code
audits provenance, independence, coverage and replay discipline.
