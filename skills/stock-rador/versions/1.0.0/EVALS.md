# Stock Rador v1.0 evaluation protocol

## What v1.0 is testing

V1.0 tests one narrow question only:

Can a strict, pre-reveal company-engine timing override rescue genuine company-specific
earnings opportunities that are hidden by a neutral/adverse broad sector regime **without**
opening the gate to generic contrarian or falling-knife selections?

The mechanism was motivated by two independent v0.9 historical diagnostics:
- 2025Q1 新易盛;
- 2025Q2 阳光电源.

Those periods are development evidence only. They may not be used to claim v1.0 works.

## Required comparison

For every company-engine override, report after reveal:
1. whether the frozen realized earnings engine persisted;
2. whether broad timing remained weak or subsequently recovered;
3. selected return versus benchmark;
4. selected return versus every frozen control;
5. whether the company-specific catalyst occurred inside the base horizon;
6. whether the pre-registered falsifier fired.

## Failure labels

- company_engine_override_right
- sector_gate_right_override_wrong
- false_company_engine_divergence
- company_fundamentals_deteriorated
- override_asymmetry_wrong
- broad_sector_recovered_no_override_needed
- research_only_correct
- unresolved

## Anti-overfitting

Do not tune the override using Q1/Q2 2025 outcomes. Do not require a fixed return, PE,
growth rate, or price-momentum threshold. The next validation window must be independent.

# Stock Rador v0.9 evaluation protocol

## What v0.9 is testing

V0.9 keeps v0.8 timing/asymmetry and adds two pre-reveal disciplines:

1. **Direct earnings conversion** — low valuation, backlog or low expectations do not count
   as revision headroom unless a frozen operating variable can directly reach earnings
   inside the base horizon.
2. **Turning-point convexity** — weak trailing profit quality may coexist with a valid
   cyclical inflection, but only when survival, the inflection and operating leverage are
   independently evidenced.

The 2025Q3 v0.8 run is development evidence only and cannot validate v0.9.

## Why this distinction matters

Operating leverage can make a relatively small change in price, volume, spread or
utilization produce a much larger change in profit when fixed costs are substantial.
Research documents a relation between operating leverage and expected returns, but that
relation is not monotonic in every setting and can be altered by downside/abandonment
options. Analyst forecast errors and revisions also contain price-relevant information.

V0.9 therefore does **not** rank companies by "more operating leverage is better." It
requires:
- a measurable pre-cutoff inflection;
- explicit profit sensitivity;
- survival through the realization window;
- acceptable working-capital risk;
- favorable timing and price-relative asymmetry.

References:
- Novy-Marx, "Operating Leverage", Review of Finance (2011):
  https://doi.org/10.1093/rof/rfq019
- García-Feijóo & Jorgensen, operating-leverage / stock-return evidence and downside
  optionality discussion:
  https://doi.org/10.1016/j.frl.2011.01.002
- Beaver, McNichols & Rhie, forecast errors/revisions and price effects:
  https://doi.org/10.1016/j.jacceco.2007.11.001

## Required decomposition after reveal

For every v0.9 selection report separately:
1. opportunity correctness;
2. timing correctness;
3. earningsConversionBridge correctness;
4. archetype correctness;
5. pairwise asymmetry correctness;
6. base-horizon realized return / benchmark excess / control excess.

For `turning_point_convexity`, also report whether the frozen inflection and operating-
leverage bridge actually appeared in financial statements.

## Postmortem labels

- direct_conversion_right
- conversion_proxy_failed
- turning_point_convexity_right
- false_turning_point
- survival_floor_failed
- working_capital_tail_risk
- quality_revision_right
- quality_right_convexity_missed
- base_horizon_right_later_reranking
- unresolved

## Decision expiry

The selection contract expires at the base thesis horizon. A 120-day result does not
retroactively invalidate a correct 60-day decision, and a 120-day winner does not rescue a
failed 60-day thesis. Any continuation beyond the base horizon must be treated as a fresh
research decision.

## Anti-overfitting

Do not tune numeric:
- operating-leverage thresholds;
- margin-turn thresholds;
- loss/profit thresholds;
- liquidity ratios;
- PE cutoffs;
- momentum cutoffs

from a named historical winner. Use causal, relational evidence and test any revised rule
on a different holdout or forward-frozen sample.

# Stock Rador v0.8 evaluation protocol

## What v0.8 is testing

