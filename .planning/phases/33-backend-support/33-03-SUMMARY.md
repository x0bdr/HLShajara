---
phase: 33-backend-support
plan: 03
subsystem: api
tags: [upload, ffmpeg, video, metadata-strip, fail-closed, exec-helper]
requires: ["33-01"]
provides:
  - "src/lib/media-metadata.ts (isFfmpegAvailable + stripVideoMetadata)"
  - "/api/upload ffmpeg-gated video branch (fail closed when ffmpeg absent)"
affects:
  - "src/app/api/upload/route.ts"
tech-stack:
  added: []
  patterns:
    - "Thin exec/promisify helper mirroring clamav.ts (no heavy node dep)"
    - "Fail-closed media ingestion: strip before scan/hash; 503 when processor unavailable"
key-files:
  created:
    - "src/lib/media-metadata.ts"
  modified:
    - "src/app/api/upload/route.ts"
decisions:
  - "ffmpeg invoked via a thin Node-built-in exec helper (no fluent/static wrapper); ffmpeg is a documented system binary"
  - "VIDEO_TYPES = mp4 + webm + quicktime (conservative)"
  - "Buffer.from() wraps the stripped buffer to match the image branch's Buffer<ArrayBuffer> type"
metrics:
  completed: 2026-06-14
requirements: [BE-05]
---

# Phase 33 Plan 03: Video Metadata Stripping Summary

One-liner: `/api/upload` gains an ffmpeg-gated video branch that strips container/stream metadata via `ffmpeg -map_metadata -1` before scan/hash, failing closed with 503 `FFMPEG_UNAVAILABLE` when the binary is absent — image/document paths untouched.

## What was built

- **`src/lib/media-metadata.ts`** — `isFfmpegAvailable()` (ffmpeg -version probe; false on any error, never throws) and `stripVideoMetadata(buffer, ext)` (`ffmpeg -y -i <in> -map_metadata -1 -c copy <out>` via tmp files; server-generated random tmp names + sanitized ext, no client filename in the command; throws on failure so callers fail closed; cleans up both tmp files in a finally block). Node built-ins only; no npm dependency.
- **`src/app/api/upload/route.ts`** — `VIDEO_TYPES` (mp4/webm/quicktime); a `else if (VIDEO_TYPES.has(file.type))` branch after the image branch that first checks `isFfmpegAvailable()` (→ 503 `FFMPEG_UNAVAILABLE`, not stored, if false), then `stripVideoMetadata` inside try/catch (→ 503 on failure). Strip runs BEFORE `scanBuffer` and the hash. Image (sharp EXIF) and document paths unchanged; `MAX_SIZE`, auth, and rate-limit guards untouched.

## Verification results

- `npx tsc --noEmit` — 0 errors.
- `npx next build` — succeeds (`/api/upload` compiled).
- Acceptance greps — all pass: `isFfmpegAvailable`/`stripVideoMetadata` used (3); `VIDEO_TYPES` declared+used (2); `FFMPEG_UNAVAILABLE` on a `status: 503` line; `sharp(buffer).rotate()` still present (1, image path intact); strip-before-scan line order holds (86 < 102); `map_metadata -1` exact; no `fluent-ffmpeg`/`ffmpeg-static` token; `git diff package.json` shows no ffmpeg/fluent dep.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Type error] `Buffer<ArrayBufferLike>` vs `Buffer<ArrayBuffer>`**
- **Found during:** Task 2 (tsc).
- **Issue:** `stripVideoMetadata` returns `Buffer` (inferred `Buffer<ArrayBufferLike>`), not assignable to the route's `buffer` (`Buffer<ArrayBuffer>` from `Buffer.from(bytes)`).
- **Fix:** Wrapped the result in `Buffer.from(...)` — identical to how the existing image branch normalizes the sharp output.
- **Files:** `src/app/api/upload/route.ts`.
- **Commit:** c431e15.

**2. [Grep-gate wording] Doc comment reworded**
- **Issue:** Task 1's "no new dep" AC greps case-insensitively for `fluent-ffmpeg|ffmpeg-static`; the doc comment originally named those packages ("no fluent-ffmpeg, no ffmpeg-static"), tripping the gate on the comment itself.
- **Fix:** Reworded the comment to "no node package dependency and no bundled binary wrapper" — same meaning, no forbidden token.
- **Files:** `src/lib/media-metadata.ts`.
- **Commit:** 32b7489.

## Deferred operator / infra follow-up

- **Install the ffmpeg system binary on any host that enables video uploads.** Until then video stays hidden in the UI and the route fails closed (503 `FFMPEG_UNAVAILABLE`) rather than storing a video with intact metadata. ffmpeg is a system dependency, not an npm package.

## Self-Check: PASSED
- `src/lib/media-metadata.ts` — FOUND
- `src/app/api/upload/route.ts` — FOUND (modified)
- Commits 32b7489, c431e15 — FOUND
