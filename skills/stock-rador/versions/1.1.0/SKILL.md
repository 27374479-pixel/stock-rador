---
name: stock-rador-v1.1
description: >
  Evidence-first A-share opportunity research skill. Discover potentially mispriced
  changes from public information, verify them adversarially, build a causal earnings
  bridge, map the change to exposed A-share companies, test whether expectations and
  valuation already reflect it, and produce auditable research candidates for later
  replay. The skill is industry-agnostic and must not hard-code favored sectors.
---

# Stock Rador — AI Research Skill v1.1

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

## V1.1 expectation-absorption directionality

V1.1 keeps every V1.0 rule and changes only one proven failure class:
the company-engine override no longer treats all opposite-sign 20d/60d price states as one
generic "mixed" condition.

A public fundamental confirmation is not automatically incremental alpha. The Skill must
ask whether the price has already completed the rerating **before** the confirmation arrives.

### Frozen company-price states

Using the selected company's benchmark-relative trailing returns at the memo cutoff:

- `de_rated`: 20d < 0 and 60d < 0.
  Price still reflects broad de-rating; a verified company engine may remain under-reflected.
- `early_turn`: 20d >= 0 and 60d < 0.
  Recent price action has started to recognize improving fundamentals, while the longer
  window still reflects prior de-rating.
- `late_reversal`: 20d < 0 and 60d >= 0.
  The longer-window rerating has already occurred and the shorter window is now weakening.
  For company-engine override purposes this is treated as expectation absorption / reversal,
  not as an under-reflected opportunity.
- `sustained_strength`: 20d >= 0 and 60d >= 0.
  The stock is already strong across both windows. It may still be investable through the
  normal sector-confirmed / expectation-burden path, but it cannot use the company-engine
  override as a shortcut around broad timing.

### High-priority override rule

A V1.1 `company_engine_override` may use only:
- `de_rated`;
- `early_turn`.

It may not use:
- `late_reversal`;
- `sustained_strength`.

This is a directional rule, not a magnitude threshold. V1.1 does **not** learn a fixed
percentage gain, drawdown, PE or time-since-news threshold from any historical stock.

### "Good news can be bad news" research principle

Across all routes, separate:
1. **new fundamental information**;
2. **already-known confirmation**;
3. **the price move that happened before the confirmation**.

A bullish headline that merely confirms a thesis after a large prior rerating is not a new
reason to buy. Analysts must explicitly test whether:
- estimates/earnings are still being revised upward beyond the frozen baseline;
- price appreciation preceded the public confirmation;
- short-horizon relative weakness follows a longer-horizon rerating;
- the next catalyst contains genuinely incremental information rather than repeating the
  same narrative.

For normal `sector_confirmed` selections, late-reversal is a strong expectation-absorption
warning but not an automatic universal veto; the existing expectation-burden, price-
absorption, asymmetry and downside gates remain authoritative.

### Anti-overfitting

The 2023Q2 华电国际 failure motivated this split. The 2023Q4 中际旭创 success provides a
contrasting early-turn example. Neither period may validate V1.1.

Freeze V1.1 before the next holdout. Do not add sector names, return-magnitude cutoffs,
technical indicators, or named-stock exceptions.

## V1.0 company-engine timing override retained in V1.1

V1.0 keeps every v0.9 rule. It changes only one failure mode that independently repeated in
2025Q1 and 2025Q2 development diagnostics:

**a broad sector/opportunity price regime can be neutral or adverse while one company has
an already-realized, durable earnings engine and a clearly superior price/expectation
asymmetry.**

This is not a general contrarian override. Broad timing remains the default High-priority
gate.

Every selected company declares a `timingRoute`:
- `sector_confirmed` — normal v0.9 route; broad opportunity timing must be favorable;
- `company_engine_override` — narrow exception described below;
- `research_only` — timing is not strong enough for High-priority.

### Company-engine override requirements

A High-priority `company_engine_override` is allowed only when all are true:

