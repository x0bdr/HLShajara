#!/usr/bin/env node
/**
 * wizard-reducer-check.js — standalone reducer regression check (no test framework).
 *
 * Verifies the behavior contract of src/lib/wizard/state.ts (Plan 28-03, WIZ-05):
 *   - initialWizardState seeds isAnonymous=true (UI-SPEC §8 anonymity-default-on)
 *   - initialWizardState seeds entityType="individual" and sourceLinks=[{url:"",title:""}]
 *   - SET_FIELD sets the field immutably (old state object untouched)
 *   - ADD_SOURCE appends an empty {url,title} row; REMOVE_SOURCE removes by index
 *   - ADD_FILE / REMOVE_FILE mutate sourceFiles immutably
 *   - GOTO_STEP sets currentStep
 *   - INVALIDATE_SUBTYPE rewrites entityType to the new actor class while
 *     preserving the branch-independent conduct/role answers
 *   - RESTORE_DRAFT shallow-merges only known SubmitInput keys (never untrusted keys)
 *   - RESET returns a value deep-equal to initialWizardState
 *
 * Drives the TypeScript source directly via Node's type-stripping
 * (`--experimental-strip-types`, Node 22.6+/23+). state.ts uses ONLY
 * `import type` for SubmitInput/StepId, so type-stripping erases those imports
 * and the reducer runs with zero runtime dependencies. Exits 1 on any mismatch.
 *
 * Run: node scripts/wizard-reducer-check.js
 */

"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");

const STATE_TS = path.join(__dirname, "..", "src", "lib", "wizard", "state.ts");

// Off-thread ESM resolve hook: map extensionless relative specifiers to their
// ".ts" sibling so Node's --experimental-strip-types loader can follow the
// bundler-style imports that state.ts now pulls in (v1.4 M5: state.ts imports
// `./registry` at runtime, which transitively imports `./encoding`/`./step-logic`/
// `../screens`). Mirrors scripts/wizard-choice-steps-check.js. The `@/`-aliased
// imports in those modules are all `import type` (erased at runtime), so only the
// relative specifiers need resolving.
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
  const importPath = JSON.stringify("file://" + STATE_TS);
  return `
import { register } from "node:module";
register(${JSON.stringify(hookUrl)});
const { wizardReducer, initialWizardState } = await import(${importPath});
const out = {};

// seed assertions
out.seedAnon = initialWizardState.form.isAnonymous;
out.seedType = initialWizardState.form.entityType;
out.seedLinks = initialWizardState.form.sourceLinks;
out.seedFiles = initialWizardState.form.sourceFiles;

// SET_FIELD immutability
const s0 = initialWizardState;
const s1 = wizardReducer(s0, { type: "SET_FIELD", field: "entityName", value: "x" });
out.setField = s1.form.entityName;
out.setFieldImmutable = s0.form.entityName; // must remain ""
out.setFieldNewRef = s1 !== s0;

// ADD_SOURCE / REMOVE_SOURCE
const s2 = wizardReducer(s1, { type: "ADD_SOURCE" });
out.addSourceLen = s2.form.sourceLinks.length;
out.addSourceRow = s2.form.sourceLinks[s2.form.sourceLinks.length - 1];
const s3 = wizardReducer(s2, { type: "REMOVE_SOURCE", index: 0 });
out.removeSourceLen = s3.form.sourceLinks.length;

// SET_SOURCE
const s3b = wizardReducer(s2, { type: "SET_SOURCE", index: 0, field: "url", value: "https://e.org" });
out.setSourceUrl = s3b.form.sourceLinks[0].url;
out.setSourceImmutable = s2.form.sourceLinks[0].url; // must remain ""

// ADD_FILE / REMOVE_FILE
const f = { hash: "h", filename: "f", originalName: "o", url: "u", size: 1 };
const s4 = wizardReducer(s1, { type: "ADD_FILE", file: f });
out.addFileLen = s4.form.sourceFiles.length;
out.addFileImmutable = s1.form.sourceFiles.length; // must remain 0
const s5 = wizardReducer(s4, { type: "REMOVE_FILE", index: 0 });
out.removeFileLen = s5.form.sourceFiles.length;

// GOTO_STEP
const s6 = wizardReducer(s1, { type: "GOTO_STEP", step: "conduct" });
out.gotoStep = s6.currentStep;

// INVALIDATE_SUBTYPE (actor-class switch invalidates ONLY the orphaned subtype:
// entityType is rewritten to the new actor class; conduct + role are PRESERVED)
const withType = wizardReducer(s1, { type: "SET_FIELD", field: "entityType", value: "organization" });
const dirty = wizardReducer(withType, { type: "SET_FIELD", field: "allegationClassification", value: "torture" });
const inv = wizardReducer(dirty, { type: "INVALIDATE_SUBTYPE", entityType: "individual" });
out.invalidatedSubtype = inv.form.entityType; // expect "individual"
out.preservedClassification = inv.form.allegationClassification; // expect "torture" (preserved)

// RESTORE_DRAFT — only known SubmitInput keys merged, untrusted dropped
const s7 = wizardReducer(initialWizardState, {
  type: "RESTORE_DRAFT",
  draft: { entityName: "Restored", __proto__pollute: "evil", randomKey: "x" },
});
out.restoreKnown = s7.form.entityName;
out.restoreUnknownDropped = !("randomKey" in s7.form) && !("__proto__pollute" in s7.form);

// RESET deep-equals initial
const s8 = wizardReducer(s7, { type: "RESET" });
out.reset = s8;
out.initial = initialWizardState;

process.stdout.write(JSON.stringify(out));
`;
}

