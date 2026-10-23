#!/usr/bin/env node
// Validates the Physics Intelligence aggregate dataset against its own declared totals.
// Every count the UI displays must be reproducible from the per-year rows, and the file
// must stay within the copyright boundary: references and counts only, never question text.
//
// Usage: node scripts/validate-physics-data.mjs [path-to-json]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const EPS = 1e-9;
const close = (a, b) => Math.abs(a - b) < EPS;
const REF = /^(\d{4}) Q(\d{1,2})$/;
const FORBIDDEN_KEYS = /^(question|questionText|stem|options|answer|answers|answerKey|explanation|solution)$/i;

export function validatePhysicsData(data) {
  const errors = [];
  const fail = msg => errors.push(msg);
  const { overview, units, byYear, eraSummaries, currentFamilies, revisionOpportunityFormula, release } = data;

  // ---- years and formats
  if (byYear.length !== overview.examinationYears) fail(`byYear has ${byYear.length} rows; overview says ${overview.examinationYears}`);
  byYear.forEach((row, i) => {
    const expectedYear = overview.startYear + i;
    if (row.year !== expectedYear) fail(`byYear[${i}] is ${row.year}; expected ${expectedYear}`);
    const perPaper = row.year <= 2010 ? 60 : 50;
    if (row.questionCount !== perPaper) fail(`${row.year}: questionCount ${row.questionCount}; format expects ${perPaper}`);
    const sum = Object.values(row.units).reduce((n, u) => n + u.count, 0);
    if (sum !== row.questionCount) fail(`${row.year}: unit counts sum to ${sum}, not ${row.questionCount}`);
    for (const [unit, u] of Object.entries(row.units)) {
      if (!close(u.percentage, u.count / row.questionCount)) fail(`${row.year} ${unit}: percentage ${u.percentage} ≠ ${u.count}/${row.questionCount}`);
    }
  });
  const totalQuestions = byYear.reduce((n, r) => n + r.questionCount, 0);
  if (totalQuestions !== overview.questions) fail(`byYear totals ${totalQuestions} questions; overview says ${overview.questions}`);

  // ---- units
  const unitNames = new Set(units.map(u => u.name));
  byYear.forEach(row => Object.keys(row.units).forEach(name => { if (!unitNames.has(name)) fail(`${row.year}: unknown unit "${name}"`); }));
  units.forEach(u => {
    const combined = byYear.reduce((n, r) => n + (r.units[u.name]?.count || 0), 0);
    if (combined !== u.combinedCount) fail(`unit ${u.name}: combinedCount ${u.combinedCount}, rows give ${combined}`);
    if (!close(u.combinedPercentage, u.combinedCount / overview.questions)) fail(`unit ${u.name}: combinedPercentage inconsistent`);
  });

  // ---- eras
  for (const [era, summary] of Object.entries(eraSummaries)) {
    const rows = byYear.filter(r => r.year >= summary.startYear && r.year <= summary.endYear);
    if (rows.length !== summary.papers) fail(`era ${era}: ${rows.length} papers in range; summary says ${summary.papers}`);
    const q = rows.reduce((n, r) => n + r.questionCount, 0);
    if (q !== summary.questions) fail(`era ${era}: ${q} questions in range; summary says ${summary.questions}`);
    for (const [unit, u] of Object.entries(summary.units)) {
      const c = rows.reduce((n, r) => n + (r.units[unit]?.count || 0), 0);
      if (c !== u.count) fail(`era ${era} ${unit}: count ${u.count}, rows give ${c}`);
    }
  }

  // ---- current-era families
  const era = overview.currentEra;
  const [eraStart, eraEnd] = era.years.split('-').map(Number);
  if (currentFamilies.length !== era.families) fail(`${currentFamilies.length} families; overview says ${era.families}`);
  const ids = new Set();
  const seenRefs = new Map();
  currentFamilies.forEach(f => {
    if (ids.has(f.familyId)) fail(`duplicate family id ${f.familyId}`);
    ids.add(f.familyId);
    if (!unitNames.has(f.unit)) fail(`${f.familyId}: unknown unit "${f.unit}"`);
    if (f.recurrenceCount !== f.questionReferences.length) fail(`${f.familyId}: recurrenceCount ${f.recurrenceCount} ≠ ${f.questionReferences.length} references`);
    const refYears = new Set();
    f.questionReferences.forEach(ref => {
      const m = REF.exec(ref);
      if (!m) { fail(`${f.familyId}: malformed reference "${ref}"`); return; }
      const year = Number(m[1]);
      const q = Number(m[2]);
      if (year < eraStart || year > eraEnd) fail(`${f.familyId}: ${ref} is outside ${era.years}`);
      if (q < 1 || q > 50) fail(`${f.familyId}: ${ref} is not a valid question number`);
      if (seenRefs.has(ref)) fail(`${ref} appears in both ${seenRefs.get(ref)} and ${f.familyId}`);
      seenRefs.set(ref, f.familyId);
      refYears.add(year);
    });
    if (refYears.size !== f.distinctPapers) fail(`${f.familyId}: distinctPapers ${f.distinctPapers} ≠ ${refYears.size}`);
    const listed = [...new Set(f.years)].sort().join(',');
    if (listed !== [...refYears].sort().join(',')) fail(`${f.familyId}: years [${f.years}] do not match its references`);
  });
  if (seenRefs.size !== era.questions) fail(`families cover ${seenRefs.size} questions; overview says ${era.questions}`);

  // ---- interpretation and content boundary
  if (release?.predictiveInterpretation !== 'prohibited') fail('release.predictiveInterpretation must be "prohibited"');
  if (revisionOpportunityFormula?.notAnExamProbability !== true) fail('revisionOpportunityFormula must declare notAnExamProbability');
  const weights = Object.values(revisionOpportunityFormula?.weights || {});
  if (!close(weights.reduce((a, b) => a + b, 0), 1)) fail('revision-opportunity weights must sum to 1');
  (function walk(node, path) {
    if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (FORBIDDEN_KEYS.test(k)) fail(`${path}.${k}: question/answer content is not allowed in the published dataset`);
        walk(v, `${path}.${k}`);
      }
    } else if (typeof node === 'string' && node.length > 300) fail(`${path}: unexpectedly long text (${node.length} chars)`);
  })(data, 'data');

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2] || new URL('../physics-intelligence/assets/physics-intelligence-data.json', import.meta.url);
  const errors = validatePhysicsData(JSON.parse(readFileSync(file, 'utf8')));
  if (errors.length) {
    console.error(`Physics dataset: ${errors.length} problem(s)`);
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log('Physics dataset: all totals, eras, families and content boundaries are consistent.');
}
