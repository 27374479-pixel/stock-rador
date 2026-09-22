function parseTs(value,name){
  const t=Date.parse(value);
  if(!Number.isFinite(t))throw new Error(`${name} must be a valid timestamp`);
  return t;
}

function validateCheckpointDecision(checkpoint, options={}){
  if(!checkpoint||typeof checkpoint!=='object')throw new Error('checkpoint must be an object');
  if(checkpoint.mode!=='historical-checkpoint')throw new Error('mode must be historical-checkpoint');
  if(checkpoint.futureSegmentOutcomeUsed!==false)throw new Error('futureSegmentOutcomeUsed must be false');

  const cutoff=parseTs(checkpoint.checkpointAsOf,'checkpointAsOf');
  const selected=new Set(options.selectedTickers??[]);
  if(selected.size && !selected.has(checkpoint.ticker))throw new Error(`checkpoint ticker was not selected: ${checkpoint.ticker}`);

  const expected=options.expectedTradingDays??[];
  if(expected.length && !expected.includes(checkpoint.afterTradingDays)){
    throw new Error(`checkpoint afterTradingDays was not predeclared: ${checkpoint.afterTradingDays}`);
  }

  if(!Number.isInteger(checkpoint.afterTradingDays)||checkpoint.afterTradingDays<=0){
    throw new Error('afterTradingDays must be a positive integer');
  }

  const evidence=checkpoint.evidence??[];
  if(!Array.isArray(evidence)||!evidence.length)throw new Error('checkpoint evidence is required');
  for(const [i,e] of evidence.entries()){
    for(const key of ['publishedAt','availableAt']){
      if(!e?.[key])throw new Error(`evidence[${i}].${key} is required`);
      if(parseTs(e[key],`evidence[${i}].${key}`)>cutoff)throw new Error(`future checkpoint evidence: ${key}`);
    }
  }

  const state=checkpoint.state;
  if(!state)throw new Error('checkpoint state is required');
  const regime=new Set(['intact','weakening','broken']);
  const surprise=new Set(['accelerating','stable','decelerating','closed','broken']);
  const expectation=new Set(['widened','open','closing','closed','unknown']);
  if(!regime.has(state.causalRegime))throw new Error('invalid causalRegime');
  if(!surprise.has(state.earningsSurprise))throw new Error('invalid earningsSurprise');
  if(!expectation.has(state.expectationGap))throw new Error('invalid expectationGap');

  if(!['Continue','Downgrade','Exit'].includes(checkpoint.decision))throw new Error('invalid checkpoint decision');
  if(!checkpoint.rationale||String(checkpoint.rationale).trim().length<20)throw new Error('checkpoint rationale is required');

  return true;
}

module.exports={validateCheckpointDecision};
