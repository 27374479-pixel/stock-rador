---
name: stock-rador-v1.7
description: >
  Evidence-first A-share opportunity research skill. Discover potentially mispriced
  changes from public information, verify them adversarially, build a causal earnings
  bridge, map the change to exposed A-share companies, test whether expectations and
  valuation already reflect it, and produce auditable research candidates for later
  replay. The skill is industry-agnostic and must not hard-code favored sectors.
---

# Stock Rador — AI Research Skill v1.7

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

## V1.7 adversarial research-completeness contract

V1.7 keeps every V1.6 causal-state-variable, V1.5 timing/promotion,
expectation, expression-quality and opportunity-first rule unchanged.

It adds one research-process requirement motivated by a separate failure class:

**a sophisticated bullish causal chain is still incomplete if the Skill did not search
with comparable intensity for company-specific facts that could break the thesis.**

This is a retrieval/research-completeness rule, not a new valuation screen and not a new
promotion route. It must not hard-code leverage ratios, goodwill thresholds, industries,
companies or failure cases from any historical replay.

### Mandatory adversarialEvidenceTest for selected memos

Every V1.7 memo with Research selection or High-priority selection freezes an
adversarialEvidenceTest before reveal.

It records:

- searchCompleteness: complete / partial / insufficient;
- axes: one or more audited company-risk axes, each with:
  - axis;
  - conclusion: clear / credible_risk / material_risk / unresolved;
  - rationale;
  - evidence refs;
- strongestCounterThesis;
- counterThesisSeverity: low / moderate / high / fatal;
- thesisImpact: none / tighten_downside / downgrade_quality / block_primary;
- falsifierOrEscalationTrigger;
- conclusion: clear_to_proceed / proceed_with_caveats / research_only / reject.

Allowed risk axes are:

- balance_sheet_liquidity;
- capital_allocation_mna_goodwill;
- governance_related_party;
- refinancing_dilution_contingent;
- customer_supplier_concentration;
- other.

The first four axes are mandatory before a High-priority selection. They are generic
research prompts, not hard screens. A company may be leveraged, acquisitive or exposed to
refinancing and still be investable; the requirement is that the risk was actively
retrieved, understood and reflected in quality/downside judgments.

### High-priority adversarial gate

Before a memo may be High-priority selection:

1. adversarial search completeness must be complete;
2. all four mandatory company-risk axes must be present with dated evidence;
3. none of those mandatory axes may remain unresolved or be material_risk;
4. the strongest counter-thesis severity must be low or moderate, never high/fatal;
5. thesisImpact may be none or tighten_downside, never downgrade_quality/block_primary;
6. the test must conclude clear_to_proceed or proceed_with_caveats;
7. clear_to_proceed requires low counter-thesis severity and no thesis impact;
8. proceed_with_caveats requires a moderate counter-thesis that is explicitly carried
   into downside analysis rather than ignored.

A Research selection may preserve partial, unresolved or material adverse evidence. That is
often the correct outcome when the positive causal chain is interesting but company risk is
not yet fully underwritten.

### Evidence-search discipline

For a prospective Primary company, actively search for thesis breakers such as:

- leverage, short-term debt, liquidity and refinancing pressure;
- debt-funded expansion, acquisitions, goodwill and impairment risk;
- governance, related-party transactions and controlling-shareholder risk;
- dilution, pledges, guarantees, contingent liabilities and capital calls;
- customer/supplier concentration or dependence on one regulatory/input channel;
- accounting quality, receivables, cash conversion and working-capital stress.

Prefer company filings, exchange inquiries, credit-rating reports and other first-party
records. Use independent reputable reporting to discover or corroborate the strongest
counter-thesis where available.

**Absence of found bad news is not evidence of safety unless the search itself is
documented.**

### What V1.7 does not change

V1.7 does not:

- loosen or tighten valuation thresholds;
- add a new timing route;
- change V1.6 causal-state logic;
- change company-engine override or base-horizon-convexity rules;
- force rejection merely because a risk exists;
- implement post-entry dynamic re-underwrite.

Post-entry re-underwrite is intentionally kept as a separate evaluation/tooling track so
future holdouts can identify whether improvement comes from better entry research or better
monitoring.

### Anti-overfitting

Do not:

- encode any debt, leverage, goodwill or liquidity threshold from one historical company;
- create a paper, M&A, tariff or sector-specific exception;
- assume low valuation compensates for unsearched company risk;
- mark an axis clear using only the bullish source pack;
- lower a Research memo to No selection merely to make a historical return look better;
- use later returns to decide which counter-evidence should have mattered.