- expression archetype = `quality_revision`; turning-point convexity may not use this route;
- `earningsConversionBridge.status = realized`; quantitatively bridged/proxy/speculative is
  not enough;
- expectation burden = `room`;
- qualityFloor = `pass`;
- valuationSlack = `room`;
- cross-sectional result = `clear_asymmetry`, and the selected company beats every frozen
  control;
- downside containment is clear or credible;
- the broad price regime is neutral or adverse, not favorable;
- price weakness is attributable to non-company-fundamental causes rather than deterioration
  in the selected company's own operating engine;
- the company-specific earnings engine is already realized and independently confirmed;
- the company engine has a structural or multi-quarter half-life even if the broad event is
  short-lived;
- company fundamentals and price are demonstrably divergent before reveal;
- the next catalyst that can validate/falsify the company engine lies inside the base
  thesis horizon;
- a pre-registered falsifier is stated.

### Required `companyEngineTimingOverrideTest`

Record:
- `overrideMode`: subsector_separation / fundamental_price_divergence;
- `realizedEngine`;
- `independentFundamentalConfirmation`;
- `engineHalfLife`;
- `fundamentalPriceDivergence`;
- `nextCatalystWithinBase`;
- `priceWeaknessAttribution`;
- deterministic company 20/60d price dislocation from frozen data;
- falsifier;
- evidence refs;
- overall conclusion: clear_override / credible_override / no_override.

The override may use a **de-rated** or **mixed** company price path. It does not require
price momentum to turn first. The purpose is to detect a verified earnings engine that the
broad timing basket is masking, not to chase strength.

### Anti-overfitting

The 2025Q1 新易盛 and 2025Q2 阳光电源 cases motivated this mechanism but may not validate
V1.0. Do not add named sectors, PE thresholds, growth thresholds, or stock-specific
exceptions. V1.0 must be frozen and tested on a new historical/forward holdout.

## V0.9 earnings-conversion + turning-point convexity contract retained in V1.0

V0.9 keeps the v0.8 timing and cross-sectional asymmetry gates, but fixes two distinct
failure modes exposed by the **development-only** 2025Q3 diagnostic:

1. Low valuation / low expectations / backlog proxies can look asymmetric without providing
   a direct bridge to earnings.
2. A cyclical company can look low-quality on trailing earnings precisely when operating
   leverage is about to make the next earnings change unusually large.

The 2025Q3 results may define these failure classes. They may not be used to claim v0.9
works. V0.9 must be frozen and tested on another holdout or forward sample.

### Mandatory expression archetype

Every selected company is classified **before reveal** as one of:

- `quality_revision` — current quality already clears the normal quality floor and the
  thesis is that a real operating/earnings revision is still under-reflected.
- `turning_point_convexity` — trailing earnings quality may be weak because the business
  is near a cyclical/operating inflection, but survival, the inflection and the earnings
  leverage are directly evidenced.

Do not switch archetypes after seeing returns.

### Mandatory earningsConversionBridge

Every selected company must state a direct bridge from the economic event to earnings:

- `driverType`: price / volume / mix / order_backlog / cost / yield / utilization /
  market_share / other;
- `driverChange`: the frozen operating change;
- `earningsMechanism`: why it changes revenue, gross profit, operating profit or cash
  earnings;
- `nextObservableMetric`: the next metric that can verify the bridge;
- `realizationWindowTradingDays`;
- status: `realized / quantitatively_bridged / proxy_only / speculative`;
- evidence refs;
- explicit failure condition.

A High-priority selection requires the bridge to be `realized` or
`quantitatively_bridged`, and observable no later than the pre-registered base thesis
horizon.

Examples of **proxy-only evidence that cannot by itself qualify**:
- contract liabilities without a margin/revenue conversion schedule;
- cash receipts without evidence that they correspond to profitable delivery;
- capacity announcements without utilization/orders;
- backlog without delivery economics;
- low consensus estimates without an operating variable that can beat them.

Low expectations are not revision headroom unless a measurable business variable can
convert them into earnings.

### quality_revision path

