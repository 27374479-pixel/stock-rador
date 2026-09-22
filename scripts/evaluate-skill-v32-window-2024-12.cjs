const fs=require('node:fs');
const path=require('node:path');
const {backtestEvent}=require('../src/strict-event-backtest');
const LOCK=JSON.parse(fs.readFileSync(path.join(__dirname,'..','frozen','skill_v32_2024_12_selection.json'),'utf8'));
const OUT_JSON=path.join(__dirname,'..','research','skill_v32_2024_12_outcomes.json');
const OUT_MD=path.join(__dirname,'..','research','skill_v32_2024_12_outcomes.md');
const H=[20,60,120,250], PRICE_START='2024-11-01', PRICE_END='2026-01-31', COST=0.001;
const BENCH={symbol:'sh000300',ticker:'000300.SH',name:'沪深300'};
const META={'002922.SZ':{symbol:'sz002922',name:'伊戈尔',limitRate:0.10}};
async function fetchJson(u){const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(25000)});if(!r.ok)throw new Error(`HTTP ${r.status}: ${u}`);return r.json();}
function url(s,a){return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${s},day,${PRICE_START},${PRICE_END},500,${a}`;}
function parse(j,s,a,isIndex=false){const n=j?.data?.[s],k=a==='qfq'?'qfqday':'day',rs=n?.[k]??(isIndex?n?.day:undefined);if(!Array.isArray(rs)||rs.length<2)throw new Error(`Missing ${k} for ${s}`);return rs.map(r=>({date:r[0],open:Number(r[1]),close:Number(r[2]),high:Number(r[3]),low:Number(r[4]),volume:Number(r[5])})).filter(b=>[b.open,b.close,b.high,b.low,b.volume].every(Number.isFinite));}
function round(v,d=6){return v==null?v:Number(v.toFixed(d));}
function pct(v){return v==null?'n/a':`${(v*100).toFixed(1)}%`;}
function maxDD(bars,e,x,p){const s=bars.filter(b=>b.date>=e&&b.date<=x);return s.length?Math.min(...s.map(b=>b.low/p-1),0):null;}
async function main(){
 if(LOCK.outcomeDataPresent!==false||LOCK.watchOutcomeDataPresent!==false)throw new Error('lock must be outcome-free');
 const selected=[];for(const d of LOCK.decisions)for(const c of d.candidateBasket??[])selected.push({signalId:d.signalId,signalDate:d.signalDate,...c});
 if(selected.length!==1||selected[0].ticker!=='002922.SZ')throw new Error('unexpected frozen candidate set');
 const m=META['002922.SZ'];
 const [qfq,raw,bm]=await Promise.all([fetchJson(url(m.symbol,'qfq')),fetchJson(url(m.symbol,'none')),fetchJson(url(BENCH.symbol,'none'))]);
 const bars=parse(qfq,m.symbol,'qfq').map(b=>({...b,limitRate:m.limitRate}));
 const exec=parse(raw,m.symbol,'none').map(b=>({...b,limitRate:m.limitRate}));
 const bb=parse(bm,BENCH.symbol,'none',true);
 const row=selected[0],horizons={};
 for(const d of H){const r=backtestEvent({bars,executionBars:exec,benchmarkBars:bb,signalDate:row.signalDate,holdingTradingDays:d,buyCostRate:COST,sellCostRate:COST});horizons[String(d)]=r.status==='executed'?{status:'executed',entryDate:r.entryDate,exitDate:r.exitDate,netReturn:round(r.netReturn),benchmarkReturn:round(r.benchmarkReturn),excessReturn:round(r.excessReturn),maxDrawdownFromEntry:round(maxDD(bars,r.entryDate,r.exitDate,r.entryPrice))}:{status:r.status,reason:r.reason??r.entryExecution?.reason??r.exitExecution?.reason??null};}
 const out={schemaVersion:'3.2',windowId:LOCK.windowId,generatedAt:new Date().toISOString(),selectionChangedAfterOutcome:false,watchOutcomesOpened:false,expectedResearchHorizon:'120-250 trading days',assumptions:{benchmark:BENCH,entry:'T+1 open',costPerSide:COST,horizonsTradingDays:H},results:[{...row,name:m.name,horizons}]};
 fs.writeFileSync(OUT_JSON,JSON.stringify(out,null,2)+'\n');
 const cells=H.map(d=>{const x=horizons[String(d)];return x.status==='executed'?`${pct(x.excessReturn)} (DD ${pct(x.maxDrawdownFromEntry)})`:x.status;});
 fs.writeFileSync(OUT_MD,`# Skill V3.2 December 2024 outcome evaluation

Only the frozen Candidate was fetched. Antimony Watch futures remain unopened.

| Frozen candidate | 20d excess | 60d excess | 120d excess | 250d excess |
| --- | ---: | ---: | ---: | ---: |
| **伊戈尔** | ${cells.join(' | ')} |

The pre-outcome thesis classified this as a structural multi-year signal with an expected 120-250 trading-day research horizon. Standard horizons are still reported unchanged.
`);
 console.log(JSON.stringify(out,null,2));
}
main().catch(e=>{console.error(e.stack||e.message);process.exitCode=1;});
