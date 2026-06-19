import { describe, it, expect, vi } from "vitest";

/**
 * M1 (fail-safe render): proves the try/catch around `renderToHTMLString` returns ""
 * on a renderer throw EVEN when the body is a valid, allowlisted TipTap doc that
 * passes `parseTiptapDoc`. This is the layer that prevents a stored body from 500-ing
 * every public view if the renderer ever throws (extension drift, library change, a
 * legacy row that pre-dates the node allowlist, etc.).
 *
 * We mock ONLY the static renderer to throw; the parse + sanitize layers run for real.
 */
vi.mock("@tiptap/static-renderer/pm/html-string", () => ({
  renderToHTMLString: () => {
    throw new Error("simulated renderer explosion");
  },
}));

import { renderPublicationBody } from "@/lib/publication-render";

describe("renderPublicationBody — renderToHTMLString throw is caught (M1)", () => {
  it("returns '' (never re-throws / never 500s) when the renderer throws on a valid doc", () => {
    const validDoc = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }],
    });
    expect(() => renderPublicationBody(validDoc)).not.toThrow();
    expect(renderPublicationBody(validDoc)).toBe("");
  });
});
