# V2.1 December 2022 selection lock

**Outcome data is intentionally absent. This is the pre-outcome commit boundary.**

A further contamination safeguard applies in this window: only the frozen selected candidate may have its post-signal prices opened. The futures of Watch candidates remain unopened so they can still be used in later historical windows without known-outcome leakage.

## Antipyretic / ibuprofen stockout — signal 2022-12-08

The physical demand shock was confirmed by independent pharmacy fieldwork and manufacturer checks.

Frozen selection:

| Candidate | V2.1 score | Prior 60d | Prior 180d | Priced-in | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| **亨迪药业 301211.SZ — primary pick** | **21** | +95.9% | +32.3% | 9 | Candidate |
| 新华制药 000756.SZ | 18 | +69.4% | +282.5% | 11 | Watch |
| 特一药业 002728.SZ | 16 | +156.7% | +99.0% | 10 | Watch |
| 华润三九 000999.SZ | 14 | +53.2% | +78.2% | 6 | Watch |

亨迪药业 passes narrowly despite a very large prior 60-day move because the frozen V2.1 rule still gives substantial weight to direct ibuprofen exposure, materiality and the ability to supply the bottleneck. We do **not** revise that rule after seeing this selection; the point of this window is to test the already-frozen model.

新华制药 and 特一药业 are rejected mainly because the shortage narrative was already heavily reflected in their prior price action. 华润三九 fails the immediate monetization/readiness gate.

## PV polysilicon price reversal — signal 2022-12-12

The polysilicon price decline was confirmed, but the frozen decision is **NO TRADE**. Falling upstream costs could help module makers, but module ASP declines, high-cost inventory and uncertain end demand made the durable margin-capture bridge ambiguous at the cutoff.

## Integrity record

Selection workflow run: 35687873486  
Selection artifact: 10677475885  
Artifact digest: `sha256:ca4606f4ab16dfe098e06abd6964f8468f196cec55e686053c5057edbe4dda11`

All price requests in the selection freezer ended on or before the signal date. Post-signal evaluation is now allowed **only for 亨迪药业**. Watch-candidate futures remain unopened.
