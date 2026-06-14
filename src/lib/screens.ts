/**
 * Pure, framework-free validation screens (EV-05).
 *
 * Single source of truth for the eight rejection screens + the coarse-location
 * (street-address) blocker. The SAME regexes run:
 *   - client-side (advisory hints only — NOT a security control), and
 *   - server-side via `src/db/persist.ts`, which re-imports from this module,
 * so client and server CANNOT drift.
 *
 * This module is importable from a `"use client"` component: it contains ZERO
 * imports from `@/db`, `drizzle`, `./audit`, `./index`, or any server module.
 * No runtime dependencies.
 *
 * The screen bodies below are a VERBATIM lift of the corresponding definitions
 * in `src/db/persist.ts`; `persist.ts` now imports them from here.
 */

/* ---------- BANNED PATTERNS ---------- */

/*
 * UNICODE-AWARE BOUNDARIES (v1.4 word-boundary fix)
 * -------------------------------------------------
 * The original patterns used ASCII `\b` / `\w`, which only fire at an
 * `[A-Za-z0-9_]` transition. Arabic script is NOT in that class, so a bare or
 * Arabic-flanked banned term (e.g. «هذه الطائفة») never matched — the screen
 * silently passed identity-targeting / incitement / hate text on BOTH client
 * and server. We replace ASCII anchoring with Unicode-property boundaries
 * (`u` flag) so the EXISTING term lists actually fire for Arabic and Latin.
 *
 * Token shape (see `arBoundary`):
 *   (?<![\p{L}\p{N}_]) <optional Arabic proclitics> (?:TERMS) (?![\p{L}\p{N}_])
 *
 * - The lookbehind/lookahead use Unicode letter/number classes, so a term is
 *   only matched as a standalone token, never as a substring of a longer word
 *   (e.g. «عرق» does NOT fire inside «عرقلة» / «معرقل»). This preserves the
 *   original `\b`-style "whole token only" intent without false positives.
 * - Arabic is agglutinative: the definite article «ال» and the proclitics
 *   و/ف/ب/ك/ل attach DIRECTLY to a word with no space, so «الطائفة»,
 *   «وعلويين», «بالطائفة», «للطائفة» are the SAME banned token. The optional
 *   `AR_PROCLITIC` cluster strips those leading clitics so clitic-prefixed
 *   forms match, while the outer Unicode boundary still requires a real
 *   word break before the clitic.
 * - TRAILING forms (suffixes like «مذهبية») are intentionally left NON-matching
 *   unless the suffixed form is itself enumerated in the list (the lists already
 *   spell out singular/plural/gender variants, e.g. علوي/علوية/علويين). This
 *   matches the original trailing-`\b` behavior and avoids over-blocking
 *   legitimate derived words.
 */

// Arabic proclitics that attach with no space: و ف ب ك ل + definite article ال
// (and the assimilated «لل» = لِ+ال). Optional, repeatable (e.g. «وبال…»).
const AR_PROCLITIC = "(?:[وفبكل]|ال|وال|فال|بال|كال|لل|ولل)*";

// Wrap an Arabic alternation as a Unicode-boundaried, clitic-aware token.
function arToken(terms: string): string {
  return "(?<![\\p{L}\\p{N}_])" + AR_PROCLITIC + "(?:" + terms + ")(?![\\p{L}\\p{N}_])";
}

// Wrap a Latin alternation as a Unicode-boundaried token (no Arabic clitics,
// but boundaries are Unicode-aware so it composes with Arabic context).
function latinToken(terms: string): string {
  return "(?<![\\p{L}\\p{N}_])(?:" + terms + ")(?![\\p{L}\\p{N}_])";
}

// A "TOKEN region" word (after a street/region keyword): one or more Unicode
// letters/numbers — replaces the ASCII-only `\w+`.
const UWORD = "[\\p{L}\\p{N}]+";

