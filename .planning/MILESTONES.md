# Milestones — HLShajara

## v1.0 Foundation

**Shipped:** 2026-05-31
**Phases:** 9 | **Commits:** 28 | **LOC:** ~3,200 TypeScript/React

### What Was Built

A bilingual, source-backed accountability archive with structural safeguards: identity-free data model, non-bypassable validation choke point, hash-chained audit log, staff auth scaffold, public intake with boundary engine, reviewer console, legal release gate, public record with Arabic/English search, right-of-reply intake, and full AR/EN bilingual site with legal policies. Phase 9 (inserted post-audit) wired auth enforcement, audit trail, and RBAC to close critical safety gaps.

### Key Accomplishments

1. **Identity-free schema** — Entities stored with type, role, status, version; no fields for sect/religion/ethnicity/family/region/tribe
2. **Validation choke point** — `persist.ts` with banned-pattern + incitement screen on all writes (wired in Phase 9)
3. **Hash-chained audit log** — Append-only `review_logs` with SHA-256 chaining and `verifyAuditChain()` (wired in Phase 9)
4. **Bilingual public site** — Full AR RTL / EN LTR with next-intl; mission, FAQ, terms, privacy pages
5. **Public record & search** — Server-side PostgreSQL search across name/role in both languages; evidence-strength labels
6. **File upload with sanitization** — Sharp EXIF/GPS stripping + SHA-256 hash on all uploads
7. **Right-of-reply intake** — Named parties can submit correction requests via public form
8. **Auth & RBAC wired** (Phase 9) — Session validation on all internal APIs; `hasRole()` for reviewers; `canPublish()` for senior reviewers

### Known Gaps at Close

- 2FA not configured (Better Auth v1.4.7 lacks TOTP plugin)
- No structured triage or dual review in reviewer console
- No source verification workflow (snapshot/hash, tier check)
- No transparency dashboard
- No dedicated anti-discrimination policy page
- In-memory rate limiter (won't scale)
- `isDeceased` hardcoded false in publish API
- Operating jurisdiction + hosting Key Decision not recorded

### Technical Debt

- In-memory rate limiter won't scale across instances
- No separate publish projection table
- Sources auto-created as Tier "C" with hardcoded metadata
- No login UI page (Better Auth API exists but no frontend)

---

*For current roadmap, see `.planning/ROADMAP.md`*
