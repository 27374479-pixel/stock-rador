const { validateDiscoveryPack, validateDiscoveryScreening, summarizeDiscoveryPack } = require('./discovery-core.cjs');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function assertIso(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${label} must be an ISO timestamp`);
  }
}

function assertDate(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`${label} must be YYYY-MM-DD`);
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`cannot read JSON ${filePath}: ${error.message}`);
  }
}

function resolveInside(rootDir, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`path must be a non-empty repository-relative path: ${relativePath}`);
  }
  const root = path.resolve(rootDir);
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`path escapes repository root: ${relativePath}`);
  }
  return resolved;
}

function validateManifest(manifest) {
  const errors = [];
  if (!['1.0', '1.1', '1.2', '1.3', '1.4'].includes(manifest?.schemaVersion)) errors.push('schemaVersion must be 1.0, 1.1, 1.2, 1.3 or 1.4');
  if (!/^[A-Za-z0-9._-]+$/.test(manifest?.runId ?? '')) errors.push('runId must use letters, numbers, dot, underscore or dash');
  if (!['historical_replay', 'forward'].includes(manifest?.evaluationMode)) errors.push('evaluationMode must be historical_replay or forward');
  try { assertIso(manifest?.createdAt, 'createdAt'); } catch (error) { errors.push(error.message); }
  if (!manifest?.skill?.path) errors.push('skill.path is required');
  if (!manifest?.skill?.version) errors.push('skill.version is required');
  if (!manifest?.model?.name) errors.push('model.name is required');
  if (!manifest?.screeningPath) errors.push('screeningPath is required');
  if (!Array.isArray(manifest?.implementationPaths) || manifest.implementationPaths.length === 0) {
    errors.push('implementationPaths must be non-empty');
  }
  try { assertDate(manifest?.discoveryWindow?.startDate, 'discoveryWindow.startDate'); } catch (error) { errors.push(error.message); }
  try { assertDate(manifest?.discoveryWindow?.endDate, 'discoveryWindow.endDate'); } catch (error) { errors.push(error.message); }
  if (manifest?.discoveryWindow?.startDate && manifest?.discoveryWindow?.endDate && manifest.discoveryWindow.startDate > manifest.discoveryWindow.endDate) {
    errors.push('discoveryWindow.startDate must not be after endDate');
  }
  if (!manifest?.benchmark?.ticker) errors.push('benchmark.ticker is required');
  const horizons = manifest?.outcomePolicy?.holdingTradingDays;
  if (!Array.isArray(horizons) || horizons.length === 0 || horizons.some((n) => !Number.isInteger(n) || n < 1)) {
    errors.push('outcomePolicy.holdingTradingDays must contain positive integers');
  }
  const cost = manifest?.outcomePolicy?.oneWayCostRate;
  if (!(typeof cost === 'number' && cost >= 0 && cost < 0.1)) errors.push('outcomePolicy.oneWayCostRate must be in [0, 0.1)');
  if (manifest?.outcomePolicy?.entryRule !== 'next_trading_day_open_after_cutoff_date') {
    errors.push('outcomePolicy.entryRule must be next_trading_day_open_after_cutoff_date');
  }
  if (['1.2', '1.3', '1.4'].includes(manifest?.schemaVersion)) {
    const trackedHypothesisStates = manifest?.trackedHypothesisStates;
    const trackedSelectionStates = manifest?.trackedSelectionStates;
    const primarySelectionStates = manifest?.primarySelectionStates;
    if (!Array.isArray(trackedHypothesisStates) || trackedHypothesisStates.length === 0) errors.push('trackedHypothesisStates must be non-empty');
    if (!Array.isArray(trackedSelectionStates) || trackedSelectionStates.length === 0) errors.push('trackedSelectionStates must be non-empty');
    if (!Array.isArray(primarySelectionStates) || primarySelectionStates.length === 0) errors.push('primarySelectionStates must be non-empty');
    if (Array.isArray(trackedSelectionStates) && Array.isArray(primarySelectionStates) &&
        primarySelectionStates.some((state) => !trackedSelectionStates.includes(state))) {
      errors.push('primarySelectionStates must be a subset of trackedSelectionStates');
    }
  } else {
    const trackedStates = manifest?.trackedMemoStates ?? manifest?.eligibleMemoStates;
    const primaryStates = manifest?.primarySignalStates ?? trackedStates;
    if (!Array.isArray(trackedStates) || trackedStates.length === 0) errors.push('trackedMemoStates must be non-empty');
    if (!Array.isArray(primaryStates) || primaryStates.length === 0) errors.push('primarySignalStates must be non-empty');
    if (Array.isArray(trackedStates) && Array.isArray(primaryStates) && primaryStates.some((state) => !trackedStates.includes(state))) {
      errors.push('primarySignalStates must be a subset of trackedMemoStates');
    }
  }
  if (!Array.isArray(manifest?.selections)) errors.push('selections must be an array');
  if (['1.2', '1.3', '1.4'].includes(manifest?.schemaVersion)) {
    if (!Array.isArray(manifest?.hypothesisMemoPaths)) {
      errors.push('hypothesisMemoPaths must be an array');
    } else if (Array.isArray(manifest?.selections)) {
      const memoSet = new Set(manifest.hypothesisMemoPaths);
      for (const selection of manifest.selections) {
        if (selection?.memoPath && !memoSet.has(selection.memoPath)) {
          errors.push(`selection memoPath must be included in hypothesisMemoPaths: ${selection.memoPath}`);
        }
      }
    }
  }
  if (manifest?.outcomePolicy?.matchedControlStatistic &&
      manifest.outcomePolicy.matchedControlStatistic !== 'equal_weight_mean') {
    errors.push('outcomePolicy.matchedControlStatistic must be equal_weight_mean');
  }
  if (['1.2', '1.3', '1.4'].includes(manifest?.schemaVersion) && !manifest?.contaminationControls?.sourcePackPath) {
    errors.push('schemaVersion 1.2+ requires contaminationControls.sourcePackPath for every evaluation mode');
  }
  if (manifest?.schemaVersion === '1.4') {
    if (!manifest?.discoveryPolicy || typeof manifest.discoveryPolicy !== 'object') {
      errors.push('schemaVersion 1.4 requires discoveryPolicy');
    }
  }
  if (manifest?.evaluationMode === 'historical_replay') {
    if (!manifest?.contaminationControls?.modelMemoryRisk) errors.push('historical_replay requires contaminationControls.modelMemoryRisk');
    if (!manifest?.contaminationControls?.sourcePackPath) errors.push('historical_replay requires contaminationControls.sourcePackPath');
    if (['1.1', '1.2', '1.3', '1.4'].includes(manifest?.schemaVersion) && !manifest?.contaminationControls?.identityStressPath) {
      errors.push('schemaVersion 1.1/1.2/1.3 historical replay requires contaminationControls.identityStressPath');
    }
  }
  return errors;
}

function validateScreening(screening, manifest) {
  const errors = [];
  if (!['1.1', '1.2', '1.3', '1.4'].includes(manifest?.schemaVersion)) return errors;
  if (screening?.runId !== manifest.runId) errors.push('screening.runId must match manifest.runId');
  const decisions = screening?.reviewDecisions;
  if (!Array.isArray(decisions)) {
    errors.push('screening.reviewDecisions must be an array');
    return errors;
  }
  if (!Number.isInteger(screening?.reviewItemCount) || screening.reviewItemCount !== decisions.length) {
    errors.push('screening.reviewItemCount must equal reviewDecisions.length');
  }
  const seen = new Set();
  for (const decision of decisions) {
    if (!decision?.itemId) errors.push('every screening decision requires itemId');
    if (!['reject', 'promote', 'duplicate'].includes(decision?.decision)) {
      errors.push(`invalid screening decision for ${decision?.itemId ?? 'unknown'}`);
    }
    if (typeof decision?.reasonCode !== 'string' || !decision.reasonCode) {
      errors.push(`screening decision ${decision?.itemId ?? 'unknown'} requires reasonCode`);
    }
    if (decision?.itemId) {
      if (seen.has(decision.itemId)) errors.push(`duplicate screening decision for ${decision.itemId}`);
      seen.add(decision.itemId);
    }
  }
  return errors;
}

function validateIdentityStress(stress, manifest) {
  const errors = [];
  if (!['1.1', '1.2', '1.3', '1.4'].includes(manifest?.schemaVersion) || manifest?.evaluationMode !== 'historical_replay') return errors;
  if (stress?.runId !== manifest.runId) errors.push('identity stress runId must match manifest.runId');
  if (!['passed', 'failed', 'not_feasible'].includes(stress?.status)) {
    errors.push('identity stress status must be passed, failed or not_feasible');
  }
  if (stress?.performedBeforeReveal !== true) errors.push('identity stress must be performedBeforeReveal');
  if (typeof stress?.method !== 'string' || !stress.method) errors.push('identity stress method is required');
  return errors;
}

function collectEvidenceRefs(value, refs = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectEvidenceRefs(item, refs);
    return refs;
  }
  if (!value || typeof value !== 'object') return refs;
  if (Array.isArray(value.evidenceRefs)) {
    for (const id of value.evidenceRefs) {
      if (typeof id === 'string' && id) refs.add(id);
    }
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'evidenceRefs' || key === 'evidenceLedger') continue;
    collectEvidenceRefs(child, refs);
  }
  return refs;
}

function validateMemoEvidenceRefs(memo, memoPath, sourcePack) {
  const errors = [];
  const reviewItems = Array.isArray(sourcePack?.reviewItems) ? sourcePack.reviewItems : [];
  const evidenceDocuments = Array.isArray(sourcePack?.evidenceDocuments) ? sourcePack.evidenceDocuments : [];
  const sourceItems = Array.isArray(sourcePack?.sourceItems) ? sourcePack.sourceItems : [];
  const sources = new Map();

  for (const item of reviewItems) {
    const id = item?.itemId ?? item?.id;
    if (!id) continue;
    if (sources.has(id)) errors.push(`source pack duplicates evidence id ${id}`);
    sources.set(id, { ...item, sourcePackRef: 'reviewItems' });
  }
  for (const item of evidenceDocuments) {
    const id = item?.id ?? item?.itemId;
    if (!id) continue;
    if (sources.has(id)) errors.push(`source pack duplicates evidence id ${id}`);
    sources.set(id, { ...item, sourcePackRef: 'evidenceDocuments' });
  }
  for (const item of sourceItems) {
    const id = item?.itemId ?? item?.id;
    if (!id) continue;
    if (sources.has(id)) errors.push(`source pack duplicates evidence id ${id}`);
    sources.set(id, { ...item, sourcePackRef: 'sourceItems' });
  }

  const ledger = Array.isArray(memo?.evidenceLedger) ? memo.evidenceLedger : [];
  const ledgerIds = new Set();
  for (const entry of ledger) {
    if (typeof entry?.id !== 'string' || !entry.id) {
      errors.push(`${memoPath} evidenceLedger entry requires id`);
      continue;
    }
    if (ledgerIds.has(entry.id)) errors.push(`${memoPath} duplicates evidenceLedger id ${entry.id}`);
    ledgerIds.add(entry.id);
    const source = sources.get(entry.id);
    if (!source) {
      errors.push(`${memoPath} evidence ${entry.id} is missing from frozen source pack`);
      continue;
    }
    if (entry.sourcePackRef && entry.sourcePackRef !== source.sourcePackRef) {
      errors.push(`${memoPath} evidence ${entry.id} sourcePackRef should be ${source.sourcePackRef}`);
    }
    const available = source.availableAt ?? source.publishedAt ?? source.date;
    if (available && memo?.cutoffAt && Date.parse(available) > Date.parse(memo.cutoffAt)) {
      errors.push(`${memoPath} evidence ${entry.id} is post-cutoff (${available})`);
    }
  }

  const nestedRefs = collectEvidenceRefs(memo);
  for (const id of nestedRefs) {
    if (!ledgerIds.has(id)) errors.push(`${memoPath} evidenceRef ${id} is not declared in evidenceLedger`);
    if (!sources.has(id)) errors.push(`${memoPath} evidenceRef ${id} is missing from frozen source pack`);
  }

  return errors;
}


function classifyCompanyPriceDislocation(selected20Excess, selected60Excess) {
  if (typeof selected20Excess !== 'number' || typeof selected60Excess !== 'number') {
    throw new Error('selected20Excess and selected60Excess must be numbers');
  }
  if (selected20Excess < 0 && selected60Excess < 0) return 'de_rated';
  if (selected20Excess >= 0 && selected60Excess < 0) return 'early_turn';
  if (selected20Excess < 0 && selected60Excess >= 0) return 'late_reversal';
  return 'sustained_strength';
}

function validateOpportunityMemo(memo, memoPath, manifest) {
  const errors = [];
  if (!['1.2', '1.3', '1.4'].includes(manifest?.schemaVersion)) return errors;

  try { assertIso(memo?.cutoffAt, `${memoPath}.cutoffAt`); } catch (error) { errors.push(error.message); }
  try { assertIso(memo?.researchReadyAt, `${memoPath}.researchReadyAt`); } catch (error) { errors.push(error.message); }
  if (memo?.actionableAt !== null && memo?.actionableAt !== undefined) {
    try { assertIso(memo.actionableAt, `${memoPath}.actionableAt`); } catch (error) { errors.push(error.message); }
  }

  if (memo?.skillVersion !== manifest.skill.version) errors.push(`${memoPath} skillVersion does not match manifest`);
  if (typeof memo?.hypothesisId !== 'string' || !memo.hypothesisId) errors.push(`${memoPath} hypothesisId is required`);
  if (!manifest.trackedHypothesisStates.includes(memo?.hypothesisState)) {
    errors.push(`${memoPath} hypothesisState ${memo?.hypothesisState} is not tracked`);
  }
  if (!manifest.trackedSelectionStates.includes(memo?.selectionState)) {
    errors.push(`${memoPath} selectionState ${memo?.selectionState} is not tracked`);
  }

  const primary = manifest.primarySelectionStates.includes(memo?.selectionState);
  if (primary && !memo?.actionableAt) errors.push(`${memoPath} primary selection requires actionableAt`);
  if (!primary && memo?.actionableAt) errors.push(`${memoPath} non-primary selection must keep actionableAt null`);
  if (memo?.researchReadyAt && memo?.cutoffAt && Date.parse(memo.researchReadyAt) > Date.parse(memo.cutoffAt)) {
    errors.push(`${memoPath} researchReadyAt must not be after cutoffAt`);
  }
  if (memo?.actionableAt && memo?.researchReadyAt && Date.parse(memo.actionableAt) < Date.parse(memo.researchReadyAt)) {
    errors.push(`${memoPath} actionableAt must not be before researchReadyAt`);
  }
  if (memo?.actionableAt && memo?.cutoffAt && Date.parse(memo.actionableAt) > Date.parse(memo.cutoffAt)) {
    errors.push(`${memoPath} actionableAt must not be after cutoffAt`);
  }

  const realization = memo?.expectedRealization;
  if (!realization || ![realization.earliestTradingDays, realization.baseTradingDays, realization.latestTradingDays].every((n) => Number.isInteger(n) && n > 0)) {
    errors.push(`${memoPath} expectedRealization must define positive earliest/base/latest trading days`);
  } else if (!(realization.earliestTradingDays <= realization.baseTradingDays && realization.baseTradingDays <= realization.latestTradingDays)) {
    errors.push(`${memoPath} expectedRealization horizons must be ascending`);
  }

  const cutoffDate = memo?.cutoffAt?.slice?.(0, 10);
  if (cutoffDate && (cutoffDate < manifest.discoveryWindow.startDate || cutoffDate > manifest.discoveryWindow.endDate)) {
    errors.push(`${memoPath} cutoff date is outside discoveryWindow`);
  }

  if (memo?.selectionState === 'No selection') {
    if (memo?.selectionComparison?.selectedTicker) {
      errors.push(`${memoPath} No selection must keep selectionComparison.selectedTicker null`);
    }
    if (Array.isArray(memo?.matchedControls) && memo.matchedControls.length) {
      errors.push(`${memoPath} No selection must not freeze matchedControls`);
    }
  }

  if (['1.3', '1.4'].includes(manifest?.schemaVersion) && memo?.selectionState !== 'No selection') {
    const burden = memo?.expectationBurdenTest;
    if (!burden || typeof burden !== 'object') {
      errors.push(`${memoPath} selected company requires expectationBurdenTest`);
    } else {
      for (const field of ['valuationMethod', 'marketBaseline', 'thesisScenario', 'breakevenCondition', 'ordinaryScenarioFailure']) {
        if (typeof burden[field] !== 'string' || !burden[field].trim()) {
          errors.push(`${memoPath} expectationBurdenTest.${field} is required`);
        }
      }
      if (!Array.isArray(burden.evidenceRefs) || burden.evidenceRefs.length === 0) {
        errors.push(`${memoPath} expectationBurdenTest.evidenceRefs must be non-empty`);
      }
      if (!['room', 'tight', 'fully_priced', 'unresolved'].includes(burden.conclusion)) {
        errors.push(`${memoPath} expectationBurdenTest.conclusion is invalid`);
      }
      const primary = manifest.primarySelectionStates.includes(memo.selectionState);
      const v07ResetSubstitute = ['0.7.0', '0.8.0', '0.9.0', '1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version) &&
        memo?.expectationEvidenceStatus === 'reset_substitute' &&
        memo?.expectationResetTest?.unresolvedReason === 'measurement_gap_only' &&
        ['clear_reset', 'credible_reset'].includes(memo?.expectationResetTest?.conclusion);
      if (primary && burden.conclusion === 'fully_priced') {
        errors.push(`${memoPath} High-priority selection cannot have fully_priced expectation burden`);
      }
      if (primary && burden.conclusion === 'unresolved' && !v07ResetSubstitute) {
        errors.push(`${memoPath} High-priority selection cannot have unresolved expectation burden without a valid v0.7 reset substitute`);
      }
      if (primary && burden.conclusion === 'tight' &&
          (typeof burden.catalystOrTimingBridge !== 'string' || !burden.catalystOrTimingBridge.trim())) {
        errors.push(`${memoPath} tight High-priority selection requires catalystOrTimingBridge`);
      }
    }
  }


  if (['0.7.0', '0.8.0', '0.9.0', '1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version) && memo?.selectionState !== 'No selection') {
    const status = memo?.expectationEvidenceStatus;
    if (!['measured_burden', 'reset_substitute', 'conflicted', 'insufficient'].includes(status)) {
      errors.push(`${memoPath} expectationEvidenceStatus is invalid`);
    }

    const reset = memo?.expectationResetTest;
    if (!reset || typeof reset !== 'object') {
      errors.push(`${memoPath} selected company requires expectationResetTest in v0.7+`);
    } else {
      const componentNames = [
        'fundamentalAcceleration',
        'realizedCompanyConfirmation',
        'crossSectionalConfirmation',
        'baselineLag'
      ];
      const componentConclusions = ['clear', 'credible', 'mixed', 'insufficient'];
      for (const name of componentNames) {
        const component = reset[name];
        if (!component || typeof component !== 'object') {
          errors.push(`${memoPath} expectationResetTest.${name} is required`);
          continue;
        }
        if (!componentConclusions.includes(component.conclusion)) {
          errors.push(`${memoPath} expectationResetTest.${name}.conclusion is invalid`);
        }
        if (typeof component.rationale !== 'string' || !component.rationale.trim()) {
          errors.push(`${memoPath} expectationResetTest.${name}.rationale is required`);
        }
        if (!Array.isArray(component.evidenceRefs) || component.evidenceRefs.length === 0) {
          errors.push(`${memoPath} expectationResetTest.${name}.evidenceRefs must be non-empty`);
        }
      }

      if (reset?.baselineLag &&
          !['consensus', 'guidance', 'prior_run_rate', 'published_forecast', 'none'].includes(reset.baselineLag.baselineType)) {
        errors.push(`${memoPath} expectationResetTest.baselineLag.baselineType is invalid`);
      }

      const absorption = reset?.priceAbsorption;
      if (!absorption || typeof absorption !== 'object') {
        errors.push(`${memoPath} expectationResetTest.priceAbsorption is required`);
      } else {
        if (!['low', 'moderate', 'high', 'unresolved'].includes(absorption.risk)) {
          errors.push(`${memoPath} expectationResetTest.priceAbsorption.risk is invalid`);
        }
        if (typeof absorption.checkMethod !== 'string' || !absorption.checkMethod.trim()) {
          errors.push(`${memoPath} expectationResetTest.priceAbsorption.checkMethod is required`);
        }
        if (!Array.isArray(absorption.evidenceRefs) || absorption.evidenceRefs.length === 0) {
          errors.push(`${memoPath} expectationResetTest.priceAbsorption.evidenceRefs must be non-empty`);
        }
      }

      if (!['measurement_gap_only', 'evidence_conflict', 'missing_baseline', 'price_absorption_unresolved', 'other'].includes(reset.unresolvedReason)) {
        errors.push(`${memoPath} expectationResetTest.unresolvedReason is invalid`);
      }
      if (!['clear_reset', 'credible_reset', 'mixed', 'insufficient'].includes(reset.conclusion)) {
        errors.push(`${memoPath} expectationResetTest.conclusion is invalid`);
      }

      const primary = manifest.primarySelectionStates.includes(memo.selectionState);
      if (status === 'reset_substitute') {
        if (memo?.expectationBurdenTest?.conclusion !== 'unresolved') {
          errors.push(`${memoPath} reset_substitute is only for an unresolved conventional burden test`);
        }
        if (reset.unresolvedReason !== 'measurement_gap_only') {
          errors.push(`${memoPath} reset_substitute requires unresolvedReason measurement_gap_only`);
        }
        if (!['clear_reset', 'credible_reset'].includes(reset.conclusion)) {
          errors.push(`${memoPath} reset_substitute requires clear_reset or credible_reset`);
        }
        for (const name of componentNames) {
          if (!['clear', 'credible'].includes(reset?.[name]?.conclusion)) {
            errors.push(`${memoPath} reset_substitute requires ${name} clear or credible`);
          }
        }
        if (reset?.baselineLag?.baselineType === 'none') {
          errors.push(`${memoPath} reset_substitute requires an explicit lagging baseline`);
        }
        if (!['low', 'moderate'].includes(reset?.priceAbsorption?.risk)) {
          errors.push(`${memoPath} reset_substitute requires low or moderate priceAbsorption risk`);
        }
      }

      if (primary && ['conflicted', 'insufficient'].includes(status)) {
        errors.push(`${memoPath} High-priority selection cannot have expectationEvidenceStatus ${status}`);
      }
    }
  }

  if (['1.2.0', '1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version) && memo?.selectionState !== 'No selection') {
    const primary = manifest.primarySelectionStates.includes(memo.selectionState);
    const pathTest = memo?.expectationPathTest;

    if (!pathTest || typeof pathTest !== 'object') {
      errors.push(`${memoPath} selected company requires expectationPathTest in v1.2`);
    } else {
      const baseline = pathTest.baselinePath;
      if (!baseline || typeof baseline !== 'object') {
        errors.push(`${memoPath} expectationPathTest.baselinePath is required`);
      } else {
        if (!['published_forecast', 'consensus', 'guidance', 'prior_run_rate', 'normalized_cycle', 'other'].includes(baseline.basis)) {
          errors.push(`${memoPath} expectationPathTest.baselinePath.basis is invalid`);
        }
        for (const field of ['nearTerm', 'nextPeriod', 'laterPeriod', 'rationale']) {
          if (typeof baseline[field] !== 'string' || !baseline[field].trim()) {
            errors.push(`${memoPath} expectationPathTest.baselinePath.${field} is required`);
          }
        }
        if (!Array.isArray(baseline.evidenceRefs) || baseline.evidenceRefs.length === 0) {
          errors.push(`${memoPath} expectationPathTest.baselinePath.evidenceRefs must be non-empty`);
        }
      }

      const thesis = pathTest.thesisPath;
      if (!thesis || typeof thesis !== 'object') {
        errors.push(`${memoPath} expectationPathTest.thesisPath is required`);
      } else {
        for (const field of ['nearTermChange', 'nextPeriodChange', 'laterPeriodChange', 'mechanism']) {
          if (typeof thesis[field] !== 'string' || !thesis[field].trim()) {
            errors.push(`${memoPath} expectationPathTest.thesisPath.${field} is required`);
          }
        }
        if (!Array.isArray(thesis.evidenceRefs) || thesis.evidenceRefs.length === 0) {
          errors.push(`${memoPath} expectationPathTest.thesisPath.evidenceRefs must be non-empty`);
        }
      }

      if (!['long_duration_growth', 'peak_cycle_decline', 'stable_compound', 'turnaround', 'uncertain'].includes(pathTest.pathShape)) {
        errors.push(`${memoPath} expectationPathTest.pathShape is invalid`);
      }

      const incremental = pathTest.incrementalPathAdvantage;
      if (!incremental || !['clear', 'credible', 'mixed', 'insufficient'].includes(incremental.conclusion)) {
        errors.push(`${memoPath} expectationPathTest.incrementalPathAdvantage.conclusion is invalid`);
      } else {
        if (typeof incremental.rationale !== 'string' || !incremental.rationale.trim()) {
          errors.push(`${memoPath} expectationPathTest.incrementalPathAdvantage.rationale is required`);
        }
        if (!Array.isArray(incremental.evidenceRefs) || incremental.evidenceRefs.length === 0) {
          errors.push(`${memoPath} expectationPathTest.incrementalPathAdvantage.evidenceRefs must be non-empty`);
        }
      }

      const duration = pathTest.durationRisk;
      if (!duration || !['low', 'moderate', 'high', 'unresolved'].includes(duration.conclusion)) {
        errors.push(`${memoPath} expectationPathTest.durationRisk.conclusion is invalid`);
      } else {
        if (typeof duration.rationale !== 'string' || !duration.rationale.trim()) {
          errors.push(`${memoPath} expectationPathTest.durationRisk.rationale is required`);
        }
        if (!Array.isArray(duration.evidenceRefs) || duration.evidenceRefs.length === 0) {
          errors.push(`${memoPath} expectationPathTest.durationRisk.evidenceRefs must be non-empty`);
        }
      }

      if (typeof pathTest.falsifier !== 'string' || !pathTest.falsifier.trim()) {
        errors.push(`${memoPath} expectationPathTest.falsifier is required`);
      }
      if (!['clear_path_room', 'credible_path_room', 'mixed', 'insufficient'].includes(pathTest.overallConclusion)) {
        errors.push(`${memoPath} expectationPathTest.overallConclusion is invalid`);
      }

      if (primary) {
        const v15BaseHorizonRoute =
          ['1.5.0', '1.6.0'].includes(manifest?.skill?.version) &&
          memo?.timingRoute === 'base_horizon_convexity';
        if (!['clear', 'credible'].includes(incremental?.conclusion)) {
          errors.push(`${memoPath} High-priority selection requires clear/credible incremental earnings-path advantage`);
        }
        if (!v15BaseHorizonRoute && !['low', 'moderate'].includes(duration?.conclusion)) {
          errors.push(`${memoPath} High-priority selection requires low/moderate expectation-duration risk outside base_horizon_convexity`);
        }
        if (v15BaseHorizonRoute && !['low', 'moderate', 'high'].includes(duration?.conclusion)) {
          errors.push(`${memoPath} base_horizon_convexity cannot have unresolved expectation-duration risk`);
        }
        if (!v15BaseHorizonRoute && !['clear_path_room', 'credible_path_room'].includes(pathTest.overallConclusion)) {
          errors.push(`${memoPath} High-priority selection requires clear/credible expectation-path room outside base_horizon_convexity`);
        }
        if (v15BaseHorizonRoute && !['clear_path_room', 'credible_path_room', 'mixed'].includes(pathTest.overallConclusion)) {
          errors.push(`${memoPath} base_horizon_convexity requires at least a resolved mixed expectation path`);
        }
      }
    }
  }


  if (['1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version) && memo?.selectionState !== 'No selection') {
    const archetypes = [
      'ordinary_growth_compounder',
      'cyclical_growth_hybrid',
      'deep_cycle_turnaround',
      'durable_cash_yield',
      'other'
    ];
    if (!archetypes.includes(memo?.equityReturnArchetype)) {
      errors.push(`${memoPath} equityReturnArchetype is required in v1.3`);
    }

    const expressions = Array.isArray(memo?.acceptableExpressionSet) ? memo.acceptableExpressionSet : [];
    if (expressions.length < 1 || expressions.length > 3) {
      errors.push(`${memoPath} v1.3 requires 1-3 acceptableExpressionSet entries`);
    } else {
      const seen = new Set();
      let preferredCount = 0;
      for (const expression of expressions) {
        if (typeof expression?.ticker !== 'string' || !expression.ticker) {
          errors.push(`${memoPath} acceptable expression requires ticker`);
          continue;
        }
        if (seen.has(expression.ticker)) errors.push(`${memoPath} duplicates acceptable expression ${expression.ticker}`);
        seen.add(expression.ticker);
        if (!['preferred', 'acceptable'].includes(expression?.role)) {
          errors.push(`${memoPath} acceptable expression ${expression.ticker} role is invalid`);
        }
        if (expression?.role === 'preferred') preferredCount += 1;
        for (const field of ['directExposure', 'earningsConversion', 'expectationFit', 'downsideContainment']) {
          if (!['clear', 'credible', 'mixed', 'insufficient'].includes(expression?.[field])) {
            errors.push(`${memoPath} acceptable expression ${expression.ticker} ${field} is invalid`);
          }
        }
        if (!['pass', 'borderline', 'fail', 'unresolved'].includes(expression?.balanceSheetOrSurvival)) {
          errors.push(`${memoPath} acceptable expression ${expression.ticker} balanceSheetOrSurvival is invalid`);
        }
        if (!['acceptable', 'borderline', 'reject'].includes(expression?.conclusion)) {
          errors.push(`${memoPath} acceptable expression ${expression.ticker} conclusion is invalid`);
        }
        if (typeof expression?.rationale !== 'string' || !expression.rationale.trim()) {
          errors.push(`${memoPath} acceptable expression ${expression.ticker} rationale is required`);
        }
        if (!Array.isArray(expression?.evidenceRefs) || expression.evidenceRefs.length === 0) {
          errors.push(`${memoPath} acceptable expression ${expression.ticker} evidenceRefs must be non-empty`);
        }
      }
      if (preferredCount > 1) errors.push(`${memoPath} acceptableExpressionSet may contain at most one preferred expression`);
      const preferredTicker = expressions.find((x) => x?.role === 'preferred')?.ticker ?? null;
      if (preferredTicker && memo?.selectionComparison?.selectedTicker !== preferredTicker) {
        errors.push(`${memoPath} selectionComparison.selectedTicker must match preferred acceptable expression`);
      }

      const primary = manifest.primarySelectionStates.includes(memo.selectionState);
      if (primary) {
        const acceptableCount = expressions.filter((x) => x?.conclusion === 'acceptable').length;
        if (acceptableCount < 1) {
          errors.push(`${memoPath} High-priority opportunity requires at least one acceptable expression`);
        }
        for (const expression of expressions.filter((x) => x?.conclusion === 'acceptable')) {
          if (!['clear', 'credible'].includes(expression.directExposure)) {
            errors.push(`${memoPath} High-priority acceptable expression ${expression.ticker} requires clear/credible directExposure`);
          }
          if (!['clear', 'credible'].includes(expression.earningsConversion)) {
            errors.push(`${memoPath} High-priority acceptable expression ${expression.ticker} requires clear/credible earningsConversion`);
          }
          if (!['pass', 'borderline'].includes(expression.balanceSheetOrSurvival)) {
            errors.push(`${memoPath} High-priority acceptable expression ${expression.ticker} requires pass/borderline balance sheet or survival`);
          }
          if (!['clear', 'credible'].includes(expression.expectationFit)) {
            errors.push(`${memoPath} High-priority acceptable expression ${expression.ticker} requires clear/credible expectationFit`);
          }
          if (!['clear', 'credible'].includes(expression.downsideContainment)) {
            errors.push(`${memoPath} High-priority acceptable expression ${expression.ticker} requires clear/credible downsideContainment`);
          }
        }
      }
    }
  }


  if (['1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version)) {
    const decomposition = memo?.hypothesisDecompositionTest;
    if (!decomposition || typeof decomposition !== 'object') {
      errors.push(`${memoPath} v1.4 requires hypothesisDecompositionTest`);
    } else {
      if (!['single_product_market', 'multi_product_split', 'company_specific_divergence', 'aggregate_sector', 'other'].includes(decomposition.unitOfAnalysis)) {
        errors.push(`${memoPath} hypothesisDecompositionTest.unitOfAnalysis is invalid`);
      }
      for (const field of ['productMarketScope', 'geographicScope', 'customerScope', 'rationale']) {
        if (typeof decomposition[field] !== 'string' || !decomposition[field].trim()) {
          errors.push(`${memoPath} hypothesisDecompositionTest.${field} is required`);
        }
      }
      if (typeof decomposition.decompositionNeeded !== 'boolean') {
        errors.push(`${memoPath} hypothesisDecompositionTest.decompositionNeeded must be boolean`);
      }
      if (!Array.isArray(decomposition.siblingHypothesisIds) ||
          decomposition.siblingHypothesisIds.some((x) => typeof x !== 'string' || !x.trim())) {
        errors.push(`${memoPath} hypothesisDecompositionTest.siblingHypothesisIds must be a string array`);
      }
      if (!Array.isArray(decomposition.evidenceRefs) || decomposition.evidenceRefs.length === 0) {
        errors.push(`${memoPath} hypothesisDecompositionTest.evidenceRefs must be non-empty`);
      }
      if (!['well_scoped', 'split_required', 'unresolved'].includes(decomposition.conclusion)) {
        errors.push(`${memoPath} hypothesisDecompositionTest.conclusion is invalid`);
      }
      if (decomposition.decompositionNeeded && decomposition.conclusion !== 'split_required') {
        errors.push(`${memoPath} hypothesisDecompositionTest decompositionNeeded requires split_required`);
      }
      if (!decomposition.decompositionNeeded && decomposition.conclusion === 'split_required') {
        errors.push(`${memoPath} hypothesisDecompositionTest split_required requires decompositionNeeded`);
      }
      if (memo?.selectionState !== 'No selection' && decomposition.conclusion !== 'well_scoped') {
        errors.push(`${memoPath} selected v1.4 memo must be well_scoped before selection`);
      }
    }

    const matrix = memo?.evidenceHorizonMatrix;
    if (!matrix || typeof matrix !== 'object') {
      errors.push(`${memoPath} v1.4 requires evidenceHorizonMatrix`);
    } else {
      for (const name of ['nearTerm', 'mediumTerm', 'structural']) {
        const row = matrix[name];
        if (!row || typeof row !== 'object') {
          errors.push(`${memoPath} evidenceHorizonMatrix.${name} is required`);
          continue;
        }
        if (!['positive', 'negative', 'mixed', 'unresolved'].includes(row.direction)) {
          errors.push(`${memoPath} evidenceHorizonMatrix.${name}.direction is invalid`);
        }
        for (const field of ['driver', 'horizon']) {
          if (typeof row[field] !== 'string' || !row[field].trim()) {
            errors.push(`${memoPath} evidenceHorizonMatrix.${name}.${field} is required`);
          }
        }
        if (!Array.isArray(row.evidenceRefs) || row.evidenceRefs.length === 0) {
          errors.push(`${memoPath} evidenceHorizonMatrix.${name}.evidenceRefs must be non-empty`);
        }
      }
      if (!['none', 'aligned', 'time_horizon_conflict', 'company_sector_conflict', 'multi_axis_conflict', 'unresolved'].includes(matrix.conflictType)) {
        errors.push(`${memoPath} evidenceHorizonMatrix.conflictType is invalid`);
      }
      if (typeof matrix.resolutionRule !== 'string' || !matrix.resolutionRule.trim()) {
        errors.push(`${memoPath} evidenceHorizonMatrix.resolutionRule is required`);
      }
      if (!['coherent', 'decomposed', 'unresolved'].includes(matrix.conclusion)) {
        errors.push(`${memoPath} evidenceHorizonMatrix.conclusion is invalid`);
      }
      if (memo?.selectionState !== 'No selection' && matrix.conclusion === 'unresolved') {
        errors.push(`${memoPath} selected v1.4 memo cannot keep evidence-horizon conflict unresolved`);
      }
    }

    const divergence = memo?.leaderDivergenceTest;
    if (!divergence || typeof divergence !== 'object') {
      errors.push(`${memoPath} v1.4 requires leaderDivergenceTest`);
    } else {
      if (!['positive', 'negative', 'mixed', 'unresolved'].includes(divergence.sectorSignal)) {
        errors.push(`${memoPath} leaderDivergenceTest.sectorSignal is invalid`);
      }
      if (!['positive', 'negative', 'mixed', 'unresolved'].includes(divergence.companySignal)) {
        errors.push(`${memoPath} leaderDivergenceTest.companySignal is invalid`);
      }
      if (!['none', 'leader_outperforming_sector', 'leader_underperforming_sector', 'unresolved'].includes(divergence.divergence)) {
        errors.push(`${memoPath} leaderDivergenceTest.divergence is invalid`);
      }
      if (!['clear', 'credible', 'mixed', 'insufficient'].includes(divergence.companyEvidenceConclusion)) {
        errors.push(`${memoPath} leaderDivergenceTest.companyEvidenceConclusion is invalid`);
      }
      if (typeof divergence.rationale !== 'string' || !divergence.rationale.trim()) {
        errors.push(`${memoPath} leaderDivergenceTest.rationale is required`);
      }
      if (!Array.isArray(divergence.evidenceRefs) || divergence.evidenceRefs.length === 0) {
        errors.push(`${memoPath} leaderDivergenceTest.evidenceRefs must be non-empty`);
      }
    }

    if (memo?.selectionState !== 'No selection') {
      const continuation = memo?.highAbsorptionContinuationTest;
      if (!continuation || typeof continuation !== 'object') {
        errors.push(`${memoPath} selected v1.4 memo requires highAbsorptionContinuationTest`);
      } else {
        if (typeof continuation.applicable !== 'boolean') {
          errors.push(`${memoPath} highAbsorptionContinuationTest.applicable must be boolean`);
        }
        if (!['low', 'moderate', 'high', 'extreme', 'unresolved'].includes(continuation.absorptionState)) {
          errors.push(`${memoPath} highAbsorptionContinuationTest.absorptionState is invalid`);
        }
        const compNames = ['freshIncrementalDriver', 'realizedEarningsSupport', 'revisionVelocity', 'durationMechanism'];
        for (const name of compNames) {
          const component = continuation[name];
          if (!component || typeof component !== 'object' ||
              !['clear', 'credible', 'mixed', 'insufficient'].includes(component.conclusion)) {
            errors.push(`${memoPath} highAbsorptionContinuationTest.${name}.conclusion is invalid`);
            continue;
          }
          if (typeof component.rationale !== 'string' || !component.rationale.trim()) {
            errors.push(`${memoPath} highAbsorptionContinuationTest.${name}.rationale is required`);
          }
          if (!Array.isArray(component.evidenceRefs) || component.evidenceRefs.length === 0) {
            errors.push(`${memoPath} highAbsorptionContinuationTest.${name}.evidenceRefs must be non-empty`);
          }
        }
        if (!['low', 'moderate', 'high', 'unresolved'].includes(continuation.narrativeRepetitionRisk)) {
          errors.push(`${memoPath} highAbsorptionContinuationTest.narrativeRepetitionRisk is invalid`);
        }
        if (typeof continuation.falsifier !== 'string' || !continuation.falsifier.trim()) {
          errors.push(`${memoPath} highAbsorptionContinuationTest.falsifier is required`);
        }
        if (!['credible_continuation', 'mixed', 'confirmation_only', 'insufficient', 'not_applicable'].includes(continuation.conclusion)) {
          errors.push(`${memoPath} highAbsorptionContinuationTest.conclusion is invalid`);
        }
        if (!continuation.applicable && continuation.conclusion !== 'not_applicable') {
          errors.push(`${memoPath} non-applicable highAbsorptionContinuationTest must conclude not_applicable`);
        }
        if (continuation.applicable && continuation.conclusion === 'not_applicable') {
          errors.push(`${memoPath} applicable highAbsorptionContinuationTest cannot conclude not_applicable`);
        }
      }

      const purity = memo?.expressionPurityTest;
      if (!purity || typeof purity !== 'object') {
        errors.push(`${memoPath} selected v1.4 memo requires expressionPurityTest`);
      } else {
        if (purity.preferredTicker !== memo?.selectionComparison?.selectedTicker) {
          errors.push(`${memoPath} expressionPurityTest.preferredTicker must match selectionComparison.selectedTicker`);
        }
        if (purity.purestTicker !== null && purity.purestTicker !== undefined &&
            (typeof purity.purestTicker !== 'string' || !purity.purestTicker.trim())) {
          errors.push(`${memoPath} expressionPurityTest.purestTicker must be string or null`);
        }
        if (typeof purity.purityIsDecisionDriver !== 'boolean') {
          errors.push(`${memoPath} expressionPurityTest.purityIsDecisionDriver must be boolean`);
        }
        for (const field of ['expectationBurdenComparison', 'earningsQualityComparison', 'downsideComparison']) {
          if (typeof purity[field] !== 'string' || !purity[field].trim()) {
            errors.push(`${memoPath} expressionPurityTest.${field} is required`);
          }
        }
        if (!Array.isArray(purity.evidenceRefs) || purity.evidenceRefs.length === 0) {
          errors.push(`${memoPath} expressionPurityTest.evidenceRefs must be non-empty`);
        }
        if (!['balanced', 'purity_bias_risk', 'insufficient'].includes(purity.conclusion)) {
          errors.push(`${memoPath} expressionPurityTest.conclusion is invalid`);
        }
      }
    }
  }


  if (['0.8.0', '0.9.0', '1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version) && memo?.selectionState !== 'No selection') {
    const primary = manifest.primarySelectionStates.includes(memo.selectionState);
    const timing = memo?.opportunityTimingTest;
    if (!timing || typeof timing !== 'object') {
      errors.push(`${memoPath} selected company requires opportunityTimingTest in v0.8`);
    } else {
      const pr = timing.priceRegime;
      if (!pr || typeof pr !== 'object') {
        errors.push(`${memoPath} opportunityTimingTest.priceRegime is required`);
      } else {
        if (typeof pr.method !== 'string' || !pr.method.trim()) {
          errors.push(`${memoPath} opportunityTimingTest.priceRegime.method is required`);
        }
        for (const field of ['lookback20Excess', 'lookback60Excess']) {
          if (pr[field] !== null && pr[field] !== undefined && typeof pr[field] !== 'number') {
            errors.push(`${memoPath} opportunityTimingTest.priceRegime.${field} must be number or null`);
          }
        }
        for (const field of ['positiveBreadth20', 'positiveBreadth60']) {
          if (pr[field] !== null && pr[field] !== undefined &&
              !(typeof pr[field] === 'number' && pr[field] >= 0 && pr[field] <= 1)) {
            errors.push(`${memoPath} opportunityTimingTest.priceRegime.${field} must be in [0,1] or null`);
          }
        }
        if (!['favorable', 'neutral', 'adverse', 'unresolved'].includes(pr.conclusion)) {
          errors.push(`${memoPath} opportunityTimingTest.priceRegime.conclusion is invalid`);
        }
        if (!Array.isArray(pr.evidenceRefs) || pr.evidenceRefs.length === 0) {
          errors.push(`${memoPath} opportunityTimingTest.priceRegime.evidenceRefs must be non-empty`);
        }
        const numeric = [pr.lookback20Excess, pr.lookback60Excess, pr.positiveBreadth20, pr.positiveBreadth60]
          .every((x) => typeof x === 'number');
        if (numeric) {
          const mechanicallyFavorable =
            pr.lookback20Excess >= 0 && pr.lookback60Excess >= 0 &&
            pr.positiveBreadth20 >= 0.5 && pr.positiveBreadth60 >= 0.5;
          const mechanicallyAdverse =
            pr.lookback20Excess < 0 && pr.lookback60Excess < 0 &&
            pr.positiveBreadth20 < 0.5 && pr.positiveBreadth60 < 0.5;
          if (pr.conclusion === 'favorable' && !mechanicallyFavorable) {
            errors.push(`${memoPath} favorable priceRegime is inconsistent with frozen 20/60d relative-return breadth`);
          }
          if (pr.conclusion === 'adverse' && !mechanicallyAdverse) {
            errors.push(`${memoPath} adverse priceRegime is inconsistent with frozen 20/60d relative-return breadth`);
          }
        }
      }

      const enumComponents = [
        ['fundamentalImpulse', ['accelerating', 'persistent', 'plateauing', 'reversing', 'unresolved']],
        ['earningsRevisionBreadth', ['broad_positive', 'narrow_positive', 'mixed', 'negative', 'unresolved']],
        ['eventHalfLife', ['structural', 'multi_quarter', 'short_lived', 'uncertain']],
        ['lateCycleRisk', ['low', 'moderate', 'high', 'unresolved']]
      ];
      for (const [name, allowed] of enumComponents) {
        const component = timing[name];
        if (!component || typeof component !== 'object') {
          errors.push(`${memoPath} opportunityTimingTest.${name} is required`);
          continue;
        }
        if (!allowed.includes(component.conclusion)) {
          errors.push(`${memoPath} opportunityTimingTest.${name}.conclusion is invalid`);
        }
        if (typeof component.rationale !== 'string' || !component.rationale.trim()) {
          errors.push(`${memoPath} opportunityTimingTest.${name}.rationale is required`);
        }
        if (!Array.isArray(component.evidenceRefs) || component.evidenceRefs.length === 0) {
          errors.push(`${memoPath} opportunityTimingTest.${name}.evidenceRefs must be non-empty`);
        }
      }
      if (!['favorable', 'neutral', 'adverse', 'unresolved'].includes(timing.overallConclusion)) {
        errors.push(`${memoPath} opportunityTimingTest.overallConclusion is invalid`);
      }
      if (typeof timing.rationale !== 'string' || !timing.rationale.trim()) {
        errors.push(`${memoPath} opportunityTimingTest.rationale is required`);
      }

      if (primary) {
        const v10EngineOverride =
          ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version) &&
          memo?.timingRoute === 'company_engine_override';
        const v15BaseHorizonRoute =
          ['1.5.0', '1.6.0'].includes(manifest?.skill?.version) &&
          memo?.timingRoute === 'base_horizon_convexity';

        if (!v10EngineOverride && !v15BaseHorizonRoute) {
          if (timing.overallConclusion !== 'favorable') {
            errors.push(`${memoPath} High-priority selection requires favorable opportunity timing unless a valid override route is used`);
          }
          if (timing?.priceRegime?.conclusion !== 'favorable') {
            errors.push(`${memoPath} High-priority selection requires favorable pre-cutoff industry price regime unless a valid override route is used`);
          }
        }
        if (v15BaseHorizonRoute &&
            !['favorable', 'neutral'].includes(timing?.priceRegime?.conclusion)) {
          errors.push(`${memoPath} base_horizon_convexity requires favorable or neutral broad price regime`);
        }
        if (v15BaseHorizonRoute &&
            !['favorable', 'neutral'].includes(timing?.overallConclusion)) {
          errors.push(`${memoPath} base_horizon_convexity requires favorable or neutral opportunity timing`);
        }
        if (!['accelerating', 'persistent'].includes(timing?.fundamentalImpulse?.conclusion)) {
          errors.push(`${memoPath} High-priority selection requires accelerating or persistent fundamental impulse`);
        }
        if (!v10EngineOverride &&
            !['broad_positive', 'narrow_positive'].includes(timing?.earningsRevisionBreadth?.conclusion)) {
          errors.push(`${memoPath} High-priority non-company-engine selection requires positive earnings-revision breadth`);
        }
        if (v10EngineOverride &&
            !['broad_positive', 'narrow_positive', 'mixed'].includes(timing?.earningsRevisionBreadth?.conclusion)) {
          errors.push(`${memoPath} High-priority company-engine override cannot have negative/unresolved earnings-revision breadth`);
        }
        if (!v10EngineOverride && !v15BaseHorizonRoute &&
            !['structural', 'multi_quarter'].includes(timing?.eventHalfLife?.conclusion)) {
          errors.push(`${memoPath} High-priority sector-confirmed selection requires structural or multi-quarter event half-life`);
        }
        if (v15BaseHorizonRoute &&
            !['structural', 'multi_quarter', 'short_lived'].includes(timing?.eventHalfLife?.conclusion)) {
          errors.push(`${memoPath} base_horizon_convexity cannot use uncertain event half-life`);
        }
        if (!v15BaseHorizonRoute && !['low', 'moderate'].includes(timing?.lateCycleRisk?.conclusion)) {
          errors.push(`${memoPath} High-priority selection cannot have high/unresolved late-cycle risk outside base_horizon_convexity`);
        }
        if (v15BaseHorizonRoute && !['low', 'moderate', 'high'].includes(timing?.lateCycleRisk?.conclusion)) {
          errors.push(`${memoPath} base_horizon_convexity cannot have unresolved late-cycle risk`);
        }
      }
    }

    const asym = memo?.crossSectionalAsymmetryTest;
    if (!asym || typeof asym !== 'object') {
      errors.push(`${memoPath} selected company requires crossSectionalAsymmetryTest in v0.8`);
    } else {
      if (asym.selectedTicker !== memo?.selectionComparison?.selectedTicker) {
        errors.push(`${memoPath} crossSectionalAsymmetryTest.selectedTicker must match selectionComparison.selectedTicker`);
      }
      const q = asym.qualityFloor;
      if (!q || !['pass', 'borderline', 'fail', 'unresolved'].includes(q.conclusion)) {
        errors.push(`${memoPath} crossSectionalAsymmetryTest.qualityFloor.conclusion is invalid`);
      }
      if (q) {
        if (typeof q.rationale !== 'string' || !q.rationale.trim()) {
          errors.push(`${memoPath} crossSectionalAsymmetryTest.qualityFloor.rationale is required`);
        }
        if (!Array.isArray(q.evidenceRefs) || q.evidenceRefs.length === 0) {
          errors.push(`${memoPath} crossSectionalAsymmetryTest.qualityFloor.evidenceRefs must be non-empty`);
        }
      }

      const asymComponents = [
        ['revisionHeadroom', ['clear', 'credible', 'mixed', 'insufficient']],
        ['valuationSlack', ['room', 'tight', 'none', 'unresolved']],
        ['catalystReachability', ['clear', 'credible', 'mixed', 'insufficient']],
        ['downsideContainment', ['clear', 'credible', 'mixed', 'insufficient']]
      ];
      for (const [name, allowed] of asymComponents) {
        const component = asym[name];
        if (!component || typeof component !== 'object') {
          errors.push(`${memoPath} crossSectionalAsymmetryTest.${name} is required`);
          continue;
        }
        if (!allowed.includes(component.conclusion)) {
          errors.push(`${memoPath} crossSectionalAsymmetryTest.${name}.conclusion is invalid`);
        }
        if (typeof component.rationale !== 'string' || !component.rationale.trim()) {
          errors.push(`${memoPath} crossSectionalAsymmetryTest.${name}.rationale is required`);
        }
        if (!Array.isArray(component.evidenceRefs) || component.evidenceRefs.length === 0) {
          errors.push(`${memoPath} crossSectionalAsymmetryTest.${name}.evidenceRefs must be non-empty`);
        }
      }

      const controls = new Set((memo?.matchedControls ?? []).map((c) => c?.ticker).filter(Boolean));
      const pairs = Array.isArray(asym.pairwise) ? asym.pairwise : [];
      const pairTickers = new Set();
      for (const pair of pairs) {
        if (!controls.has(pair?.controlTicker)) {
          errors.push(`${memoPath} asymmetry pairwise references non-control ${pair?.controlTicker ?? 'unknown'}`);
        }
        if (pair?.controlTicker) {
          if (pairTickers.has(pair.controlTicker)) errors.push(`${memoPath} duplicates asymmetry control ${pair.controlTicker}`);
          pairTickers.add(pair.controlTicker);
        }
        for (const field of ['revisionAdvantage', 'valuationAdvantage', 'qualityTradeoff', 'catalystAdvantage', 'downsideTradeoff', 'switchCondition']) {
          if (typeof pair?.[field] !== 'string' || !pair[field].trim()) {
            errors.push(`${memoPath} asymmetry pairwise ${pair?.controlTicker ?? 'unknown'} requires ${field}`);
          }
        }
        if (!Array.isArray(pair?.evidenceRefs) || pair.evidenceRefs.length === 0) {
          errors.push(`${memoPath} asymmetry pairwise ${pair?.controlTicker ?? 'unknown'} requires evidenceRefs`);
        }
        if (!['selected', 'control', 'mixed', 'insufficient'].includes(pair?.netAsymmetry)) {
          errors.push(`${memoPath} asymmetry pairwise ${pair?.controlTicker ?? 'unknown'} netAsymmetry is invalid`);
        }
      }
      if (controls.size && pairs.length !== controls.size) {
        errors.push(`${memoPath} requires one asymmetry pairwise comparison per matched control`);
      }
      if (!['clear_asymmetry', 'credible_asymmetry', 'mixed', 'insufficient'].includes(asym.overallConclusion)) {
        errors.push(`${memoPath} crossSectionalAsymmetryTest.overallConclusion is invalid`);
      }

      if (primary) {
        const v09TurningPoint = ['0.9.0', '1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version) &&
          memo?.expressionArchetype === 'turning_point_convexity';
        if (!v09TurningPoint && q?.conclusion !== 'pass') {
          errors.push(`${memoPath} High-priority quality/revision selection requires qualityFloor pass`);
        }
        if (!['clear', 'credible'].includes(asym?.revisionHeadroom?.conclusion)) {
          errors.push(`${memoPath} High-priority selection requires clear/credible revision headroom`);
        }
        if (!['room', 'tight'].includes(asym?.valuationSlack?.conclusion)) {
          errors.push(`${memoPath} High-priority selection requires valuation slack`);
        }
        if (!['clear', 'credible'].includes(asym?.catalystReachability?.conclusion)) {
          errors.push(`${memoPath} High-priority selection requires reachable catalyst`);
        }
        if (!['clear', 'credible'].includes(asym?.downsideContainment?.conclusion)) {
          errors.push(`${memoPath} High-priority selection requires downside containment`);
        }
        if (['1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version)) {
          if (!['clear_asymmetry', 'credible_asymmetry', 'mixed'].includes(asym.overallConclusion)) {
            errors.push(`${memoPath} High-priority opportunity requires non-insufficient cross-sectional evidence`);
          }
          if (pairs.some((pair) => ['control', 'insufficient'].includes(pair?.netAsymmetry))) {
            errors.push(`${memoPath} High-priority acceptable expression cannot be clearly inferior or insufficient versus a frozen control`);
          }
        } else {
          if (!['clear_asymmetry', 'credible_asymmetry'].includes(asym.overallConclusion)) {
            errors.push(`${memoPath} High-priority selection requires clear/credible cross-sectional asymmetry`);
          }
          if (pairs.some((pair) => pair?.netAsymmetry !== 'selected')) {
            errors.push(`${memoPath} High-priority selection must beat every frozen control on net asymmetry`);
          }
        }
      }
    }
  }

  if (['0.9.0', '1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version) && memo?.selectionState !== 'No selection') {
    const primary = manifest.primarySelectionStates.includes(memo.selectionState);

    if (!['quality_revision', 'turning_point_convexity'].includes(memo?.expressionArchetype)) {
      errors.push(`${memoPath} expressionArchetype must be quality_revision or turning_point_convexity`);
    }

    const bridge = memo?.earningsConversionBridge;
    if (!bridge || typeof bridge !== 'object') {
      errors.push(`${memoPath} selected company requires earningsConversionBridge in v0.9`);
    } else {
      if (!['price', 'volume', 'mix', 'order_backlog', 'cost', 'yield', 'utilization', 'market_share', 'other'].includes(bridge.driverType)) {
        errors.push(`${memoPath} earningsConversionBridge.driverType is invalid`);
      }
      for (const field of ['driverChange', 'earningsMechanism', 'nextObservableMetric', 'failureCondition']) {
        if (typeof bridge[field] !== 'string' || !bridge[field].trim()) {
          errors.push(`${memoPath} earningsConversionBridge.${field} is required`);
        }
      }
      if (!Number.isInteger(bridge.realizationWindowTradingDays) || bridge.realizationWindowTradingDays < 1) {
        errors.push(`${memoPath} earningsConversionBridge.realizationWindowTradingDays must be a positive integer`);
      }
      if (!['realized', 'quantitatively_bridged', 'proxy_only', 'speculative'].includes(bridge.status)) {
        errors.push(`${memoPath} earningsConversionBridge.status is invalid`);
      }
      if (!Array.isArray(bridge.evidenceRefs) || bridge.evidenceRefs.length === 0) {
        errors.push(`${memoPath} earningsConversionBridge.evidenceRefs must be non-empty`);
      }
      if (primary && !['realized', 'quantitatively_bridged'].includes(bridge.status)) {
        errors.push(`${memoPath} High-priority selection requires realized or quantitatively_bridged earnings conversion`);
      }
      if (primary && Number.isInteger(bridge.realizationWindowTradingDays) &&
          bridge.realizationWindowTradingDays > memo?.expectedRealization?.baseTradingDays) {
        errors.push(`${memoPath} High-priority earnings conversion must be observable by the base thesis horizon`);
      }
    }

    const validity = memo?.decisionValidityTradingDays;
    if (!Number.isInteger(validity) || validity < 1) {
      errors.push(`${memoPath} decisionValidityTradingDays must be a positive integer in v0.9`);
    } else if (validity !== memo?.expectedRealization?.baseTradingDays) {
      errors.push(`${memoPath} decisionValidityTradingDays must equal expectedRealization.baseTradingDays`);
    }

    if (memo?.expressionArchetype === 'turning_point_convexity') {
      const turn = memo?.turningPointConvexityTest;
      if (!turn || typeof turn !== 'object') {
        errors.push(`${memoPath} turning_point_convexity requires turningPointConvexityTest`);
      } else {
        const survival = turn.survivalFloor;
        if (!survival || !['pass', 'borderline', 'fail', 'unresolved'].includes(survival.conclusion)) {
          errors.push(`${memoPath} turningPointConvexityTest.survivalFloor.conclusion is invalid`);
        }
        if (survival) {
          if (typeof survival.rationale !== 'string' || !survival.rationale.trim()) {
            errors.push(`${memoPath} turningPointConvexityTest.survivalFloor.rationale is required`);
          }
          if (!Array.isArray(survival.evidenceRefs) || survival.evidenceRefs.length === 0) {
            errors.push(`${memoPath} turningPointConvexityTest.survivalFloor.evidenceRefs must be non-empty`);
          }
        }

        for (const name of ['inflectionEvidence', 'operatingLeverage']) {
          const component = turn[name];
          if (!component || !['clear', 'credible', 'mixed', 'insufficient'].includes(component.conclusion)) {
            errors.push(`${memoPath} turningPointConvexityTest.${name}.conclusion is invalid`);
            continue;
          }
          if (typeof component.rationale !== 'string' || !component.rationale.trim()) {
            errors.push(`${memoPath} turningPointConvexityTest.${name}.rationale is required`);
          }
          if (!Array.isArray(component.evidenceRefs) || component.evidenceRefs.length === 0) {
            errors.push(`${memoPath} turningPointConvexityTest.${name}.evidenceRefs must be non-empty`);
          }
        }

        const wc = turn.workingCapitalRisk;
        if (!wc || !['low', 'moderate', 'high', 'unresolved'].includes(wc.conclusion)) {
          errors.push(`${memoPath} turningPointConvexityTest.workingCapitalRisk.conclusion is invalid`);
        }
        if (wc) {
          if (typeof wc.rationale !== 'string' || !wc.rationale.trim()) {
            errors.push(`${memoPath} turningPointConvexityTest.workingCapitalRisk.rationale is required`);
          }
          if (!Array.isArray(wc.evidenceRefs) || wc.evidenceRefs.length === 0) {
            errors.push(`${memoPath} turningPointConvexityTest.workingCapitalRisk.evidenceRefs must be non-empty`);
          }
        }

        if (typeof turn.downsideFailure !== 'string' || !turn.downsideFailure.trim()) {
          errors.push(`${memoPath} turningPointConvexityTest.downsideFailure is required`);
        }
        if (!Array.isArray(turn.evidenceRefs) || turn.evidenceRefs.length === 0) {
          errors.push(`${memoPath} turningPointConvexityTest.evidenceRefs must be non-empty`);
        }
        if (!['clear_convexity', 'credible_convexity', 'mixed', 'insufficient'].includes(turn.overallConclusion)) {
          errors.push(`${memoPath} turningPointConvexityTest.overallConclusion is invalid`);
        }

        if (primary) {
          if (survival?.conclusion !== 'pass') {
            errors.push(`${memoPath} High-priority turning-point selection requires survivalFloor pass`);
          }
          if (!['clear', 'credible'].includes(turn?.inflectionEvidence?.conclusion)) {
            errors.push(`${memoPath} High-priority turning-point selection requires clear/credible inflection evidence`);
          }
          if (!['clear', 'credible'].includes(turn?.operatingLeverage?.conclusion)) {
            errors.push(`${memoPath} High-priority turning-point selection requires clear/credible operating leverage`);
          }
          if (!['low', 'moderate'].includes(wc?.conclusion)) {
            errors.push(`${memoPath} High-priority turning-point selection requires low/moderate working-capital risk`);
          }
          if (!['clear_convexity', 'credible_convexity'].includes(turn.overallConclusion)) {
            errors.push(`${memoPath} High-priority turning-point selection requires clear/credible convexity`);
          }
        }
      }
    } else if (memo?.expressionArchetype === 'quality_revision') {
      if (primary && memo?.crossSectionalAsymmetryTest?.qualityFloor?.conclusion !== 'pass') {
        errors.push(`${memoPath} High-priority quality_revision selection requires qualityFloor pass`);
      }
      if (memo?.turningPointConvexityTest && memo.turningPointConvexityTest.overallConclusion &&
          memo.turningPointConvexityTest.overallConclusion !== 'not_applicable') {
        errors.push(`${memoPath} quality_revision selection must keep turningPointConvexityTest not_applicable`);
      }
    }
  }

  if (['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version) && memo?.selectionState !== 'No selection') {
    const primary = manifest.primarySelectionStates.includes(memo.selectionState);

    const v15BaseHorizonRoute = ['1.5.0', '1.6.0'].includes(manifest?.skill?.version) && memo?.timingRoute === 'base_horizon_convexity';
    const allowedTimingRoutes = ['1.5.0', '1.6.0'].includes(manifest?.skill?.version)
      ? ['sector_confirmed', 'company_engine_override', 'base_horizon_convexity', 'research_only']
      : ['sector_confirmed', 'company_engine_override', 'research_only'];
    if (!allowedTimingRoutes.includes(memo?.timingRoute)) {
      errors.push(`${memoPath} timingRoute is invalid for skill version ${manifest?.skill?.version}`);
    }
    if (primary && memo?.timingRoute === 'research_only') {
      errors.push(`${memoPath} High-priority selection cannot use research_only timingRoute`);
    }
    if (primary && memo?.timingRoute === 'sector_confirmed' &&
        memo?.opportunityTimingTest?.priceRegime?.conclusion !== 'favorable') {
      errors.push(`${memoPath} sector_confirmed High-priority selection requires favorable price regime`);
    }

    const override = memo?.companyEngineTimingOverrideTest;
    if (memo?.timingRoute === 'company_engine_override') {
      if (!override || typeof override !== 'object') {
        errors.push(`${memoPath} company_engine_override requires companyEngineTimingOverrideTest`);
      } else {
        if (!['subsector_separation', 'fundamental_price_divergence'].includes(override.overrideMode)) {
          errors.push(`${memoPath} companyEngineTimingOverrideTest.overrideMode is invalid`);
        }

        for (const name of ['realizedEngine', 'independentFundamentalConfirmation', 'fundamentalPriceDivergence', 'nextCatalystWithinBase']) {
          const component = override[name];
          if (!component || !['clear', 'credible', 'mixed', 'insufficient'].includes(component.conclusion)) {
            errors.push(`${memoPath} companyEngineTimingOverrideTest.${name}.conclusion is invalid`);
            continue;
          }
          if (typeof component.rationale !== 'string' || !component.rationale.trim()) {
            errors.push(`${memoPath} companyEngineTimingOverrideTest.${name}.rationale is required`);
          }
          if (!Array.isArray(component.evidenceRefs) || component.evidenceRefs.length === 0) {
            errors.push(`${memoPath} companyEngineTimingOverrideTest.${name}.evidenceRefs must be non-empty`);
          }
        }

        const engineHalfLife = override.engineHalfLife;
        if (!engineHalfLife || !['structural', 'multi_quarter', 'short_lived', 'uncertain'].includes(engineHalfLife.conclusion)) {
          errors.push(`${memoPath} companyEngineTimingOverrideTest.engineHalfLife.conclusion is invalid`);
        }
        if (engineHalfLife) {
          if (typeof engineHalfLife.rationale !== 'string' || !engineHalfLife.rationale.trim()) {
            errors.push(`${memoPath} companyEngineTimingOverrideTest.engineHalfLife.rationale is required`);
          }
          if (!Array.isArray(engineHalfLife.evidenceRefs) || engineHalfLife.evidenceRefs.length === 0) {
            errors.push(`${memoPath} companyEngineTimingOverrideTest.engineHalfLife.evidenceRefs must be non-empty`);
          }
        }

        const attribution = override.priceWeaknessAttribution;
        if (!attribution || !['non_company_fundamental', 'company_fundamental', 'mixed', 'unresolved'].includes(attribution.conclusion)) {
          errors.push(`${memoPath} companyEngineTimingOverrideTest.priceWeaknessAttribution.conclusion is invalid`);
        }
        if (attribution) {
          if (typeof attribution.rationale !== 'string' || !attribution.rationale.trim()) {
            errors.push(`${memoPath} companyEngineTimingOverrideTest.priceWeaknessAttribution.rationale is required`);
          }
          if (!Array.isArray(attribution.evidenceRefs) || attribution.evidenceRefs.length === 0) {
            errors.push(`${memoPath} companyEngineTimingOverrideTest.priceWeaknessAttribution.evidenceRefs must be non-empty`);
          }
        }

        const dislocation = override.companyPriceDislocation;
        if (!dislocation || typeof dislocation !== 'object') {
          errors.push(`${memoPath} companyEngineTimingOverrideTest.companyPriceDislocation is required`);
        } else {
          if (typeof dislocation.selected20Excess !== 'number' || typeof dislocation.selected60Excess !== 'number') {
            errors.push(`${memoPath} companyPriceDislocation selected20Excess/selected60Excess must be numbers`);
          }
          const isV11 = ['1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version);
          const allowedDislocations = isV11
            ? ['de_rated', 'early_turn', 'late_reversal', 'sustained_strength']
            : ['de_rated', 'mixed', 'not_dislocated'];
          if (!allowedDislocations.includes(dislocation.conclusion)) {
            errors.push(`${memoPath} companyPriceDislocation.conclusion is invalid`);
          } else if (typeof dislocation.selected20Excess === 'number' && typeof dislocation.selected60Excess === 'number') {
            const mechanical = isV11
              ? classifyCompanyPriceDislocation(dislocation.selected20Excess, dislocation.selected60Excess)
              : (dislocation.selected20Excess < 0 && dislocation.selected60Excess < 0 ? 'de_rated'
                : ((dislocation.selected20Excess < 0) !== (dislocation.selected60Excess < 0) ? 'mixed' : 'not_dislocated'));
            if (mechanical !== dislocation.conclusion) {
              errors.push(`${memoPath} companyPriceDislocation conclusion is inconsistent with frozen selected 20/60d excess returns`);
            }
          }
          if (!Array.isArray(dislocation.evidenceRefs) || dislocation.evidenceRefs.length === 0) {
            errors.push(`${memoPath} companyPriceDislocation.evidenceRefs must be non-empty`);
          }
        }

        if (typeof override.falsifier !== 'string' || !override.falsifier.trim()) {
          errors.push(`${memoPath} companyEngineTimingOverrideTest.falsifier is required`);
        }
        if (!Array.isArray(override.evidenceRefs) || override.evidenceRefs.length < 2) {
          errors.push(`${memoPath} companyEngineTimingOverrideTest.evidenceRefs requires at least two evidence refs`);
        }
        if (!['clear_override', 'credible_override', 'no_override'].includes(override.overallConclusion)) {
          errors.push(`${memoPath} companyEngineTimingOverrideTest.overallConclusion is invalid`);
        }

        if (primary) {
          if (memo?.expressionArchetype !== 'quality_revision') {
            errors.push(`${memoPath} High-priority company-engine override is only allowed for quality_revision`);
          }
          if (memo?.earningsConversionBridge?.status !== 'realized') {
            errors.push(`${memoPath} High-priority company-engine override requires realized earnings conversion`);
          }
          if (memo?.expectationBurdenTest?.conclusion !== 'room') {
            errors.push(`${memoPath} High-priority company-engine override requires expectation burden room`);
          }
          if (memo?.crossSectionalAsymmetryTest?.qualityFloor?.conclusion !== 'pass') {
            errors.push(`${memoPath} High-priority company-engine override requires qualityFloor pass`);
          }
          if (memo?.crossSectionalAsymmetryTest?.valuationSlack?.conclusion !== 'room') {
            errors.push(`${memoPath} High-priority company-engine override requires valuationSlack room`);
          }
          if (!['clear', 'credible'].includes(memo?.crossSectionalAsymmetryTest?.downsideContainment?.conclusion)) {
            errors.push(`${memoPath} High-priority company-engine override requires downside containment`);
          }
          if (memo?.crossSectionalAsymmetryTest?.overallConclusion !== 'clear_asymmetry') {
            errors.push(`${memoPath} High-priority company-engine override requires clear asymmetry`);
          }
          if ((memo?.crossSectionalAsymmetryTest?.pairwise ?? []).some((pair) => pair?.netAsymmetry !== 'selected')) {
            errors.push(`${memoPath} High-priority company-engine override must beat every frozen control`);
          }
          if (!['neutral', 'adverse'].includes(memo?.opportunityTimingTest?.priceRegime?.conclusion)) {
            errors.push(`${memoPath} company-engine override is only for neutral/adverse broad price regimes`);
          }
          if (attribution?.conclusion !== 'non_company_fundamental') {
            errors.push(`${memoPath} High-priority company-engine override requires price weakness attributed away from company fundamentals`);
          }
          if (!['structural', 'multi_quarter'].includes(engineHalfLife?.conclusion)) {
            errors.push(`${memoPath} High-priority company-engine override requires structural or multi-quarter company-engine half-life`);
          }
          const directionalV11Plus = ['1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version);
          const allowedOverrideDislocation = directionalV11Plus
            ? ['de_rated', 'early_turn']
            : ['de_rated', 'mixed'];
          if (!allowedOverrideDislocation.includes(dislocation?.conclusion)) {
            errors.push(`${memoPath} High-priority company-engine override requires ${directionalV11Plus ? 'de_rated or early_turn' : 'de_rated or mixed'} company price dislocation`);
          }
          for (const name of ['realizedEngine', 'independentFundamentalConfirmation', 'fundamentalPriceDivergence', 'nextCatalystWithinBase']) {
            if (!['clear', 'credible'].includes(override?.[name]?.conclusion)) {
              errors.push(`${memoPath} High-priority company-engine override requires ${name} clear/credible`);
            }
          }
          if (!['clear_override', 'credible_override'].includes(override.overallConclusion)) {
            errors.push(`${memoPath} High-priority company-engine override requires clear/credible override conclusion`);
          }
        }
      }
    } else if (override && override.overallConclusion && override.overallConclusion !== 'not_applicable') {
      errors.push(`${memoPath} non-override timingRoute must keep companyEngineTimingOverrideTest not_applicable`);
    }
  }

  if (['1.5.0', '1.6.0'].includes(manifest?.skill?.version) && memo?.selectionState !== 'No selection') {
    const isBaseRoute = memo?.timingRoute === 'base_horizon_convexity';
    const test = memo?.baseHorizonConvexityTest;

    if (isBaseRoute) {
      if (!test || typeof test !== 'object') {
        errors.push(`${memoPath} base_horizon_convexity requires baseHorizonConvexityTest`);
      } else {
        if (!['realized', 'quantitatively_bridged'].includes(test.bridgeStatus)) {
          errors.push(`${memoPath} baseHorizonConvexityTest.bridgeStatus must be realized or quantitatively_bridged`);
        }
        if (test.bridgeStatus !== memo?.earningsConversionBridge?.status) {
          errors.push(`${memoPath} baseHorizonConvexityTest.bridgeStatus must match earningsConversionBridge.status`);
        }

        for (const name of ['freshIncrementalEvidence', 'baseHorizonExpectationGap', 'catalystWithinBase']) {
          const component = test[name];
          if (!component || !['clear', 'credible', 'mixed', 'insufficient'].includes(component.conclusion)) {
            errors.push(`${memoPath} baseHorizonConvexityTest.${name}.conclusion is invalid`);
            continue;
          }
          if (typeof component.rationale !== 'string' || !component.rationale.trim()) {
            errors.push(`${memoPath} baseHorizonConvexityTest.${name}.rationale is required`);
          }
          if (!Array.isArray(component.evidenceRefs) || component.evidenceRefs.length === 0) {
            errors.push(`${memoPath} baseHorizonConvexityTest.${name}.evidenceRefs must be non-empty`);
          }
        }

        for (const field of ['catalystLatestTradingDays', 'reunderwriteTradingDays', 'normalizationEarliestTradingDays']) {
          if (!Number.isInteger(test[field]) || test[field] <= 0) {
            errors.push(`${memoPath} baseHorizonConvexityTest.${field} must be a positive integer`);
          }
        }

        if (Number.isInteger(test.catalystLatestTradingDays) &&
            Number.isInteger(test.reunderwriteTradingDays) &&
            test.catalystLatestTradingDays > test.reunderwriteTradingDays) {
          errors.push(`${memoPath} baseHorizonConvexityTest catalyst must occur by the re-underwrite point`);
        }
        if (Number.isInteger(test.reunderwriteTradingDays) &&
            Number.isInteger(test.normalizationEarliestTradingDays) &&
            test.reunderwriteTradingDays > test.normalizationEarliestTradingDays) {
          errors.push(`${memoPath} baseHorizonConvexityTest re-underwrite must not occur after expected normalization begins`);
        }
        if (Number.isInteger(test.reunderwriteTradingDays) &&
            Number.isInteger(memo?.expectedRealization?.baseTradingDays) &&
            test.reunderwriteTradingDays > memo.expectedRealization.baseTradingDays) {
          errors.push(`${memoPath} baseHorizonConvexityTest re-underwrite cannot exceed the pre-registered base horizon`);
        }
        if (Number.isInteger(test.reunderwriteTradingDays) &&
            Number.isInteger(memo?.decisionValidityTradingDays) &&
            test.reunderwriteTradingDays > memo.decisionValidityTradingDays) {
          errors.push(`${memoPath} baseHorizonConvexityTest re-underwrite cannot exceed decision validity`);
        }

        if (!['low', 'moderate', 'high'].includes(test.normalizationRisk)) {
          errors.push(`${memoPath} baseHorizonConvexityTest.normalizationRisk is invalid`);
        }
        if (typeof test.exitDiscipline !== 'string' || !test.exitDiscipline.trim()) {
          errors.push(`${memoPath} baseHorizonConvexityTest.exitDiscipline is required`);
        }
        if (typeof test.falsifier !== 'string' || !test.falsifier.trim()) {
          errors.push(`${memoPath} baseHorizonConvexityTest.falsifier is required`);
        }
        if (!Array.isArray(test.evidenceRefs) || test.evidenceRefs.length < 2) {
          errors.push(`${memoPath} baseHorizonConvexityTest.evidenceRefs requires at least two refs`);
        }
        if (!['clear_route', 'credible_route', 'no_route', 'not_applicable'].includes(test.conclusion)) {
          errors.push(`${memoPath} baseHorizonConvexityTest.conclusion is invalid`);
        }

        const primary = manifest.primarySelectionStates.includes(memo.selectionState);
        if (primary) {
          if (!['realized', 'quantitatively_bridged'].includes(memo?.earningsConversionBridge?.status)) {
            errors.push(`${memoPath} High-priority base_horizon_convexity requires realized or quantitatively bridged earnings conversion`);
          }
          if (!['room', 'tight'].includes(memo?.expectationBurdenTest?.conclusion)) {
            errors.push(`${memoPath} High-priority base_horizon_convexity requires room/tight expectation burden`);
          }
          if (memo?.crossSectionalAsymmetryTest?.qualityFloor?.conclusion !== 'pass') {
            errors.push(`${memoPath} High-priority base_horizon_convexity requires qualityFloor pass`);
          }
          if (!['room', 'tight'].includes(memo?.crossSectionalAsymmetryTest?.valuationSlack?.conclusion)) {
            errors.push(`${memoPath} High-priority base_horizon_convexity requires room/tight valuationSlack`);
          }
          if (!['clear', 'credible'].includes(memo?.crossSectionalAsymmetryTest?.catalystReachability?.conclusion)) {
            errors.push(`${memoPath} High-priority base_horizon_convexity requires clear/credible catalyst reachability`);
          }
          if (!['clear', 'credible'].includes(memo?.crossSectionalAsymmetryTest?.downsideContainment?.conclusion)) {
            errors.push(`${memoPath} High-priority base_horizon_convexity requires clear/credible downside containment`);
          }
          if (!['clear', 'credible'].includes(test?.freshIncrementalEvidence?.conclusion)) {
            errors.push(`${memoPath} High-priority base_horizon_convexity requires fresh incremental evidence`);
          }
          if (!['clear', 'credible'].includes(test?.baseHorizonExpectationGap?.conclusion)) {
            errors.push(`${memoPath} High-priority base_horizon_convexity requires a clear/credible base-horizon expectation gap`);
          }
          if (!['clear', 'credible'].includes(test?.catalystWithinBase?.conclusion)) {
            errors.push(`${memoPath} High-priority base_horizon_convexity requires a clear/credible catalyst within base horizon`);
          }
          if (!['clear_route', 'credible_route'].includes(test?.conclusion)) {
            errors.push(`${memoPath} High-priority base_horizon_convexity requires clear/credible route conclusion`);
          }
        }
      }
    } else if (test && test.conclusion && test.conclusion !== 'not_applicable') {
      errors.push(`${memoPath} non-base-horizon timingRoute must keep baseHorizonConvexityTest not_applicable`);
    }
  }

  if (manifest?.skill?.version === '1.6.0') {
    const stateTest = memo?.causalStateVariableTest;
    if (!stateTest || typeof stateTest !== 'object') {
      errors.push(`${memoPath} v1.6 requires causalStateVariableTest`);
    } else {
      if (typeof stateTest.applicable !== 'boolean') {
        errors.push(`${memoPath} causalStateVariableTest.applicable must be boolean`);
      }

      const allowedSystems = [
        'biological_replenishment',
        'capacity_constrained',
        'inventory_cycle',
        'backlog_orderbook',
        'installed_base',
        'other',
        'not_applicable'
      ];
      const allowedDirections = ['rising', 'falling', 'stable', 'mixed', 'unresolved'];
      const allowedImplications = ['positive', 'negative', 'mixed', 'unresolved'];
      const allowedLags = ['days', 'weeks', 'months', 'quarters', 'years', 'unresolved'];
      const allowedRelations = ['aligned', 'state_leads_flow', 'flow_leads_state', 'conflicted_unresolved', 'not_applicable'];
      const allowedDispositions = [
        'continue_company_mapping',
        'research_only',
        'no_selection_independent_blocker',
        'no_selection_state_not_actionable',
        'not_applicable'
      ];
      const allowedConclusions = [
        'state_leads_flow',
        'flow_confirms_state',
        'no_actionable_state_edge',
        'unresolved',
        'not_applicable'
      ];

      if (!allowedSystems.includes(stateTest.systemType)) {
        errors.push(`${memoPath} causalStateVariableTest.systemType is invalid`);
      }
      if (!allowedRelations.includes(stateTest.stateFlowRelation)) {
        errors.push(`${memoPath} causalStateVariableTest.stateFlowRelation is invalid`);
      }
      if (!allowedDispositions.includes(stateTest.stateLeadDisposition)) {
        errors.push(`${memoPath} causalStateVariableTest.stateLeadDisposition is invalid`);
      }
      if (!allowedConclusions.includes(stateTest.conclusion)) {
        errors.push(`${memoPath} causalStateVariableTest.conclusion is invalid`);
      }
      if (!Array.isArray(stateTest.independentBlockers) ||
          stateTest.independentBlockers.some((x) => typeof x !== 'string' || !x.trim())) {
        errors.push(`${memoPath} causalStateVariableTest.independentBlockers must be an array of non-empty strings`);
      }

      if (stateTest.applicable === false) {
        if (stateTest.systemType !== 'not_applicable') {
          errors.push(`${memoPath} non-applicable causalStateVariableTest must use systemType not_applicable`);
        }
        if (stateTest.stateFlowRelation !== 'not_applicable') {
          errors.push(`${memoPath} non-applicable causalStateVariableTest must use stateFlowRelation not_applicable`);
        }
        if (stateTest.stateLeadDisposition !== 'not_applicable') {
          errors.push(`${memoPath} non-applicable causalStateVariableTest must use stateLeadDisposition not_applicable`);
        }
        if (stateTest.conclusion !== 'not_applicable') {
          errors.push(`${memoPath} non-applicable causalStateVariableTest must conclude not_applicable`);
        }
      } else if (stateTest.applicable === true) {
        if (stateTest.systemType === 'not_applicable') {
          errors.push(`${memoPath} applicable causalStateVariableTest cannot use systemType not_applicable`);
        }

        const upstream = stateTest.upstreamState;
        if (!upstream || typeof upstream !== 'object') {
          errors.push(`${memoPath} causalStateVariableTest.upstreamState is required`);
        } else {
          if (typeof upstream.variable !== 'string' || !upstream.variable.trim()) {
            errors.push(`${memoPath} causalStateVariableTest.upstreamState.variable is required`);
          }
          if (!allowedDirections.includes(upstream.observedDirection)) {
            errors.push(`${memoPath} causalStateVariableTest.upstreamState.observedDirection is invalid`);
          }
          if (!allowedImplications.includes(upstream.opportunityImplication)) {
            errors.push(`${memoPath} causalStateVariableTest.upstreamState.opportunityImplication is invalid`);
          }
          if (typeof upstream.economicRole !== 'string' || !upstream.economicRole.trim()) {
            errors.push(`${memoPath} causalStateVariableTest.upstreamState.economicRole is required`);
          }
          if (!allowedLags.includes(upstream.adjustmentLag)) {
            errors.push(`${memoPath} causalStateVariableTest.upstreamState.adjustmentLag is invalid`);
          }
          if (!Array.isArray(upstream.evidenceRefs) || upstream.evidenceRefs.length === 0) {
            errors.push(`${memoPath} causalStateVariableTest.upstreamState.evidenceRefs must be non-empty`);
          }
        }

        const downstream = stateTest.downstreamFlow;
        if (!downstream || typeof downstream !== 'object') {
          errors.push(`${memoPath} causalStateVariableTest.downstreamFlow is required`);
        } else {
          if (typeof downstream.variable !== 'string' || !downstream.variable.trim()) {
            errors.push(`${memoPath} causalStateVariableTest.downstreamFlow.variable is required`);
          }
          if (!allowedDirections.includes(downstream.observedDirection)) {
            errors.push(`${memoPath} causalStateVariableTest.downstreamFlow.observedDirection is invalid`);
          }
          if (!allowedImplications.includes(downstream.opportunityImplication)) {
            errors.push(`${memoPath} causalStateVariableTest.downstreamFlow.opportunityImplication is invalid`);
          }
          if (typeof downstream.temporaryDistortion !== 'string' || !downstream.temporaryDistortion.trim()) {
            errors.push(`${memoPath} causalStateVariableTest.downstreamFlow.temporaryDistortion is required`);
          }
          if (!Array.isArray(downstream.evidenceRefs) || downstream.evidenceRefs.length === 0) {
            errors.push(`${memoPath} causalStateVariableTest.downstreamFlow.evidenceRefs must be non-empty`);
          }
        }

        for (const name of ['causalLagBridge', 'crossSectionalCorroboration']) {
          const component = stateTest[name];
          if (!component || !['clear', 'credible', 'mixed', 'insufficient'].includes(component.conclusion)) {
            errors.push(`${memoPath} causalStateVariableTest.${name}.conclusion is invalid`);
            continue;
          }
          if (typeof component.rationale !== 'string' || !component.rationale.trim()) {
            errors.push(`${memoPath} causalStateVariableTest.${name}.rationale is required`);
          }
          if (!Array.isArray(component.evidenceRefs) || component.evidenceRefs.length === 0) {
            errors.push(`${memoPath} causalStateVariableTest.${name}.evidenceRefs must be non-empty`);
          }
        }

        if (typeof stateTest.falsifier !== 'string' || !stateTest.falsifier.trim()) {
          errors.push(`${memoPath} causalStateVariableTest.falsifier is required`);
        }

        if (stateTest.conclusion === 'state_leads_flow') {
          if (stateTest.stateFlowRelation !== 'state_leads_flow') {
            errors.push(`${memoPath} state_leads_flow conclusion requires stateFlowRelation state_leads_flow`);
          }
          if (!['clear', 'credible'].includes(stateTest?.causalLagBridge?.conclusion)) {
            errors.push(`${memoPath} state_leads_flow requires clear/credible causalLagBridge`);
          }
          if (!['positive', 'negative'].includes(stateTest?.upstreamState?.opportunityImplication)) {
            errors.push(`${memoPath} state_leads_flow requires a resolved upstream opportunity implication`);
          }

          if (memo?.selectionState === 'No selection') {
            if (stateTest.stateLeadDisposition !== 'no_selection_independent_blocker') {
              errors.push(`${memoPath} No selection with state_leads_flow requires no_selection_independent_blocker disposition`);
            }
            if (!Array.isArray(stateTest.independentBlockers) || stateTest.independentBlockers.length === 0) {
              errors.push(`${memoPath} No selection with state_leads_flow requires at least one independent blocker`);
            }
          } else if (!['continue_company_mapping', 'research_only'].includes(stateTest.stateLeadDisposition)) {
            errors.push(`${memoPath} selected state_leads_flow memo must continue company mapping or remain research_only`);
          }
        }

        if (stateTest.conclusion === 'no_actionable_state_edge' &&
            memo?.selectionState === 'No selection' &&
            stateTest.stateLeadDisposition !== 'no_selection_state_not_actionable') {
          errors.push(`${memoPath} No selection with no_actionable_state_edge requires no_selection_state_not_actionable disposition`);
        }

        if (stateTest.stateFlowRelation === 'state_leads_flow' &&
            stateTest.conclusion !== 'state_leads_flow') {
          errors.push(`${memoPath} stateFlowRelation state_leads_flow requires state_leads_flow conclusion`);
        }
      }
    }
  }

  return errors;
}

function validateMemoForSelection(memo, selection, manifest) {
  const errors = [];
  const isV12 = ['1.2', '1.3', '1.4'].includes(manifest?.schemaVersion);
  const trackedStates = manifest?.trackedMemoStates ?? manifest?.eligibleMemoStates ?? [];
  const primaryStates = manifest?.primarySignalStates ?? trackedStates;
  const trackedHypothesisStates = manifest?.trackedHypothesisStates ?? [];
  const trackedSelectionStates = manifest?.trackedSelectionStates ?? [];
  const primarySelectionStates = manifest?.primarySelectionStates ?? [];

  try { assertIso(memo?.cutoffAt, `${selection.memoPath}.cutoffAt`); } catch (error) { errors.push(error.message); }
  try { assertIso(memo?.researchReadyAt, `${selection.memoPath}.researchReadyAt`); } catch (error) { errors.push(error.message); }
  if (memo?.actionableAt !== null && memo?.actionableAt !== undefined) {
    try { assertIso(memo.actionableAt, `${selection.memoPath}.actionableAt`); } catch (error) { errors.push(error.message); }
  }

  if (memo?.skillVersion !== manifest.skill.version) errors.push(`${selection.memoPath} skillVersion does not match manifest`);
  if (memo?.hypothesisId !== selection.hypothesisId) errors.push(`${selection.memoPath} hypothesisId does not match selection`);

  let primary = false;
  if (isV12) {
    if (!trackedHypothesisStates.includes(memo?.hypothesisState)) {
      errors.push(`${selection.memoPath} hypothesisState ${memo?.hypothesisState} is not tracked`);
    }
    if (!trackedSelectionStates.includes(memo?.selectionState)) {
      errors.push(`${selection.memoPath} selectionState ${memo?.selectionState} is not tracked`);
    }
    primary = primarySelectionStates.includes(memo?.selectionState);
    if (memo?.selectionState === 'No selection') {
      errors.push(`${selection.memoPath} is referenced by a ticker selection but memo.selectionState is No selection`);
    }
  } else {
    if (!trackedStates.includes(memo?.state)) errors.push(`${selection.memoPath} state ${memo?.state} is not tracked`);
    primary = primaryStates.includes(memo?.state);
  }

  if (primary && !memo?.actionableAt) errors.push(`${selection.memoPath} primary-signal state requires actionableAt`);
  if (!primary && memo?.actionableAt) errors.push(`${selection.memoPath} non-primary state must keep actionableAt null`);
  if (memo?.researchReadyAt && memo?.cutoffAt && Date.parse(memo.researchReadyAt) > Date.parse(memo.cutoffAt)) {
    errors.push(`${selection.memoPath} researchReadyAt must not be after cutoffAt`);
  }
  if (memo?.actionableAt && memo?.researchReadyAt && Date.parse(memo.actionableAt) < Date.parse(memo.researchReadyAt)) {
    errors.push(`${selection.memoPath} actionableAt must not be before researchReadyAt`);
  }
  if (memo?.actionableAt && memo?.cutoffAt && Date.parse(memo.actionableAt) > Date.parse(memo.cutoffAt)) {
    errors.push(`${selection.memoPath} actionableAt must not be after cutoffAt`);
  }

  const realization = memo?.expectedRealization;
  if (!realization || ![realization.earliestTradingDays, realization.baseTradingDays, realization.latestTradingDays].every((n) => Number.isInteger(n) && n > 0)) {
    errors.push(`${selection.memoPath} expectedRealization must define positive earliest/base/latest trading days`);
  } else if (!(realization.earliestTradingDays <= realization.baseTradingDays && realization.baseTradingDays <= realization.latestTradingDays)) {
    errors.push(`${selection.memoPath} expectedRealization horizons must be ascending`);
  }

  const candidates = Array.isArray(memo?.aShareCandidates) ? memo.aShareCandidates : [];
  if (!candidates.some((candidate) => candidate?.ticker === selection.ticker)) {
    errors.push(`${selection.memoPath} does not contain selected ticker ${selection.ticker}`);
  }

  const controls = Array.isArray(memo?.matchedControls) ? memo.matchedControls : [];
  const controlTickers = new Set();
  for (const control of controls) {
    if (!control?.ticker) errors.push(`${selection.memoPath} matched control requires ticker`);
    if (control?.ticker === selection.ticker) errors.push(`${selection.memoPath} matched control cannot equal selected ticker`);
    if (control?.ticker) {
      if (controlTickers.has(control.ticker)) errors.push(`${selection.memoPath} duplicates matched control ${control.ticker}`);
      controlTickers.add(control.ticker);
    }
    if (!['peer', 'near_miss', 'sector_proxy'].includes(control?.controlType)) {
      errors.push(`${selection.memoPath} matched control ${control?.ticker ?? 'unknown'} has invalid controlType`);
    }
    if (typeof control?.fairCounterfactualReason !== 'string' || !control.fairCounterfactualReason) {
      errors.push(`${selection.memoPath} matched control ${control?.ticker ?? 'unknown'} lacks fairCounterfactualReason`);
    }
    if (typeof control?.whySelectedCompanyShouldOutperform !== 'string' || !control.whySelectedCompanyShouldOutperform) {
      errors.push(`${selection.memoPath} matched control ${control?.ticker ?? 'unknown'} lacks whySelectedCompanyShouldOutperform`);
    }
  }

  if (primary && ['1.1', '1.2', '1.3', '1.4'].includes(manifest?.schemaVersion)) {
    const exception = typeof memo?.matchedControlException === 'string' && memo.matchedControlException.trim();
    if ((controls.length < 2 || controls.length > 5) && !exception) {
      errors.push(`${selection.memoPath} primary signal requires 2-5 matched controls or matchedControlException`);
    }
  }

  if (isV12 && memo?.selectionState !== 'No selection') {
    const comparison = memo?.selectionComparison;
    const isV13 = ['1.3.0', '1.4.0', '1.5.0', '1.6.0'].includes(manifest?.skill?.version);
    const acceptableSet = Array.isArray(memo?.acceptableExpressionSet) ? memo.acceptableExpressionSet : [];
    const expressionEntry = acceptableSet.find((item) => item?.ticker === selection.ticker);
    if (isV13) {
      if (!expressionEntry) {
        errors.push(`${selection.memoPath} selected ticker ${selection.ticker} is not in acceptableExpressionSet`);
      } else if (primary && expressionEntry.conclusion !== 'acceptable') {
        errors.push(`${selection.memoPath} primary selected ticker ${selection.ticker} must be an acceptable expression`);
      }
    } else if (!comparison || comparison.selectedTicker !== selection.ticker) {
      errors.push(`${selection.memoPath} selectionComparison.selectedTicker must match selected ticker`);
    }
    if (comparison) {
      const pairwise = Array.isArray(comparison.pairwise) ? comparison.pairwise : [];
      const pairwiseTickers = new Set();
      for (const item of pairwise) {
        if (!controlTickers.has(item?.controlTicker)) {
          errors.push(`${selection.memoPath} pairwise comparison references non-control ${item?.controlTicker ?? 'unknown'}`);
        }
        if (item?.controlTicker) {
          if (pairwiseTickers.has(item.controlTicker)) errors.push(`${selection.memoPath} duplicates pairwise control ${item.controlTicker}`);
          pairwiseTickers.add(item.controlTicker);
        }
        if (!['selected', 'control', 'mixed', 'insufficient'].includes(item?.netEdge)) {
          errors.push(`${selection.memoPath} pairwise ${item?.controlTicker ?? 'unknown'} has invalid netEdge`);
        }
        if (!Array.isArray(item?.selectedAdvantages) || !Array.isArray(item?.selectedDisadvantages)) {
          errors.push(`${selection.memoPath} pairwise ${item?.controlTicker ?? 'unknown'} requires advantage/disadvantage arrays`);
        }
        if (!Array.isArray(item?.evidenceRefs)) {
          errors.push(`${selection.memoPath} pairwise ${item?.controlTicker ?? 'unknown'} requires evidenceRefs`);
        }
        if (['1.3', '1.4'].includes(manifest?.schemaVersion) &&
            (typeof item?.switchCondition !== 'string' || !item.switchCondition.trim())) {
          errors.push(`${selection.memoPath} pairwise ${item?.controlTicker ?? 'unknown'} requires switchCondition`);
        }
      }
      if (controls.length && pairwise.length !== controls.length) {
        errors.push(`${selection.memoPath} requires one pairwise comparison per matched control`);
      }
      if (!['clear', 'credible', 'mixed', 'insufficient'].includes(comparison?.selectionEdgeConclusion)) {
        errors.push(`${selection.memoPath} selectionComparison.selectionEdgeConclusion is invalid`);
      }
      if (primary) {
        if (!['clear', 'credible'].includes(comparison.selectionEdgeConclusion)) {
          errors.push(`${selection.memoPath} High-priority selection requires clear or credible selection edge`);
        }
        if (pairwise.some((item) => ['control', 'insufficient'].includes(item?.netEdge))) {
          errors.push(`${selection.memoPath} High-priority selection cannot have control/insufficient pairwise edge`);
        }
      }
    }
  }

  const cutoffDate = memo?.cutoffAt?.slice?.(0, 10);
  if (cutoffDate && (cutoffDate < manifest.discoveryWindow.startDate || cutoffDate > manifest.discoveryWindow.endDate)) {
    errors.push(`${selection.memoPath} cutoff date is outside discoveryWindow`);
  }
  return errors;
}

function lockRun(manifestPath, rootDir = process.cwd()) {
  const absoluteManifest = path.resolve(manifestPath);
  const manifest = readJson(absoluteManifest);
  const errors = validateManifest(manifest);
  if (errors.length) throw new Error(`invalid manifest:\n- ${errors.join('\n- ')}`);
  const root = path.resolve(rootDir);
  const relativeManifest = path.relative(root, absoluteManifest).replaceAll(path.sep, '/');
  if (relativeManifest.startsWith('../') || path.isAbsolute(relativeManifest)) throw new Error('manifest must be inside repository root');

  const files = [{ role: 'manifest', path: relativeManifest, sha256: sha256File(absoluteManifest) }];
  const skillPath = resolveInside(root, manifest.skill.path);
  files.push({ role: 'skill', path: manifest.skill.path, sha256: sha256File(skillPath) });
  const screeningPath = resolveInside(root, manifest.screeningPath);
  const screening = readJson(screeningPath);
  const screeningErrors = validateScreening(screening, manifest);
  if (screeningErrors.length) throw new Error(`invalid screening:\n- ${screeningErrors.join('\n- ')}`);
  files.push({ role: 'screening', path: manifest.screeningPath, sha256: sha256File(screeningPath) });
  for (const implementationPath of manifest.implementationPaths) {
    const absoluteImplementation = resolveInside(root, implementationPath);
    files.push({ role: 'implementation', path: implementationPath, sha256: sha256File(absoluteImplementation) });
  }

  let sourcePack = null;
  if (manifest?.contaminationControls?.sourcePackPath) {
    const sourcePackPath = resolveInside(root, manifest.contaminationControls.sourcePackPath);
    sourcePack = readJson(sourcePackPath);
    if (manifest.schemaVersion === '1.4') {
      const discoveryErrors = validateDiscoveryPack(sourcePack, manifest);
      if (discoveryErrors.length) throw new Error(`invalid discovery source pack:\n- ${discoveryErrors.join('\n- ')}`);
      const discoveryScreeningErrors = validateDiscoveryScreening(screening, sourcePack, manifest);
      if (discoveryScreeningErrors.length) throw new Error(`invalid discovery screening:\n- ${discoveryScreeningErrors.join('\n- ')}`);
    }
    files.push({ role: 'source_pack', path: manifest.contaminationControls.sourcePackPath, sha256: sha256File(sourcePackPath) });
  }
  if (manifest.evaluationMode === 'historical_replay' && ['1.1', '1.2', '1.3', '1.4'].includes(manifest.schemaVersion)) {
    const identityStressPath = resolveInside(root, manifest.contaminationControls.identityStressPath);
    const identityStress = readJson(identityStressPath);
    const identityErrors = validateIdentityStress(identityStress, manifest);
    if (identityErrors.length) throw new Error(`invalid identity stress:\n- ${identityErrors.join('\n- ')}`);
    files.push({ role: 'identity_stress', path: manifest.contaminationControls.identityStressPath, sha256: sha256File(identityStressPath) });
  }

  const seenMemoPaths = new Set();
  if (['1.2', '1.3', '1.4'].includes(manifest.schemaVersion)) {
    const seenHypothesisIds = new Set();
    for (const memoRelativePath of manifest.hypothesisMemoPaths) {
      if (seenMemoPaths.has(memoRelativePath)) throw new Error(`duplicate hypothesisMemoPath: ${memoRelativePath}`);
      const memoPath = resolveInside(root, memoRelativePath);
      const memo = readJson(memoPath);
      const memoErrors = validateOpportunityMemo(memo, memoRelativePath, manifest);
      const evidenceErrors = validateMemoEvidenceRefs(memo, memoRelativePath, sourcePack);
      const allMemoErrors = [...memoErrors, ...evidenceErrors];
      if (allMemoErrors.length) throw new Error(`invalid opportunity memo:\n- ${allMemoErrors.join('\n- ')}`);
      if (seenHypothesisIds.has(memo.hypothesisId)) throw new Error(`duplicate hypothesisId across memos: ${memo.hypothesisId}`);
      seenHypothesisIds.add(memo.hypothesisId);
      files.push({ role: 'memo', path: memoRelativePath, sha256: sha256File(memoPath) });
      seenMemoPaths.add(memoRelativePath);
    }
  }
  for (const selection of manifest.selections) {
    if (!selection?.memoPath || !selection?.hypothesisId || !selection?.ticker) throw new Error('each selection requires memoPath, hypothesisId and ticker');
    const memoPath = resolveInside(root, selection.memoPath);
    const memo = readJson(memoPath);
    const memoErrors = validateMemoForSelection(memo, selection, manifest);
    if (memoErrors.length) throw new Error(`invalid selection:\n- ${memoErrors.join('\n- ')}`);
    if (!seenMemoPaths.has(selection.memoPath)) {
      files.push({ role: 'memo', path: selection.memoPath, sha256: sha256File(memoPath) });
      seenMemoPaths.add(selection.memoPath);
    }
  }

  return {
    schemaVersion: '1.0',
    runId: manifest.runId,
    discoverySummary: manifest.schemaVersion === '1.4' ? summarizeDiscoveryPack(sourcePack) : null,
    lockedAt: new Date().toISOString(),
    evaluationMode: manifest.evaluationMode,
    files,
    selectionDigest: sha256Text(JSON.stringify(manifest.selections)),
    candidateCount: manifest.selections.length
  };
}

function verifyLock(lock, rootDir = process.cwd()) {
  const mismatches = [];
  for (const file of lock?.files ?? []) {
    const absolute = resolveInside(rootDir, file.path);
    if (!fs.existsSync(absolute)) {
      mismatches.push(`${file.path}: missing`);
      continue;
    }
    const current = sha256File(absolute);
    if (current !== file.sha256) mismatches.push(`${file.path}: sha256 mismatch`);
  }
  return mismatches;
}

function normalizeRows(rows, label) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${label} rows are empty`);
  const parsed = rows.map((row) => ({
    date: row.date,
    open: Number(row.open),
    close: Number(row.close),
    high: Number(row.high),
    low: Number(row.low),
    volume: Number(row.volume)
  }));
  for (const row of parsed) {
    assertDate(row.date, `${label}.date`);
    if (![row.open, row.close, row.high, row.low, row.volume].every(Number.isFinite)) throw new Error(`${label} has invalid numeric row ${JSON.stringify(row)}`);
    if (!(row.open > 0 && row.close > 0 && row.high > 0 && row.low > 0 && row.volume >= 0)) throw new Error(`${label} has non-positive price or negative volume`);
  }
  parsed.sort((a, b) => a.date.localeCompare(b.date));
  const dates = new Set();
  for (const row of parsed) {
    if (dates.has(row.date)) throw new Error(`${label} duplicates date ${row.date}`);
    dates.add(row.date);
  }
  return parsed;
}

