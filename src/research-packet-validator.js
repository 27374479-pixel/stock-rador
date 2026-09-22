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
      }
    }
  }

  return true;
}

module.exports = { validateResearchPacket };
