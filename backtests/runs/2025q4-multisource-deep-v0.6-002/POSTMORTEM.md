# 2025Q4 multi-source deep-research postmortem

## Run lineage

- Discovery baseline: `2025q4-hn-v0.6-001`
- Multi-source discovery: `2025q4-multisource-v0.6-001`
- Deep research lock: `2025q4-multisource-deep-v0.6-001`
- Software-only partial-horizon replay: `2025q4-multisource-deep-v0.6-002`
- Skill: `0.6.0`
- Evaluator: `0.6.1-partial-horizons`
- Validation class: `exploratory_contaminated`

The 002 replay changed only evaluation software. It reuses the exact frozen memo files from
001, whose hashes are preserved in the new lock.

## Why the software replay was necessary

The original reveal fetched prices successfully but aborted because the latest 240-trading-day
horizon had not matured yet.

That is a software/evaluation maturity issue, not a research failure. A valid run should:
- report matured horizons;
- mark later horizons as pending;
- fail closed only when a horizon should be mature but required price/control data are
  missing.

V0.6.1 implements this without mutating the implementation file referenced by older locks.

## Multi-source discovery result

The Q4 HN-only baseline produced six hypotheses. Multi-source discovery added three distinct
events that were not isolated as hypotheses by the HN baseline:

1. realized data-center electrification equipment orders;
2. worsening critical-material / semiconductor-input shortages;
3. China solar-installation and grid-investment reacceleration.

Deep research deliberately did **not** force all three into stock selections.

### Data-center electrification orders

- `hypothesisState`: High-priority hypothesis
- `selectionState`: Research selection
- selected diagnostic: 伊戈尔 (002922.SZ)
- controls: 金盘科技 (688676.SH), 思源电气 (002028.SZ)
- selection edge at cutoff: mixed
- expectation-burden conclusion: unresolved
- pre-registered realization: 60 / 120 / 240 trading days, 120-day base

The cutoff evidence supported a real industry event, but the companies expressed different
advantages:
- 伊戈尔: explicit data-center order acceleration and overseas-capacity ramp;
- 金盘科技: stronger proven AIDC revenue/order base but higher valuation;
- 思源电气: stronger broad earnings/order quality with less direct AIDC purity.

The Skill correctly left the stock at Research rather than promoting theme purity into a
primary signal.

### Critical-material shortage

- `hypothesisState`: High-priority hypothesis
- `selectionState`: No selection

The physical shortage was verified, but obvious A-share germanium names did not show clean
profit conversion. Strong commodity scarcity was therefore not treated as sufficient for a
stock signal.

### China solar/grid reacceleration

- `hypothesisState`: Research hypothesis
- `selectionState`: No selection

Official deployment/grid-investment data were strong, but listed-company profit transmission
was heterogeneous. Installation volume was not treated as sector alpha.

## Revealed diagnostic: 伊戈尔

Entry:
- researchReadyAt: 2025-12-31 23:59:59 +08:00
- next trading-day entry: 2026-01-05
- adjusted open: 30.682
- this remained a **Research selection**, excluded from all primary-signal metrics.

### 20 trading days

- net return: +26.11%
- CSI 300: +0.96%
- broad excess: +25.16pp
- matched-control basket: +10.73%
- matched-control excess: +15.38pp
- best control: 思源电气 +19.39%
- excess vs best control: +6.72pp
- rank: 1 / 3
- max close-path drawdown: -8.79%

At the short horizon the research selection was excellent.

### 60 trading days

- net return: +10.37%
- CSI 300: -4.74%
- broad excess: +15.11pp
- matched-control basket: +4.07%
- matched-control excess: +6.30pp
- best control: 思源电气 +29.38%
- excess vs best control: -19.01pp
- rank: 2 / 3
- max close-path drawdown: -29.43%

The selected stock still beat the broad market and average control basket, but it no longer
beat the strongest frozen alternative.

### 120 trading days — pre-registered base horizon

- net return: +2.40%
- CSI 300: +3.87%
- broad excess: -1.47pp
- matched-control basket: +2.74%
- matched-control excess: -0.35pp
- best control: 思源电气 +12.52%
- excess vs best control: -10.12pp
- rank: 2 / 3
- max close-path drawdown: -38.44%

This is the primary diagnostic horizon because it was frozen before reveal.

The company-selection edge was **not durable through the thesis horizon**.

### 240 trading days

- status: pending
- available trading days at evaluation: 176

No inference is allowed yet.

## Interpretation

The result supports several parts of the architecture simultaneously:

### Discovery added useful information

The multi-source system found an economically real data-center electrical-equipment order
event that the HN baseline did not isolate as a separate hypothesis.

### Opportunity quality and stock-selection quality remain different

The event was useful even though no High-priority stock existed at the cutoff.

### Research selection was the correct state

Promoting 伊戈尔 to High-priority because of its 20-day return would be hindsight. The
pre-reveal comparison was mixed, and the 120-day result later confirmed that a durable
cross-sectional edge was not established.

### Best-control comparison matters

At 60 and 120 days, 思源电气 outperformed 伊戈尔. A broad-index-only evaluator would have
overstated the quality of the 60-day stock-selection result.

### Do not shorten the horizon after reveal

The 20-day result was strongest. That does not justify redefining the thesis horizon from
120 days to 20 days.

A possible general research question for a **future** version is whether event-repricing
horizon and fundamental-realization horizon should be pre-registered separately. This run
alone is not enough evidence to change the Skill.

## V0.6.1 evaluator lesson

Forward and recent historical runs can contain horizons that have not matured.

The evaluator should:
- compute every matured horizon;
- retain future horizons as `pending`;
- report `pendingBaseCount` when a primary base horizon itself has not matured;
- still fail closed when a mature horizon is missing required stock/control data.

This is a general infrastructure fix and does not depend on any sector or winner.

## What must not be learned from this run

Do not add rules such as:
- prefer 伊戈尔 for data centers;
- prefer 思源 because it later won the 120-day comparison;
- use 20-day horizons for data-center events;
- reject direct AIDC exposure;
- prefer broad grid equipment;
- mechanically prefer lower PE.

Those would all be outcome-driven overfitting.

## Current conclusion

The Q4 experiment is a constructive result:

- multi-source discovery increased event coverage;
- two of the three newly distinct events reached High-priority opportunity status;
- none justified a High-priority stock selection;
- the one Research selection showed strong early repricing but no durable 120-day edge;
- matched controls and pre-registered horizons prevented a false success claim.

This is evidence that the Skill is becoming more selective without becoming blind to new
opportunities.
