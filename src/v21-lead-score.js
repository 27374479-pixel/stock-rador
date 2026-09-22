const {
  scoreExposure,
  scorePricedIn,
  scoreSurprise,
  verifyClaim
} = require('./v2-lead-score');

function assertRange(value, min, max, name) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
}

function scoreMonetization(monetization) {
  const positive = [
    ['canDeliverIntoBottleneck', 0, 3],
    ['documentedSubstitutionOrShareGain', 0, 3],
    ['marginCapture', 0, 2],
    ['persistenceAfterNormalization', 0, 2]
  ];
  let score = 0;
  for (const [key, min, max] of positive) {
    assertRange(monetization[key], min, max, `monetization.${key}`);
    score += monetization[key];
  }
  assertRange(monetization.inputConstraintExposure ?? 0, 0, 3, 'monetization.inputConstraintExposure');
  return Math.max(0, score - (monetization.inputConstraintExposure ?? 0));
}

function scoreReversalRisk(reversalRisk) {
  const fields = [
    ['priceMomentumRollingOver', 0, 3],
    ['inventoryBuild', 0, 2],
    ['demandDestruction', 0, 3]
  ];
  let score = 0;
  for (const [key, min, max] of fields) {
    assertRange(reversalRisk[key], min, max, `reversalRisk.${key}`);
    score += reversalRisk[key];
  }
  return score;
}

function scoreCandidateV21({
  evidence,
  asOf,
  exposure,
  surprise,
  pricing,
  monetization,
  reversalRisk
}) {
  const verification = verifyClaim(evidence, asOf);
  const exposureScore = scoreExposure(exposure);
  const surpriseScore = scoreSurprise(surprise);
  const monetizationScore = scoreMonetization(monetization);
  const pricedInPenalty = scorePricedIn(pricing);
  const reversalRiskPenalty = scoreReversalRisk(reversalRisk);

  const verificationCredit =
    verification.status === 'confirmed' ? 8 :
      verification.status === 'probable' ? 5 :
        verification.status === 'contradicted' ? -8 : 0;

  const total = verificationCredit + exposureScore + surpriseScore + monetizationScore
    - pricedInPenalty - reversalRiskPenalty;

  const hardGate =
    ['confirmed', 'probable'].includes(verification.status) &&
    verification.contradictionScore < verification.supportScore &&
    exposureScore >= 6 &&
    surpriseScore >= 4 &&
    monetizationScore >= 5 &&
    reversalRiskPenalty <= 5;

  return {
    decision: hardGate && total >= 20 ? 'Candidate' : 'Watch',
    total,
    verificationCredit,
    verification,
    exposureScore,
    surpriseScore,
    monetizationScore,
    pricedInPenalty,
    reversalRiskPenalty,
    rationale: {
      shortageIsNotAutomaticallyBullish: true,
      benefitMustBeCapturedByCandidate: true,
      cycleReversalEvidenceIsExplicit: true,
      futureOutcomeInputsAllowed: false
    }
  };
}

module.exports = {
  scoreCandidateV21,
  scoreMonetization,
  scoreReversalRisk
};
