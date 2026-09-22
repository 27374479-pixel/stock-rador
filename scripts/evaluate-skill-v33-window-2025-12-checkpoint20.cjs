const fs=require('node:fs');
const path=require('node:path');
const {backtestEvent}=require('../src/strict-event-backtest');

const LOCK=JSON.parse(fs.readFileSync(path.join(__dirname,'..','frozen','skill_v33_2025_12_selection.json'),'utf8'));
const OUT_JSON=path.join(__dirname,'..','research','skill_v33_2025_12_checkpoint20_outcome.json');
const OUT_MD=path.join(__dirname,'..','research','skill_v33_2025_12_checkpoint20_outcome.md');

const PRICE_START='2025-12-01';
const PRICE_END='2026-01-13';
const COST=0.001;
const BENCH={symbol:'sh000300',ticker:'000300.SH',name:'沪深300'};
const META={'600362.SH':{symbol:'sh600362',name:'江西铜业',limitRate:0.10}};

async function fetchJson(u){
  const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(25000)});
  if(!r.ok) throw new Error(`HTTP ${r.status}: ${u}`);
  return r.json();
}
function url(s,a){return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${s},day,${PRICE_START},${PRICE_END},500,${a}`;}
function parse(j,s,a,isIndex=false){
  const node=j?.data?.[s],key=a==='qfq'?'qfqday':'day',rs=node?.[key]??(isIndex?node?.day:undefined);
  if(!Array.isArray(rs)||rs.length<2) throw new Error(`Missing ${key} for ${s}`);
  return rs.map(r=>({date:r[0],open:Number(r[1]),close:Number(r[2]),high:Number(r[3]),low:Number(r[4]),volume:Number(r[5])}))
    .filter(b=>[b.open,b.close,b.high,b.low,b.volume].every(Number.isFinite));
}
function round(v,d=6){return v==null?v:Number(v.toFixed(d));}
function maxDD(bars,e,x,p){const s=bars.filter(b=>b.date>=e&&b.date<=x);return s.length?Math.min(...s.map(b=>b.low/p-1),0):null;}

async function main(){
  if(LOCK.outcomeDataPresent!==false||LOCK.watchOutcomeDataPresent!==false) throw new Error('selection lock must be outcome-free');
  const d=LOCK.decisions.find(x=>x.signalId==='copper-tight-supply-ai-grid-demand-2025-12-13');
  if(!d||d.primaryPick?.ticker!=='600362.SH'||!d.checkpoints?.includes(20)) throw new Error('unexpected checkpoint contract');
  const m=META['600362.SH'];
  const [qfq,raw,bm]=await Promise.all([fetchJson(url(m.symbol,'qfq')),fetchJson(url(m.symbol,'none')),fetchJson(url(BENCH.symbol,'none'))]);
  const bars=parse(qfq,m.symbol,'qfq').map(b=>({...b,limitRate:m.limitRate}));
  const executionBars=parse(raw,m.symbol,'none').map(b=>({...b,limitRate:m.limitRate}));
  const benchmarkBars=parse(bm,BENCH.symbol,'none',true);
  if(bars.some(b=>b.date>PRICE_END)||executionBars.some(b=>b.date>PRICE_END)||benchmarkBars.some(b=>b.date>PRICE_END)) throw new Error('checkpoint price leakage');
  const r=backtestEvent({bars,executionBars,benchmarkBars,signalDate:d.signalDate,holdingTradingDays:20,buyCostRate:COST,sellCostRate:COST});
  if(r.status!=='executed') throw new Error(`checkpoint20 not executed: ${r.status}`);
  const out={
    schemaVersion:'3.3',
    windowId:LOCK.windowId,
    stage:'checkpoint-20-outcome-only',
    generatedAt:new Date().toISOString(),
    futurePriceCutoff:PRICE_END,
    laterSelectedStockPricesOpened:false,
    watchOutcomesOpened:false,
    result:{
      ticker:'600362.SH',name:m.name,signalDate:d.signalDate,
      entryDate:r.entryDate,checkpointExitDate:r.exitDate,
      netReturn:round(r.netReturn),benchmarkReturn:round(r.benchmarkReturn),excessReturn:round(r.excessReturn),
      maxDrawdownFromEntry:round(maxDD(bars,r.entryDate,r.exitDate,r.entryPrice))
    },
    rule:'This file may inform the locked 20-day checkpoint re-underwriting, but no selected-stock price after 2026-01-13 may be opened before that checkpoint decision is committed.'
  };
  fs.writeFileSync(OUT_JSON,JSON.stringify(out,null,2)+'\n');
  fs.writeFileSync(OUT_MD,`# Skill V3.3 December 2025 — 20d checkpoint outcome

Only the frozen selected stock path through the first checkpoint was opened. No selected-stock prices after **2026-01-13** were requested.

- 江西铜业 net return: ${(out.result.netReturn*100).toFixed(1)}%
- CSI300 return: ${(out.result.benchmarkReturn*100).toFixed(1)}%
- excess return: ${(out.result.excessReturn*100).toFixed(1)}%
- max drawdown from entry: ${(out.result.maxDrawdownFromEntry*100).toFixed(1)}%

The next segment remains sealed until the causal checkpoint decision is frozen.
`);
  console.log(JSON.stringify(out,null,2));
}
main().catch(e=>{console.error(e.stack||e.message);process.exitCode=1;});
