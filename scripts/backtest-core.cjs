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
  if (!['1.0', '1.1', '1.2'].includes(manifest?.schemaVersion)) errors.push('schemaVersion must be 1.0, 1.1 or 1.2');
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
  if (manifest?.schemaVersion === '1.2') {
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
  if (manifest?.schemaVersion === '1.2') {
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
  if (manifest?.evaluationMode === 'historical_replay') {
    if (!manifest?.contaminationControls?.modelMemoryRisk) errors.push('historical_replay requires contaminationControls.modelMemoryRisk');
    if (!manifest?.contaminationControls?.sourcePackPath) errors.push('historical_replay requires contaminationControls.sourcePackPath');
    if (['1.1', '1.2'].includes(manifest?.schemaVersion) && !manifest?.contaminationControls?.identityStressPath) {
      errors.push('schemaVersion 1.1/1.2 historical replay requires contaminationControls.identityStressPath');
    }
  }
  return errors;
}

function validateScreening(screening, manifest) {
  const errors = [];
  if (!['1.1', '1.2'].includes(manifest?.schemaVersion)) return errors;
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
  if (!['1.1', '1.2'].includes(manifest?.schemaVersion) || manifest?.evaluationMode !== 'historical_replay') return errors;
  if (stress?.runId !== manifest.runId) errors.push('identity stress runId must match manifest.runId');
  if (!['passed', 'failed', 'not_feasible'].includes(stress?.status)) {
    errors.push('identity stress status must be passed, failed or not_feasible');
  }
  if (stress?.performedBeforeReveal !== true) errors.push('identity stress must be performedBeforeReveal');
  if (typeof stress?.method !== 'string' || !stress.method) errors.push('identity stress method is required');
  return errors;
}

function validateOpportunityMemo(memo, memoPath, manifest) {
  const errors = [];
  if (manifest?.schemaVersion !== '1.2') return errors;

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

  return errors;
}

function validateMemoForSelection(memo, selection, manifest) {
  const errors = [];
  const isV12 = manifest?.schemaVersion === '1.2';
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

  if (primary && ['1.1', '1.2'].includes(manifest?.schemaVersion)) {
    const exception = typeof memo?.matchedControlException === 'string' && memo.matchedControlException.trim();
    if ((controls.length < 2 || controls.length > 5) && !exception) {
      errors.push(`${selection.memoPath} primary signal requires 2-5 matched controls or matchedControlException`);
    }
  }

  if (isV12 && memo?.selectionState !== 'No selection') {
    const comparison = memo?.selectionComparison;
    if (!comparison || comparison.selectedTicker !== selection.ticker) {
      errors.push(`${selection.memoPath} selectionComparison.selectedTicker must match selected ticker`);
    } else {
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

  if (manifest.evaluationMode === 'historical_replay') {
    const sourcePackPath = resolveInside(root, manifest.contaminationControls.sourcePackPath);
    files.push({ role: 'source_pack', path: manifest.contaminationControls.sourcePackPath, sha256: sha256File(sourcePackPath) });
    if (['1.1', '1.2'].includes(manifest.schemaVersion)) {
      const identityStressPath = resolveInside(root, manifest.contaminationControls.identityStressPath);
      const identityStress = readJson(identityStressPath);
      const identityErrors = validateIdentityStress(identityStress, manifest);
      if (identityErrors.length) throw new Error(`invalid identity stress:\n- ${identityErrors.join('\n- ')}`);
      files.push({ role: 'identity_stress', path: manifest.contaminationControls.identityStressPath, sha256: sha256File(identityStressPath) });
    }
  }

  const seenMemoPaths = new Set();
  if (manifest.schemaVersion === '1.2') {
    const seenHypothesisIds = new Set();
    for (const memoRelativePath of manifest.hypothesisMemoPaths) {
      if (seenMemoPaths.has(memoRelativePath)) throw new Error(`duplicate hypothesisMemoPath: ${memoRelativePath}`);
      const memoPath = resolveInside(root, memoRelativePath);
      const memo = readJson(memoPath);
      const memoErrors = validateOpportunityMemo(memo, memoRelativePath, manifest);
      if (memoErrors.length) throw new Error(`invalid opportunity memo:\n- ${memoErrors.join('\n- ')}`);
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
  const paths = manifest?.schemaVersion === '1.2'
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
  const isV12 = manifest.schemaVersion === '1.2';
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

    for (const holdingDays of horizons) {
      const exitBenchmark = benchmarkRows[entryBenchmarkIndex + holdingDays - 1];
      if (!exitBenchmark) throw new Error(`benchmark lacks ${holdingDays}-day horizon after ${entryDate}`);
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
      thesisBaseOutcome: outcome[String(realization.baseTradingDays)]
    });
  }

  const allHorizons = [...new Set(results.flatMap((result) => Object.keys(result.horizons).map(Number)))].sort((a, b) => a - b);
  const tickerLevel = Object.fromEntries(allHorizons.map((horizon) => [String(horizon), summarizeOutcomes(results, horizon)]));
  const primaryResults = results.filter((result) => result.isPrimarySignal);
  const primaryTickerLevel = Object.fromEntries(allHorizons.map((horizon) => [String(horizon), summarizeOutcomes(primaryResults, horizon)]));
  const hypothesisLevel = aggregateByHypothesis(results, allHorizons);
  const primaryHypothesisLevel = aggregateByHypothesis(primaryResults, allHorizons);
  const primaryBaseExcess = primaryResults.map((result) => result.thesisBaseOutcome.excessReturn);
  const primaryBaseNet = primaryResults.map((result) => result.thesisBaseOutcome.netReturn);
  const primaryBaseMatched = primaryResults.map((result) => result.thesisBaseOutcome.matchedControlExcess).filter(Number.isFinite);
  const primaryBaseBest = primaryResults.map((result) => result.thesisBaseOutcome.excessVsBestControl).filter(Number.isFinite);
  const primaryBaseWinsAll = primaryResults.map((result) => result.thesisBaseOutcome.winsAllControls).filter((value) => typeof value === 'boolean');
  const primaryBaseRanks = primaryResults.map((result) => result.thesisBaseOutcome.rankPercentile).filter(Number.isFinite);

  return {
    hypothesisMemoSummary: summarizeHypothesisMemos(manifest, memosByPath),
    results,
    aggregate: {
      tickerLevel,
      hypothesisLevel: hypothesisLevel.aggregate,
      primaryTickerLevel,
      primaryHypothesisLevel: primaryHypothesisLevel.aggregate,
      primaryThesisBase: {
        count: primaryResults.length,
        meanNetReturn: mean(primaryBaseNet),
        medianNetReturn: median(primaryBaseNet),
        meanExcessReturn: mean(primaryBaseExcess),
        medianExcessReturn: median(primaryBaseExcess),
        excessHitRate: primaryResults.length ? primaryBaseExcess.filter((value) => value > 0).length / primaryResults.length : null,
        matchedControlCount: primaryBaseMatched.length,
        meanMatchedControlExcess: mean(primaryBaseMatched),
        medianMatchedControlExcess: median(primaryBaseMatched),
        matchedControlHitRate: primaryBaseMatched.length ? primaryBaseMatched.filter((value) => value > 0).length / primaryBaseMatched.length : null,
        bestControlCount: primaryBaseBest.length,
        meanExcessVsBestControl: mean(primaryBaseBest),
        medianExcessVsBestControl: median(primaryBaseBest),
        winsAllControlsRate: primaryBaseWinsAll.length ? primaryBaseWinsAll.filter(Boolean).length / primaryBaseWinsAll.length : null,
        meanRankPercentile: mean(primaryBaseRanks)
      }
    },
    hypothesisResults: hypothesisLevel.hypothesisResults,
    primaryHypothesisResults: primaryHypothesisLevel.hypothesisResults
  };
}

module.exports = {
  evaluateRun,
  lockRun,
  maxCloseDrawdown,
  readJson,
  returnAfterCost,
  sha256File,
  validateManifest,
  validateOpportunityMemo,
  validateScreening,
  validateIdentityStress,
  verifyLock
};