export const BANNED_PATTERNS = [
  new RegExp(
    arToken(
      "علوي|علوية|علويين|نصيري|نصيرية|نصيريين|شيعي|شيعية|شيعة|سني|سنية|سنّي|سُنّي|درزي|درزية|مسيحي|مسيحية|أيزيدي|أيزيدية|كردي|كردية|تركمان|تركماني|أرمني|شركسي|شيشاني|تشيشاني"
    ),
    "giu"
  ),
  // Group nouns: Arabic clitic-aware tokens, the spaced-Latin «clan», and the
  // region constructs («منطقة <word>», «محافظة <word>», …) which need a word
  // AFTER the keyword.
  new RegExp(
    arToken("عائلة|قبيلة|طائفة|مذهب|إثنية|عرق") +
      "|" + latinToken("clan") +
      "|" + "(?<![\\p{L}\\p{N}_])(?:منطقة|محافظة|قرية|حي)\\s+" + UWORD,
    "giu"
  ),
  new RegExp(
    arToken(
      "اقتلوا|اضربوا|دمروا|فجّروا|حرّقوا|اغتصبوا|اذبحوا|اقتل|اضرب|دمر|فجّر|حرق|اغتصب|اذبح"
    ) +
      // Multi-word incitement phrases keep an internal space; they are anchored
      // by a Unicode word boundary at the start only (the phrase itself ends in
      // a clitic/preposition that legitimately precedes a name).
      "|(?<![\\p{L}\\p{N}_])(?:يجب قتل|لابد من قتل|الموت ل|القتل ل|القضاء على)",
    "giu"
  ),
  new RegExp(
    arToken(
      "خنازير|كلاب|قردة|جرذان|حشرات|أوبئة|وباء|طاعون|ملعون|ملعونة|نجس|نجسة|خبيث|خبيثة|وسخ|وسخة"
    ),
    "giu"
  ),
];

export const HATE_PATTERNS = [
  // Mostly multi-word phrases; anchor at a leading Unicode boundary. The
  // single-token «إبادة» is also covered by an internal alternation branch.
  new RegExp(
    "(?<![\\p{L}\\p{N}_])(?:الموت لل|المقاومة ضد|الجهاد ضد|الانتقام من|الثأر ل|التطهير من|التخلص من|إبادة جماعية|تطهير عرقي|تطهير طائفي|تطهير مذهبي)" +
      "|" + arToken("إبادة"),
    "giu"
  ),
];

/* ---------- VALIDATION RESULT ---------- */

export type PersistResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; field?: string };

/* ---------- SCREENING ---------- */

export function screenText(text: string): {
  banned: boolean;
  incitement: boolean;
  hateTone: boolean;
  matches: string[];
} {
  const matches: string[] = [];
  let banned = false;
  let incitement = false;
  let hateTone = false;

  for (const pattern of BANNED_PATTERNS) {
    const found = text.match(pattern);
    if (found) {
      banned = true;
      matches.push(...found);
    }
  }

  for (const pattern of HATE_PATTERNS) {
    const found = text.match(pattern);
    if (found) {
      hateTone = true;
      matches.push(...found);
    }
  }

  // Incitement detection: calls to violence. Unicode-aware boundaries (NOT
  // ASCII `\b`) so bare/clitic-prefixed Arabic verbs fire. NOTE (carried over
  // from STATE.md): this token set is a strict subset of BANNED_PATTERNS[2]
  // (the group-target screen), which runs first in the cascade — so on the real
  // server INCITEMENT is reached only via a path GROUP_TARGET did not already
  // claim. This fix does not change that ordering; it only makes both screens
  // actually fire for Arabic. No `g` flag: this regex is consumed with `.test()`
  // (stateful lastIndex would skip matches on reuse).
  incitement = new RegExp(
    arToken(
      "اقتلوا|اضربوا|دمروا|فجّروا|حرّقوا|اغتصبوا|اذبحوا|اقتل|اضرب|دمر|فجّر|حرق|اغتصب|اذبح"
    ) + "|(?<![\\p{L}\\p{N}_])(?:يجب قتل|لابد من قتل|الموت ل|القتل ل|القضاء على)",
    "iu"
  ).test(text);

  return { banned, incitement, hateTone, matches: [...new Set(matches)] };
}

