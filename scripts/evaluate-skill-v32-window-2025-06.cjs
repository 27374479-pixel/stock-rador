const fs=require('node:fs');
const path=require('node:path');
const {backtestEvent}=require('../src/strict-event-backtest');

const LOCK=JSON.parse(fs.readFileSync(path.join(__dirname,'..','frozen','skill_v32_2025_06_selection.json'),'utf8'));
const OUT_JSON=path.join(__dirname,'..','research','skill_v32_2025_06_outcomes.json');
const OUT_MD=path.join(__dirname,'..','research','skill_v32_2025_06_outcomes.md');

const H=[20,60,120,250];
const PRICE_START='2025-05-01';
const PRICE_END='2026-07-31';
const COST=0.001;
const BENCH={symbol:'sh000300',ticker:'000300.SH',name:'沪深300'};
const META={'601919.SH':{symbol:'sh601919',name:'中远海控',limitRate:0.10}};

async function fetchJson(u){
  const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw new Error(`HTTP ${r.status}: ${u}`);
  return r.json();
}
function url(s,a){return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${s},day,${PRICE_START},${PRICE_END},500,${a}`;}
function parse(j,s,a,isIndex=false){
  const node=j?.data?.[s],key=a==='qfq'?'qfqday':'day',rs=node?.[key]??(isIndex?node?.day:undefined);
  if(!Array.isArray(rs)||rs.length<2)throw new Error(`Missing ${key} for ${s}`);
  return rs.map(r=>({date:r[0],open:Number(r[1]),close:Number(r[2]),high:Number(r[3]),low:Number(r[4]),volume:Number(r[5])}))
    .filter(b=>[b.open,b.close,b.high,b.low,b.volume].every(Number.isFinite));
}
function round(v,d=6){return v==null?v:Number(v.toFixed(d));}
function pct(v){return v==null?'n/a':`${(v*100).toFixed(1)}%`;}
function maxDD(bars,e,x,p){const s=bars.filter(b=>b.date>=e&&b.date<=x);return s.length?Math.min(...s.map(b=>b.low/p-1),0):null;}

async function main(){
  if(LOCK.outcomeDataPresent!==false||LOCK.watchOutcomeDataPresent!==false)throw new Error('lock must be outcome-free');
  const selected=[];
  for(const d of LOCK.decisions)for(const c of d.candidateBasket??[])selected.push({signalId:d.signalId,signalDate:d.signalDate,...c});
  if(selected.length!==1||selected[0].ticker!=='601919.SH')throw new Error('unexpected frozen candidate set');

  const m=META['601919.SH'];
  const [qfq,raw,bm]=await Promise.all([fetchJson(url(m.symbol,'qfq')),fetchJson(url(m.symbol,'none')),fetchJson(url(BENCH.symbol,'none'))]);
  const bars=parse(qfq,m.symbol,'qfq').map(b=>({...b,limitRate:m.limitRate}));
  const executionBars=parse(raw,m.symbol,'none').map(b=>({...b,limitRate:m.limitRate}));
  const benchmarkBars=parse(bm,BENCH.symbol,'none',true);

  const row=selected[0],horizons={};
  for(const days of H){
    const r=backtestEvent({bars,executionBars,benchmarkBars,signalDate:row.signalDate,holdingTradingDays:days,buyCostRate:COST,sellCostRate:COST});
    horizons[String(days)]=r.status==='executed'?{
      status:'executed',entryDate:r.entryDate,exitDate:r.exitDate,
      netReturn:round(r.netReturn),benchmarkReturn:round(r.benchmarkReturn),excessReturn:round(r.excessReturn),
      maxDrawdownFromEntry:round(maxDD(bars,r.entryDate,r.exitDate,r.entryPrice))
    }:{status:r.status,reason:r.reason??r.entryExecution?.reason??r.exitExecution?.reason??null};
  }

  const out={schemaVersion:'3.2',windowId:LOCK.windowId,generatedAt:new Date().toISOString(),
    selectionChangedAfterOutcome:false,watchOutcomesOpened:false,expectedResearchHorizon:'20-60 trading days',
    assumptions:{benchmark:BENCH,entry:'T+1 open',costPerSide:COST,horizonsTradingDays:H,adjustedReturns:true,unadjustedExecutionChecks:true},
    results:[{...row,name:m.name,horizons}]};
  fs.writeFileSync(OUT_JSON,JSON.stringify(out,null,2)+'\n');
  const cells=H.map(d=>{const x=horizons[String(d)];return x.status==='executed'?`${pct(x.excessReturn)} (DD ${pct(x.maxDrawdownFromEntry)})`:x.status;});
  fs.writeFileSync(OUT_MD,`# Skill V3.2 June 2025 outcome evaluation

Only the frozen Candidate was fetched. 金力永磁 remains outcome-unopened.

| Frozen candidate | 20d excess | 60d excess | 120d excess | 250d excess |
| --- | ---: | ---: | ---: | ---: |
| **中远海控** | ${cells.join(' | ')} |

The pre-outcome thesis classified this as event-repricing with an expected 20-60 trading-day research horizon. Longer horizons remain diagnostics, not the intended thesis horizon.
`);
  console.log(JSON.stringify(out,null,2));
}
main().catch(e=>{console.error(e.stack||e.message);process.exitCode=1;});
