import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

export function require2FA(session: Awaited<ReturnType<typeof getSession>>): boolean {
  if (!session) return false;
  const role = session.user.role ?? "";
  const staffRoles = ["reviewer", "senior_reviewer", "admin"];
  const isStaff = staffRoles.includes(role);
  if (!isStaff) return true; // Non-staff don't need 2FA
  return (session.user as any).twoFactorEnabled === true;
}
