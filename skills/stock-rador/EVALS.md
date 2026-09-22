# Stock Rador evaluation protocol

This file defines how changes to the AI research skill should be tested without turning
historical winners into prompt-fitting targets.

## 1. Version freeze

Every evaluation run records:
- skill version / commit SHA;
- model name and reasoning setting;
- cutoff timestamp;
- allowed source universe;
- discovery queries or discovery policy;
- candidate count before filtering;
- final research candidates.

The research artifact is immutable after outcome data are opened.

Use `scripts/lock-skill-run.cjs` to hash the manifest, skill, source pack and selected
memos before any post-cutoff price outcome is opened. `scripts/evaluate-skill-run.cjs`
fails if any frozen file changes after the lock.

## 2. Three evaluation sets

### Development set
Used to identify broad failure classes and improve the skill.

### Holdout historical set
Not used while editing the current skill version. It is opened only after the version is
frozen.

Historical replay has a special limitation: the current model weights may already encode
knowledge about events, winners and losers that occurred after the simulated cutoff.
Restricting web sources to the past does **not** remove that leakage channel.

Every historical replay must therefore freeze a source pack and record
`contaminationControls.modelMemoryRisk`. Prefer mechanically sampled windows, preserve
the discovery denominator and rejected cases, and use anonymized identity ablations where
possible. Treat unusually strong historical results as provisional until reproduced on
a different holdout and ultimately a forward sample.

### Forward set
Collected prospectively. This is the most important set for detecting hidden hindsight
bias and must never be used to tune old memos.

Forward runs should be frozen before future outcome data exist. They use the same
manifest/lock/evaluator pipeline as historical runs.

## 3. Evaluate the whole funnel

Do not report only returns of selected winners.

Measure:
- discovery coverage;
- rejection rate;
- evidence-completion rate;
- exposure-verification rate;
- expectation-gap completion rate;
- number of locked candidates;
- subsequent benchmark-relative returns;
- drawdown;
- thesis-confirmation or invalidation rate;
- time from discovery to evidence completion;
- time from thesis to market repricing.

Keep rejected and failed cases.

## 4. Compare ablations

Useful comparisons include:
- community discovery vs non-community discovery;
- source verification on vs off;
- causal earnings bridge on vs off;
- expectation-gap requirement on vs off;
- valuation/execution gate on vs off;
- adversarial disconfirmation on vs off.

An added stage is valuable only if it improves out-of-sample research quality or removes
false positives without simply deleting nearly every candidate.

## 5. No return-based prompt repair

After seeing outcomes, do not add rules such as:
- "prefer semiconductors" because semiconductor cases won;
- "avoid agriculture" because one agriculture case lost;
- fixed numeric thresholds derived from a handful of winners.

Instead identify reusable causes:
- exposure was too small;
- consensus had already revised;
- data came from one syndicated origin;
- the event was temporary;
- entry was not executable.

Then test the new rule on a different period.

## 6. Suggested outcome labels

For every locked memo:
- thesis_supported_and_priced;
- thesis_supported_not_priced;
- thesis_invalidated;
- exposure_mapping_failed;
- expectation_gap_absent;
- execution_failed;
- unresolved.

A price increase alone does not prove the thesis. A price decline alone does not falsify
the underlying event.

## 7. Minimum audit questions

Before accepting an evaluation:
1. Could the AI have seen information published after the cutoff?
2. Could the model weights themselves contain post-cutoff knowledge, and is that risk recorded?
3. Was `availableAt` genuinely provable?
4. Were candidates selected before viewing future returns?
5. Were delisted/suspended/failed names retained?
6. Were transaction constraints represented?
7. Was the benchmark fixed in advance?
8. Were prompt/rule changes tested on a new period?
9. Can another researcher reproduce the memo from the evidence ledger?

If any material answer is no, label the run exploratory rather than validation.