function run() {
  // Write the resolve hook to a temp file (register() needs a file URL).
  const hookPath = path.join(os.tmpdir(), `wizard-reducer-hook-${process.pid}.mjs`);
  fs.writeFileSync(hookPath, HOOK_SOURCE, "utf8");
  const hookUrl = "file://" + hookPath;

  let res;
  try {
    res = spawnSync(
      process.execPath,
      ["--experimental-strip-types", "--input-type=module", "-"],
      { input: buildDriver(hookUrl), encoding: "utf8" }
    );
  } finally {
    try { fs.unlinkSync(hookPath); } catch { /* best-effort cleanup */ }
  }

  if (res.status !== 0) {
    console.error("FAIL: could not execute src/lib/wizard/state.ts under --experimental-strip-types.");
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

  check("seed isAnonymous=true", () => assert.equal(o.seedAnon, true));
  check("seed entityType=individual", () => assert.equal(o.seedType, "individual"));
  check("seed sourceLinks=[{url:'',title:''}]", () =>
    assert.deepEqual(o.seedLinks, [{ url: "", title: "" }]));
  check("seed sourceFiles=[]", () => assert.deepEqual(o.seedFiles, []));
  check("SET_FIELD sets value", () => assert.equal(o.setField, "x"));
  check("SET_FIELD immutable (old untouched)", () => assert.equal(o.setFieldImmutable, ""));
  check("SET_FIELD returns new ref", () => assert.equal(o.setFieldNewRef, true));
  check("ADD_SOURCE appends row", () => assert.equal(o.addSourceLen, 2));
  check("ADD_SOURCE empty row", () => assert.deepEqual(o.addSourceRow, { url: "", title: "" }));
  check("REMOVE_SOURCE by index", () => assert.equal(o.removeSourceLen, 1));
  check("SET_SOURCE sets url", () => assert.equal(o.setSourceUrl, "https://e.org"));
  check("SET_SOURCE immutable", () => assert.equal(o.setSourceImmutable, ""));
  check("ADD_FILE appends file", () => assert.equal(o.addFileLen, 1));
  check("ADD_FILE immutable", () => assert.equal(o.addFileImmutable, 0));
  check("REMOVE_FILE by index", () => assert.equal(o.removeFileLen, 0));
  check("GOTO_STEP sets currentStep", () => assert.equal(o.gotoStep, "conduct"));
  check("INVALIDATE_SUBTYPE rewrites entityType to new actor class", () =>
    assert.equal(o.invalidatedSubtype, "individual"));
  check("INVALIDATE_SUBTYPE preserves conduct (branch-independent)", () =>
    assert.equal(o.preservedClassification, "torture"));
  check("RESTORE_DRAFT merges known key", () => assert.equal(o.restoreKnown, "Restored"));
  check("RESTORE_DRAFT drops untrusted keys", () => assert.equal(o.restoreUnknownDropped, true));
  check("RESET deep-equals initial", () => assert.deepEqual(o.reset, o.initial));

  if (failures > 0) {
    console.error(`\n${failures} reducer check(s) FAILED.`);
    process.exit(1);
  }
  console.log("\nAll wizard reducer checks PASSED.");
  process.exit(0);
}

run();
