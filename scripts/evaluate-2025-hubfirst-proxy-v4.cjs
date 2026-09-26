const fs=require('node:fs'),crypto=require('node:crypto');
const RUN='backtests/runs/2025-hubfirst-proxy-v4-001',BENCH='000300.SH',COST=0.001;
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function verify(l){for(const f of l.files){if(!fs.existsSync(f.path)||sha(f.path)!==f.sha256)throw new Error('lock mismatch '+f.path);}}
function sym(t){const m=/^(\d{6})\.(SH|SZ)$/.exec(t);return(m[2]==='SH'?'sh':'sz')+m[1];}
function url(s,a,b,adj){return 'https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param='+s+',day,'+a+','+b+',700,'+adj;}
async function get(u){const r=await fetch(u,{headers:{'User-Agent':'stock-rador-hubfirst-v4/1.0'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}
function parse(j,s,adj,index=false){const n=j?.data?.[s],rows=adj?(n?.hfqday??(index?n?.day:null)):n?.day;if(!rows?.length)throw new Error('no rows '+s);return rows.map(x=>({date:x[0],open:+x[1],close:+x[2],volume:+x[5]})).sort((a,b)=>a.date.localeCompare(b.date));}
function ret(o,c){return c/o*(1-COST)/(1+COST)-1;}
function mean(xs){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;}
function median(xs){if(!xs.length)return null;const a=[...xs].sort((a,b)=>a-b),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function dd(open,rows){let peak=1,min=0;for(const r of rows){const v=r.close/open*(1-COST)/(1+COST);peak=Math.max(peak,v);min=Math.min(min,v/peak-1);}return min;}
async function main(){
 const lock=JSON.parse(fs.readFileSync(RUN+'/lock.json','utf8'));verify(lock);
 const d=JSON.parse(fs.readFileSync(RUN+'/underwriter-decisions.json','utf8')),sels=d.frozenSelections,ts=[BENCH,...new Set(sels.map(x=>x.ticker))],ser={};
 for(const t of ts){const s=sym(t),idx=t===BENCH,aj=await get(url(s,'2025-03-20','2026-03-31','hfq')),a=parse(aj,s,true,idx);if(idx){ser[t]={a};continue;}const rj=await get(url(s,'2025-03-20','2026-03-31','none'));ser[t]={a,r:parse(rj,s,false)};}
 const b=ser[BENCH].a,out=[];
 for(const x of sels){
  const a=ser[x.ticker].a,r=ser[x.ticker].r,ni=b.findIndex(q=>q.date>x.weekEnd);if(ni<0)throw new Error('no entry '+x.ticker);
  const nd=b[ni].date,e=a.find(q=>q.date>=nd&&(r.find(z=>z.date===q.date)?.volume??0)>0);if(!e)throw new Error('no executable entry '+x.ticker);
  const bi=b.findIndex(q=>q.date===e.date);const ne=b[bi+59];if(!ne)throw new Error('60d immature '+x.ticker);
  const z=a.find(q=>q.date>=ne.date&&(r.find(v=>v.date===q.date)?.volume??0)>0);if(!z)throw new Error('no exit '+x.ticker);
  const be=b.find(q=>q.date>=z.date);const n=ret(e.open,z.close),br=be.close/b[bi].open-1;
  out.push({...x,entryDate:e.date,exitDate:z.date,net60:n,benchmark60:br,excess60:n-br,positive60:n>0,excessWin60:n-br>0,maxCloseDrawdown:dd(e.open,a.filter(q=>q.date>=e.date&&q.date<=z.date))});
 }
 const net=out.map(x=>x.net60),ex=out.map(x=>x.excess60);
 const report={
  schemaVersion:'1.0',runId:d.runId,lockedAt:lock.lockedAt,selectionDigest:lock.selectionDigest,priceFetchedAt:new Date().toISOString(),
  discovery:{legacyEventCount:31,incrementalHubEvents:6,unionEventCount:37,recallIncrease:6/31,promotedHubEvents:7,researchSelections:3},
  performance60d:{count:out.length,positiveCount:out.filter(x=>x.positive60).length,positiveRate:out.filter(x=>x.positive60).length/out.length,excessWinCount:out.filter(x=>x.excessWin60).length,excessWinRate:out.filter(x=>x.excessWin60).length/out.length,meanNetReturn:mean(net),medianNetReturn:median(net),meanExcessReturn:mean(ex),medianExcessReturn:median(ex),medianMaxDrawdown:median(out.map(x=>x.maxCloseDrawdown))},
  results:out
 };
 fs.writeFileSync(RUN+'/outcome.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e.stack||e.message);process.exit(1);});