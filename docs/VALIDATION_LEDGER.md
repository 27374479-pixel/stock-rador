# Validation ledger

This ledger prevents accidental reuse of viewed outcomes as untouched validation. Once a window is consumed, later algorithm versions may learn from it but may not report it as fresh sample-out evidence.

| Window / set | Rule version | Status | Frozen action | Key outcome |
| --- | --- | --- | --- | --- |
| 2023-05 / 2023-10 / 2023-11 / 2024-04 pilot cases | V1 | development set | mixed select/abstain | used to design V2; never fresh validation again |
| 2022-03 fixed window | V2 | consumed | MCU: select; PLC: select | MCU primary 250d excess -18.4%; PLC primary +42.8% |
| 2022-06 fixed window | V2.1 | consumed | NO TRADE | watch diagnostics: 亚钾国际 -34.5%, 云天化 -43.7% 250d excess |\n| 2022-09 fixed window | V2.1 | consumed | heat pump: select; ammonia: NO TRADE | 海信家电 primary +120.6% 250d excess; selected basket +52.0% |\n| 2022-12 fixed window | V2.1 | selected outcome consumed; Watch futures unopened | antipyretic: 亨迪药业 select; PV: NO TRADE | 亨迪药业 250d excess -7.9%; max DD about -31.0% |\n| 2023-03 fixed window | V2.1 | consumed | AI server, liquid cooling, 800G optical: select; lithium: NO TRADE | server basket +52.6%; liquid-cooling basket +6.5%; optical basket +243.0% 250d excess |\n| 2023-06 fixed window | V2.1 | consumed | AI-server power: select; advanced packaging: NO TRADE | power basket -24.1% 250d excess; 欧陆通 primary -21.6% |\n| 2023-09 fixed window | V2.2 | selected outcomes consumed; Watch future preserved | 沪电股份 +83.9%; 华力创通 -20.9% 250d excess | first V2.2 window: strong PCB success, short-lived satellite-order signal |\n| 2023-12 fixed window | V2.2 | consumed | memory cycle: select; AI PC: NO TRADE; battery weakness: NO TRADE | memory basket -13.1% 250d excess; 江波龙 -15.5%, 德明利 +16.7%, 佰维存储 -40.6% |
| 2024-03 fixed window | Skill V3 | consumed | copper: 洛阳钼业 Candidate; transformer/HBM: NO TRADE | copper excess +31.1% 20d, +16.2% 60d, +7.5% 120d, +5.7% 250d |
| 2024-06 fixed window | Skill V3 | consumed | hog: 牧原股份 Candidate; shipping/PV: NO TRADE | 牧原 excess +0.4% 20d, -8.0% 60d, -24.7% 120d, -16.6% 250d |
| 2024-09 fixed window | Skill V3.1 | consumed | alumina: 中国铝业 Candidate; antimony/freight: NO TRADE | 中国铝业 excess +15.9% 20d, -7.5% 60d, -1.8% 120d, -21.3% 250d |
| 2024-12 fixed window | Skill V3.2 | consumed | transformer: 伊戈尔 Candidate; antimony/enterprise SSD: NO TRADE | 伊戈尔 excess +13.1% 20d, +14.4% 60d, -2.0% 120d, +76.3% 250d |

## Current untouched queue

The original 2022–2024 fixed-window validation queue is fully consumed. V3.2 remains frozen for a new extension set:

- 2025-03-01 through 2025-03-14
- 2025-06-01 through 2025-06-14
- 2025-09-01 through 2025-09-14
- 2025-12-01 through 2025-12-14

These extension windows are retrospective and retain the same caveat about historical search visibility. No outcome may be opened before each selection lock is committed.

## Viewed-outcome ticker quarantine

Future windows must reject these tickers before scoring because their post-signal paths have already been inspected in a consumed set:

`688676.SH, 601179.SH, 600089.SH, 002028.SZ, 300308.SZ, 300502.SZ, 002281.SZ, 300327.SZ, 688595.SH, 603986.SH, 603416.SH, 300124.SZ, 000893.SZ, 600096.SH, 000921.SZ, 000333.SZ, 002050.SZ, 002543.SZ, 603366.SH, 301211.SZ, 603019.SH, 000977.SZ, 002837.SZ, 301018.SZ, 002335.SZ, 300394.SZ, 603083.SH, 300870.SZ, 002851.SZ, 002364.SZ, 002518.SZ, 002463.SZ, 300045.SZ, 301308.SZ, 688525.SH, 001309.SZ, 603993.SH, 002714.SZ, 601600.SH, 002922.SZ`