The normal v0.8 quality floor remains mandatory:
- qualityFloor = pass;
- timing gate favorable;
- asymmetry gate clear/credible;
- direct earningsConversionBridge realized/quantitatively_bridged.

This path is appropriate for companies already demonstrating acceptable earnings/cash-flow
quality.

### turning_point_convexity path

This path exists for genuine cyclical or operating inflections. It is **not** a loophole
for low-quality stocks.

A selected turning-point company must record `turningPointConvexityTest`:

- `survivalFloor`: pass / borderline / fail / unresolved;
- `inflectionEvidence`: clear / credible / mixed / insufficient;
- `operatingLeverage`: clear / credible / mixed / insufficient;
- `workingCapitalRisk`: low / moderate / high / unresolved;
- `downsideFailure`;
- evidence refs;
- overall: clear_convexity / credible_convexity / mixed / insufficient.

For High-priority:
- survivalFloor must **pass**;
- inflection evidence must be clear/credible;
- operating leverage must be clear/credible;
- working-capital risk must be low/moderate;
- overall convexity must be clear/credible;
- the direct earningsConversionBridge must also be realized/quantitatively bridged;
- all v0.8 timing, expectation and pairwise asymmetry gates still apply.

A weak trailing quality score is therefore permitted only when the business can survive the
realization window and the profit inflection is causally measurable before reveal.

### Decision validity / re-underwriting

Every v0.9 selected-company decision records `decisionValidityTradingDays`, which must
equal `expectedRealization.baseTradingDays`.

The original selection is judged at its pre-registered base horizon. Results after that
horizon are useful diagnostics, but they do not retroactively change whether the original
decision was correct. Continuing to hold a name beyond the base horizon requires a fresh
re-underwriting with then-current evidence.

This separates:
- **initial selection quality**, from
- **later dynamic re-ranking**.

Do not extend a thesis simply because the stock kept rising.

## V0.8 timing + cross-sectional asymmetry contract retained in V0.9

V0.8 keeps every v0.7 gate and adds two independent questions before a company may become
`High-priority selection`:

1. **Is the opportunity still in a favorable regime now?**
2. **Is this company the best risk/reward expression of the opportunity, rather than merely
   the highest-quality company?**

The 2026Q2 diagnostic that motivated these questions is development evidence only. Its
returns may define the failure class but may not be used to prove v0.8.

### Opportunity Timing Gate

Every selected-company memo records an `opportunityTimingTest`.

The timing test must separate:
- `fundamentalImpulse`: accelerating / persistent / plateauing / reversing / unresolved;
- `earningsRevisionBreadth`: broad_positive / narrow_positive / mixed / negative / unresolved;
- `eventHalfLife`: structural / multi_quarter / short_lived / uncertain;
- `lateCycleRisk`: low / moderate / high / unresolved;
- `priceRegime`: favorable / neutral / adverse / unresolved;
- overall conclusion: favorable / neutral / adverse / unresolved.

The price-regime check is deterministic when the frozen data are available:
- compute equal-weight opportunity-basket excess return versus the benchmark over the
  trailing 20 and 60 trading days ending at the cutoff;
- compute the fraction of frozen selected/control names with positive benchmark-relative
  return over each lookback;
- `favorable` requires both basket excess returns non-negative and both breadth measures
  at least one-half;
- `adverse` requires both basket excess returns negative and both breadth measures below
  one-half;
- mixed signs are `neutral`, not something the researcher may relabel optimistically.

These sign/breadth rules are intentionally simple. They are not fitted to a historical
winner or a return threshold. They operationalize the idea that industry-level return
persistence matters while still allowing early/contrarian cases to remain Research.

A High-priority selection requires:
- overall timing = favorable;
- price regime = favorable;
- fundamental impulse = accelerating or persistent;
- revision breadth = broad_positive or narrow_positive;
- event half-life = structural or multi_quarter;
- late-cycle risk = low or moderate.

A company may remain `Research selection` under neutral/adverse timing. Do not discard the
fundamental thesis; separate "right company" from "right time".

