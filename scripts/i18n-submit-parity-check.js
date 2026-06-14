#!/usr/bin/env node
/**
 * i18n-submit-parity-check.js — standalone EN↔AR `submit`-namespace parity check
 * (no test framework, no new dependency). Wired as `npm run check:i18n`.
 *
 * Models the repo's existing standalone-check idiom (scripts/screens-parity-check.js):
 * CommonJS, node:assert, exit 1 on mismatch, exit 0 when parity holds.
 *
 * Asserts:
 *   1. The EN submit key set EXACTLY equals the AR submit key set (reports any key
 *      present in one language but not the other — never English-only, never Arabic-only).
 *   2. No submit value is an empty string in either language.
 *   3. Every Phase-29 expected key is present in BOTH languages — the expected list
 *      is DERIVED from the same conduct/role slug tuples used in Plan 29-01
 *      (CONDUCT_SLUGS / ROLE_SLUGS) so the i18n keys and the encoding slugs cannot
 *      drift apart.
 *
 * Run: node scripts/i18n-submit-parity-check.js   (or: npm run check:i18n)
 */

"use strict";

const path = require("node:path");
const assert = require("node:assert/strict");

const en = require(path.join(__dirname, "..", "messages", "en.json")).submit;
const ar = require(path.join(__dirname, "..", "messages", "ar.json")).submit;

// Kept in lock-step with src/lib/wizard/encoding.ts CONDUCT_SLUGS / ROLE_SLUGS
// (the i18n key suffix equals the slug). If those tuples change, update here.
const CONDUCT_SLUGS = [
  "detention", "torture", "disappearance", "killing", "sexualViolence",
  "financing", "arms", "laundering", "propaganda", "informing",
  "seizure", "detentionSite", "command", "other",
];
const ROLE_SLUGS = [
  "perpetrator", "commander", "financier", "supplier", "informant", "owner", "other",
];

const PHASE_29_EXPECTED = [
  "q_actorClass", "actorIndividual", "actorIndividualHint", "actorEntity", "actorEntityHint",
  "q_entitySubtype",
  "q_conduct",
  ...CONDUCT_SLUGS.flatMap((s) => [`conduct_${s}`, `conduct_${s}_def`]),
  "q_roleInAct",
  ...ROLE_SLUGS.map((s) => `role_${s}`),
];

let failures = 0;
function fail(msg) {
  failures++;
  console.error(`FAIL: ${msg}`);
}

// 1. Full key-set parity (symmetric difference).
const enKeys = new Set(Object.keys(en));
const arKeys = new Set(Object.keys(ar));
const enOnly = [...enKeys].filter((k) => !arKeys.has(k));
const arOnly = [...arKeys].filter((k) => !enKeys.has(k));
if (enOnly.length) fail(`keys present in EN but missing in AR: ${enOnly.join(", ")}`);
if (arOnly.length) fail(`keys present in AR but missing in EN: ${arOnly.join(", ")}`);
if (!enOnly.length && !arOnly.length) {
  console.log(`PASS: EN↔AR submit key sets are equal (${enKeys.size} keys each).`);
}

// 2. No empty string values in either language.
for (const [k, v] of Object.entries(en)) {
  if (typeof v === "string" && v.trim() === "") fail(`EN submit.${k} is an empty string.`);
}
for (const [k, v] of Object.entries(ar)) {
  if (typeof v === "string" && v.trim() === "") fail(`AR submit.${k} is an empty string.`);
}
if (failures === 0) console.log("PASS: no empty submit values in EN or AR.");

// 3. Every Phase-29 expected key present in BOTH.
const missingEn = PHASE_29_EXPECTED.filter((k) => !(k in en));
const missingAr = PHASE_29_EXPECTED.filter((k) => !(k in ar));
if (missingEn.length) fail(`Phase-29 keys missing in EN: ${missingEn.join(", ")}`);
if (missingAr.length) fail(`Phase-29 keys missing in AR: ${missingAr.join(", ")}`);
if (!missingEn.length && !missingAr.length) {
  console.log(`PASS: all ${PHASE_29_EXPECTED.length} Phase-29 keys present in EN and AR.`);
}

if (failures > 0) {
  console.error(`\n${failures} i18n submit-parity check(s) FAILED.`);
  process.exit(1);
}

// Sanity: assert (so a future refactor can't silently no-op the script).
assert.deepEqual([...enKeys].sort(), [...arKeys].sort());
console.log("\nAll EN↔AR submit-parity checks PASSED.");
process.exit(0);