/* ---------- ADDITIONAL PATTERN SETS ---------- */

// All patterns below are consumed via `.test()` (`.some(p => p.test(...))`), so
// they intentionally carry NO `g` flag — a stateful `lastIndex` would skip
// matches across reuse of the shared module-level objects.
export const INNOCENT_PROFESSIONS = [
  new RegExp(
    arToken(
      "طفل|طفلة|أطفال|طفول|مدني|مدنية|طبيب|طبيبة|معلم|معلمة|ممرض|ممرضة|صحفي|صحفية|طالب|طالبة|مستشفى|مدرسة|عيادة|جامعة|باحث|باحثة|ناشط|ناشطة"
    ) +
      "|" +
      latinToken(
        "civilian|doctor|teacher|nurse|journalist|student|hospital|school|clinic|university|researcher|activist"
      ) +
      // multi-word Latin/Arabic phrases keep an internal space; leading boundary.
      "|(?<![\\p{L}\\p{N}_])(?:aid worker|عامل إغاثة)",
    "iu"
  ),
];

export const ORG_TERMS = [
  new RegExp(
    arToken(
      "فرقة|لواء|فوج|كتيبة|لجنة|وزارة|مجلس|منظمة|حزب|قوة|جهاز|فرع"
    ) +
      "|" +
      latinToken(
        "division|brigade|regiment|battalion|committee|ministry|council|organization|party|force|apparatus|branch"
      ),
    "iu"
  ),
];

export const PRIVATE_DATA_PATTERNS = [
  /(?<![\d.])\d{4,}\s*[-–]\s*\d{4,}\s*[-–]\s*\d{2,}/, // phone numbers
  /(?<![\d.])\d{1,3}\.\d{1,6},\s*\d{1,3}\.\d{1,6}(?![\d])/, // GPS coordinates
  // Street-address: clitic-aware Arabic street tokens followed by a word.
  // Unicode-aware so «شارع الرشيد» / «الشارع …» fire (ASCII `\w+` could not).
  new RegExp(arToken("شارع|ساحة|حي|منطقة|بناية|طابق|شقة|زقاق|عمارة|حارة") + "\\s+" + UWORD, "iu"),
  // Latin street tokens in real addresses, e.g. «12 Al-Rasheed Street».
  new RegExp(
    latinToken("street|st|avenue|ave|road|rd|boulevard|blvd") + "|" +
      "(?<![\\p{L}\\p{N}_])(?:facebook\\.com|instagram\\.com|twitter\\.com|x\\.com|tiktok\\.com)/[^\\s]+",
    "iu"
  ),
];

export function screenInnocentParty(text: string): boolean {
  return INNOCENT_PROFESSIONS.some((p) => p.test(text));
}

export function screenPrivateTargeting(text: string): boolean {
  return PRIVATE_DATA_PATTERNS.some((p) => p.test(text));
}

export function screenMismatch(entityType: string, entityRole: string): boolean {
  const role = entityRole.toLowerCase();
  if (entityType === "individual") {
    // Individual should not have organizational role descriptors.
    // Unicode-aware, clitic-aware so «الفرقة»/«واللواء» fire (ASCII `\b` could not).
    return new RegExp(
      arToken("فرقة|لواء|فوج|كتيبة|لجنة|وزارة|مجلس|منظمة|حزب|قوة|جهاز|مؤسسة"),
      "iu"
    ).test(role);
  }
  if (entityType === "organization" || entityType === "military_unit" || entityType === "security_branch" || entityType === "official_body") {
    // Organization should not have a single-person job title.
    return new RegExp(
      arToken("ضابط|عقيد|عميد|لواء|نقيب|ملازم|رقيب|جندي|مدير|رئيس|وزير|نائب|سكرتير|مساعد|مستشار"),
      "iu"
    ).test(role) &&
      !new RegExp(arToken("رئيس|مدير|قائد|مسؤول"), "iu").test(role);
  }
  return false;
}

/* ---------- COARSE-LOCATION BLOCKER (S5) ---------- */

