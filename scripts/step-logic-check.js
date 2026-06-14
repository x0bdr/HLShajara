#!/usr/bin/env node
/**
 * step-logic-check.js — v1.5 category-based wizard logic check.
 *
 * Gates composeLocation, source-type token, evidence count, media link screening,
 * and the new step requires predicates.
 * Run: node scripts/step-logic-check.js
 */

"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");

const SRC = path.join(__dirname, "..", "src", "lib", "wizard");

const HOOK_SOURCE = `
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as pathResolve } from "node:path";
export async function resolve(specifier, context, next) {
  if ((specifier.startsWith("./") || specifier.startsWith("../")) &&
      !/\\.[mc]?[jt]s$/.test(specifier) && context.parentURL) {
    const parentPath = fileURLToPath(context.parentURL);
    const cand = pathResolve(dirname(parentPath), specifier + ".ts");
    if (existsSync(cand)) return next(pathToFileURL(cand).href, context);
  }
  return next(specifier, context);
}
`;

function buildDriver(hookUrl) {
  const logic = JSON.stringify("file://" + path.join(SRC, "step-logic.ts"));
  const reg = JSON.stringify("file://" + path.join(SRC, "registry.ts"));
  const st = JSON.stringify("file://" + path.join(SRC, "state.ts"));
  return `
import { register } from "node:module";
register(${JSON.stringify(hookUrl)});

const {
  composeLocation, SOURCE_TYPE_SLUGS, prefixSourceType, screenMediaLink,
  evidenceSourceCount, requiresLocationInfo, requiresEntityTypeName,
  requiresReportDetails, requiresExperience, requiresMediaEvidence, requiresAboutYou,
} = await import(${logic});
const { STEPS } = await import(${reg});
const { initialWizardState } = await import(${st});

const baseForm = initialWizardState.form;
function form(over) { return { ...baseForm, ...over }; }

const out = {};
out.stepIds = STEPS.map((s) => s.id);
out.locFull = composeLocation("Syria", "Homs");
out.locCountryOnly = composeLocation("Syria", "");
out.locEmpty = composeLocation("", "");
out.slugTuple = SOURCE_TYPE_SLUGS;
const once = prefixSourceType("court", "UN report");
out.prefixOnce = once;
out.prefixTwice = prefixSourceType("court", once);
out.prefixReslug = prefixSourceType("un", once);
out.prefixEmpty = prefixSourceType("", "x");
out.evCount = evidenceSourceCount(form({
  sourceLinks: [{ url: "https://a.org", title: "" }, { url: "", title: "" }],
  sourceFiles: [
    { hash: "h1", filename: "f1", originalName: "o1", url: "u1", size: 1 },
    { hash: "h2", filename: "f2", originalName: "o2", url: "u2", size: 2 },
  ],
}));
out.mediaReject = screenMediaLink("https://facebook.com/someone");
out.mediaEmpty = screenMediaLink("");
out.mediaClean = screenMediaLink("https://hrw.org/report");
out.locMissing = requiresLocationInfo(form({ allegationLocation: "" }));
out.locPresent = requiresLocationInfo(form({ allegationLocation: "Syria" }));
out.etnMissing = requiresEntityTypeName(form({ entityName: "", reportCategory: "", reportMetadata: {} }));
out.etnPresent = requiresEntityTypeName(form({
  entityName: "X", reportCategory: "commercial", reportMetadata: { orgType: "brand" }
}));
out.detailsAlways = requiresReportDetails(baseForm);
out.expShort = requiresExperience(form({ allegationDescription: "too short" }));
out.expOk = requiresExperience(form({ allegationDescription: "x".repeat(20) }));
out.evNoLink = requiresMediaEvidence(form({ sourceLinks: [] }));
out.evOneLink = requiresMediaEvidence(form({ sourceLinks: [{ url: "https://a.org", title: "" }] }));
out.aboutAlways = requiresAboutYou(baseForm);

process.stdout.write(JSON.stringify(out));
`;
}

