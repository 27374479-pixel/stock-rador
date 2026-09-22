const fs=require('node:fs');
const path=require('node:path');
const {validateCheckpointDecision}=require('../src/checkpoint-validator');
const {authorizeOutcomeSegment}=require('../src/staged-outcome-gate');

const lock=JSON.parse(fs.readFileSync(path.join(__dirname,'..','frozen','skill_v33_2025_12_selection.json'),'utf8'));
const checkpoint=JSON.parse(fs.readFileSync(path.join(__dirname,'..','frozen','skill_v33_2025_12_checkpoint20_decision.json'),'utf8'));
const selected=lock.decisions.flatMap(d=>(d.candidateBasket??[]).map(x=>x.ticker));
const copper=lock.decisions.find(d=>d.signalId==='copper-tight-supply-ai-grid-demand-2025-12-13');
if(!copper)throw new Error('missing copper selection lock');

validateCheckpointDecision(checkpoint,{
  selectedTickers:selected,
  expectedTradingDays:copper.checkpoints??[]
});
if(checkpoint.decision!=='Exit')throw new Error('checkpoint decision must remain frozen as Exit');
if(checkpoint.nextPriceSegmentMayOpen!==false)throw new Error('later price segment must remain sealed after Exit');

const atBoundary=authorizeOutcomeSegment({
  lock,
  ticker:checkpoint.ticker,
  requestedEndDate:String(checkpoint.checkpointAsOf).slice(0,10),
  checkpointDecisions:[checkpoint]
});
if(!atBoundary.allowed)throw new Error('checkpoint boundary must remain auditable');

let sealed=false;
try{
  authorizeOutcomeSegment({
    lock,
    ticker:checkpoint.ticker,
    requestedEndDate:'2099-12-31',
    checkpointDecisions:[checkpoint]
  });
}catch(e){
  if(/Exit seals/.test(e.message))sealed=true;
  else throw e;
}
if(!sealed)throw new Error('later selected-stock outcomes are not fail-closed after Exit');

console.log(JSON.stringify({
  valid:true,
  windowId:checkpoint.windowId,
  ticker:checkpoint.ticker,
  checkpoint:checkpoint.afterTradingDays,
  decision:checkpoint.decision,
  nextPriceSegmentMayOpen:checkpoint.nextPriceSegmentMayOpen,
  frameworkSealVerified:true
},null,2));