/**
 * S5 coarse-location blocker for the governorate/city field.
 *
 * Returns `false` (i.e. NOT clean) when the value contains a street-level
 * address — matched by the third PRIVATE_DATA_PATTERN
 * (`\b(شارع|ساحة|حي|منطقة|بناية|طابق|شقة|زقاق|عمارة)\s+\w+`). Governorate/city
 * names with no street token (e.g. "دمشق") return `true`.
 *
 * Used live on the location input so street-level entry is blocked inline,
 * while the same regex still fires as PRIVATE_TARGETING in `runScreens`.
 */
export function isCoarseLocationClean(value: string): boolean {
  // PRIVATE_DATA_PATTERNS[2] is the street-address regex.
  return !PRIVATE_DATA_PATTERNS[2].test(value);
}

/* ---------- SHARED SCREEN CASCADE ---------- */

export interface RunScreensInput {
  entityName?: string;
  entityRole?: string;
  entityType?: string;
  allegationDescription?: string;
  /**
   * Number of credible source LINKS. This mirrors the server exactly:
   * `route.ts` passes `sourceCount: data.sourceLinks.length`. Uploaded FILES do
   * NOT count toward WEAK_SOURCE — the UI "≥2 surfaced rows" affordance
   * (links + files) is a separate UX concern, NOT this screen's input. Passing
   * file counts here would let a submission "pass client, server rejects".
   * Fixture: 2 files + 0 links -> WEAK_SOURCE.
   */
  sourceCount?: number;
}

/**
 * Reproduces `validateSubmission`'s early-return cascade in the EXACT server
 * order, returning the first failing code (or `{ ok: true }`):
 *
 *   GROUP_TARGET -> INCITEMENT -> HATE_TONE -> INNOCENT_PARTY
 *   -> PRIVATE_TARGETING -> MISMATCH
 *
 * Sources are optional at intake, so NO_SOURCE / WEAK_SOURCE checks have been
 * removed from this client mirror. Screens 3-6 run on the concatenation
 * `entityName + " " + entityRole + " " + allegationDescription` — the same join
 * the server uses. Client-surfaced errors therefore match what `/api/submit`
 * would return; the server remains the authoritative trust boundary.
 */
export function runScreens(data: RunScreensInput): PersistResult<RunScreensInput> {
  // Sources are optional at intake; publish-time validation still enforces sources.
  void data.sourceCount;

  // 1. Screen free-text fields
  const fieldsToScreen = [
    data.entityName,
    data.entityRole,
    data.allegationDescription,
  ].filter(Boolean) as string[];

  const fullText = fieldsToScreen.join(" ");
  const screen = screenText(fullText);

  if (screen.banned) {
    return {
      ok: false,
      code: "GROUP_TARGET",
      message: `Submission contains identity-based targeting patterns: ${screen.matches.join(", ")}.`,
      field: "text",
    };
  }

  if (screen.incitement) {
    return {
      ok: false,
      code: "INCITEMENT",
      message: "Submission contains calls to violence or incitement.",
      field: "text",
    };
  }

  if (screen.hateTone) {
    return {
      ok: false,
      code: "HATE_TONE",
      message: "Submission contains hate speech or dehumanizing language.",
      field: "text",
    };
  }

  // 3. Innocent party check
  if (screenInnocentParty(fullText)) {
    return {
      ok: false,
      code: "INNOCENT_PARTY",
      message: "Submission appears to target a protected or non-combatant party (child, civilian, medical, educational).",
      field: "text",
    };
  }

  // 4. Private targeting / doxxing check
  if (screenPrivateTargeting(fullText)) {
    return {
      ok: false,
      code: "PRIVATE_TARGETING",
      message: "Submission contains private data (addresses, phone numbers, coordinates, or personal social media).",
      field: "text",
    };
  }

  // 5. Type/role mismatch check
  if (data.entityType && data.entityRole && screenMismatch(data.entityType, data.entityRole)) {
    return {
      ok: false,
      code: "MISMATCH",
      message: "Entity type and role/description appear mismatched.",
      field: "entityRole",
    };
  }

  return { ok: true, data };
}
