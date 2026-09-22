const test=require('node:test');
const assert=require('node:assert/strict');
const {validateResearchPacket}=require('../src/research-packet-validator');

function packet(){
  return {
    schemaVersion:'3.0',
    mode:'historical',
    windowId:'skill-v3-test',
    asOf:'2024-03-10T23:59:59+08:00',
    outcomeDataUsed:false,
    discoveryQueries:['transformer lead time shortage'],
    signals:[{
      id:'s1',
      asOf:'2024-03-05T23:59:59+08:00',
      claim:'lead times increased',
      beneficiaryArchetype:'supplier with available capacity and qualified customers',
      evidence:[{publishedAt:'2024-03-01T00:00:00Z',availableAt:'2024-03-01T00:00:00Z'}],
      contraryEvidence:[],
      candidates:[{
        ticker:'000001.SZ',
        name:'Test',
        decision:'Candidate',
        earningsBridge:['volume','gross profit','EPS'],
        priceExpectation:'not fully reflected',
        basisReconciliation:{
          externalIndicator:'industry price',
          companyRealizedBasis:'company realized ASP',
          basisRisk:'basis may move'
        },
        valuationBridge:{
          marketCapOrEV:'100bn market cap',
          bearCase:'80bn value',
          baseCase:'120bn value',
          upsideCase:'160bn value',
          impliedExpectation:'market implies only partial earnings capture'
        },
        thesisBreakers:['lead times normalize','capacity fails','customer orders fall']
      }]
    }]
  };
}

test('valid skill packet passes',()=>assert.equal(validateResearchPacket(packet()),true));

test('future evidence is rejected',()=>{
  const p=packet();
  p.signals[0].evidence[0].availableAt='2024-03-06T00:00:00+08:00';
  assert.throws(()=>validateResearchPacket(p),/future evidence/);
});

test('quarantined ticker is rejected',()=>{
  assert.throws(()=>validateResearchPacket(packet(),{quarantinedTickers:['000001.SZ']}),/quarantined ticker/);
});

test('outcome-oriented discovery query is rejected',()=>{
  const p=packet();
  p.discoveryQueries=['2024 multibagger stocks'];
  assert.throws(()=>validateResearchPacket(p),/outcome-oriented/);
});

test('candidate requires falsifiable thesis breakers',()=>{
  const p=packet();
  p.signals[0].candidates[0].thesisBreakers=['only one'];
  assert.throws(()=>validateResearchPacket(p),/three thesisBreakers/);
});


test('signal-specific cutoff blocks evidence that is before packet cutoff but after signal cutoff',()=>{
  const p=packet();
  p.signals[0].evidence[0].publishedAt='2024-03-06T00:00:00+08:00';
  p.signals[0].evidence[0].availableAt='2024-03-06T00:00:00+08:00';
  assert.throws(()=>validateResearchPacket(p),/future evidence/);
});


test('candidate requires basis reconciliation',()=>{
  const p=packet();
  delete p.signals[0].candidates[0].basisReconciliation;
  assert.throws(()=>validateResearchPacket(p),/basisReconciliation/);
});

test('candidate requires valuation bridge',()=>{
  const p=packet();
  delete p.signals[0].candidates[0].valuationBridge;
  assert.throws(()=>validateResearchPacket(p),/valuationBridge/);
});


test('V3.2 candidate requires a causal horizon bridge',()=>{
  const p=packet();
  p.schemaVersion='3.2';
  p.signals[0].candidates[0].basisReconciliation={
    externalIndicator:'industry price',
    companyRealizedBasis:'company realized ASP',
    basisRisk:'basis can diverge'
  };
  p.signals[0].candidates[0].valuationBridge={
    marketCapOrEV:'100bn',
    bearCase:'bear',
    baseCase:'base',
    upsideCase:'upside',
    impliedExpectation:'not heroic'
  };
  assert.throws(()=>validateResearchPacket(p),/requires horizonBridge/);
  p.signals[0].candidates[0].horizonBridge={
    shockClass:'cyclical-multi-quarter',
    expectedHalfLife:'two to four quarters',
    normalizationIndicators:['spread normalizes'],
    expectedResearchHorizon:'60-120 trading days',
    whyHorizonMatches:'earnings follows the cycle with a lag'
  };
  assert.equal(validateResearchPacket(p),true);
});


test('V3.3 candidate requires a predeclared checkpoint plan',()=>{
  const p=packet();
  p.schemaVersion='3.3';
  p.signals[0].candidates[0].horizonBridge={
    shockClass:'structural-multi-year',
    expectedHalfLife:'several quarters',
    normalizationIndicators:['realized ASP rolls over'],
    expectedResearchHorizon:'120-250 trading days',
    whyHorizonMatches:'earnings transition is multi-quarter'
  };
  assert.throws(()=>validateResearchPacket(p),/requires checkpointPlan/);
  p.signals[0].candidates[0].checkpointPlan={
    surprisePersistence:{
      currentSurprise:'realized ASP and profit are accelerating',
      whatMustRemainIncremental:'realized economics must continue to beat the pre-selection steady-state assumption',
      closureIndicators:['profit growth decelerates without a new volume or margin bridge']
    },
    checkpoints:[{
      afterTradingDays:120,
      evidenceToRefresh:['latest company filing','realized ASP or shipment data'],
      continueIf:['causal regime remains intact and earnings surprise remains open'],
      downgradeIf:['physical regime persists but earnings surprise is closing'],
      exitIf:['company-realized economics contradict the thesis']
    }]
  };
  assert.equal(validateResearchPacket(p),true);
});

test('V3.3 checkpoint plan must be ordered and actionable',()=>{
  const p=packet();
  p.schemaVersion='3.3';
  p.signals[0].candidates[0].horizonBridge={
    shockClass:'structural-multi-year',
    expectedHalfLife:'several quarters',
    normalizationIndicators:['orders roll over'],
    expectedResearchHorizon:'120-250 trading days',
    whyHorizonMatches:'multi-quarter adoption'
  };
  p.signals[0].candidates[0].checkpointPlan={
    surprisePersistence:{
      currentSurprise:'orders accelerating',
      whatMustRemainIncremental:'earnings estimates lag orders',
      closureIndicators:['estimate revisions catch up']
    },
    checkpoints:[
      {afterTradingDays:120,evidenceToRefresh:['filing'],continueIf:['intact'],downgradeIf:['slower'],exitIf:['broken']},
      {afterTradingDays:60,evidenceToRefresh:['filing'],continueIf:['intact'],downgradeIf:['slower'],exitIf:['broken']}
    ]
  };
  assert.throws(()=>validateResearchPacket(p),/unique and ascending/);
});
