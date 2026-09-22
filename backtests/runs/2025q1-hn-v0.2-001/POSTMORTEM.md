# 2025Q1 HN v0.2 backtest postmortem

## Run identity

- Run: `2025q1-hn-v0.2-001`
- Skill: `0.2.0`
- Discovery window: 2025-01-01 through 2025-03-31
- Discovery: sector-agnostic HN change-signal search
- Raw hits: 2,662
- Unique items: 2,598
- Review items: 80
- Frozen selections: 3 A-share tickers across 2 hypotheses
- Outcome entry: next trading day open after the frozen memo cutoff
- Outcome horizons: 20 and 60 trading days
- Benchmark: CSI 300
- One-way cost: 0.1%

The run is a historical replay with explicitly recorded model-memory contamination risk. It
is useful for falsification and process improvement, but it is not final alpha validation.

## Frozen candidates

The skill promoted two hypotheses to `Research`, not `High-priority research`:

- AI optical demand persistence: 中际旭创 (300308.SZ), 新易盛 (300502.SZ)
- European storage/flexibility: 阳光电源 (300274.SZ)

The remaining 75 review items were rejected before post-cutoff prices were opened.

## Revealed price outcomes

### 20 trading days

All three candidates underperformed the CSI 300.

- 中际旭创: net -16.58%, excess -13.55%, close-path max drawdown -28.38%
- 新易盛: net -8.62%, excess -5.60%, close-path max drawdown -29.85%
- 阳光电源: net -12.47%, excess -9.45%, close-path max drawdown -24.26%
- Portfolio mean excess return: -9.54%
- Excess hit rate: 0/3

### 60 trading days

The two optical names strongly outperformed; the storage name did not.

- 中际旭创: net +48.43%, excess +47.32%
- 新易盛: net +82.16%, excess +81.05%
- 阳光电源: net -1.09%, excess -2.20%
- Portfolio mean excess return: +42.05%
- Excess hit rate: 2/3

## What the result does and does not say

The run does **not** prove that v0.2 has alpha. There are only three selections, the
historical model-memory channel remains uncontrolled, and the two winning selections share
one industry hypothesis.

The run does show that the evaluation contract is currently mixing several different
questions:

1. Can the skill discover a real economic change?
2. Can it map the change to companies with material exposure?
3. Can it identify an expectation/valuation gap?
4. Is the candidate actionable enough to be treated as an investment signal?
5. What is the appropriate realization horizon for that causal chain?

V0.2 answered (1)-(3) well enough to mark the cases `Research`, but the manifest treated
`Research` as if it were an actionable signal. That is too permissive.

## Generalizable failure classes

### A. Research state was incorrectly treated as trade state

A candidate that still has an unresolved expectation-gap or risk/reward question should
not enter the primary return metric merely because it is worth further research.

**Change for v0.3:** separate discovery/research metrics from actionable-signal metrics.
The primary portfolio return metric should use only candidates whose frozen state is
explicitly actionable/high-priority. A window with zero such candidates is a valid
no-signal outcome.

### B. Outcome horizon was disconnected from thesis horizon

Both frozen hypotheses were described as quarter-scale causal chains, yet 20-day return
was treated as an equal verdict. The optical hypothesis lost sharply at 20 days and then
performed strongly by 60 days.

This does not justify ignoring the 20-day loss. It shows the skill must pre-register the
expected thesis realization window before outcomes are known.

**Change for v0.3:** every memo must declare an `expectedRealization` object containing
earliest, base and latest trading-day horizons. The evaluator reports all standard
horizons, but the memo's pre-registered base horizon is the thesis-aligned metric.

### C. One window-end cutoff hides decision timing

The Q1 run froze every memo at 2025-03-31 even though the evidence chain became usable at
different dates. A stock radar should be evaluated at the earliest date on which its
frozen evidence gates are actually satisfied.

**Change for v0.3:** separate `researchCutoffAt` from `actionableAt`. `actionableAt`
must equal the latest availability time among evidence required for the actionable state.
Entry is based on `actionableAt`, not on an arbitrary quarter end.

### D. Discovery precision is low but auditable

The generic discovery stage produced 80 review items and only two serious hypotheses. This
is acceptable for a broad first pass, but it is expensive and dominated by semantic
keyword collisions.

**Change for v0.3:** keep sector-agnostic recall, but add an AI semantic triage layer with
a frozen rejection reason taxonomy. Do not restore sector keywords.

### E. Hypothesis concentration must be visible

Two of three selections were expressions of one optical hypothesis. Counting them as
three fully independent successes would overstate evidence.

**Change for v0.3:** aggregate results both by ticker and by hypothesis. Primary hit-rate
statistics must include a hypothesis-level view so multiple beneficiaries of one thesis do
not inflate sample size.

## Rules that must NOT be added

Do not add:
- prefer optical modules;
- prefer AI infrastructure;
- avoid storage;
- use 60 days because it won this sample;
- buy low-PE high-growth names;
- any threshold reverse-engineered from these three returns.

Those would be direct outcome fitting.

## Status

V0.2 should now be treated as a development run. The next skill version must be evaluated
on a different frozen historical window before any conclusions are drawn about improvement.
