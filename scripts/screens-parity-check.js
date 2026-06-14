#!/usr/bin/env node
/**
 * screens-parity-check.js — standalone regression check (no test framework).
 *
 * Proves that src/lib/screens.ts `runScreens` reproduces the server's
 * `validateSubmission` (src/db/persist.ts) rejection cascade EXACTLY:
 *
 *   NO_SOURCE -> WEAK_SOURCE(<2) -> GROUP_TARGET -> INCITEMENT
 *   -> HATE_TONE -> INNOCENT_PARTY -> PRIVATE_TARGETING -> MISMATCH
 *
 * Source-count contract (mirrors route.ts:32 `sourceCount: data.sourceLinks.length`):
 *   uploaded FILES do NOT count toward WEAK_SOURCE — only sourceLinks do.
 *   Fixture: 2 files + 0 links -> WEAK_SOURCE.
 *
 * Drives the TypeScript source directly via Node's `--experimental-strip-types`
 * (Node 22.6+/23+). Exits 1 on any mismatch, 0 when all fixtures pass.
 *
 * Run: node scripts/screens-parity-check.js
 */

"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const SCREENS_TS = path.join(__dirname, "..", "src", "lib", "screens.ts");

// Expected: ordered list of { name, input, expectedCode }.
// expectedCode === null means a clean pass (ok: true).
// `input` is the runScreens argument shape:
//   { sourceCount, entityName, entityRole, entityType, allegationDescription }
const FIXTURES = [
  {
    name: "NO_SOURCE",
    input: { sourceCount: 0, entityName: "اللواء فلان", entityRole: "قائد فرع", entityType: "individual", allegationDescription: "وصف للفعل الموثق هنا يكفي طوله" },
    expectedCode: "NO_SOURCE",
  },
  {
    name: "WEAK_SOURCE",
    input: { sourceCount: 1, entityName: "اللواء فلان", entityRole: "قائد فرع", entityType: "individual", allegationDescription: "وصف للفعل الموثق هنا يكفي طوله" },
    expectedCode: "WEAK_SOURCE",
  },
  {
    // Source-count contract: 2 FILES + 0 LINKS must still be WEAK_SOURCE,
    // because runScreens.sourceCount mirrors sourceLinks.length only.
    name: "WEAK_SOURCE (2 files + 0 links)",
    input: { sourceCount: 0 /* links only */, entityName: "اللواء فلان", entityRole: "قائد فرع", entityType: "individual", allegationDescription: "وصف للفعل الموثق هنا يكفي طوله" },
    expectedCode: "NO_SOURCE",
  },
  {
    // 0 links + N files -> still triggers NO_SOURCE first (links === 0).
    // The genuine "files don't count" case: sourceCount derived from links is 0/1.
    name: "WEAK_SOURCE (1 link, files ignored)",
    input: { sourceCount: 1, entityName: "اللواء فلان", entityRole: "قائد فرع", entityType: "individual", allegationDescription: "وصف للفعل الموثق هنا يكفي طوله" },
    expectedCode: "WEAK_SOURCE",
  },
  {
    name: "GROUP_TARGET",
    input: { sourceCount: 2, entityName: "علوي", entityRole: "قائد", entityType: "individual", allegationDescription: "وصف للفعل الموثق هنا يكفي طوله" },
    expectedCode: "GROUP_TARGET",
  },
  {
    name: "INCITEMENT",
    input: { sourceCount: 2, entityName: "فلان الفلاني", entityRole: "قائد سرية", entityType: "individual", allegationDescription: "اقتلوا كل من يقف ضدنا في الميدان اليوم" },
    expectedCode: "INCITEMENT",
  },
  {
    name: "HATE_TONE",
    input: { sourceCount: 2, entityName: "فلان الفلاني", entityRole: "مسؤول", entityType: "individual", allegationDescription: "إبادة جماعية يجب أن تقع بحق الخصوم" },
    expectedCode: "HATE_TONE",
  },
  {
    name: "INNOCENT_PARTY",
    input: { sourceCount: 2, entityName: "فلان الفلاني", entityRole: "طبيب", entityType: "individual", allegationDescription: "وصف للفعل الموثق هنا يكفي طوله" },
    expectedCode: "INNOCENT_PARTY",
  },
  {
    name: "PRIVATE_TARGETING",
    input: { sourceCount: 2, entityName: "فلان الفلاني", entityRole: "مسؤول", entityType: "individual", allegationDescription: "يسكن في شارع الثورة قرب الساحة" },
    expectedCode: "PRIVATE_TARGETING",
  },
  {
    name: "MISMATCH",
    input: { sourceCount: 2, entityName: "فلان الفلاني", entityRole: "لواء", entityType: "individual", allegationDescription: "وصف للفعل الموثق هنا يكفي طوله" },
    expectedCode: "MISMATCH",
  },
  {
    name: "CLEAN PASS",
    input: { sourceCount: 2, entityName: "فلان الفلاني", entityRole: "ضابط مسؤول", entityType: "individual", allegationDescription: "وصف للفعل الموثق هنا يكفي طوله ولا يحتوي محظورات" },
    expectedCode: null,
  },
];

