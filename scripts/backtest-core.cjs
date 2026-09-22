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
  if (manifest?.schemaVersion !== '1.0') errors.push('schemaVersion must be 1.0');
  if (!/^[A-Za-z0-9._-]+$/.test(manifest?.runId ?? '')) errors.push('runId must use letters, numbers, dot, underscore or dash');
  if (!['historical_replay', 'forward'].includes(manifest?.evaluationMode)) errors.push('evaluationMode must be historical_replay or forward');
  try { assertIso(manifest?.createdAt, 'createdAt'); } catch (error) { errors.push(error.message); }
  if (!manifest?.skill?.path) errors.push('skill.path is required');
  if (!manifest?.skill?.version) errors.push('skill.version is required');
  if (!manifest?.model?.name) errors.push('model.name is required');
  if (!manifest?.screeningPath) errors.push('screeningPath is required');
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
  if (!Array.isArray(manifest?.eligibleMemoStates) || manifest.eligibleMemoStates.length === 0) errors.push('eligibleMemoStates must be non-empty');
  if (!Array.isArray(manifest?.selections) || manifest.selections.length === 0) errors.push('selections must be non-empty');
  if (manifest?.evaluationMode === 'historical_replay') {
    if (!manifest?.contaminationControls?.modelMemoryRisk) errors.push('historical_replay requires contaminationControls.modelMemoryRisk');
    if (!manifest?.contaminationControls?.sourcePackPath) errors.push('historical_replay requires contaminationControls.sourcePackPath');
  }
  return errors;
}

function validateMemoForSelection(memo, selection, manifest) {
  const errors = [];
  try { assertIso(memo?.cutoffAt, `${selection.memoPath}.cutoffAt`); } catch (error) { errors.push(error.message); }
  if (memo?.skillVersion !== manifest.skill.version) errors.push(`${selection.memoPath} skillVersion does not match manifest`);
  if (memo?.hypothesisId !== selection.hypothesisId) errors.push(`${selection.memoPath} hypothesisId does not match selection`);
  if (!manifest.eligibleMemoStates.includes(memo?.state)) errors.push(`${selection.memoPath} state ${memo?.state} is not eligible`);
  const candidates = Array.isArray(memo?.aShareCandidates) ? memo.aShareCandidates : [];
  if (!candidates.some((candidate) => candidate?.ticker === selection.ticker)) errors.push(`${selection.memoPath} does not contain selected ticker ${selection.ticker}`);
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
  files.push({ role: 'screening', path: manifest.screeningPath, sha256: sha256File(screeningPath) });

  if (manifest.evaluationMode === 'historical_replay') {
    const sourcePackPath = resolveInside(root, manifest.contaminationControls.sourcePackPath);
    files.push({ role: 'source_pack', path: manifest.contaminationControls.sourcePackPath, sha256: sha256File(sourcePackPath) });
  }

  const seenMemoPaths = new Set();
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

function evaluateRun(manifest, memosByPath, prices) {
  const horizons = manifest.outcomePolicy.holdingTradingDays;
  const cost = manifest.outcomePolicy.oneWayCostRate;
  const benchmarkTicker = manifest.benchmark.ticker;
  const benchmarkSeries = prices?.series?.[benchmarkTicker];
  if (!benchmarkSeries) throw new Error(`missing benchmark price series ${benchmarkTicker}`);
  const benchmarkRows = normalizeRows(benchmarkSeries.adjusted ?? benchmarkSeries, benchmarkTicker);
  const results = [];

  for (const selection of manifest.selections) {
    const memo = memosByPath[selection.memoPath];
    if (!memo) throw new Error(`missing memo ${selection.memoPath}`);
    const cutoffDate = memo.cutoffAt.slice(0, 10);
    const instrument = prices?.series?.[selection.ticker];
    if (!instrument) throw new Error(`missing price series ${selection.ticker}`);
    const adjusted = normalizeRows(instrument.adjusted ?? instrument, `${selection.ticker}.adjusted`);
    const unadjusted = normalizeRows(instrument.unadjusted ?? instrument.adjusted ?? instrument, `${selection.ticker}.unadjusted`);
    const entryBenchmarkIndex = benchmarkRows.findIndex((row) => row.date > cutoffDate);
    if (entryBenchmarkIndex < 0) throw new Error(`no benchmark trading day after ${cutoffDate}`);
    const entryDate = benchmarkRows[entryBenchmarkIndex].date;
    const entry = adjusted.find((row) => row.date === entryDate);
    if (!entry) throw new Error(`${selection.ticker} lacks entry bar ${entryDate}`);
    const execution = entryExecutionCheck(unadjusted, entryDate, selection.limitRate);
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
      outcome[String(holdingDays)] = {
        exitDate,
        netReturn,
        benchmarkReturn,
        excessReturn: netReturn - benchmarkReturn,
        closePathMaxDrawdown: maxCloseDrawdown(entry.open, pathRows, cost)
      };
    }

    results.push({
      hypothesisId: selection.hypothesisId,
      ticker: selection.ticker,
      memoPath: selection.memoPath,
      cutoffAt: memo.cutoffAt,
      entryDate,
      entryAdjustedOpen: entry.open,
      execution,
      horizons: outcome
    });
  }

  const aggregate = {};
  for (const holdingDays of horizons) {
    const values = results.map((result) => result.horizons[String(holdingDays)]);
    const excess = values.map((value) => value.excessReturn);
    const net = values.map((value) => value.netReturn);
    aggregate[String(holdingDays)] = {
      count: values.length,
      meanNetReturn: mean(net),
      medianNetReturn: median(net),
      meanExcessReturn: mean(excess),
      medianExcessReturn: median(excess),
      excessHitRate: excess.filter((value) => value > 0).length / excess.length,
      positiveReturnRate: net.filter((value) => value > 0).length / net.length,
      blockedEntryCount: results.filter((result) => result.execution.status === 'blocked').length
    };
  }

  return { results, aggregate };
}

module.exports = {
  evaluateRun,
  lockRun,
  maxCloseDrawdown,
  readJson,
  returnAfterCost,
  sha256File,
  validateManifest,
  verifyLock
};
