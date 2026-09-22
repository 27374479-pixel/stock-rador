const fs=require('node:fs');
const path=require('node:path');
const {validateResearchPacket}=require('../src/research-packet-validator');

const PACKET=JSON.parse(fs.readFileSync(path.join(__dirname,'..','research','skill_v3_2024_06_research.json'),'utf8'));
const OUT=path.join(__dirname,'..','research','skill_v3_2024_06_prefreeze.json');
const QUARANTINED=[
"688676.SH","601179.SH","600089.SH","002028.SZ","300308.SZ","300502.SZ","002281.SZ",
"300327.SZ","688595.SH","603986.SH","603416.SH","300124.SZ","000893.SZ","600096.SH",
"000921.SZ","000333.SZ","002050.SZ","002543.SZ","603366.SH","301211.SZ",
"603019.SH","000977.SZ","002837.SZ","301018.SZ","002335.SZ","300394.SZ","603083.SH",
"300870.SZ","002851.SZ","002364.SZ","002518.SZ","002463.SZ","300045.SZ",
"301308.SZ","688525.SH","001309.SZ","603993.SH"
];
validateResearchPacket(PACKET,{quarantinedTickers:QUARANTINED});

const FUNDAMENTALS={
  "601919.SH":{sharesBn:16.071057752,equityBn:202.853638,ttmNetProfitBn:23.487217,valuationKind:"pe_pb"},
  "002714.SZ":{sharesBn:5.465350691,equityBn:61.177227,valuationKind:"pb"},
  "300498.SZ":{sharesBn:6.652031029,equityBn:31.932819,valuationKind:"pb"}
};

function url(symbol,start,end,adj){return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,${start},${end},500,${adj}`;}
async function fetchJson(u){const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(25000)});if(!r.ok)throw new Error(`HTTP ${r.status}: ${u}`);return r.json();}
function parse(j,symbol,key){const rs=j?.data?.[symbol]?.[key];if(!Array.isArray(rs)||rs.length<2)throw new Error(`Missing ${key} for ${symbol}`);return rs.map(r=>({date:r[0],open:Number(r[1]),close:Number(r[2]),high:Number(r[3]),low:Number(r[4]),volume:Number(r[5])})).filter(r=>Number.isFinite(r.close));}
function trailing(rs,date,n){const e=rs.filter(r=>r.date<=date);if(e.length<=n)return null;return e.at(-1).close/e[e.length-1-n].close-1;}
function round(v,d=6){return v===null?null:Number(v.toFixed(d));}

async function main(){
  const result=JSON.parse(JSON.stringify(PACKET));
  result.stage='prefreeze-price-valuation-enriched';
  result.priceGuard={postSignalBarsAllowed:false};
  for(const signal of result.signals){
    for(const c of signal.candidates??[]){
      const [qfqJ,rawJ]=await Promise.all([
        fetchJson(url(c.symbol,'2023-07-01',signal.signalDate,'qfq')),
        fetchJson(url(c.symbol,'2023-07-01',signal.signalDate,'none'))
      ]);
      const qfq=parse(qfqJ,c.symbol,'qfqday');
      const raw=parse(rawJ,c.symbol,'day');
      if(qfq.some(r=>r.date>signal.signalDate)||raw.some(r=>r.date>signal.signalDate))throw new Error(`future price leaked for ${c.ticker}`);
      const rawEligible=raw.filter(r=>r.date<=signal.signalDate);
      const actualClose=rawEligible.at(-1).close;
      const f=FUNDAMENTALS[c.ticker];
      const marketCapBn=f?actualClose*f.sharesBn:null;
      const valuation={
        actualClose:round(actualClose,3),
        marketCapBn:marketCapBn===null?null:round(marketCapBn,2),
        priceToBook:f&&f.equityBn?round(marketCapBn/f.equityBn,2):null,
        trailingPE:f?.ttmNetProfitBn?round(marketCapBn/f.ttmNetProfitBn,2):null
      };
      c.preSignalPrice={
        maxFetchedDate:signal.signalDate,
        prior20Return:round(trailing(qfq,signal.signalDate,20)),
        prior60Return:round(trailing(qfq,signal.signalDate,60)),
        prior180Return:round(trailing(qfq,signal.signalDate,180)),
        valuation
      };
    }
  }
  fs.writeFileSync(OUT,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result.signals.map(s=>({id:s.id,candidates:(s.candidates??[]).map(c=>({ticker:c.ticker,name:c.name,preSignalPrice:c.preSignalPrice}))})),null,2));
}
main().catch(e=>{console.error(e.stack||e.message);process.exitCode=1;});
