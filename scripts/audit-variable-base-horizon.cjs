const fs = require('node:fs');

function mean(values) {
  return values.length ? values.reduce((sum, x) => sum + x, 0) / values.length : null;
}
function median(values) {
  if (!values.length) return null;
  const xs = [...values].sort((a,b)=>a-b);
  const m = Math.floor(xs.length/2);
  return xs.length % 2 ? xs[m] : (xs[m-1] + xs[m]) / 2;
}

function auditVariableBase(outcome) {
  const primary = (outcome?.results ?? []).filter((r) => r?.isPrimarySignal && r?.thesisBaseOutcome);
  const grouped = new Map();
  for (const row of primary) {
    const base = row?.expectedRealization?.baseTradingDays;
    if (!Number.isInteger(base) || base < 1) throw new Error(`invalid frozen base horizon for ${row?.hypothesisId}`);
    const h = row.thesisBaseOutcome;
    if (!grouped.has(row.hypothesisId)) grouped.set(row.hypothesisId, []);
    grouped.get(row.hypothesisId).push({
      ticker: row.ticker,
      baseTradingDays: base,
      netReturn: h.netReturn,
      excessReturn: h.excessReturn,
      matchedControlExcess: h.matchedControlExcess,
      excessVsBestControl: h.excessVsBestControl,
      winsAllControls: h.winsAllControls
    });
  }

  const hypothesisRows = [];
  for (const [hypothesisId, members] of grouped) {
    const bases = [...new Set(members.map((x)=>x.baseTradingDays))];
    if (bases.length !== 1) throw new Error(`hypothesis ${hypothesisId} has inconsistent frozen base horizons`);
    hypothesisRows.push({
      hypothesisId,
      baseTradingDays: bases[0],
      tickerCount: members.length,
      netReturn: mean(members.map((x)=>x.netReturn)),
      excessReturn: mean(members.map((x)=>x.excessReturn)),
      positive: mean(members.map((x)=>x.netReturn)) > 0,
      beatBenchmark: mean(members.map((x)=>x.excessReturn)) > 0,
      members
    });
  }

  return {
    schemaVersion: '1.0',
    runId: outcome.runId,
    label: 'heterogeneous_frozen_base_horizon_audit',
    diagnosticOnly: true,
    legacyOpportunityFirstBaseWarning:
      'outcome.aggregate.opportunityFirstBase uses a legacy common 60d horizon when 60d is present and is not valid for heterogeneous memo base horizons.',
    methodology:
      'Group primary selections by hypothesis and use each frozen result.thesisBaseOutcome, which is already keyed to that memo expectedRealization.baseTradingDays.',
    hypothesisRows,
    aggregate: {
      count: hypothesisRows.length,
      directionCaptureRate: hypothesisRows.length ? hypothesisRows.filter((x)=>x.beatBenchmark).length / hypothesisRows.length : null,
      positiveBasketRate: hypothesisRows.length ? hypothesisRows.filter((x)=>x.positive).length / hypothesisRows.length : null,
      meanOpportunityNetReturn: mean(hypothesisRows.map((x)=>x.netReturn)),
      medianOpportunityNetReturn: median(hypothesisRows.map((x)=>x.netReturn)),
      meanOpportunityExcessReturn: mean(hypothesisRows.map((x)=>x.excessReturn)),
      medianOpportunityExcessReturn: median(hypothesisRows.map((x)=>x.excessReturn))
    }
  };
}

if (require.main === module) {
  const input = process.argv[2];
  const output = process.argv[3];
  if (!input || !output) {
    console.error('Usage: node scripts/audit-variable-base-horizon.cjs <outcome.json> <audit.json>');
    process.exit(2);
  }
  const outcome = JSON.parse(fs.readFileSync(input, 'utf8'));
  const report = auditVariableBase(outcome);
  if (fs.existsSync(output)) throw new Error(`refusing to overwrite existing audit ${output}`);
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(output);
}

module.exports = { auditVariableBase };
