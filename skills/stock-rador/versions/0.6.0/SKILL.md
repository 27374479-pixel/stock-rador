---
name: stock-rador-v0.6
description: >
  Evidence-first A-share opportunity research skill. Discover potentially mispriced
  changes from public information, verify them adversarially, build a causal earnings
  bridge, map the change to exposed A-share companies, test whether expectations and
  valuation already reflect it, and produce auditable research candidates for later
  replay. The skill is industry-agnostic and must not hard-code favored sectors.
---

# Stock Rador — AI Research Skill v0.6

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

## V0.6 two-gate opportunity, selection and expectation-burden contract

Industry-opportunity quality and single-stock selection quality are **separate gates**.

A strong economic thesis may exist while no individual company has a sufficiently strong
cross-sectional edge at the current price.

Every serious memo must therefore record two independent states:

### `hypothesisState`
- `Reject`
- `Watch`
- `Research hypothesis`
- `High-priority hypothesis`

This measures the event, causal chain, value-chain economics and expectation gap at the
**opportunity level**.

### `selectionState`
- `No selection`
- `Research selection`
- `High-priority selection`

This measures whether one listed company has a defensible advantage versus the frozen
alternatives **from the cutoff price/expectations**.

Only `High-priority selection` enters the primary stock-selection metric. A
`High-priority hypothesis` with no High-priority company is a valid and important output:
**the industry opportunity may be real, but there is no sufficiently differentiated stock
to act on yet.**

A window with no High-priority selection is a valid no-signal result. Never lower the
company-selection gate merely to make a backtest produce trades.

Every serious memo must also record:
- `researchReadyAt`: earliest provable time when the hypothesis reached Research;
- `actionableAt`: earliest provable time when both hypothesis and selection gates were
  satisfied; null unless `selectionState = High-priority selection`;
- `expectedRealization`: pre-registered earliest/base/latest trading-day horizons derived
  from the causal business lag, never from subsequent price performance.

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

### Cross-sectional selection-edge requirement

Direct thematic exposure is not sufficient. Before a company can become
`High-priority selection`, compare the selected company with every frozen control across
the dimensions that matter economically:

- **exposure materiality** — how much current/future revenue or profit is actually tied to
  the change;
- **incremental earnings sensitivity** — how large the thesis delta is versus current
  earnings/consensus;
- **expectation saturation** — how much of the story is already embedded in estimates,
  narrative and price;
- **valuation/downside asymmetry** — what favorable scenario the current price already
  requires and how much downside exists if the thesis is merely normal rather than great;
- **order/backlog/customer visibility** — whether the economics are contracted, qualified,
  shipped or still conceptual;
- **realization timing** — which company can monetize within the frozen thesis window;
- **quality/execution risks** — cash flow, leverage, dilution, governance, liquidity,
  customer concentration or trade/qualification constraints when material.

Do not collapse these dimensions into a fixed weighted score optimized on past runs.

Instead write a **pairwise falsifiable comparison** for every control:
- selected advantages;
- selected disadvantages;
- evidence references;
- net edge: `selected`, `control`, `mixed`, or `insufficient`.

Then state `selectionEdgeConclusion`:
- `clear`
- `credible`
- `mixed`
- `insufficient`

A High-priority selection requires `clear` or `credible`, and no frozen control may
have a pre-reveal net edge of `control` or `insufficient`. If the comparison is mixed,
keep the company at `Research selection` even if the industry hypothesis is excellent.

### Expectation-burden / breakeven requirement

V0.6 must not treat "lower PE than peers" or "high growth" as sufficient evidence of
mispricing. The researcher must translate the cutoff valuation into an explicit burden of
expectation.

For every `Research selection` or `High-priority selection`, record an
`expectationBurdenTest` containing:

- `valuationMethod`: the economically appropriate basis, such as forward PE, EV/EBITDA,
  P/B/ROE, NAV, FCF yield, unit economics, normalized commodity earnings, or another
  explained method;
- `referencePriceAtCutoff`: the cutoff price or clearly identified market-close reference;
- `marketBaseline`: the frozen consensus / run-rate / normalized earnings or operating
  baseline already embedded in the valuation;
- `thesisScenario`: the business assumptions that differ from that baseline;
- `breakevenCondition`: the minimum economically meaningful improvement needed for the
  thesis to justify the current valuation **and** create price-relative room versus the
  strongest frozen alternative;
- `ordinaryScenarioFailure`: a plausible non-disaster outcome in which the company is
  fundamentally fine but the stock still lacks selection alpha because expectations were
  already too high;
- `catalystOrTimingBridge`: why the expectation gap can become visible inside the frozen
  realization window;
- `evidenceRefs`;
- `conclusion`: `room`, `tight`, `fully_priced`, or `unresolved`.

Do not force false precision. A breakeven test may be expressed as a range or a clearly
defined operating condition when a full valuation model would be spurious.

A `High-priority selection` cannot have `fully_priced` or `unresolved` as its
expectation-burden conclusion. If the conclusion is `tight`, the memo must explain a
specific catalyst/timing bridge that can surface the incremental earnings or expectation
change within the pre-registered horizon.

The test is price-relative, not just company-quality-relative. Ask:
**what does the current price already require, and what must happen for this stock to beat
credible alternatives from here?**

Do not add fixed PE, growth, margin or FCF thresholds learned from historical winners.

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

## Opportunity and selection states

Use the two independent state machines defined above.

A company can never be High-priority merely because it has the most direct thematic
exposure. The selected stock must have a price-relative, expectation-relative edge versus
credible alternatives.

Examples of valid combinations:
- High-priority hypothesis + No selection: real opportunity, no investable single-stock edge.
- High-priority hypothesis + Research selection: opportunity strong, company ranking mixed.
- High-priority hypothesis + High-priority selection: both industry thesis and company edge
  pass.
- Research hypothesis + Research selection: useful research, not primary signal.

Do not upgrade either gate simply because later returns were strong.

## Required output: Opportunity Memo

For each serious candidate produce:

### 1. Snapshot
- research cutoff time
- researchReadyAt
- actionableAt (null unless High-priority selection)
- skill version
- hypothesis ID
- change hypothesis
- hypothesisState
- selectionState
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

For each selected company include `matchedControls` with 2-5 frozen peers / near-misses /
sector proxies where feasible.

Also include `selectionComparison`:
- selectedTicker;
- one pairwise comparison per control;
- selected advantages and disadvantages;
- evidence refs;
- `switchCondition`: observable evidence that would make the control preferable;
- net edge per control;
- overall selectionEdgeConclusion.

Also include `expectationBurdenTest` for every selected company.

A High-priority hypothesis does not require a High-priority selection.

### 6. Expectations, valuation and breakeven burden
- point-in-time consensus/guidance
- thesis delta versus expectations
- valuation context
- evidence that the thesis is or is not priced
- expectationBurdenTest: valuation method, market baseline, thesis scenario, breakeven
  condition, ordinary-scenario failure, timing bridge, evidence refs and conclusion

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
11. report excess versus the **best frozen control**, whether the selected stock beat every
   control, and selected rank/percentile;
12. evaluate hypothesis quality and company-selection quality separately;
13. aggregate returns both by ticker and by hypothesis so multiple stocks expressing one
   thesis do not inflate sample size;
14. inspect misses and false positives;
15. modify the skill based on **generalizable failure classes**, not individual winners;
16. evaluate the new version on a different holdout period;
17. maintain a forward sample that is never used for prompt tuning.

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
- industry thesis right but stock-selection edge absent;
- selected company dominated by a frozen alternative;
- expectation burden too high / thesis already priced;
- valuation method inappropriate for the business;
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
