/**
 * Set or update a password for an existing user so they can log in with
 * email/password in addition to OAuth.
 */

import { hashPassword } from "@better-auth/utils/password";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { authAccount, authUser } from "../src/db/schema";

function parseArgs() {
  const emailIndex = process.argv.indexOf("--email");
  const passwordIndex = process.argv.indexOf("--password");

  const email = emailIndex >= 0 ? process.argv[emailIndex + 1] : undefined;
  const password = passwordIndex >= 0 ? process.argv[passwordIndex + 1] : undefined;

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/set-password.ts --email <email> --password <password>");
    process.exit(1);
  }

  return { email: email.toLowerCase().trim(), password };
}

async function main() {
  const { email, password } = parseArgs();

  const user = await db.query.authUser.findFirst({
    where: eq(authUser.email, email),
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const hash = await hashPassword(password);

  const existing = await db.query.authAccount.findFirst({
    where: eq(authAccount.accountId, user.id),
  });

  if (existing) {
    await db.update(authAccount).set({ password: hash }).where(eq(authAccount.id, existing.id));
    console.log(`Updated password for ${email}`);
  } else {
    await db.insert(authAccount).values({
      id: crypto.randomUUID().replace(/-/g, ""),
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: hash,
    });
    console.log(`Created credential account for ${email}`);
  }

  // Ensure email is marked verified so password login works immediately.
  if (!user.emailVerified) {
    await db.update(authUser).set({ emailVerified: true }).where(eq(authUser.id, user.id));
  }

  await db.$client.end?.();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
