const fs=require('node:fs');
const path=require('node:path');
const {backtestEvent}=require('../src/strict-event-backtest');

const LOCK=JSON.parse(fs.readFileSync(path.join(__dirname,'..','frozen','skill_v3_2024_06_selection.json'),'utf8'));
const OUTPUT_JSON=path.join(__dirname,'..','research','skill_v3_2024_06_outcomes.json');
const OUTPUT_MD=path.join(__dirname,'..','research','skill_v3_2024_06_outcomes.md');

const HORIZONS=[20,60,120,250];
const PRICE_START='2024-05-01';
const PRICE_END='2025-07-31';
const BENCHMARK={symbol:'sh000300',ticker:'000300.SH',name:'沪深300'};
const COST=0.001;
const META={'002714.SZ':{symbol:'sz002714',name:'牧原股份',limitRate:0.10}};

async function fetchJson(url){
  const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(25000)});
  if(!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return r.json();
}
function url(symbol,adjustment){
  return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,${PRICE_START},${PRICE_END},500,${adjustment}`;
}
function parse(response,symbol,adjustment,isIndex=false){
  const node=response?.data?.[symbol];
  const key=adjustment==='qfq'?'qfqday':'day';
  const rs=node?.[key] ?? (isIndex?node?.day:undefined);
  if(!Array.isArray(rs)||rs.length<2) throw new Error(`Missing ${key} for ${symbol}`);
  return rs.map(r=>({date:r[0],open:Number(r[1]),close:Number(r[2]),high:Number(r[3]),low:Number(r[4]),volume:Number(r[5])}))
    .filter(b=>[b.open,b.close,b.high,b.low,b.volume].every(Number.isFinite));
}
function round(v,d=6){return v===null||v===undefined?v:Number(v.toFixed(d));}
function pct(v){return v===null||v===undefined?'n/a':`${(v*100).toFixed(1)}%`;}
function maxDrawdownFromEntry(bars,entryDate,exitDate,entryPrice){
  const slice=bars.filter(b=>b.date>=entryDate&&b.date<=exitDate);
  return slice.length?Math.min(...slice.map(b=>b.low/entryPrice-1),0):null;
}

async function main(){
  if(LOCK.outcomeDataPresent!==false||LOCK.watchOutcomeDataPresent!==false) throw new Error('lock must be outcome-free');
  const selected=[];
  for(const d of LOCK.decisions){
    for(const c of d.candidateBasket??[]) selected.push({signalId:d.signalId,signalDate:d.signalDate,...c});
  }
  if(selected.length!==1||selected[0].ticker!=='002714.SZ') throw new Error('unexpected frozen candidate set');

  const m=META['002714.SZ'];
  const [qfq,raw,bench]=await Promise.all([
    fetchJson(url(m.symbol,'qfq')),
    fetchJson(url(m.symbol,'none')),
    fetchJson(url(BENCHMARK.symbol,'none'))
  ]);
  const bars=parse(qfq,m.symbol,'qfq').map(b=>({...b,limitRate:m.limitRate}));
  const executionBars=parse(raw,m.symbol,'none').map(b=>({...b,limitRate:m.limitRate}));
  const benchmarkBars=parse(bench,BENCHMARK.symbol,'none',true);

  const row=selected[0];
  const horizons={};
  for(const days of HORIZONS){
    const r=backtestEvent({
      bars,executionBars,benchmarkBars,signalDate:row.signalDate,
      holdingTradingDays:days,buyCostRate:COST,sellCostRate:COST
    });
    horizons[String(days)]=r.status==='executed'?{
      status:'executed',
      entryDate:r.entryDate,exitDate:r.exitDate,
      netReturn:round(r.netReturn),
      benchmarkReturn:round(r.benchmarkReturn),
      excessReturn:round(r.excessReturn),
      maxDrawdownFromEntry:round(maxDrawdownFromEntry(bars,r.entryDate,r.exitDate,r.entryPrice))
    }:{
      status:r.status,
      reason:r.reason??r.entryExecution?.reason??r.exitExecution?.reason??null
    };
  }

  const output={
    schemaVersion:'3.0',
    windowId:LOCK.windowId,
    generatedAt:new Date().toISOString(),
    selectionChangedAfterOutcome:false,
    watchOutcomesOpened:false,
    assumptions:{
      benchmark:BENCHMARK,entry:'T+1 open',costPerSide:COST,
      horizonsTradingDays:HORIZONS,adjustedReturns:true,unadjustedExecutionChecks:true
    },
    results:[{...row,name:m.name,horizons}]
  };
  fs.writeFileSync(OUTPUT_JSON,JSON.stringify(output,null,2)+'\n');

  const cells=HORIZONS.map(days=>{
    const h=horizons[String(days)];
    return h.status==='executed'?`${pct(h.excessReturn)} (DD ${pct(h.maxDrawdownFromEntry)})`:h.status;
  });
  fs.writeFileSync(OUTPUT_MD,`# Skill V3 June 2024 outcome evaluation

Only the frozen Candidate was fetched. 中远海控 and 温氏股份 remain outcome-unopened.

| Frozen candidate | 20d excess | 60d excess | 120d excess | 250d excess |
| --- | ---: | ---: | ---: | ---: |
| **牧原股份** | ${cells.join(' | ')} |

Trading assumptions: T+1 open, 0.10% cost per side, CSI 300 benchmark, adjusted prices for returns and unadjusted daily bars for execution blockers.
`);
  console.log(JSON.stringify(output,null,2));
}
main().catch(e=>{console.error(e.stack||e.message);process.exitCode=1;});
