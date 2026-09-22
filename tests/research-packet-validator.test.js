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
