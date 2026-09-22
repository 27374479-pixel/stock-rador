const {
  scoreExposure,
  scorePricedIn,
  scoreSurprise,
  verifyClaim
} = require('./v2-lead-score');
const {
  scoreMonetization,
  scoreReversalRisk
} = require('./v21-lead-score');

function assertRange(value, min, max, name) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
}

function scoreIncrementalEarningsBridge(bridge) {
  const positive = [
    ['bottleneckSpecificRevenueMateriality', 0, 3],
    ['shipmentOrOrderProof', 0, 3],
    ['unitEconomicsLeverage', 0, 2],
    ['durationVisibility', 0, 2]
  ];
  let score = 0;
  for (const [key, min, max] of positive) {
    assertRange(bridge[key], min, max, `earningsBridge.${key}`);
    score += bridge[key];
  }
  assertRange(bridge.adjacencyPenalty ?? 0, 0, 3, 'earningsBridge.adjacencyPenalty');
  return Math.max(0, score - (bridge.adjacencyPenalty ?? 0));
}

function scoreCandidateV22({
  evidence,
  asOf,
  exposure,
  surprise,
  pricing,
  monetization,
  reversalRisk,
  earningsBridge
}) {
  const verification = verifyClaim(evidence, asOf);
  const exposureScore = scoreExposure(exposure);
  const surpriseScore = scoreSurprise(surprise);
  const monetizationScore = scoreMonetization(monetization);
  const earningsBridgeScore = scoreIncrementalEarningsBridge(earningsBridge);
  const pricedInPenalty = scorePricedIn(pricing);
  const reversalRiskPenalty = scoreReversalRisk(reversalRisk);

  const verificationCredit =
    verification.status === 'confirmed' ? 8 :
      verification.status === 'probable' ? 5 :
        verification.status === 'contradicted' ? -8 : 0;

  const total = verificationCredit + exposureScore + surpriseScore + monetizationScore
    + earningsBridgeScore - pricedInPenalty - reversalRiskPenalty;

  const bridgeSpecificityGate =
    Math.max(
      earningsBridge.bottleneckSpecificRevenueMateriality,
      earningsBridge.shipmentOrOrderProof
    ) >= 2;

  const hardGate =
    ['confirmed', 'probable'].includes(verification.status) &&
    verification.contradictionScore < verification.supportScore &&
    exposureScore >= 6 &&
    surpriseScore >= 4 &&
    monetizationScore >= 5 &&
    earningsBridgeScore >= 5 &&
    bridgeSpecificityGate &&
    reversalRiskPenalty <= 5;

  return {
    decision: hardGate && total >= 25 ? 'Candidate' : 'Watch',
    total,
    verificationCredit,
    verification,
    exposureScore,
    surpriseScore,
    monetizationScore,
    earningsBridgeScore,
    pricedInPenalty,
    reversalRiskPenalty,
    hardGateDetails: {
      bridgeSpecificityGate,
      minimumBridgeScore: 5,
      minimumTotal: 25
    },
    rationale: {
      genericSegmentExposureIsInsufficient: true,
      bottleneckSpecificEconomicMaterialityRequired: true,
      shipmentOrOrderProofPreferredOverAdjacency: true,
      futureOutcomeInputsAllowed: false
    }
  };
}

module.exports = {
  scoreCandidateV22,
  scoreIncrementalEarningsBridge
};
