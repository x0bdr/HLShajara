-- Materialized view: published_entities
-- Isolates public-readable data from draft/unpublished records.
-- Drafts are never exposed through this view.
--
-- To create:
--   psql $DATABASE_URL -f src/db/migrations/001_published_entities_view.sql
--
-- To refresh after data changes:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY published_entities;

CREATE MATERIALIZED VIEW IF NOT EXISTS published_entities AS
SELECT
  e.id,
  e.public_id,
  e.type,
  e.name,
  e.name_en,
  e.role,
  e.role_en,
  e.status,
  e.evidence_level,
  e.version,
  e.is_deceased,
  e.right_of_reply_state,
  e.published_at,
  e.unpublished_at
FROM entities e
WHERE e.published_at IS NOT NULL
  AND e.status != 'unpublished';

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_published_entities_public_id
  ON published_entities (public_id);

CREATE INDEX IF NOT EXISTS idx_published_entities_status
  ON published_entities (status);

CREATE INDEX IF NOT EXISTS idx_published_entities_type
  ON published_entities (type);

CREATE INDEX IF NOT EXISTS idx_published_entities_evidence
  ON published_entities (evidence_level);
