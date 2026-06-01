-- v1.3 — Add publications (posts) table
-- Run: psql -U hlshajara -d hlshajarah -f scripts/migrations/v1.3-add-posts.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
    CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS posts (
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
);

CREATE UNIQUE INDEX IF NOT EXISTS post_slug_locale_idx ON posts(slug, locale);
CREATE INDEX IF NOT EXISTS post_status_locale_idx ON posts(status, locale);
CREATE INDEX IF NOT EXISTS post_published_at_idx ON posts(published_at);
