#!/usr/bin/env node
/**
 * wizard-choice-steps-check.js — standalone Phase-29 regression check (no test framework).
 *
 * Gates the behavior contract of the three Phase-29 pure-logic modules:
 *   - src/lib/wizard/registry.ts  (the four real choice steps + branch rule)
 *   - src/lib/wizard/encoding.ts  (conduct/role slugs + role-clause helpers)
 *   - src/lib/wizard/state.ts     (INVALIDATE_SUBTYPE orphan-only invalidation)
 *
 * Asserts (Plan 29-01 acceptance):
 *   (a) registry.STEPS = [actor-class, entity-subtype, conduct, role-in-act] in order.
 *   (b) Individual branch: entity-subtype is SKIPPED + UNCOUNTED; nextStep(actor-class)
 *       is "conduct"; visibleStepCount excludes entity-subtype.
 *       Entity branch: entity-subtype IS counted; nextStep(actor-class) is "entity-subtype".
 *   (c) encode/strip round-trips + clause-REPLACE (no double-append) for every ROLE_SLUGS member.
 *   (d) CONDUCT_SLUGS length 14 (Other last) + ROLE_SLUGS length 7 (Other last).
 *   (e) INVALIDATE_SUBTYPE rewrites entityType to the new actor class while leaving
 *       allegationClassification + entityRole BYTE-IDENTICAL (orphan-only invalidation).
 *
 * All three modules are runtime-pure (only `import type` for cross-module TYPE
 * refs; the one runtime import is registry → encoding). They run directly under
 * Node `--experimental-strip-types` (Node 22.6+/23+, default-on in Node 24) with
 * zero deps. Because this repo uses `moduleResolution: "bundler"` (extensionless
 * relative imports), an in-process ESM `resolve` hook (registered off-thread via
 * `node:module` `register`) maps the extensionless `./encoding` specifier to its
 * `.ts` file so Node's raw loader can follow it — WITHOUT touching the idiomatic
 * extensionless source imports. Exits 1 on any mismatch, 0 when all pass.
 *
 * Run: node scripts/wizard-choice-steps-check.js
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
// bundler-style `./encoding` import in registry.ts. Written to a temp file
// because `register()` needs a file URL for the loader module.
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
  const enc = JSON.stringify("file://" + path.join(SRC, "encoding.ts"));
  const st = JSON.stringify("file://" + path.join(SRC, "state.ts"));
  return `
import { register } from "node:module";
register(${JSON.stringify(hookUrl)});

const { STEPS, nextStep, prevStep, visibleStepCount, isCountedStep } = await import(${reg});
const { CONDUCT_SLUGS, ROLE_SLUGS, ROLE_CLAUSE_TOKEN, encodeRoleClause, stripRoleClause } = await import(${enc});
const { wizardReducer, initialWizardState } = await import(${st});

const out = {};

// (a) the four real step ids + order
out.stepIds = STEPS.map((s) => s.id);

// (d) slug tuples
out.conductSlugs = CONDUCT_SLUGS;
out.roleSlugs = ROLE_SLUGS;
out.conductLast = CONDUCT_SLUGS[CONDUCT_SLUGS.length - 1];
out.roleLast = ROLE_SLUGS[ROLE_SLUGS.length - 1];
out.token = ROLE_CLAUSE_TOKEN;

// (b) branch behavior — reuse initialWizardState, override currentStep/entityType/completed.
function stateWith(entityType, completed) {
  return {
    ...initialWizardState,
    currentStep: "actor-class",
    form: { ...initialWizardState.form, entityType },
    completed,
  };
}
const indiv = stateWith("individual", ["actor-class"]);
out.indivNext = nextStep(indiv);
out.indivSubtypeCounted = isCountedStep("entity-subtype", indiv);
out.indivVisibleCount = visibleStepCount(indiv);

const entity = stateWith("organization", ["actor-class"]);
out.entityNext = nextStep(entity);
out.entitySubtypeCounted = isCountedStep("entity-subtype", entity);
out.entityVisibleCount = visibleStepCount(entity);

const indivAtConduct = { ...indiv, currentStep: "conduct" };
out.indivPrevFromConduct = prevStep(indivAtConduct);

// (c) encode/strip round-trip + clause-REPLACE for every ROLE_SLUGS member.
const base = "Brigadier, Branch 215";
out.roundTrip = ROLE_SLUGS.map((slug) => {
  const encoded = encodeRoleClause(base, slug);
  const stripped = stripRoleClause(encoded);
  const replaced = encodeRoleClause(encoded, "owner");
  return {
    slug,
    hasOneToken: encoded.split(ROLE_CLAUSE_TOKEN).length === 2,
    stripped,
    replacedHasOneToken: replaced.split(ROLE_CLAUSE_TOKEN).length === 2,
    replacedStripsToBase: stripRoleClause(replaced) === base,
  };
});
out.stripNoToken = stripRoleClause(base);

// (e) INVALIDATE_SUBTYPE: rewrite entityType, preserve conduct + role byte-identical.
let s = wizardReducer(initialWizardState, { type: "SET_FIELD", field: "entityType", value: "organization" });
s = wizardReducer(s, { type: "SET_FIELD", field: "allegationClassification", value: "torture" });
s = wizardReducer(s, { type: "SET_FIELD", field: "entityRole", value: encodeRoleClause("Officer", "commander") });
const classBefore = s.form.allegationClassification;
const roleBefore = s.form.entityRole;
const inv = wizardReducer(s, { type: "INVALIDATE_SUBTYPE", entityType: "individual" });
out.invEntityType = inv.form.entityType;
out.invClassPreserved = inv.form.allegationClassification === classBefore;
out.invRolePreserved = inv.form.entityRole === roleBefore;
out.invClassValue = inv.form.allegationClassification;

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
    } catch {
      /* best-effort cleanup */
    }
  }

  if (res.status !== 0) {
    console.error("FAIL: could not execute the Phase-29 wizard modules under --experimental-strip-types.");
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

  // (a) step order — Phase 30 inserts the five input steps into UI-SPEC §3 flow
  // order (identity BETWEEN entity-subtype and conduct; describe/evidence/media/
  // about-you AFTER role-in-act). The four Phase-29 choice ids stay in their
  // relative order; only the input steps interleave. The exact nine-step order is
  // gated by scripts/step-logic-check.js; here we assert the four choice ids
  // remain present in their Phase-29 relative order.
  check("STEPS keeps the four choice ids in their Phase-29 relative order", () =>
    assert.deepEqual(
      o.stepIds.filter((id) =>
        ["actor-class", "entity-subtype", "conduct", "role-in-act"].includes(id)),
      ["actor-class", "entity-subtype", "conduct", "role-in-act"]));

  // (d) slug tuples
  check("CONDUCT_SLUGS length 14", () => assert.equal(o.conductSlugs.length, 14));
  check("CONDUCT_SLUGS 'other' is last", () => assert.equal(o.conductLast, "other"));
  check("ROLE_SLUGS length 7", () => assert.equal(o.roleSlugs.length, 7));
  check("ROLE_SLUGS 'other' is last", () => assert.equal(o.roleLast, "other"));
  check("CONDUCT_SLUGS exact order", () =>
    assert.deepEqual(o.conductSlugs, [
      "detention", "torture", "disappearance", "killing", "sexualViolence",
      "financing", "arms", "laundering", "propaganda", "informing",
      "seizure", "detentionSite", "command", "other",
    ]));
  check("ROLE_SLUGS exact order", () =>
    assert.deepEqual(o.roleSlugs, [
      "perpetrator", "commander", "financier", "supplier", "informant", "owner", "other",
    ]));
  check("ROLE_CLAUSE_TOKEN literal", () => assert.equal(o.token, " — role in act: "));

  // (b) branch behavior — Phase 30 inserts `identity` between entity-subtype and
  // conduct, so the Individual branch (entity-subtype skipped) now steps
  // actor-class → identity (not conduct). The branch-SKIP semantics for
  // entity-subtype are unchanged; only the next/visible-count totals grow by the
  // four input steps that now interleave (identity + describe/evidence/media/
  // about-you) plus the terminal review step (Phase 31). Individual: 10 steps
  // minus the skipped entity-subtype = 9.
  check("Individual branch: nextStep(actor-class) = identity (input Step 2)", () =>
    assert.equal(o.indivNext, "identity"));
  check("Individual branch: entity-subtype NOT counted", () =>
    assert.equal(o.indivSubtypeCounted, false));
  check("Individual branch: visibleStepCount = 9 (subtype excluded, review counted)", () =>
    assert.equal(o.indivVisibleCount, 9));
  check("Individual branch: prevStep(conduct) = identity (subtype skipped, identity inserted)", () =>
    assert.equal(o.indivPrevFromConduct, "identity"));
  check("Entity branch: nextStep(actor-class) = entity-subtype", () =>
    assert.equal(o.entityNext, "entity-subtype"));
  check("Entity branch: entity-subtype IS counted", () =>
    assert.equal(o.entitySubtypeCounted, true));
  check("Entity branch: visibleStepCount = 10 (all steps + review counted)", () =>
    assert.equal(o.entityVisibleCount, 10));

  // (c) encode/strip
  o.roundTrip.forEach((r) => {
    check(`role '${r.slug}': encode appends exactly one clause`, () =>
      assert.equal(r.hasOneToken, true));
    check(`role '${r.slug}': strip round-trips to base`, () =>
      assert.equal(r.stripped, "Brigadier, Branch 215"));
    check(`role '${r.slug}': re-encode REPLACES (no stacking)`, () =>
      assert.equal(r.replacedHasOneToken, true));
    check(`role '${r.slug}': replaced strips back to base`, () =>
      assert.equal(r.replacedStripsToBase, true));
  });
  check("strip with no token returns base unchanged", () =>
    assert.equal(o.stripNoToken, "Brigadier, Branch 215"));

  // (e) INVALIDATE_SUBTYPE orphan-only invalidation
  check("INVALIDATE_SUBTYPE rewrites entityType to new actor class", () =>
    assert.equal(o.invEntityType, "individual"));
  check("INVALIDATE_SUBTYPE preserves allegationClassification byte-identical", () =>
    assert.equal(o.invClassPreserved, true));
  check("INVALIDATE_SUBTYPE preserves entityRole byte-identical", () =>
    assert.equal(o.invRolePreserved, true));
  check("INVALIDATE_SUBTYPE keeps conduct value 'torture'", () =>
    assert.equal(o.invClassValue, "torture"));

  if (failures > 0) {
    console.error(`\n${failures} Phase-29 choice-step check(s) FAILED.`);
    process.exit(1);
  }
  console.log("\nAll Phase-29 choice-step checks PASSED (registry + encoding + reducer).");
  process.exit(0);
}

run();
