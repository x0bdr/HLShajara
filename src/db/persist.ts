/**
 * Single non-bypassable persist() validation choke point.
 * Every write to the stores passes through here.
 * Enforces:
 *   1. No identity-based targeting (banned-pattern screen)
 *   2. No zero-source publication
 *   3. No incitement / hate tone in free-text fields
 */

import { appendAuditLog } from "./audit";
import type { userRoleEnum } from "./schema";
import type { PersistResult } from "@/lib/screens";
import {
  screenText,
  screenInnocentParty,
  screenPrivateTargeting,
  screenMismatch,
} from "@/lib/screens";

/* ---------- VALIDATION RESULT ---------- */

// Single source of truth: PersistResult + the pure screens live in
// `@/lib/screens` (EV-05) so client and server cannot drift. Re-export the type
// so existing importers of `persist.ts`'s `PersistResult` keep working.
export type { PersistResult } from "@/lib/screens";

/* ---------- CHOKE POINT ---------- */

interface PersistContext {
  actorId: number;
  actorRole: (typeof userRoleEnum.enumValues)[number];
  reason?: string;
}

/**
 * Validate that an entity/allegation submission meets all structural rules.
 * Called BEFORE any database write.
 *
 * The pure screens (regex pattern sets + screen* functions) are imported from
 * `@/lib/screens`; this function's early-return order is the authoritative
 * server cascade that `runScreens` mirrors client-side.
 */
export function validateSubmission(data: {
  entityName?: string;
  entityRole?: string;
  entityType?: string;
  allegationDescription?: string;
  sourceCount?: number;
  sourceLinks?: { url: string; title?: string }[];
}): PersistResult<typeof data> {
  // Phase 33 (BE-02): sources are optional at intake. The reviewer-only `leadNote`
  // is NEVER counted as a source and is NEVER folded into allegationDescription or
  // any screened free-text field.

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