The purpose is research completeness: retrieve the strongest plausible counter-case before
allowing Primary.

## V1.6 causal state-variable / stock-flow lead-lag contract

V1.6 keeps every V1.5 selection, timing, expectation, expression-quality and base-horizon
convexity rule unchanged. It adds one generic causal diagnostic for a different failure class:

**the downstream flow variable can temporarily move opposite to the economically upstream
state variable that determines future supply, demand or earnings.**

Examples of state variables include productive capacity, breeding stock, installed base,
inventory, order backlog, qualified supplier count, active users or other accumulated system
states. Examples of downstream flow variables include spot price, current shipment, revenue,
current utilization or current consumption.

The Skill must not assume that the current flow variable is always the earliest or best
fundamental signal.

### Mandatory causalStateVariableTest

Every V1.6 deep memo freezes `causalStateVariableTest`.

It records:

- `applicable`: true / false;
- `systemType`: biological_replenishment / capacity_constrained / inventory_cycle /
  backlog_orderbook / installed_base / other / not_applicable;
- `upstreamState`
  - variable;
  - observedDirection: rising / falling / stable / mixed / unresolved;
  - opportunityImplication: positive / negative / mixed / unresolved;
  - economicRole;
  - adjustmentLag: days / weeks / months / quarters / years / unresolved;
  - evidence refs;
- `downstreamFlow`
  - variable;
  - observedDirection: rising / falling / stable / mixed / unresolved;
  - opportunityImplication: positive / negative / mixed / unresolved;
  - temporaryDistortion;
  - evidence refs;
- `stateFlowRelation`: aligned / state_leads_flow / flow_leads_state /
  conflicted_unresolved / not_applicable;
- `causalLagBridge`: clear / credible / mixed / insufficient;
- `crossSectionalCorroboration`: clear / credible / mixed / insufficient;
- `stateLeadDisposition`: continue_company_mapping / research_only /
  no_selection_independent_blocker / no_selection_state_not_actionable / not_applicable;
- `independentBlockers`;
- falsifier;
- conclusion: state_leads_flow / flow_confirms_state / no_actionable_state_edge /
  unresolved / not_applicable.

### The anti-veto rule

When the frozen evidence supports `state_leads_flow`:

1. the upstream state variable must have clear/credible causal linkage to future earnings;
2. the downstream flow may be temporarily distorted by liquidation, destocking, backlog
   burn, channel filling, accelerated harvesting/slaughter, delayed recognition or another
   explicitly evidenced release mechanism;
3. the current downstream flow **may not by itself force No selection**;
4. the hypothesis must continue to company/value-chain mapping unless an independent
   blocker exists;
5. a No-selection memo is allowed only when either the upstream state itself is not an
   actionable opportunity, or the memo freezes at least one independent blocker unrelated
   to the lagging flow variable.

Independent blockers may include:
- no investable listed expression;
- balance-sheet/survival failure;
- fully-priced expectations;
- adverse timing with no valid override;
- missing direct exposure;
- no earnings-conversion bridge after company mapping;
- other explicit fatal flaws already recognized by V1.5.

### What this test does not do

`state_leads_flow` is **not** a promotion route.

It does not override:
- expectation burden;
- timing;
- valuation;
- downside containment;
- direct exposure;
- earnings conversion;
- balance-sheet/survival;
- company-engine override rules;
- base-horizon convexity rules.

Equity price strength may corroborate the state-variable thesis but cannot substitute for
the state evidence itself.

### Anti-overfitting

The 2018Q4 historical diagnostic that motivated this rule may define the failure class but
cannot validate V1.6.

Do not:
- add a pork, disease or agriculture exception;
- hard-code breeding-stock, inventory or capacity thresholds from one case;
- assume every falling state variable is bullish;
- infer the magnitude of a later price move from an upstream state change;
- treat market-price breadth as primary fundamental evidence.

V1.6 must be frozen and tested unchanged on a different untouched historical or forward
window before this mechanism is treated as validated.

## V1.5 base-horizon convexity contract

V1.5 keeps every V1.4 hypothesis-decomposition, evidence-horizon, leader-divergence,
high-absorption, expression-quality and opportunity-first rule. It adds one narrow
High-priority route for a failure class that V1.4 can identify but cannot act on:

**an opportunity can have weak long-run duration while still having a strong, measurable
earnings realization inside the memo's pre-registered base horizon.**

This is not a generic short-term trading route. It exists only when the evidence shows that
the earnings/order/price catalyst should realize before the known normalization or expiry
risk becomes dominant.

### New timing route

A selected memo may declare:

- `sector_confirmed`;
- `company_engine_override`;
- `base_horizon_convexity`;
- `research_only`.

