const fs=require('node:fs');

const cfg=JSON.parse(fs.readFileSync('backtests/source-quality-ablation-v1.json','utf8'));
const y25=JSON.parse(fs.readFileSync('backtests/runs/2025-weekly-eventtime-v1.9-001/weekly-outcome.json','utf8'));
const miss=JSON.parse(fs.readFileSync('backtests/runs/2025-broadsource-miss-audit-v1/outcome.json','utf8'));
const y26=JSON.parse(fs.readFileSync('backtests/runs/2026-h1-weekly-replay-v1.9-001/weekly-outcome.json','utf8'));

const outcomeRows=[
  ...y25.results.map(x=>({...x,cohort:'2025_eventtime'})),
  ...miss.results.map(x=>({...x,cohort:'2025_broadsource_incremental'})),
  ...y26.results.map(x=>({...x,cohort:'2026_h1'}))
];
const key=x=>[x.cohort,x.weekEnd,x.ticker,x.cluster].join('|');
const byKey=new Map(outcomeRows.map(x=>[key(x),x]));
const rows=cfg.cases.map(c=>{
  const o=byKey.get(key(c));
  if(!o) throw new Error('Missing outcome for '+key(c));
  return {...c,net60:o.net60,excess60:o.excess60,positive60:o.net60>0,excessWin60:o.excess60>0};
});

function mean(xs){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;}
function median(xs){if(!xs.length)return null;const a=[...xs].sort((a,b)=>a-b),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function metrics(xs){
  return {
    count:xs.length,
    positiveCount:xs.filter(x=>x.positive60).length,
    positiveRate:xs.length?xs.filter(x=>x.positive60).length/xs.length:null,
    excessWinCount:xs.filter(x=>x.excessWin60).length,
    excessWinRate:xs.length?xs.filter(x=>x.excessWin60).length/xs.length:null,
    meanNet60:mean(xs.map(x=>x.net60)),
    medianNet60:median(xs.map(x=>x.net60)),
    meanExcess60:mean(xs.map(x=>x.excess60)),
    medianExcess60:median(xs.map(x=>x.excess60))
  };
}
const cohorts={};
for(const name of [...new Set(rows.map(x=>x.cohort))]){
  const xs=rows.filter(x=>x.cohort===name);
  cohorts[name]={all:metrics(xs),quorumPass:metrics(xs.filter(x=>x.quorumPass)),quorumFail:metrics(xs.filter(x=>!x.quorumPass))};
}
const y25base=rows.filter(x=>x.cohort==='2025_eventtime');
const y25expanded=rows.filter(x=>x.cohort==='2025_eventtime'||x.cohort==='2025_broadsource_incremental');
const y25expandedQuorum=y25expanded.filter(x=>x.quorumPass);
const mainNoMiss=rows.filter(x=>x.cohort!=='2025_broadsource_incremental');
const pooledQuorum=mainNoMiss.filter(x=>x.quorumPass);

const report={
  schemaVersion:'1.0',
  experimentId:cfg.experimentId,
  validationClass:cfg.validationClass,
  interpretationGuardrails:[
    'Source-quality classifications were designed after some historical outcomes were already known; treat this as diagnostic, not causal proof.',
    'A source quorum can improve evidence completeness but cannot by itself solve price absorption, event half-life, market-regime opportunity cost, or stale re-underwrite.',
    'The 2025 broad-source incremental cases test recall expansion separately from evidence-quality filtering.'
  ],
  comparisons:{
    '2025_old_eventtime_pool':metrics(y25base),
    '2025_expanded_pool_same_selection_logic':metrics(y25expanded),
    '2025_expanded_pool_with_source_quorum':metrics(y25expandedQuorum),
    '2025_2026_main_sample_no_quorum_filter':metrics(mainNoMiss),
    '2025_2026_main_sample_source_quorum_only':metrics(pooledQuorum)
  },
  cohortBreakdown:cohorts,
  rows
};
console.log(JSON.stringify(report,null,2));
