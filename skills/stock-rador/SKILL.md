---
name: stock-rador
description: >
  Evidence-first A-share opportunity research skill. Discover potentially mispriced
  changes from public information, verify them adversarially, build a causal earnings
  bridge, map the change to exposed A-share companies, test whether expectations and
  valuation already reflect it, and produce auditable research candidates for later
  replay. The skill is industry-agnostic and must not hard-code favored sectors.
---

# Stock Rador — AI Research Skill

## Mission

Find public-information situations where a real-world change may create an economically
meaningful gap between future company fundamentals and current market expectations.

The goal is not to predict price from keywords. The goal is to answer, in order:

1. What changed?
2. Is the change real?
3. Why should it persist long enough to matter?
4. Through what physical/economic mechanism does it affect revenue, cost, margin,
   utilization, cash flow, or valuation?
5. Which listed companies have verified exposure to that mechanism?
6. What did the market appear to expect at the information cutoff?
7. Is the change already priced?
8. What would falsify the thesis?
9. Is the evidence good enough to justify deeper research?

A candidate may be rejected at any stage. Rejection is a valid research result.

## Core separation of responsibilities

**AI = researcher**
- search broadly;
- connect facts across domains;
- reason about causal mechanisms;
- generate alternative explanations;
- identify likely beneficiaries and losers;
- judge whether the situation deserves deeper research.

**Code = auditor**
- preserve timestamps and point-in-time availability;
- validate evidence references and independence groups;
- enforce fail-closed data rules;
- replay prices only after the research snapshot is frozen;
- calculate realized outcomes without changing the original thesis.

Never use realized returns to repair an old thesis in place. Improvements belong to a
new skill version and a new evaluation run.

## Non-negotiable rules

### 1. No sector whitelist

Do not start from a fixed list such as AI, batteries, memory, agriculture, robotics,
or any previously successful theme. Start from **economic changes**, regardless of
industry.

Examples of change classes are allowed only as search prompts, never as favored sectors:
- demand acceleration/deceleration;
- supply destruction or new capacity;
- price or spread changes;
- inventory cycle;
- lead-time changes;
- regulation, tariffs, sanctions, standards;
- customer capex/budget shifts;
- technology substitution;
- qualification/certification milestones;
- bottlenecks in equipment, materials, logistics, labor, power, land, permits;
- financing conditions;
- competitive exits/entries;
- channel checks or end-market behavior.

If a new opportunity does not fit any existing class, create a new class rather than
discard it.

### 2. Point-in-time discipline

Every conclusion must be reproducible at an explicit cutoff time.

Separate:
- publication time;
- first observation time;
- earliest provable availability time;
- access time;
- time at which a truth judgment was formed.

Do not backdate availability merely because an old page can be found today.

During historical replay, exclude all evidence not provably available by the cutoff.

### 3. Evidence quality is not popularity

Many reposts do not equal many sources.

Prefer:
1. issuer filings, exchange disclosures, government/regulator documents;
2. first-party customer/supplier disclosures, official statistics, standards bodies;
3. high-quality trade/industry data with transparent methodology;
4. reputable reporting with attributable sourcing;
5. specialist commentary and community discussion;
6. anonymous claims/rumors.

Community material is excellent for **discovery**, but usually weak as sole verification.

Assign an independence group to each supporting source. Syndicated copies, duplicated
press releases, or articles derived from one anonymous source count as one origin.

### 4. Always search for disconfirmation

Before upgrading a candidate, actively look for:
- evidence the claimed change is temporary;
- inventory/channel effects that mimic end demand;
- offsetting capacity additions;
- customer substitution;
- contract or pricing clauses that prevent economic pass-through;
- low segment contribution;
- accounting/revenue-recognition mismatch;
- already-raised consensus estimates;
- valuation that already discounts the favorable scenario;
- governance, dilution, leverage, receivables, cash-flow or cyclicality risks.

A thesis without a credible bear case is incomplete.

## Research loop

### Stage A — Discover changes, not stocks

Search recent and point-in-time sources for unusual changes in the real economy.

Prefer observations containing quantities, dates, direction and mechanism:
- prices;
- lead times;
- utilization;
- orders/backlog;
- shipments;
- inventory;
- capacity;
- customer budgets/capex;
- regulatory implementation dates;
- qualification/approval milestones;
- market-share changes.

Record weak and contradictory leads too. Do not keep only ideas whose stocks later rose.

Output a short **change hypothesis**:
- observed change;
- first credible date;
- affected value chain;
- why it may matter;
- what evidence would disprove it.

### Stage B — Verify the event

For each change hypothesis:
1. locate the earliest traceable public source;
2. locate at least one independent primary or first-party source when possible;
3. identify whether apparently independent reports share the same origin;
4. quantify the change whenever feasible;
5. classify truth status as unknown, supported, contradicted or mixed.

Do not convert "widely discussed" into "true".

### Stage C — Build the causal earnings bridge

Write the mechanism as an explicit chain:

**event/change → physical/economic constraint → business KPI → financial statement impact
→ earnings/cash-flow impact → market-expectation gap**

Examples of business KPIs include price, volume, utilization, yield, mix, market share,
unit cost, gross margin, operating leverage, capex efficiency and working capital.

For every arrow ask:
- why should this arrow hold?
- what evidence supports it?
- what can break it?
- what is the likely lag?

If an arrow cannot be defended, the chain is not complete.

### Stage D — Map the value chain before choosing tickers

Identify:
- direct winners;
- second-order winners;
- direct losers;
- substitutes;
- bottleneck providers;
- companies with apparent thematic labels but little economic exposure.

