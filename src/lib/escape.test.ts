import { describe, it, expect } from "vitest";
import { escapeHtml, escapeMarkdown, safeHttpUrl } from "@/lib/escape";

describe("escapeHtml", () => {
  it("encodes all five HTML-sensitive characters", () => {
    expect(escapeHtml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &#039;");
  });

  it("neutralizes a <script> payload", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });

  it("neutralizes an onerror image payload (attribute-breaking quotes encoded)", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });

  it("matches the legacy report-pdf escaper byte-for-byte on the ampersand-first ordering", () => {
    // & must be escaped first so already-escaped entities are not double-counted
    expect(escapeHtml("a&b<c")).toBe("a&amp;b&lt;c");
  });

  it("coerces undefined/null to empty string without throwing", () => {
    expect(escapeHtml(undefined as unknown)).toBe("");
    expect(escapeHtml(null as unknown)).toBe("");
  });

  it("coerces numbers to their string form", () => {
    expect(escapeHtml(42 as unknown)).toBe("42");
  });
});

describe("escapeMarkdown", () => {
  it("escapes a crafted javascript: link so it cannot form a markdown link", () => {
    const out = escapeMarkdown("[click](javascript:alert(1))");
    expect(out).not.toContain("](");
    // brackets + parens are backslash-escaped
    expect(out).toContain("\\[");
    expect(out).toContain("\\]");
    expect(out).toContain("\\(");
    expect(out).toContain("\\)");
  });

  it("escapes a crafted data: image so it cannot form a markdown image", () => {
    const out = escapeMarkdown("![x](data:text/html,<script>)");
    expect(out).not.toContain("![");
    expect(out).toContain("\\!");
    // every angle bracket is backslash-escaped: no UNescaped `<`/`>` survives a
    // markdown->HTML render
    expect(out).not.toMatch(/(?<!\\)</);
    expect(out).not.toMatch(/(?<!\\)>/);
  });

  it("escapes angle brackets to block raw HTML injection", () => {
    const out = escapeMarkdown("<img onerror=alert(1)>");
    // no UNescaped angle bracket survives
    expect(out).not.toMatch(/(?<!\\)</);
    expect(out).not.toMatch(/(?<!\\)>/);
    expect(out).toContain("\\<");
    expect(out).toContain("\\>");
  });

  it("escapes backticks so inline-code cannot be opened", () => {
    expect(escapeMarkdown("a`b")).toBe("a\\`b");
  });

  it("leaves plain text readable (backslash-escaped specials only)", () => {
    expect(escapeMarkdown("Acme Corp")).toBe("Acme Corp");
  });

  it("coerces undefined/null to empty string without throwing", () => {
    expect(escapeMarkdown(undefined as unknown)).toBe("");
    expect(escapeMarkdown(null as unknown)).toBe("");
  });
});

describe("safeHttpUrl", () => {
  it("rejects javascript: scheme", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBe("");
  });

  it("rejects data: scheme", () => {
    expect(safeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe("");
  });

  it("rejects vbscript: scheme", () => {
    expect(safeHttpUrl("vbscript:msgbox(1)")).toBe("");
  });

  it("rejects file: scheme", () => {
    expect(safeHttpUrl("file:///etc/passwd")).toBe("");
  });

  it("accepts an https URL unchanged", () => {
    expect(safeHttpUrl("https://x.test/a")).toBe("https://x.test/a");
  });

  it("accepts an http URL unchanged", () => {
    expect(safeHttpUrl("http://x.test/a")).toBe("http://x.test/a");
  });

  it("accepts a path-relative URL (no scheme)", () => {
    expect(safeHttpUrl("/uploads/abc.png")).toBe("/uploads/abc.png");
  });

  it("rejects a scheme hidden behind leading whitespace (fail closed)", () => {
    expect(safeHttpUrl("  javascript:alert(1)")).toBe("");
  });

  it("coerces undefined/null to empty string without throwing", () => {
    expect(safeHttpUrl(undefined as unknown)).toBe("");
    expect(safeHttpUrl(null as unknown)).toBe("");
  });
});
