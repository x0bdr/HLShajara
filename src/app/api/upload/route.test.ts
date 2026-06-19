import { describe, it, expect, vi, beforeEach } from "vitest";

/* ----------------------------- mocks -----------------------------
 * Mirror the submit/route.test.ts mock style. We DO NOT mock `file-type`:
 * the real magic-byte sniffer is the unit under test (A.1). Everything
 * downstream of the sniff (sharp/ffmpeg/clamav/fs/rate-limit) is stubbed so
 * the test is hermetic and exercises only the type-validation branch.
 */

// Malware scanner: always clean.
vi.mock("@/lib/clamav", () => ({
  scanBuffer: vi.fn(async () => ({ clean: true })),
}));

// Video metadata: ffmpeg available, strip is a passthrough.
vi.mock("@/lib/media-metadata", () => ({
  isFfmpegAvailable: vi.fn(async () => true),
  stripVideoMetadata: vi.fn(async (buf: Buffer) => buf),
}));

// Shared mock state — declared via vi.hoisted so the (hoisted) vi.mock factories
// below can safely reference them. `state.sharpShouldThrow` lets a single test
// simulate a sharp processing failure (M1 fail-closed); `writeFileMock` is a spy
// so a test can assert NO file was written on a fail-closed reject.
const { state, writeFileMock } = vi.hoisted(() => ({
  state: { sharpShouldThrow: false },
  writeFileMock: vi.fn(async () => undefined),
}));

// sharp: chainable .rotate().toBuffer() resolving the input buffer unchanged.
vi.mock("sharp", () => ({
  default: (buf: Buffer) => ({
    rotate: () => ({
      toBuffer: async () => {
        if (state.sharpShouldThrow) throw new Error("sharp: unsupported image");
        return buf;
      },
    }),
  }),
}));

// Rate limiter: allow by default.
vi.mock("@/lib/rate-limit", () => ({
  rateLimitResponse: vi.fn(async () => ({ ok: true })),
}));

// fs/promises: writeFile (spy)/mkdir are no-ops (never touch disk).
vi.mock("fs/promises", () => ({
  writeFile: writeFileMock,
  mkdir: vi.fn(async () => undefined),
}));

import { POST } from "@/app/api/upload/route";

beforeEach(() => {
  state.sharpShouldThrow = false;
  writeFileMock.mockClear();
});

/* ----------------------------- fixtures ----------------------------- */

/** Minimal valid PNG: 8-byte signature + a complete IHDR chunk. */
function genuinePng(): Buffer {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from([0x00, 0x00, 0x00, 0x0d]), // IHDR length = 13
    Buffer.from("IHDR"),
    Buffer.from([
      0x00, 0x00, 0x00, 0x01, // width 1
      0x00, 0x00, 0x00, 0x01, // height 1
      0x08, 0x06, 0x00, 0x00, 0x00, // bit depth / color / compression / filter / interlace
    ]),
    Buffer.from([0x1f, 0x15, 0xc4, 0x89]), // CRC
  ]);
}

/** Minimal valid JPEG: SOI + APP0/JFIF + EOI. */
function genuineJpeg(): Buffer {
  return Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
    Buffer.from("JFIF\x00"),
    Buffer.from([0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]),
    Buffer.from([0xff, 0xd9]),
  ]);
}

/** Minimal valid MP4: an `ftyp` box. */
function genuineMp4(): Buffer {
  return Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x18]),
    Buffer.from("ftyp"),
    Buffer.from("isom"),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    Buffer.from("isom"),
    Buffer.from("mp41"),
  ]);
}

/** Script/exe bytes masquerading as a PNG (sniffs to undefined → reject). */
function spoofedTextAsPng(): Buffer {
  return Buffer.from("<?php system($_GET[0]); ?> not really a png at all");
}

/** SVG payload (sniffs to application/xml, never allowlisted → reject). */
function svgPayload(): Buffer {
  return Buffer.from(
    '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
  );
}

