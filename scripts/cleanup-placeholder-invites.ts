import { eq, like } from "drizzle-orm";
import { db } from "../src/db";
import { authUser, authVerification } from "../src/db/schema";

async function main() {
  // Remove placeholder users created by the old magic-link generator.
  const deletedUsers = await db
    .delete(authUser)
    .where(like(authUser.email, "invite-%@hlshajara.com"))
    .returning({ email: authUser.email });
  console.log(`Deleted ${deletedUsers.length} placeholder users:`);
  for (const u of deletedUsers) {
    console.log(" -", u.email);
  }

  // Remove old magic-link verification tokens (plain 32-char identifiers).
  // Invite tokens use the "invite:<token>" prefix and are kept.
  const allTokens = await db
    .select({ identifier: authVerification.identifier })
    .from(authVerification);
  const plainTokens = allTokens.filter(
    (t) => !t.identifier.includes(":") && /^[a-zA-Z0-9]{32}$/.test(t.identifier)
  );

  let deletedTokenCount = 0;
  for (const t of plainTokens) {
    const result = await db
      .delete(authVerification)
      .where(eq(authVerification.identifier, t.identifier))
      .returning({ identifier: authVerification.identifier });
    deletedTokenCount += result.length;
  }
  console.log(`Deleted ${deletedTokenCount} old magic-link tokens.`);

  await db.$client.end?.();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
