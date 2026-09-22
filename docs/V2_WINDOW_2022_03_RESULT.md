# V2 window result: 2022-03

This window is now **consumed**. Its outcomes have been viewed and it may be used to improve later versions, but it must never be counted again as untouched validation after any rule change.

## Pre-outcome integrity

The selection artifact was produced before any post-signal price request:

- selection workflow run: 35681948216
- selection artifact: 10674193827
- selection digest: `sha256:367e11e341990ea5547eff6f34fbbedb2ec2f72d59131211aef684342d7764fe`
- frozen selection commits: `b515a31e1e33f460ae0d7deb70c025c504171d46` and `bfdd5f5c6f9013d507298dbf458cc399230b8db7`
- outcome evaluator was added only afterward.

Outcome artifact:

- outcome workflow run: 35682099322
- outcome artifact: 10675510096
- outcome digest: `sha256:b47c11e9297fb10b6d67db3244d0e81174439bf26ef14f47859dcd18ace96b0c`

Trading assumptions were T+1 open, 0.10% each side, adjusted prices for returns, unadjusted daily bars for suspension/one-price limit blockers, and CSI 300 as benchmark.

## Results

| Lead | Frozen primary pick | 20d excess | 60d excess | 120d excess | 250d excess |
| --- | --- | ---: | ---: | ---: | ---: |
| MCU/component lead-time reacceleration | 中颖电子 | +1.4% | +3.1% | -21.0% | -18.4% |
| PLC/industrial-automation shortage | 信捷电气 | -9.8% | -7.7% | +35.4% | +42.8% |

The frozen equal-weight MCU basket (中颖电子/芯海科技/兆易创新) produced -9.7%, -9.3%, -23.0% and -21.0% excess at 20/60/120/250 trading days. The frozen PLC basket (信捷电气/汇川技术) produced -7.3%, +1.6%, +18.7% and +32.6%.

Risk was material. 信捷电气 eventually generated strong 120/250-day excess but experienced a roughly -28.1% drawdown from entry within those windows. The MCU names suffered much larger long-horizon drawdowns, with the worst constituent around -50.2% by the 250-day horizon.

## What this window teaches

The physical shortage signal itself was real in both clusters, so factual verification alone is not enough. The two leads differed in how the bottleneck could be monetized by the mapped A-share company.

For PLC/automation, point-in-time evidence explicitly showed that foreign competitors' delivery problems were creating domestic-substitution and delivery-share opportunities. This is a direct **capture mechanism**: competitors cannot deliver, while a domestic supplier that can deliver may gain durable share.

For MCUs, the broad shortage was also real, but the mapped domestic MCU suppliers were exposed to the same semiconductor cycle and supply constraints. A shortage of the product a company sells does not automatically imply that company can ship incremental units, protect margin, or retain share once the shortage normalizes.

Therefore V2.1 should not change the historical March decision. Instead, March becomes development data and motivates a new forward-only factor: **monetization/capture of the bottleneck**. Later untouched windows must score whether the candidate can actually supply into the shortage, whether substitution/share gain is documented, whether input constraints offset the benefit, and whether margin transmission can persist.

This window also shows that horizon matters: an eventual 120-250 day winner can still suffer large early drawdowns. Later validation should preserve all horizons and drawdown rather than optimize to the best holding period.
