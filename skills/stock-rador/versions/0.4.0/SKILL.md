---
name: stock-rador-v0.4
description: >
  Evidence-first A-share opportunity research skill. Discover potentially mispriced
  changes from public information, verify them adversarially, build a causal earnings
  bridge, map the change to exposed A-share companies, test whether expectations and
  valuation already reflect it, and produce auditable research candidates for later
  replay. The skill is industry-agnostic and must not hard-code favored sectors.
---

# Stock Rador — AI Research Skill v0.4

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

## V0.4 actionability and counterfactual contract

Research quality and actionability are separate questions.

A candidate may be economically interesting and still remain `Research`. Only
`High-priority research` is allowed into the primary signal-performance metric.

A window with no `High-priority research` candidates is a valid no-signal result. Never
lower the gate merely to make a backtest produce trades.

Every serious memo must record:
- `researchReadyAt`: earliest provable time when event, causal chain and company exposure
  were sufficiently verified for the `Research` state;
- `actionableAt`: earliest provable time when all High-priority gates were satisfied;
  null unless the state is `High-priority research`;
- `expectedRealization`: pre-registered earliest/base/latest trading-day horizons derived
  from the causal chain's business lag, never from subsequent price performance.

For historical replay, `researchReadyAt` and `actionableAt` must be computed from the
latest availability time among the evidence actually required for that state. Do not use
an arbitrary quarter-end timestamp when the thesis became research-ready earlier.

### Matched-control requirement

A High-priority candidate is not sufficiently tested by beating a broad index alone.

Before outcome reveal, freeze 2-5 matched controls whenever the opportunity set permits.
Controls should be selected from companies an investor could reasonably have confused with
the chosen beneficiary at the cutoff:
- same industry / same end-market exposure;
- same value-chain position;
- a near-miss company rejected because exposure, valuation or expectations were weaker;
- a sector proxy when no close listed peer exists.

For each control record:
- ticker/name;
- control type: peer / near_miss / sector_proxy;
- why it is a fair counterfactual;
- why the selected company was preferred at the cutoff;
- evidence available by the cutoff.

Do not select controls after seeing returns. Do not choose obviously weak companies merely
to make the selected stock look better.

A High-priority signal should be evaluated against:
1. the broad benchmark;
2. the frozen matched-control basket;
3. its rank among the selected company plus controls.

If the stock only beats the broad market because its whole sector rallies, classify the
result as sector beta / unresolved selection alpha rather than a clean stock-selection hit.

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
- **Research** — event verified, causal chain credible, exposure verified, but the
  expectation gap, valuation, execution, downside asymmetry, or realization timing is not
  yet strong enough for the primary signal set.
- **High-priority research** — evidence is independent, earnings bridge is material,
  expectation gap is documented and measurable, valuation/execution remain plausible,
  downside and competing explanations have been stress-tested, falsifiers are explicit,
  and a thesis realization window has been pre-registered.

`Research` and `High-priority research` must never be pooled into one primary return
metric.

Do not upgrade simply because the stock later performed well.

## Required output: Opportunity Memo

For each serious candidate produce:

### 1. Snapshot
- research cutoff time
- researchReadyAt
- actionableAt (null unless High-priority)
- skill version
- hypothesis ID
- change hypothesis
- current state
- expectedRealization: earliest/base/latest trading days plus rationale

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

### 5. A-share mapping and counterfactual set
For each candidate company:
- ticker/name
- verified exposure
- evidence
- approximate earnings sensitivity
- principal risks

For each High-priority company also include `matchedControls` with 2-5 frozen peers /
near-misses / sector proxies where feasible. State explicitly why the chosen company should
outperform each control if the thesis is correct.

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
3. perform broad semantic triage and freeze **one decision and one reason code for every
   reviewed discovery item**, including rejected items;
4. create point-in-time opportunity memos using only cutoff-available evidence;
5. compute researchReadyAt/actionableAt from evidence availability and pre-register the
   realization horizon;
6. freeze matched controls / near-miss company mappings for every High-priority signal;
7. lock the discovery policy, implementation code, screening decisions, skill, memos and
   counterfactual set;
8. only then fetch subsequent prices/fundamentals;
9. evaluate discovery quality separately from actionable-signal performance;
10. report excess return versus both the broad benchmark and the matched-control basket;
11. report the selected stock's percentile/rank within the frozen company set;
12. aggregate returns both by ticker and by hypothesis so multiple stocks expressing one
   thesis do not inflate sample size;
13. inspect misses and false positives;
14. modify the skill based on **generalizable failure classes**, not individual winners;
15. evaluate the new version on a different holdout period;
16. maintain a forward sample that is never used for prompt tuning.

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

## Semantic triage before deep research

Broad discovery is allowed to be noisy, but the AI must classify every reviewed item
before deep research using a frozen, sector-neutral reason taxonomy such as:
- economically relevant change;
- non-economic keyword collision;
- real change but no plausible listed-company transmission;
- anecdote lacking independent verification;
- already fully explained/common knowledge;
- duplicate/syndicated origin;
- insufficient timing provenance.

Preserve the rejected denominator. Every reviewed item must have exactly one frozen
decision record containing at least:
- item ID;
- decision: reject / promote / duplicate;
- primary reason code;
- optional secondary reason codes;
- one-sentence rationale.

The reason taxonomy must be sector-neutral and versioned with the skill. Do not use sector
names as a shortcut for triage.

## Historical-memory stress tests

Historical replay has an unavoidable risk that the model already knows later winners.
Where feasible, run at least one identity-reduced stress test before accepting a historical
result:
- remove ticker and company names from early event triage;
- present companies as A/B/C during exposure/expectation comparison;
- shuffle the order of candidate companies;
- verify that the causal reasoning and ranking survive removal of famous-name cues.

A failed masking test does not automatically invalidate the economic thesis, but it lowers
confidence in historical alpha claims. Forward-frozen samples remain the final standard.

### Historical retrieval isolation

For a historical run intended as validation, the AI should reason from a frozen historical
document pack rather than an open-ended live search-results page.

A live search result may display snippets from documents published after the simulated
cutoff even when the query itself contains historical dates. Merely seeing such snippets is
a leakage channel.

Therefore:
- every material document used for historical reasoning must be stored in the frozen source
  pack with a provable publication/availability time at or before the cutoff;
- do not use post-cutoff snippets, later summaries, or retrospective articles to choose a
  hypothesis, company, control or ranking;
- if the research process observes material post-cutoff search-result content before lock,
  record `searchResultFutureLeakageObserved: true` and downgrade the run to
  `exploratory_contaminated`;
- a contaminated run may test software/process mechanics but must not be reported as
  holdout validation.

The safest historical workflow is retrieval first, freeze second, reasoning third.

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
