const fs=require('node:fs');
const path=require('node:path');

const ROOT=process.cwd();
const configs=[
  {
    run:'2026q1-multisource-deep-v0.6-001',
    signals:[
      {id:'h-memory-tightness-accelerates-2026q1',cluster:'memory-cycle',ticker:'603986.SH'},
      {id:'h-lithium-storage-rebound-2026q1',cluster:'lithium-storage',ticker:'300014.SZ'},
      {id:'h-energy-shipping-rate-spike-2026q1',cluster:'energy-shipping',ticker:'600026.SH'}
    ]
  },
  {
    run:'2026q2-multisource-deep-v0.7-001',
    signals:[
      {id:'h-q2-ess-demand-catl-2026q2',cluster:'ess-battery',ticker:'300750.SZ'},
      {id:'h-q2-memory-structural-shortage-2026q2',cluster:'memory-cycle',ticker:'603986.SH'},
      {id:'h-q2-passive-component-divergence-2026q2',cluster:'passive-components',ticker:'300408.SZ'}
    ]
  }
];

function fridays(start,end){
  const out=[];
  let d=new Date(start+'T12:00:00Z'), e=new Date(end+'T12:00:00Z');
  while(d.getUTCDay()!==5)d.setUTCDate(d.getUTCDate()+1);
  while(d<=e){out.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+7);}
  return out;
}
function dateOnly(x){return String(x).slice(0,10);}
function median(xs){const a=[...xs].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function mean(xs){return xs.reduce((a,b)=>a+b,0)/xs.length;}
function pct(n,d){return d? n/d:null;}

const signals=[];
for(const cfg of configs){
  const base=path.join(ROOT,'backtests','runs',cfg.run);
  const outcome=JSON.parse(fs.readFileSync(path.join(base,'outcome.json'),'utf8'));
  for(const s of cfg.signals){
    const r=(outcome.results||[]).find(x=>x.hypothesisId===s.id && x.ticker===s.ticker);
    if(!r) throw new Error('missing result '+s.id);
    const h60=r.horizons?.['60'];
    if(!h60) throw new Error('missing 60d '+s.id);
    signals.push({
      ...s,
      run:cfg.run,
      selectionState:r.selectionState||r.state,
      readyDate:dateOnly(r.researchReadyAt),
      entryDate:r.entryDate,
      activeThrough:h60.exitDate,
      net60:h60.netReturn,
      excess60:h60.excessReturn
    });
  }
}

// Deduplicate same cluster+ticker if the later signal appears before the earlier one's 60d exit.
const independent=[];
for(const s of [...signals].sort((a,b)=>a.readyDate.localeCompare(b.readyDate))){
  const prev=[...independent].reverse().find(x=>x.cluster===s.cluster && x.ticker===s.ticker);
  s.independentNew = !(prev && s.readyDate<=prev.activeThrough);
  if(s.independentNew) independent.push(s);
}

const weeks=fridays('2026-01-01','2026-06-30');
const weekly=weeks.map(w=>{
  const active=signals.filter(s=>s.readyDate<=w && w<=s.activeThrough);
  const rawNew=signals.filter(s=>{
    // signal belongs to this checkpoint if it became ready after previous Friday and by this Friday
    const wi=weeks.indexOf(w);
    const prev=wi===0?'1900-01-01':weeks[wi-1];
    return s.readyDate>prev && s.readyDate<=w;
  });
  const newIndependent=rawNew.filter(s=>s.independentNew);
  return {
    weekEnd:w,
    hasActiveSelection:active.length>0,
    activeTickers:[...new Set(active.map(s=>s.ticker))],
    activeSignalCount:active.length,
    hasRawNewSignal:rawNew.length>0,
    rawNewSignals:rawNew.map(s=>s.id),
    hasIndependentNewOpportunity:newIndependent.length>0,
    independentNewOpportunities:newIndependent.map(s=>s.id)
  };
});

const raw=signals;
const dedup=signals.filter(s=>s.independentNew);
function perf(rows){
 const net=rows.map(x=>x.net60),ex=rows.map(x=>x.excess60);
 return {
   count:rows.length,
   positive60Count:net.filter(x=>x>0).length,
   positive60Rate:pct(net.filter(x=>x>0).length,rows.length),
   excess60Count:ex.filter(x=>x>0).length,
   excess60Rate:pct(ex.filter(x=>x>0).length,rows.length),
   mean60:mean(net),median60:median(net),
   meanExcess60:mean(ex),medianExcess60:median(ex),
   min60:Math.min(...net),max60:Math.max(...net)
 };
}
const report={
 schemaVersion:'1.0',
 scope:'2026H1 frozen Q1/Q2 decision baseline',
 warning:'This is a weekly reconstruction from already-frozen 2026 Q1/Q2 source packs and decisions, not yet a from-scratch weekly rediscovery with the final V1.9 Skill.',
 definitions:{
   activeWeek:'at least one frozen selection is ready by that Friday and remains within its 60-trading-day base horizon',
   independentNewOpportunity:'first selection for a cluster+ticker; same cluster+ticker re-underwrite inside the earlier 60d horizon is deduplicated',
   win:'60-trading-day net return > 0',
   excessWin:'60-trading-day excess return versus CSI300 > 0'
 },
 summary:{
   weeklyCheckpoints:weekly.length,
   activeWeeks:weekly.filter(x=>x.hasActiveSelection).length,
   activeWeekProbability:pct(weekly.filter(x=>x.hasActiveSelection).length,weekly.length),
   rawNewSignalWeeks:weekly.filter(x=>x.hasRawNewSignal).length,
   rawNewSignalWeekProbability:pct(weekly.filter(x=>x.hasRawNewSignal).length,weekly.length),
   independentNewOpportunityWeeks:weekly.filter(x=>x.hasIndependentNewOpportunity).length,
   independentNewOpportunityWeekProbability:pct(weekly.filter(x=>x.hasIndependentNewOpportunity).length,weekly.length),
   rawSignalCount:raw.length,
   independentSignalCount:dedup.length,
   raw60dPerformance:perf(raw),
   independent60dPerformance:perf(dedup),
   primarySignals:raw.filter(x=>x.selectionState==='High-priority selection').length,
   primary60dPerformance:perf(raw.filter(x=>x.selectionState==='High-priority selection'))
 },
 signals,
 weekly
};
console.log(JSON.stringify(report,null,2));
