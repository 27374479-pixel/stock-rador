const fs=require('node:fs');
const crypto=require('node:crypto');

const RUN='backtests/runs/2025-weekly-eventtime-v1.9-001';
const COST=0.001;
const BENCH='000300.SH';

function sha256(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}
function verify(lock){const e=[];for(const f of lock.files){if(!fs.existsSync(f.path))e.push(f.path+': missing');else if(sha256(f.path)!==f.sha256)e.push(f.path+': sha256 mismatch');}if(e.length)throw new Error(e.join('\n'));}
function sym(t){const m=/^(\d{6})\.(SH|SZ)$/.exec(t);if(!m)throw new Error('bad ticker '+t);return(m[2]==='SH'?'sh':'sz')+m[1];}
function url(s,start,end,adj){return 'https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param='+s+',day,'+start+','+end+',700,'+adj;}
async function get(u){const r=await fetch(u,{headers:{'User-Agent':'stock-rador-2025-weekly/1.0'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('HTTP '+r.status+' '+u);return r.json();}
function parse(resp,s,adj,indexFallback=false){const n=resp?.data?.[s];const rows=adj?(n?.hfqday??(indexFallback?n?.day:undefined)):n?.day;if(!Array.isArray(rows)||!rows.length)throw new Error('no rows '+s);return rows.map(x=>({date:x[0],open:+x[1],close:+x[2],high:+x[3],low:+x[4],volume:+x[5]})).sort((a,b)=>a.date.localeCompare(b.date));}
function ret(o,c){return c/o*(1-COST)/(1+COST)-1;}
function mean(x){return x.length?x.reduce((a,b)=>a+b,0)/x.length:null;}
function median(x){if(!x.length)return null;const a=[...x].sort((p,q)=>p-q),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function fridays(start,end){const out=[];let d=new Date(start+'T12:00:00Z'),e=new Date(end+'T12:00:00Z');while(d.getUTCDay()!==5)d.setUTCDate(d.getUTCDate()+1);while(d<=e){out.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+7);}return out;}
function dd(open,rows){let peak=1,min=0;for(const r of rows){const v=r.close/open*(1-COST)/(1+COST);peak=Math.max(peak,v);min=Math.min(min,v/peak-1);}return min;}

async function main(){
 const lock=JSON.parse(fs.readFileSync(RUN+'/lock.json','utf8'));verify(lock);
 const d=JSON.parse(fs.readFileSync(RUN+'/weekly-decisions.json','utf8'));
 const sels=d.frozenSelections,tickers=[BENCH,...new Set(sels.map(x=>x.ticker))],series={};
 for(const t of tickers){
   const s=sym(t),idx=t===BENCH;
   const ar=await get(url(s,'2025-03-15','2026-04-30','hfq')); const adjusted=parse(ar,s,true,idx);
   if(idx){series[t]={adjusted};continue;}
   const rr=await get(url(s,'2025-03-15','2026-04-30','none')); series[t]={adjusted,raw:parse(rr,s,false)};
 }
 const b=series[BENCH].adjusted,results=[];
 for(const x of sels){
   const rows=series[x.ticker].adjusted,raw=series[x.ticker].raw;
   const ni=b.findIndex(r=>r.date>x.weekEnd);if(ni<0)throw new Error('no entry '+x.ticker);
   const nd=b[ni].date;
   const entry=rows.find(r=>r.date>=nd&&(raw.find(q=>q.date===r.date)?.volume??0)>0);if(!entry)throw new Error('no executable entry '+x.ticker);
   const bi=b.findIndex(r=>r.date===entry.date);if(bi<0)throw new Error('no aligned bench entry');
   const ne=b[bi+59];if(!ne)throw new Error('60d immature '+x.ticker);
   const exit=rows.find(r=>r.date>=ne.date&&(raw.find(q=>q.date===r.date)?.volume??0)>0);if(!exit)throw new Error('no exit '+x.ticker);
   const be=b.find(r=>r.date>=exit.date);if(!be)throw new Error('no bench exit');
   const n=ret(entry.open,exit.close),br=be.close/b[bi].open-1;
   results.push({...x,entryDate:entry.date,exitDate:exit.date,net60:n,benchmark60:br,excess60:n-br,positive60:n>0,excessWin60:n-br>0,maxCloseDrawdown:dd(entry.open,rows.filter(r=>r.date>=entry.date&&r.date<=exit.date))});
 }
 const weeks=fridays('2025-01-01','2025-12-31'),newWeeks=new Set(sels.map(x=>x.weekEnd));
 const active=weeks.filter(w=>results.some(r=>r.weekEnd<=w&&w<=r.exitDate));
 const net=results.map(x=>x.net60),ex=results.map(x=>x.excess60),prim=results.filter(x=>x.selectionState==='High-priority selection');
 const report={
   schemaVersion:'1.0',runId:d.runId,lockedAt:lock.lockedAt,selectionDigest:lock.selectionDigest,priceFetchedAt:new Date().toISOString(),
   scope:'2025 event-time weekly replay',
   weekly:{checkpoints:weeks.length,newOpportunityWeeks:newWeeks.size,newOpportunityWeekProbability:newWeeks.size/weeks.length,activeWeeks:active.length,activeWeekProbability:active.length/weeks.length},
   performance60d:{count:results.length,positiveCount:results.filter(x=>x.positive60).length,positiveRate:results.filter(x=>x.positive60).length/results.length,excessWinCount:results.filter(x=>x.excessWin60).length,excessWinRate:results.filter(x=>x.excessWin60).length/results.length,meanNetReturn:mean(net),medianNetReturn:median(net),meanExcessReturn:mean(ex),medianExcessReturn:median(ex),minNetReturn:Math.min(...net),maxNetReturn:Math.max(...net),medianMaxDrawdown:median(results.map(x=>x.maxCloseDrawdown))},
   primary60d:{count:prim.length,positiveRate:prim.length?prim.filter(x=>x.positive60).length/prim.length:null,excessWinRate:prim.length?prim.filter(x=>x.excessWin60).length/prim.length:null,meanNetReturn:mean(prim.map(x=>x.net60)),meanExcessReturn:mean(prim.map(x=>x.excess60))},
   results
 };
 fs.writeFileSync(RUN+'/weekly-outcome.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e.stack||e.message);process.exit(1);});
