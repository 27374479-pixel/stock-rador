---
name: a-share-opportunity-research
description: Discover and analyze A-share investment opportunities from real-world changes using point-in-time evidence, causal reasoning, falsification, company-level earnings mapping, price/expectation analysis, and leakage-controlled selection locks. Use for historical validation and live research. Do not begin from stock tips or known winners.
---

# A-share Opportunity Research Skill

## Mission

Find changes in the real world **before** searching for stocks, then determine whether those changes can create an underappreciated earnings opportunity in an A-share company.

This skill is deliberately industry-agnostic. Do not assume the opportunity must come from AI, batteries, new energy, commodities, pharmaceuticals, industrial automation or any other familiar sector.

The deterministic research engine handles timestamps, candidate quarantine, selection locking and backtesting. This skill handles discovery, verification, causal reasoning and company research.

## Non-negotiable principles

1. **Do not search for stocks first. Search for changes in the real world first.**
2. **Do not ask which companies are related. Ask which companies economically capture the change.**
3. **A true story is not necessarily an investment opportunity.**
4. **A great company is not necessarily a good stock at the current price.**
5. **Try to kill the thesis before trying to prove it.**
6. **Never use post-cutoff prices, later earnings, later orders or hindsight labels in a historical selection.**
7. **No Trade is a first-class result. Never force a candidate.**
8. **Do not reuse a ticker whose relevant future path is already quarantined by the validation ledger.**

## Operating modes

### Historical validation mode

Before research, establish:
- exact research window;
- exact point-in-time cutoff;
- quarantined tickers;
- forbidden outcome-oriented search terms;
- whether Watch futures must remain unopened.

During selection, do not fetch or inspect any information first published or first available after the cutoff.

The final research packet must be committed before the deterministic engine is allowed to fetch post-signal prices.

### Live research mode

Use only currently available information. The same causal and source-quality rules apply, but no historical outcome unlock is involved.

## Stage 1 — Discover real-world anomalies

Search across multiple domains without naming target stocks. Prefer operational language:

- shortage / lead time / backlog / allocation;
- price increase / price collapse / spread change;
- inventory / destocking / restocking;
- capacity / utilization / shutdown / expansion;
- order book / delivery delay / qualification;
- customer migration / substitution / share shift;
- new technical architecture / standard transition;
- policy change / reimbursement / regulation;
- logistics disruption / route change;
- hiring / capex / procurement / tender;
- crop yield / disease / weather / resource constraint.

Avoid queries such as:
- 牛股 / 翻倍 / 暴涨 / 龙头;
- winner / best stock / multibagger;
- “which stock benefited from X”.

Produce 3–8 candidate **real-world changes**, not stocks.

## Stage 2 — Verify the claim

For each potential signal:

1. Find the original source if possible.
2. Record published time and first-available time.
3. Distinguish firsthand observation from hearsay.
4. Identify the source's incentives and possible promotion.
5. Search for independent corroboration.
6. Search explicitly for contradictory evidence.
7. Collapse copied articles, the same wire story and the same quoted source into one independence group.
8. Prefer primary/official and professional-data sources for confirmation.
9. Treat investor social media primarily as discovery or expectation/saturation evidence.

Do not output a probability of truth simply because an LLM “feels” confident. Output auditable evidence and a status such as Confirmed / Probable / Unverified / Contradicted.

See `references/source-policy.md`.

## Stage 3 — Think from first principles

Before looking for a ticker, answer:

- What changed?
- Why did it change now?
- What is the causal mechanism?
- Is the change structural, cyclical, one-off, policy-driven, geographic, substitution-driven or cost-driven?
- Who loses revenue/profit because of this?
- Who gains revenue/profit?
- Is the profit pool expanding or merely moving?
- What is the bottleneck?
- Why can the bottleneck not be solved quickly?
- What could make the signal disappear?
- What would falsify the thesis?

Classify the shock into one or more types:
- structural architecture transition;
- supply shortage / bottleneck;
- demand acceleration;
- geographic market opening;
- share substitution;
- cost-curve shock;
- cyclical inventory / price reversal;
- policy / regulatory change;
- temporary event / one-off order.

Use the matching questions in `references/question-bank.md`.

## Stage 4 — Define the beneficiary archetype before stock search

