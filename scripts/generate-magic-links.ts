/**
 * Generate invite registration URLs for staff onboarding.
 *
 * Each link opens /ar/invite?token=... where the recipient enters their own
 * email and password. Public email/password sign-up is disabled; only invite
 * links can create new accounts.
 *
 * Usage:
 *   npx tsx scripts/generate-magic-links.ts --role admin --count 5
 *   npx tsx scripts/generate-magic-links.ts --role reviewer --count 10
 */

import { randomUUID } from "crypto";
import { db } from "../src/db";
import { authVerification } from "../src/db/schema";

const VALID_ROLES = ["admin", "reviewer", "senior_reviewer", "submitter"] as const;
type StaffRole = (typeof VALID_ROLES)[number];

function parseArgs() {
  const args = process.argv.slice(2);
  const roleIndex = args.indexOf("--role");
  const countIndex = args.indexOf("--count");
  const baseUrlIndex = args.indexOf("--base-url");
  const localeIndex = args.indexOf("--locale");

  const role = roleIndex >= 0 ? args[roleIndex + 1] : undefined;
  const count = countIndex >= 0 ? Number(args[countIndex + 1]) : 1;
  const baseUrl = baseUrlIndex >= 0 ? args[baseUrlIndex + 1] : process.env.BETTER_AUTH_URL || "https://hlshajara.com";
  const locale = localeIndex >= 0 ? args[localeIndex + 1] : "ar";

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
    locale,
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

function redirectForRole(role: StaffRole, locale: string): string {
  switch (role) {
    case "admin":
      return `/${locale}/admin/stats`;
    case "senior_reviewer":
    case "reviewer":
      return `/${locale}/reviewer`;
    default:
      return `/${locale}`;
  }
}

async function createInviteToken(role: StaffRole, locale: string, expiresInSeconds = 7 * 24 * 60 * 60) {
  const token = generateToken(32);
  await db.insert(authVerification).values({
    id: randomUUID().replace(/-/g, ""),
    identifier: `invite:${token}`,
    value: JSON.stringify({ role, redirectTo: redirectForRole(role, locale) }),
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
  });
  return token;
}

async function main() {
  const { role, count, baseUrl, locale } = parseArgs();
  const results: { token: string; role: StaffRole; url: string }[] = [];

  for (let i = 1; i <= count; i++) {
    const token = await createInviteToken(role, locale);
    const url = new URL(`/${locale}/invite`, baseUrl);
    url.searchParams.set("token", token);
    results.push({ token, role, url: url.toString() });
  }

  console.log("\n=== Invite links ===\n");
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
