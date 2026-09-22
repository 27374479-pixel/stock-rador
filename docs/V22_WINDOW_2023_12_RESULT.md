# V2.2 window result: 2023-12

This window is now **consumed**. Only the three frozen memory-cycle candidates had their post-signal paths opened.

## Pre-outcome integrity

- selection workflow run: 35697889914
- selection artifact: 10681316941
- selection digest: `sha256:92f4d9eaa4e9c492d5b7fd50fc8f84609f497a97758309c2216eb1c864a2c5ef`
- frozen selection commits: `59f76d73552240ca13c1202b368d77278ab3d8e2` and `d0a11feb868b11cefda777ec23fa88333fbfda1e`
- outcome evaluator commit: `294085e0203f56f9965b5391382153838b681b85`

Outcome artifact:

- outcome workflow run: 35698045809
- outcome artifact: 10681297187
- outcome digest: `sha256:1645f1962797a2d3e0ef723e9c795a659fc196776faf084148b3bffbfcc3e618`

Trading assumptions remained unchanged: T+1 open, 0.10% cost per side, adjusted return series, unadjusted execution blockers and CSI 300 benchmark.

## Memory-price cycle rebound

Frozen primary pick: **江波龙 (301308.SZ), score 39**.

| Frozen candidate | 20d excess | 60d excess | 120d excess | 250d excess | Max DD observed |
| --- | ---: | ---: | ---: | ---: | ---: |
| **江波龙** | -9.0% | -9.2% | -7.8% | **-15.5%** | -34.2% |
| 佰维存储 | -45.1% | -47.6% | -39.8% | **-40.6%** | -68.2% |
| 德明利 | +1.9% | -1.1% | +14.2% | **+16.7%** | -38.9% |
| Equal-weight basket | -17.4% | -19.3% | -11.1% | **-13.1%** | -68.2% worst constituent |

The physical/industry signal was real: NAND wafer prices had already risen sharply and DRAM contract pricing had turned upward. V2.2 also correctly required direct storage-business exposure rather than generic semiconductor adjacency.

However, that was still not sufficient for durable stock alpha. The primary pick underperformed the benchmark across all four horizons, and the equal-weight basket was negative at every horizon.

The dispersion is important. 德明利 eventually delivered positive 120/250-day excess while 江波龙 and especially 佰维存储 did not. This suggests that a commodity/cycle recovery needs another layer beyond "direct exposure + shipment capability": balance-sheet inventory position, purchase timing, gross-margin sensitivity, financing burden and how much of the price turn was already embedded in expectations can materially change the equity outcome.

No V2.2 weight is changed from this one window.

## AI-PC architecture transition

Frozen decision: **NO TRADE**.

The architecture transition was confirmed, but there was not enough point-in-time evidence that an A-share supplier had AI-PC-specific shipment/order proof and incremental earnings materiality. No stock future was opened for this lead.

This remains an abstention, not a claimed success.

## Battery-price / demand weakness

Frozen decision: **NO TRADE**.

The lead remained unverified under the evidence engine because only one independent evidence root was admitted at the cutoff. No candidate was selected and no future stock path was opened.

## Interpretation

The December window adds a useful failure mode to V2.2:

- direct product exposure is necessary but not sufficient;
- a cyclical price rebound may improve sector economics without creating stock-specific excess return;
- inventory and working-capital structure can dominate the direction of near-term earnings capture;
- a structurally new architecture transition and a mean-reverting commodity-price cycle should not automatically receive identical duration confidence.

This hypothesis is logged but not encoded yet. The next untouched window remains 2024-03 under the unchanged V2.2 rule.
