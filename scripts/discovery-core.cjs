const fs = require('node:fs');
const path = require('node:path');

function assertIso(value, label, errors) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) {
    errors.push(`${label} must be an ISO timestamp`);
    return false;
  }
  return true;
}

function uniq(values) {
  return [...new Set(values)];
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function validateDiscoveryPack(pack, manifest) {
  const errors = [];
  if (pack?.schemaVersion !== '2.0') errors.push('discovery source pack schemaVersion must be 2.0');
  if (pack?.runId !== manifest?.runId) errors.push('discovery source pack runId must match manifest.runId');
  const cutoffValid = assertIso(pack?.cutoffAt, 'discovery source pack cutoffAt', errors);

  const lanes = Array.isArray(pack?.lanes) ? pack.lanes : [];
  if (!lanes.length) errors.push('discovery source pack lanes must be non-empty');
  const laneIds = new Set();
  let coveredLaneCount = 0;
  for (const lane of lanes) {
    if (typeof lane?.laneId !== 'string' || !lane.laneId) {
      errors.push('every discovery lane requires laneId');
      continue;
    }
    if (laneIds.has(lane.laneId)) errors.push(`duplicate discovery lane ${lane.laneId}`);
    laneIds.add(lane.laneId);
    if (!['complete', 'partial', 'unavailable'].includes(lane?.coverageStatus)) {
      errors.push(`discovery lane ${lane.laneId} has invalid coverageStatus`);
    }
    if (lane.coverageStatus === 'complete' || lane.coverageStatus === 'partial') coveredLaneCount += 1;
    if (lane.coverageStatus !== 'complete' && (typeof lane?.limitations !== 'string' || !lane.limitations.trim())) {
      errors.push(`discovery lane ${lane.laneId} requires limitations when not complete`);
    }
    if (typeof lane?.purpose !== 'string' || !lane.purpose.trim()) {
      errors.push(`discovery lane ${lane.laneId} requires purpose`);
    }
  }

  const policy = manifest?.discoveryPolicy;
  if (!policy || typeof policy !== 'object') {
    errors.push('schemaVersion 1.4 requires discoveryPolicy');
  } else {
    if (!Array.isArray(policy.requiredLanes) || !policy.requiredLanes.length) {
      errors.push('discoveryPolicy.requiredLanes must be non-empty');
    } else {
      for (const laneId of policy.requiredLanes) {
        if (!laneIds.has(laneId)) errors.push(`required discovery lane missing from pack: ${laneId}`);
      }
    }
    if (!Number.isInteger(policy.minimumCoveredLanes) || policy.minimumCoveredLanes < 1) {
      errors.push('discoveryPolicy.minimumCoveredLanes must be a positive integer');
    } else if (coveredLaneCount < policy.minimumCoveredLanes) {
      errors.push(`only ${coveredLaneCount} discovery lanes are covered; minimum is ${policy.minimumCoveredLanes}`);
    }
    if (policy.screeningTarget !== 'event_cluster') {
      errors.push('discoveryPolicy.screeningTarget must be event_cluster');
    }
    const audit = policy.postOutcomeMissAudit;
    if (!audit || typeof audit !== 'object') {
      errors.push('discoveryPolicy.postOutcomeMissAudit is required');
    } else {
      for (const field of ['candidateUniverse', 'candidateRule', 'causalEligibilityRule']) {
        if (typeof audit[field] !== 'string' || !audit[field].trim()) {
          errors.push(`discoveryPolicy.postOutcomeMissAudit.${field} is required`);
        }
      }
      if (audit.samePeriodMayTuneSkill !== false) {
        errors.push('postOutcomeMissAudit.samePeriodMayTuneSkill must be false');
      }
    }
  }

  const items = Array.isArray(pack?.sourceItems) ? pack.sourceItems : [];
  const itemMap = new Map();
  for (const item of items) {
    if (typeof item?.itemId !== 'string' || !item.itemId) {
      errors.push('every discovery source item requires itemId');
      continue;
    }
    if (itemMap.has(item.itemId)) errors.push(`duplicate discovery source item ${item.itemId}`);
    itemMap.set(item.itemId, item);
    if (!laneIds.has(item.laneId)) errors.push(`source item ${item.itemId} references unknown lane ${item.laneId}`);
    if (typeof item?.originGroup !== 'string' || !item.originGroup) {
      errors.push(`source item ${item.itemId} requires originGroup`);
    }
    if (!['primary', 'first_party', 'industry_data', 'reputable_news', 'specialist', 'community', 'unknown'].includes(item?.sourceType)) {
      errors.push(`source item ${item.itemId} has invalid sourceType`);
    }
    if (!['original', 'repost', 'commentary', 'dataset', 'filing', 'unknown'].includes(item?.contentKind)) {
      errors.push(`source item ${item.itemId} has invalid contentKind`);
    }
    const pubOk = assertIso(item?.publishedAt, `source item ${item.itemId}.publishedAt`, errors);
    const availOk = assertIso(item?.availableAt, `source item ${item.itemId}.availableAt`, errors);
    if (pubOk && availOk && Date.parse(item.availableAt) < Date.parse(item.publishedAt)) {
      errors.push(`source item ${item.itemId} availableAt must not be before publishedAt`);
    }
    if (cutoffValid && availOk && Date.parse(item.availableAt) > Date.parse(pack.cutoffAt)) {
      errors.push(`source item ${item.itemId} is post-cutoff`);
    }
    if (item?.contentKind === 'repost' && (typeof item?.derivativeOf !== 'string' || !item.derivativeOf)) {
      errors.push(`repost source item ${item.itemId} requires derivativeOf`);
    }
  }
  for (const item of items) {
    if (item?.derivativeOf && !itemMap.has(item.derivativeOf)) {
      errors.push(`source item ${item.itemId} derivativeOf references missing item ${item.derivativeOf}`);
    }
  }

  const events = Array.isArray(pack?.eventClusters) ? pack.eventClusters : [];
  const eventMap = new Map();
  for (const event of events) {
    if (typeof event?.eventId !== 'string' || !event.eventId) {
      errors.push('every event cluster requires eventId');
      continue;
    }
    if (eventMap.has(event.eventId)) errors.push(`duplicate event cluster ${event.eventId}`);
    eventMap.set(event.eventId, event);
    if (typeof event?.statement !== 'string' || !event.statement.trim()) {
      errors.push(`event ${event.eventId} requires statement`);
    }
    if (typeof event?.changeType !== 'string' || !event.changeType.trim()) {
      errors.push(`event ${event.eventId} requires changeType`);
    }
    if (!['new', 'continuation', 'repeat', 'uncertain'].includes(event?.noveltyAssessment)) {
      errors.push(`event ${event.eventId} has invalid noveltyAssessment`);
    }
    if (!Array.isArray(event?.memberItemIds) || !event.memberItemIds.length) {
      errors.push(`event ${event.eventId} requires memberItemIds`);
      continue;
    }
    const memberItems = [];
    for (const id of event.memberItemIds) {
      const item = itemMap.get(id);
      if (!item) errors.push(`event ${event.eventId} references missing source item ${id}`);
      else memberItems.push(item);
    }
    if (memberItems.length) {
      const computedOrigins = sorted(uniq(memberItems.map((item) => item.originGroup)));
      const declaredOrigins = sorted(Array.isArray(event.independentOriginGroups) ? event.independentOriginGroups : []);
      if (JSON.stringify(computedOrigins) !== JSON.stringify(declaredOrigins)) {
        errors.push(`event ${event.eventId} independentOriginGroups do not match member source origins`);
      }
      const firstAvailableAt = memberItems.map((item) => item.availableAt).sort()[0];
      if (event.firstAvailableAt !== firstAvailableAt) {
        errors.push(`event ${event.eventId} firstAvailableAt must equal earliest member availableAt ${firstAvailableAt}`);
      }
    }
  }

  return errors;
}

function summarizeDiscoveryPack(pack) {
  const lanes = Array.isArray(pack?.lanes) ? pack.lanes : [];
  const items = Array.isArray(pack?.sourceItems) ? pack.sourceItems : [];
  const events = Array.isArray(pack?.eventClusters) ? pack.eventClusters : [];
  const byLane = {};
  for (const lane of lanes) {
    byLane[lane.laneId] = {
      coverageStatus: lane.coverageStatus,
      sourceItemCount: items.filter((item) => item.laneId === lane.laneId).length,
      uniqueOriginGroupCount: uniq(items.filter((item) => item.laneId === lane.laneId).map((item) => item.originGroup)).length
    };
  }
  const noveltyCounts = {};
  for (const event of events) noveltyCounts[event.noveltyAssessment] = (noveltyCounts[event.noveltyAssessment] ?? 0) + 1;
  return {
    sourceItemCount: items.length,
    uniqueOriginGroupCount: uniq(items.map((item) => item.originGroup)).length,
    eventClusterCount: events.length,
    coveredLaneCount: lanes.filter((lane) => lane.coverageStatus !== 'unavailable').length,
    byLane,
    noveltyCounts
  };
}

const MISS_STAGES = [
  'detected',
  'source_universe_miss',
  'retrieval_miss',
  'dedup_clustering_miss',
  'triage_miss',
  'verification_miss',
  'value_chain_mapping_miss',
  'selection_gate_miss',
  'execution_filtered',
  'unforeseeable',
  'not_valid_ex_ante_opportunity'
];

function auditMissedOpportunities(lock, pack, audit) {
  const errors = [];
  if (audit?.schemaVersion !== '1.0') errors.push('miss audit schemaVersion must be 1.0');
  if (audit?.runId !== lock?.runId) errors.push('miss audit runId must match lock.runId');
  if (!Array.isArray(audit?.cases)) errors.push('miss audit cases must be an array');
  if (audit?.samePeriodMayTuneSkill !== false) errors.push('miss audit samePeriodMayTuneSkill must be false');

  const eventIds = new Set((pack?.eventClusters ?? []).map((event) => event.eventId));
  const cases = Array.isArray(audit?.cases) ? audit.cases : [];
  const seen = new Set();
  for (const item of cases) {
    if (typeof item?.caseId !== 'string' || !item.caseId) {
      errors.push('every miss audit case requires caseId');
      continue;
    }
    if (seen.has(item.caseId)) errors.push(`duplicate miss audit case ${item.caseId}`);
    seen.add(item.caseId);
    if (!MISS_STAGES.includes(item?.missStage)) errors.push(`miss audit case ${item.caseId} has invalid missStage`);
    if (typeof item?.detectableExAnte !== 'boolean') errors.push(`miss audit case ${item.caseId} requires detectableExAnte boolean`);
    if (!Array.isArray(item?.linkedFrozenEventIds)) errors.push(`miss audit case ${item.caseId} requires linkedFrozenEventIds`);
    for (const eventId of item?.linkedFrozenEventIds ?? []) {
      if (!eventIds.has(eventId)) errors.push(`miss audit case ${item.caseId} links unknown frozen event ${eventId}`);
    }
    if (item?.missStage === 'detected' && !(item?.linkedFrozenEventIds?.length)) {
      errors.push(`detected miss audit case ${item.caseId} requires a linked frozen event`);
    }
    if (!item?.detectableExAnte && !['unforeseeable', 'not_valid_ex_ante_opportunity'].includes(item?.missStage)) {
      errors.push(`non-detectable case ${item.caseId} must be unforeseeable or not_valid_ex_ante_opportunity`);
    }
  }
  if (errors.length) return { errors, report: null };

  const detectable = cases.filter((item) => item.detectableExAnte);
  const detected = detectable.filter((item) => item.missStage === 'detected');
  const stageCounts = {};
  for (const item of cases) stageCounts[item.missStage] = (stageCounts[item.missStage] ?? 0) + 1;
  return {
    errors: [],
    report: {
      schemaVersion: '1.0',
      runId: lock.runId,
      label: 'hindsight_diagnostic_not_alpha_validation',
      samePeriodMayTuneSkill: false,
      caseCount: cases.length,
      detectableCaseCount: detectable.length,
      detectedCaseCount: detected.length,
      diagnosticRecall: detectable.length ? detected.length / detectable.length : null,
      stageCounts,
      missedDetectableCases: detectable.filter((item) => item.missStage !== 'detected').map((item) => ({
        caseId: item.caseId,
        missStage: item.missStage,
        description: item.description ?? ''
      }))
    }
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

module.exports = {
  MISS_STAGES,
  auditMissedOpportunities,
  readJson,
  summarizeDiscoveryPack,
  validateDiscoveryPack
};
