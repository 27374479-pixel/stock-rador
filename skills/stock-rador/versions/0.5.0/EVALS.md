# Stock Rador v0.5 evaluation protocol

## Core question

V0.5 evaluates two different claims independently:

1. **Opportunity alpha** — did the skill identify a real economic/value-chain opportunity
   that later mattered?
2. **Selection alpha** — did the chosen company outperform credible frozen alternatives from
   the cutoff price and expectations?

A run can succeed at (1) and fail at (2). That is not a contradiction.

## Two frozen gates

### Hypothesis gate

Memo field: `hypothesisState`

- Reject
- Watch
- Research hypothesis
- High-priority hypothesis

A High-priority hypothesis requires verified event evidence, a complete causal earnings
bridge, materiality, a measurable expectation gap, falsifiers and a pre-registered
realization horizon.

### Selection gate

Memo field: `selectionState`

- No selection
- Research selection
- High-priority selection

Only High-priority selection enters the primary stock-selection metric.

A High-priority hypothesis with No selection or Research selection is a valid result and
must not be treated as a failure to produce an answer.

## Cross-sectional evidence

For every selected company freeze 2-5 controls when feasible. Compare selected versus each
control before reveal across:
- exposure materiality;
- incremental earnings sensitivity;
- expectation saturation;
- valuation/downside asymmetry;
- order/backlog/customer visibility;
- realization timing;
- material execution/quality risks.

Do not optimize fixed weights from historical winners.

Each pairwise comparison records:
- selectedAdvantages;
- selectedDisadvantages;
- evidenceRefs;
- netEdge: selected / control / mixed / insufficient.

High-priority selection requires:
- overall `selectionEdgeConclusion` clear or credible;
- no frozen control with netEdge control or insufficient.

## Outcome metrics

At every frozen horizon report:
- selected net return;
- broad benchmark return/excess;
- equal-weight matched-control basket return/excess;
- best-control return;
- excess versus best control;
- whether selected beat every control;
- selected rank and rank percentile;
- close-path max drawdown;
- execution warnings.

The pre-registered base horizon remains primary even when another horizon looks better
after reveal.

## Interpretation

### hypothesis_supported_selection_supported
Hypothesis survives causal/fundamental review and selected stock beats the matched-control
basket at base horizon. Strongest price-based evidence additionally has positive
excess-vs-best-control and rank 1.

### hypothesis_supported_selection_mixed
Industry/value-chain thesis works, selected beats broad benchmark but does not clearly beat
the frozen alternatives.

### sector_beta_only
Selected beats broad benchmark but matched-control excess is non-positive.

### thesis_right_stock_wrong
Economic thesis is supported but one or more frozen alternatives capture the economics
better and selected ranks poorly.

### selection_right_thesis_wrong
Price outcome is favorable but later evidence does not support the frozen causal thesis.
Do not count as causal success.

### timing_wrong
Causal thesis may be correct but frozen realization timing was wrong.

### thesis_invalidated
Event, causal chain, exposure or expectation gap is contradicted.

### unresolved
Insufficient evidence.

## Historical validation classes

### exploratory_contaminated
Use when model-memory leakage or future search snippets were observed. May test mechanics
but not alpha.

### grounded_historical_replay
All material reasoning comes from a frozen pre-cutoff document pack, but model-weight
memory still cannot be ruled out. Stronger than exploratory, weaker than forward.

### forward_frozen
Research was frozen before the future outcome existed. This is the primary standard.

## Anti-overfitting

Never modify rules because a named stock/sector won or lost. Learn only reusable failure
classes such as:
- opportunity real but company edge absent;
- direct exposure over-weighted relative to expectations/valuation;
- alternative had better order visibility;
- valuation absorbed the fundamental advantage;
- hypothesis timing wrong;
- evidence leakage;
- execution constraints.

Test every revised rule on a different time window.

## Minimum acceptance checklist

A valid V0.5 selection run answers yes to:
1. Was discovery fixed before reveal?
2. Was every reviewed item frozen with a decision reason?
3. Was the opportunity hypothesis evaluated separately from company selection?
4. Were company alternatives frozen before reveal?
5. Was there one pairwise comparison per control?
6. Was the High-priority selection edge clear/credible before reveal?
7. Were broad, basket and best-control outcomes all reported?
8. Was the base horizon frozen before reveal?
9. Were code and research artifacts hashed?
10. Was contamination class disclosed?
11. Were losing/rejected/near-miss cases retained?
12. Is any next rule change tested on a new sample?

Forward-frozen evidence dominates historical replay when the two disagree.
