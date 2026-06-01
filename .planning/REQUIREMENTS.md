# Requirements — HLShajara v1.3 Outreach & Analytics

Scope: Add a publications channel for campaign communications, enable Twitter/X social login for supporter engagement, and implement analytics via Google Tag Manager.

## v1.3 Requirements

### Publications (PUB)
- [ ] **PUB-01**: Publications schema — `post` table with id, slug, title, excerpt, body (markdown/html), coverImageUrl, status (draft/published), locale (ar/en), publishedAt, createdAt, updatedAt, authorId
- [ ] **PUB-02**: Public publications listing page (`/[locale]/publications`) — responsive card grid, sorted by publishedAt desc, filter by locale
- [ ] **PUB-03**: Individual publication page (`/[locale]/publications/[slug]`) — full content rendering, cover image, back navigation, meta tags
- [ ] **PUB-04**: Admin publication management in dashboard — create, edit, preview, publish, unpublish, delete (soft)
- [ ] **PUB-05**: Publications i18n — each post has a locale; Arabic posts shown on /ar/publications, English on /en/publications
- [ ] **PUB-06**: Publication slugs are unique per locale (same Arabic title can exist in both locales with different slugs)

### Social Authentication (AUTH)
- [ ] **AUTH-04**: Twitter/X OAuth provider configured in Better Auth (clientId, clientSecret, callback URL)
- [ ] **AUTH-05**: OAuth login button on login page — "Sign in with X" in AR/EN
- [ ] **AUTH-06**: OAuth users get default role "submitter"; can complete profile (name) post-login
- [ ] **AUTH-07**: Link/unlink social account in user profile (future-proofing)

### Analytics (ANALYTICS)
- [ ] **ANALYTICS-01**: Google Tag Manager container script injected in `<head>` via Next.js Script component (strategy="afterInteractive")
- [ ] **ANALYTICS-02**: GTM ID configurable via `NEXT_PUBLIC_GTM_ID` env var; no-op if missing
- [ ] **ANALYTICS-03**: Data layer events pushed for: page views (locale change), publication reads, submit button clicks, record filter usage
- [ ] **ANALYTICS-04**: No PII (personally identifiable information) sent to GTM — only aggregate interaction events

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PUB-01 | Phase 24 | Pending |
| PUB-02 | Phase 24 | Pending |
| PUB-03 | Phase 24 | Pending |
| PUB-04 | Phase 25 | Pending |
| PUB-05 | Phase 24 | Pending |
| PUB-06 | Phase 24 | Pending |
| AUTH-04 | Phase 26 | Pending |
| AUTH-05 | Phase 26 | Pending |
| AUTH-06 | Phase 26 | Pending |
| AUTH-07 | Phase 26 | Pending |
| ANALYTICS-01 | Phase 27 | Pending |
| ANALYTICS-02 | Phase 27 | Pending |
| ANALYTICS-03 | Phase 27 | Pending |
| ANALYTICS-04 | Phase 27 | Pending |

## Out of Scope (v1.3)

- Publication comments / discussion (broadcast-only for v1.3)
- Publication email subscriptions / newsletter
- Facebook/LinkedIn OAuth
- Cookie consent banner (deferred until GDPR counsel review)
- Publication RSS feed
- Publication scheduled publishing (future)

---
*Created: 2026-06-01 for v1.3 Outreach & Analytics milestone*
