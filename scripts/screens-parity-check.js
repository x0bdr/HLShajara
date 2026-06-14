#!/usr/bin/env node
/**
 * screens-parity-check.js — standalone regression check (no test framework).
 *
 * Proves that src/lib/screens.ts `runScreens` reproduces the server's
 * `validateSubmission` (src/db/persist.ts) rejection cascade EXACTLY:
 *
 *   GROUP_TARGET -> INCITEMENT -> HATE_TONE -> INNOCENT_PARTY
 *   -> PRIVATE_TARGETING -> MISMATCH
 *
 * Sources are optional at intake, so NO_SOURCE / WEAK_SOURCE checks are no
 * longer part of the cascade.
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
//
// REGEX-BOUNDARY NOTE (v1.4 Unicode-aware fix):
// screens.ts now anchors Arabic/Latin terms with UNICODE-property boundaries
// (`(?<![\p{L}\p{N}_]) … (?![\p{L}\p{N}_])`, `u` flag) plus a clitic-aware
// Arabic proclitic strip (ال/و/ف/ب/ك/ل). So BARE and clitic-prefixed Arabic
// terms now match on their own — no ASCII flanking required (the previous
// fixtures' `x5علوي5x` flanking was a workaround for the OLD `\b` bug and is
// REMOVED here). Fixtures use natural Arabic. Deep Arabic true/false-positive
// coverage lives in scripts/screens-arabic-check.js.
//
// INCITEMENT note: the standalone incitement token set is a strict SUBSET of
// BANNED_PATTERNS[2] (the group-target screen, which runs first). So any string
// that would trip INCITEMENT trips GROUP_TARGET first on the real server. The
// INCITEMENT_SUBSUMED fixture proves this order is preserved after the lift.
const FIXTURES = [
  {
    name: "GROUP_TARGET (bare Arabic sect term)",
    input: { entityName: "Person X", entityRole: "leader of علوي group", entityType: "individual", allegationDescription: "documented act described at sufficient length here" },
    expectedCode: "GROUP_TARGET",
  },
  {
    // Incitement tokens are a subset of the group-target screen, so they trip
    // GROUP_TARGET first — proves the GROUP_TARGET-first ordering holds.
    name: "INCITEMENT_SUBSUMED (-> GROUP_TARGET, order preserved)",
    input: { entityName: "Person X", entityRole: "commander", entityType: "individual", allegationDescription: "posted اقتلوا publicly online today" },
    expectedCode: "GROUP_TARGET",
  },
  {
    name: "HATE_TONE (bare Arabic إبادة)",
    input: { entityName: "Person X", entityRole: "commander", entityType: "individual", allegationDescription: "ordered إبادة of detainees in 2016" },
    expectedCode: "HATE_TONE",
  },
  {
    name: "INNOCENT_PARTY (ascii 'doctor')",
    input: { entityName: "Person X", entityRole: "doctor at clinic", entityType: "individual", allegationDescription: "documented act described at sufficient length here" },
    expectedCode: "INNOCENT_PARTY",
  },
  {
    name: "PRIVATE_TARGETING (GPS coordinates)",
    input: { entityName: "Person X", entityRole: "officer", entityType: "individual", allegationDescription: "operated near 33.5138, 36.2765 daily" },
    expectedCode: "PRIVATE_TARGETING",
  },
  {
    name: "MISMATCH (individual + org role لواء)",
    input: { entityName: "Person X", entityRole: "head of لواء", entityType: "individual", allegationDescription: "documented act described at sufficient length here" },
    expectedCode: "MISMATCH",
  },
  {
    name: "CLEAN PASS",
    input: { entityName: "Person X", entityRole: "field officer responsible", entityType: "individual", allegationDescription: "documented act described at sufficient length here with no banned content" },
    expectedCode: null,
  },
];

// isCoarseLocationClean fixtures (S5 coarse-location blocker).
// The address regex is now Unicode-aware (`arToken(شارع|..)\s+[\p{L}\p{N}]+`),
// so a NATURAL Arabic street address «شارع الرشيد» (and clitic «الشارع …»)
// blocks. A bare governorate/city name (no street token) stays clean.
const LOCATION_FIXTURES = [
  { name: "street address blocked", value: "شارع الرشيد", expectedClean: false },
  { name: "governorate allowed", value: "Damascus دمشق", expectedClean: true },
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
