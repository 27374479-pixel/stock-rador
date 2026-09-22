const test=require('node:test');
const assert=require('node:assert/strict');
const {authorizeOutcomeSegment}=require('../src/staged-outcome-gate');

function lock(){
  return {
    outcomeDataPresent:false,
    decisions:[{
      signalDate:'2025-12-13',
      candidateBasket:[{ticker:'600362.SH'}],
      checkpoints:[20,60]
    }]
  };
}
function decision(kind='Continue'){
  return {
    ticker:'600362.SH',
    afterTradingDays:20,
    checkpointAsOf:'2026-01-13T23:59:59+08:00',
    futureSegmentOutcomeUsed:false,
    decision:kind
  };
}

test('selected ticker may open its first checkpoint-bounded segment',()=>{
  const r=authorizeOutcomeSegment({lock:lock(),ticker:'600362.SH',requestedEndDate:'2026-01-13'});
  assert.equal(r.allowed,true);
  assert.equal(r.nextCheckpoint,20);
  assert.equal(r.stage,'first-checkpoint-segment');
});

test('watch or unselected ticker cannot be opened',()=>{
  assert.throws(()=>authorizeOutcomeSegment({
    lock:lock(),ticker:'600160.SH',requestedEndDate:'2026-01-13'
  }),/not frozen as selected/);
});

test('Exit seals every later selected-stock segment',()=>{
  assert.throws(()=>authorizeOutcomeSegment({
    lock:lock(),ticker:'600362.SH',requestedEndDate:'2026-03-10',
    checkpointDecisions:[decision('Exit')]
  }),/Exit seals/);
});

test('the already-open checkpoint boundary remains auditable after Exit',()=>{
  const r=authorizeOutcomeSegment({
    lock:lock(),ticker:'600362.SH',requestedEndDate:'2026-01-13',
    checkpointDecisions:[decision('Exit')]
  });
  assert.equal(r.allowed,true);
  assert.equal(r.maxDate,'2026-01-13');
});

test('Continue unlocks only the next predeclared checkpoint stage',()=>{
  const r=authorizeOutcomeSegment({
    lock:lock(),ticker:'600362.SH',requestedEndDate:'2026-03-12',
    checkpointDecisions:[decision('Continue')]
  });
  assert.equal(r.stage,'next-checkpoint-segment');
  assert.equal(r.previousCheckpoint,20);
  assert.equal(r.nextCheckpoint,60);
});

test('a non-predeclared checkpoint decision is rejected',()=>{
  const d=decision('Continue');d.afterTradingDays=30;
  assert.throws(()=>authorizeOutcomeSegment({
    lock:lock(),ticker:'600362.SH',requestedEndDate:'2026-03-12',checkpointDecisions:[d]
  }),/not predeclared/);
});

test('an outcome-contaminated checkpoint decision is rejected',()=>{
  const d=decision('Continue');d.futureSegmentOutcomeUsed=true;
  assert.throws(()=>authorizeOutcomeSegment({
    lock:lock(),ticker:'600362.SH',requestedEndDate:'2026-03-12',checkpointDecisions:[d]
  }),/outcome-contaminated/);
});
