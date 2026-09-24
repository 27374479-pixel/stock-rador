const fs = require('node:fs');
const path = require('node:path');
const { readJson, verifyLock } = require('./backtest-core-v180.cjs');

function addDays(date, days) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0,10);
}
function symbol(ticker) {
  const m=/^(\d{6})\.(SH|SZ)$/.exec(ticker);
  if(!m) throw new Error('unsupported ticker '+ticker);
  return (m[2]==='SH'?'sh':'sz')+m[1];
}
async function fetchRows(ticker,start,end) {
  const s=symbol(ticker);
  const url='https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param='+s+',day,'+start+','+end+',400,hfq';
  const r=await fetch(url,{headers:{'User-Agent':'stock-rador-postoutcome-audit/1.0'},signal:AbortSignal.timeout(30000)});
  if(!r.ok) throw new Error('HTTP '+r.status+' '+ticker);
  const j=await r.json();
  const node=j.data?.[s]||{};
  const rows=node.hfqday||node.day;
  if(!Array.isArray(rows)||!rows.length) throw new Error('no rows '+ticker);
  return rows.map(x=>({date:x[0],open:Number(x[1]),close:Number(x[2])}));
}
function netReturn(open,close,cost=0.001){ return (close*(1-cost))/(open*(1+cost))-1; }
async function main(){
  const [lockPath,outPath]=process.argv.slice(2);
  if(!lockPath||!outPath){console.error('Usage: node scripts/postoutcome-frozen-basket-audit.cjs <lock.json> <out.json>');process.exit(2);}
  const root=process.cwd(), lock=readJson(lockPath);
  const mismatch=verifyLock(lock,root); if(mismatch.length) throw new Error('frozen run changed:\n- '+mismatch.join('\n- '));
  const manifest=readJson(path.resolve(root,lock.files.find(x=>x.role==='manifest').path));
  const cutoff=manifest.discoveryWindow.endDate;
  const start=addDays(cutoff,-5), end=addDays(cutoff,300);
  const benchmark=await fetchRows(manifest.benchmark.ticker,start,end);
  const entryIndex=benchmark.findIndex(x=>x.date>cutoff);
  const entryDate=benchmark[entryIndex].date;
  const horizons=[20,60,120];
  const exitDates=Object.fromEntries(horizons.map(h=>[h,benchmark[entryIndex+h-1].date]));
  const benchmarkReturns=Object.fromEntries(horizons.map(h=>{
    const e=benchmark.find(x=>x.date===exitDates[h]);
    return [h,e.close/benchmark[entryIndex].open-1];
  }));
  const groups={
    rareearth_no_selection:['600111.SH','600259.SH','000831.SZ'],
    dram_proxy_no_selection:['603986.SH','300223.SZ','300327.SZ'],
    aluminum_exception_aux:['000807.SZ','600219.SH','000933.SZ']
  };
  const result={schemaVersion:'1.0',runId:lock.runId,samePeriodMayTuneSkill:false,label:'postoutcome_diagnostic_not_skill_tuning',entryDate,exitDates,benchmarkReturns,groups:{}};
  for(const [name,tickers] of Object.entries(groups)){
    const names=[];
    for(const ticker of tickers){
      const rows=await fetchRows(ticker,start,end);
      const entry=rows.find(x=>x.date===entryDate);
      const record={ticker,horizons:{}};
      if(!entry){record.status='missing_entry';names.push(record);continue;}
      record.status='ok';
      for(const h of horizons){
        const exit=rows.find(x=>x.date===exitDates[h]);
        if(!exit){record.horizons[h]={status:'missing_exit',exitDate:exitDates[h]};continue;}
        const r=netReturn(entry.open,exit.close,manifest.outcomePolicy.oneWayCostRate);
        record.horizons[h]={status:'ok',exitDate:exitDates[h],netReturn:r,benchmarkReturn:benchmarkReturns[h],excessReturn:r-benchmarkReturns[h]};
      }
      names.push(record);
    }
    const summary={};
    for(const h of horizons){
      const vals=names.map(x=>x.horizons[h]).filter(x=>x?.status==='ok');
      summary[h]={
        validCount:vals.length,
        meanNetReturn:vals.length?vals.reduce((a,b)=>a+b.netReturn,0)/vals.length:null,
        meanExcessReturn:vals.length?vals.reduce((a,b)=>a+b.excessReturn,0)/vals.length:null,
        positiveExcessBreadth:vals.length?vals.filter(x=>x.excessReturn>0).length/vals.length:null
      };
    }
    result.groups[name]={tickers,names,summary};
  }
  fs.writeFileSync(path.resolve(outPath),JSON.stringify(result,null,2)+'\n');
  console.log(path.resolve(outPath));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
