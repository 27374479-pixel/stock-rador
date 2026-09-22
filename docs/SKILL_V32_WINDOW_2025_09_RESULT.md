# Skill V3.2 window result: 2025-09

This extension window is now **consumed**. Only the frozen Candidate, 三美股份, had its post-signal path opened. 巨化股份 remains outcome-unopened.

## Integrity

- research finalization commit: `7ee38cbf33f22af3f7cd7dfdda81fd92e5a2e10d`
- selection lock JSON commit: `681113bcc147a292a51d0ec5c521b58616d03d79`
- selection lock Markdown commit: `bbec37a93dd69707893ffbf5a159ee0cb9a4158b`
- outcome evaluator commit: `dfcce44a42b455b1ca2ad8ff68cc4c3ec7d7bc43`
- outcome workflow run: 35716993430
- outcome artifact: 10690031736
- outcome digest: `sha256:aa5710e6c531624a4776009b6d51a59559ae2b0f864dbafddcecd8ebafb6a40d`

## Frozen decisions

- HFC refrigerant quota tightness / September price step-up: **Candidate — 三美股份 (603379.SH)**.
- 巨化股份 remained Watch and its post-signal future was not opened.
- Grasberg temporary copper disruption: **NO TRADE** because outage duration/tonnage loss was not measurable without later information.
- China soybean origin shift: **NO TRADE** because no clean direct A-share beneficiary was established.

The refrigerant thesis was classified before outcomes as **structural-multi-year**, with an expected research horizon of **120–250 trading days**.

## Outcome

| Frozen candidate | 20d excess | 60d excess | 120d excess | 250d excess | Max DD observed |
| --- | ---: | ---: | ---: | ---: | ---: |
| **三美股份** | **-6.9%** | **-1.8%** | **+17.0%** | **-7.4%** | about -9.0% |

The thesis worked at the lower edge of the predeclared structural horizon, but failed to preserve excess return through 250 trading days.

## What happened after selection

The operating thesis itself did not immediately break.

- 2025 full-year attributable net profit later reached about RMB2.06bn, up roughly 165%.
- 2026Q1 attributable net profit was about RMB506m, still up about 26%, and the company said higher selling prices remained the main driver.
- 2026Q1 refrigerant average selling price was about RMB46,534/t, up about 24% YoY and about 15% QoQ.
- By 2026H1, attributable net profit was about RMB1.07bn, only about 7.6% above the prior year, while operating cash flow was down about 12% YoY.

So the 250-day deterioration was not a simple case of the regulatory regime disappearing. It was a **growth-rate / expectation transition**: the quota regime and high price level persisted, but incremental earnings acceleration slowed sharply.

## Learning classification

This reveals a distinction that V3.2 only partially captured:

> A structural regime can remain intact while the stock's incremental alpha disappears because the **rate of earnings surprise** decelerates.

The existing horizon bridge asks whether the causal mechanism survives, but that is not always enough. A stock can move from:
- structural scarcity + accelerating earnings surprise,
to
- structural scarcity + high but fully expected earnings,
without the physical regime reversing.

This is different from the 2025-06 shipping miss. Shipping failed because the catalyst was already anticipated and short-lived. Refrigerants produced positive 120-day excess, then lost it as earnings growth normalized.

## Forward-only process improvement

For future structural Candidates, add a **causal checkpoint protocol** before the outcome is known:

- declare one or more re-underwriting checkpoints;
- state which company/industry variables must still be improving or at least not decelerating beyond the thesis;
- distinguish “physical regime intact” from “incremental earnings surprise still alive”;
- allow a checkpoint decision of Continue / Downgrade / Exit;
- freeze each checkpoint decision before opening the next segment of price outcomes.

This is a process improvement, not a fitted 120-day sell rule.

2025-09 is not rescored.