`base_horizon_convexity` is available only in V1.5+.

### Mandatory baseHorizonConvexityTest

Every memo using `base_horizon_convexity` freezes:

- `bridgeStatus`: realized / quantitatively_bridged;
- `freshIncrementalEvidence`: clear / credible / mixed / insufficient;
- `baseHorizonExpectationGap`: clear / credible / mixed / insufficient;
- `catalystWithinBase`: clear / credible / mixed / insufficient;
- `catalystLatestTradingDays`;
- `reunderwriteTradingDays`;
- `normalizationEarliestTradingDays`;
- `normalizationRisk`: low / moderate / high;
- `exitDiscipline`;
- `falsifier`;
- evidence refs;
- conclusion: clear_route / credible_route / no_route / not_applicable.

The timing integers must satisfy:

`catalystLatestTradingDays <= reunderwriteTradingDays <= normalizationEarliestTradingDays`

and `reunderwriteTradingDays` may not exceed the memo's pre-registered
`expectedRealization.baseTradingDays` or `decisionValidityTradingDays`.

This forces the Skill to prove that the catalyst is expected to occur before the reason for
the short thesis to expire.

### High-priority gate for base-horizon convexity

A High-priority `base_horizon_convexity` memo requires all of the following:

- hypothesis is well-scoped under V1.4 decomposition;
- evidence-horizon conflict is explicitly decomposed, not unresolved;
- earnings conversion is `realized` or `quantitatively_bridged`;
- fundamental impulse is accelerating or persistent;
- earnings-revision breadth is broad-positive or narrow-positive;
- broad price regime is favorable or neutral, never adverse/unresolved;
- expectation burden is `room` or `tight`, never fully-priced/unresolved;
- incremental earnings-path advantage is clear or credible;
- duration risk may be high, but not unresolved;
- expectation-path overall may be mixed only because later normalization is explicit;
- quality floor passes;
- valuation slack is room or tight, never none/unresolved;
- catalyst reachability is clear or credible;
- downside containment remains clear or credible;
- at least one acceptable expression passes every V1.3 expression-quality requirement;
- fresh incremental evidence, base-horizon expectation gap and catalyst-within-base are
  each clear or credible;
- the route conclusion is clear_route or credible_route;
- a forced re-underwrite / exit discipline is written before reveal.

### What the route may override

Only for a valid `base_horizon_convexity` High-priority memo:

- event half-life may be short-lived;
- late-cycle risk may be high;
- expectation-duration risk may be high;
- expectation-path overall may be mixed because the later-period path normalizes.

It does **not** override:

- direct exposure;
- earnings conversion;
- balance-sheet/survival;
- downside containment;
- fully-priced expectation burden;
- adverse broad timing;
- missing revision breadth;
- missing fresh information;
- unresolved hypothesis decomposition;
- unresolved horizon conflict.

### Anti-overfitting

The 2019Q3 ETC/cobalt/pork diagnostics motivated this failure class but do not validate
V1.5. Do not add named sectors, stocks, valuation cutoffs, momentum thresholds or fixed
calendar deadlines from those cases.

V1.5 must be frozen and tested unchanged on a different untouched window before this route
is treated as validated.

## V1.4 hypothesis-resolution / multi-horizon evidence contract

V1.4 keeps every V1.3 selection, earnings-conversion, expectation-path, timing, price-
absorption and acceptable-expression rule. It changes the **unit of reasoning before those
gates are applied**.

Historical diagnostics exposed a general failure class: evidence that belongs to different
products, customers, companies or time horizons can be aggregated into one broad thesis and
then incorrectly cancel itself. Examples include:
- one memory product subcycle improving while another remains weak;
- short-term sector demand contracting while a multi-year policy path improves;
- the industry average weakening while a leader is gaining share and accelerating earnings;
- a heavily rerated theme receiving genuinely new product/company evidence rather than mere
  repetition of the original story.

V1.4 does **not** make any of those situations automatically investable. It requires the AI
to decompose and preserve them so the existing V1.3 gates judge the correct hypothesis.

### Mandatory hypothesis decomposition audit

Every memo freezes `hypothesisDecompositionTest`:
- `unitOfAnalysis`: single_product_market / multi_product_split /
  company_specific_divergence / aggregate_sector / other;
- `productMarketScope`;
- `geographicScope`;
- `customerScope`;
- `decompositionNeeded`;
- `siblingHypothesisIds`;
- rationale and evidence refs;
- conclusion: well_scoped / split_required / unresolved.

Split when materially different subgroups have different:
- price or inventory cycles;
- end-demand direction;
- customer or geography exposure;
- earnings transmission;
- policy horizon;
- company share/quality behavior.

