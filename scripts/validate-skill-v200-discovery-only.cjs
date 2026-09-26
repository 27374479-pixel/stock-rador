const fs=require('node:fs');

const v19=fs.readFileSync('skills/stock-rador/versions/1.9.0/SKILL.md','utf8');
const v20=fs.readFileSync('skills/stock-rador/versions/2.0.0/SKILL.md','utf8');

const start='## V2.0 hub-first discovery contract';
const end='## V1.9 source-linked fresh-incremental escalation contract';
if(!v20.includes(start)||!v20.includes(end)) throw new Error('missing V2.0 discovery contract boundary');

const section=v20.slice(v20.indexOf(start),v20.indexOf(end));
for(const needle of [
  'sector/value-chain labels **after**, not before, event discovery',
  'A hub is a discovery surface, not proof',
  'Specialist sources are validators, not universe generators',
  'Research reports are expectation evidence, not discovery signals',
  'does **not**:',
  'loosen Research or Primary gates',
  'create a frequency quota'
]){
  if(!section.includes(needle)) throw new Error('missing V2.0 invariant: '+needle);
}

let stripped=v20.slice(0,v20.indexOf(start))+v20.slice(v20.indexOf(end));
stripped=stripped
  .replace('name: stock-rador-v2.0','name: stock-rador-v1.9')
  .replace('# Stock Rador — AI Research Skill v2.0','# Stock Rador — AI Research Skill v1.9')
  .replace(
    '  Hub-first, evidence-first A-share opportunity research skill. Discover economically\n  material state changes from broad professional information surfaces without sector\n  preselection, recover original evidence, verify adversarially, build a causal earnings',
    '  Evidence-first A-share opportunity research skill. Discover potentially mispriced\n  changes from public information, verify them adversarially, build a causal earnings'
  );

if(stripped!==v19) {
  let i=0; while(i<stripped.length&&i<v19.length&&stripped[i]===v19[i]) i++;
  throw new Error('V2.0 changed inherited V1.9 content outside discovery contract at byte '+i);
}

console.log('V2.0 discovery-only invariant verified');
