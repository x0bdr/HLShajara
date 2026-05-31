/**
 * Append-only, hash-chained audit log.
 * Every state-changing action produces a ReviewLog row.
 * Tampering with any prior row breaks the chain (detectable on verify).
 */

import { createHash } from "crypto";
import { db } from "./index";
import { reviewLogs } from "./schema";
import type { reviewActionEnum, userRoleEnum } from "./schema";
import type { InferSelectModel } from "drizzle-orm";

export type ReviewLogRow = InferSelectModel<typeof reviewLogs>;

function hashRow(
  prevHash: string | null,
  payload: {
    action: string;
    actorId: number;
    actorRole: string;
    targetTable: string;
    targetId: number;
    newData: unknown;
    createdAt: Date;
  }
): string {
  const data = JSON.stringify({
    prevHash: prevHash ?? "genesis",
    action: payload.action,
    actorId: payload.actorId,
    actorRole: payload.actorRole,
    targetTable: payload.targetTable,
    targetId: payload.targetId,
    newData: payload.newData,
    createdAt: payload.createdAt.toISOString(),
  });
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Append a new audit log entry. Automatically chains to the previous entry.
 */
export async function appendAuditLog(params: {
  action: (typeof reviewActionEnum.enumValues)[number];
  actorId: number;
  actorRole: (typeof userRoleEnum.enumValues)[number];
  entityId?: number | null;
  submissionId?: number | null;
  targetTable: string;
  targetId: number;
  oldData?: unknown;
  newData: unknown;
  reason?: string;
}): Promise<ReviewLogRow> {
  // Find the most recent audit log entry to chain from
  const lastRow = await db.query.reviewLogs.findFirst({
    orderBy: (logs, { desc }) => [desc(logs.id)],
  });

  const prevHash = lastRow?.rowHash ?? null;
  const createdAt = new Date();

  const rowHash = hashRow(prevHash, {
    action: params.action,
    actorId: params.actorId,
    actorRole: params.actorRole,
    targetTable: params.targetTable,
    targetId: params.targetId,
    newData: params.newData,
    createdAt,
  });

  const [inserted] = await db
    .insert(reviewLogs)
    .values({
      action: params.action,
      actorId: params.actorId,
      actorRole: params.actorRole,
      entityId: params.entityId ?? null,
      submissionId: params.submissionId ?? null,
      targetTable: params.targetTable,
      targetId: params.targetId,
      oldData: params.oldData ?? null,
      newData: params.newData,
      reason: params.reason ?? null,
      prevHash,
      rowHash,
      createdAt,
    })
    .returning();

  return inserted;
}

/**
 * Verify the integrity of the entire audit chain.
 * Returns { ok: true } or { ok: false, brokenAt: logId }.
 */
export async function verifyAuditChain(): Promise<
  { ok: true } | { ok: false; brokenAt: number; expected: string; actual: string }
> {
  const rows = await db.query.reviewLogs.findMany({
    orderBy: (logs, { asc }) => [asc(logs.id)],
  });

  let prevHash: string | null = null;

  for (const row of rows) {
    const expectedHash = hashRow(prevHash, {
      action: row.action,
      actorId: row.actorId,
      actorRole: row.actorRole,
      targetTable: row.targetTable,
      targetId: row.targetId,
      newData: row.newData,
      createdAt: row.createdAt,
    });

    if (expectedHash !== row.rowHash) {
      return {
        ok: false,
        brokenAt: row.id,
        expected: expectedHash,
        actual: row.rowHash,
      };
    }

    prevHash = row.rowHash;
  }

  return { ok: true };
}
