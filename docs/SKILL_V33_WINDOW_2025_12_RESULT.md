# Skill V3.3 window result: 2025-12

This window is now **consumed at the first causal checkpoint**.

Only the frozen Candidate, 江西铜业 (600362.SH), had its selected-stock path opened, and only through the predeclared 20-trading-day checkpoint. No selected-stock prices after 2026-01-13 were opened.

## Integrity

- research finalization commit: `d77a9ff132e861491c856740e94ec076cea566b0`
- selection lock: `frozen/skill_v33_2025_12_selection.json`
- checkpoint-20 evaluator commit: `c47580b564c7ac2d6ab1c312896e93263a3a694c`
- checkpoint outcome workflow run: 35719869218
- checkpoint artifact: 10689844996
- checkpoint artifact digest: `sha256:d2993a3838f38e942ab9b9b5fc94cfd1c8f8d6919b2f01b3fd37ee7ad0eed5d9`
- checkpoint decision JSON: `frozen/skill_v33_2025_12_checkpoint20_decision.json`
- checkpoint decision: **Exit**
- future selected-stock segment after 2026-01-13: **sealed / unopened**

## Frozen selection

- Enterprise SSD/NAND squeeze: **NO TRADE**.
- AI data-center laser shortage: **NO TRADE**.
- Yttrium export shortage: **NO TRADE**.
- Copper tight supply + grid/AI demand: **Candidate — 江西铜业**.

The copper thesis was classified as **cyclical-multi-quarter**, with a 60–120 trading-day research horizon and mandatory checkpoints at 20 and 60 trading days.

## First checkpoint result

| Candidate | Net return | CSI300 | Excess | Max DD |
| --- | ---: | ---: | ---: | ---: |
| 江西铜业 | **+42.1%** | +4.6% | **+37.5%** | about -0.8% |

Entry was 2025-12-15 and the first checkpoint was 2026-01-13.

## Why V3.3 exits despite the physical thesis remaining strong

The checkpoint decision was not a take-profit rule.

By the checkpoint:
- copper had entered a new record-price regime above roughly USD13,000/t;
- the supply / AI / grid story was broadly recognized;
- evidence appeared that Chinese industrial buyers were reducing purchases at record prices;
- no new company financial report had yet proven a new earnings step-up beyond the Q1-Q3 2025 base used at selection.

The causal decomposition therefore moved from:

`physical tightness -> company earnings upside -> open expectation gap`

toward:

`physical tightness -> still-positive company economics -> shrinking incremental surprise -> closing expectation gap`.

V3.3 therefore froze an **Exit** at the 20-day checkpoint before any later selected-stock prices were opened.

## What this validates

This is the first complete test of the V3.3 checkpoint protocol.

It demonstrates why “hold until the physical regime breaks” is too crude. A physical regime can remain strong while the stock-specific expectation gap closes much earlier.

It also avoids a new form of hindsight: later 60/120/250-day prices are deliberately not opened, so the checkpoint decision cannot be retroactively judged or rewritten to match a later chart.

No new numeric exit threshold is learned from this case.
