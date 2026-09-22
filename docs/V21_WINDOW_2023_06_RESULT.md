# V2.1 window result: 2023-06

This window is now **consumed**. All four selected power-infrastructure candidates had their post-signal price paths opened and are quarantined from later untouched historical windows.

## Pre-outcome integrity

The June 2023 selection artifact was produced before any post-signal price retrieval:

- selection workflow run: 35695633937
- selection artifact: 10679848251
- selection digest: `sha256:a93f776043a8b7c7f8c1e42f6f099c4510df66e9d4eaa4c9674f2ad3f73afffb`
- frozen selection commits: `4188d328bb5c7371ef39f6357e7c17147d74560d` and `7c86758650904383f7cb37827c60c057421347f8`
- outcome evaluator commit: `bbe961d8500399c93f43e45aada02c7ba59f7bf1`

Outcome artifact:

- outcome workflow run: 35695798511
- outcome artifact: 10680670580
- outcome digest: `sha256:414242afd0f280b5e79500a079c823866fc0560f85c8d7642de5b9507d19f109`

Trading assumptions remained unchanged: T+1 open, 0.10% transaction cost per side, adjusted prices for returns, unadjusted bars for execution blockers, and CSI 300 benchmark.

## AI-server power-density signal

Frozen primary pick: **欧陆通 (300870.SZ), score 30**.

| Frozen candidate | 20d excess | 60d excess | 120d excess | 250d excess | Max DD observed |
| --- | ---: | ---: | ---: | ---: | ---: |
| **欧陆通** | -13.5% | -19.8% | -13.0% | **-21.6%** | -59.4% |
| 麦格米特 | +11.0% | +5.1% | -6.0% | **-6.8%** | -40.6% |
| 中恒电气 | -0.7% | -6.0% | +6.1% | **-24.8%** | -51.6% |
| 科士达 | +1.8% | -21.6% | -25.2% | **-43.1%** | -56.7% |
| Equal-weight basket | -0.4% | -10.6% | -9.5% | **-24.1%** | -59.4% worst constituent |

The physical signal was not false. AI servers really did require materially more power, and the selected companies genuinely had server/data-center power products before the signal. The failure was in the **company-level earnings bridge**.

V2.1 treated broad segment exposure too generously. For example, 欧陆通's 2022 server-power business was already meaningful and growing quickly, but the point-in-time record did not establish that **AI-specific high-power PSU revenue** was already large enough to materially change company earnings. Likewise, 科士达 and 中恒电气 were exposed mainly to facility-level UPS/HVDC infrastructure, which is adjacent to AI data centers but not the same thing as the per-server power bottleneck.

This distinction is reinforced by the post-consumption 2023 annual report for 欧陆通: server-power revenue ultimately grew strongly, but the high-power server-PSU subset was still a much smaller portion of total company revenue. That later report is diagnostic only; it was not available to the June 2023 selection.

## Advanced-packaging tightness

The CoWoS/advanced-packaging bottleneck was verified, but the frozen decision was **NO TRADE** because no sufficiently clean A-share beneficiary could be mapped without importing later supply-chain knowledge.

No candidate was retroactively inserted after the outcome.

## Interpretation

June is a useful failure because it separates **correct industry direction** from **investable earnings materiality**.

Across the consumed windows, a recurring distinction is now visible:

- successful cases such as PLC substitution, European heat pumps, AI servers and 800G optics had point-in-time evidence that the selected company was already shipping or directly serving the new bottleneck;
- weaker cases such as secondary liquid-cooling mappings and June power infrastructure relied more heavily on broad adjacency, generic segment exposure, or a product category whose AI-specific contribution was not yet demonstrably material;
- the antipyretic miss showed that even direct exposure can fail when the demand shock is short-lived and heavily priced.

This is enough multi-window evidence to justify a **forward-only V2.2 change** focused on incremental earnings materiality and shipment/order proof. Old windows will not be rescored as fresh validation.
