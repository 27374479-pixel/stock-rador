# Validation ledger

This ledger prevents accidental reuse of viewed outcomes as untouched validation. Once a window is consumed, later algorithm versions may learn from it but may not report it as fresh sample-out evidence.

| Window / set | Rule version | Status | Frozen action | Key outcome |
| --- | --- | --- | --- | --- |
| 2023-05 / 2023-10 / 2023-11 / 2024-04 pilot cases | V1 | development set | mixed select/abstain | used to design V2; never fresh validation again |
| 2022-03 fixed window | V2 | consumed | MCU: select; PLC: select | MCU primary 250d excess -18.4%; PLC primary +42.8% |
| 2022-06 fixed window | V2.1 | consumed | NO TRADE | watch diagnostics: 亚钾国际 -34.5%, 云天化 -43.7% 250d excess |\n| 2022-09 fixed window | V2.1 | consumed | heat pump: select; ammonia: NO TRADE | 海信家电 primary +120.6% 250d excess; selected basket +52.0% |\n| 2022-12 fixed window | V2.1 | selected outcome consumed; Watch futures unopened | antipyretic: 亨迪药业 select; PV: NO TRADE | 亨迪药业 250d excess -7.9%; max DD about -31.0% |\n| 2023-03 fixed window | V2.1 | consumed | AI server, liquid cooling, 800G optical: select; lithium: NO TRADE | server basket +52.6%; liquid-cooling basket +6.5%; optical basket +243.0% 250d excess |\n| 2023-06 fixed window | V2.1 | consumed | AI-server power: select; advanced packaging: NO TRADE | power basket -24.1% 250d excess; 欧陆通 primary -21.6% |\n| 2023-09 fixed window | V2.2 | selected outcomes consumed; Watch future preserved | 沪电股份 +83.9%; 华力创通 -20.9% 250d excess | first V2.2 window: strong PCB success, short-lived satellite-order signal |\n| 2023-12 fixed window | V2.2 | consumed | memory cycle: select; AI PC: NO TRADE; battery weakness: NO TRADE | memory basket -13.1% 250d excess; 江波龙 -15.5%, 德明利 +16.7%, 佰维存储 -40.6% |

## Current untouched queue

V2.1 remains frozen for the next window. The untouched queue from the original protocol is:

- 2022-09-01 through 2022-09-14
- 2022-12-01 through 2022-12-14
- 2023-03-01 through 2023-03-14
- 2023-06-01 through 2023-06-14
- 2023-09-01 through 2023-09-14
- 2023-12-01 through 2023-12-14
- 2024-03-01 through 2024-03-14
- 2024-06-01 through 2024-06-14
- 2024-09-01 through 2024-09-14
- 2024-12-01 through 2024-12-14

No rule change is permitted to use a future queue window's outcomes before its selection lock is committed.


## Viewed-outcome ticker quarantine

Future windows must reject these tickers before scoring because their post-signal paths have already been inspected in a consumed set:

`688676.SH, 601179.SH, 600089.SH, 002028.SZ, 300308.SZ, 300502.SZ, 002281.SZ, 300327.SZ, 688595.SH, 603986.SH, 603416.SH, 300124.SZ, 000893.SZ, 600096.SH, 000921.SZ, 000333.SZ, 002050.SZ, 002543.SZ, 603366.SH, 301211.SZ, 603019.SH, 000977.SZ, 002837.SZ, 301018.SZ, 002335.SZ, 300394.SZ, 603083.SH, 300870.SZ, 002851.SZ, 002364.SZ, 002518.SZ, 002463.SZ, 300045.SZ, 301308.SZ, 688525.SH, 001309.SZ`

The quarantine is procedural, not a statement about those companies. It prevents known future paths from leaking into later historical selections.


## Watch-future preservation

Starting with the 2022-12 window, post-lock evaluators fetch only frozen selected candidates. Watch candidates are not evaluated automatically. This preserves their future paths for later historical windows and avoids needless cross-window contamination.

For 2022-12, only `301211.SZ` was newly outcome-viewed. `000756.SZ`, `002728.SZ`, and `000999.SZ` remain eligible for later windows because their post-signal paths were not fetched.


## March 2023 timestamp note

The lithium-warning lead in the consumed March 2023 window exposed a timezone-normalization bug in evidence cutoff handling. It did not alter a selected trade because that lead was already NO TRADE. Any timestamp fix must be applied forward-only; March 2023 will not be rescored.


## 2023-09 Watch-future preservation

Only `002463.SZ` and `300045.SZ` were outcome-viewed in the 2023-09 V2.2 evaluation. `002916.SZ` (深南电路) remains eligible for later untouched windows because its post-signal path was not fetched.


## 2023-12 cycle-rebound note

The memory-price rebound was real and all three selected names had direct product exposure plus a strong V2.2 earnings bridge, yet the equal-weight basket produced -13.1% 250-day excess. This creates a forward hypothesis that mean-reverting price cycles require explicit balance-sheet/inventory and working-capital sensitivity analysis distinct from architecture-driven demand transitions. The hypothesis is not yet encoded into V2.2.