The quarantine is procedural, not a statement about those companies. It prevents known future paths from leaking into later historical selections.


## Watch-future preservation

Starting with the 2022-12 window, post-lock evaluators fetch only frozen selected candidates. Watch candidates are not evaluated automatically. This preserves their future paths for later historical windows and avoids needless cross-window contamination.

For 2022-12, only `301211.SZ` was newly outcome-viewed. `000756.SZ`, `002728.SZ`, and `000999.SZ` remain eligible for later windows because their post-signal paths were not fetched.


## March 2023 timestamp note

The lithium-warning lead included a source for which the research record had a publication date but no reliable intraday timestamp. The point-in-time engine conservatively treated its end-of-day placeholder as later than the China-time cutoff, so that source did not receive same-day credit. March 2023 remains consumed and will not be rescored.


## 2023-09 Watch-future preservation

Only `002463.SZ` and `300045.SZ` were outcome-viewed in the 2023-09 V2.2 evaluation. `002916.SZ` (深南电路) remains eligible for later untouched windows because its post-signal path was not fetched.


## 2023-12 cycle-rebound note

The memory-price rebound was real and all three selected names had direct product exposure plus a strong V2.2 earnings bridge, yet the equal-weight basket produced -13.1% 250-day excess. This creates a forward hypothesis that mean-reverting price cycles require explicit balance-sheet/inventory and working-capital sensitivity analysis distinct from architecture-driven demand transitions. The hypothesis is not yet encoded into V2.2.


## 2024-03 shock-half-life note

洛阳钼业 was selected after a +47.6% prior-60-day move and still produced +31.1% 20-day excess, but the excess decayed to +5.7% by 250 trading days. This supports keeping momentum contextual rather than using a hard anti-chase filter, and creates an experimental question about matching holding horizon to shock half-life. 伊戈尔 remains unquarantined because its future was not opened.


## 2024-06 basis-match and valuation note

The hog signal exposed a general mapping flaw: an external industry price series was compared directly with company production cost even though the company's own reported realized selling price was materially lower. The window also showed that qualitative PB/PE context is not enough to answer whether an opportunity is actually cheap. These become forward-only V3.1 research requirements; 2024-06 remains consumed. 中远海控 and 温氏股份 remain unquarantined because their futures were not opened.


## 2024-03 Skill V3 note

The first skill-first window selected 洛阳钼业 on a newly escalated copper-concentrate squeeze despite strong pre-signal momentum. Excess return was strongest at 20/60 trading days and decayed by 250 days. This adds an Experimental question: **what is the expected repricing half-life of the shock?** Structural architecture changes and acute supply squeezes may require different holding-horizon expectations even when both pass the earnings-bridge test.


## 2024-03 Skill V3 horizon-decay note

洛阳钼业 produced +31.1% 20-day and +16.2% 60-day excess, but only +5.7% at 250 days. The physical bottleneck thesis worked, yet alpha decayed as the event aged. Skill V3 therefore adds an experimental question about the expected half-life of each causal shock. No hard holding-period rule is changed from this one window.


## 2024-09 V3.1 causal-half-life note

中国铝业 produced +15.9% 20-day excess but -21.3% 250-day excess despite a reasonable point-in-time valuation bridge. Combined with 2024-03 洛阳钼业, this is the second independent commodity/bottleneck window where alpha was concentrated early and decayed materially. Causal half-life is promoted into the V3.2 core process; this is not a fixed exit-day rule. 湖南黄金 and 华钰矿业 remain unquarantined because their post-signal paths were not opened.


## 2024-12 V3.2 structural-horizon note

伊戈尔 was classified pre-outcome as a structural-multi-year transformer thesis with a 120–250 trading-day research horizon. Excess return was +13.1% at 20d, +14.4% at 60d, -2.0% at 120d, then +76.3% at 250d. This is evidence against a universal calendar-based exit rule and supports monitoring predeclared causal normalization indicators instead. 湖南黄金 and 华钰矿业 remain unquarantined because their post-signal paths were not opened.
