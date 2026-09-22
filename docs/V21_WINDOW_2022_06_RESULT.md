# V2.1 window result: 2022-06

This window is now **consumed**. Its outcomes have been viewed and it must not be reused as untouched validation after any future rule change.

## Pre-outcome integrity

V2.1 itself was committed before the June window was scored. The June selection was then frozen before any post-signal price retrieval:

- V2.1 protocol commit: `51f3340c1b7b45d8303e04d973a7a533fcd3087d`
- selection workflow run: 35682466014
- selection artifact: 10675535646
- selection digest: `sha256:75506daa411efcbe0785a8d78f58ae862042076dae311ac1dc45aeae49f6a506`
- frozen selection commits: `9227c849732abcb9daaf2b6355b8922c21651f61` and `1964b426b11deec0b209a6b3e72b2ed10bdfac65`
- outcome evaluator was added only after those lock commits.

Outcome artifact:

- outcome workflow run: 35682583654
- outcome artifact: 10675361244
- outcome digest: `sha256:23f692b34ebcd795231bf879dfeda0a8422ccbbdc4bf31a6a916fde2d0e0de85`

## Frozen decision

The fertilizer lead was factually confirmed, but V2.1 chose **NO TRADE** because contemporaneous evidence showed a rolling-over commodity impulse, demand destruction and heavy prior stock-price appreciation.

Pre-signal Watch scores:

| Watch candidate | V2.1 score | Prior 60d | Prior 180d | Main reason not selected |
| --- | ---: | ---: | ---: | --- |
| 亚钾国际 | 14 | +37.2% | +112.9% | priced-in penalty 10 + reversal risk 5 |
| 云天化 | 11 | +36.3% | +39.1% | monetization only 4 + reversal risk 6 |

The second lead, broad demand deterioration / excess-inventory risk, was also **NO TRADE** because no specific A-share long beneficiary could be causally mapped without forcing a narrative.

## Post-lock diagnostic outcomes

These are opportunity-cost diagnostics only; neither stock counts as a strategy trade.

| Watch candidate | 20d excess | 60d excess | 120d excess | 250d excess |
| --- | ---: | ---: | ---: | ---: |
| 亚钾国际 | -15.7% | -10.5% | -18.6% | -34.5% |
| 云天化 | -4.8% | -21.2% | -30.0% | -43.7% |

The 250-day max drawdown from entry was about -42.2% for 亚钾国际 and -52.3% for 云天化.

## Interpretation

This is a useful **abstention success**, but it is still one consumed historical window and must not be treated as proof of general alpha.

The important signal was not that the fertilizer shortage story had become false. FAO and practitioner evidence still showed real regional scarcity. The key was that, by early June 2022, the market contained simultaneous evidence of:

- spot-price rollover;
- demand destruction;
- large prior share-price appreciation;
- a shortage narrative already widely visible.

V2.1 correctly separated **physical tightness** from **fresh positive earnings surprise** in this window.

No threshold or factor will be changed from this outcome alone. The next untouched window must use the already-frozen V2.1 rules. This prevents a single successful abstention from causing overfitting.
