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

export const BANNED_PATTERNS = [
  /\b(علوي|علوية|علويين|نصيري|نصيرية|نصيريين|شيعي|شيعية|شيعة|سني|سنية|سنّي|سُنّي|درزي|درزية|مسيحي|مسيحية|أيزيدي|أيزيدية|كردي|كردية|تركمان|تركماني|أرمني|شركسي|شيشاني|تشيشاني)\b/gi,
  /\b(عائلة| clan |قبيلة|طائفة|مذهب|إثنية|عرق|منطقة \w+ية|محافظة \w+|قرية \w+|حي \w+)\b/gi,
  /\b(اقتلوا|اضربوا|دمروا|فجّروا|حرّقوا|اغتصبوا|اذبحوا|اقتل|اضرب|دمر|فجّر|حرق|اغتصب|اذبح|يجب قتل|لابد من قتل|الموت ل|القتل ل|القضاء على)\b/gi,
  /\b(خنازير|كلاب|قردة|جرذان|حشرات|أوبئة|وباء|طاعون|ملعون|ملعونة|نجس|نجسة|خبيث|خبيثة|وسخ|وسخة)\b/gi,
];

export const HATE_PATTERNS = [
  /\b(الموت لل|المقاومة ضد|الجهاد ضد|الانتقام من|الثأر ل|التطهير من|التخلص من|إبادة|إبادة جماعية|تطهير عرقي|تطهير طائفي|تطهير مذهبي)\b/gi,
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

  // Incitement detection: calls to violence
  incitement = /\b(اقتلوا|اضربوا|دمروا|فجّروا|حرّقوا|اغتصبوا|اذبحوا|يجب قتل|لابد من قتل|الموت ل|القتل ل|القضاء على)\b/gi.test(text);

  return { banned, incitement, hateTone, matches: [...new Set(matches)] };
}

/* ---------- ADDITIONAL PATTERN SETS ---------- */

export const INNOCENT_PROFESSIONS = [
  /\b(طفل|طفلة|أطفال|طفول|civilian|مدني|مدنية|doctor|طبيب|طبيبة|teacher|معلم|معلمة|nurse|ممرض|ممرضة|journalist|صحفي|صحفية|student|طالب|طالبة|hospital|مستشفى|school|مدرسة|clinic|عيادة|university|جامعة|researcher|باحث|باحثة|activist|ناشط|ناشطة|aid worker|عامل إغاثة)\b/gi,
];

export const ORG_TERMS = [
  /\b(division|فرقة|brigade|لواء|regiment|فوج|battalion|كتيبة|committee|لجنة|ministry|وزارة|council|مجلس|organization|منظمة|party|حزب|force|قوة| apparatus|جهاز|branch|فرع)\b/gi,
];

export const PRIVATE_DATA_PATTERNS = [
  /\b\d{4,}\s*[-–]\s*\d{4,}\s*[-–]\s*\d{2,}/, // phone numbers
  /\b\d{1,3}\.\d{1,6},\s*\d{1,3}\.\d{1,6}\b/, // GPS coordinates
  /\b(شارع|ساحة|حي|منطقة|بناية|طابق|شقة|زقاق|عمارة)\s+\w+/i, // addresses
  /\b(facebook\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com)\/[^\s]+/i, // social media handles
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
    // Individual should not have organizational role descriptors
    return /\b(فرقة|لواء|فوج|كتيبة|لجنة|وزارة|مجلس|منظمة|حزب|قوة|جهاز|مؤسسة)\b/.test(role);
  }
  if (entityType === "organization" || entityType === "military_unit" || entityType === "security_branch" || entityType === "official_body") {
    // Organization should not have a single-person job title
    return /\b(ضابط|عقيد|عميد|لواء|عميد|عميد|نقيب|ملازم|رقيب|جندي|مدير|رئيس|وزير|نائب|سكرتير|مساعد|مستشار)\b/.test(role) &&
      !/\b(رئيس|مدير|قائد|مسؤول)\b/.test(role);
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
 *   NO_SOURCE -> WEAK_SOURCE(<2) -> GROUP_TARGET -> INCITEMENT
 *   -> HATE_TONE -> INNOCENT_PARTY -> PRIVATE_TARGETING -> MISMATCH
 *
 * Screens 3-6 run on the concatenation
 * `entityName + " " + entityRole + " " + allegationDescription` — the same join
 * the server uses. Client-surfaced errors therefore match what `/api/submit`
 * would return; the server remains the authoritative trust boundary.
 */
export function runScreens(data: RunScreensInput): PersistResult<RunScreensInput> {
  // 1. Must have at least one source
  if ((data.sourceCount ?? 0) === 0) {
    return {
      ok: false,
      code: "NO_SOURCE",
      message: "Every allegation must have at least one credible source.",
      field: "sources",
    };
  }

  // 1b. Weak source check: single source is inherently weak
  if ((data.sourceCount ?? 0) < 2) {
    return {
      ok: false,
      code: "WEAK_SOURCE",
      message: "Submissions require at least two independent sources for credibility.",
      field: "sources",
    };
  }

  // 2. Screen free-text fields
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
