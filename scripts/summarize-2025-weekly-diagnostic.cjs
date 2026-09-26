const fs=require('node:fs');
const path=require('node:path');

const ROOT=process.cwd();
const runs=[
  '2025q1-multisource-deep-v0.9-001',
  '2025q2-multisource-deep-v0.9-001',
  '2025q3-multisource-deep-v0.8-001',
  '2025q4-multisource-deep-v0.6-002'
];

function mean(xs){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;}
function median(xs){if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function fridays(start,end){
  const out=[];let d=new Date(start+'T12:00:00Z'),e=new Date(end+'T12:00:00Z');
  while(d.getUTCDay()!==5)d.setUTCDate(d.getUTCDate()+1);
  while(d<=e){out.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+7);}
  return out;
}
function weekFor(date,weeks){
  return weeks.find(w=>w>=date) || weeks.at(-1);
}
function family(event){
  const s=[event.eventId,event.statement,...(event.affectedValueChain||[])].join(' ').toLowerCase();
  if(/memory|dram|nand|hbm|foundry|hdd|optical|mlcc|semiconductor|chip/.test(s)) return 'technology_hardware';
  if(/power|grid|transform|switchgear|electrification|solar|battery|storage|pv|inverter/.test(s)) return 'power_energy_transition';
  if(/gold|copper|rare.?earth|tungsten|coal|metal|mineral|germanium/.test(s)) return 'resources_materials';
  if(/manufactur|ppi|tariff|deflation|anti-involution/.test(s)) return 'macro_industrial_context';
  if(/consumer|retail|appliance|travel|food|liquor/.test(s)) return 'consumer';
  if(/health|drug|pharma|medical|biotech/.test(s)) return 'healthcare';
  if(/bank|broker|insurance|credit|property|real.?estate/.test(s)) return 'financial_property';
  if(/pig|pork|agri|fertilizer|grain/.test(s)) return 'agriculture';
  if(/shipping|freight|port/.test(s)) return 'transport_shipping';
  return 'other';
}
const weeks=fridays('2025-01-01','2025-12-31');
const signals=[], events=[], publisherCounts={}, laneCounts={}, familyCounts={};
let promoted=0,memos=0,noSelection=0;
for(const run of runs){
  const base=path.join(ROOT,'backtests','runs',run);
  const sp=JSON.parse(fs.readFileSync(path.join(base,'source-pack.json'),'utf8'));
  const sc=JSON.parse(fs.readFileSync(path.join(base,'screening.json'),'utf8'));
  const out=JSON.parse(fs.readFileSync(path.join(base,'outcome.json'),'utf8'));
  for(const x of sp.sourceItems||[]){
    publisherCounts[x.publisher]=(publisherCounts[x.publisher]||0)+1;
    laneCounts[x.laneId]=(laneCounts[x.laneId]||0)+1;
  }
  for(const e of sp.eventClusters||[]){
    const f=family(e);
    familyCounts[f]=(familyCounts[f]||0)+1;
    events.push({run,eventId:e.eventId,firstAvailableAt:e.firstAvailableAt,family:f,novelty:e.noveltyAssessment});
  }
  promoted+=Number(sc.summary?.promotedEventCount||0);
  memos+=Number(out.hypothesisMemoSummary?.count||0);
  noSelection+=Number(out.hypothesisMemoSummary?.noSelectionCount||0);
  for(const r of out.results||[]){
    const h60=r.horizons?.['60'];
    if(!h60) continue;
    signals.push({
      run,
      hypothesisId:r.hypothesisId,
      ticker:r.ticker,
      state:r.selectionState||r.state,
      readyDate:String(r.actionableAt||r.researchReadyAt).slice(0,10),
      entryDate:r.entryDate,
      exitDate:h60.exitDate,
      net60:h60.netReturn,
      excess60:h60.excessReturn,
      dd60:h60.closePathMaxDrawdown?.value??null
    });
  }
}
const newWeeks=new Set(signals.map(s=>weekFor(s.readyDate,weeks)));
const activeWeeks=weeks.filter(w=>signals.some(s=>s.readyDate<=w && w<=s.exitDate));
const net=signals.map(x=>x.net60),ex=signals.map(x=>x.excess60);
const publisherSorted=Object.entries(publisherCounts).sort((a,b)=>b[1]-a[1]);
const top5Items=publisherSorted.slice(0,5).reduce((a,x)=>a+x[1],0);
const totalItems=publisherSorted.reduce((a,x)=>a+x[1],0);
const report={
  schemaVersion:'1.0',
  scope:'2025 frozen quarterly multisource runs reconstructed as weekly availability baseline',
  caution:'Weekly timing uses the frozen memo ready/actionable dates; it does not yet re-underwrite every event at every prior Friday.',
  funnel:{
    discoveredEvents:events.length,
    promotedEvents:promoted,
    frozenMemos:memos,
    selectedSignals:signals.length,
    noSelectionMemos:noSelection,
    eventToPromotedRate:promoted/events.length,
    eventToSelectionRate:signals.length/events.length,
    promotedToSelectionRate:signals.length/promoted
  },
  weekly:{
    checkpoints:weeks.length,
    newOpportunityWeeks:newWeeks.size,
    newOpportunityWeekProbability:newWeeks.size/weeks.length,
    activeWeeks:activeWeeks.length,
    activeWeekProbability:activeWeeks.length/weeks.length
  },
  performance60d:{
    count:signals.length,
    positiveCount:net.filter(x=>x>0).length,
    positiveRate:net.filter(x=>x>0).length/signals.length,
    excessWinCount:ex.filter(x=>x>0).length,
    excessWinRate:ex.filter(x=>x>0).length/signals.length,
    meanNetReturn:mean(net),
    medianNetReturn:median(net),
    meanExcessReturn:mean(ex),
    medianExcessReturn:median(ex),
    minNetReturn:Math.min(...net),
    maxNetReturn:Math.max(...net),
    medianMaxDrawdown:median(signals.map(x=>x.dd60).filter(Number.isFinite))
  },
  discoveryBias:{
    eventFamilyCounts:familyCounts,
    publisherCounts:Object.fromEntries(publisherSorted),
    totalSourceItems:totalItems,
    top5PublisherShare:totalItems?top5Items/totalItems:null,
    laneCounts,
    absentOrNearAbsentFamilies:['consumer','healthcare','financial_property','agriculture','transport_shipping']
      .filter(f=>(familyCounts[f]||0)<=1)
  },
  signals,
  events
};
console.log(JSON.stringify(report,null,2));
