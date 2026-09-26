const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const RUN='backtests/runs/2026-h1-weekly-replay-v1.9-001';
const LOCK=RUN+'/lock.json';
const DECISIONS=RUN+'/weekly-decisions.json';
const COST=0.001;
const BENCH='000300.SH';

function sha256(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}
function verifyLock(lock){
  const errors=[];
  for(const f of lock.files){
    if(!fs.existsSync(f.path)) errors.push(f.path+': missing');
    else if(sha256(f.path)!==f.sha256) errors.push(f.path+': sha256 mismatch');
  }
  if(errors.length) throw new Error('lock verification failed\n'+errors.join('\n'));
}
function tickerToTencent(t){
  const m=/^(\d{6})\.(SH|SZ)$/.exec(t); if(!m) throw new Error('bad ticker '+t);
  return (m[2]==='SH'?'sh':'sz')+m[1];
}
async function getJson(url){
  const r=await fetch(url,{headers:{'User-Agent':'stock-rador-weekly-replay/1.0'},signal:AbortSignal.timeout(30000)});
  if(!r.ok) throw new Error('HTTP '+r.status+' '+url);
  return r.json();
}
function parse(resp,symbol,adjusted,indexFallback=false){
  const n=resp?.data?.[symbol];
  const rows=adjusted ? (n?.hfqday ?? (indexFallback?n?.day:undefined)) : n?.day;
  if(!Array.isArray(rows)||!rows.length) throw new Error('no rows '+symbol);
  return rows.map(x=>({date:x[0],open:+x[1],close:+x[2],high:+x[3],low:+x[4],volume:+x[5]})).sort((a,b)=>a.date.localeCompare(b.date));
}
function url(symbol,start,end,adj){
  return 'https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param='+symbol+',day,'+start+','+end+',500,'+adj;
}
function retAfterCost(entryOpen,exitClose){
  return exitClose/entryOpen*(1-COST)/(1+COST)-1;
}
function mean(xs){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;}
function median(xs){if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function fridays(start,end){
 const out=[];let d=new Date(start+'T12:00:00Z'),e=new Date(end+'T12:00:00Z');
 while(d.getUTCDay()!==5)d.setUTCDate(d.getUTCDate()+1);
 while(d<=e){out.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+7);}
 return out;
}
function maxDrawdown(entryOpen,rows){
  let peak=1,dd=0;
  for(const r of rows){
    const v=r.close/entryOpen*(1-COST)/(1+COST);
    if(v>peak)peak=v;
    dd=Math.min(dd,v/peak-1);
  }
  return dd;
}

async function main(){
  const lock=JSON.parse(fs.readFileSync(LOCK,'utf8')); verifyLock(lock);
  const d=JSON.parse(fs.readFileSync(DECISIONS,'utf8'));
  const selections=d.frozenSelections;
  const tickers=[BENCH,...new Set(selections.map(x=>x.ticker))];
  const start='2026-01-05', end='2026-09-25';
  const series={};
  for(const ticker of tickers){
    const sym=tickerToTencent(ticker);
    const idx=ticker===BENCH;
    const au=url(sym,start,end,'hfq');
    const ar=await getJson(au);
    const adjusted=parse(ar,sym,true,idx);
    if(idx){series[ticker]={adjusted};continue;}
    const ru=url(sym,start,end,'none');
    const rr=await getJson(ru);
    series[ticker]={adjusted,raw:parse(rr,sym,false)};
  }
  const bench=series[BENCH].adjusted;
  const results=[];
  for(const s of selections){
    const stock=series[s.ticker].adjusted, raw=series[s.ticker].raw;
    const nominalEntryIdx=bench.findIndex(r=>r.date>s.weekEnd);
    if(nominalEntryIdx<0) throw new Error('no benchmark entry '+s.weekEnd);
    const nominalEntryDate=bench[nominalEntryIdx].date;
    const entry=stock.find(r=>r.date>=nominalEntryDate && (raw.find(q=>q.date===r.date)?.volume??0)>0);
    if(!entry) throw new Error('no executable entry '+s.ticker);
    const benchEntryIdx=bench.findIndex(r=>r.date===entry.date);
    if(benchEntryIdx<0) throw new Error('benchmark missing actual entry '+entry.date);
    const nominalExit=bench[benchEntryIdx+60-1];
    if(!nominalExit) throw new Error('60d not mature '+s.ticker);
    const exit=stock.find(r=>r.date>=nominalExit.date && (raw.find(q=>q.date===r.date)?.volume??0)>0);
    if(!exit) throw new Error('no executable exit '+s.ticker);
    const benchExit=bench.find(r=>r.date>=exit.date);
    if(!benchExit) throw new Error('benchmark missing actual exit '+exit.date);
    const net=retAfterCost(entry.open,exit.close);
    const bret=benchExit.close/bench[benchEntryIdx].open-1;
    const pathRows=stock.filter(r=>r.date>=entry.date&&r.date<=exit.date);
    results.push({
      ...s,
      nominalEntryDate,
      entryDate:entry.date,
      nominalExitDate:nominalExit.date,
      exitDate:exit.date,
      exitDelayCalendarDays:(new Date(exit.date)-new Date(nominalExit.date))/86400000,
      net60:net,
      benchmark60:bret,
      excess60:net-bret,
      positive60:net>0,
      excessWin60:net-bret>0,
      maxCloseDrawdown:maxDrawdown(entry.open,pathRows)
    });
  }
  const weeks=fridays('2026-01-01','2026-06-30');
  const newWeeks=new Set(selections.map(x=>x.weekEnd));
  const activeWeeks=weeks.filter(w=>results.some(r=>r.weekEnd<=w&&w<=r.exitDate));
  const net=results.map(r=>r.net60),ex=results.map(r=>r.excess60);
  const prim=results.filter(r=>r.selectionState==='High-priority selection');
  const report={
    schemaVersion:'1.0',
    runId:d.runId,
    lockedAt:lock.lockedAt,
    selectionDigest:lock.selectionDigest,
    priceFetchedAt:new Date().toISOString(),
    scope:'2026H1 weekly replay, 26 Friday checkpoints',
    weekly:{
      checkpoints:weeks.length,
      newOpportunityWeeks:newWeeks.size,
      newOpportunityWeekProbability:newWeeks.size/weeks.length,
      carryForwardActiveWeeks:activeWeeks.length,
      carryForwardActiveWeekProbability:activeWeeks.length/weeks.length,
      note:'carry-forward active probability is an upper-bound availability measure; it does not mean the thesis was fully re-underwritten from scratch every week.'
    },
    performance60d:{
      count:results.length,
      positiveCount:results.filter(r=>r.positive60).length,
      positiveRate:results.filter(r=>r.positive60).length/results.length,
      excessWinCount:results.filter(r=>r.excessWin60).length,
      excessWinRate:results.filter(r=>r.excessWin60).length/results.length,
      meanNetReturn:mean(net),
      medianNetReturn:median(net),
      meanExcessReturn:mean(ex),
      medianExcessReturn:median(ex),
      minNetReturn:Math.min(...net),
      maxNetReturn:Math.max(...net)
    },
    primary60d:{
      count:prim.length,
      positiveRate:prim.length?prim.filter(r=>r.positive60).length/prim.length:null,
      excessWinRate:prim.length?prim.filter(r=>r.excessWin60).length/prim.length:null,
      meanNetReturn:mean(prim.map(r=>r.net60)),
      meanExcessReturn:mean(prim.map(r=>r.excess60))
    },
    results
  };
  fs.writeFileSync(RUN+'/weekly-outcome.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e.stack||e.message);process.exit(1);});