function run() {
  const hookPath = path.join(os.tmpdir(), `hls-step-logic-hook-${process.pid}.mjs`);
  fs.writeFileSync(hookPath, HOOK_SOURCE, "utf8");
  const hookUrl = "file://" + hookPath;

  let res;
  try {
    res = spawnSync(
      process.execPath,
      ["--experimental-strip-types", "--no-warnings", "--input-type=module", "-"],
      { input: buildDriver(hookUrl), encoding: "utf8" }
    );
  } finally {
    try {
      fs.unlinkSync(hookPath);
    } catch {}
  }

  if (res.status !== 0) {
    console.error("FAIL: could not execute the v1.5 step-logic modules under --experimental-strip-types.");
    console.error(res.stderr || res.stdout || "(no output)");
    process.exit(1);
  }

  let o;
  try {
    o = JSON.parse(res.stdout);
  } catch {
    console.error("FAIL: driver did not emit valid JSON.");
    console.error(res.stdout);
    process.exit(1);
  }

  let failures = 0;
  function check(name, fn) {
    try {
      fn();
      console.log(`PASS [${name}]`);
    } catch (e) {
      failures++;
      console.error(`FAIL [${name}]: ${e.message}`);
    }
  }

  check("STEPS id-order is the v1.5 8-step flow", () =>
    assert.deepEqual(o.stepIds, [
      "report-category", "location-info", "entity-type-name", "report-details",
      "experience", "media-evidence", "about-you", "review",
    ]));
  check("composeLocation joins with em-dash", () => assert.equal(o.locFull, "Syria — Homs"));
  check("composeLocation country-only when city empty", () => assert.equal(o.locCountryOnly, "Syria"));
  check("composeLocation '' when both empty", () => assert.equal(o.locEmpty, ""));
  check("SOURCE_TYPE_SLUGS is the six slugs in order", () =>
    assert.deepEqual(o.slugTuple, ["un", "court", "sanctions", "hr", "journalism", "official"]));
  check("prefixSourceType prefixes once", () => assert.equal(o.prefixOnce, "[TYPE: court] UN report"));
  check("prefixSourceType is idempotent", () => assert.equal(o.prefixTwice, o.prefixOnce));
  check("prefixSourceType re-slug replaces", () => assert.equal(o.prefixReslug, "[TYPE: un] UN report"));
  check("prefixSourceType empty slug passes through", () => assert.equal(o.prefixEmpty, "x"));
  check("evidenceSourceCount counts links not files", () => assert.equal(o.evCount, 1));
  check("screenMediaLink rejects a personal social link", () => assert.equal(o.mediaReject, false));
  check("screenMediaLink passes empty", () => assert.equal(o.mediaEmpty, true));
  check("screenMediaLink passes a clean url", () => assert.equal(o.mediaClean, true));
  check("requiresLocationInfo false without country", () => assert.equal(o.locMissing, false));
  check("requiresLocationInfo true with country", () => assert.equal(o.locPresent, true));
  check("requiresEntityTypeName false without name/category/orgType", () => assert.equal(o.etnMissing, false));
  check("requiresEntityTypeName true with name/category/orgType", () => assert.equal(o.etnPresent, true));
  check("requiresReportDetails always true", () => assert.equal(o.detailsAlways, true));
  check("requiresExperience false below 20 chars", () => assert.equal(o.expShort, false));
  check("requiresExperience true at 20 chars", () => assert.equal(o.expOk, true));
  check("requiresMediaEvidence true with 0 links (sources optional)", () => assert.equal(o.evNoLink, true));
  check("requiresMediaEvidence true with 1 link (sources optional)", () => assert.equal(o.evOneLink, true));
  check("requiresAboutYou always true", () => assert.equal(o.aboutAlways, true));

  if (failures > 0) {
    console.error(`\n${failures} v1.5 step-logic check(s) FAILED.`);
    process.exit(1);
  }
  console.log("\nAll v1.5 step-logic checks PASSED.");
  process.exit(0);
}

run();
