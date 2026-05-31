import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { userRoleEnum } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "submitter",
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

/* ---------- RBAC HELPERS ---------- */

export const ROLE_HIERARCHY = {
  submitter: 0,
  reviewer: 1,
  senior_reviewer: 2,
  admin: 3,
} as const;

export function hasRole(
  userRole: string,
  requiredRole: keyof typeof ROLE_HIERARCHY
): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

export function canPublish(userRole: string): boolean {
  // No single actor can publish unilaterally — even admin needs dual review
  // This helper checks if the user can PARTICIPATE in a publish action,
  // not if they can publish alone.
  return hasRole(userRole, "senior_reviewer");
}

export function requireAuth(
  session: Session | null
): asserts session is NonNullable<Session> {
  if (!session) {
    throw new Error("Unauthorized");
  }
}