V0.8 adds two gates without deleting the v0.7 expectation-reset discipline:

- **Opportunity Timing Gate** — distinguish a good company inside a bad industry/opportunity
  regime from a genuinely favorable setup.
- **Cross-sectional Asymmetry Gate** — rank acceptable-quality companies by unreflected
  revision headroom and price-relative payoff, not by absolute business quality.

The motivating 2026Q2 run is development evidence only. V0.8 must be frozen first and
tested on a different historical/forward window.

## Research grounding

Industry momentum is well documented: Moskowitz and Grinblatt (1999) found that industry
components account for a large share of individual-stock momentum. Earnings/forecast
research also shows that delayed analyst revisions can contribute to subsequent drift,
while faster analyst response moves more of the reaction into the event window. Hui and
Yeung (2013) specifically document underreaction to persistent industry-wide earnings
information.

These findings do **not** imply guaranteed momentum profits. A 2026 study finds that
longer-horizon post-earnings drift can be absorbed by expected-return components. V0.8
therefore treats timing and revision breadth as risk/selection diagnostics, not as an
automatic trading rule.

References:
- Moskowitz & Grinblatt (1999), "Do Industries Explain Momentum?":
  https://doi.org/10.1111/0022-1082.00146
- Zhang (2008), "Analyst responsiveness and the post-earnings-announcement drift":
  https://doi.org/10.1016/j.jacceco.2008.04.004
- Hui & Yeung (2013), "Underreaction to Industry-Wide Earnings and the Post-Forecast Revision Drift":
  https://doi.org/10.1111/1475-679X.12006
- Hosseinkhani (2026), "Earnings Surprise Returns or Expected Compensation?":
  https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6440878

## Required post-reveal decomposition

Evaluate four questions separately:
1. Was the opportunity hypothesis right?
2. Was the selected company better than the frozen alternatives?
3. Was the pre-cutoff opportunity timing favorable?
4. Did the selected company have the best frozen asymmetry?

Do not call a High-priority signal successful merely because it beat controls while losing
materially to the broad benchmark. That is `selection_right_timing_wrong`, not a clean hit.

Do not call a Research rejection wrong merely because the company rose. If a frozen
alternative had materially better asymmetry, the stock-level ranking may still have been
wrong even when the industry thesis was right.

## New postmortem labels

- opportunity_right_selection_right_timing_right_asymmetry_right
- opportunity_right_selection_right_timing_wrong
- opportunity_right_selection_wrong_asymmetry_wrong
- quality_right_asymmetry_wrong
- asymmetry_right_quality_floor_failed
- timing_gate_saved_drawdown
- timing_gate_missed_early_turn
- no_clean_expression
- unresolved

## Anti-overfitting

Do not tune:
- the 20/60 lookbacks;
- the 50% breadth split;
- valuation thresholds;
- return thresholds;
- sector lists;
- named-company exceptions

on the same run used to expose a failure. Any revision must be tested on another holdout or
a forward-frozen sample.

# Stock Rador v0.7 evaluation protocol

## What V0.7 changes

V0.7 does **not** relax the expectation-burden gate. It distinguishes a missing measurement
from genuinely conflicting evidence.

The hypothesis being tested is narrow: when a company has newly **realized** fundamental
acceleration and a lagging pre-cutoff earnings baseline, exact valuation/consensus data may
be incomplete without making the opportunity unknowable.

This idea is consistent with the broader earnings-information literature, but the Skill
does not assume that post-announcement drift is free alpha. Jegadeesh and Livnat (2006)
found that revenue surprises aligned with earnings surprises were associated with stronger
post-earnings drift, while research on analyst responsiveness shows that faster forecast
revision reduces subsequent drift. A 2026 paper also argues that longer-horizon drift can be
absorbed by expected-return components. V0.7 therefore uses expectation-reset evidence only
to judge **information completeness**, never as a guaranteed return mechanism.

References:
- Jegadeesh & Livnat, "Post-Earnings-Announcement Drift: The Role of Revenue Surprises":
  https://papers.ssrn.com/sol3/papers.cfm?abstract_id=903767
- "Analyst responsiveness and the post-earnings-announcement drift":
  https://www.sciencedirect.com/science/article/pii/S0165410108000220
- Hosseinkhani (2026), "Earnings Surprise Returns or Expected Compensation?":
  https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6440878

## V0.7 anti-overfitting rule