Only after mapping the chain should the skill search A-share companies.

For every company, verify exposure using evidence such as:
- segment revenue/profit;
- disclosed customers/suppliers;
- capacity or shipment data;
- product qualification;
- orders/backlog;
- pricing mechanism;
- geographic exposure.

"Same concept", "same product name", brokerage theme tags and investor-forum claims are
not verified exposure.

### Stage E — Test earnings sensitivity

Estimate the order of magnitude before discussing upside.

Use transparent scenarios rather than false precision:
- base;
- favorable;
- adverse.

Where possible estimate:

`ΔRevenue = exposed volume × Δprice + Δvolume × expected price`

`ΔGrossProfit ≈ ΔRevenue × incremental gross margin + existing volume × margin change`

Then ask whether the implied earnings delta is large relative to:
- current revenue/profit;
- consensus earnings;
- enterprise value/market cap;
- balance-sheet capacity.

If the economic effect is too small to matter, reject the candidate even if the story is
true.

### Stage F — Reconstruct market expectations

This is essential. A good company is not automatically an opportunity.

At the cutoff, look for:
- consensus estimates and recent revisions;
- guidance;
- valuation multiples versus history/peers;
- recent price reaction;
- sell-side/community narrative saturation;
- crowded positioning proxies when available;
- whether the supposed catalyst is already common knowledge.

State explicitly:
- what the market seems to expect;
- what this thesis expects instead;
- the measurable difference;
- why the difference may close.

Do not label a candidate "mispriced" without a documented expectation gap.

### Stage G — Price and execution check

A valid fundamental thesis can still be a poor research candidate if:
- price already moved dramatically before the cutoff;
- the next executable price is constrained by limit-up/suspension;
- liquidity is poor;
- valuation requires an extreme scenario;
- downside is asymmetric.

Record point-in-time price and the next realistic executable price separately.

### Stage H — Falsification

Before promotion, write at least two observable invalidation conditions where possible:
- one for the real-world/event hypothesis;
- one for the company transmission/earnings hypothesis.

Examples:
- price spread normalizes;
- lead time returns below threshold;
- expected capacity arrives;
- customer capex is cut;
- company disclosure shows negligible exposure;
- earnings revisions catch up and remove the expectation gap.

Invalidation conditions must be defined before observing subsequent returns.

## Candidate states

Use states as research workflow labels, not trading recommendations.

- **Reject** — contradicted, invalidated, economically immaterial, already fully priced,
  or exposure not real.
- **Watch** — plausible but evidence or causal chain is incomplete.
- **Research** — event verified, causal chain credible, exposure verified; expectation gap
  still requires work.
- **High-priority research** — evidence is independent, earnings bridge is material,
  expectation gap is documented, valuation/execution remain plausible, and falsifiers
  are explicit.

Do not upgrade simply because the stock later performed well.

## Required output: Opportunity Memo

For each serious candidate produce:

### 1. Snapshot
- cutoff time
- skill version
- hypothesis ID
- change hypothesis
- current state

### 2. Evidence ledger
For every source:
- URL/title/publisher
- publication time
- available time
- source type
- independence group
- relation: supports / contradicts / context
- exact claim supported

### 3. Causal chain
Write each arrow and supporting evidence.

### 4. Value-chain map
Identify winners, losers, substitutes, bottlenecks and false thematic matches.

### 5. A-share mapping
For each candidate company:
- ticker/name
- verified exposure
- evidence
- approximate earnings sensitivity
- principal risks

### 6. Expectations and valuation
- point-in-time consensus/guidance
- thesis delta versus expectations
- valuation context
- evidence that the thesis is or is not priced

### 7. Bear case and falsifiers
List the strongest competing explanation and pre-registered invalidation conditions.

### 8. Unknowns
Separate facts from assumptions. Never fill missing facts with confident prose.

### 9. Next research actions
Specify the smallest set of new evidence that would most reduce uncertainty.

## Backtest / replay feedback loop

The research process and outcome evaluation must be separated.

For each skill version:
1. freeze the skill text and assign a version/hash;
2. choose the discovery universe and time window before seeing future returns;
3. create point-in-time opportunity memos using only cutoff-available evidence;
4. lock the memos;
5. only then fetch subsequent prices/fundamentals;
6. evaluate hit rate, excess return, drawdown, time-to-thesis, and failure modes;
7. inspect misses and false positives;
8. modify the skill based on **generalizable failure classes**, not individual winners;
9. evaluate the new version on a different holdout period;
10. maintain a forward sample that is never used for prompt tuning.

Never optimize rules directly on the same cases used to report performance.

## Failure analysis taxonomy

When a case fails, classify the dominant reason:
- event false;
- source not independent;
- event true but transitory;
- causal link wrong;
- exposure mapping wrong;
- magnitude immaterial;
- expectations already reflected it;
- valuation too high;
- timing too early/late;
- execution impossible;
- macro/market factor dominated;
- accounting/governance issue;
- data leakage / point-in-time violation;
- unknown.

Improve the process at the failure-class level.

## Search behavior

Use multiple query formulations and source types. Search both the thesis and its opposite.

Do not let a single community, language, company name or pre-existing watchlist define the
research universe.

For cross-border value chains, search relevant non-Chinese sources when they are closer
to the underlying event, then map verified economic effects back to A-shares.

## Final discipline

The skill should prefer "insufficient evidence" over a fabricated conclusion.

The most valuable output is not a long list of stocks. It is a small number of auditable
situations where:
- something real changed;
- the change matters economically;
- a listed company is genuinely exposed;
- expectations appear stale;
- price still leaves room for the thesis;
- and the thesis can be falsified.
