import { describe, it, expect } from "vitest";
import { renderPublicationBody } from "@/lib/publication-render";

/* TipTap-doc fixtures (stringified, as stored in posts.body). */
function docJson(content: unknown[]): string {
  return JSON.stringify({ type: "doc", content });
}

describe("renderPublicationBody — TipTap JSON path", () => {
  it("renders headings/paragraphs/strong to allowlist HTML", () => {
    const body = docJson([
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "hello " },
          { type: "text", text: "world", marks: [{ type: "bold" }] },
        ],
      },
    ]);
    const out = renderPublicationBody(body);
    expect(out).toContain("<h2>Title</h2>");
    expect(out).toContain("<strong>world</strong>");
  });

  it("neutralizes a javascript: link mark in the JSON path (no javascript:, no <script>)", () => {
    const body = docJson([
      {
        type: "paragraph",
        content: [{ type: "text", text: "evil", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }],
      },
    ]);
    const out = renderPublicationBody(body);
    expect(out.toLowerCase()).not.toContain("javascript:");
    expect(out.toLowerCase()).not.toContain("<script");
    expect(out).toContain("evil"); // text survives
  });

  it("forces rel/target on a safe https link in the JSON path", () => {
    const body = docJson([
      {
        type: "paragraph",
        content: [{ type: "text", text: "link", marks: [{ type: "link", attrs: { href: "https://x.com" } }] }],
      },
    ]);
    const out = renderPublicationBody(body);
    expect(out).toContain('href="https://x.com"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });
});

describe("renderPublicationBody — legacy raw-HTML path", () => {
  it("strips <script>, onerror, and <img>; keeps <p>ok</p>", () => {
    const out = renderPublicationBody('<script>alert(1)</script><img src=x onerror="alert(1)"><p>ok</p>');
    expect(out.toLowerCase()).not.toContain("<script");
    expect(out.toLowerCase()).not.toContain("onerror");
    expect(out.toLowerCase()).not.toContain("<img");
    expect(out).toContain("<p>ok</p>");
  });

  it("strips a <div onclick> wrapper but keeps an allowed https anchor with forced rel/target", () => {
    const out = renderPublicationBody('<div onclick="x()"><a href="https://x.com">k</a></div>');
    expect(out.toLowerCase()).not.toContain("<div");
    expect(out.toLowerCase()).not.toContain("onclick");
    expect(out).toContain('href="https://x.com"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it("drops the href of a javascript: anchor (no javascript: scheme survives)", () => {
    const out = renderPublicationBody('<a href="javascript:alert(1)">x</a>');
    expect(out.toLowerCase()).not.toContain("javascript:");
    expect(out).toContain("x"); // anchor text survives
  });

  it("strips class/style/id passthrough on allowed tags", () => {
    const out = renderPublicationBody('<p class="evil" style="color:red" id="x">text</p>');
    expect(out).toContain("text");
    expect(out.toLowerCase()).not.toContain("class");
    expect(out.toLowerCase()).not.toContain("style");
    expect(out.toLowerCase()).not.toContain("id=");
  });
});

describe("renderPublicationBody — M1 fail-safe on unrenderable / bogus body", () => {
  it("returns '' (no throw) for a doc with an unknown node type", () => {
    const bogus = JSON.stringify({
      type: "doc",
      content: [{ type: "bogusNode", content: [{ type: "text", text: "x" }] }],
    });
    expect(() => renderPublicationBody(bogus)).not.toThrow();
    expect(renderPublicationBody(bogus)).toBe("");
  });

  it("returns '' (no throw) for a doc with an unknown mark type", () => {
    const bogus = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "x", marks: [{ type: "evilMark" }] }],
        },
      ],
    });
    expect(() => renderPublicationBody(bogus)).not.toThrow();
    expect(renderPublicationBody(bogus)).toBe("");
  });
});

describe("renderPublicationBody — empty / nullish", () => {
  it("returns '' for an empty string", () => {
    expect(renderPublicationBody("")).toBe("");
  });
  it("returns '' for null/undefined/non-string without throwing", () => {
    expect(renderPublicationBody(null as never)).toBe("");
    expect(renderPublicationBody(undefined as never)).toBe("");
    expect(renderPublicationBody(123 as never)).toBe("");
  });
});
