import postgres from 'postgres';

const client = postgres('postgresql://hlshajarah:hlshajarah_staging_2026@187.77.167.181:5432/hlshajarah', { prepare: false });

async function main() {
  const tables = await client`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('=== TABLES ===');
  for (const t of tables) {
    console.log(t.table_name);
  }

  console.log('\n=== user (Better Auth) ===');
  const users = await client`SELECT id, email, name, role, "twoFactorEnabled" FROM "user" LIMIT 3`.catch(e => console.log('Error:', e.message));
  console.log(JSON.stringify(users, null, 2));

  console.log('\n=== twoFactor (Better Auth) ===');
  const tf = await client`SELECT * FROM "twoFactor" LIMIT 3`.catch(e => console.log('Error:', e.message));
  console.log(JSON.stringify(tf, null, 2));

  console.log('\n=== account (Better Auth) ===');
  const acc = await client`SELECT * FROM account LIMIT 3`.catch(e => console.log('Error:', e.message));
  console.log(JSON.stringify(acc, null, 2));

  console.log('\n=== users (custom) ===');
  const customUsers = await client`SELECT * FROM users LIMIT 3`.catch(e => console.log('Error:', e.message));
  console.log(JSON.stringify(customUsers, null, 2));

  await client.end();
}

main().catch(console.error);
