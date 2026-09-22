# 2025Q2 HN v0.3 holdout postmortem

## Run identity

- Run: `2025q2-hn-v0.3-001`
- Skill: `0.3.0`
- Discovery window: 2025-04-01 through 2025-06-30
- Discovery source: sector-agnostic HN change-signal search
- Raw hits: 2,265
- Unique items: 2,220
- Review items: 87
- Frozen hypotheses: 2
- Primary actionable hypotheses: 1
- Benchmark: CSI 300
- Standard horizons: 20 / 60 / 120 trading days
- One-way cost: 0.1%

This remains a historical replay. Model-memory leakage is explicitly uncontrolled, so the
result is evidence about the process contract, not proof of deployable alpha.

## Frozen states

### High-priority research
- `h-eu-flex-storage-2025q2`
- A-share mapping: 阳光电源 (300274.SZ)
- actionableAt: 2025-05-28 23:59:59 +08:00
- next trading-day entry: 2025-05-29
- pre-registered realization: 20 / 60 / 120 trading days; 60-day base

### Research only
- `h-grid-equipment-backlog-2025q2`
- A-share mapping: 思源电气 (002028.SZ)
- actionableAt: null
- pre-registered realization: 60 / 120 / 240 trading days; 120-day base

The second hypothesis was deliberately excluded from the primary signal metric because the
company-specific expectation gap was not sufficiently closed before the reveal.

## Revealed outcomes

### Primary signal: 阳光电源

- 20d net return: +7.20%
- 20d excess vs CSI 300: +4.38%
- 60d net return: +56.36%
- 60d excess: +44.64%
- 120d net return: +188.66%
- 120d excess: +172.62%
- 60d close-path max drawdown: -6.00%
- 120d close-path max drawdown: -18.38%

The pre-registered thesis-base outcome is the 60d result, not the best ex-post horizon.

### Research diagnostic: 思源电气

- 20d excess: -1.26%
- 60d excess: +5.49%
- 120d excess: +73.03%
- 240d excess: +141.79%

These returns are diagnostics only. They must not be promoted into the v0.3 primary metric
after the fact.

## What v0.3 improved

### 1. Research and actionability are now separated

V0.2 incorrectly pooled `Research` and `High-priority research`. V0.3's primary metric
contains only frozen High-priority candidates. This worked as intended.

### 2. Entry timing is tied to evidence readiness

The Q2 candidates enter from the first trading day after their frozen
`actionableAt` / `researchReadyAt`, instead of an arbitrary quarter-end date.

### 3. Thesis horizon is pre-registered

The 60-day primary result for 阳光电源 was chosen before reveal from the causal business lag.
The very strong 120-day return cannot be substituted as the primary metric simply because
it is larger.

### 4. Implementation code is frozen

The lock includes hashes for the collector, evaluator, price fetcher and lock scripts, in
addition to the skill, source pack, screening and memos. A later code change cannot silently
reinterpret an old frozen run.

## Why this result is still not enough

The strong result raises, rather than lowers, the burden of proof.

### A. Model-memory leakage remains uncontrolled

A current model may already encode knowledge about 2025 sector winners, company outcomes or
important events. Historical web cutoff discipline alone does not remove this channel.

### B. CSI 300 is too weak a counterfactual for sector-heavy hypotheses

A storage/grid idea can beat the broad market because its whole industry rallies. That does
not prove the skill selected the right company or correctly identified an expectation gap.

### C. Rejection audit is not granular enough

The Q2 screening freezes all rejected item IDs and dominant rejection classes, but it does
not preserve a reason code for every reviewed item. This leaves less auditability than the
v0.3 skill contract intends.

### D. Sample size is tiny

One primary signal cannot establish a hit rate. The Research diagnostic also performed
strongly later, which means the High-priority gate may be conservative, lucky, or both.
More holdouts are required before changing the threshold.

## V0.4 evaluation hardening

These changes are general evaluation improvements, not rules derived from the winning sector.

### 1. Add matched counterfactuals before reveal

Every actionable company must freeze:
- a broad benchmark;
- a sector/industry benchmark where available;
- 2-5 near-peer or near-miss companies selected using point-in-time exposure/industry rules;
- why the chosen company should outperform those controls.

Primary evaluation should report excess return against both the broad benchmark and the
matched-control basket.

### 2. Freeze per-item screening reasons

Every reviewed discovery item must receive a frozen reason code, including rejected items.
Aggregate summaries are not enough.

### 3. Freeze near-miss company mappings

For every hypothesis, preserve plausible companies that were considered but rejected because
of weak exposure, valuation, expectations, execution or governance. This creates a
counterfactual for the stock-selection stage.

### 4. Add ranking metrics

A useful skill should not merely find a rising sector. Within a frozen hypothesis, the chosen
company should rank favorably versus the frozen matched candidates at the pre-registered
horizon.

### 5. Add model-memory stress tests

Where feasible:
- hide ticker/name during early event classification;
- use mechanically selected historical windows;
- include obscure/noisy periods, not only famous market episodes;
- run the same source pack through identity-masked ablations;
- keep a prospective forward set as the final standard.

## Rules that must NOT be added

Do not add:
- prefer storage because this run won;
- prefer power equipment because the Research diagnostic later won;
- use 120 days because the return was larger;
- lower the High-priority gate because 思源电气 later performed well;
- any PE/growth threshold reverse-engineered from these two outcomes.

## Status

V0.3 passes the process test on this holdout: its actionability separation, timing contract
and pre-registered horizon behaved as intended.

It does **not** yet establish alpha. The next version should be judged on new historical
windows using matched controls and, ultimately, forward-frozen observations.
