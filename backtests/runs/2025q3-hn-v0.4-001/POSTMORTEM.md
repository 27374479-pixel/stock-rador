# 2025Q3 HN v0.4 exploratory postmortem

## Status

- Run: `2025q3-hn-v0.4-001`
- Skill: `0.4.0`
- Classification: `exploratory_contaminated`
- Reason: live search result pages exposed post-cutoff snippets before lock.
- Purpose retained: test V0.4 screening, matched-control and cross-sectional evaluation mechanics.
- This run must not be cited as clean historical holdout validation.

## Frozen discovery

- Raw HN hits: 2,467
- Unique items: 2,394
- Reviewed items: 46
- Per-item decisions: 46/46 frozen
- Promoted discovery item: 1
- Primary hypothesis: data-center load growth -> power/grid equipment -> AIDC power equipment
- Selected company: 金盘科技 (688676.SH)
- Frozen controls:
  - 伊戈尔 (002922.SZ), near-miss AIDC transformer supplier
  - 思源电气 (002028.SZ), broad grid-equipment sector proxy
- actionableAt: 2025-09-11 23:59:59 +08:00
- entry: 2025-09-12 next trading-day open
- pre-registered realization: 20 / 60 / 120 trading days; 60-day base

## Why the selected company looked stronger before reveal

The frozen thesis preferred 金盘科技 because its AIDC monetization was already visible and
material at the cutoff:
- H1 data-center revenue exceeded 5亿元;
- data-center revenue growth was about 461% YoY;
- data-center share was about 16% of company revenue;
- AIDC power-module/SST product breadth was expanding;
- overseas AIDC delivery was expected to begin in H2.

The near-miss 伊戈尔 had real AIDC exposure, but H1 profit was down materially and
data-center capacity/products were still ramping.

The sector proxy 思源电气 had much stronger broad grid/overseas fundamentals and a lower
forward valuation, but less direct AIDC-specific revenue evidence.

This made the run a genuine test of whether direct AIDC exposure created stock-selection
alpha beyond sector beta.

## Revealed outcomes

### 20 trading days

- 金盘科技 net: +15.87%
- CSI 300: -0.67%
- broad-index excess: +16.54%
- matched-control basket: +8.13%
- matched-control excess: +7.74%
- rank: 1 / 3

At the short horizon, the selected stock led both controls.

### 60 trading days — pre-registered primary horizon

- 金盘科技 net: +54.06%
- CSI 300: +0.80%
- broad-index excess: +53.26%
- matched-control basket: +57.26%
- matched-control excess: **-3.20%**
- 伊戈尔: +51.35%
- 思源电气: +63.17%
- rank: 2 / 3
- selected close-path max drawdown: -22.05%

Primary classification: **sector_beta_only**.

The industry/value-chain thesis produced a large absolute and broad-index-relative gain, but
the selected company did not beat its frozen matched-control basket at the pre-registered
base horizon.

### 120 trading days

- 金盘科技 net: +57.06%
- CSI 300: +2.50%
- broad-index excess: +54.56%
- matched-control basket: +106.85%
- matched-control excess: **-49.79%**
- 伊戈尔: +77.75%
- 思源电气: +135.95%
- rank: 3 / 3

The longer horizon strengthens the interpretation that broad power-equipment exposure and
company-specific fundamentals mattered more than simply maximizing direct AIDC revenue
growth.

## The key lesson

Without matched controls, this run would have looked spectacular:
- +54% at the frozen 60-day horizon;
- +53 percentage points versus CSI 300.

That would have been a misleading conclusion.

V0.4 demonstrates why a broad-index benchmark is insufficient for thematic research. The
skill appears to have identified a real industry opportunity, but its company-selection
logic over-weighted **direct thematic exposure/growth** relative to:
- valuation already paid for that growth;
- broad earnings quality;
- order-book durability;
- overseas growth quality;
- alternative beneficiaries with less narrative saturation.

This is a general failure class, not a reason to prefer any specific company or sector.

## What V0.5 should change

### 1. Separate hypothesis quality from company selection quality

A real/high-priority industry hypothesis does not imply any single company deserves
High-priority status.

Use two independent gates:
- `hypothesisState`: strength of the event / causal value-chain thesis;
- `selectionState`: strength of the chosen company versus frozen alternatives.

### 2. Require a cross-sectional selection edge

Before a company becomes actionable, compare it against every frozen control across:
- exposure directness and materiality;
- incremental earnings sensitivity;
- expectation saturation / consensus delta;
- valuation and downside asymmetry;
- order/backlog visibility;
- catalyst / realization timing;
- execution / liquidity / governance where relevant.

Do not use a fixed numeric score optimized on this run. Preserve evidence and an explicit
pairwise conclusion.

### 3. Distinguish direct exposure from investable edge

Fast thematic revenue growth can be fully priced. A lower-theme-purity company can be the
better stock if it has:
- cheaper expectations;
- stronger earnings quality;
- better order visibility;
- broader monetization;
- lower downside.

The Skill must ask: **why should this stock outperform the alternatives from today's price?**
not merely: **which company is most directly exposed?**

### 4. Report best-control comparison

Equal-weight matched-control excess is useful but can hide a clearly better peer.

V0.5 should also report:
- best control return;
- excess versus best control;
- whether selected beat every control;
- selected rank.

### 5. Preserve short-horizon success without moving the goalposts

金盘科技 ranked first at 20 days but not at the frozen 60-day base horizon. Do not change
the base horizon to 20 days after reveal. The correct diagnosis is that the selected-company
edge was not durable over the thesis horizon.

## Rules that must NOT be added

Do not:
- avoid 金盘科技;
- prefer 思源电气;
- prefer low PE mechanically;
- choose broad grid names over direct AIDC names;
- shorten all horizons to 20 days;
- fit a valuation threshold to these three stocks.

The next change must remain sector-independent.

## Next validation standard

V0.5 should be tested on a different period and should require:
1. clean frozen discovery/retrieval where possible;
2. separate hypothesis and selection gates;
3. frozen matched controls;
4. primary matched-control excess;
5. best-control excess and rank;
6. forward-frozen samples as the final evidence standard.
