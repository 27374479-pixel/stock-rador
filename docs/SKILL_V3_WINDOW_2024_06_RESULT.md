# Skill V3 window result: 2024-06

This window is **consumed**. Only the frozen Candidate, 牧原股份, had its post-signal path opened. 中远海控 and 温氏股份 remain outcome-unopened.

## Integrity

- prefreeze workflow run: 35705174032
- prefreeze artifact: 10683613145
- prefreeze digest: `sha256:4df7645285ff2f3d57bc3aaf2512f506ece3ba1cccb3e1a61f1a4be15b2bda85`
- final research commit: `65e128c36f7387b259b4fa05075a58dea3062dd0`
- selection lock JSON commit: `ea4dff810615172d0be34452a9708e0637d15a65`
- selection lock Markdown commit: `543d81b10d53adcfc40f678027971760cd53787d`
- outcome evaluator commit: `c8014b5738f713ed7f7f5f448a311440dbcbf37a`
- outcome workflow run: 35705522650
- outcome artifact: 10684660730
- outcome digest: `sha256:9ffb96e399cff886dd184091cba11de0f3ce06a8c523b22fbe6aeebb1eeb1bef`

## Frozen decisions

- container freight squeeze: **NO TRADE**, 中远海控 Watch only;
- hog margin inflection: **牧原股份 Candidate**, 温氏股份 Watch;
- polysilicon oversupply: **NO TRADE**.

## 牧原股份 outcome

| Horizon | Net stock return | CSI 300 return | Excess return | Max drawdown from entry |
| --- | ---: | ---: | ---: | ---: |
| 20d | -0.9% | -1.3% | +0.4% | -5.0% |
| 60d | -15.3% | -7.3% | **-8.0%** | -17.5% |
| 120d | -11.8% | +12.9% | **-24.7%** | -22.5% |
| 250d | -3.9% | +12.7% | **-16.6%** | -22.5% |

This is a clear long-horizon miss.

## Failure decomposition

The real-world signal was not fabricated: hog prices were rising and producer costs were falling. The failure was primarily in **earnings/price mapping**, not signal discovery.

### 1. Reference-price basis mismatch

The selection compared an official slaughter-enterprise purchase-price series (about RMB18.2/kg) with 牧原's reported full-cycle production cost (about RMB14.3/kg). That spread looked extremely attractive, but the company's own May commodity-hog selling price was only RMB15.52/kg.

Those are not automatically the same geography, grade, weight, transaction stage or timing basis. The Skill treated an industry reference price as if it mapped directly into the company's realizable ASP.

Forward lesson: never build a company margin bridge until the external price series is reconciled with the company's own realized-price basis.

### 2. Cyclical spread is not the same as valuation gap

The packet showed roughly 4.0x price-to-book but did not translate the observed hog-price/cost spread into a point-in-time earnings range and then compare that range with the market capitalization.

That is too weak for the user's final question: "is the stock actually cheap enough to buy?"

Forward lesson: every Candidate needs an explicit **valuation/expectation bridge** using only cutoff-known information. At minimum:
- company-realized price basis;
- sustainable volume;
- sustainable rather than spot-peak margin;
- rough profit/cash-flow sensitivity;
- current market cap / enterprise value;
- bear/base/upside scenario;
- what earnings level the current price appears to require.

### 3. Shock half-life remained important

A livestock-cycle inflection can be real while later supply response, secondary fattening, delayed slaughter and demand conditions compress the spread. A correct turning-point observation does not guarantee a 120/250-day equity edge.

## Protocol response

The consumed 2024-06 window is not rescored.

For the next untouched window, the methodology advances to **Skill V3.1**. The key change is not a fitted score or sector-specific rule. It is a universal evidence requirement:

> A Candidate must reconcile external operating indicators to the company's own economic basis and must build a point-in-time valuation/expectation bridge. If either bridge cannot be made, the decision cannot exceed Watch.

This is a forward-only rule.
