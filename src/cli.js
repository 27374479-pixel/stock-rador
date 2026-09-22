#!/usr/bin/env node
const fs = require('node:fs');
const {
  createEmptyStore,
  readJson,
  reviewLead,
  validateLead,
  validateStore,
  writeJsonAtomic
} = require('./lead-store');

function usage() {
  console.error('Usage:');
  console.error('  node src/cli.js init <store.json> <scope.json>');
  console.error('  node src/cli.js validate <store.json>');
  console.error('  node src/cli.js add <store.json> <lead.json>');
  console.error('  node src/cli.js review <store.json> [--as-of <UTC timestamp>] [--write]');
}

function fail(message, code = 1) {
  console.error(message);
  process.exitCode = code;
}

function printErrors(errors) {
  errors.forEach((error) => console.error(`- ${error}`));
}

function isUtcTimestamp(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) || Number.isNaN(Date.parse(value))) return false;
  const normalized = value.includes('.') ? value : value.replace('Z', '.000Z');
  return new Date(value).toISOString() === normalized;
}

function main(argv) {
  const [command, storePath, ...rest] = argv;
  if (!command || !storePath) {
    usage();
    return fail('missing command or store path', 2);
  }

  if (command === 'init') {
    const [extra] = rest;
    if (!extra) return fail('init requires a scope JSON file', 2);
    if (fs.existsSync(storePath)) return fail(`refusing to overwrite existing file: ${storePath}`);
    const accessScope = readJson(extra);
    const now = new Date().toISOString();
    const store = createEmptyStore(now, accessScope);
    const errors = validateStore(store);
    if (errors.length) {
      printErrors(errors);
      return fail('scope is invalid');
    }
    writeJsonAtomic(storePath, store);
    console.log(`initialized ${storePath}`);
    return;
  }

  const store = readJson(storePath);
  const storeErrors = validateStore(store);
  if (storeErrors.length) {
    printErrors(storeErrors);
    return fail(`invalid store: ${storePath}`);
  }

  if (command === 'validate') {
    console.log(`valid: ${store.leads.length} lead(s)`);
    return;
  }

  if (command === 'add') {
    const [extra] = rest;
    if (!extra) return fail('add requires a lead JSON file', 2);
    const lead = readJson(extra);
    const errors = validateLead(lead);
    if (errors.length) {
      printErrors(errors);
      return fail(`invalid lead: ${extra}`);
    }
    if (store.leads.some((item) => item.id === lead.id)) return fail(`duplicate lead id: ${lead.id}`);
    store.leads.push(lead);
    store.updatedAt = new Date().toISOString();
    writeJsonAtomic(storePath, store);
    console.log(`added ${lead.id}`);
    return;
  }

  if (command === 'review') {
    let write = false;
    let asOf;
    for (let index = 0; index < rest.length; index += 1) {
      if (rest[index] === '--write') {
        write = true;
      } else if (rest[index] === '--as-of' && rest[index + 1]) {
        asOf = rest[index + 1];
        index += 1;
      } else {
        return fail(`unknown or incomplete review option: ${rest[index]}`, 2);
      }
    }
    if (asOf && !isUtcTimestamp(asOf)) {
      return fail('--as-of must be an ISO-8601 UTC timestamp', 2);
    }
    const reviewedAt = new Date().toISOString();
    const reviewAsOf = asOf ?? reviewedAt;
    const results = store.leads.map((lead) => ({ id: lead.id, ...reviewLead(lead, { asOf: reviewAsOf }) }));
    console.log(JSON.stringify(results, null, 2));
    console.error('Gate output checks recorded metadata only; manual review of original source contents and independence is required.');
    if (write) {
      for (const result of results) {
        const lead = store.leads.find((item) => item.id === result.id);
        lead.assessment = { gate: result.gate, reviewedAt, asOf: result.asOf, reasons: result.reasons };
      }
      store.updatedAt = reviewedAt;
      writeJsonAtomic(storePath, store);
      console.error(`stored ${results.length} assessment(s)`);
    }
    return;
  }

  usage();
  return fail(`unknown command: ${command}`, 2);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  fail(error.message);
}
