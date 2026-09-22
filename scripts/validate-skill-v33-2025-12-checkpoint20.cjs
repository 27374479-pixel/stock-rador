const fs=require('node:fs');
const path=require('node:path');
const {validateCheckpointDecision}=require('../src/checkpoint-validator');

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
console.log(JSON.stringify({
  valid:true,
  windowId:checkpoint.windowId,
  ticker:checkpoint.ticker,
  checkpoint:checkpoint.afterTradingDays,
  decision:checkpoint.decision,
  nextPriceSegmentMayOpen:checkpoint.nextPriceSegmentMayOpen
},null,2));
