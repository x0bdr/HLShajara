#!/usr/bin/env node
/**
 * wizard-a11y-check.js — standalone accessibility grep-gate (no test framework).
 *
 * Locks the Phase-32 INTL-03 a11y contract over the wizard component tree
 * (src/components/wizard/ + src/app/[locale]/submit/). Comments are stripped
 * before token scanning (grep-hygiene rule) so a header comment naming an aria
 * attribute can never self-satisfy a count — critical for the single-live-region
 * assertion.
 *
 * Asserts (FAIL → exit 1):
 *   (1) RADIOGROUP — the choice component has role="radiogroup" + role="radio" +
 *       aria-checked + roving tabIndex + Arrow/Enter/Space key handling.
 *   (2) SINGLE LIVE REGION — exactly ONE aria-live="polite" across the scanned
 *       tree (0 = missing announcer, >1 = duplicate announcer; both fail).
 *   (3) FOCUS-TO-HEADING — an <h2 tabIndex={-1}> plus a focus() call inside a
 *       useEffect keyed on the step (WizardPanel).
 *   (4) ARIA-CURRENT — aria-current="step" present (WizardProgress active pill).
 *   (5) LABELLED INPUTS — every file with an <input>/<select>/<textarea> also
 *       provides a label association (<label>, htmlFor, aria-label, or
 *       aria-labelledby) somewhere in the file.
 *   (6) ERROR ASSOCIATION — every file rendering a `.legal-error` also carries
 *       aria-describedby, role="alert", or role="status" (no color-only errors;
 *       field validation uses alert/describedby, transient gate messages use
 *       the implicit-polite role="status" live region).
 *
 * Mirrors scripts/wizard-rtl-check.js: "use strict" CommonJS, node: builtins only,
 * exit(1) on any failure, exit(0) on pass, grouped human-readable report.
 *
 * Run: node scripts/wizard-a11y-check.js
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const WIZARD_DIR = path.join(ROOT, "src", "components", "wizard");
const SUBMIT_DIR = path.join(ROOT, "src", "app", "[locale]", "submit");

let failures = 0;
function fail(msg) {
  failures++;
  console.error(`FAIL: ${msg}`);
}
function pass(msg) {
  console.log(`PASS: ${msg}`);
}

/** Strip JS/TS block + line comments so header prose can't satisfy a token scan. */
function stripJsComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/**
 * The legacy single-page form (SubmitClient.tsx) predates the wizard and is NOT
 * part of the Phase-28..32 wizard surface (the live /submit route renders
 * WizardClient). It is excluded from the a11y gate so its pre-existing markup
 * is not scored against the wizard contract.
 */
const EXCLUDE = new Set(["SubmitClient.tsx"]);

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(tsx|ts)$/.test(f) && !EXCLUDE.has(f))
    .map((f) => path.join(dir, f));
}

const files = [...collectFiles(WIZARD_DIR), ...collectFiles(SUBMIT_DIR)];
/** filename → comment-stripped source. */
const sources = new Map(files.map((f) => [f, stripJsComments(fs.readFileSync(f, "utf8"))]));
const allCode = [...sources.values()].join("\n");

// ---- (1) RADIOGROUP ---------------------------------------------------------
const radioChecks = [
  ['role="radiogroup"', /role="radiogroup"/],
  ['role="radio"', /role="radio"/],
  ["aria-checked", /aria-checked/],
  ["roving tabIndex", /tabIndex=\{\s*isActive\s*\?\s*0\s*:\s*-1\s*\}|tabIndex=\{[^}]*\?\s*0\s*:\s*-1/],
  ["Arrow key handling", /Arrow(?:Down|Up|Left|Right)/],
  ["Enter/Space confirm", /case\s*"Enter"|case\s*" "/],
];
const radioMissing = radioChecks.filter(([, re]) => !re.test(allCode)).map(([name]) => name);
if (radioMissing.length === 0) {
  pass("choice radiogroup: role=radiogroup/radio + aria-checked + roving tabIndex + Arrow/Enter/Space all present.");
} else {
  fail(`choice radiogroup is missing: ${radioMissing.join(", ")}.`);
}

// ---- (2) SINGLE LIVE REGION -------------------------------------------------
const liveMatches = allCode.match(/aria-live="polite"/g) || [];
if (liveMatches.length === 1) {
  pass("exactly ONE aria-live=\"polite\" region across the wizard tree (single step announcer).");
} else if (liveMatches.length === 0) {
  fail("no aria-live=\"polite\" region found — the step announcer is missing.");
} else {
  fail(`${liveMatches.length} aria-live="polite" regions found — duplicate announcers (expected exactly 1).`);
}

// ---- (3) FOCUS-TO-HEADING ---------------------------------------------------
const hasHeadingTabindex = /<h2[^>]*tabIndex=\{-1\}|tabIndex=\{-1\}[\s\S]{0,40}<\/h2>|<h2\s+ref=\{headingRef\}\s+tabIndex=\{-1\}/.test(allCode);
const hasFocusInEffect = /useEffect\([\s\S]*?\.focus\(\)/.test(allCode) && /headingRef/.test(allCode);
if (hasHeadingTabindex && hasFocusInEffect) {
  pass("focus-to-heading: <h2 tabIndex={-1}> + headingRef.focus() in a useEffect.");
} else {
  if (!hasHeadingTabindex) fail("no <h2 tabIndex={-1}> heading found for programmatic focus.");
  if (!hasFocusInEffect) fail("no headingRef.focus() inside a useEffect (focus-on-step-change missing).");
}

// ---- (4) ARIA-CURRENT -------------------------------------------------------
// Accept both the literal aria-current="step" and the conditional JSX form
// aria-current={... ? "step" : undefined} (WizardProgress sets it dynamically).
if (/aria-current=\{[^}]*"step"|aria-current="step"/.test(allCode)) {
  pass('aria-current="step" present on the active progress pill.');
} else {
  fail('aria-current="step" not found in WizardProgress.');
}

// ---- (5) LABELLED INPUTS ----------------------------------------------------
const FORM_CONTROL = /<(input|select|textarea)\b/;
const LABEL_ASSOC = /<label\b|htmlFor=|aria-label=|aria-labelledby=/;
let unlabelled = 0;
for (const [file, code] of sources) {
  if (FORM_CONTROL.test(code) && !LABEL_ASSOC.test(code)) {
    unlabelled++;
    fail(`${path.basename(file)} renders a form control with no label association (label/htmlFor/aria-label).`);
  }
}
if (unlabelled === 0) {
  pass("every file with a form control provides a label association.");
}

// ---- (6) ERROR ASSOCIATION --------------------------------------------------
// A .legal-error is non-color-only when it is announced/associated: field errors
// use role="alert" + aria-describedby; transient submit-gate messages use the
// implicit-polite role="status". Any of the three satisfies the contract.
let colorOnlyErrors = 0;
for (const [file, code] of sources) {
  if (/legal-error/.test(code) && !/aria-describedby|role="alert"|role="status"/.test(code)) {
    colorOnlyErrors++;
    fail(`${path.basename(file)} renders a .legal-error without aria-describedby / role="alert" / role="status" (color-only error).`);
  }
}
if (colorOnlyErrors === 0) {
  pass('every .legal-error carries role="alert", role="status", or aria-describedby (no color-only errors).');
}

if (failures > 0) {
  console.error(`\n${failures} a11y check(s) FAILED.`);
  process.exit(1);
}

console.log("\nAll wizard a11y checks PASSED (radiogroup, single live region, focus-to-heading, aria-current, labelled inputs, error association).");
process.exit(0);
