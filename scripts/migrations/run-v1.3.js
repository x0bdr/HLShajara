const postgres = require("postgres");

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  await sql`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
        CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
      END IF;
    END
    $$`;

  await sql`CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL,
    locale VARCHAR(10) NOT NULL DEFAULT 'ar',
    status post_status NOT NULL DEFAULT 'draft',
    title VARCHAR(500) NOT NULL,
    excerpt TEXT,
    body TEXT NOT NULL,
    cover_image_url VARCHAR(2048),
    published_at TIMESTAMPTZ,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS post_slug_locale_idx ON posts(slug, locale)`;
  await sql`CREATE INDEX IF NOT EXISTS post_status_locale_idx ON posts(status, locale)`;
  await sql`CREATE INDEX IF NOT EXISTS post_published_at_idx ON posts(published_at)`;

  console.log("v1.3 migration applied successfully.");
  await sql.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
