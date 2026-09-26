# Weekly Diagnostic: 2024 + 2025 + 2026H1

This report diagnoses two separate problems:

1. why the Skill produces too few independent weekly opportunities and why the old discovery universe was tech-heavy;
2. why many apparently reasonable selections fail over the 60-trading-day evaluation horizon.

All rule changes below are hypotheses for future holdouts. None should be adopted merely because they explain these already-revealed cases.

## Validation status

These are historical replays built with current-model/live historical retrieval and therefore remain `exploratory_contaminated`. Evidence and decision files were frozen before the corresponding outcome fetches where noted, but this is not a clean blind proof of alpha.

## Weekly scoreboard

| Replay | Weekly checkpoints | New-opportunity weeks | New-week probability | 60d selections | 60d positive | 60d excess win | Median 60d net | Median 60d excess |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2024 broad-source | 52 | 7 | 13.46% | 7 | 57.14% | 14.29% | +5.49% | -9.80% |
| 2025 event-time | 52 | 6 | 11.54% | 7 | 85.71% | 85.71% | +28.89% | +16.49% |
| 2026 H1 event-time | 26 | 6 | 23.08% | 6 | 50.00% | 50.00% | -4.24% | -4.24% |
| Combined main sample | 130 | 19 | 14.62% | 20 | 65.00% | 50.00% | +7.37% | +1.16% |

Across the main sample, a new independent opportunity appears in about one of every 6.8 weekly checkpoints. That is materially below a stable one-per-month target.

The combined mean 60d net return is +12.14% and mean excess is +6.16%, but both are distorted by a small number of very large winners. Median and hit-rate metrics should remain primary.

## 2025 quarterly-selection illusion

The original 2025 quarterly runs contained 9 selected hypotheses and all 9 subsequently had positive 60d net and excess returns. This is not a credible estimate of weekly live hit rate because many decisions were frozen only after late-quarter company confirmation.

The event-time weekly replay moved decisions to the first defensible weekly checkpoint and/or rejected cases that would fail V1.9 timing/absorption discipline:

- Q1 optical: rejected at the first post-event weekly checkpoint because direct names were in an adverse 20d/60d regime.
- Q2 memory: moved from Jun-30 to May-02.
- Q2 solar: moved from Jun-27 to May-02.
- Q3 passive components: moved from Aug-29 to Aug-01.
- Q3 power equipment: moved from Aug-31 to Aug-22.
- Q4 electrification: rejected at Nov-28 because direct mapping remained ambiguous while the basket was already highly absorbed.

The corrected 2025 event-time result is 6/7 positive and 6/7 excess wins, still strong but no longer a selected-at-quarter-end 9/9 artifact.

## Problem 1: why frequency is low and why selections look tech-heavy

### A. The old discovery universe is strongly source-biased before selection happens

The four original 2025 source packs contained 31 economic event clusters:

- technology hardware: 9
- power / energy transition: 13
- resources / materials: 4
- macro industrial context: 5
- consumer: 0
- healthcare: 0
- financial / property: 0
- agriculture: 0
- transport / shipping: 0

Thus 22/31 = 71.0% of the discovered events were technology hardware or power/energy-transition events before the stock-selection logic even ran.

The 75 frozen 2025 source items were also concentrated:

- Reuters: 15
- TrendForce: 14
- National Bureau of Statistics: 14
- Hacker News: 6
- GE Vernova: 4

The top five publishers contributed 53/75 = 70.7% of all source items. Reuters + TrendForce + NBS alone contributed 43/75 = 57.3%.

This makes the observed tech/power concentration primarily a discovery-input problem, not evidence that the market only offered tech opportunities.

### B. Broad-source 2024 immediately produced non-tech selections

The 2024 broad-source event census deliberately added transport, consumer/channel, agriculture, industrial orders, healthcare policy, capital-market policy and property-policy sources.

Seven frozen selections then came from seven non-tech/less-tech economic clusters:

- container shipping — COSCO Shipping Holdings
- gold/copper upstream — Zijin Mining
- auto export margin — BYD
- pork cycle — Muyuan
- shipbuilding orders — CSSC
- appliance trade-in — Midea
- machinery recovery — Sany

