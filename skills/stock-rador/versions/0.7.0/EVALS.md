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
