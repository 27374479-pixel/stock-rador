# V2.2 September 2023 selection lock

**Outcome data is intentionally absent. This is the pre-outcome commit boundary.**

V2.2 was frozen before this window. Its new incremental-earnings bridge requires point-in-time evidence that the exact bottleneck can plausibly affect company revenue/earnings or already has strong shipment/order proof.

## AI-server / high-value PCB — signal 2023-09-04

Frozen primary pick: **沪电股份 (002463.SZ), score 38**.

| Candidate | V2.2 score | Earnings bridge | Prior 60d | Prior 180d | Priced-in | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| **沪电股份 002463.SZ** | **38** | **9** | +8.9% | +89.6% | 6 | Candidate |
| 深南电路 002916.SZ | 24 | 2 | -9.1% | -10.4% | 3 | Watch |

沪电股份 passes because the point-in-time record contained both **materiality** and **shipment proof**: the 2023 half-year report showed AI-server/HPC PCB share inside enterprise communications revenue rising from 7.89% in 2022 to 13.58% in H1 2023, plus batch supply to a major overseas internet customer and batch/small-batch delivery of advanced server/switch products.

深南电路 is deliberately rejected despite operating in the same broad PCB industry. Its own H1 disclosure said AI-server PCB contribution was still low, data-center orders had declined, and a server platform transition had been delayed. This is the exact distinction V2.2 was added to make.

## Material satellite-chip order / Mate 60 rumor filtering — signal 2023-09-07

Frozen primary pick: **华力创通 (300045.SZ), score 25**.

| Candidate | V2.2 score | Earnings bridge | Prior 60d | Prior 180d | Priced-in | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| **华力创通 300045.SZ** | **25** | **8** | +114.0% | +250.1% | 12 | Candidate |

This is an intentionally difficult test of V2.2. The stock had already appreciated dramatically and receives the maximum practical priced-in penalty in this window. It still passes exactly at the threshold because the **order itself** was company-disclosed and economically material: cumulative purchase orders over twelve months were about RMB210m, more than 50% of the prior year's audited main-business revenue.

The selection does **not** assume that the customer was Huawei or that the chips were specifically for Mate 60. Those claims were not verified by the cutoff and are excluded from the causal thesis. The candidate is selected only on the verified material chip order plus existing satellite-communication exposure.

## Integrity record

Selection workflow run: 35696359934  
Selection artifact: 10680491580  
Artifact digest: `sha256:ff67bee8027becc589aa441037a0d66f14b5aeaf4c5622b5bf56487998d683dd`

All market-price requests in the selection freezer ended on or before the relevant signal date. Post-signal evaluation is now permitted **only for 沪电股份 and 华力创通**. 深南电路's future remains unopened.
