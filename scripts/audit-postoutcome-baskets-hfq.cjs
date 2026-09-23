#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { readJson, verifyLock, returnAfterCost } = require('./backtest-core-v130.cjs');

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0,10);
}
function tickerToTencent(ticker) {
  const m=/^(\d{6})\.(SH|SZ)$/.exec(ticker);
  if(!m) throw new Error(`unsupported ticker ${ticker}`);
  return `${m[2]==='SH'?'sh':'sz'}${m[1]}`;
}
async function fetchRows(ticker,start,end,isBenchmark=false){
  const symbol=tickerToTencent(ticker);
  const url=`https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,${start},${end},400,hfq`;
  const res=await fetch(url,{headers:{'User-Agent':'stock-rador-postoutcome-audit/1.0'},signal:AbortSignal.timeout(30000)});
  if(!res.ok) throw new Error(`HTTP ${res.status} ${ticker}`);
  const json=await res.json();
  const node=json?.data?.[symbol];
  const raw=node?.hfqday ?? (isBenchmark?node?.day:null);
  if(!Array.isArray(raw)||!raw.length) throw new Error(`no rows for ${ticker}`);
  return raw.map(x=>({date:x[0],open:Number(x[1]),close:Number(x[2])}));
}
function mean(xs){ return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null; }

async function main(){
  const [lockPath,configPath,outPath]=process.argv.slice(2);
  if(!lockPath||!configPath||!outPath) throw new Error('Usage: node audit-postoutcome-baskets-hfq.cjs <lock.json> <config.json> <out.json>');
  const root=process.cwd();
  const lock=readJson(lockPath);
  const mismatches=verifyLock(lock,root);
  if(mismatches.length) throw new Error(`frozen run modified after lock:\n- ${mismatches.join('\n- ')}`);
  const cfg=readJson(configPath);
  if(cfg.samePeriodMayTuneSkill!==false) throw new Error('samePeriodMayTuneSkill must be false');
  const horizons=cfg.holdingTradingDays ?? [20,60,120];
  const maxH=Math.max(...horizons);
  const start=addDays(cfg.cutoffDate,-10);
  const end=addDays(cfg.cutoffDate,maxH*2+45);
  const tickers=[...new Set([cfg.benchmarkTicker,...cfg.baskets.flatMap(b=>b.tickers)])];
  const series={};
  for(const t of tickers) series[t]=await fetchRows(t,start,end,t===cfg.benchmarkTicker);
  const bench=series[cfg.benchmarkTicker];
  const entryIndex=bench.findIndex(r=>r.date>cfg.cutoffDate);
  if(entryIndex<0) throw new Error('no benchmark entry after cutoff');
  const entryDate=bench[entryIndex].date;
  const outputBaskets=[];
  for(const b of cfg.baskets){
    const tickerResults=[];
    for(const ticker of b.tickers){
      const rows=series[ticker];
      const entry=rows.find(r=>r.date===entryDate);
      if(!entry){ tickerResults.push({ticker,status:'missing_entry'}); continue; }
      const h={};
      for(const d of horizons){
        const exitBench=bench[entryIndex+d-1];
        if(!exitBench){ h[String(d)]={status:'pending'}; continue; }
        const exit=rows.find(r=>r.date===exitBench.date);
        if(!exit){ h[String(d)]={status:'missing_exit',exitDate:exitBench.date}; continue; }
        const netReturn=returnAfterCost(entry.open,exit.close,cfg.oneWayCostRate);
        const benchmarkReturn=exitBench.close/bench[entryIndex].open-1;
        h[String(d)]={exitDate:exitBench.date,netReturn,benchmarkReturn,excessReturn:netReturn-benchmarkReturn};
      }
      tickerResults.push({ticker,status:'ok',horizons:h});
    }
    const basketHorizons={};
    for(const d of horizons){
      const rows=tickerResults.map(x=>x.horizons?.[String(d)]).filter(x=>x&&Number.isFinite(x.netReturn));
      basketHorizons[String(d)]=rows.length?{
        count:rows.length,
        meanNetReturn:mean(rows.map(x=>x.netReturn)),
        benchmarkReturn:mean(rows.map(x=>x.benchmarkReturn)),
        meanExcessReturn:mean(rows.map(x=>x.excessReturn)),
        positiveExcessBreadth:rows.filter(x=>x.excessReturn>0).length/rows.length
      }:{count:0};
    }
    outputBaskets.push({basketId:b.basketId,label:b.label,frozenDecision:b.frozenDecision,tickers:b.tickers,tickerResults,horizons:basketHorizons});
  }
  const out={
    schemaVersion:'1.0',runId:cfg.runId,label:'post_outcome_no_selection_miss_audit',
    samePeriodMayTuneSkill:false,diagnosticOnly:true,
    lockVerified:true,lockRunId:lock.runId,cutoffDate:cfg.cutoffDate,entryDate,
    benchmarkTicker:cfg.benchmarkTicker,holdingTradingDays:horizons,oneWayCostRate:cfg.oneWayCostRate,
    baskets:outputBaskets,
    unauditableNoSelectionHypotheses:cfg.unauditableNoSelectionHypotheses ?? []
  };
  if(fs.existsSync(outPath)) throw new Error(`refusing to overwrite ${outPath}`);
  fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');
  console.log(outPath);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
