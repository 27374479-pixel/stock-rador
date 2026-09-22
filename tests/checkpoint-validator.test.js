const test=require('node:test');
const assert=require('node:assert/strict');
const {validateCheckpointDecision}=require('../src/checkpoint-validator');

function checkpoint(){
  return {
    schemaVersion:'3.3-checkpoint',
    mode:'historical-checkpoint',
    windowId:'skill-v33-test',
    ticker:'000001.SZ',
    afterTradingDays:120,
    checkpointAsOf:'2025-06-30T23:59:59+08:00',
    futureSegmentOutcomeUsed:false,
    evidence:[{
      publishedAt:'2025-06-20T00:00:00+08:00',
      availableAt:'2025-06-20T00:00:00+08:00',
      summary:'latest company realized economics'
    }],
    state:{
      causalRegime:'intact',
      earningsSurprise:'decelerating',
      expectationGap:'closing'
    },
    decision:'Downgrade',
    rationale:'The physical regime remains intact, but incremental earnings surprise is decelerating.'
  };
}

test('valid predeclared checkpoint passes',()=>{
  assert.equal(validateCheckpointDecision(checkpoint(),{
    selectedTickers:['000001.SZ'],
    expectedTradingDays:[120,250]
  }),true);
});

test('future checkpoint evidence is rejected',()=>{
  const c=checkpoint();
  c.evidence[0].availableAt='2025-07-01T00:00:00+08:00';
  assert.throws(()=>validateCheckpointDecision(c),/future checkpoint evidence/);
});

test('non-predeclared checkpoint horizon is rejected',()=>{
  assert.throws(()=>validateCheckpointDecision(checkpoint(),{
    selectedTickers:['000001.SZ'],
    expectedTradingDays:[60]
  }),/not predeclared/);
});

test('outcome-contaminated checkpoint is rejected',()=>{
  const c=checkpoint();
  c.futureSegmentOutcomeUsed=true;
  assert.throws(()=>validateCheckpointDecision(c),/futureSegmentOutcomeUsed/);
});
