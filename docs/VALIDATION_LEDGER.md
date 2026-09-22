# Validation ledger

This ledger prevents accidental reuse of viewed outcomes as untouched validation. Once a window is consumed, later algorithm versions may learn from it but may not report it as fresh sample-out evidence.

| Window / set | Rule version | Status | Frozen action | Key outcome |
| --- | --- | --- | --- | --- |
| 2023-05 / 2023-10 / 2023-11 / 2024-04 pilot cases | V1 | development set | mixed select/abstain | used to design V2; never fresh validation again |
| 2022-03 fixed window | V2 | consumed | MCU: select; PLC: select | MCU primary 250d excess -18.4%; PLC primary +42.8% |
| 2022-06 fixed window | V2.1 | consumed | NO TRADE | watch diagnostics: 亚钾国际 -34.5%, 云天化 -43.7% 250d excess |

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
