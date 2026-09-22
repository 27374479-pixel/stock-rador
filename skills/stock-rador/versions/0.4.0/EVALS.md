# Stock Rador v0.4 evaluation protocol

## Purpose

V0.4 is designed to distinguish three different abilities that earlier runs could mix:

1. discovering a real economic change;
2. identifying a value chain / industry that later performs;
3. selecting the right listed company within that opportunity set.

Beating a broad index can support (1) or (2), but it is not enough to prove (3).

## Frozen artifacts before reveal

Every historical or forward run freezes:
- skill/version;
- model/reasoning setting;
- discovery window and query policy;
- source pack;
- one screening decision + reason code for every reviewed item;
- all serious opportunity memos;
- researchReadyAt / actionableAt;
- expected realization horizons;
- matched controls and near-miss companies;
- identity/memory stress artifact for historical replay;
- collector, lock, price-fetch and evaluator implementation files.

Any mutation after lock invalidates the run.

## Screening audit

Every reviewed item has exactly one record:
- itemId;
- decision: reject / promote / duplicate;
- primary reasonCode;
- optional secondary reason codes;
- concise rationale.

The denominator is mandatory. A report that contains only promoted ideas cannot establish
discovery precision or false-positive rate.

## Matched controls

For every High-priority company freeze 2-5 controls when feasible:
- peer: comparable company in same industry/end market;
- near_miss: company considered for the same thesis but rejected for weaker exposure,
  expectations, valuation or execution;
- sector_proxy: listed proxy when close peers do not exist.

Controls are selected before outcome reveal and cannot be replaced after returns are known.

The memo must explain why each control is fair and why the selected company should
outperform it if the thesis is correct.

## Outcome metrics

For every selected ticker and pre-registered horizon report:
- net return after frozen transaction-cost assumptions;
- excess vs broad benchmark;
- matched-control equal-weight basket return;
- excess vs matched-control basket;
- rank among selected + controls;
- rank percentile;
- close-path max drawdown;
- execution warnings.

The thesis-base horizon, frozen before reveal, is the primary horizon.

## Primary metrics

For High-priority signals:
- mean thesis-base broad-benchmark excess;
- mean thesis-base matched-control excess;
- matched-control hit rate;
- mean rank percentile;
- count of actionable hypotheses.

The primary selection-alpha metric is matched-control excess, not broad-index excess.

## Interpretation labels

Use these labels after reveal:

### selection_alpha_supported
The selected company beats both the broad benchmark and matched-control basket at the
pre-registered base horizon, and the fundamental thesis remains coherent.

### sector_beta_only
The selected company beats the broad benchmark but not the matched-control basket.

### thesis_right_stock_wrong
The economic change is supported, but a frozen control/near-miss captures the economics
better than the selected company.

### timing_wrong
The thesis may be valid but the pre-registered realization window does not capture the
expected mechanism.

### thesis_invalidated
The event, causal chain, exposure or expectation-gap thesis is contradicted by later
evidence.

### unresolved
Evidence is not sufficient to classify.

Price performance never substitutes for causal verification.

## Historical memory stress

Historical replay is vulnerable to model-weight leakage.

Before reveal, record an identity-reduced stress artifact. Depending on the case:
- hide ticker/company names during event triage;
- compare anonymized companies A/B/C from point-in-time evidence;
- shuffle candidate order;
- document which decisions survive the masking.

Statuses:
- passed;
- failed;
- not_feasible, with explanation.

A passed stress test does not eliminate model-memory risk. A failed test reduces confidence.
Forward-frozen samples remain the strongest evidence.

## Anti-overfitting rules

Never change the next version because:
- a specific winning sector did well;
- one rejected stock later rallied;
- one horizon happened to maximize return;
- a particular PE/growth threshold fits past winners.

Only generalizable failure classes can justify a change:
- false event;
- duplicated evidence;
- broken causal arrow;
- weak exposure;
- immaterial earnings sensitivity;
- expectations already reflected;
- poor valuation/execution;
- control basket shows sector beta;
- selected company underperforms a better near-miss;
- timing mismatch;
- point-in-time leakage.

Every changed rule must be tested on a different holdout period.

## Minimum acceptance questions

Before calling a run valid:
1. Was the discovery window fixed before reveal?
2. Was every reviewed item retained with one frozen decision reason?
3. Were all material facts available by the cutoff?
4. Were actionableAt and thesis horizon frozen before prices?
5. Were matched controls selected before prices?
6. Was the evaluator implementation frozen?
7. Was model-memory risk explicitly recorded?
8. Was a historical identity stress test performed or explicitly marked not feasible?
9. Were all selected and failed cases retained?
10. Are broad-index and matched-control results both reported?
11. Is the primary horizon the pre-registered base horizon rather than the best ex-post one?
12. Is the next skill revision tested on a different period?

If any material answer is no, label the result exploratory rather than validation.