function returnAfterCost(entryOpen, exitClose, oneWayCostRate) {
  return exitClose / entryOpen * (1 - oneWayCostRate) / (1 + oneWayCostRate) - 1;
}

function maxCloseDrawdown(entryOpen, rows, oneWayCostRate) {
  const values = [{ date: 'entry', value: 1 }, ...rows.map((row) => ({
    date: row.date,
    value: row.close / entryOpen * (1 - oneWayCostRate) / (1 + oneWayCostRate)
  }))];
  let peak = values[0].value;
  let maxDrawdown = 0;
  let activePeakDate = values[0].date;
  let peakDate = values[0].date;
  let troughDate = values[0].date;
  for (const point of values) {
    if (point.value > peak) {
      peak = point.value;
      activePeakDate = point.date;
    }
    const drawdown = point.value / peak - 1;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      peakDate = activePeakDate;
      troughDate = point.date;
    }
  }
  return { value: maxDrawdown, peakDate, troughDate };
}

function entryExecutionCheck(unadjustedRows, entryDate, limitRate) {
  const index = unadjustedRows.findIndex((row) => row.date === entryDate);
  if (index < 1) return { status: 'unverified', reason: 'missing prior unadjusted bar', suspended: null, onePriceLimitUp: null };
  const row = unadjustedRows[index];
  const previous = unadjustedRows[index - 1];
  const suspended = row.volume <= 0;
  const onePrice = row.open === row.high && row.high === row.low && row.low === row.close;
  const move = row.open / previous.close - 1;
  const onePriceLimitUp = Number.isFinite(limitRate) ? onePrice && move >= limitRate - 0.005 : false;
  return {
    status: suspended || onePriceLimitUp ? 'blocked' : 'unverified',
    reason: suspended ? 'zero-volume daily bar' : onePriceLimitUp ? 'one-price limit-up proxy' : 'daily bars cannot prove open-price fill',
    suspended,
    onePriceLimitUp,
    moveFromPreviousClose: move
  };
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function summarizeOutcomes(results, horizon) {
  const eligible = results.filter((result) => result.horizons[String(horizon)]);
  if (!eligible.length) {
    return {
      count: 0, meanNetReturn: null, medianNetReturn: null, meanExcessReturn: null,
      medianExcessReturn: null, excessHitRate: null, positiveReturnRate: null,
      matchedControlCount: 0, meanMatchedControlExcess: null,
      medianMatchedControlExcess: null, matchedControlHitRate: null,
      bestControlCount: 0, meanExcessVsBestControl: null,
      medianExcessVsBestControl: null, winsAllControlsRate: null,
      meanRankPercentile: null, blockedEntryCount: 0
    };
  }
  const values = eligible.map((result) => result.horizons[String(horizon)]);
  const excess = values.map((value) => value.excessReturn);
  const net = values.map((value) => value.netReturn);
  const matched = values.map((value) => value.matchedControlExcess).filter(Number.isFinite);
  const bestControlExcess = values.map((value) => value.excessVsBestControl).filter(Number.isFinite);
  const winsAll = values.map((value) => value.winsAllControls).filter((value) => typeof value === 'boolean');
  const rankPercentiles = values.map((value) => value.rankPercentile).filter(Number.isFinite);
  return {
    count: values.length,
    meanNetReturn: mean(net),
    medianNetReturn: median(net),
    meanExcessReturn: mean(excess),
    medianExcessReturn: median(excess),
    excessHitRate: excess.filter((value) => value > 0).length / excess.length,
    positiveReturnRate: net.filter((value) => value > 0).length / net.length,
    matchedControlCount: matched.length,
    meanMatchedControlExcess: mean(matched),
    medianMatchedControlExcess: median(matched),
    matchedControlHitRate: matched.length ? matched.filter((value) => value > 0).length / matched.length : null,
    bestControlCount: bestControlExcess.length,
    meanExcessVsBestControl: mean(bestControlExcess),
    medianExcessVsBestControl: median(bestControlExcess),
    winsAllControlsRate: winsAll.length ? winsAll.filter(Boolean).length / winsAll.length : null,
    meanRankPercentile: mean(rankPercentiles),
    blockedEntryCount: eligible.filter((result) => result.execution.status === 'blocked').length
  };
}

function aggregateByHypothesis(results, horizons) {
  const grouped = new Map();
  for (const result of results) {
    if (!grouped.has(result.hypothesisId)) grouped.set(result.hypothesisId, []);
    grouped.get(result.hypothesisId).push(result);
  }
  const hypothesisResults = [];
  for (const [hypothesisId, members] of grouped.entries()) {
    const horizonValues = {};
    for (const horizon of horizons) {
      const outcomes = members.map((member) => member.horizons[String(horizon)]).filter(Boolean);
      if (!outcomes.length) continue;
      horizonValues[String(horizon)] = {
        netReturn: mean(outcomes.map((value) => value.netReturn)),
        excessReturn: mean(outcomes.map((value) => value.excessReturn))
      };
    }
    hypothesisResults.push({
      hypothesisId,
      states: [...new Set(members.map((member) => member.state).filter(Boolean))],
      hypothesisStates: [...new Set(members.map((member) => member.hypothesisState).filter(Boolean))],
      selectionStates: [...new Set(members.map((member) => member.selectionState).filter(Boolean))],
      tickerCount: members.length,
      horizons: horizonValues
    });
  }
  const aggregate = {};
  for (const horizon of horizons) {
    const rows = hypothesisResults.map((item) => item.horizons[String(horizon)]).filter(Boolean);
    const excess = rows.map((row) => row.excessReturn);
    const net = rows.map((row) => row.netReturn);
    aggregate[String(horizon)] = {
      count: rows.length,
      meanNetReturn: mean(net),
      medianNetReturn: median(net),
      meanExcessReturn: mean(excess),
      medianExcessReturn: median(excess),
      excessHitRate: rows.length ? excess.filter((value) => value > 0).length / rows.length : null,
      positiveReturnRate: rows.length ? net.filter((value) => value > 0).length / rows.length : null
    };
  }
  return { hypothesisResults, aggregate };
}

function summarizeHypothesisMemos(manifest, memosByPath) {
  const paths = ['1.2', '1.3', '1.4'].includes(manifest?.schemaVersion)
    ? (manifest.hypothesisMemoPaths ?? [])
    : [...new Set(manifest.selections.map((selection) => selection.memoPath))];
  const rows = paths.map((memoPath) => {
    const memo = memosByPath[memoPath];
    if (!memo) throw new Error(`missing hypothesis memo ${memoPath}`);
    return {
      memoPath,
      hypothesisId: memo.hypothesisId,
      hypothesisState: memo.hypothesisState ?? null,
      selectionState: memo.selectionState ?? memo.state ?? null,
      actionableAt: memo.actionableAt ?? null
    };
  });
  const countBy = (field, value) => rows.filter((row) => row[field] === value).length;
  return {
    count: rows.length,
    highPriorityHypothesisCount: countBy('hypothesisState', 'High-priority hypothesis'),
    researchHypothesisCount: countBy('hypothesisState', 'Research hypothesis'),
    noSelectionCount: countBy('selectionState', 'No selection'),
    researchSelectionCount: countBy('selectionState', 'Research selection'),
    highPrioritySelectionCount: countBy('selectionState', 'High-priority selection'),
    rows
  };
}

function evaluateRun(manifest, memosByPath, prices) {
  const standardHorizons = manifest.outcomePolicy.holdingTradingDays;
  const cost = manifest.outcomePolicy.oneWayCostRate;
  const isV12 = ['1.2', '1.3', '1.4'].includes(manifest.schemaVersion);
  const primaryStates = isV12
    ? (manifest.primarySelectionStates ?? [])
    : (manifest.primarySignalStates ?? manifest.trackedMemoStates ?? manifest.eligibleMemoStates ?? []);
  const benchmarkTicker = manifest.benchmark.ticker;
  const benchmarkSeries = prices?.series?.[benchmarkTicker];
  if (!benchmarkSeries) throw new Error(`missing benchmark price series ${benchmarkTicker}`);
  const benchmarkRows = normalizeRows(benchmarkSeries.adjusted ?? benchmarkSeries, benchmarkTicker);
  const results = [];

  for (const selection of manifest.selections) {
    const memo = memosByPath[selection.memoPath];
    if (!memo) throw new Error(`missing memo ${selection.memoPath}`);
    const signalState = isV12 ? memo.selectionState : memo.state;
    const isPrimarySignal = primaryStates.includes(signalState);
    const entryAnchorAt = isPrimarySignal ? memo.actionableAt : memo.researchReadyAt;
    if (!entryAnchorAt) throw new Error(`${selection.memoPath} lacks required entry anchor`);
    const entryAnchorDate = entryAnchorAt.slice(0, 10);
    const instrument = prices?.series?.[selection.ticker];
    if (!instrument) throw new Error(`missing price series ${selection.ticker}`);
    const adjusted = normalizeRows(instrument.adjusted ?? instrument, `${selection.ticker}.adjusted`);
    const unadjusted = normalizeRows(instrument.unadjusted ?? instrument.adjusted ?? instrument, `${selection.ticker}.unadjusted`);
    const entryBenchmarkIndex = benchmarkRows.findIndex((row) => row.date > entryAnchorDate);
    if (entryBenchmarkIndex < 0) throw new Error(`no benchmark trading day after ${entryAnchorDate}`);
    const entryDate = benchmarkRows[entryBenchmarkIndex].date;
    const entry = adjusted.find((row) => row.date === entryDate);
    if (!entry) throw new Error(`${selection.ticker} lacks entry bar ${entryDate}`);
    const execution = entryExecutionCheck(unadjusted, entryDate, selection.limitRate);
    const realization = memo.expectedRealization;
    const horizons = [...new Set([
      ...standardHorizons,
      realization.earliestTradingDays,
      realization.baseTradingDays,
      realization.latestTradingDays
    ])].sort((a, b) => a - b);
    const outcome = {};
    const pendingHorizons = [];

    for (const holdingDays of horizons) {
      const exitBenchmark = benchmarkRows[entryBenchmarkIndex + holdingDays - 1];
      if (!exitBenchmark) {
        pendingHorizons.push({
          holdingDays,
          status: 'pending',
          reason: 'benchmark_horizon_not_yet_mature',
          availableTradingDays: Math.max(0, benchmarkRows.length - entryBenchmarkIndex)
        });
        continue;
      }
      const exitDate = exitBenchmark.date;
      const exit = adjusted.find((row) => row.date === exitDate);
      if (!exit) throw new Error(`${selection.ticker} lacks exit bar ${exitDate}`);
      const pathRows = adjusted.filter((row) => row.date >= entryDate && row.date <= exitDate);
      if (pathRows.length !== holdingDays) throw new Error(`${selection.ticker} has ${pathRows.length} aligned rows, expected ${holdingDays}`);
      const netReturn = returnAfterCost(entry.open, exit.close, cost);
      const benchmarkReturn = exitBenchmark.close / benchmarkRows[entryBenchmarkIndex].open - 1;
      const controlReturns = [];
      for (const control of memo.matchedControls ?? []) {
        const controlSeries = prices?.series?.[control.ticker];
        if (!controlSeries) throw new Error(`missing matched-control price series ${control.ticker}`);
        const controlRows = normalizeRows(controlSeries.adjusted ?? controlSeries, `${control.ticker}.adjusted`);
        const controlEntry = controlRows.find((row) => row.date === entryDate);
        const controlExit = controlRows.find((row) => row.date === exitDate);
        if (!controlEntry || !controlExit) throw new Error(`${control.ticker} lacks aligned control bars ${entryDate} -> ${exitDate}`);
        controlReturns.push({
          ticker: control.ticker,
          controlType: control.controlType,
          netReturn: returnAfterCost(controlEntry.open, controlExit.close, cost)
        });
      }
      const matchedControlBasketReturn = controlReturns.length ? mean(controlReturns.map((item) => item.netReturn)) : null;
      const matchedControlExcess = Number.isFinite(matchedControlBasketReturn) ? netReturn - matchedControlBasketReturn : null;
      const bestControl = controlReturns.length
        ? [...controlReturns].sort((a, b) => b.netReturn - a.netReturn || a.ticker.localeCompare(b.ticker))[0]
        : null;
      const bestControlReturn = bestControl?.netReturn ?? null;
      const excessVsBestControl = Number.isFinite(bestControlReturn) ? netReturn - bestControlReturn : null;
      const winsAllControls = controlReturns.length ? controlReturns.every((item) => netReturn > item.netReturn) : null;
      const ranked = [{ ticker: selection.ticker, netReturn, selected: true }, ...controlReturns.map((item) => ({ ...item, selected: false }))]
        .sort((a, b) => b.netReturn - a.netReturn || a.ticker.localeCompare(b.ticker));
      const selectedRank = ranked.findIndex((item) => item.selected) + 1;
      const rankPercentile = ranked.length > 1 ? (ranked.length - selectedRank) / (ranked.length - 1) : null;
      outcome[String(holdingDays)] = {
        exitDate,
        netReturn,
        benchmarkReturn,
        excessReturn: netReturn - benchmarkReturn,
        matchedControlBasketReturn,
        matchedControlExcess,
        bestControlTicker: bestControl?.ticker ?? null,
        bestControlReturn,
        excessVsBestControl,
        winsAllControls,
        selectedRank,
        matchedSetSize: ranked.length,
        rankPercentile,
        controlReturns,
        closePathMaxDrawdown: maxCloseDrawdown(entry.open, pathRows, cost)
      };
    }

    results.push({
      hypothesisId: selection.hypothesisId,
      ticker: selection.ticker,
      memoPath: selection.memoPath,
      state: signalState,
      hypothesisState: memo.hypothesisState ?? null,
      selectionState: memo.selectionState ?? null,
      selectionComparison: memo.selectionComparison ?? null,
      isPrimarySignal,
      researchReadyAt: memo.researchReadyAt,
      actionableAt: memo.actionableAt ?? null,
      entryAnchorAt,
      entryDate,
      entryAdjustedOpen: entry.open,
      expectedRealization: realization,
      matchedControls: memo.matchedControls ?? [],
      matchedControlException: memo.matchedControlException ?? null,
      execution,
      horizons: outcome,
      pendingHorizons,
      thesisBaseOutcome: outcome[String(realization.baseTradingDays)] ?? null
    });
  }

  const allHorizons = [...new Set(results.flatMap((result) => Object.keys(result.horizons).map(Number)))].sort((a, b) => a - b);
  const tickerLevel = Object.fromEntries(allHorizons.map((horizon) => [String(horizon), summarizeOutcomes(results, horizon)]));
  const primaryResults = results.filter((result) => result.isPrimarySignal);
  const primaryTickerLevel = Object.fromEntries(allHorizons.map((horizon) => [String(horizon), summarizeOutcomes(primaryResults, horizon)]));
  const hypothesisLevel = aggregateByHypothesis(results, allHorizons);
  const primaryHypothesisLevel = aggregateByHypothesis(primaryResults, allHorizons);
  const primaryBaseResults = primaryResults.filter((result) => result.thesisBaseOutcome);
  const primaryBaseExcess = primaryBaseResults.map((result) => result.thesisBaseOutcome.excessReturn);
  const primaryBaseNet = primaryBaseResults.map((result) => result.thesisBaseOutcome.netReturn);
  const primaryBaseMatched = primaryBaseResults.map((result) => result.thesisBaseOutcome.matchedControlExcess).filter(Number.isFinite);
  const primaryBaseBest = primaryBaseResults.map((result) => result.thesisBaseOutcome.excessVsBestControl).filter(Number.isFinite);
  const primaryBaseWinsAll = primaryBaseResults.map((result) => result.thesisBaseOutcome.winsAllControls).filter((value) => typeof value === 'boolean');
  const primaryBaseRanks = primaryBaseResults.map((result) => result.thesisBaseOutcome.rankPercentile).filter(Number.isFinite);

  const primaryOpportunityLevel = aggregateByHypothesis(primaryBaseResults, [manifest.outcomePolicy.holdingTradingDays.includes(60) ? 60 : manifest.outcomePolicy.holdingTradingDays[0]]);
  const primaryOpportunityBaseRows = primaryOpportunityLevel.hypothesisResults
    .map((item) => {
      const horizon = String(manifest.outcomePolicy.holdingTradingDays.includes(60) ? 60 : manifest.outcomePolicy.holdingTradingDays[0]);
      return item.horizons[horizon] ? { hypothesisId: item.hypothesisId, ...item.horizons[horizon] } : null;
    })
    .filter(Boolean);

  return {
    hypothesisMemoSummary: summarizeHypothesisMemos(manifest, memosByPath),
    results,
    aggregate: {
      tickerLevel,
      hypothesisLevel: hypothesisLevel.aggregate,
      primaryTickerLevel,
      primaryHypothesisLevel: primaryHypothesisLevel.aggregate,
      primaryThesisBase: {
        count: primaryBaseResults.length,
        pendingBaseCount: primaryResults.length - primaryBaseResults.length,
        meanNetReturn: mean(primaryBaseNet),
        medianNetReturn: median(primaryBaseNet),
        meanExcessReturn: mean(primaryBaseExcess),
        medianExcessReturn: median(primaryBaseExcess),
        excessHitRate: primaryBaseResults.length ? primaryBaseExcess.filter((value) => value > 0).length / primaryBaseResults.length : null,
        matchedControlCount: primaryBaseMatched.length,
        meanMatchedControlExcess: mean(primaryBaseMatched),
        medianMatchedControlExcess: median(primaryBaseMatched),
        matchedControlHitRate: primaryBaseMatched.length ? primaryBaseMatched.filter((value) => value > 0).length / primaryBaseMatched.length : null,
        bestControlCount: primaryBaseBest.length,
        meanExcessVsBestControl: mean(primaryBaseBest),
        medianExcessVsBestControl: median(primaryBaseBest),
        winsAllControlsRate: primaryBaseWinsAll.length ? primaryBaseWinsAll.filter(Boolean).length / primaryBaseWinsAll.length : null,
        meanRankPercentile: mean(primaryBaseRanks)
      },
      opportunityFirstBase: {
        count: primaryOpportunityBaseRows.length,
        directionCaptureRate: primaryOpportunityBaseRows.length
          ? primaryOpportunityBaseRows.filter((row) => row.excessReturn > 0).length / primaryOpportunityBaseRows.length
          : null,
        positiveBasketRate: primaryOpportunityBaseRows.length
          ? primaryOpportunityBaseRows.filter((row) => row.netReturn > 0).length / primaryOpportunityBaseRows.length
          : null,
        meanOpportunityExcessReturn: mean(primaryOpportunityBaseRows.map((row) => row.excessReturn)),
        medianOpportunityExcessReturn: median(primaryOpportunityBaseRows.map((row) => row.excessReturn))
      }
    },
    hypothesisResults: hypothesisLevel.hypothesisResults,
    primaryHypothesisResults: primaryHypothesisLevel.hypothesisResults
  };
}

module.exports = {
  classifyCompanyPriceDislocation,
  evaluateRun,
  lockRun,
  maxCloseDrawdown,
  readJson,
  returnAfterCost,
  sha256File,
  validateManifest,
  validateMemoEvidenceRefs,
  validateOpportunityMemo,
  validateScreening,
  validateIdentityStress,
  verifyLock
};
