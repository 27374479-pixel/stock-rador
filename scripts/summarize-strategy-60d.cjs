const fs = require('node:fs');
const path = require('node:path');

const runsDir = path.join(process.cwd(), 'backtests', 'runs');

function mean(xs) {
  return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null;
}
function median(xs) {
  if (!xs.length) return null;
  const a=[...xs].sort((x,y)=>x-y);
  const m=Math.floor(a.length/2);
  return a.length%2 ? a[m] : (a[m-1]+a[m])/2;
}
function rate(n,d) { return d ? n/d : null; }

function versionOf(runId) {
  const m=/-v(\d+)\.(\d+)/.exec(runId || '');
  return m ? [Number(m[1]),Number(m[2])] : null;
}
function isV1Plus(runId) {
  const v=versionOf(runId);
  return v && v[0] >= 1;
}

function loadOutcomes() {
  const rows=[];
  for (const dir of fs.readdirSync(runsDir)) {
    if (!dir.includes('multisource-deep')) continue;
    const file=path.join(runsDir,dir,'outcome.json');
    if (!fs.existsSync(file)) continue;
    const o=JSON.parse(fs.readFileSync(file,'utf8'));
    if (!Array.isArray(o.hypothesisResults)) continue;
    rows.push(o);
  }
  return rows;
}

function aggregate(outcomes) {
  let memoCount=0, selectedHypotheses=0, primaryHypotheses=0, noSelection=0;
  const h60=[], p60=[];
  for (const o of outcomes) {
    const s=o.hypothesisMemoSummary || {};
    memoCount += Number(s.count || 0);
    selectedHypotheses += Number(s.researchSelectionCount || 0) + Number(s.highPrioritySelectionCount || 0);
    primaryHypotheses += Number(s.highPrioritySelectionCount || 0);
    noSelection += Number(s.noSelectionCount || 0);

    for (const h of o.hypothesisResults || []) {
      const v=h?.horizons?.['60'];
      if (v && Number.isFinite(v.netReturn) && Number.isFinite(v.excessReturn)) {
        h60.push({netReturn:v.netReturn, excessReturn:v.excessReturn});
      }
    }
    for (const h of o.primaryHypothesisResults || []) {
      const v=h?.horizons?.['60'];
      if (v && Number.isFinite(v.netReturn) && Number.isFinite(v.excessReturn)) {
        p60.push({netReturn:v.netReturn, excessReturn:v.excessReturn});
      }
    }
  }

  function metrics(rows) {
    const net=rows.map(x=>x.netReturn), ex=rows.map(x=>x.excessReturn);
    return {
      count: rows.length,
      positiveReturnCount: net.filter(x=>x>0).length,
      positiveReturnRate: rate(net.filter(x=>x>0).length,rows.length),
      excessHitCount: ex.filter(x=>x>0).length,
      excessHitRate: rate(ex.filter(x=>x>0).length,rows.length),
      meanNetReturn: mean(net),
      medianNetReturn: median(net),
      meanExcessReturn: mean(ex),
      medianExcessReturn: median(ex),
      minNetReturn: net.length ? Math.min(...net) : null,
      maxNetReturn: net.length ? Math.max(...net) : null
    };
  }

  return {
    runCount: outcomes.length,
    memoCount,
    selectedHypotheses,
    noSelection,
    primaryHypotheses,
    selectionRate: rate(selectedHypotheses,memoCount),
    primaryRate: rate(primaryHypotheses,memoCount),
    selected60d: metrics(h60),
    primary60d: metrics(p60)
  };
}

function currentExpandedRun() {
  const manifestPath=path.join(runsDir,'2016q2-expanded-discovery-v2.0-001','manifest.json');
  const screeningPath=path.join(runsDir,'2016q2-expanded-discovery-v2.0-001','screening.json');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(screeningPath)) return null;
  const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const s=JSON.parse(fs.readFileSync(screeningPath,'utf8'));
  let research=0, primary=0, noSelection=0;
  for (const p of m.hypothesisMemoPaths || []) {
    const memo=JSON.parse(fs.readFileSync(path.join(process.cwd(),p),'utf8'));
    if (memo.selectionState === 'Research selection') research++;
    else if (memo.selectionState === 'High-priority selection') primary++;
    else if (memo.selectionState === 'No selection') noSelection++;
  }
  const eventCount=Number(s?.summary?.eventClusterCount || s.reviewItemCount || 0);
  const promoted=Number(s?.summary?.promotedEventCount || 0);
  return {
    eventCount,
    promotedEventCount: promoted,
    researchSelections: research,
    primarySelections: primary,
    noSelections: noSelection,
    anySelectionCount: research+primary,
    selectionRateVsAllEvents: rate(research+primary,eventCount),
    selectionRateVsPromoted: rate(research+primary,promoted),
    primaryRateVsAllEvents: rate(primary,eventCount),
    outcomeRevealed: fs.existsSync(path.join(runsDir,'2016q2-expanded-discovery-v2.0-001','outcome.json'))
  };
}

const all=loadOutcomes();
const report={
  schemaVersion:'1.0',
  generatedAt:new Date().toISOString(),
  definition:{
    successAbsolute:'60-trading-day hypothesis net return > 0',
    successExcess:'60-trading-day hypothesis excess return versus CSI300 > 0',
    primary:'High-priority selection at hypothesis level',
    selectionRate:'Research selection + High-priority selection divided by all frozen hypothesis memos'
  },
  allCompletedMultisourceRuns: aggregate(all),
  v1PlusCompletedRuns: aggregate(all.filter(o=>isV1Plus(o.runId))),
  current2016Q2ExpandedDiscovery: currentExpandedRun()
};
console.log(JSON.stringify(report,null,2));
