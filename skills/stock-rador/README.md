# Stock Rador Skill versions

The versioned files are immutable research contracts. Do not edit an old version after it
has been used by a frozen backtest. Create a new version instead.

## Current version: 0.5.0

- [SKILL.md](versions/0.5.0/SKILL.md)
- [EVALS.md](versions/0.5.0/EVALS.md)
- [opportunity-memo.template.json](versions/0.5.0/opportunity-memo.template.json)
- [backtest-manifest.template.json](versions/0.5.0/backtest-manifest.template.json)

V0.5 separates:
- opportunity/hypothesis quality;
- stock-selection quality.

A strong industry thesis is allowed to produce no actionable stock. High-priority company
selection requires a pre-reveal cross-sectional edge versus frozen peers/near-misses.

## Earlier versions

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
