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
        thesisBreakers:['lead times normalize','capacity fails','customer orders fall']
      }]
    }]
  };
}

test('valid skill packet passes',()=>assert.equal(validateResearchPacket(packet()),true));

test('future evidence is rejected',()=>{
  const p=packet();
  p.signals[0].evidence[0].availableAt='2024-03-20T00:00:00Z';
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
