const fs = require('node:fs');
const path = require('node:path');

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const TRUTH_STATUSES = new Set(['unknown', 'supported', 'contradicted', 'mixed']);
const ACCESS_STATUSES = new Set(['accessible', 'partial', 'unavailable']);
const RELATIONS = new Set(['supports', 'contradicts', 'context']);
const SOURCE_TYPES = new Set(['primary', 'secondary', 'community']);
const PROOF_STATUSES = new Set(['unknown', 'claimed', 'verified']);
const GATES = new Set(['Reject', 'Watch', 'A', 'S']);
const DATE_PRECISIONS = new Set(['timestamp', 'date', 'unknown']);
const CONTENT_KINDS = new Set(['original_discussion', 'news_repost', 'unknown']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hostname(value) {
  try { return new URL(value).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; }
}

function isIsoDate(value) {
  if (!hasText(value) || !ISO_DATE.test(value) || Number.isNaN(Date.parse(value))) return false;
  const normalizedInput = value.includes('.') ? value : value.replace('Z', '.000Z');
  return new Date(value).toISOString() === normalizedInput;
}

function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validatePublishedAt(errors, owner, location) {
  if (owner.publishedAt === null) {
    if (owner.datePrecision !== 'unknown') errors.push(`${location}.datePrecision must be unknown when publishedAt is null`);
  } else if (owner.datePrecision === 'date') {
    if (!isCalendarDate(owner.publishedAt)) errors.push(`${location}.publishedAt must be YYYY-MM-DD when datePrecision is date`);
  } else {
    pushRequiredDate(errors, owner.publishedAt, `${location}.publishedAt`);
    if (owner.datePrecision !== undefined && !DATE_PRECISIONS.has(owner.datePrecision)) {
      errors.push(`${location}.datePrecision must be timestamp, date, or unknown`);
    }
  }
}

function publicationWasAvailable(owner, cutoff) {
  if (owner.datePrecision === 'date' && isCalendarDate(owner.publishedAt)) {
    return Date.parse(`${owner.publishedAt}T23:59:59.999Z`) <= cutoff;
  }
  return isIsoDate(owner.publishedAt) && Date.parse(owner.publishedAt) <= cutoff;
}

function evidenceWasAvailable(item, cutoff) {
  if (!isIsoDate(item.availableAt) || Date.parse(item.availableAt) > cutoff) return false;
  if (item.publishedAt === null && item.datePrecision === 'unknown') return true;
  return publicationWasAvailable(item, cutoff);
}

function pushRequiredText(errors, value, location) {
  if (!hasText(value)) errors.push(`${location} must be a non-empty string`);
}

function pushRequiredDate(errors, value, location) {
  if (!isIsoDate(value)) errors.push(`${location} must be an ISO-8601 UTC timestamp`);
}

function validateStore(store) {
  const errors = [];
  if (!isObject(store)) return ['root must be an object'];
  if (store.schemaVersion !== '1.0') errors.push('schemaVersion must equal "1.0"');
  pushRequiredDate(errors, store.createdAt, 'createdAt');
  pushRequiredDate(errors, store.updatedAt, 'updatedAt');

  if (!isObject(store.accessScope)) {
    errors.push('accessScope must be an object');
  } else {
    pushRequiredText(errors, store.accessScope.description, 'accessScope.description');
    pushRequiredText(errors, store.accessScope.collectionMethod, 'accessScope.collectionMethod');
    if (!Array.isArray(store.accessScope.includedPlatforms)) {
      errors.push('accessScope.includedPlatforms must be an array');
    }
    if (!Array.isArray(store.accessScope.limitations)) {
      errors.push('accessScope.limitations must be an array');
    }
  }

  if (!Array.isArray(store.leads)) {
    errors.push('leads must be an array');
    return errors;
  }

  const ids = new Set();
  store.leads.forEach((lead, index) => {
    const location = `leads[${index}]`;
    validateLead(lead, location, errors);
    if (isObject(lead) && hasText(lead.id)) {
      if (ids.has(lead.id)) errors.push(`${location}.id duplicates ${lead.id}`);
      ids.add(lead.id);
    }
  });
  return errors;
}

function validateLead(lead, location = 'lead', errors = []) {
  if (!isObject(lead)) {
    errors.push(`${location} must be an object`);
    return errors;
  }
  pushRequiredText(errors, lead.id, `${location}.id`);
  pushRequiredDate(errors, lead.observedAt, `${location}.observedAt`);
  pushRequiredDate(errors, lead.availableAt, `${location}.availableAt`);
  if (isIsoDate(lead.observedAt) && isIsoDate(lead.availableAt) && Date.parse(lead.observedAt) > Date.parse(lead.availableAt)) errors.push(`${location}.observedAt must be at or before availableAt`);

  if (!isObject(lead.source)) {
    errors.push(`${location}.source must be an object`);
  } else {
    if (lead.source.kind !== 'forum') errors.push(`${location}.source.kind must equal "forum"`);
    ['platform', 'url', 'title', 'accessMethod'].forEach((key) =>
      pushRequiredText(errors, lead.source[key], `${location}.source.${key}`));
    validatePublishedAt(errors, lead.source, `${location}.source`);
    pushRequiredDate(errors, lead.source.accessedAt, `${location}.source.accessedAt`);
    if (isIsoDate(lead.source.accessedAt) && isIsoDate(lead.availableAt) && Date.parse(lead.source.accessedAt) < Date.parse(lead.availableAt)) errors.push(`${location}.source.accessedAt must be at or after availableAt`);
    if (isIsoDate(lead.source.publishedAt) && isIsoDate(lead.availableAt) && Date.parse(lead.source.publishedAt) > Date.parse(lead.availableAt)) errors.push(`${location}.source.publishedAt must be at or before availableAt`);
    if (lead.source.datePrecision === 'date' && isCalendarDate(lead.source.publishedAt) && isIsoDate(lead.availableAt) && lead.source.publishedAt > lead.availableAt.slice(0, 10)) errors.push(`${location}.source.publishedAt date must be at or before availableAt date`);
    if (!ACCESS_STATUSES.has(lead.source.accessStatus)) {
      errors.push(`${location}.source.accessStatus must be accessible, partial, or unavailable`);
    }
    if (!['full', 'partial', 'snippet_only'].includes(lead.source.textAvailability)) {
      errors.push(`${location}.source.textAvailability must be full, partial, or snippet_only`);
    }
    if (!CONTENT_KINDS.has(lead.source.contentKind)) errors.push(`${location}.source.contentKind must be original_discussion, news_repost, or unknown`);
  }

  if (!isObject(lead.claim)) {
    errors.push(`${location}.claim must be an object`);
  } else {
    pushRequiredText(errors, lead.claim.summary, `${location}.claim.summary`);
    pushRequiredText(errors, lead.claim.category, `${location}.claim.category`);
    if (!Array.isArray(lead.claim.entities)) errors.push(`${location}.claim.entities must be an array`);
  }
  if (!TRUTH_STATUSES.has(lead.truthStatus)) {
    errors.push(`${location}.truthStatus must be unknown, supported, contradicted, or mixed`);
  }
  if (lead.truthStatus !== 'unknown') pushRequiredDate(errors, lead.truthAssessedAt, `${location}.truthAssessedAt`);

  if (!Array.isArray(lead.verificationEvidence)) {
    errors.push(`${location}.verificationEvidence must be an array`);
  } else {
    lead.verificationEvidence.forEach((item, index) => validateEvidence(item, `${location}.verificationEvidence[${index}]`, errors));
    const evidenceIds = new Set();
    lead.verificationEvidence.forEach((item, index) => {
      if (!hasText(item?.id)) return;
      if (evidenceIds.has(item.id)) errors.push(`${location}.verificationEvidence[${index}].id duplicates ${item.id}`);
      evidenceIds.add(item.id);
    });
  }

  if (!Array.isArray(lead.invalidationIndicators) || lead.invalidationIndicators.length === 0) {
    errors.push(`${location}.invalidationIndicators must contain at least one testable indicator`);
  } else {
    lead.invalidationIndicators.forEach((item, index) => {
      const itemLocation = `${location}.invalidationIndicators[${index}]`;
      if (!isObject(item)) return errors.push(`${itemLocation} must be an object`);
      pushRequiredText(errors, item.indicator, `${itemLocation}.indicator`);
      pushRequiredText(errors, item.observationMethod, `${itemLocation}.observationMethod`);
      if (!['unknown', 'not_triggered', 'triggered'].includes(item.status)) {
        errors.push(`${itemLocation}.status must be unknown, not_triggered, or triggered`);
      }
      if (item.checkedAt !== undefined && !isIsoDate(item.checkedAt)) {
        errors.push(`${itemLocation}.checkedAt must be an ISO-8601 UTC timestamp when present`);
      }
      if (item.status !== 'unknown' && !isIsoDate(item.checkedAt)) errors.push(`${itemLocation}.checkedAt is required when status is not unknown`);
    });
  }

  if (!Array.isArray(lead.aShareMappings)) {
    errors.push(`${location}.aShareMappings must be an array`);
  } else {
    lead.aShareMappings.forEach((mapping, index) => validateMapping(mapping, `${location}.aShareMappings[${index}]`, errors));
  }

  if (Array.isArray(lead.verificationEvidence) && Array.isArray(lead.aShareMappings)) {
    const evidenceIds = new Set(lead.verificationEvidence.map((item) => item?.id).filter(hasText));
    lead.aShareMappings.forEach((mapping, mappingIndex) => {
      for (const key of ['exposure', 'valuationExpectations']) {
        const refs = mapping?.[key]?.evidenceRefs;
        if (!Array.isArray(refs)) continue;
        refs.forEach((ref, refIndex) => {
          if (!evidenceIds.has(ref)) {
            errors.push(`${location}.aShareMappings[${mappingIndex}].${key}.evidenceRefs[${refIndex}] does not resolve to verificationEvidence`);
          }
          const referenced = lead.verificationEvidence.find((item) => item?.id === ref);
          if (referenced && referenced.relation !== 'supports') errors.push(`${location}.aShareMappings[${mappingIndex}].${key}.evidenceRefs[${refIndex}] must reference supports evidence`);
        });
      }
    });
  }

  if (lead.assessment !== undefined) {
    if (!isObject(lead.assessment)) {
      errors.push(`${location}.assessment must be an object when present`);
    } else {
      if (!GATES.has(lead.assessment.gate)) errors.push(`${location}.assessment.gate must be Reject, Watch, A, or S`);
      pushRequiredDate(errors, lead.assessment.reviewedAt, `${location}.assessment.reviewedAt`);
      if (lead.assessment.asOf !== undefined) pushRequiredDate(errors, lead.assessment.asOf, `${location}.assessment.asOf`);
      if (!Array.isArray(lead.assessment.reasons)) errors.push(`${location}.assessment.reasons must be an array`);
    }
  }
  return errors;
}

function validateEvidence(item, location, errors) {
  if (!isObject(item)) return errors.push(`${location} must be an object`);
  ['id', 'url', 'title', 'publisher', 'independenceGroup'].forEach((key) =>
    pushRequiredText(errors, item[key], `${location}.${key}`));
  if (!RELATIONS.has(item.relation)) errors.push(`${location}.relation must be supports, contradicts, or context`);
  if (!SOURCE_TYPES.has(item.sourceType)) errors.push(`${location}.sourceType must be primary, secondary, or community`);
  validatePublishedAt(errors, item, location);
  ['availableAt', 'accessedAt'].forEach((key) => pushRequiredDate(errors, item[key], `${location}.${key}`));
  if (isIsoDate(item.publishedAt) && isIsoDate(item.availableAt) && Date.parse(item.publishedAt) > Date.parse(item.availableAt)) errors.push(`${location}.publishedAt must be at or before availableAt`);
  if (item.datePrecision === 'date' && isCalendarDate(item.publishedAt) && isIsoDate(item.availableAt) && item.publishedAt > item.availableAt.slice(0, 10)) errors.push(`${location}.publishedAt date must be at or before availableAt date`);
  if (isIsoDate(item.availableAt) && isIsoDate(item.accessedAt) && Date.parse(item.availableAt) > Date.parse(item.accessedAt)) errors.push(`${location}.availableAt must be at or before accessedAt`);
}

function validateMapping(mapping, location, errors) {
  if (!isObject(mapping)) return errors.push(`${location} must be an object`);
  pushRequiredText(errors, mapping.ticker, `${location}.ticker`);
  pushRequiredText(errors, mapping.name, `${location}.name`);
  for (const key of ['exposure', 'valuationExpectations']) {
    const proof = mapping[key];
    const proofLocation = `${location}.${key}`;
    if (!isObject(proof)) {
      errors.push(`${proofLocation} must be an object`);
      continue;
    }
    if (!PROOF_STATUSES.has(proof.status)) errors.push(`${proofLocation}.status must be unknown, claimed, or verified`);
    pushRequiredText(errors, proof.summary, `${proofLocation}.summary`);
    if (!Array.isArray(proof.evidenceRefs)) errors.push(`${proofLocation}.evidenceRefs must be an array`);
    if (key === 'valuationExpectations' && proof.status === 'verified') {
      pushRequiredDate(errors, proof.asOf, `${proofLocation}.asOf`);
    }
  }
}

function reviewLead(lead, options = {}) {
  const effectiveAsOf = options.asOf ?? new Date().toISOString();
  const validationErrors = validateLead(lead, 'lead', []);
  if (validationErrors.length) {
    return { gate: 'Watch', asOf: effectiveAsOf, valid: false, reasons: validationErrors.map((error) => `invalid record: ${error}`) };
  }
  const asOf = effectiveAsOf;
  const cutoff = Date.parse(asOf);
  const evidence = (Array.isArray(lead.verificationEvidence) ? lead.verificationEvidence : [])
    .filter((item) => evidenceWasAvailable(item, cutoff));
  const supporting = evidence.filter((item) => item.relation === 'supports');
  const independentGroups = new Set(supporting.map((item) => item.independenceGroup).filter(hasText));
  const forumHost = hostname(lead.source?.url);
  const hasPrimary = supporting.some((item) => item.sourceType === 'primary' && hostname(item.url) !== forumHost);
  const mappings = Array.isArray(lead.aShareMappings) ? lead.aShareMappings : [];
  const evidenceIds = new Set(evidence.map((item) => item.id));
  const refsAvailable = (refs) => Array.isArray(refs) && refs.length > 0 && refs.every((ref) => evidenceIds.has(ref));
  const verifiedExposureMapping = mappings.find((mapping) =>
    mapping?.exposure?.status === 'verified' && refsAvailable(mapping?.exposure?.evidenceRefs));
  const verifiedMapping = mappings.find((mapping) =>
    mapping?.exposure?.status === 'verified' &&
    mapping?.valuationExpectations?.status === 'verified' &&
    isIsoDate(mapping?.valuationExpectations?.asOf) &&
    Date.parse(mapping.valuationExpectations.asOf) <= cutoff &&
    refsAvailable(mapping?.exposure?.evidenceRefs) &&
    refsAvailable(mapping?.valuationExpectations?.evidenceRefs));
  const hasInvalidation = Array.isArray(lead.invalidationIndicators) && lead.invalidationIndicators.length > 0;
  const invalidated = Array.isArray(lead.invalidationIndicators) &&
    lead.invalidationIndicators.some((item) => item.status === 'triggered' && isIsoDate(item.checkedAt) && Date.parse(item.checkedAt) <= cutoff);
  const forumTraceable = lead.source?.kind === 'forum' && hasText(lead.source?.url) && publicationWasAvailable(lead.source, cutoff) &&
    isIsoDate(lead.observedAt) && Date.parse(lead.observedAt) <= cutoff &&
    isIsoDate(lead.availableAt) && Date.parse(lead.availableAt) <= cutoff &&
    lead.source?.accessStatus === 'accessible' && lead.source?.textAvailability === 'full' &&
    lead.source?.contentKind === 'original_discussion';
  const truthKnownAtCutoff = lead.truthStatus === 'unknown' || (isIsoDate(lead.truthAssessedAt) && Date.parse(lead.truthAssessedAt) <= cutoff);
  const effectiveTruthStatus = truthKnownAtCutoff ? lead.truthStatus : 'unknown';

  const reasons = [];
  if (!forumTraceable) reasons.push('forum origin is not traceable and accessible with complete timing');
  if (!hasInvalidation) reasons.push('no testable invalidation indicator');
  if (supporting.length === 0) reasons.push('no supporting verification evidence');
  if (independentGroups.size < 2) reasons.push('fewer than two independent supporting evidence groups');
  if (!hasPrimary) reasons.push('no recorded primary verification outside the forum origin domain');
  if (lead.source?.contentKind !== 'original_discussion') reasons.push(`contentKind is ${lead.source?.contentKind}; non-original community content remains Watch`);
  if (!verifiedExposureMapping) reasons.push('no A-share mapping has verified economic exposure backed by available evidence');
  if (effectiveTruthStatus !== 'supported') reasons.push(`truthStatus at cutoff is ${effectiveTruthStatus}, not supported`);
  if (!truthKnownAtCutoff) reasons.push('truth assessment was made after the review cutoff');
  if (!verifiedMapping) reasons.push('no A-share mapping has verified economic exposure and dated valuation/expectations evidence');
  if ((Array.isArray(lead.verificationEvidence) ? lead.verificationEvidence.length : 0) > evidence.length) {
    reasons.push(`evidence unavailable by ${asOf} was excluded`);
  }
  if (invalidated) reasons.push('an invalidation indicator was triggered');

  let gate = 'Watch';
  const aReady = forumTraceable && hasInvalidation && hasPrimary && Boolean(verifiedExposureMapping) &&
    effectiveTruthStatus !== 'contradicted';
  if (aReady) gate = 'A';
  const sReady = aReady && effectiveTruthStatus === 'supported' && independentGroups.size >= 2 && hasPrimary && Boolean(verifiedMapping);
  if (sReady) gate = 'S';
  if (effectiveTruthStatus === 'contradicted' || invalidated) gate = 'Reject';

  return { gate, asOf, reasons: reasons.length ? reasons : ['all S research-priority gates satisfied; manual original-source review still required'] };
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`cannot read JSON ${filePath}: ${error.message}`);
  }
}

function writeJsonAtomic(filePath, value) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  const temporary = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, filePath);
}

function createEmptyStore(now, accessScope) {
  return {
    schemaVersion: '1.0',
    createdAt: now,
    updatedAt: now,
    accessScope,
    leads: []
  };
}

module.exports = { createEmptyStore, readJson, reviewLead, validateLead, validateStore, writeJsonAtomic };
