# Hub-First Discovery Architecture — V4

## Correction

Discovery must not begin from specialist sources, sector databases, or sell-side reports.

The discovery entry should be a small set of broad professional information hubs that span companies, industries, macro, policy, news, filings, research, estimates and cross-asset markets. These hubs answer:

> What changed anywhere in the market this week that may matter economically?

Only after an event cluster exists should the Skill decide which specialist and primary sources are relevant for verification.

Implemented in:

`config/source-registry-v4-hub-first.json`

## Preferred discovery hubs

### China-centric primary hubs

**Wind Financial Terminal**

Best fit for broad A-share discovery because it combines:
- China and global securities;
- company filings and fundamentals;
- macro and industry indicators;
- commodities and cross-asset data;
- news and research aggregation;
- programmable Client API.

Wind's public product documentation states that its terminal covers global financial markets, more than 8 million macro/industry indicators, 180+ financial media and 200+ industry websites, plus licensed research and API access.

**iFinD**

Second China-centric generalist hub:
- macro, industry, overseas economy and company operations;
- multi-asset financial data;
- institutional research workflows;
- Python/C++/Java/R/VBA/HTTP data interfaces;
- partner ecosystem including alternative, macro and industry datasets.

Use Wind and iFinD as broad China-market radar surfaces, not as factual origins when they are merely transporting third-party material.

### Global cross-check hubs

**LSEG Workspace**

Strong global counterpart:
- Reuters News plus thousands of authoritative sources;
- company fundamentals and estimates;
- industry and macro datasets;
- screening / idea generation;
- machine-readable news and research/filing search.

**Bloomberg Terminal**

Use for:
- global market-moving news and data;
- macro and cross-asset state changes;
- global companies, commodities and policy;
- pricing/context around events discovered in China.

### Structured intelligence / document hubs

**S&P Capital IQ Pro**

Useful for:
- company and industry intelligence;
- asset-level and sector data;
- news/research/transcripts/filings;
- private/public company and transaction mapping.

**FactSet**

Useful for:
- standardized fundamentals;
- estimate revisions and KPI screens;
- event monitoring;
- API/data-feed workflows;
- peer/ownership/portfolio context.

**AlphaSense**

Useful for:
- semantic search over filings, news, trade journals, broker research and expert calls;
- supplier/customer/competitor discovery;
- contradiction and narrative search.

## Discovery workflow

### Phase 1 — hub-only market scan

Search broad state-change concepts across the hubs:

- surprise / acceleration / deceleration
- shortage / surplus
- price or spread inflection
- inventory change
- order / backlog / tender
- utilization / capacity
- export/import change
- demand / volume / traffic
- regulation / reimbursement / capital access
- estimate revision
- liquidity / capital flow
- distress / default / refinancing

Do **not** preselect sectors.

Output:
- event cluster;
- earliest source timestamp;
- entities/value chains mentioned;
- whether the hub result is original or points elsewhere.

### Phase 2 — recover original evidence

For each candidate cluster:
- recover the original announcement, filing, data release, tender, physical index or interview;
- deduplicate mirrored stories;
- freeze availability timestamp.

A hub is a discovery surface, not an independent origin by itself.

### Phase 3 — specialist verification

Only now select the relevant validator:

- SMM / Mysteel / TrendForce / SCFI / industry associations;
- customs / regulators / ministries;
- procurement portals;
- company/customer/supplier first-party data.

The specialist source validates magnitude, causality and persistence.

### Phase 4 — listed-company mapping

Use:
- filings;
- IR;
- customer/supplier links;
- segment economics;
- balance-sheet/cash evidence.

### Phase 5 — expectations

Only after a stock candidate exists:
- consensus estimates;
- research reports;
- valuation;
- target-price history;
- estimate revisions;
- price absorption.

Research is used to ask **how much is already known**, not **what should we discover**.

## Why this is more generic

The previous architectures implicitly asked:

> Which sectors should we scan?

V4 asks:

> What economically material state changes appeared anywhere?

Sector taxonomy becomes an output of discovery rather than an input constraint.

This is important for previously under-covered opportunities such as:
- insurance/pension equity-flow changes;
- reimbursement/payment reforms;
- consumer channel turns;
- property/liquidity regimes;
- tender/order shocks;
- transport/logistics;
- agriculture;
- industrial machinery;
- private-company/customer/supplier changes.

## Required A/B experiment

Freeze the downstream Skill and compare:

- **A** old concentrated discovery;
- **B** hub-first discovery;
- **C** hub-first + specialist/original verification;
- **D** C + separately validated timing/absorption improvements.

For each arm measure:
- discovered independent event clusters;
- event lead time;
- sector-family entropy;
- specialist-only misses;
- selected opportunities / 52 weeks;
- 60d excess-win rate;
- median 60d excess;
- drawdown.

The first question is whether B/C greatly expands the base candidate pool **without changing selection logic**. Only then should timing logic be modified.
