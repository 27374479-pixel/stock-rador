# Discovery Source Registry v2

This registry expands discovery breadth without changing V1.9 selection gates.

The broad six lanes remain useful for backward compatibility, but they are too coarse to
prove that a run actually searched a diverse information universe. Source-pack schema 2.1
therefore adds explicit source roles. A formal expanded-discovery run should cover at least
10 roles, including all required core roles in the v2 protocol.

## Core roles

### official_policy_regulatory
Purpose: detect policy, enforcement, quota, standard, subsidy, tariff, environmental,
licensing and market-structure changes.

Typical source families: central and local governments, ministries, regulators, exchanges,
central-bank and financial-regulator releases.

### official_statistics_customs
Purpose: detect changes in production, trade, prices, profits, investment and demand before
they are fully reflected in company narratives.

Typical source families: national and local statistical agencies, customs data, official
monthly/weekly statistical releases.

### exchange_disclosure
Purpose: retrieve legally filed issuer information and exchange regulatory records.

Typical source families: SSE, SZSE, BSE, CNINFO, HKEX and relevant foreign exchanges.

### issuer_ir_filing
Purpose: capture earnings, orders, utilization, pricing, capacity, product mix, customer
exposure and management guidance directly from issuers.

Typical source families: periodic reports, announcements, investor-relations pages,
earnings-call transcripts, presentations and official investor Q&A.

### customer_supplier_first_party
Purpose: discover changes one step upstream or downstream before they become obvious in the
A-share issuer's own reporting.

Typical source families: major customers, suppliers, competitors, distributors and foreign
listed-company filings or presentations.

### specialist_trade_pricing
Purpose: discover product-level pricing, inventory, utilization, lead-time, order and
capacity changes.

Typical source families include industry pricing services and specialist publications such
as TrendForce/DRAMeXchange, SMM, Mysteel, SCI/卓创, 百川盈孚 and comparable domain sources.
Paid or inaccessible sources may be declared unavailable rather than silently treated as
covered.

### reputable_news_wire
Purpose: broad early discovery and attributed reporting across industries and geographies.

Use multiple independent publishers. Do not count syndicated copies as independent origins.
Examples can include Reuters and major Chinese financial/business outlets, but no single
publisher may define the discovery universe.

### international_chain_primary
Purpose: search the location closest to the underlying physical event when an A-share value
chain is global.

Typical source families: foreign issuer filings, overseas regulators, government statistics,
industry bodies, customs/trade data and customer/supplier announcements.

## Additional roles

### commodity_exchange_physical
Exchange inventory, warehouse receipts, settlement data, registered brands and other
physical-market records. Examples include SHFE, DCE, CZCE and GFEX.

### industry_association_operating
Association-level production, sales, inventory, utilization and shipment statistics.

### procurement_tender_orders
Government procurement, public-resource trading, utility/operator procurement, tender and
award records. These are especially useful for detecting order acceleration before revenue
recognition.

### logistics_freight_ports
Freight rates, port throughput, rail/road transport, vessel activity and other physical-flow
indicators.

### patent_standard_certification
Standards, certification, qualification, regulatory approvals, patents and technical
milestones that can change addressable markets or supplier eligibility.

### regional_local_reporting
Local reporting can surface plant outages, environmental enforcement, construction starts,
capacity changes, local subsidies and channel conditions earlier than national financial
media. It remains discovery evidence until independently verified.

### community_forum_weak_signal
Forums and communities such as Xueqiu, Eastmoney Guba, Reddit and specialist communities may
surface weak signals, customer observations or emerging narratives. They are discovery
inputs, not standalone proof.

### alternative_operating_signal
Auditable operational proxies such as channel prices, app rankings, job postings, store
openings, website traffic or other measurable activity. These signals require an explicit
causal bridge and independent verification.

## Search discipline

At every rolling checkpoint:

1. Search for changes, not stock names.
2. Search both Chinese and non-Chinese sources when the value chain is cross-border.
3. Search the event and the opposite hypothesis.
4. Preserve negative and contradictory discoveries.
5. Record a searchTrace for each covered role even when no event survives.
6. Cluster copies and repeated narratives into one economic event.
7. Keep community/local sources as weak-signal discovery unless corroborated.
8. Only after event verification map the value chain to A-share expressions.

## What does not change

Expanded discovery does not relax:
- direct exposure;
- earnings conversion;
- expectation burden;
- valuation slack;
- timing;
- downside containment;
- adversarial company-risk review;
- V1.9 fresh-incremental rules.

The intended path to higher signal frequency is:

more independent source roles -> more real economic changes discovered -> more verified
hypotheses -> more opportunities that can pass the same strict Primary gate.

It is not:

more sources -> lower evidence threshold -> forced monthly selections.
