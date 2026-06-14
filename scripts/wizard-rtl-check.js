#!/usr/bin/env node
/**
 * wizard-rtl-check.js — standalone RTL correctness grep-gate (no test framework).
 *
 * Locks the Phase-32 INTL-02 RTL contract over the wizard CSS + counter components:
 *   (1) PHYSICAL-PROP ABSENCE — no wizard-scoped selector (`.wizard-`, `.choice-`,
 *       `.review-`) in src/components/hlshajara.css uses a physical box property
 *       (margin-left/right, padding-left/right, border-left/right, bare left:/right:,
 *       text-align:left|right) outside a sanctioned `[dir=rtl]` / `direction:ltr` rule.
 *   (2) DS-MONO LTR — src/styles/tokens.css has a `[dir=rtl] .ds-mono` rule forcing
 *       `direction:ltr` (machine strings stay LTR inside RTL — UI-SPEC §10).
 *   (3) MACHINE-STRING LTR — hlshajara.css forces `direction:ltr` on the
 *       `.review-sources` machine-string list under `[dir=rtl]`.
 *   (4) INTL COUNTER — every wizard component that constructs an `Intl.NumberFormat`
 *       includes the `numberingSystem` ("arab") branch for Arabic, AND no wizard
 *       component interpolates a raw step index/total into JSX text outside a
 *       formatter (`fmt.format(...)`).
 *
 * Mirrors the repo's standalone-check idiom (scripts/screens-parity-check.js):
 * "use strict" CommonJS, node: builtins only, exit(1) on any failure, exit(0) on pass,
 * grouped human-readable report. Comments are stripped before token scanning so a
 * header comment naming a property can't self-invalidate a check (grep-hygiene rule).
 *
 * Run: node scripts/wizard-rtl-check.js
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const CSS_FILE = path.join(ROOT, "src", "components", "hlshajara.css");
const TOKENS_FILE = path.join(ROOT, "src", "styles", "tokens.css");
const WIZARD_DIR = path.join(ROOT, "src", "components", "wizard");

let failures = 0;
function fail(msg) {
  failures++;
  console.error(`FAIL: ${msg}`);
}
function pass(msg) {
  console.log(`PASS: ${msg}`);
}

/** Strip CSS block comments so header prose can't satisfy a token scan. */
function stripCssComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "");
}
/** Strip JS/TS line + block comments. */
function stripJsComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const css = stripCssComments(fs.readFileSync(CSS_FILE, "utf8"));
const tokens = stripCssComments(fs.readFileSync(TOKENS_FILE, "utf8"));

// ---- (1) PHYSICAL-PROP ABSENCE on wizard-scoped selectors -------------------
// Walk rule-by-rule: a "rule" is a selector list + its declaration block. Only
// flag physical props inside blocks whose selector mentions a wizard prefix and
// is NOT a sanctioned [dir=rtl] override.
const WIZARD_SELECTOR = /\.(wizard|choice|review)[\w-]*/;
const PHYSICAL = /(?:^|[^-])(?:margin-left|margin-right|padding-left|padding-right|border-left|border-right|left|right)\s*:|text-align\s*:\s*(?:left|right)/;

const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
let m;
let physicalViolations = 0;
while ((m = ruleRe.exec(css)) !== null) {
  const selector = m[1].trim();
  const body = m[2];
  if (!WIZARD_SELECTOR.test(selector)) continue;
  // Sanctioned: [dir=rtl] machine-string LTR rules force direction:ltr + text-align.
  const isRtlOverride = /\[dir=rtl\]/.test(selector) || /direction\s*:\s*ltr/.test(body);
  if (isRtlOverride) continue;
  // Examine each declaration; border-radius shorthand corner values are allowed
  // (no widely-supported logical longhand) when a [dir=rtl] mirror rule exists.
  for (const decl of body.split(";")) {
    const d = decl.trim();
    if (!d) continue;
    if (PHYSICAL.test(d + ";")) {
      physicalViolations++;
      fail(`physical property in wizard rule "${selector}": ${d}`);
    }
  }
}
if (physicalViolations === 0) {
  pass("no wizard-scoped physical properties in hlshajara.css (logical props only).");
}

// ---- (2) DS-MONO LTR under RTL ---------------------------------------------
const dsMonoRtl = /\[dir=rtl\]\s*\.ds-mono\s*\{[^}]*direction\s*:\s*ltr/;
if (dsMonoRtl.test(tokens)) {
  pass("[dir=rtl] .ds-mono forces direction:ltr in tokens.css.");
} else {
  fail("tokens.css is missing a `[dir=rtl] .ds-mono { direction:ltr }` rule.");
}

// ---- (3) MACHINE-STRING (.review-sources) LTR under RTL ---------------------
const reviewSourcesRtl = /\[dir=rtl\]\s*\.review-sources\s*\{[^}]*direction\s*:\s*ltr/;
if (reviewSourcesRtl.test(css)) {
  pass("[dir=rtl] .review-sources forces direction:ltr in hlshajara.css.");
} else {
  fail("hlshajara.css is missing a `[dir=rtl] .review-sources { direction:ltr }` rule.");
}

// ---- (4) INTL COUNTER discipline -------------------------------------------
// Every wizard component that creates an Intl.NumberFormat must include the
// numberingSystem branch. (Bare ICU {count} args default to latn under `ar`, so
// any locale-aware numeric display must route through the arab formatter.)
const wizardFiles = fs
  .readdirSync(WIZARD_DIR)
  .filter((f) => /\.(tsx|ts)$/.test(f))
  .map((f) => path.join(WIZARD_DIR, f));

let intlViolations = 0;
let intlUsers = 0;
for (const file of wizardFiles) {
  const code = stripJsComments(fs.readFileSync(file, "utf8"));
  if (code.includes("Intl.NumberFormat")) {
    intlUsers++;
    if (!code.includes("numberingSystem")) {
      intlViolations++;
      fail(
        `${path.basename(file)} uses Intl.NumberFormat without a numberingSystem ("arab") branch.`
      );
    }
  }
}
if (intlUsers === 0) {
  fail("no wizard component constructs Intl.NumberFormat — the step counter formatter is missing.");
} else if (intlViolations === 0) {
  pass(
    `every wizard component using Intl.NumberFormat (${intlUsers}) includes the numberingSystem branch.`
  );
}

// Raw step-index/total interpolation guard: a `{stepIndex}` / `{stepTotal}` token
// rendered directly in JSX text (not via a fmt.format call) is an RTL digit defect.
let rawInterpViolations = 0;
const rawIndexRe = /\{\s*(?:stepIndex|stepTotal)\s*\}/;
for (const file of wizardFiles) {
  const code = stripJsComments(fs.readFileSync(file, "utf8"));
  // Allow `fmt.format(stepIndex)` etc.; only flag bare `{stepIndex}` JSX braces.
  if (rawIndexRe.test(code)) {
    rawInterpViolations++;
    fail(`${path.basename(file)} interpolates a raw {stepIndex}/{stepTotal} into JSX (use fmt.format).`);
  }
}
if (rawInterpViolations === 0) {
  pass("no wizard component interpolates a raw step index/total into JSX text.");
}

if (failures > 0) {
  console.error(`\n${failures} RTL check(s) FAILED.`);
  process.exit(1);
}

console.log("\nAll wizard RTL checks PASSED (logical props, ds-mono LTR, machine-string LTR, Intl counters).");
process.exit(0);