This is direct evidence that the old technology concentration is not intrinsic to the causal-selection framework.

### C. 2025 miss audit found non-tech events absent from the old 31-event census

Two cutoff-bounded cases were frozen before their outcome fetch:

- appliance trade-in + Midea Q1 -> Midea Research selection
- July excavator acceleration + Sany Q1 -> Sany Research selection

Both were missing from the original 2025 event universe.

Their 60d outcomes were:

- Midea: +0.34% net, -9.08% excess
- Sany: +1.46% net, -12.77% excess

The miss audit proves that source expansion increases recall and sector diversity, but it also proves that recall expansion alone does not solve stock-selection quality.

Sany adds one genuinely new opportunity week in 2025; Midea occurs in a week that already contained other signals. If the miss-audit selection is counted, 2025 new-opportunity weeks rise from 6/52 to 7/52, only 13.46%.

### D. A second frequency bottleneck is the Skill's opportunity ontology

Several large state changes are visible but intentionally rejected because V1.9 is built around direct company earnings conversion:

- 2024 New Nine Guidelines / shareholder-return reform
- 2024 Sep-24 broad monetary/property/capital-market stimulus
- 2025 Jan-22 insurance-fund equity-allocation reform
- 2025 innovative-drug payment/catalog reform

These can alter required returns, investor base, capital flows, valuation regimes or addressable reimbursement without an immediate quarterly EPS bridge.

The correct response is not to weaken the existing company-earnings gate. A separate, independently backtested `market_structure / rerating / capital_access` opportunity lane is required if these opportunities are to be captured.

### E. Evidence latency also suppresses frequency

Quarterly company filings frequently arrive weeks or months after the upstream event. The 2025 event-time replay shows the effect directly: memory, solar and passive-component decisions could be brought forward materially once weekly re-underwriting was used, but some events still cannot be mapped until company evidence exists.

### Frequency diagnosis

The low frequency therefore has at least four components:

1. **source-universe miss** — largest demonstrated issue behind sector concentration;
2. **company-evidence latency** — real event exists but cannot yet pass mapping/quality gates;
3. **opportunity-ontology miss** — market-structure/rerating events have no dedicated route;
4. **intentional deduplication/continuation suppression** — correct behavior that prevents repeatedly counting the same thesis.

## Problem 2: why selections fail

The main 2024 + 2025 + 2026H1 sample contains 20 selections:

- 13/20 had positive 60d returns = 65%
- 10/20 beat CSI300 = 50%
- only 8/20 returned more than +10% in 60 days
- only 7/20 returned more than +20%

A strategy targeting exceptional opportunities should therefore optimize relative opportunity cost and return distribution, not merely positive direction.

### Failure class 1: correct economic story, entry after substantial price absorption

This is the most repeated failure class.

Examples:

- 2024 Zijin: about +40.3% 60d excess before the Apr-26 checkpoint; subsequent 60d net -12.85%, excess -7.68%.
- 2024 CSSC: about +13.7% 60d excess before Jul-19; subsequent net -8.52%, excess -20.37%.
- 2025 May memory / GigaDevice: +12.3% 20d excess at the first company-confirmed May checkpoint, but Q1 profit acceleration was only modest and CFO had weakened; subsequent net -7.65%, excess -17.07%.
- 2026 Mar energy shipping: the selected/basket regime had already run dramatically; subsequent COSCO Energy net -28.44%, excess -35.06%.
- 2026 CATL: CATL had already materially outperformed on the 60d path before the Q1 earnings-surprise selection; subsequent net -12.77%, excess -11.76%.
- 2026 May GigaDevice re-underwrite: the same memory thesis had already produced a successful Feb entry; the later re-underwrite lost -19.82%, excess -12.99%.

At least six of the ten main-sample excess failures have a clear late-entry / absorption / stale-re-underwrite component.

### Failure class 2: positive stock return is not sufficient when broad market beta is stronger

2024 is the cleanest demonstration:

- COSCO Shipping: +8.07% net but -0.96% excess
- Midea: +5.49% net but -9.80% excess
- Sany: +6.67% net but -17.50% excess

