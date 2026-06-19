import { describe, it, expect } from "vitest";
import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";
import type { JSONContent } from "@tiptap/core";
import { publicationRenderExtensions, isAllowedPublicationHref } from "@/lib/publication-extensions";
import { STRICT_ALLOWLIST } from "@/lib/publication-render";

/**
 * M2: the shared extension set must author EXACTLY the sanitize-html allowlist — no
 * node/mark a reviewer can produce may be silently dropped on render, and no renderable
 * node may escape the sanitizer. These tests assert the heading-level + strike pinning
 * by rendering docs through the SAME extension set the public renderer uses.
 */
function renderDoc(content: JSONContent[]): string {
  return renderToHTMLString({
    content: { type: "doc", content },
    extensions: publicationRenderExtensions,
  });
}

describe("publicationRenderExtensions — heading levels pinned to [2,3] (M2)", () => {
  it("serializes an H2 to <h2> (allowlisted)", () => {
    expect(renderDoc([{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "x" }] }])).toContain("<h2");
  });

  it("serializes an H3 to <h3> (allowlisted)", () => {
    expect(renderDoc([{ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "x" }] }])).toContain("<h3");
  });

  it("does NOT emit an <h1> — level 1 is outside the pinned [2,3] range", () => {
    const out = renderDoc([{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "x" }] }]);
    // Heading is configured for levels [2,3]; a level-1 heading is clamped/normalized,
    // never emitted as an <h1> that the sanitize allowlist would then strip.
    expect(out).not.toContain("<h1");
  });

  it("does NOT emit an <h4>/<h5>/<h6> — levels 4–6 are outside [2,3]", () => {
    for (const level of [4, 5, 6]) {
      const out = renderDoc([{ type: "heading", attrs: { level }, content: [{ type: "text", text: "x" }] }]);
      expect(out).not.toContain(`<h${level}`);
    }
  });
});

describe("publicationRenderExtensions ↔ sanitize allowlist parity (M2)", () => {
  const allowedTags = STRICT_ALLOWLIST.allowedTags as string[];

  it("keeps h1/h4/h5/h6/strike OUT of the sanitize allowlist (so disabling them in the editor loses nothing)", () => {
    for (const tag of ["h1", "h4", "h5", "h6", "s", "del", "strike", "pre", "code", "hr"]) {
      expect(allowedTags).not.toContain(tag);
    }
  });

  it("keeps exactly the publication prose tags in the allowlist", () => {
    expect(allowedTags).toEqual(["h2", "h3", "p", "strong", "em", "ul", "ol", "li", "blockquote", "a", "br"]);
  });
});

describe("isAllowedPublicationHref (M3 — relative + absolute http/https)", () => {
  it("allows an external https URL", () => {
    expect(isAllowedPublicationHref("https://example.org/report")).toBe(true);
  });
  it("allows an internal site-relative /path (linking between publications)", () => {
    expect(isAllowedPublicationHref("/en/publications/some-slug")).toBe(true);
  });
  it("rejects javascript: and protocol-relative //host", () => {
    expect(isAllowedPublicationHref("javascript:alert(1)")).toBe(false);
    expect(isAllowedPublicationHref("//evil.com")).toBe(false);
  });
});