### Cross-sectional Asymmetry Gate

V0.8 changes the ranking question from:

> Which company has the best fundamentals?

to:

> Which acceptable-quality company has the largest favorable gap between likely future
> revisions and what its current price/expectations already demand?

Every selected-company memo records `crossSectionalAsymmetryTest`:
- `qualityFloor`: pass / borderline / fail / unresolved;
- `revisionHeadroom`: clear / credible / mixed / insufficient;
- `valuationSlack`: room / tight / none / unresolved;
- `catalystReachability`: clear / credible / mixed / insufficient;
- `downsideContainment`: clear / credible / mixed / insufficient;
- one pairwise asymmetry comparison per frozen matched control;
- overall conclusion: clear_asymmetry / credible_asymmetry / mixed / insufficient.

**Quality is a floor, not the ranking objective.** A lower-quality peer may be the better
selection if it still passes the quality floor and has materially greater revision
headroom, valuation slack, catalyst reachability and downside asymmetry.

For each frozen control state:
- revision advantage;
- valuation advantage;
- quality tradeoff;
- catalyst advantage;
- downside tradeoff;
- evidence refs;
- switch condition;
- net asymmetry: selected / control / mixed / insufficient.

A High-priority selection requires:
- qualityFloor = pass;
- revisionHeadroom = clear or credible;
- valuationSlack = room or tight;
- catalystReachability = clear or credible;
- downsideContainment = clear or credible;
- overall asymmetry = clear_asymmetry or credible_asymmetry;
- selected must beat every frozen control on net asymmetry.

Do not learn a fixed PE discount, momentum return, earnings-surprise percentage or valuation
percentile from a historical winner. The gate is relational and causal, not a fitted score.

## V0.7 expectation-reset / fundamental-acceleration contract retained in V0.8

V0.7 addresses one narrow failure class without lowering the selection gate:

**Sometimes exact point-in-time valuation or consensus data are incomplete even though the
market's earnings baseline is visibly being reset by newly realized fundamentals.**

Missing measurement is not the same as conflicting evidence. V0.7 therefore separates:

- `measured_burden` — the normal v0.6 path: valuation/consensus evidence is sufficient;
- `reset_substitute` — exact burden measurement is incomplete, but a strict expectation-reset
  evidence chain can substitute for the missing measurement;
- `conflicted` — evidence genuinely points in different directions; never use a substitute;
- `insufficient` — the evidence set is too weak; never use a substitute.

A `reset_substitute` is allowed only when the conventional `expectationBurdenTest` is
`unresolved` **solely because of a measurement gap** and every following component is
clear or credible before reveal:

1. **Fundamental acceleration** — the economic KPI is not merely good; its rate, magnitude,
   price, volume, utilization, backlog, revenue, margin or profit trajectory has materially
   accelerated versus the prior frozen baseline.
2. **Realized company confirmation** — company first-party evidence has already converted at
   least part of the external event into reported revenue/profit/margin/orders/backlog or an
   equally direct operating KPI. Forecast-only stories do not qualify.
3. **Cross-sectional confirmation** — the selected company has a defensible incremental
   earnings/operating advantage versus frozen alternatives. Generic sector beta does not
   qualify.
4. **Baseline lag** — an explicit pre-cutoff consensus, guidance, prior run-rate or published
   forecast is demonstrably stale relative to the new evidence. "The market may not know"
   is not evidence.
5. **Price-absorption check** — the researcher must test whether price has already absorbed the
   reset using the best point-in-time evidence available. High or unresolved absorption risk
   blocks the substitute.

The substitute is a **data-completeness exception, not a valuation exception**. It cannot
override:
- a `fully_priced` burden conclusion;
- contradictory company evidence;
- a missing market baseline;
- high/unresolved price-absorption risk;
- weak peer differentiation;
- a thesis based only on forecasts, narratives or thematic labels.

Do not learn numeric surprise, growth or valuation thresholds from historical winners.
V0.7 still requires pairwise controls, falsifiers, pre-registered horizons and point-in-time
evidence.

