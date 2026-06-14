#!/usr/bin/env node
/**
 * step-logic-check.js — standalone Phase-30 regression check (no test framework).
 *
 * Gates the behavior contract of the two Phase-30 pure-logic touch points:
 *   - src/lib/wizard/step-logic.ts (composeLocation, prefixSourceType,
 *     evidenceSourceCount, screenMediaLink, the five `requires` predicates)
 *   - src/lib/wizard/registry.ts  (the EXACT nine-step UI-SPEC §3 flow order,
 *     with `identity` inserted BETWEEN entity-subtype and conduct)
 *
 * Asserts (Plan 30-01 acceptance):
 *   (a) STEPS id-order is EXACTLY
 *       actor-class,entity-subtype,identity,conduct,role-in-act,describe,evidence,media,about-you
 *       — fails loudly if `identity` is not at index 2 (before conduct).
 *   (b) composeLocation: em-dash join, country-only when city empty, "" when both empty.
 *   (c) prefixSourceType: idempotent (re-apply never double-prefixes) + empty-slug passthrough.
 *   (d) evidenceSourceCount: counts LINKS not files (2 files + 1 link -> 1).
 *   (e) screenMediaLink: rejects a personal social link, passes "".
 *   (f) each `requires` predicate at its boundary (identity/describe/evidence gates;
 *       media + about-you always-true).
 *
 * step-logic.ts imports the screen FUNCTIONS value-side from `../screens` and the
 * registry imports `./step-logic` + `./encoding`; all are runtime-pure (the only
 * non-runtime imports are `import type`). Because this repo uses
 * `moduleResolution: "bundler"` (extensionless relative imports), an off-thread
 * ESM `resolve` hook (registered via `node:module` `register`) maps the
 * extensionless `./step-logic` / `../screens` / `./encoding` specifiers to their
 * `.ts` siblings so Node's `--experimental-strip-types` loader can follow them —
 * WITHOUT touching the idiomatic extensionless source imports (mirrors
 * scripts/wizard-choice-steps-check.js). Exits 1 on any mismatch, 0 when all pass.
 *
 * Run: node scripts/step-logic-check.js
 */

"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");

const SRC = path.join(__dirname, "..", "src", "lib", "wizard");

// Off-thread ESM resolve hook: map extensionless relative specifiers to their
// ".ts" sibling so Node's --experimental-strip-types loader can resolve the
// bundler-style imports in step-logic.ts / registry.ts.
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
  evidenceSourceCount, screenIdentityStep, screenDescribeStep,
  requiresIdentity, requiresDescribe, requiresEvidence, requiresMedia, requiresAboutYou,
} = await import(${logic});
const { STEPS } = await import(${reg});
const { initialWizardState } = await import(${st});

const baseForm = initialWizardState.form;
function form(over) { return { ...baseForm, ...over }; }

const out = {};

// (a) EXACT step id-order
out.stepIds = STEPS.map((s) => s.id);

// (b) composeLocation
out.locFull = composeLocation("Syria", "Homs");
out.locCountryOnly = composeLocation("Syria", "");
out.locEmpty = composeLocation("", "");

// (c) prefixSourceType idempotency + empty-slug passthrough + slug tuple
out.slugTuple = SOURCE_TYPE_SLUGS;
const once = prefixSourceType("court", "UN report");
out.prefixOnce = once;
out.prefixTwice = prefixSourceType("court", once);          // must equal once (idempotent)
out.prefixReslug = prefixSourceType("un", once);            // re-slug replaces, single token
out.prefixEmpty = prefixSourceType("", "x");               // passthrough

// (d) evidenceSourceCount: 2 files + 1 link -> 1 (links only)
out.evCount = evidenceSourceCount(form({
  sourceLinks: [{ url: "https://a.org", title: "" }, { url: "", title: "" }],
  sourceFiles: [
    { hash: "h1", filename: "f1", originalName: "o1", url: "u1", size: 1 },
    { hash: "h2", filename: "f2", originalName: "o2", url: "u2", size: 2 },
  ],
}));

// (e) screenMediaLink: reject social link, pass ""
out.mediaReject = screenMediaLink("https://facebook.com/someone");
out.mediaEmpty = screenMediaLink("");
out.mediaClean = screenMediaLink("https://hrw.org/report");

