# Stock Rador Skill versions

The versioned files are immutable research contracts. Do not edit an old version after it
has been used by a frozen backtest. Create a new version instead.

## Current version: 0.8.0

- [SKILL.md](versions/0.8.0/SKILL.md)
- [EVALS.md](versions/0.8.0/EVALS.md)
- [DISCOVERY.md](versions/0.8.0/DISCOVERY.md)
- [opportunity-memo.template.json](versions/0.8.0/opportunity-memo.template.json)
- [backtest-manifest.template.json](versions/0.8.0/backtest-manifest.template.json)
- [discovery-source-pack.template.json](versions/0.8.0/discovery-source-pack.template.json)
- [missed-opportunity-audit.template.json](versions/0.8.0/missed-opportunity-audit.template.json)

V0.8 keeps the v0.7 expectation-reset discipline and adds two independent High-priority gates:
- **Opportunity Timing Gate** — pre-cutoff fundamental/revision persistence plus deterministic
  20/60-day opportunity-basket relative-return breadth;
- **Cross-sectional Asymmetry Gate** — select the acceptable-quality company with the best
  unreflected revision headroom / valuation / catalyst / downside trade-off, rather than
  mechanically selecting the highest-quality company.

Neutral/adverse timing or mixed asymmetry may remain Research; they cannot be silently
promoted to High-priority.

## Previous current contract: 0.7.0

- [SKILL.md](versions/0.7.0/SKILL.md)
- [EVALS.md](versions/0.7.0/EVALS.md)
- [DISCOVERY.md](versions/0.7.0/DISCOVERY.md)
- [opportunity-memo.template.json](versions/0.7.0/opportunity-memo.template.json)
- [backtest-manifest.template.json](versions/0.7.0/backtest-manifest.template.json)
- [discovery-source-pack.template.json](versions/0.7.0/discovery-source-pack.template.json)
- [missed-opportunity-audit.template.json](versions/0.7.0/missed-opportunity-audit.template.json)

V0.7 keeps all v0.6 discovery and selection controls and adds a strict
**fundamental-acceleration / expectation-reset substitute**. It can only substitute for
missing point-in-time burden measurement when the unresolved reason is measurement-only
and realized fundamentals, peer differentiation, baseline lag and price-absorption checks
are all already strong. It cannot override fully-priced, conflicted, missing-baseline or
high-absorption cases.

## Previous current contract: 0.6.0

- [SKILL.md](versions/0.6.0/SKILL.md)
- [EVALS.md](versions/0.6.0/EVALS.md)
- [DISCOVERY.md](versions/0.6.0/DISCOVERY.md)
- [opportunity-memo.template.json](versions/0.6.0/opportunity-memo.template.json)
- [backtest-manifest.template.json](versions/0.6.0/backtest-manifest.template.json)
- [discovery-source-pack.template.json](versions/0.6.0/discovery-source-pack.template.json)
- [missed-opportunity-audit.template.json](versions/0.6.0/missed-opportunity-audit.template.json)

V0.6 keeps the v0.5 two-gate opportunity/selection discipline and adds a separate discovery layer:
- multi-source lane coverage;
- origin-level de-duplication;
- economic event clustering;
- expectation-burden / breakeven checks;
- pre-registered missed-opportunity auditing.

A strong industry thesis is allowed to produce no actionable stock. High-priority company
selection requires a pre-reveal cross-sectional edge versus frozen peers/near-misses.

### 0.6.1 evaluator

V0.6.1 is an evaluation-software patch, not a new research Skill:
- matured horizons are evaluated normally;
- future/unmatured horizons are marked `pending`;
- a not-yet-mature primary base horizon increments `pendingBaseCount`;
- missing bars on horizons that should already be mature still fail closed.

It exists as versioned files (`backtest-core-v061.cjs`,
`evaluate-skill-run-v061.cjs`) so old frozen locks are not mutated.

## Earlier versions

### 0.5.0
Separated opportunity/hypothesis quality from stock-selection quality, added best-control comparison and forward-frozen source-pack locking.

### 0.4.0
Added per-item screening decisions, matched controls, rank/percentile evaluation, identity
stress tests and historical search-result leakage auditing.

### 0.3.0
Separated Research from High-priority research, added researchReadyAt/actionableAt and
pre-registered thesis realization horizons.

### 0.2.x baseline
Introduced the industry-agnostic causal research contract and point-in-time memo/evaluation
discipline.

The unversioned files under `skills/stock-rador/` are retained for old locked runs and
must not be silently repointed or overwritten.


### Forward recall denominator

V0.6 freezes discovery recall independently from stock-selection alpha.

The first prospective denominator is:
- 4,413 Shanghai/Shenzhen main-board + ChiNext names;
- sourced from official SSE/SZSE stock lists;
- frozen on 2026-09-22 before the 120-trading-day outcome exists;
- identified by ticker digest
  `e24393502faf23ef3233dd4418f571adafebe70514d55afdcec5810e5739aa87`.

The future miss-case generator is also prospective:
- every frozen ticker must appear in the outcome snapshot;
- top 1% benchmark-relative performers are included;
- any name with >=50% excess return is included;
- the two sets are unioned;
- delisted/suspended/missing/execution-blocked names remain in the denominator;
- same-period misses may not tune the reported Skill.

See the run's `audit-universe-lock.json` and `recall-pipeline-lock.json`.
