import { describe, it, expect } from "vitest";
import {
  parseTiptapDoc,
  sanitizeDocLinks,
  tiptapDocSchema,
  MAX_BODY_CHARS,
  type TiptapDoc,
} from "@/lib/publication-body";

/* ----------------------------- fixtures ----------------------------- */

function docWithLink(href: string): TiptapDoc {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "before " },
          {
            type: "text",
            text: "linked",
            marks: [{ type: "link", attrs: { href } }],
          },
          { type: "text", text: " after" },
        ],
      },
    ],
  };
}

const cleanDoc: TiptapDoc = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
    { type: "paragraph", content: [{ type: "text", text: "Body text." }] },
  ],
};

/* ----------------------------- parseTiptapDoc ----------------------------- */

describe("parseTiptapDoc", () => {
  it("rejects a legacy raw-HTML string (not JSON)", () => {
    expect(parseTiptapDoc("<p>hi</p>")).toEqual({ ok: false });
  });

  it("rejects an object that is not a doc ({type:'x'})", () => {
    expect(parseTiptapDoc('{"type":"x"}')).toEqual({ ok: false });
  });

  it("rejects a doc whose content is not an array", () => {
    expect(parseTiptapDoc('{"type":"doc","content":"nope"}')).toEqual({ ok: false });
  });

  it("rejects an oversized body string (over the size bound)", () => {
    const huge = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(MAX_BODY_CHARS + 10) }] }],
    });
    expect(huge.length).toBeGreaterThan(MAX_BODY_CHARS);
    expect(parseTiptapDoc(huge)).toEqual({ ok: false });
  });

  it("rejects a non-string body (number / null / undefined) without throwing", () => {
    expect(parseTiptapDoc(123 as unknown)).toEqual({ ok: false });
    expect(parseTiptapDoc(null as unknown)).toEqual({ ok: false });
    expect(parseTiptapDoc(undefined as unknown)).toEqual({ ok: false });
  });

  it("never throws on malformed JSON (fail-closed)", () => {
    expect(parseTiptapDoc("{not json")).toEqual({ ok: false });
  });

  it("accepts a valid {type:'doc',content:[...]} body", () => {
    const result = parseTiptapDoc(JSON.stringify(cleanDoc));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.doc.type).toBe("doc");
      expect(Array.isArray(result.doc.content)).toBe(true);
    }
  });

  it("rejects a doc containing an unknown node type (M1 allowlist, fail-closed)", () => {
    const bogus = JSON.stringify({
      type: "doc",
      content: [{ type: "bogusNode", content: [{ type: "text", text: "x" }] }],
    });
    expect(parseTiptapDoc(bogus)).toEqual({ ok: false });
  });

  it("rejects a doc containing an unknown MARK type (M1 allowlist, fail-closed)", () => {
    const bogus = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "x", marks: [{ type: "evilMark" }] }],
        },
      ],
    });
    expect(parseTiptapDoc(bogus)).toEqual({ ok: false });
  });

  it("rejects a disabled-but-known node type (codeBlock is NOT in the allowlist)", () => {
    const cb = JSON.stringify({
      type: "doc",
      content: [{ type: "codeBlock", content: [{ type: "text", text: "x" }] }],
    });
    expect(parseTiptapDoc(cb)).toEqual({ ok: false });
  });

  it("accepts every allowlisted node type (doc/paragraph/heading/text/lists/blockquote/hardBreak)", () => {
    const full = JSON.stringify({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "H" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "a", marks: [{ type: "bold" }] },
            { type: "text", text: "b", marks: [{ type: "italic" }] },
            { type: "hardBreak" },
            { type: "text", text: "c", marks: [{ type: "link", attrs: { href: "https://x.com" } }] },
          ],
        },
        { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "li" }] }] }] },
        { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "li" }] }] }] },
        { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "q" }] }] },
      ],
    });
    expect(parseTiptapDoc(full).ok).toBe(true);
  });

  it("rejects a pathologically deep document (depth bound)", () => {
    // build a deeply-nested content chain well past MAX_DEPTH
    let node: TiptapDoc["content"][number] = { type: "paragraph", content: [{ type: "text", text: "deep" }] };
    for (let i = 0; i < 500; i++) {
      node = { type: "blockquote", content: [node] };
    }
    const deep = JSON.stringify({ type: "doc", content: [node] });
    expect(deep.length).toBeLessThanOrEqual(MAX_BODY_CHARS);
    expect(parseTiptapDoc(deep)).toEqual({ ok: false });
  });
});

describe("tiptapDocSchema", () => {
  it("parses a doc object directly", () => {
    expect(tiptapDocSchema.safeParse(cleanDoc).success).toBe(true);
  });
  it("fails on a non-doc object", () => {
    expect(tiptapDocSchema.safeParse({ type: "paragraph", content: [] }).success).toBe(false);
  });
});

/* ----------------------------- sanitizeDocLinks ----------------------------- */

describe("sanitizeDocLinks", () => {
  it("drops a javascript: link mark while preserving the text", () => {
    const out = sanitizeDocLinks(docWithLink("javascript:alert(1)"));
    const textNode = out.content[0].content![1];
    expect(textNode.text).toBe("linked"); // text preserved
    // no surviving link mark with the javascript: href
    const linkMarks = (textNode.marks ?? []).filter((m) => m.type === "link");
    expect(linkMarks).toHaveLength(0);
  });

  it("drops a data: link mark", () => {
    const out = sanitizeDocLinks(docWithLink("data:text/html,<script>alert(1)</script>"));
    const marks = out.content[0].content![1].marks ?? [];
    expect(marks.filter((m) => m.type === "link")).toHaveLength(0);
  });

  it("drops a protocol-relative //evil.com link mark", () => {
    const out = sanitizeDocLinks(docWithLink("//evil.com"));
    const marks = out.content[0].content![1].marks ?? [];
    expect(marks.filter((m) => m.type === "link")).toHaveLength(0);
  });

  it("keeps a safe https link mark unchanged", () => {
    const out = sanitizeDocLinks(docWithLink("https://example.com/report"));
    const marks = out.content[0].content![1].marks ?? [];
    const link = marks.find((m) => m.type === "link");
    expect(link).toBeDefined();
    expect(link!.attrs!.href).toBe("https://example.com/report");
  });

  it("is pure — does not mutate the input doc", () => {
    const input = docWithLink("javascript:alert(1)");
    const snapshot = JSON.stringify(input);
    sanitizeDocLinks(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
