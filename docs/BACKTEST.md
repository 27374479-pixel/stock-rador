# Skill backtest workflow

The purpose of this workflow is to test a frozen Stock Rador skill, not to produce a
good-looking historical chart.

## Why the old one-case replay is not enough

`scripts/replay-forum-case.cjs` is intentionally exploratory. Its event and two A-share
mappings were identified with hindsight, so its price result cannot validate the skill.

A valid run needs four phases that cannot be reordered:

1. **Research** — create point-in-time opportunity memos from an explicitly defined
   discovery universe.
2. **Freeze** — lock the skill, source pack, manifest and selected memos by SHA-256.
3. **Reveal** — only after the lock exists, obtain post-cutoff price/fundamental outcomes.
4. **Evaluate** — calculate fixed-horizon outcomes and classify failure modes without
   rewriting the frozen memos.

## Historical replay vs forward test

### Historical replay

Historical replay is useful for iteration, but it has an additional leakage channel:
the current model weights may contain knowledge of events and winners that occurred after
the simulated cutoff.

Therefore every historical manifest must include:
- a frozen source pack;
- an explicit `modelMemoryRisk`;
- the discovery window;
- the model/version/reasoning setting;
- the exact selected memo/ticker pairs.

When possible, reduce memory contamination by:
- choosing broad deterministic source packs rather than famous winners;
- using randomized or mechanically sampled historical windows;
- preserving rejected candidates and the discovery denominator;
- anonymizing company/ticker identity for ablation tests where identity is not necessary;
- testing the next skill revision on a different holdout window.

Historical replay can reject a bad skill quickly, but a strong result is still not the
final proof.

### Forward test

A forward run freezes research before future outcomes exist. This is the cleanest test of
the complete system because neither the model nor the researcher can know the result at
lock time.

Forward runs should use the same manifest and lock mechanism. Outcome files are created
later and must never alter the frozen research artifacts.

## Files in one run

A run should have a directory such as:

```text
backtests/runs/2026q4-forward-001/
  manifest.json
  source-pack.json        # historical replay; optional for true forward discovery
  memos/
    h001.json
    h002.json
  lock.json               # created before outcome data are opened
  prices.json             # added only after lock
  outcome.json            # evaluator output
```

The repository history itself becomes part of the audit trail: commit the research and
`lock.json` before adding `prices.json` / `outcome.json`.

## Manifest

Start from `skills/stock-rador/backtest-manifest.template.json`.

Important fields:
- `evaluationMode`: `historical_replay` or `forward`;
- `skill.path` and `skill.version`;
- `model`: exact model/reasoning configuration;
- `discoveryWindow`: fixed before outcome reveal;
- `eligibleMemoStates`: states that are allowed into the evaluated candidate set;
- `selections`: explicit memo + hypothesis + ticker pairs;
- `outcomePolicy`: entry rule, holding horizons and costs;
- `contaminationControls`: required for historical replay.

The evaluator does not search for the best holding period. The horizons are frozen in the
manifest.

## Freeze command

```powershell
node scripts/lock-skill-run.cjs backtests/runs/<run-id>/manifest.json
```

The command hashes:
- manifest;
- skill;
- historical source pack when applicable;
- every selected memo.

It refuses to overwrite an existing lock. Editing any frozen file after locking causes
the outcome evaluator to fail.

Commit the lock before outcome reveal.

## Price input

The outcome evaluator accepts a JSON object with the following shape:

```json
{
  "provider": "example",
  "fetchedAt": "2026-09-22T12:00:00.000Z",
  "series": {
    "000300.SH": {
      "adjusted": [
        {"date":"2024-01-02","open":100,"close":101,"high":102,"low":99,"volume":1}
      ]
    },
    "000001.SZ": {
      "adjusted": [
        {"date":"2024-01-02","open":10,"close":11,"high":11,"low":9.8,"volume":100}
      ],
      "unadjusted": [
        {"date":"2024-01-02","open":10,"close":11,"high":11,"low":9.8,"volume":100}
      ]
    }
  }
}
```

Adjusted prices are used for return paths. Unadjusted prices/volume are used for a
conservative suspension / one-price limit-up execution check.

## Evaluate command

```powershell
node scripts/evaluate-skill-run.cjs \
  backtests/runs/<run-id>/lock.json \
  backtests/runs/<run-id>/prices.json
```

For every frozen candidate the evaluator uses:
- the memo cutoff date;
- the next benchmark trading day open as the conservative entry;
- fixed benchmark-aligned holding windows;
- fixed one-way trading cost;
- close-path maximum drawdown;
- benchmark-relative return.

Aggregate output includes mean/median net return, mean/median excess return, excess hit
rate, positive-return rate and blocked-entry count.

## What counts as improvement

Do not optimize only average return.

A skill change is interesting when, on a **new holdout**:
- false positives decline for a clear general reason;
- evidence and exposure completion improve;
- benchmark-relative outcomes improve without collapsing candidate coverage;
- drawdown/execution behavior improves;
- failure analysis shows fewer causal, exposure or expectation-gap mistakes.

Never tune a new rule on the same outcomes used to justify that rule.

## Outcome interpretation

Price is an outcome metric, not proof of causal correctness.

A winning stock can have a wrong thesis. A losing stock can have a correct underlying
event that was already priced, mistimed or dominated by another factor.

Therefore every backtest should retain both:
1. quantitative price outcomes; and
2. qualitative failure labels from `skills/stock-rador/EVALS.md`.

The system improves only when both tell a coherent story.
