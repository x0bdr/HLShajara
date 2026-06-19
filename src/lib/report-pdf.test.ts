import { describe, it, expect, vi } from "vitest";

// puppeteer is never launched in these unit tests — stub the module so importing
// report-pdf.ts does not pull in the real browser binary.
vi.mock("puppeteer", () => ({
  default: { launch: vi.fn(async () => ({ newPage: vi.fn(), close: vi.fn() })) },
}));

import { formatSourceFiles } from "@/lib/report-pdf";

/**
 * H2 (render layer, defense-in-depth): even if a hostile sourceFiles[].url
 * slips past the schema, the PDF renderer must never emit a live
 * `javascript:`/`data:` href — safeHttpUrl drops the link entirely.
 */
describe("formatSourceFiles — H2 render-layer URL safety", () => {
  it("emits no javascript: href for a javascript: url", () => {
    const out = formatSourceFiles([
      { url: "javascript:alert(1)", originalName: "evidence.png", label: "shot" },
    ]);
    expect(out.toLowerCase()).not.toContain("javascript:");
    // no href is produced at all for the unsafe url
    expect(out).not.toMatch(/href="javascript/i);
  });

  it("emits no data: href for a data: url", () => {
    const out = formatSourceFiles([
      { url: "data:text/html,<script>alert(1)</script>", originalName: "x.png" },
    ]);
    expect(out.toLowerCase()).not.toContain("data:text/html");
    expect(out).not.toMatch(/href="data:/i);
  });

  it("renders a real http href for a valid url", () => {
    const out = formatSourceFiles([
      { url: "https://cdn.test/uploads/a.png", originalName: "a.png" },
    ]);
    expect(out).toContain('href="https://cdn.test/uploads/a.png"');
  });
});
