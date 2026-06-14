#!/usr/bin/env node
/**
 * i18n-parity-check.js — standalone EN↔AR full-tree i18n parity check
 * (no test framework, no new dependency). Wired as `npm run check:i18n`.
 *
 * Models the repo's existing standalone-check idiom (scripts/screens-parity-check.js,
 * scripts/wizard-reducer-check.js): "use strict" CommonJS, node: builtins only,
 * process.exit(1) on any failure, process.exit(0) when parity holds, with a
 * grouped, human-readable report.
 *
 * Unlike the earlier submit-only checker this scans the WHOLE message tree
 * (every namespace) generically by flattening each locale to a dot-path key set.
 *
 * Asserts (FAIL → exit 1):
 *   (a) keys present in EN but missing in AR;
 *   (b) keys present in AR but missing in EN;
 *   (c) ICU placeholder mismatches — the `{token}` set of each EN value must
 *       equal the `{token}` set of its AR counterpart, per key;
 *   (d) empty-string / whitespace-only values in either locale.
 * Warns (does NOT fail):
 *   (e) AR value byte-identical to its EN counterpart under the `submit`
 *       namespace (stub / untranslated detector — some keys, e.g. proper nouns
 *       or shared Latin tokens, may legitimately match, so this is advisory).
 *
 * Run: node scripts/i18n-parity-check.js   (or: npm run check:i18n)
 */

"use strict";

const path = require("node:path");

const en = require(path.join(__dirname, "..", "messages", "en.json"));
const ar = require(path.join(__dirname, "..", "messages", "ar.json"));

/**
 * Recursively flatten a nested message object to a Map of dot-path → string value.
 * Arrays are treated as leaf values (the project messages have no array values,
 * but this keeps the walk total). Nested plain objects recurse.
 */
function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out.set(key, v);
    }
  }
  return out;
}

/** Extract the set of ICU placeholder tokens ({name}, {n}, {count}…) from a value. */
function placeholders(value) {
  if (typeof value !== "string") return new Set();
  const set = new Set();
  const re = /\{\s*([a-zA-Z0-9_]+)\s*[,}]/g;
  let m;
  while ((m = re.exec(value)) !== null) set.add(m[1]);
  return set;
}

function eqSet(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

const enFlat = flatten(en, "", new Map());
const arFlat = flatten(ar, "", new Map());

let failures = 0;
function fail(msg) {
  failures++;
  console.error(`FAIL: ${msg}`);
}

// (a)+(b) key-set parity (symmetric difference).
const enKeys = new Set(enFlat.keys());
const arKeys = new Set(arFlat.keys());
const enOnly = [...enKeys].filter((k) => !arKeys.has(k)).sort();
const arOnly = [...arKeys].filter((k) => !enKeys.has(k)).sort();
if (enOnly.length) fail(`keys present in EN but missing in AR (${enOnly.length}): ${enOnly.join(", ")}`);
if (arOnly.length) fail(`keys present in AR but missing in EN (${arOnly.length}): ${arOnly.join(", ")}`);
if (!enOnly.length && !arOnly.length) {
  console.log(`PASS: EN↔AR key sets are equal (${enKeys.size} keys each, all namespaces).`);
}

// (c) ICU placeholder parity per shared key.
let placeholderMismatches = 0;
for (const key of enKeys) {
  if (!arKeys.has(key)) continue;
  const ep = placeholders(enFlat.get(key));
  const ap = placeholders(arFlat.get(key));
  if (!eqSet(ep, ap)) {
    placeholderMismatches++;
    fail(
      `placeholder mismatch at ${key}: EN {${[...ep].join(",")}} vs AR {${[...ap].join(",")}}`
    );
  }
}
if (placeholderMismatches === 0) console.log("PASS: ICU placeholder sets match across EN/AR for every shared key.");

// (d) empty / whitespace-only values.
let emptyCount = 0;
for (const [k, v] of enFlat) {
  if (typeof v === "string" && v.trim() === "") {
    emptyCount++;
    fail(`EN ${k} is an empty / whitespace-only string.`);
  }
}
for (const [k, v] of arFlat) {
  if (typeof v === "string" && v.trim() === "") {
    emptyCount++;
    fail(`AR ${k} is an empty / whitespace-only string.`);
  }
}
if (emptyCount === 0) console.log("PASS: no empty / whitespace-only values in EN or AR.");

// (e) untranslated-stub warning (advisory only) — submit namespace.
const stubWarnings = [];
for (const [k, v] of enFlat) {
  if (!k.startsWith("submit.")) continue;
  const av = arFlat.get(k);
  if (typeof v === "string" && typeof av === "string" && v.trim() !== "" && v === av) {
    stubWarnings.push(k);
  }
}
if (stubWarnings.length) {
  console.warn(
    `\nWARN (advisory, non-fatal): ${stubWarnings.length} submit.* AR value(s) byte-identical to EN ` +
      `(possible untranslated stub — verify each is an intentional shared token):\n  ${stubWarnings.join("\n  ")}`
  );
}

if (failures > 0) {
  console.error(`\n${failures} i18n parity check(s) FAILED.`);
  process.exit(1);
}

console.log("\nAll EN↔AR i18n parity checks PASSED (full message tree).");
process.exit(0);
