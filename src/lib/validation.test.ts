import { describe, it, expect } from "vitest";
import { submitSchema } from "@/lib/validation";

/**
 * H2 (schema layer): user-supplied URLs that flow into the reviewer PDF/markdown
 * must be http/https absolute or single-slash site-relative. A client that
 * bypasses /api/upload can post any string for sourceFiles[].url / sourceLinks[].url,
 * so the schema is the trust boundary — javascript:/data:/protocol-relative is rejected.
 */

function basePayload() {
  return {
    entityName: "Acme Corp",
    entityType: "organization" as const,
    reportCategory: "commercial" as const,
    entityRole: "operator",
    allegationDescription: "A".repeat(40),
    sourceLinks: [{ url: "https://example.com/report" }],
    sourceFiles: [] as Array<Record<string, unknown>>,
  };
}

describe("submitSchema — H2 URL hardening", () => {
  it("accepts a valid http/https sourceLinks URL", () => {
    const res = submitSchema.safeParse(basePayload());
    expect(res.success).toBe(true);
  });

  it("accepts an http/https sourceFiles URL and a site-relative one", () => {
    const payload = basePayload();
    payload.sourceFiles = [
      { hash: "abc", filename: "a.png", originalName: "a.png", url: "https://cdn.test/uploads/a.png", size: 1 },
      { hash: "def", filename: "b.png", originalName: "b.png", url: "/uploads/b.png", size: 2 },
    ];
    const res = submitSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("REJECTS a javascript: sourceFiles[].url", () => {
    const payload = basePayload();
    payload.sourceFiles = [
      { hash: "abc", filename: "a.png", originalName: "a.png", url: "javascript:alert(1)", size: 1 },
    ];
    const res = submitSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("REJECTS a data: sourceFiles[].url", () => {
    const payload = basePayload();
    payload.sourceFiles = [
      { hash: "abc", filename: "a.png", originalName: "a.png", url: "data:text/html,<script>alert(1)</script>", size: 1 },
    ];
    expect(submitSchema.safeParse(payload).success).toBe(false);
  });

  it("REJECTS a protocol-relative sourceFiles[].url", () => {
    const payload = basePayload();
    payload.sourceFiles = [
      { hash: "abc", filename: "a.png", originalName: "a.png", url: "//evil.com/a.png", size: 1 },
    ];
    expect(submitSchema.safeParse(payload).success).toBe(false);
  });

  it("REJECTS a javascript: sourceLinks[].url", () => {
    const payload = basePayload();
    payload.sourceLinks = [{ url: "javascript:alert(1)" }];
    expect(submitSchema.safeParse(payload).success).toBe(false);
  });

  it("REJECTS a vbscript: sourceLinks[].url", () => {
    const payload = basePayload();
    payload.sourceLinks = [{ url: "vbscript:msgbox(1)" }];
    expect(submitSchema.safeParse(payload).success).toBe(false);
  });

  it("REJECTS a file: sourceLinks[].url", () => {
    const payload = basePayload();
    payload.sourceLinks = [{ url: "file:///etc/passwd" }];
    expect(submitSchema.safeParse(payload).success).toBe(false);
  });
});
