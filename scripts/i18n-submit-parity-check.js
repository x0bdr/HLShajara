#!/usr/bin/env node
/**
 * i18n-submit-parity-check.js — standalone EN↔AR `submit`-namespace parity check.
 *
 * Asserts:
 *   1. The EN submit key set EXACTLY equals the AR submit key set.
 *   2. No submit value is an empty string in either language.
 *   3. Every v1.5 expected key is present in BOTH languages.
 *
 * Run: node scripts/i18n-submit-parity-check.js   (or: npm run check:i18n:submit)
 */

"use strict";

const path = require("node:path");
const assert = require("node:assert/strict");

const en = require(path.join(__dirname, "..", "messages", "en.json")).submit;
const ar = require(path.join(__dirname, "..", "messages", "ar.json")).submit;

const V15_EXPECTED = [
  // categories
  "catCommercial", "catIndividuals", "catEducational", "catService",
  "catTourism", "catMedical", "catOrganizations", "catRealEstate",
  // step titles
  "q_reportCategory", "q_locationInfo", "q_entityTypeName", "q_reportDetails",
  "q_experience", "q_mediaEvidence", "q_aboutYou",
  // location info fields
  "locCountry", "locAtLeastOne", "locAddress",
  "locContact", "locWebsite", "locEmail", "locMaps", "locMapsError", "locSocial",
  // entity type/name fields
  "etnType", "etnName", "etnOtherSpecify",
  // report details fields
  "detailsHint", "detailsFlags", "detailsOwnerName", "detailsInvestorName",
  "detailsLabourInfo", "detailsSupportDataInfo", "detailsOtherPersonHint",
  "detailsReportedName", "detailsReportedNickname", "detailsReportedPhone",
  "detailsReportedPosition", "detailsReportedSocial", "detailsCarType",
  "detailsCarPlate", "detailsDriverPhone", "detailsDriverName",
  "detailsTaxiNumber", "detailsAppName", "detailsPropertyType",
  // experience
  "expLabel", "expHint", "expDocuments",
  // hints
  "hintReportCategory", "hintLocationInfo", "hintEntityType", "hintEntityName",
  "hintExperience", "hintMediaEvidence",
  // media/evidence
  "mediaNotes", "mediaFileLabel",
  // array add buttons
  "addOwner", "addInvestor", "addLabour", "labourName", "labourRole",
  // review groups
  "reviewGroupCategory", "reviewGroupLocation", "reviewGroupEntity",
  "reviewGroupDetails", "reviewGroupExperience",
];

let failures = 0;
function fail(msg) {
  failures++;
  console.error(`FAIL: ${msg}`);
}

const enKeys = new Set(Object.keys(en));
const arKeys = new Set(Object.keys(ar));
const enOnly = [...enKeys].filter((k) => !arKeys.has(k));
const arOnly = [...arKeys].filter((k) => !enKeys.has(k));
if (enOnly.length) fail(`keys present in EN but missing in AR: ${enOnly.join(", ")}`);
if (arOnly.length) fail(`keys present in AR but missing in EN: ${arOnly.join(", ")}`);
if (!enOnly.length && !arOnly.length) {
  console.log(`PASS: EN↔AR submit key sets are equal (${enKeys.size} keys each).`);
}

for (const [k, v] of Object.entries(en)) {
  if (typeof v === "string" && v.trim() === "") fail(`EN submit.${k} is an empty string.`);
}
for (const [k, v] of Object.entries(ar)) {
  if (typeof v === "string" && v.trim() === "") fail(`AR submit.${k} is an empty string.`);
}
if (failures === 0) console.log("PASS: no empty submit values in EN or AR.");

const missingEn = V15_EXPECTED.filter((k) => !(k in en));
const missingAr = V15_EXPECTED.filter((k) => !(k in ar));
if (missingEn.length) fail(`v1.5 keys missing in EN: ${missingEn.join(", ")}`);
if (missingAr.length) fail(`v1.5 keys missing in AR: ${missingAr.join(", ")}`);
if (!missingEn.length && !missingAr.length) {
  console.log(`PASS: all ${V15_EXPECTED.length} v1.5 keys present in EN and AR.`);
}

if (failures > 0) {
  console.error(`\n${failures} i18n submit-parity check(s) FAILED.`);
  process.exit(1);
}

assert.deepEqual([...enKeys].sort(), [...arKeys].sort());
console.log("\nAll EN↔AR submit-parity checks PASSED.");
process.exit(0);
