const fs = require('node:fs');
const path = require('node:path');
const { backtestEvent } = require('../src/strict-event-backtest');

const LOCK = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'frozen', 'v22_2023_12_selection.json'), 'utf8'));
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'v22_window_2023_12.json'), 'utf8'));
const OUTPUT_JSON = path.join(__dirname, '..', 'research', 'v22_2023_12_outcomes.json');
const OUTPUT_MD = path.join(__dirname, '..', 'research', 'v22_2023_12_outcomes.md');

const HORIZONS=[20,60,120,250];
const PRICE_START='2023-11-01';
const PRICE_END='2025-01-31';
const BENCHMARK={symbol:'sh000300',ticker:'000300.SH',name:'沪深300'};
const COST=0.001;

async function fetchJson(url){
  const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(25000)});
  if(!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}
function url(symbol,adjustment){
  return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,${PRICE_START},${PRICE_END},500,${adjustment}`;
}
function parse(response,symbol,adjustment,isIndex=false){
  const node=response?.data?.[symbol];
  const key=adjustment==='qfq'?'qfqday':'day';
  const rows=node?.[key] ?? (isIndex?node?.day:undefined);
  if(!Array.isArray(rows)||rows.length<2) throw new Error(`Missing ${key} for ${symbol}`);
  return rows.map(r=>({date:r[0],open:Number(r[1]),close:Number(r[2]),high:Number(r[3]),low:Number(r[4]),volume:Number(r[5])}))
    .filter(b=>[b.open,b.close,b.high,b.low,b.volume].every(Number.isFinite));
}
function metaFor(ticker){
  for(const lead of CONFIG.leads){
    const found=lead.candidates.find(c=>c.ticker===ticker);
    if(found) return found;
  }
  throw new Error(`Missing candidate metadata for ${ticker}`);
}
function round(v,d=6){return v===null||v===undefined?v:Number(v.toFixed(d));}
function pct(v){return v===null||v===undefined?'n/a':`${(v*100).toFixed(1)}%`;}
function maxDrawdownFromEntry(bars,entryDate,exitDate,entryPrice){
  const slice=bars.filter(b=>b.date>=entryDate&&b.date<=exitDate);
  return slice.length?Math.min(...slice.map(b=>b.low/entryPrice-1),0):null;
}

async function main(){
  if(LOCK.outcomeDataPresent!==false||LOCK.watchOutcomeDataPresent!==false) throw new Error('Lock must be outcome-free');
  const selected=new Map();
  for(const lead of LOCK.leads) for(const row of lead.candidateBasket??[]) selected.set(row.ticker,row);

  const market={};
  for(const ticker of selected.keys()){
    const meta=metaFor(ticker);
    const [qfq,raw]=await Promise.all([fetchJson(url(meta.symbol,'qfq')),fetchJson(url(meta.symbol,'none'))]);
    market[ticker]={meta,adjusted:parse(qfq,meta.symbol,'qfq'),unadjusted:parse(raw,meta.symbol,'none')};
  }
  const benchmarkBars=parse(await fetchJson(url(BENCHMARK.symbol,'none')),BENCHMARK.symbol,'none',true);

  const leads=LOCK.leads.map(lead=>{
    const selectedRows=(lead.candidateBasket??[]).map(locked=>{
      const data=market[locked.ticker];
      const bars=data.adjusted.map(b=>({...b,limitRate:data.meta.limitRate}));
      const executionBars=data.unadjusted.map(b=>({...b,limitRate:data.meta.limitRate}));
      const horizons={};
      for(const days of HORIZONS){
        const result=backtestEvent({bars,executionBars,benchmarkBars,signalDate:lead.signalDate,holdingTradingDays:days,buyCostRate:COST,sellCostRate:COST});
        horizons[String(days)]=result.status==='executed'?{
          status:'executed',entryDate:result.entryDate,exitDate:result.exitDate,
          netReturn:round(result.netReturn),benchmarkReturn:round(result.benchmarkReturn),
          excessReturn:round(result.excessReturn),
          maxDrawdownFromEntry:round(maxDrawdownFromEntry(bars,result.entryDate,result.exitDate,result.entryPrice))
        }:{status:result.status,reason:result.reason??result.entryExecution?.reason??result.exitExecution?.reason??null};
      }
      return {ticker:locked.ticker,name:locked.name,lockedScore:locked.score,isPrimaryPick:locked.ticker===lead.primaryPick?.ticker,horizons};
    });

    const basket={};
    for(const days of HORIZONS){
      const hs=selectedRows.map(r=>r.horizons[String(days)]);
      if(!hs.length) basket[String(days)]={status:'no_trade'};
      else if(hs.some(h=>h.status!=='executed')) basket[String(days)]={status:'incomplete'};
      else basket[String(days)]={
        status:'executed',constituentCount:hs.length,
        equalWeightNetReturn:round(hs.reduce((s,h)=>s+h.netReturn,0)/hs.length),
        benchmarkReturn:round(hs[0].benchmarkReturn),
        equalWeightExcessReturn:round(hs.reduce((s,h)=>s+h.excessReturn,0)/hs.length),
        worstConstituentDrawdown:round(Math.min(...hs.map(h=>h.maxDrawdownFromEntry)))
      };
    }
    return {id:lead.id,signalDate:lead.signalDate,frozenPrimaryPick:lead.primaryPick??null,selected:selectedRows,selectedBasket:basket,frozenNoTrade:selectedRows.length===0};
  });

  const output={schemaVersion:'2.2',windowId:LOCK.windowId,generatedAt:new Date().toISOString(),selectionChangedAfterOutcome:false,watchOutcomesOpened:false,
    note:'Only frozen selected candidates were fetched post-signal. No later substitutions are allowed.',
    assumptions:{benchmark:BENCHMARK,entry:'T+1 open',costPerSide:COST,horizonsTradingDays:HORIZONS,adjustedReturns:true,unadjustedExecutionChecks:true},
    leads};
  fs.writeFileSync(OUTPUT_JSON,`${JSON.stringify(output,null,2)}\n`);

  const sections=leads.map(lead=>{
    const rows=lead.selected.length?lead.selected.map(row=>{
      const cells=HORIZONS.map(days=>{const h=row.horizons[String(days)];return h.status==='executed'?`${pct(h.excessReturn)} (DD ${pct(h.maxDrawdownFromEntry)})`:h.status;});
      return `| ${row.isPrimaryPick?'**':''}${row.name}${row.isPrimaryPick?'**':''} | ${row.lockedScore} | ${cells.join(' | ')} |`;
    }).join('\n'):'| — | — | no_trade | no_trade | no_trade | no_trade |';
    const basketCells=HORIZONS.map(days=>{const h=lead.selectedBasket[String(days)];return h.status==='executed'?pct(h.equalWeightExcessReturn):h.status;}).join(' | ');
    return `## ${lead.id}

| Frozen selected candidate | Score | 20d excess | 60d excess | 120d excess | 250d excess |
| --- | ---: | ---: | ---: | ---: | ---: |
${rows}
| Equal-weight selected basket | — | ${basketCells} |
`;
  }).join('\n');

  fs.writeFileSync(OUTPUT_MD,`# V2.2 December 2023 outcome evaluation

The selection lock was committed before this evaluator existed. Trading assumptions remain T+1 open, 0.10% cost per side, adjusted prices for returns, unadjusted execution blockers, and CSI 300 benchmark.

${sections}`);
  console.log(JSON.stringify(leads,null,2));
}
main().catch(error=>{console.error(error.stack||error.message);process.exitCode=1;});
