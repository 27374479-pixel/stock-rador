const fs=require('node:fs');
const path=require('node:path');
const {validateResearchPacket}=require('../src/research-packet-validator');

const PACKET_PATH=path.join(__dirname,'..','research','skill_v3_2024_03_research.json');
const OUT=path.join(__dirname,'..','research','skill_v3_2024_03_prefreeze.json');
const packet=JSON.parse(fs.readFileSync(PACKET_PATH,'utf8'));
const quarantined=[
  "688676.SH","601179.SH","600089.SH","002028.SZ","300308.SZ","300502.SZ","002281.SZ",
  "300327.SZ","688595.SH","603986.SH","603416.SH","300124.SZ","000893.SZ","600096.SH",
  "000921.SZ","000333.SZ","002050.SZ","002543.SZ","603366.SH","301211.SZ",
  "603019.SH","000977.SZ","002837.SZ","301018.SZ","002335.SZ","300394.SZ","603083.SH",
  "300870.SZ","002851.SZ","002364.SZ","002518.SZ","002463.SZ","300045.SZ",
  "301308.SZ","688525.SH","001309.SZ"
];
validateResearchPacket(packet,{quarantinedTickers:quarantined});

function url(symbol,start,end){return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,${start},${end},500,qfq`;}
async function fetchJson(u){
  const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(25000)});
  if(!r.ok) throw new Error(`HTTP ${r.status}: ${u}`);
  return r.json();
}
function rows(j,symbol){
  const rs=j?.data?.[symbol]?.qfqday;
  if(!Array.isArray(rs)||rs.length<2) throw new Error(`No qfqday rows for ${symbol}`);
  return rs.map(r=>({date:r[0],close:Number(r[2])})).filter(r=>Number.isFinite(r.close));
}
function trailing(rs,signalDate,n){
  const eligible=rs.filter(r=>r.date<=signalDate);
  if(eligible.length<=n) return null;
  return eligible.at(-1).close/eligible[eligible.length-1-n].close-1;
}
function round(v){return v===null?null:Number(v.toFixed(6));}

async function main(){
  const result=JSON.parse(JSON.stringify(packet));
  result.stage='prefreeze-price-enriched';
  result.outcomeDataUsed=false;
  result.priceGuard={postSignalBarsAllowed:false};
  for(const signal of result.signals){
    for(const candidate of signal.candidates??[]){
      if(!candidate.symbol) throw new Error(`missing symbol for ${candidate.ticker}`);
      const u=url(candidate.symbol,'2023-05-01',signal.signalDate);
      const j=await fetchJson(u);
      const rs=rows(j,candidate.symbol);
      if(rs.some(r=>r.date>signal.signalDate)) throw new Error(`future price leaked for ${candidate.ticker}`);
      candidate.preSignalPrice={
        source:u,
        maxFetchedDate:signal.signalDate,
        prior20Return:round(trailing(rs,signal.signalDate,20)),
        prior60Return:round(trailing(rs,signal.signalDate,60)),
        prior180Return:round(trailing(rs,signal.signalDate,180))
      };
    }
  }
  fs.writeFileSync(OUT,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result.signals.map(s=>({
    id:s.id,
    candidates:(s.candidates??[]).map(c=>({ticker:c.ticker,name:c.name,decision:c.decision,preSignalPrice:c.preSignalPrice}))
  })),null,2));
}
main().catch(e=>{console.error(e.stack||e.message);process.exitCode=1;});
