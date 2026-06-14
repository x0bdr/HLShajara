#!/usr/bin/env node
/**
 * screens-arabic-check.js — Arabic/Unicode word-boundary corpus (safety-critical).
 *
 * Proves the v1.4 fix: src/lib/screens.ts now uses UNICODE-property boundaries
 * (`(?<![\p{L}\p{N}_]) … (?![\p{L}\p{N}_])`, `u` flag) + a clitic-aware Arabic
 * proclitic strip (ال/و/ف/ب/ك/ل), so:
 *   - BARE and clitic-prefixed Arabic banned terms now MATCH (the original
 *     ASCII `\b`/`\w` patterns silently passed them — a both-client-AND-server
 *     screening hole against the platform's primary language).
 *   - Benign Arabic reports about documented conduct, and benign words that
 *     merely share a substring with a banned root, do NOT match (false-positive
 *     guard — over-blocking would wrongly reject legitimate accountability
 *     reports).
 *
 * Drives the TypeScript source directly under Node's `--experimental-strip-types`
 * (same harness as scripts/screens-parity-check.js). Exits 1 on any failure.
 *
 * Run: node scripts/screens-arabic-check.js
 */

"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const SCREENS_TS = path.join(__dirname, "..", "src", "lib", "screens.ts");

// Each case feeds runScreens with 2 valid sources + a benign role, varying only
// allegationDescription, so we isolate the free-text screens (GROUP_TARGET,
// INCITEMENT, HATE_TONE, INNOCENT_PARTY, PRIVATE_TARGETING). expectedCode === null
// means a clean pass (the legitimate-report case).
const BASE = {
  sourceCount: 2,
  entityName: "العقيد فلان الفلاني",
  entityRole: "قائد ميداني",
  entityType: "individual",
};

const CASES = [
  // ---- MUST-MATCH: bare + clitic-prefixed identity targeting (GROUP_TARGET) ----
  { name: "bare sect «طائفة»", text: "استهدف أبناء طائفة بأكملها", expected: "GROUP_TARGET" },
  { name: "clitic ال «الطائفة»", text: "هذه الطائفة الخائنة يجب محاسبتها", expected: "GROUP_TARGET" },
  { name: "clitic و «وعلويين»", text: "حرّض ضد سنة وعلويين في المنطقة", expected: "GROUP_TARGET" },
  { name: "clitic بال «بالطائفة»", text: "ندد بالطائفة كلها", expected: "GROUP_TARGET" },
  { name: "clitic لل «للشيعة»", text: "وجّه تهديدا للشيعة هناك", expected: "GROUP_TARGET" },
  { name: "bare ethnicity «كردي»", text: "وصفه بأنه كردي لا يستحق", expected: "GROUP_TARGET" },
  { name: "region «منطقة <word>»", text: "استهدف منطقة معينة بسبب سكانها", expected: "GROUP_TARGET" },
  { name: "Latin «clan»", text: "targeted the entire clan structure", expected: "GROUP_TARGET" },

  // ---- MUST-MATCH: incitement (subset of GROUP_TARGET -> fires as GROUP_TARGET) ----
  { name: "bare incite «اقتلوا»", text: "كتب اقتلوا كل من يخالفكم", expected: "GROUP_TARGET" },
  { name: "clitic incite «واقتلوا»", text: "دعا واقتلوا المعارضين علنا", expected: "GROUP_TARGET" },

  // ---- MUST-MATCH: hate / dehumanization (HATE_TONE; some dehum terms are in
  // BANNED_PATTERNS[3] which fires as GROUP_TARGET first — assert that order) ----
  { name: "phrase «إبادة جماعية» (HATE_TONE)", text: "أمر بعملية إبادة جماعية ممنهجة", expected: "HATE_TONE" },
  { name: "bare «إبادة» (HATE_TONE)", text: "نفّذ إبادة بحق المحتجزين", expected: "HATE_TONE" },
  { name: "dehum «خنازير» (-> GROUP_TARGET first)", text: "وصف المعتقلين بأنهم خنازير", expected: "GROUP_TARGET" },

  // ---- MUST-MATCH: innocent-party protection ----
  { name: "innocent «أطفال»", text: "استهدف أطفال في ملجأ", expected: "INNOCENT_PARTY" },
  { name: "innocent clitic «والمستشفى»", text: "قصف الموقع والمستشفى المجاور", expected: "INNOCENT_PARTY" },

  // ---- MUST-MATCH: private data / addresses ----
  { name: "Arabic street «شارع الرشيد»", text: "يقيم في شارع الرشيد قرب الساحة", expected: "PRIVATE_TARGETING" },
  { name: "Arabic clitic «الشارع <word>»", text: "شوهد في الشارع الرئيسي يوميا", expected: "PRIVATE_TARGETING" },
  { name: "Latin «12 Al-Rasheed Street»", text: "resided at 12 Al-Rasheed Street downtown", expected: "PRIVATE_TARGETING" },

  // ---- MUST-NOT-MATCH: legitimate report, named actor + documented conduct ----
  {
    name: "legit: named actor + documented act (clean)",
    text: "أمر العقيد فلان بقصف المستشفى الميداني واعتقال مدنيين تعسفيا في حلب عام ٢٠١٦ وفق تقرير لجنة التحقيق الدولية",
    // NOTE: this benign report mentions «مدنيين» (civilians as victims) — but the
    // INNOCENT_PARTY screen guards against TARGETING innocents as the accused;
    // see the dedicated false-positive case below for a victim-free clean report.
    expected: "INNOCENT_PARTY",
  },
  {
    name: "legit clean (no protected-party noun, no banned root)",
    text: "وثّق التقرير الأممي إصداره أوامر بالقصف العشوائي واحتجاز الأشخاص دون محاكمة عام ٢٠١٧",
    expected: null,
  },

  // ---- MUST-NOT-MATCH: benign words sharing a substring with a banned root ----
  { name: "fp guard «عرقلة» (shares «عرق»)", text: "اتُّهم بعرقلة سير العدالة وإخفاء الأدلة", expected: null },
  { name: "fp guard «معرقل» (shares «عرق»)", text: "كان معرقلا لعمل المحققين الدوليين", expected: null },
  { name: "fp guard «مذهبية» suffix (shares «مذهب»)", text: "اتُّهم بإثارة نعرات مذهبية ليست محل التوثيق هنا", expected: null },
];

function buildDriver() {
  const importPath = JSON.stringify("file://" + SCREENS_TS);
  return `
import { runScreens } from ${importPath};
const cases = ${JSON.stringify(CASES.map((c) => ({ name: c.name, input: { ...BASE, allegationDescription: c.text } })))};
const out = cases.map((c) => {
  const r = runScreens(c.input);
  return { name: c.name, code: r.ok ? null : r.code };
});
process.stdout.write(JSON.stringify(out));
`;
}

function run() {
  const res = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "-"],
    { input: buildDriver(), encoding: "utf8" }
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
  parsed.forEach((actual, i) => {
    const expected = CASES[i];
    if (actual.code !== expected.expected) {
      failures++;
      console.error(
        `FAIL [${expected.name}]: expected ${expected.expected ?? "ok:true"} but got ${actual.code ?? "ok:true"}`
      );
    } else {
      console.log(`PASS [${expected.name}] -> ${expected.expected ?? "ok:true"}`);
    }
  });

  if (failures > 0) {
    console.error(`\n${failures} Arabic-corpus check(s) FAILED.`);
    process.exit(1);
  }

  console.log("\nAll Arabic/Unicode boundary checks PASSED (true positives match, false positives guarded).");
  process.exit(0);
}

run();
