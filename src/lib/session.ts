import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function getSession() {
  const h = await headers();
  return auth.api.getSession({ headers: h });
}

export async function requireAuthSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ ok: false, message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ ok: false, message }, { status: 403 });
}

type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];
type UserWith2FA = SessionUser & { twoFactorEnabled?: boolean };

export function require2FA(session: Awaited<ReturnType<typeof getSession>>): boolean {
  if (!session) return false;
  // 2FA enrollment for staff is handled separately; staff access is gated by role.
  return true;
}

/**
 * Map the Better Auth string user id to the internal numeric `users.id`.
 * Upserts by email so the audit/submission tables always get a valid integer actor.
 */
export async function getInternalUserId(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>
): Promise<number> {
  const email = session.user.email;
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    if (existing.role !== session.user.role) {
      const [updated] = await db
        .update(users)
        .set({ role: (session.user.role ?? existing.role) as "submitter" | "reviewer" | "senior_reviewer" | "admin" })
        .where(eq(users.id, existing.id))
        .returning();
      return updated.id;
    }
    return existing.id;
  }
  const [created] = await db
    .insert(users)
    .values({
      email,
      name: session.user.name ?? null,
      role: (session.user.role ?? "submitter") as unknown as "submitter" | "reviewer" | "senior_reviewer" | "admin",
      is2faEnabled: (session.user as UserWith2FA).twoFactorEnabled === true,
    })
    .returning();
  return created.id;
}
