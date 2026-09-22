const SOURCE_BASE = Object.freeze({
  primary_official: 5,
  professional_data: 4,
  practitioner_firsthand: 3,
  specialist_forum: 2,
  investor_social: 1,
  repost: 0
});

function assertNumberInRange(value, min, max, name) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
}

function wasAvailableBy(item, asOf) {
  const cutoff = Date.parse(asOf);
  if (!Number.isFinite(cutoff)) throw new Error('asOf must be an ISO timestamp');
  for (const key of ['publishedAt', 'availableAt']) {
    if (typeof item[key] !== 'string' || !Number.isFinite(Date.parse(item[key]))) return false;
    if (Date.parse(item[key]) > cutoff) return false;
  }
  return true;
}

function evidenceQuality(item) {
  if (!Object.hasOwn(SOURCE_BASE, item.sourceClass)) {
    throw new Error(`unknown sourceClass: ${item.sourceClass}`);
  }
  const base = SOURCE_BASE[item.sourceClass];
  const identity = item.identityKnown ? 1 : 0;
  const firsthand = item.firsthand ? 2 : 0;
  const specificity = item.specificity === 'high' ? 2 : item.specificity === 'medium' ? 1 : 0;
  const methodology = item.methodologyVisible ? 1 : 0;
  const traceability = item.originalUrl && item.timestampTraceable ? 1 : 0;
  const promotionPenalty = item.promotional ? 2 : 0;
  const tickerPitchPenalty = item.tickerPitch ? 1 : 0;
  const editedPenalty = item.editedAfterCutoff ? 3 : 0;
  return Math.max(0, base + identity + firsthand + specificity + methodology + traceability
    - promotionPenalty - tickerPitchPenalty - editedPenalty);
}

function groupBest(items) {
  const groups = new Map();
  for (const item of items) {
    const group = item.independenceGroup;
    if (typeof group !== 'string' || !group.trim()) throw new Error('independenceGroup is required');
    const quality = evidenceQuality(item);
    const current = groups.get(group);
    if (!current || quality > current.quality) groups.set(group, { item, quality });
  }
  return [...groups.values()];
}

function verifyClaim(evidence, asOf) {
  if (!Array.isArray(evidence)) throw new Error('evidence must be an array');
  const eligible = evidence.filter((item) => wasAvailableBy(item, asOf));
  const support = groupBest(eligible.filter((item) => item.relation === 'supports'));
  const contradict = groupBest(eligible.filter((item) => item.relation === 'contradicts'));
  const supportScore = support.reduce((sum, row) => sum + row.quality, 0);
  const contradictionScore = contradict.reduce((sum, row) => sum + row.quality, 0);
  const hasPrimarySupport = support.some(({ item }) => item.sourceClass === 'primary_official');
  const hasProfessionalSupport = support.some(({ item }) => item.sourceClass === 'professional_data');
  const hasStrongContradiction = contradict.some(({ item, quality }) =>
    quality >= 5 && ['primary_official', 'professional_data'].includes(item.sourceClass));

  let status = 'unverified';
  if (hasStrongContradiction && contradictionScore >= supportScore) {
    status = 'contradicted';
  } else if (
    support.length >= 2 &&
    supportScore >= 9 &&
    (hasPrimarySupport || hasProfessionalSupport)
  ) {
    status = 'confirmed';
  } else if (support.length >= 2 && supportScore >= 6 && contradictionScore < supportScore) {
    status = 'probable';
  }

  return {
    status,
    eligibleEvidenceCount: eligible.length,
    independentSupportGroups: support.length,
    independentContradictionGroups: contradict.length,
    supportScore,
    contradictionScore,
    hasPrimarySupport,
    hasProfessionalSupport
  };
}

function scoreExposure(exposure) {
  const fields = [
    ['productDirectness', 0, 3],
    ['revenueMateriality', 0, 3],
    ['geographyCustomerMatch', 0, 2],
    ['capacityReadiness', 0, 2]
  ];
  let score = 0;
  for (const [key, min, max] of fields) {
    assertNumberInRange(exposure[key], min, max, `exposure.${key}`);
    score += exposure[key];
  }
  assertNumberInRange(exposure.diversificationPenalty ?? 0, 0, 2, 'exposure.diversificationPenalty');
  assertNumberInRange(exposure.substitutionPenalty ?? 0, 0, 2, 'exposure.substitutionPenalty');
  return Math.max(0, score - (exposure.diversificationPenalty ?? 0) - (exposure.substitutionPenalty ?? 0));
}

function scoreSurprise(surprise) {
  const fields = [
    ['magnitudeAcceleration', 0, 3],
    ['consensusGap', 0, 3],
    ['estimateRevisionLag', 0, 2],
    ['durationPersistence', 0, 2]
  ];
  let score = 0;
  for (const [key, min, max] of fields) {
    assertNumberInRange(surprise[key], min, max, `surprise.${key}`);
    score += surprise[key];
  }
  return score;
}

function scorePricedIn(pricing) {
  assertNumberInRange(pricing.mediaSaturation, 0, 3, 'pricing.mediaSaturation');
  assertNumberInRange(pricing.valuationStretch, 0, 2, 'pricing.valuationStretch');
  assertNumberInRange(pricing.estimateRevisionCompletion, 0, 3, 'pricing.estimateRevisionCompletion');

  let priceRunPenalty = 0;
  if (Number.isFinite(pricing.prior60Return)) {
    if (pricing.prior60Return > 0.8) priceRunPenalty += 3;
    else if (pricing.prior60Return > 0.4) priceRunPenalty += 2;
    else if (pricing.prior60Return > 0.2) priceRunPenalty += 1;
  }
  if (Number.isFinite(pricing.prior180Return)) {
    if (pricing.prior180Return > 1.5) priceRunPenalty += 3;
    else if (pricing.prior180Return > 0.8) priceRunPenalty += 2;
    else if (pricing.prior180Return > 0.4) priceRunPenalty += 1;
  }
  return pricing.mediaSaturation + pricing.valuationStretch +
    pricing.estimateRevisionCompletion + priceRunPenalty;
}

function scoreCandidateV2({ evidence, asOf, exposure, surprise, pricing }) {
  const verification = verifyClaim(evidence, asOf);
  const exposureScore = scoreExposure(exposure);
  const surpriseScore = scoreSurprise(surprise);
  const pricedInPenalty = scorePricedIn(pricing);

  const verificationCredit =
    verification.status === 'confirmed' ? 8 :
      verification.status === 'probable' ? 5 :
        verification.status === 'contradicted' ? -8 : 0;

  const total = verificationCredit + exposureScore + surpriseScore - pricedInPenalty;
  const hardGate =
    ['confirmed', 'probable'].includes(verification.status) &&
    exposureScore >= 6 &&
    surpriseScore >= 4 &&
    verification.contradictionScore < verification.supportScore;

  return {
    decision: hardGate && total >= 15 ? 'Candidate' : 'Watch',
    total,
    verificationCredit,
    verification,
    exposureScore,
    surpriseScore,
    pricedInPenalty,
    rationale: {
      noSimplePublicDisclosurePenalty: true,
      forumIsDiscoveryNotTruth: true,
      independentGroupsCapped: true,
      futureOutcomeInputsAllowed: false
    }
  };
}

module.exports = {
  evidenceQuality,
  scoreCandidateV2,
  scoreExposure,
  scorePricedIn,
  scoreSurprise,
  verifyClaim,
  wasAvailableBy
};