// (f) requires predicates at boundaries
out.idMissing = requiresIdentity(form({ entityName: "X", entityRole: "Officer", allegationLocation: "" }));
out.idPresent = requiresIdentity(form({ entityName: "X", entityRole: "Officer", allegationLocation: "Syria" }));
out.descShort = requiresDescribe(form({ allegationDescription: "too short" }));
out.descOk = requiresDescribe(form({ allegationDescription: "x".repeat(20) }));
out.evOneLink = requiresEvidence(form({ sourceLinks: [{ url: "https://a.org", title: "" }] }));
out.evTwoLinks = requiresEvidence(form({ sourceLinks: [{ url: "https://a.org", title: "" }, { url: "https://b.org", title: "" }] }));
out.mediaAlways = requiresMedia(baseForm);
out.aboutAlways = requiresAboutYou(baseForm);

// sanity: identity/describe screens are callable and shaped
out.idScreenOk = screenIdentityStep(form({ entityType: "individual", entityRole: "teacher" })).ok;
out.descScreenOk = screenDescribeStep(form({ allegationDescription: "documented detention at a known facility" })).ok;

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
    } catch {
      /* best-effort cleanup */
    }
  }

  if (res.status !== 0) {
    console.error("FAIL: could not execute the Phase-30 step-logic + registry under --experimental-strip-types.");
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

  const WANT_ORDER = [
    "actor-class", "entity-subtype", "identity", "conduct", "role-in-act",
    "describe", "evidence", "media", "about-you",
  ];

  // (a) EXACT order — identity at index 2, before conduct.
  check("STEPS id-order is EXACTLY the nine-step UI-SPEC §3 flow order", () =>
    assert.deepEqual(o.stepIds, WANT_ORDER));
  check("identity sits at index 2 (before conduct)", () =>
    assert.equal(o.stepIds.indexOf("identity"), 2));
  check("identity precedes conduct", () =>
    assert.ok(o.stepIds.indexOf("identity") < o.stepIds.indexOf("conduct")));

  // (b) composeLocation
  check("composeLocation joins with em-dash", () => assert.equal(o.locFull, "Syria — Homs"));
  check("composeLocation country-only when city empty", () => assert.equal(o.locCountryOnly, "Syria"));
  check("composeLocation '' when both empty", () => assert.equal(o.locEmpty, ""));

  // (c) source-type token
  check("SOURCE_TYPE_SLUGS is the six §3 slugs in order", () =>
    assert.deepEqual(o.slugTuple, ["un", "court", "sanctions", "hr", "journalism", "official"]));
  check("prefixSourceType prefixes once", () => assert.equal(o.prefixOnce, "[TYPE: court] UN report"));
  check("prefixSourceType is idempotent (no double-prefix)", () => assert.equal(o.prefixTwice, o.prefixOnce));
  check("prefixSourceType re-slug replaces (single token)", () =>
    assert.equal(o.prefixReslug, "[TYPE: un] UN report"));
  check("prefixSourceType empty slug passes through", () => assert.equal(o.prefixEmpty, "x"));

  // (d) evidence count
  check("evidenceSourceCount counts links not files (2 files + 1 link -> 1)", () =>
    assert.equal(o.evCount, 1));

  // (e) media link
  check("screenMediaLink rejects a personal social link", () => assert.equal(o.mediaReject, false));
  check("screenMediaLink passes empty (optional)", () => assert.equal(o.mediaEmpty, true));
  check("screenMediaLink passes a clean url", () => assert.equal(o.mediaClean, true));

  // (f) requires predicates
  check("requiresIdentity false without country", () => assert.equal(o.idMissing, false));
  check("requiresIdentity true with name+role+country", () => assert.equal(o.idPresent, true));
  check("requiresDescribe false below 20 chars", () => assert.equal(o.descShort, false));
  check("requiresDescribe true at 20 chars", () => assert.equal(o.descOk, true));
  check("requiresEvidence false with 1 link", () => assert.equal(o.evOneLink, false));
  check("requiresEvidence true with 2 links", () => assert.equal(o.evTwoLinks, true));
  check("requiresMedia always true", () => assert.equal(o.mediaAlways, true));
  check("requiresAboutYou always true", () => assert.equal(o.aboutAlways, true));

  // screens callable + clean fixtures pass
  check("screenIdentityStep ok for clean individual/role", () => assert.equal(o.idScreenOk, true));
  check("screenDescribeStep ok for clean documented text", () => assert.equal(o.descScreenOk, true));

  if (failures > 0) {
    console.error(`\n${failures} Phase-30 step-logic check(s) FAILED.`);
    process.exit(1);
  }
  console.log("\nAll Phase-30 step-logic checks PASSED (step-logic + registry order).");
  process.exit(0);
}

run();