### Required `expectationResetTest`

Every selected-company v0.7 memo records:
- `fundamentalAcceleration`;
- `realizedCompanyConfirmation`;
- `crossSectionalConfirmation`;
- `baselineLag` with explicit `baselineType`;
- `priceAbsorption`;
- `unresolvedReason`;
- overall conclusion: `clear_reset / credible_reset / mixed / insufficient`.

A High-priority selection using `reset_substitute` requires:
- conventional burden = `unresolved`;
- `unresolvedReason = measurement_gap_only`;
- every four evidence components = `clear` or `credible`;
- price absorption risk = `low` or `moderate`;
- overall reset conclusion = `clear_reset` or `credible_reset`;
- the normal v0.6 cross-sectional High-priority rules still pass.

## V0.6 foundations retained in V0.7

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

V0.7 must not treat "lower PE than peers" or "high growth" as sufficient evidence of
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


## V0.6 discovery-coverage contract

V0.6 treats discovery as a separate measurable problem. A perfect verification/selection
pipeline is still useless if it never sees the important economic change.

### Source lanes

Before research, freeze the actual information lanes covered by the run. Lanes describe
economic information roles, not preferred brands or sectors:

- `official_primary` — governments, regulators, exchanges and official statistics;
- `company_first_party` — issuers, customers, suppliers and competitors;
- `physical_industry` — prices, inventories, utilization, lead times, shipments and capacity;
- `reputable_news` — attributed reporting useful for early discovery;
- `specialist_trade` — trade publications and domain specialists;
- `community_weak_signal` — forums/communities used for weak-signal discovery.

A run may add lanes. Missing access is allowed only when explicitly declared. Coverage must
never be implied from silence.

### Origin independence

Every raw source item gets an `originGroup`.

Copies derived from the same filing, press release, anonymous source or syndicated report
share one origin group. Ten reposts are still one origin.

Popularity, mention count and repost count can affect *attention*, but they do not increase
evidence independence.

### Event clusters

The discovery unit is an economic **event cluster**, not a headline.

The AI groups source items that describe the same underlying state change and records:
- `eventId`;
- explicit change statement;
- first provable availability time;
- change type;
- novelty: new / continuation / repeat / uncertain;
- member source items;
- independent origin groups;
- affected value chain;
- contradiction-search notes;
- the next research question.

Code verifies membership, timestamps and origin accounting. AI supplies semantic grouping.

Every event cluster must receive exactly one screening decision before deep research.

### Novelty is not alpha

A new or unusually discussed event may deserve investigation, but novelty is not itself a
buy signal.

Ask:
- what information changed versus the prior state?
- is the apparent novelty only repeated coverage?
- did the physical/economic variable change, or only the narrative?
- is there an independent first-party/physical confirmation?

Do not promote an event merely because its mention count increased.

### Discovery funnel accounting

Every v0.9 run preserves the full denominator:

`source items → unique origin groups → event clusters → promoted hypotheses → memos →
High-priority hypotheses → selected companies`

Discovery precision and selection performance must be reported separately.

### Post-outcome missed-opportunity audit

After outcomes exist, run an independent missed-opportunity audit using a case-generation
rule frozen before reveal.

Each hindsight case is assigned one dominant stage:
- `detected`
- `source_universe_miss`
- `retrieval_miss`
- `dedup_clustering_miss`
- `triage_miss`
- `verification_miss`
- `value_chain_mapping_miss`
- `selection_gate_miss`
- `execution_filtered`
- `unforeseeable`
- `not_valid_ex_ante_opportunity`

A case counts as `detectableExAnte` only if pre-cutoff evidence could have supported a
causal thesis without future knowledge.

`diagnosticRecall = detected / detectableExAnte`

This is a hindsight diagnostic, **not** alpha proof.

The same-period missed cases may diagnose failure classes, but they may not be used to tune
the reported Skill version and then claim improved recall on that same sample. Any change
must be tested on a different holdout or future forward sample.

See `DISCOVERY.md` for the full contract.

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