A selected memo must be `well_scoped`. If the evidence says `split_required`, create
separate sibling hypotheses and do not select from the unresolved aggregate.

### Mandatory evidence-horizon matrix

Every memo freezes `evidenceHorizonMatrix` with three independent rows:
- `nearTerm`: current physical/operating conditions;
- `mediumTerm`: earnings conversion over the thesis horizon;
- `structural`: policy, technology, capacity, market-share or business-model duration.

Each row records direction (positive / negative / mixed / unresolved), driver, horizon and
evidence refs.

Also record:
- `conflictType`: none / aligned / time_horizon_conflict /
  company_sector_conflict / multi_axis_conflict / unresolved;
- `resolutionRule`: how the conflict is decomposed rather than averaged away;
- conclusion: coherent / decomposed / unresolved.

A negative near-term sector statistic may not silently veto a positive structural/company
hypothesis. Conversely, a long-term policy goal may not erase current earnings damage.
They must become separate causal claims with separate falsifiers.

### Mandatory leader-divergence test

Every memo freezes `leaderDivergenceTest`:
- sectorSignal: positive / negative / mixed / unresolved;
- companySignal: positive / negative / mixed / unresolved;
- divergence: none / leader_outperforming_sector / leader_underperforming_sector /
  unresolved;
- companyEvidenceConclusion: clear / credible / mixed / insufficient;
- rationale and evidence refs.

This does not reward famous leaders. A leader-specific thesis requires verified share,
revenue, profit, cash-flow, order or customer evidence. Price strength alone is not a
company signal.

### High-absorption continuation diagnostic

Every selected memo freezes `highAbsorptionContinuationTest`.

When price absorption or late-cycle risk is high, the test must distinguish:
1. **fresh incremental information** that changes the earnings path; from
2. **confirmation-only information** that repeats an already-priced narrative.

Record:
- applicable;
- absorptionState: low / moderate / high / extreme / unresolved;
- freshIncrementalDriver;
- realizedEarningsSupport;
- revisionVelocity;
- durationMechanism;
- narrativeRepetitionRisk;
- falsifier;
- conclusion: credible_continuation / mixed / confirmation_only / insufficient /
  not_applicable.

V1.4 does **not** use this diagnostic as a new High-priority override. Existing V1.3
expectation-path and late-cycle gates remain binding until an independent holdout supports
a generic override.

### Expression purity is not an objective

Every selected memo freezes `expressionPurityTest`:
- preferredTicker;
- purestTicker, if identifiable;
- purityIsDecisionDriver;
- expectationBurdenComparison;
- earningsQualityComparison;
- downsideComparison;
- evidence refs;
- conclusion: balanced / purity_bias_risk / insufficient.

The purest thematic company must not be preferred merely because the causal story is easier
to narrate. Directness, earnings conversion, expectation burden, balance sheet and downside
containment remain co-equal. A diversified expression is not automatically safer or better;
the choice must be evidenced.

### V1.4 anti-overfitting rule

The historical windows that motivated these diagnostics may define the failure classes but
may not validate V1.4. Do not:
- add sector names or named-stock exceptions;
- add return, PE or momentum thresholds learned from those windows;
- promote a high-absorption stock merely because later returns were strong;
- reinterpret a previously frozen historical selection.

Freeze V1.4 and test it unchanged on a different historical/forward window before changing
promotion gates.

## V1.3 opportunity-first / acceptable-expression contract

V1.3 keeps every V1.2 fundamental, timing, earnings-conversion, expectation-path and
price-absorption rule. It changes one selection objective:

**The Skill must capture the right opportunity with a sound listed expression; it does not
need to identify the single best-performing peer.**

### Why this change exists

Historical diagnostics showed several cases where:
- the opportunity direction was correct;
- the frozen selected company produced strong benchmark-relative returns;
- another peer happened to outperform it over the base horizon.

Treating those cases as selection failures over-optimizes exact peer ranking and can suppress
valid opportunities. V1.3 therefore separates:
1. opportunity quality;
2. expression adequacy;
3. preferred-expression ranking.

### Mandatory equity-return archetype

Every selected company is labeled before reveal:
- `ordinary_growth_compounder`;
- `cyclical_growth_hybrid`;
- `deep_cycle_turnaround`;
- `durable_cash_yield`;
- `other`.

This is a research lens, not an automatic override. A durable-cash-yield stock must not be
judged only by EPS acceleration; a growth compounder must not be excused from valuation
or earnings-path discipline merely because its industry is structural.

### Acceptable expression set

