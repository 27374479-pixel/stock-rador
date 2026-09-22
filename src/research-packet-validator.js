const OUTCOME_TERMS = [
  '牛股','翻倍','暴涨','龙头','winner','best stock','multibagger','best performing'
];

function ts(value, name) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a valid timestamp`);
  return parsed;
}

function validateEvidence(items, cutoff, label) {
  if (!Array.isArray(items)) throw new Error(`${label} must be an array`);
  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== 'object') throw new Error(`${label}[${index}] must be an object`);
    for (const key of ['publishedAt','availableAt']) {
      if (!item[key]) throw new Error(`${label}[${index}].${key} is required`);
      if (ts(item[key], `${label}[${index}].${key}`) > cutoff) {
        throw new Error(`future evidence in ${label}[${index}]: ${key}`);
      }
    }
  }
}

function versionAtLeast(version, target) {
  const a=String(version??'0').split('.').map(Number);
  const b=String(target).split('.').map(Number);
  const n=Math.max(a.length,b.length);
  for(let i=0;i<n;i++){
    const x=Number.isFinite(a[i])?a[i]:0;
    const y=Number.isFinite(b[i])?b[i]:0;
    if(x>y)return true;
    if(x<y)return false;
  }
  return true;
}

function validateResearchPacket(packet, options = {}) {
  if (!packet || typeof packet !== 'object') throw new Error('packet must be an object');
  if (packet.mode !== 'historical') throw new Error('only historical packet validation is supported');
  if (packet.outcomeDataUsed !== false) throw new Error('historical packet must set outcomeDataUsed=false');
  const cutoff = ts(packet.asOf, 'asOf');

  const quarantined = new Set(options.quarantinedTickers ?? []);
  const queries = packet.discoveryQueries ?? [];
  if (!Array.isArray(queries)) throw new Error('discoveryQueries must be an array');
  for (const query of queries) {
    const lower = String(query).toLowerCase();
    const hit = OUTCOME_TERMS.find((term) => lower.includes(term.toLowerCase()));
    if (hit) throw new Error(`outcome-oriented discovery term is forbidden: ${hit}`);
  }

  if (!Array.isArray(packet.signals) || !packet.signals.length) throw new Error('signals must be a non-empty array');

  for (const [signalIndex, signal] of packet.signals.entries()) {
    const signalCutoff = signal.asOf ? ts(signal.asOf, `signals[${signalIndex}].asOf`) : cutoff;
    if (signalCutoff > cutoff) {
      throw new Error(`signals[${signalIndex}].asOf cannot be later than packet.asOf`);
    }
    if (!signal.beneficiaryArchetype || typeof signal.beneficiaryArchetype !== 'string') {
      throw new Error(`signals[${signalIndex}].beneficiaryArchetype is required`);
    }
    validateEvidence(signal.evidence ?? [], signalCutoff, `signals[${signalIndex}].evidence`);
    validateEvidence(signal.contraryEvidence ?? [], signalCutoff, `signals[${signalIndex}].contraryEvidence`);

    const candidates = signal.candidates ?? [];
    if (!Array.isArray(candidates)) throw new Error(`signals[${signalIndex}].candidates must be an array`);
    for (const [candidateIndex, candidate] of candidates.entries()) {
      if (quarantined.has(candidate.ticker)) throw new Error(`quarantined ticker: ${candidate.ticker}`);
      if (!['Candidate','Watch','No Trade'].includes(candidate.decision)) {
        throw new Error(`invalid decision for ${candidate.ticker}`);
      }
      if (candidate.decision === 'Candidate') {
        if (!Array.isArray(candidate.thesisBreakers) || candidate.thesisBreakers.length < 3) {
          throw new Error(`Candidate ${candidate.ticker} requires at least three thesisBreakers`);
        }
        if (!Array.isArray(candidate.earningsBridge) || candidate.earningsBridge.length < 3) {
          throw new Error(`Candidate ${candidate.ticker} requires an explicit earningsBridge`);
        }
        if (!candidate.priceExpectation) throw new Error(`Candidate ${candidate.ticker} requires priceExpectation`);
        const basis = candidate.basisReconciliation;
        if (!basis || !basis.externalIndicator || !basis.companyRealizedBasis || !basis.basisRisk) {
          throw new Error(`Candidate ${candidate.ticker} requires basisReconciliation`);
        }
        const valuation = candidate.valuationBridge;
        if (!valuation || !valuation.marketCapOrEV || !valuation.bearCase || !valuation.baseCase || !valuation.upsideCase || !valuation.impliedExpectation) {
          throw new Error(`Candidate ${candidate.ticker} requires valuationBridge`);
        }
        if (versionAtLeast(packet.schemaVersion, '3.2')) {
          const horizon = candidate.horizonBridge;
          const allowed = new Set(['event-repricing','cyclical-multi-quarter','structural-multi-year']);
          if (!horizon || !allowed.has(horizon.shockClass) || !horizon.expectedHalfLife ||
              !Array.isArray(horizon.normalizationIndicators) || !horizon.normalizationIndicators.length ||
              !horizon.expectedResearchHorizon || !horizon.whyHorizonMatches) {
            throw new Error(`Candidate ${candidate.ticker} requires horizonBridge under V3.2+`);
          }
        }
        if (versionAtLeast(packet.schemaVersion, '3.3')) {
          const plan=candidate.checkpointPlan;
          if (!plan || !plan.surprisePersistence || !Array.isArray(plan.checkpoints) || !plan.checkpoints.length) {
            throw new Error(`Candidate ${candidate.ticker} requires checkpointPlan under V3.3+`);
          }
          const sp=plan.surprisePersistence;
          if (!sp.currentSurprise || !sp.whatMustRemainIncremental ||
              !Array.isArray(sp.closureIndicators) || !sp.closureIndicators.length) {
            throw new Error(`Candidate ${candidate.ticker} requires surprisePersistence under V3.3+`);
          }
          let previous=-Infinity;
          const seen=new Set();
          for (const [checkpointIndex,checkpoint] of plan.checkpoints.entries()) {
            const days=checkpoint?.afterTradingDays;
            if (!Number.isInteger(days) || days <= 0) {
              throw new Error(`Candidate ${candidate.ticker} checkpoint[${checkpointIndex}] requires positive integer afterTradingDays`);
            }
            if (seen.has(days) || days <= previous) {
              throw new Error(`Candidate ${candidate.ticker} checkpoints must be unique and ascending`);
            }
            seen.add(days); previous=days;
            for (const key of ['evidenceToRefresh','continueIf','downgradeIf','exitIf']) {
              if (!Array.isArray(checkpoint[key]) || !checkpoint[key].length) {
                throw new Error(`Candidate ${candidate.ticker} checkpoint[${checkpointIndex}].${key} is required`);
              }
            }
          }
        }
      }
    }
  }

  return true;
}

module.exports = { validateResearchPacket, versionAtLeast };