// isCoarseLocationClean fixtures (S5 coarse-location blocker).
const LOCATION_FIXTURES = [
  { name: "street address blocked", value: "شارع الثورة 5", expectedClean: false },
  { name: "governorate allowed", value: "دمشق", expectedClean: true },
];

// Build a tiny driver program that imports the TS module and prints JSON results,
// then run it under `node --experimental-strip-types`.
function buildDriver() {
  const importPath = JSON.stringify("file://" + SCREENS_TS);
  return `
import { runScreens, isCoarseLocationClean } from ${importPath};
const screenFixtures = ${JSON.stringify(FIXTURES.map((f) => ({ name: f.name, input: f.input })))};
const locationFixtures = ${JSON.stringify(LOCATION_FIXTURES.map((f) => ({ name: f.name, value: f.value })))};
const out = {
  screens: screenFixtures.map((f) => {
    const r = runScreens(f.input);
    return { name: f.name, ok: r.ok, code: r.ok ? null : r.code };
  }),
  locations: locationFixtures.map((f) => ({ name: f.name, clean: isCoarseLocationClean(f.value) })),
};
process.stdout.write(JSON.stringify(out));
`;
}

function run() {
  const driver = buildDriver();
  const res = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "-"],
    { input: driver, encoding: "utf8" }
  );

  if (res.status !== 0) {
    console.error("FAIL: could not execute src/lib/screens.ts under --experimental-strip-types.");
    console.error(res.stderr || res.stdout || "(no output)");
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(res.stdout);
  } catch (e) {
    console.error("FAIL: driver did not emit valid JSON.");
    console.error(res.stdout);
    process.exit(1);
  }

  let failures = 0;

  // Assert screen-cascade parity in server order.
  parsed.screens.forEach((actual, i) => {
    const expected = FIXTURES[i];
    const got = actual.ok ? null : actual.code;
    if (got !== expected.expectedCode) {
      failures++;
      console.error(
        `FAIL [${expected.name}]: expected ${expected.expectedCode ?? "ok:true"} but got ${got ?? "ok:true"}`
      );
    } else {
      console.log(`PASS [${expected.name}] -> ${expected.expectedCode ?? "ok:true"}`);
    }
  });

  // Assert coarse-location blocker.
  parsed.locations.forEach((actual, i) => {
    const expected = LOCATION_FIXTURES[i];
    if (actual.clean !== expected.expectedClean) {
      failures++;
      console.error(
        `FAIL [isCoarseLocationClean: ${expected.name}]: expected ${expected.expectedClean} but got ${actual.clean}`
      );
    } else {
      console.log(`PASS [isCoarseLocationClean: ${expected.name}] -> ${expected.expectedClean}`);
    }
  });

  if (failures > 0) {
    console.error(`\n${failures} parity check(s) FAILED.`);
    process.exit(1);
  }

  console.log("\nAll screen-parity + coarse-location checks PASSED (server order preserved).");
  process.exit(0);
}

run();