Every selected memo freezes `acceptableExpressionSet` with 1-3 listed expressions.
Each entry records:
- ticker;
- role: `preferred` or `acceptable`;
- directExposure;
- earningsConversion;
- balanceSheetOrSurvival;
- expectationFit;
- downsideContainment;
- conclusion: `acceptable / borderline / reject`;
- rationale and evidence refs.

There may be at most one `preferred` expression.

High-priority requires at least one `acceptable` expression. An acceptable expression must
have direct exposure, earnings conversion and expectation fit that are clear/credible, a
pass/borderline survival or balance-sheet assessment, and clear/credible downside
containment.

### Peer ranking is secondary

Matched controls remain mandatory diagnostics. They still answer:
- did we choose a weak expression?
- was there a better peer?
- what switch condition would make another peer preferable?

But V1.3 no longer requires the preferred expression to beat every frozen control on net
asymmetry. For High-priority:
- `selected` or `mixed` pairwise asymmetry is allowed;
- `control` or `insufficient` is not;
- the expression may be good-enough without being peer-best.

This does **not** relax:
- earnings-conversion requirements;
- expectation-burden/path requirements;
- timing and late-cycle rules;
- turning-point survival rules;
- company-engine override rules;
- future-leakage controls.

### Opportunity-first evaluation

The base-horizon evaluation emphasizes:
1. whether the opportunity/hypothesis basket beats the benchmark;
2. whether the selected expressions are positive benchmark-relative contributors;
3. whether any selected expression contains a clear fatal flaw.

Best-control rank remains a secondary diagnostic, not the primary success definition.

Do not call a direction a failure merely because a frozen peer did better.
Do call it a failure when the chosen expression is clearly inferior ex ante, breaks the
earnings bridge, or produces a poor opportunity-level result.

## V1.2 expectation-path / duration contract retained in V1.3

V1.2 keeps every V1.1 rule and adds one generic requirement for selected companies:
**point valuation and current earnings are not enough to establish expectation room.**

Before reveal, the Skill must freeze:
1. what earnings path the market already appears to expect;
2. how the thesis changes the near, next and later portions of that path;
3. whether the incremental path improvement is actually new;
4. how much duration risk remains.

This rule was motivated by development-only failures in premium growth and cyclical
super-profit cases, plus a positive cyclical counterexample. Those windows may define the
failure class but may not validate V1.2.

### Required `expectationPathTest`

For every selected company record:

- `baselinePath`
  - `basis`: published_forecast / consensus / guidance / prior_run_rate /
    normalized_cycle / other;
  - `nearTerm`;
  - `nextPeriod`;
  - `laterPeriod`;
  - rationale and evidence refs.
- `thesisPath`
  - `nearTermChange`;
  - `nextPeriodChange`;
  - `laterPeriodChange`;
  - mechanism and evidence refs.
- `pathShape`: long_duration_growth / peak_cycle_decline / stable_compound /
  turnaround / uncertain.
- `incrementalPathAdvantage`: clear / credible / mixed / insufficient.
- `durationRisk`: low / moderate / high / unresolved.
- falsifier.
- overall: clear_path_room / credible_path_room / mixed / insufficient.

### High-priority gate

A High-priority selection requires:
- an explicit frozen baseline across near / next / later periods;
- a clear or credible **incremental earnings-path advantage**;
- low or moderate expectation-duration risk;
- clear_path_room or credible_path_room overall.

The thesis must improve the expected path relative to the market baseline. It is not enough
to show that:
- the current quarter is excellent;
- current-year PE is low;
- the stock has de-rated;
- a commodity shortage or product cycle persists for one more quarter;
- current earnings beat a backward-looking baseline.

### What V1.2 is not

V1.2 does **not** introduce a PE, PEG, growth-rate, momentum or drawdown threshold.

It must allow:
- a low-PE cyclical stock when the thesis improves the duration and normalized earnings path;
- a high-quality growth company when future growth still exceeds what the premium already
  capitalizes;
- a sustained-strength stock when the future path still contains genuine incremental room.

It must block High-priority when the thesis merely extends a known near-term super-profit
while the frozen next/later path already normalizes, or when the premium already embeds
exceptional multi-year growth and the thesis adds no new duration evidence.

### Relationship to V1.1 price absorption

V1.1 asks **when** the price recognized the information.
V1.2 asks **how much future earnings duration** the market already capitalized.

Both remain necessary:
- price direction cannot substitute for earnings-path analysis;
- earnings-path room cannot excuse a late-reversal company-engine override;
- a low multiple cannot substitute for a durable path advantage.

## V1.1 expectation-absorption directionality retained in V1.2

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