The 2025 broad-source miss audit repeats the same pattern:

- Midea +0.34% net, -9.08% excess
- Sany +1.46% net, -12.77% excess

The current Skill reasons deeply about company/industry economics but does not sufficiently ask whether a stock-specific thesis is better than the prevailing broad-market opportunity set.

The Sep-24 2024 market-wide policy shock is particularly important: after the benchmark regime changed, several otherwise reasonable stock theses became poor relative allocations.

### Failure class 3: industry state changes before company earnings sensitivity is mature

2025 GigaDevice is a useful paired case:

- May-02 memory selection: Q1 profit only +14.6%, CFO deteriorated, early industry tightening -> 60d net -7.65%, excess -17.07%.
- Aug-29 memory re-underwrite: later company/industry evidence was much stronger -> 60d net +28.89%, excess +27.57%.

This suggests the Skill needs an explicit distinction between:
- `industry_turn_detected`
- `company_earnings_reset_realized`

A correct sector call should not automatically become a stock call before company-level conversion is mature.

### Failure class 4: short-half-life shocks are evaluated like durable cycles

The 2026 tanker/freight shock is the clearest case. The economic event was real, but a geopolitical spot-rate shock can normalize much faster than a 60-day earnings cycle. A fixed 60d holding frame can convert a correct short-term observation into a failed stock thesis.

Event half-life should influence both entry and exit policy; this must be tested, not hand-tuned on shipping alone.

### Failure class 5: re-underwriting does not require enough genuinely new state

The Feb-2026 GigaDevice entry worked; the May-2026 re-underwrite failed badly. Repeating the same cluster/ticker should require a materially new forward-earnings state, not merely another confirmation that the old thesis remains true.

### Failure class 6: Primary is not calibrated to a higher empirical probability

The historical V1+ Primary subset had only about a 55.6% 60d positive/excess hit rate, no better than all selected hypotheses. In the 2026 H1 weekly replay the only Primary, CATL, lost money and underperformed.

Primary therefore should not currently be interpreted as a calibrated probability label.

## What should be tested next

Do not change all rules at once. The next development cycle should be a sequence of ablation backtests:

1. **Balanced discovery-role scan**
   - keep company-selection gates unchanged;
   - require auditable weekly scans across consumer/channel, healthcare/regulatory, agriculture/physical, transport/freight, capital-flow/market-structure, industrial orders, commodities, technology and power;
   - measure incremental event recall, independent opportunity weeks and false-positive conversion.

2. **Stronger absorption / stale-thesis gate**
   - test candidate rules that require a genuinely new earnings-path reset after a large 20d/60d excess move;
   - explicitly test repeat cluster+ticker re-underwrites.

3. **Company-realization state machine**
   - separate industry-turn detection from realized company earnings reset;
   - measure whether waiting for company confirmation improves hit rate without destroying frequency.

4. **Market-regime opportunity-cost gate**
   - compare a candidate's expected idiosyncratic edge against the broad benchmark/regime;
   - test whether this prevents 2024-style positive-but-underperforming selections.

5. **Event-specific half-life**
   - test 20d/60d/120d outcome alignment by event type without hardcoding sectors;
   - short-lived physical shocks should not automatically share the same holding logic as multi-quarter capacity or earnings cycles.

6. **Separate market-structure lane**
   - test capital-flow / shareholder-return / liquidity / reimbursement / market-access state changes independently;
   - do not weaken the company-earnings lane to force these events through it.

## Current working conclusion

The evidence does **not** support a single diagnosis such as “the gate is too strict” or “we only need more news.”

The observed system has two largely independent defects:

- **recall defect:** the discovery universe is structurally concentrated in technology, power and a few commodity sources, which suppresses non-tech opportunity discovery and lowers frequency;
- **selection/timing defect:** once an event is found, the Skill still too often confuses a correct economic narrative with a good current stock entry, especially after price absorption, during broad-market regime shifts, before company earnings conversion is mature, or during stale re-underwrites.

Source expansion should fix recall. Stronger timing/relative-opportunity calibration should fix quality. They should be developed and validated separately.
