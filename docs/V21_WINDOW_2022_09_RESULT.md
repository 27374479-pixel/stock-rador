# V2.1 window result: 2022-09

This window is now **consumed**. Its outcomes have been viewed and it must not be reused as untouched validation after any future rule change.

## Pre-outcome integrity

The September selection freezer used only data available through the signal date. It also introduced a cross-window contamination guard that rejects any candidate whose future price path had already been inspected in earlier consumed windows.

- selection workflow run: 35687433319
- selection artifact: 10677645031
- selection digest: `sha256:d7433e9620e73caf4c5a2b01d4434381cfab6d2adf20bd1a31347d9a53061318`
- frozen selection commits: `978cd009f06ccef9917c63ed6843722a2053f2a3` and `d27a9cba3dfa692e0ad49b1231c77d249b9a8b26`
- the post-signal evaluator was added only after those commits.

Outcome artifact:

- outcome workflow run: 35687528179
- outcome artifact: 10677198658
- outcome digest: `sha256:a950728c6638df7164a180543ccf7ef25c3e7e0dae86c5821e2c72bbd29ce34b`

## Heat-pump export signal

Frozen primary pick: **海信家电 (000921.SZ), score 28**.

| Frozen selected candidate | 20d excess | 60d excess | 120d excess | 250d excess | Max DD observed |
| --- | ---: | ---: | ---: | ---: | ---: |
| **海信家电** | -14.0% | +16.5% | +68.7% | **+120.6%** | -31.7% |
| 美的集团 | -6.2% | -8.1% | -4.2% | +19.8% | -33.7% |
| 三花智控 | -10.5% | -12.6% | -9.0% | +15.7% | -24.6% |
| Equal-weight selected basket | -10.3% | -1.4% | +18.5% | **+52.0%** | -33.7% worst constituent |

The primary pick therefore produced a very large one-year excess return after a difficult first month and a roughly 32% drawdown from the entry price.

The Watch decisions were also informative:

| Rejected / Watch candidate | 20d excess | 60d excess | 120d excess | 250d excess |
| --- | ---: | ---: | ---: | ---: |
| 万和电气 | +6.1% | -24.6% | -32.1% | -28.3% |
| 日出东方 | +2.0% | -24.3% | -27.9% | -29.5% |

Both had already roughly doubled before the signal and carried very high priced-in penalties. The algorithm did not chase them.

## Ammonia/fertilizer curtailment

The physical European production curtailment was verified, but the frozen decision was **NO TRADE** because an uncontaminated A-share long beneficiary with a direct point-in-time monetization path was not established. No stock was retroactively substituted after outcomes were known.

## Interpretation

This window supports three hypotheses that remain provisional until more untouched windows are consumed:

1. **Company-specific geographic/product mapping matters.** 海信家电 had contemporaneous evidence of launching a residential air-source heat-pump range across five major European markets, directly matching the external demand shock.
2. **A strong theme can still contain bad entries.** 万和电气 and 日出东方 had dramatic prior rallies but much weaker incremental economic capture relative to their price saturation; both later underperformed materially.
3. **The signal can require a long horizon.** 海信家电 was negative at 20 trading days and suffered a large drawdown before the thesis showed up in 60-250 day returns. A backtest optimized only to short holding windows would miss this.

No V2.1 threshold or factor is changed from this result. The next untouched window must use the same frozen rules.
