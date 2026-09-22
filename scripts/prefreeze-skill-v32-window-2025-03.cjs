const fs=require('node:fs');
const path=require('node:path');
const {validateResearchPacket}=require('../src/research-packet-validator');

const P=JSON.parse(fs.readFileSync(path.join(__dirname,'..','research','skill_v32_2025_03_research.json'),'utf8'));
const OUT=path.join(__dirname,'..','research','skill_v32_2025_03_prefreeze.json');
const QUARANTINED=[
"688676.SH","601179.SH","600089.SH","002028.SZ","300308.SZ","300502.SZ","002281.SZ","300327.SZ","688595.SH","603986.SH","603416.SH","300124.SZ","000893.SZ","600096.SH","000921.SZ","000333.SZ","002050.SZ","002543.SZ","603366.SH","301211.SZ","603019.SH","000977.SZ","002837.SZ","301018.SZ","002335.SZ","300394.SZ","603083.SH","300870.SZ","002851.SZ","002364.SZ","002518.SZ","002463.SZ","300045.SZ","301308.SZ","688525.SH","001309.SZ","603993.SH","002714.SZ","601600.SH","002922.SZ"
];
validateResearchPacket(P,{quarantinedTickers:QUARANTINED});

const FUND={
 "688008.SH":{sharesBn:1.142537710,profitMidBn:1.408},
 "002916.SZ":{sharesBn:0.512877535,profit9mBn:1.488055071},
 "600019.SH":{sharesBn:21.986,profit9mBn:5.882}
};
function url(s,start,end,adj){return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${s},day,${start},${end},500,${adj}`;}
async function fetchJson(u){const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(25000)});if(!r.ok)throw new Error(`HTTP ${r.status}: ${u}`);return r.json();}
function parse(j,s,k){const rs=j?.data?.[s]?.[k];if(!Array.isArray(rs)||rs.length<2)throw new Error(`Missing ${k} for ${s}`);return rs.map(r=>({date:r[0],close:Number(r[2])})).filter(r=>Number.isFinite(r.close));}
function trailing(rs,date,n){const e=rs.filter(r=>r.date<=date);if(e.length<=n)return null;return e.at(-1).close/e[e.length-1-n].close-1;}
function round(v,d=6){return v==null?v:Number(v.toFixed(d));}

async function main(){
 const out=JSON.parse(JSON.stringify(P)); out.stage='prefreeze-price-valuation-enriched'; out.priceGuard={postSignalBarsAllowed:false};
 for(const s of out.signals) for(const c of s.candidates??[]){
   const [q,r]=await Promise.all([fetchJson(url(c.symbol,'2024-03-01',s.signalDate,'qfq')),fetchJson(url(c.symbol,'2024-03-01',s.signalDate,'none'))]);
   const qr=parse(q,c.symbol,'qfqday'), rr=parse(r,c.symbol,'day');
   if(qr.some(x=>x.date>s.signalDate)||rr.some(x=>x.date>s.signalDate))throw new Error(`future price leaked for ${c.ticker}`);
   const close=rr.filter(x=>x.date<=s.signalDate).at(-1).close, f=FUND[c.ticker];
   const marketCapBn=close*f.sharesBn;
   const valuation={actualClose:round(close,3),marketCapBn:round(marketCapBn,2)};
   if(c.ticker==='688008.SH') valuation.simple2024EarningsPE=round(marketCapBn/f.profitMidBn,2);
   if(c.ticker==='002916.SZ') valuation.simpleAnnualized9mPE=round(marketCapBn/(f.profit9mBn*4/3),2);
   if(c.ticker==='600019.SH') valuation.simpleAnnualized9mPE=round(marketCapBn/(f.profit9mBn*4/3),2);
   c.preSignalPrice={maxFetchedDate:s.signalDate,prior20Return:round(trailing(qr,s.signalDate,20)),prior60Return:round(trailing(qr,s.signalDate,60)),prior180Return:round(trailing(qr,s.signalDate,180)),valuation};
 }
 fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify(out.signals.map(s=>({id:s.id,candidates:(s.candidates??[]).map(c=>({ticker:c.ticker,name:c.name,preSignalPrice:c.preSignalPrice}))})),null,2));
}
main().catch(e=>{console.error(e.stack||e.message);process.exitCode=1;});
