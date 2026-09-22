# V2.1 window result: 2022-12

This window's **selected-trade outcome is consumed**. Watch-candidate futures remain deliberately unopened and are not quarantined merely because they appeared in the selection table.

## Pre-outcome integrity

The December selection was frozen before any post-signal price retrieval:

- selection workflow run: 35687873486
- selection artifact: 10677475885
- selection digest: `sha256:ca4606f4ab16dfe098e06abd6964f8468f196cec55e686053c5057edbe4dda11`
- frozen selection commits: `5f6e857f083798beb27e29f6b2bfd8e2ed42718a` and `18cf84fe74afa155296de1eeae7d7e07f1838b5f`
- outcome evaluator commit: `bc4ebf1ff71bcbfc8c93b31770e2c64879fbac0b`
- the evaluator was written to fetch **only selected candidates**, not Watch candidates.

Outcome artifact:

- outcome workflow run: 35687965422
- outcome artifact: 10677104573
- outcome digest: `sha256:56ee88224b2daced85ac1a5854f7bc6510052119ec8dd56acbe5735064346450`

## Antipyretic / ibuprofen shortage

Frozen primary pick: **亨迪药业 (301211.SZ), score 21**.

A crucial pre-outcome fact is that the stock had already risen about **95.9% over the prior 60 trading days**. V2.1 still allowed the candidate to pass because direct product exposure and monetization were strong enough to overcome the priced-in penalty. That rule was not changed before opening the outcome.

| Frozen selected candidate | 20d excess | 60d excess | 120d excess | 250d excess | Max DD observed |
| --- | ---: | ---: | ---: | ---: | ---: |
| **亨迪药业** | -10.5% | +5.2% | -8.7% | -7.9% | -31.0% |

The result is mixed-to-poor rather than a durable alpha success. The 60-day horizon was modestly positive, but the 20/120/250-day horizons underperformed the CSI 300, and drawdown was substantial.

The following Watch names remain **outcome-unopened**:

- 新华制药 (score 18; prior 60d +69.4%, prior 180d +282.5%)
- 特一药业 (score 16; prior 60d +156.7%, prior 180d +99.0%)
- 华润三九 (score 14; prior 60d +53.2%, prior 180d +78.2%)

They must not be described as good or bad exclusions from this window because their futures were intentionally not fetched.

## PV polysilicon price reversal

The falling-polysilicon-cost signal was verified, but the frozen decision was **NO TRADE** because the durable margin-capture bridge for module makers was ambiguous at the cutoff.

No post-signal candidate price was opened for this lead, so the no-trade decision is not retroactively judged from individual stock outcomes.

## Interpretation

This is an important counterweight to the September heat-pump success. A real shortage plus direct product exposure is still not enough when the candidate has already experienced an extreme pre-signal run.

The tempting response would be to add a hard anti-chase rule immediately. We do **not** do that yet: changing V2.1 after one weak December trade would simply overfit the next windows. Instead, the prior-return / priced-in state is recorded as a candidate hypothesis for later aggregate analysis.

The next untouched window continues under the same V2.1 scoring rules. Any eventual V2.2 change must be justified from multiple consumed windows, not one outcome.
