# Leading-Source Upgrade — v3

## Core change

Sell-side research is no longer a discovery priority.

The discovery stack now prioritizes leading physical and transactional evidence:

1. L0 transaction/physical data
2. L1 issuer operating facts
3. L2 specialist industry data
4. L3 high-quality news/context
5. L4 sell-side research only for consensus/valuation/crowding
6. L5 community weak signals only for idea generation

Implemented in:

`config/source-registry-v3-leading.json`

## Verified source families to integrate

### Shipping / logistics

**Shanghai Shipping Exchange / Shanghai Shipping Exchange Institute**

Use:
- SCFI
- SCFIS
- CCFI
- coastal coal/bulk freight indices
- import container freight indices

These are route-level realized/quoted freight measures and should be scanned weekly/daily before shipping research reports.

### Customs / export chains

**General Administration of Customs**

Use:
- preliminary monthly releases;
- detailed HS monthly tables;
- HS2/HS4 quantity, unit-value and value indices;
- country/region destination data.

The release calendar makes event-time reconstruction practical.

### Commodities / materials

**SMM**

Use:
- daily spot prices and premia;
- social/warehouse inventories;
- weekly treatment charges;
- smelter/downstream operating rates;
- import economics;
- production and supply-demand balances.

For iron/steel/coal/chemicals, add analogous specialist sources (Mysteel, 卓创, 隆众) where licensing/access permits.

### Government and institutional procurement

**China Government Procurement Network**

Use:
- procurement intentions;
- tender notices;
- award announcements;
- contract announcements.

This can surface medical equipment, servers/networking, industrial equipment and public-sector IT demand before sell-side coverage reacts.

Also integrate auditable sector procurement systems (for example grid/telecom procurement portals) when stable machine-readable access is available.

### Auto / mobility

**China Automobile Dealers Association**

Use weekly used-car reports and monthly market analysis as a demand/inventory signal.

Add CAAM/CPCA official/association new-car retail, wholesale, export and inventory series where accessible.

### Electricity / energy

**National Energy Administration**

Use:
- monthly electricity consumption;
- installed capacity;
- utilization;
- power-source investment;
- grid investment.

These are upstream physical demand/capex signals and should precede broker conclusions about equipment cycles.

### Consumer

**China Chain Store & Franchise Association**

Use industry monitoring and operating surveys for retail formats. This is slower than daily channel data, but provides non-broker independent confirmation.

For faster consumer signals prefer auditable official subsidy/trade-in execution, platform/company operating data and transaction/channel measures.

## Natural experiment already observed

The 2024 broad-source replay was already close to a leading-source architecture:

- shipping was triggered by physical freight disruption;
- pork by hog-price/capacity economics and company profit-turn evidence;
- shipbuilding by official order/backlog statistics;
- appliances by trade-in policy and company operating confirmation;
- machinery by excavator sales;
- auto by export pricing/margin evidence;
- gold by commodity price plus company operating confirmation.

It produced seven non-tech selections without depending on research reports for discovery.

This confirms that leading-source discovery fixes sector concentration and recall.

However, only 1/7 beat CSI300 over 60 trading days. Therefore leading sources improve **when/where we look**, but do not by themselves solve **whether the current stock price is attractive**.

## New research rule

When an L0 state change appears and an L1 company baseline already exists and remains decision-valid:

- re-underwrite immediately;
- do not wait for a new sell-side report;
- use L2/L3 to cross-check causality;
- query L4 only after the candidate exists, specifically to test:
  - consensus earnings;
  - estimate revisions;
  - valuation;
  - target-price saturation;
  - crowdedness;
  - strongest published counter-thesis.

A later bullish report is potentially evidence that the edge is already becoming consensus.

## Next backtest

The next clean experiment should compare, on an untouched weekly window:

- A: old source registry;
- B: v3 leading-source registry, unchanged downstream gates;
- C: v3 leading-source registry + immediate re-underwrite using existing company baselines;
- D: C + separately validated absorption/opportunity-cost logic.

Measure:
- new independent opportunities / 52 weeks;
- sector-family entropy;
- discovery-to-selection conversion;
- 60d positive rate;
- 60d CSI300 excess-win rate;
- median 60d excess;
- drawdown;
- signal lead time relative to first sell-side report.
