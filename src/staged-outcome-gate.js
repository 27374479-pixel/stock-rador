const DATE=/^\d{4}-\d{2}-\d{2}$/;

function assertDate(value,name){
  if(!DATE.test(value??''))throw new Error(`${name} must be YYYY-MM-DD`);
}

function selectedTickersFromLock(lock){
  const out=[];
  for(const d of lock?.decisions??[]){
    for(const c of d.candidateBasket??[])out.push(c.ticker);
  }
  return [...new Set(out)];
}

function checkpointContractForTicker(lock,ticker){
  for(const d of lock?.decisions??[]){
    if((d.candidateBasket??[]).some(c=>c.ticker===ticker)){
      return {
        signalDate:d.signalDate,
        checkpoints:[...(d.checkpoints??[])].sort((a,b)=>a-b)
      };
    }
  }
  return null;
}

/**
 * Decide whether a historical outcome fetch is allowed before any network call.
 *
 * requestedEndDate is a hard calendar bound supplied by the caller. This gate
 * does not infer trading calendars. It enforces the stronger procedural rule:
 * no later segment can be opened without a frozen prior checkpoint decision,
 * and Exit permanently seals the selected-stock path after that checkpoint.
 */
function authorizeOutcomeSegment({lock,ticker,requestedEndDate,checkpointDecisions=[]}={}){
  if(!lock||typeof lock!=='object')throw new Error('lock is required');
  if(lock.outcomeDataPresent!==false)throw new Error('selection lock must be outcome-free');
  assertDate(requestedEndDate,'requestedEndDate');

  const selected=selectedTickersFromLock(lock);
  if(!selected.includes(ticker))throw new Error(`ticker is not frozen as selected: ${ticker}`);
  const contract=checkpointContractForTicker(lock,ticker);
  if(!contract||!contract.checkpoints.length)throw new Error(`no checkpoint contract for selected ticker: ${ticker}`);

  const decisions=[...checkpointDecisions]
    .filter(d=>d?.ticker===ticker)
    .sort((a,b)=>a.afterTradingDays-b.afterTradingDays);

  let previous=0;
  for(const d of decisions){
    if(d.futureSegmentOutcomeUsed!==false)throw new Error('checkpoint decision is outcome-contaminated');
    if(!contract.checkpoints.includes(d.afterTradingDays))throw new Error(`checkpoint was not predeclared: ${d.afterTradingDays}`);
    if(d.afterTradingDays<=previous)throw new Error('checkpoint decisions must be unique and increasing');
    assertDate(String(d.checkpointAsOf).slice(0,10),'checkpointAsOf');
    previous=d.afterTradingDays;
    if(d.decision==='Exit'){
      const sealDate=String(d.checkpointAsOf).slice(0,10);
      if(requestedEndDate>sealDate)throw new Error(`Exit seals selected-stock outcomes after ${sealDate}`);
      return {allowed:true,stage:'sealed-exit-segment',maxDate:sealDate};
    }
  }

  const nextCheckpoint=contract.checkpoints.find(x=>x>previous);
  if(nextCheckpoint===undefined){
    throw new Error('all checkpoint decisions are consumed; add an explicit terminal policy before opening more outcomes');
  }

  // A caller must still supply its checkpoint calendar cutoff explicitly. The
  // gate intentionally refuses to invent trading dates from day counts.
  const expectedDecision=decisions.find(d=>d.afterTradingDays===nextCheckpoint);
  if(expectedDecision){
    throw new Error('internal checkpoint sequencing error');
  }

  return {
    allowed:true,
    stage:previous===0?'first-checkpoint-segment':'next-checkpoint-segment',
    previousCheckpoint:previous||null,
    nextCheckpoint,
    requestedEndDate,
    requirement:`requestedEndDate must be the externally resolved calendar date for checkpoint ${nextCheckpoint}; the fetcher must not request beyond it`
  };
}

module.exports={authorizeOutcomeSegment,selectedTickersFromLock,checkpointContractForTicker};
