/**
 * THE PUBLIC-RENDER PIPELINE — the only place a publication body is turned into HTML.
 *
 * The string returned by `renderPublicationBody` is the ONLY HTML permitted to reach
 * `dangerouslySetInnerHTML` on the public publications page. It is always
 * allowlist-bound: regardless of input (TipTap doc JSON OR legacy raw HTML OR garbage),
 * the output passes through one strict sanitize-html allowlist. No caller may inject
 * `post.body` raw — that was the stored-XSS sink this module replaces (T-2la-01).
 *
 * Node-safe + unit-testable: uses `@tiptap/static-renderer/pm/html-string`
 * (`renderToHTMLString`) which serializes ProseMirror/TipTap JSON to an HTML string
 * with NO DOM / NO jsdom, plus `sanitize-html`. No React, no browser globals.
 */

import sanitizeHtml from "sanitize-html";
import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";
import { parseTiptapDoc, sanitizeDocLinks } from "@/lib/publication-body";
import { publicationRenderExtensions } from "@/lib/publication-extensions";
import { safeHttpUrl } from "@/lib/escape";

/**
 * STRICT_ALLOWLIST — the single sanitize-html policy both render branches funnel
 * through. Tags are exactly the publication prose set; the only attributes that
 * survive are an anchor's href/rel/target. Every anchor is forced to
 * rel="noopener noreferrer" target="_blank" and any anchor whose href fails the
 * http/https scheme allowlist (via `safeHttpUrl`) is reduced to a hrefless anchor.
 * No class/style/id passthrough; no data:/javascript: scheme; no protocol-relative.
 */
export const STRICT_ALLOWLIST: sanitizeHtml.IOptions = {
  allowedTags: ["h2", "h3", "p", "strong", "em", "ul", "ol", "li", "blockquote", "a", "br"],
  allowedAttributes: {
    a: ["href", "rel", "target"],
  },
  allowedSchemes: ["http", "https"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    a: (tagName, attribs) => {
      const safeHref = safeHttpUrl(attribs.href);
      const attrs: Record<string, string> = {
        rel: "noopener noreferrer",
        target: "_blank",
      };
      if (safeHref !== "") attrs.href = safeHref;
      return { tagName, attribs: attrs };
    },
  },
};

function sanitize(html: string): string {
  return sanitizeHtml(html, STRICT_ALLOWLIST);
}

/**
 * `renderPublicationBody` — the single entry point the public page calls.
 *
 * 1. If `body` parses as a valid TipTap doc: drop unsafe link hrefs
 *    (`sanitizeDocLinks`), render to an HTML string with the SHARED extension set,
 *    then run that HTML through the strict allowlist.
 * 2. Otherwise (legacy raw HTML or garbage): run `body` directly through the SAME
 *    strict allowlist.
 *
 * Either branch returns ONLY allowlist-bound HTML. Empty/nullish/non-string body -> "".
 */
export function renderPublicationBody(body: unknown): string {
  if (typeof body !== "string" || body === "") return "";

  const parsed = parseTiptapDoc(body);
  if (parsed.ok) {
    const safeDoc = sanitizeDocLinks(parsed.doc);
    const html = renderToHTMLString({
      content: safeDoc,
      extensions: publicationRenderExtensions,
    });
    return sanitize(html);
  }

  // Legacy raw-HTML body (or garbage) — same strict allowlist, never executed.
  return sanitize(body);
}
