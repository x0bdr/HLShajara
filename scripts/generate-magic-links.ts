/**
 * Generate magic-link registration URLs for staff onboarding.
 *
 * Usage:
 *   npx tsx scripts/generate-magic-links.ts --role admin --count 5
 *   npx tsx scripts/generate-magic-links.ts --role reviewer --count 10
 *
 * Output: one URL per line, plus a JSON summary at the end.
 */

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { authUser, authVerification } from "../src/db/schema";

const VALID_ROLES = ["admin", "reviewer", "senior_reviewer", "submitter"] as const;
type StaffRole = (typeof VALID_ROLES)[number];

function parseArgs() {
  const args = process.argv.slice(2);
  const roleIndex = args.indexOf("--role");
  const countIndex = args.indexOf("--count");
  const baseUrlIndex = args.indexOf("--base-url");
  const callbackIndex = args.indexOf("--callback");

  const role = roleIndex >= 0 ? args[roleIndex + 1] : undefined;
  const count = countIndex >= 0 ? Number(args[countIndex + 1]) : 1;
  const baseUrl = baseUrlIndex >= 0 ? args[baseUrlIndex + 1] : process.env.BETTER_AUTH_URL || "https://hlshajara.com";
  const callbackURL = callbackIndex >= 0 ? args[callbackIndex + 1] : "/ar";

  if (!role || !VALID_ROLES.includes(role as StaffRole)) {
    console.error(`Usage: npx tsx scripts/generate-magic-links.ts --role <${VALID_ROLES.join("|")}> --count N`);
    process.exit(1);
  }
  if (!Number.isFinite(count) || count < 1 || count > 100) {
    console.error("--count must be between 1 and 100");
    process.exit(1);
  }

  return {
    role: role as StaffRole,
    count,
    baseUrl: baseUrl.replace(/\/$/, ""),
    callbackURL,
  };
}

function generateToken(length = 32): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

async function ensureUser(email: string, role: StaffRole) {
  const existing = await db.query.authUser.findFirst({
    where: eq(authUser.email, email),
  });
  if (existing) {
    if (existing.role !== role) {
      await db.update(authUser).set({ role }).where(eq(authUser.id, existing.id));
    }
    return existing;
  }

  const id = randomUUID().replace(/-/g, "");
  const [user] = await db
    .insert(authUser)
    .values({
      id,
      email,
      name: email.split("@")[0],
      emailVerified: true,
      role,
    })
    .returning();
  return user;
}

async function createMagicLink(
  email: string,
  baseUrl: string,
  callbackURL: string,
  expiresInSeconds = 7 * 24 * 60 * 60
) {
  const token = generateToken(32);
  await db.insert(authVerification).values({
    id: randomUUID().replace(/-/g, ""),
    identifier: token,
    value: JSON.stringify({ email, name: email.split("@")[0] }),
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
  });

  const url = new URL("/api/auth/magic-link/verify", baseUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("callbackURL", callbackURL);
  return url.toString();
}

async function main() {
  const { role, count, baseUrl, callbackURL } = parseArgs();
  const results: { email: string; role: StaffRole; url: string }[] = [];

  for (let i = 1; i <= count; i++) {
    const email = `invite-${role}-${i}@hlshajara.com`;
    await ensureUser(email, role);
    const url = await createMagicLink(email, baseUrl, callbackURL);
    results.push({ email, role, url });
  }

  console.log("\n=== Magic links ===\n");
  for (const r of results) {
    console.log(r.url);
  }

  console.log("\n=== Summary (JSON) ===\n");
  console.log(JSON.stringify(results, null, 2));

  await db.$client.end?.();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
