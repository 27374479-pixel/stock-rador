# V2.1 window result: 2023-03

This window is now **consumed**. The selected candidates' post-signal paths have been opened and must be quarantined from later untouched historical windows.

## Pre-outcome integrity

The March 2023 selection artifact was produced before any post-signal price retrieval:

- selection workflow run: 35694633437
- selection artifact: 10679473900
- selection digest: `sha256:08e58653d3555f50ae90a0f140866c68b59eb4646d60ae5ee7fa963a835b85b9`
- frozen selection commits: `03842b654e78b1d5197f937cba8e0fde6551866b` and `ebdf0671b699dfbd2444237648a4edb6b1895532`
- outcome evaluator commit: `442fefa50dcae6d4223b0426b5c3fbfd7e028e8f`

Outcome artifact:

- outcome workflow run: 35694771167
- outcome artifact: 10680066461
- outcome digest: `sha256:ac90dbc0bf8ba7a2f4ead54ebe5efc4cb8b861b5904c98a8e9ac3f71612e3431`

Trading assumptions remained unchanged: T+1 open, 0.10% transaction cost per side, adjusted prices for returns, unadjusted bars for execution blockers, and CSI 300 benchmark.

## Generative-AI server demand

Frozen primary pick: **中科曙光 (603019.SH), score 26**.

| Frozen candidate | 20d excess | 60d excess | 120d excess | 250d excess | Max DD observed |
| --- | ---: | ---: | ---: | ---: | ---: |
| **中科曙光** | +22.5% | +59.0% | +31.5% | **+73.3%** | -12.4% |
| 浪潮信息 | +10.0% | +31.7% | +19.6% | **+31.9%** | -23.3% |
| Equal-weight basket | +16.3% | +45.3% | +25.6% | **+52.6%** | -23.3% worst constituent |

This was a successful cluster under the frozen rule. The important feature is not simply that AI was popular: the point-in-time mapping used already-existing smart-computing/server delivery capability and customer/platform exposure.

## AI / high-density liquid cooling

Frozen primary pick: **英维克 (002837.SZ), score 28**.

| Frozen candidate | 20d excess | 60d excess | 120d excess | 250d excess | Max DD observed |
| --- | ---: | ---: | ---: | ---: | ---: |
| **英维克** | +3.7% | +23.6% | +17.7% | **+52.7%** | -30.8% |
| 申菱环境 | +10.2% | +6.8% | -17.4% | -10.2% | -60.8% |
| 科华数据 | +5.7% | -6.3% | -20.9% | -22.9% | -60.4% |
| Equal-weight basket | +6.5% | +8.0% | -6.9% | +6.5% | -60.8% worst constituent |

This cluster is much more mixed than the server or optical cluster. The physical/technical trend was real, but company-level durability differed sharply. The primary pick worked over 250 days, while two secondary mappings suffered large drawdowns and negative long-horizon excess.

## 800G optical upgrade

Frozen primary pick: **天孚通信 (300394.SZ), score 28**.

| Frozen candidate | 20d excess | 60d excess | 120d excess | 250d excess | Max DD observed |
| --- | ---: | ---: | ---: | ---: | ---: |
| **天孚通信** | +60.5% | +118.6% | +120.2% | **+373.8%** | -12.1% |
| 剑桥科技 | +103.5% | +197.0% | +120.2% | **+112.1%** | -4.2% |
| Equal-weight basket | +82.0% | +157.8% | +120.2% | **+243.0%** | -12.1% worst constituent |

This is the strongest untouched-window result so far. It is also a dangerous sample for overfitting: both stocks had already risen substantially before the signal, so this window directly contradicts a naive hard rule such as "large prior return means the opportunity is over."

The more defensible interpretation is that **high prior momentum can coexist with a still-underestimated step-change in earnings opportunity when the product transition itself is accelerating and the candidate already has shipment/production capability**.

## Lithium inventory / demand deterioration

Frozen decision: **NO TRADE**.

A timestamp-normalization issue caused the evidence engine to label the lead `unverified` even though the economic warning had multiple contemporaneous sources. This did not change the frozen action because no long candidate was selected. The bug is documented and may be fixed forward-only; March 2023 will not be rescored.

## What this window changes — and what it does not

It strengthens the case for the research direction, but it does **not** justify changing V2.1 weights yet.

The strongest common structure in the successful server and optical selections is:

1. an externally observable demand/architecture transition;
2. company capability existed before the narrative exploded;
3. the product mapped directly into the new bottleneck;
4. the market had started to price the theme but had not necessarily priced the scale/duration of the earnings change.

Liquid cooling shows why broad theme exposure is insufficient: even when the technology trend is correct, weaker company-level capture can produce poor long-horizon outcomes.

No economic threshold is changed after this window. The next untouched window remains 2023-06 under V2.1.
