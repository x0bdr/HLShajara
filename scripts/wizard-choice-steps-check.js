#!/usr/bin/env node
/**
 * wizard-choice-steps-check.js — v1.5 category-based wizard registry check.
 *
 * Gates the new linear 8-step registry and the reducer reset/restore contract.
 * Run: node scripts/wizard-choice-steps-check.js
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
  const reg = JSON.stringify("file://" + path.join(SRC, "registry.ts"));
  const st = JSON.stringify("file://" + path.join(SRC, "state.ts"));
  return `
import { register } from "node:module";
register(${JSON.stringify(hookUrl)});

const { STEPS, nextStep, prevStep, visibleStepCount, firstIncompleteStep } = await import(${reg});
const { wizardReducer, initialWizardState } = await import(${st});

const out = {};
out.stepIds = STEPS.map((s) => s.id);
out.visibleCount = visibleStepCount(initialWizardState);
out.firstIncomplete = firstIncompleteStep(initialWizardState);
out.nextFromCategory = nextStep({ ...initialWizardState, currentStep: "report-category" });
out.prevFromLocation = prevStep({ ...initialWizardState, currentStep: "location-info" });

const reset = wizardReducer(initialWizardState, { type: "RESET" });
out.resetCurrent = reset.currentStep;
out.resetCategory = reset.form.reportCategory;

process.stdout.write(JSON.stringify(out));
`;
}

function run() {
  const hookPath = path.join(os.tmpdir(), `hls-ts-ext-hook-${process.pid}.mjs`);
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
    console.error("FAIL: could not execute the v1.5 wizard modules under --experimental-strip-types.");
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

  check("STEPS order is the 8-step v1.5 flow", () =>
    assert.deepEqual(o.stepIds, [
      "report-category", "location-info", "entity-type-name", "report-details",
      "experience", "media-evidence", "about-you", "review",
    ]));
  check("visibleStepCount equals 8", () => assert.equal(o.visibleCount, 8));
  check("firstIncompleteStep starts at report-category", () =>
    assert.equal(o.firstIncomplete, "report-category"));
  check("nextStep(report-category) = location-info", () =>
    assert.equal(o.nextFromCategory, "location-info"));
  check("prevStep(location-info) = report-category", () =>
    assert.equal(o.prevFromLocation, "report-category"));
  check("RESET lands on report-category", () => assert.equal(o.resetCurrent, "report-category"));
  check("RESET clears reportCategory", () => assert.equal(o.resetCategory, ""));

  if (failures > 0) {
    console.error(`\n${failures} v1.5 wizard registry check(s) FAILED.`);
    process.exit(1);
  }
  console.log("\nAll v1.5 wizard registry checks PASSED.");
  process.exit(0);
}

run();
