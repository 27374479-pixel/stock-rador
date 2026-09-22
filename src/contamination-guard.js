function assertNoViewedOutcomeCandidates(candidates, consumedOutcomeTickers = []) {
  if (!Array.isArray(candidates) || !Array.isArray(consumedOutcomeTickers)) {
    throw new Error('candidates and consumedOutcomeTickers must be arrays');
  }
  const consumed = new Set(consumedOutcomeTickers);
  const overlaps = candidates
    .map((candidate) => candidate?.ticker)
    .filter((ticker) => typeof ticker === 'string' && consumed.has(ticker));
  if (overlaps.length) {
    throw new Error(`candidate outcome contamination: ${[...new Set(overlaps)].join(', ')}`);
  }
  return true;
}

module.exports = { assertNoViewedOutcomeCandidates };