Write an ideal beneficiary description without a ticker.

Example:

> “A supplier already qualified by European customers, with existing export capacity, a product directly inside the bottleneck, competitors unable to deliver, and enough revenue materiality for the change to affect EPS.”

The archetype must specify:
- product/service;
- customer/geography;
- existing capacity;
- proof of delivery or qualification;
- economic mechanism;
- expected duration;
- balance-sheet requirements;
- what would make a company only an adjacency/concept name.

Only after this archetype is written may you search A-shares.

## Stage 5 — Search and grade companies

For each company, verify point-in-time evidence for:

### Economic exposure
- Does it sell the actual bottleneck product/service?
- What percentage of revenue/profit is relevant?
- Is the target customer/geography correct?
- Is it already qualified or shipping?

### Monetization
- Can it deliver incremental units?
- Does it have spare capacity or a credible expansion path?
- Can price/mix/share gains reach gross profit?
- Is it blocked by the same upstream constraint?
- Is the benefit durable after normalization?

### Earnings bridge
Trace explicitly:

`real-world change -> volume / price / mix / share -> revenue -> gross margin -> operating profit -> EPS / cash flow`

If a link is speculative, label it.

### Balance sheet / cycle sensitivity
Especially for cyclical or commodity signals, inspect:
- inventory amount and purchase timing;
- inventory write-down risk;
- working-capital needs;
- debt and financing costs;
- customer receivables;
- operating leverage;
- whether falling/rising input costs are actually positive for the company.

### Competitive quality
- Why this company rather than peers?
- What prevents capacity replication?
- Is there qualification, process, IP, customer stickiness or scale advantage?
- Is management execution credible based on point-in-time evidence?

## Stage 6 — Determine whether the opportunity is already priced

Do not treat prior price appreciation as an automatic disqualifier.

Ask instead:
- What does the current price appear to assume?
- Has consensus earnings already revised?
- Is the narrative saturated in media/social channels?
- Has the stock moved much faster than the underlying earnings bridge?
- Is the change in earnings likely larger or longer-lived than current expectations?
- Is valuation dependent on an unrealistic terminal assumption?
- Could a strongly rising stock still be underpriced because the economic regime changed?

Price attractiveness must be assessed relative to the magnitude/duration of the earnings change, not by momentum alone.

## Stage 7 — Kill the thesis

For every Candidate, actively seek the strongest bear case and at least three concrete thesis breakers.

Examples:
- lead times suddenly normalize;
- customer qualification fails;
- competitor adds capacity;
- inventory becomes excess;
- ASP falls faster than cost;
- customer concentration is lost;
- regulation changes;
- capex is delayed;
- order growth fails to translate into cash flow.

A Candidate that cannot articulate how it can be wrong is not ready.

## Stage 8 — Decision

Use qualitative decisions, not fake numerical precision:

- **Candidate**: evidence is strong, causal chain is complete, company capture is demonstrated, and price/expectation gap remains plausible.
- **Watch**: real signal exists but one or more important links are not yet proven or price attractiveness is unclear.
- **No Trade**: factual signal may be true, but there is no clean beneficiary, no durable earnings bridge, or the opportunity is already too fully reflected.

For historical validation, the final Candidate set must be passed to the deterministic lock before any outcome is opened.

## Backtest-driven learning

After a window is consumed:

1. Separate **signal failure**, **mapping failure**, **earnings-bridge failure**, **pricing failure**, **timing failure**, and **risk/drawdown failure**.
2. Add newly discovered questions to the question bank as **experimental** immediately when they are broadly applicable and falsifiable.
3. Do **not** convert one historical failure into a hard selection rule.
4. Promote an experimental question into a hard/core question only after it is supported by at least two independent consumed windows or by strong external research plus one consumed window.
5. Change numeric thresholds/weights only between untouched windows, with a version bump and a committed changelog.
6. Never rescore a consumed window as fresh validation.

The goal is to improve the questions faster than the thresholds.

## Required output

Produce a research packet matching `references/research-packet.md`.

The packet must clearly separate:
- facts;
- inference;
- uncertainty;
- contrary evidence;
- candidate reasoning;
- price/expectation reasoning;
- thesis breakers;
- final decision;
- data that was unavailable at the cutoff.

Do not include post-cutoff outcome data in a historical selection packet.