The 2026Q1 diagnostic that motivated this change is **development evidence only**. It may
define the general failure class, but it may not be used to claim that V0.7 works. V0.7 must
be frozen first and evaluated on a different holdout/forward window.


## What V0.7 adds

V0.5 separated opportunity quality from company-selection quality.
V0.7 adds a third independent question:

**How much favorable performance is the current price already demanding?**

A company can have:
- a real opportunity;
- a credible advantage versus peers;
- but still be a poor selection because the valuation already requires an extreme outcome.

## Three gates

### 1. Hypothesis gate
Is the economic change real, persistent, material and not already fully reflected at the
industry/opportunity level?

### 2. Selection gate
Does one listed company have a defensible cross-sectional advantage versus frozen peers /
near-misses / sector proxies?

### 3. Expectation-burden gate
Does the cutoff price leave enough room for the thesis to create incremental earnings or
expectation change versus the strongest alternative?

Only when all three gates support the selection may a company be High-priority selection.

## Mandatory expectationBurdenTest

For every selected company record:
- valuationMethod;
- referencePriceAtCutoff;
- marketBaseline;
- thesisScenario;
- breakevenCondition;
- ordinaryScenarioFailure;
- catalystOrTimingBridge;
- evidenceRefs;
- conclusion: room / tight / fully_priced / unresolved.

The burden test should use a valuation basis appropriate for the business. Do not compare
companies mechanically on PE when earnings cyclicality, balance-sheet structure or asset
economics make PE misleading.

Do not use a precise DCF merely to manufacture certainty. Ranges and economically explicit
operating conditions are preferred to false precision.

## High-priority rules

A High-priority selection:
- cannot have fully_priced or unresolved expectation burden;
- may have room;
- may have tight only when a specific timing/catalyst bridge explains how the gap can
  become visible inside the pre-registered realization window.

No universal PE, growth, margin or FCF threshold is allowed.

## Switch conditions

Every pairwise control comparison must record a switchCondition:
the observable evidence that would make the control preferable to the selected company.

This forces the researcher to state what could change the ranking before returns are known.

Examples:
- control receives materially stronger order evidence;
- selected consensus revisions catch up and remove the expectation gap;
- selected valuation rerates before fundamentals arrive;
- control gains qualification/customer access;
- selected margin bridge fails.

Switch conditions are research falsifiers, not trading triggers.

## Evaluation after reveal

At the frozen base horizon report:
- broad-index excess;
- matched-control basket excess;
- excess versus best control;
- selected rank;
- whether all controls were beaten;
- whether the frozen expectation-burden thesis was actually supported by later
  fundamentals/expectation changes.

Price outperformance alone does not validate the burden model.

## Postmortem labels

- opportunity_right_selection_right_burden_right
- opportunity_right_selection_right_burden_wrong
- opportunity_right_selection_wrong
- opportunity_right_no_selection
- sector_beta_only
- thesis_right_stock_wrong
- fully_priced_at_cutoff
- timing_wrong
- thesis_invalidated
- unresolved

## Anti-overfitting

Never learn a fixed valuation threshold from one run.

Reusable lessons may include:
- the wrong valuation method was used;
- consensus baseline was stale;
- normalized earnings were mis-estimated;
- the selected company required a more extreme scenario than a control;
- catalyst timing did not match the realization window;
- direct thematic exposure was already over-owned/over-discounted.

Any revised rule must be tested on a different historical period or a new forward sample.

## Evidence hierarchy

Forward-frozen evidence remains the strongest validation.
Grounded historical replay is useful for process testing.
Contaminated historical replay is exploratory only.


## Discovery-layer metrics

V0.7 adds a separate discovery report. For each frozen run report:
- source item count;
- unique origin-group count;
- event-cluster count;
- lane coverage and limitations;
- promoted-event count;
- promoted-hypothesis count;
- event-to-hypothesis conversion;
- post-outcome diagnostic recall when the pre-registered audit becomes available.

Do not infer recall from the performance of selected stocks.

### Missed-opportunity audit discipline

The case universe and outcome-based case rule must be frozen before reveal. The audit may
classify misses but may not tune the same run.

A missed case is only a valid discovery failure if it was `detectableExAnte`: there was
sufficient pre-cutoff information to support a causal hypothesis without future outcomes.

The audit output must be labeled
`hindsight_diagnostic_not_alpha_validation`.

A discovery change justified by this audit must be tested on a different holdout or a new
forward sample.
