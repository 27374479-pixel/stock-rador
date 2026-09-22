# V2.2 window result: 2023-09

This window is now **consumed**. Only the two frozen selected candidates had their post-signal price paths opened. 深南电路 remained Watch and its future path was deliberately not fetched.

## Pre-outcome integrity

V2.2 was committed before the September window. The selection artifact was then produced before any post-signal price retrieval:

- selection workflow run: 35696359934
- selection artifact: 10680491580
- selection digest: `sha256:ff67bee8027becc589aa441037a0d66f14b5aeaf4c5622b5bf56487998d683dd`
- frozen selection commits: `963b676e7fab19e2efeb8a48611b6c985277bc0d` and `38d51cac05e372e6b4dded20534cdbf813cf81f3`
- outcome evaluator commit: `c50c92283aeb976cf59aff7f560bfcc0e7603686`

Outcome artifact:

- outcome workflow run: 35696496509
- outcome artifact: 10679879848
- outcome digest: `sha256:5ecf045d2b8189a5da09606888e3ec0c2e5e6742e1a7630924766253b2444f5f`

Trading assumptions remained unchanged: T+1 open, 0.10% transaction cost per side, adjusted prices for returns, unadjusted bars for execution blockers, and CSI 300 benchmark.

## AI-server / high-value PCB

Frozen primary pick: **沪电股份 (002463.SZ), score 38**.

| Frozen candidate | 20d excess | 60d excess | 120d excess | 250d excess | Max DD observed |
| --- | ---: | ---: | ---: | ---: | ---: |
| **沪电股份** | +9.4% | +5.7% | **+45.9%** | **+83.9%** | -14.5% |

This is a clean first success for the new V2.2 earnings-bridge factor. At the cutoff the company had already disclosed that AI-server/HPC PCB contribution inside enterprise communications revenue had risen materially, and it had already begun batch supply to a major overseas internet customer. The later stock result is consistent with the hypothesis that **product-specific shipment proof plus increasing economic materiality** is more informative than broad thematic adjacency.

深南电路 remained Watch because its own point-in-time disclosure said AI-server PCB contribution was still low and data-center orders had weakened. Its future price was intentionally not opened, so this window makes no claim about whether that Watch decision was ex post good or bad.

## Material satellite-chip order / rumor filtering

Frozen primary pick: **华力创通 (300045.SZ), score 25**.

| Frozen candidate | 20d excess | 60d excess | 120d excess | 250d excess | Max DD observed |
| --- | ---: | ---: | ---: | ---: | ---: |
| **华力创通** | **+36.4%** | +1.1% | -0.3% | **-20.9%** | -45.1% |

This is deliberately treated as a **mixed/failed long-horizon selection**, not a validation success.

The evidence filter did one thing correctly: it separated the real, company-disclosed RMB210m chip order from unverified claims that the customer was Huawei or that the chips were specifically for Mate 60. But V2.2 still allowed the candidate to pass exactly at the threshold despite prior 60-day appreciation of about 114% and prior 180-day appreciation of about 250%.

The order was economically large relative to historical revenue, but the point-in-time record did not establish enough duration, repeatability or customer diversification to support a durable one-year earnings re-rating. The 20-day outcome was strong, while the 250-day outcome underperformed materially.

## Interpretation

The first V2.2 window therefore gives both a useful success and a useful failure:

- **沪电股份:** the exact new product category was already becoming economically visible, shipment proof existed, and the transition had multi-quarter structural duration.
- **华力创通:** a real large order existed, but duration/repeatability was much weaker and the stock had already undergone an extreme re-rating.

This does **not** justify changing V2.2 after a single window. In particular, a hard anti-momentum rule remains unjustified because prior consumed windows such as the March 2023 optical upgrade showed that large prior returns can still precede very large future alpha when the underlying architecture transition is durable.

The hypothesis to track forward is narrower: **one-off or concentrated orders should not receive the same duration confidence as recurring shipment ramps tied to a multi-year architecture change**. That hypothesis will be observed in later untouched windows without modifying the current V2.2 rules yet.
