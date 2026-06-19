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
 * True when `body` is parseable JSON (so it was an attempted TipTap doc, not legacy
 * HTML). Legacy raw-HTML bodies (`<p>…</p>`) never parse as JSON. Used to decide, on a
 * doc-validation failure, between "fail safe to ''" (malformed/bogus JSON doc) and
 * "sanitize as legacy HTML".
 */
function looksLikeJson(body: string): boolean {
  const trimmed = body.trimStart();
  if (trimmed[0] !== "{" && trimmed[0] !== "[") return false;
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
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
    // M1 (fail-safe render): renderToHTMLString throws on a node/mark type with no
    // matching extension. A body that slipped past write-validation (e.g. legacy rows
    // stored before the node allowlist landed, or any future schema drift) must NEVER
    // 500 the public page. On any throw, fail SAFE -> "" (the page renders an empty
    // body, not a server error). The sanitize step stays on the success path only.
    let html: string;
    try {
      html = renderToHTMLString({
        content: safeDoc,
        extensions: publicationRenderExtensions,
      });
    } catch {
      return "";
    }
    return sanitize(html);
  }

  // The body did NOT validate as a TipTap doc. There are two reasons:
  //  (a) it is genuine legacy raw HTML (never JSON) — sanitize it through the same
  //      strict allowlist, the original pre-TipTap render path; or
  //  (b) it IS JSON but failed the stricter doc/node allowlist (e.g. a bogus node
  //      type) — it was MEANT to be a doc, so fail SAFE to "" rather than dumping the
  //      raw JSON source as visible text on the public page (M1).
  if (looksLikeJson(body)) return "";

  // Legacy raw-HTML body — same strict allowlist, never executed.
  return sanitize(body);
}
