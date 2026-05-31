/**
 * Single non-bypassable persist() validation choke point.
 * Every write to the stores passes through here.
 * Enforces:
 *   1. No identity-based targeting (banned-pattern screen)
 *   2. No zero-source publication
 *   3. No incitement / hate tone in free-text fields
 */

import { z } from "zod";
import type { db } from "./index";
import { appendAuditLog } from "./audit";
import type { userRoleEnum } from "./schema";

/* ---------- BANNED PATTERNS ---------- */

const BANNED_PATTERNS = [
  /\b(علوي|علوية|علويين|نصيري|نصيرية|نصيريين|شيعي|شيعية|شيعة|سني|سنية|سنّي|سُنّي|درزي|درزية|مسيحي|مسيحية|أيزيدي|أيزيدية|كردي|كردية|تركمان|تركماني|أرمني|شركسي|شيشاني|تشيشاني)\b/gi,
  /\b(عائلة| clan |قبيلة|طائفة|مذهب|إثنية|عرق|منطقة \w+ية|محافظة \w+|قرية \w+|حي \w+)\b/gi,
  /\b(اقتلوا|اضربوا|دمروا|فجّروا|حرّقوا|اغتصبوا|اذبحوا|اقتل|اضرب|دمر|فجّر|حرق|اغتصب|اذبح|يجب قتل|لابد من قتل|الموت ل|القتل ل|القضاء على)\b/gi,
  /\b(خنازير|كلاب|قردة|جرذان|حشرات|أوبئة|وباء|طاعون|ملعون|ملعونة|نجس|نجسة|خبيث|خبيثة|وسخ|وسخة)\b/gi,
];

const HATE_PATTERNS = [
  /\b(الموت لل|المقاومة ضد|الجهاد ضد|الانتقام من|الثأر ل|التطهير من|التخلص من|إبادة|إبادة جماعية|تطهير عرقي|تطهير طائفي|تطهير مذهبي)\b/gi,
];

/* ---------- VALIDATION RESULT ---------- */

export type PersistResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; field?: string };

/* ---------- SCREENING ---------- */

function screenText(text: string): {
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

/* ---------- CHOKE POINT ---------- */

interface PersistContext {
  actorId: number;
  actorRole: (typeof userRoleEnum.enumValues)[number];
  reason?: string;
}

/**
 * Validate that an entity/allegation submission meets all structural rules.
 * Called BEFORE any database write.
 */
/* ---------- ADDITIONAL PATTERN SETS ---------- */

const INNOCENT_PROFESSIONS = [
  /\b(طفل|طفلة|أطفال|طفول|civilian|مدني|مدنية|doctor|طبيب|طبيبة|teacher|معلم|معلمة|nurse|ممرض|ممرضة|journalist|صحفي|صحفية|student|طالب|طالبة|hospital|مستشفى|school|مدرسة|clinic|عيادة|university|جامعة|researcher|باحث|باحثة|activist|ناشط|ناشطة|aid worker|عامل إغاثة)\b/gi,
];

const ORG_TERMS = [
  /\b(division|فرقة|brigade|لواء|regiment|فوج|battalion|كتيبة|committee|لجنة|ministry|وزارة|council|مجلس|organization|منظمة|party|حزب|force|قوة| apparatus|جهاز|branch|فرع)\b/gi,
];

const PRIVATE_DATA_PATTERNS = [
  /\b\d{4,}\s*[-–]\s*\d{4,}\s*[-–]\s*\d{2,}/, // phone numbers
  /\b\d{1,3}\.\d{1,6},\s*\d{1,3}\.\d{1,6}\b/, // GPS coordinates
  /\b(شارع|ساحة|حي|منطقة|بناية|طابق|شقة|زقاق|عمارة)\s+\w+/i, // addresses
  /\b(facebook\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com)\/[^\s]+/i, // social media handles
];

function screenInnocentParty(text: string): boolean {
  return INNOCENT_PROFESSIONS.some((p) => p.test(text));
}

function screenPrivateTargeting(text: string): boolean {
  return PRIVATE_DATA_PATTERNS.some((p) => p.test(text));
}

function screenMismatch(entityType: string, entityRole: string): boolean {
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

export function validateSubmission(data: {
  entityName?: string;
  entityRole?: string;
  entityType?: string;
  allegationDescription?: string;
  sourceCount?: number;
  sourceLinks?: { url: string; title?: string }[];
}): PersistResult<typeof data> {
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

/**
 * Validate an entity before it can be published.
 * Additional checks for publication readiness.
 */
export function validatePublication(data: {
  entityName: string;
  isDeceased: boolean;
  hasLawyerSignOff: boolean;
  sourceCount: number;
}): PersistResult<typeof data> {
  if (data.sourceCount === 0) {
    return {
      ok: false,
      code: "NO_SOURCE",
      message: "Cannot publish an entity with zero sources.",
      field: "sources",
    };
  }

  // Hard boundary: living persons need lawyer sign-off
  if (!data.isDeceased && !data.hasLawyerSignOff) {
    return {
      ok: false,
      code: "LEGAL_GATE",
      message:
        "Cannot publish a living-person entry without recorded lawyer sign-off.",
      field: "lawyerSignOff",
    };
  }

  return { ok: true, data };
}

/* ---------- WRAPPER ---------- */

/**
 * Wrap any database mutation with audit logging.
 * Usage: const result = await withAudit(ctx, () => db.insert(...).returning());
 */
export async function withAudit<T extends { id: number }>(
  ctx: PersistContext,
  mutation: () => Promise<T[]>,
  meta: {
    action: "create" | "update" | "verify" | "reject" | "publish" | "unpublish" | "correct" | "lawyer_sign_off";
    targetTable: string;
    targetId?: number;
    oldData?: unknown;
    newData?: unknown;
    entityId?: number | null;
    submissionId?: number | null;
  }
): Promise<T[]> {
  const result = await mutation();

  for (const row of result) {
    await appendAuditLog({
      action: meta.action,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      entityId: meta.entityId ?? null,
      submissionId: meta.submissionId ?? null,
      targetTable: meta.targetTable,
      targetId: meta.targetId ?? row.id,
      oldData: meta.oldData ?? null,
      newData: meta.newData ?? row,
      reason: ctx.reason,
    });
  }

  return result;
}