function makeRequest(buf: Buffer, name: string, type: string): Request {
  // Copy into a plain Uint8Array (a valid BlobPart) — a Node Buffer's backing
  // ArrayBufferLike is not assignable to BlobPart under strict TS.
  const part = new Uint8Array(buf);
  const file = new File([part], name, { type });
  const fd = new FormData();
  fd.append("file", file);
  return new Request("http://localhost/api/upload", { method: "POST", body: fd });
}

/* ----------------------------- tests ----------------------------- */

describe("POST /api/upload — magic-byte validation (A.1)", () => {
  it("accepts a genuine PNG and stores it with the SNIFFED extension (.png)", async () => {
    const res = await POST(makeRequest(genuinePng(), "evidence.png", "image/png"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.filename).toMatch(/\.png$/);
  });

  it("accepts a genuine JPEG and stores it with the .jpg extension", async () => {
    const res = await POST(makeRequest(genuineJpeg(), "photo.jpg", "image/jpeg"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.filename).toMatch(/\.jpg$/);
  });

  it("accepts a genuine MP4 and stores it with the .mp4 extension", async () => {
    const res = await POST(makeRequest(genuineMp4(), "clip.mp4", "video/mp4"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.filename).toMatch(/\.mp4$/);
  });

  it("rejects script bytes renamed .png with a spoofed image/png Content-Type", async () => {
    const res = await POST(makeRequest(spoofedTextAsPng(), "evil.png", "image/png"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.code).toBe("INVALID_FILE_TYPE");
  });

  it("rejects an SVG upload (never allowlisted — XSS vector)", async () => {
    const res = await POST(makeRequest(svgPayload(), "logo.svg", "image/svg+xml"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.code).toBe("INVALID_FILE_TYPE");
  });

  it("accepts a genuine PNG mislabeled as image/jpeg — SAME family, sniff is authoritative (M2)", async () => {
    // Intra-family client mislabeling (browser quirk) must NOT reject; the file is
    // stored with the canonical SNIFFED extension regardless of the client claim.
    const res = await POST(makeRequest(genuinePng(), "trick.jpg", "image/jpeg"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.filename).toMatch(/\.png$/);
  });

  it("accepts a genuine PNG with an EMPTY client file.type — sniff∈allowlist alone (M2)", async () => {
    // Real browsers sometimes send no Content-Type; strict equality would wrongly
    // reject. The sniffed type is the authoritative gate.
    const res = await POST(makeRequest(genuinePng(), "noheader.png", ""));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.filename).toMatch(/\.png$/);
  });

  it("rejects a genuine MP4 claimed as image/png — CROSS-family spoof (M2)", async () => {
    // video bytes + a recognized image/* client type = clear cross-family lie → reject.
    const res = await POST(makeRequest(genuineMp4(), "fake.png", "image/png"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.code).toBe("INVALID_FILE_TYPE");
  });

  it("rejects script bytes claimed as image/png — sniff undefined (M2 fail closed)", async () => {
    const res = await POST(makeRequest(spoofedTextAsPng(), "evil.png", "image/png"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.code).toBe("INVALID_FILE_TYPE");
  });

  it("FAILS CLOSED and writes NO file when sharp cannot strip EXIF/GPS (M1)", async () => {
    state.sharpShouldThrow = true;
    const res = await POST(makeRequest(genuinePng(), "evidence.png", "image/png"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.code).toBe("IMAGE_PROCESSING_FAILED");
    // the un-stripped original must NEVER reach disk
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("sanitizes a markup-laced originalName in the response (defense-in-depth)", async () => {
    const res = await POST(
      makeRequest(genuinePng(), "<img onerror=alert(1)>shot.png", "image/png"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.originalName).not.toContain("<");
    expect(json.originalName).not.toContain(">");
    expect(json.originalName).toContain("shot.png");
  });
});
