/**
 * THE SINGLE SOURCE OF TRUTH for the TipTap schema used by BOTH the author-time
 * editor (src/components/admin/PublicationEditor.tsx) AND the server-side render
 * pipeline (src/lib/publication-render.ts).
 *
 * Defining the extension set once means the schema the reviewer types into and
 * the schema the public page renders from CANNOT drift. A node/mark the editor
 * can produce is exactly the set the renderer can serialize; anything outside it
 * is dropped by `renderToHTMLString` and then again by the sanitize-html allowlist.
 *
 * NOTE on Link: StarterKit v3 BUNDLES the link extension (config key `link`), so we
 * configure it INSIDE StarterKit rather than adding `@tiptap/extension-link`
 * separately — adding it twice triggers TipTap's "Duplicate extension names" warning
 * and an ambiguous schema. The href guard (`safeHttpUrl`) is wired here as the
 * editor/author-time first layer of the three-layer link defense (the other two are
 * `sanitizeDocLinks` on write and the sanitize-html allowedSchemes on render).
 */

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { Extensions } from "@tiptap/core";
import { safeHttpUrl } from "@/lib/escape";

/**
 * Author-time href guard: a candidate URL passes only when `safeHttpUrl` returns a
 * non-empty string (http/https absolute or single-slash site-relative). Everything
 * else — javascript:/data:/vbscript:/file:, protocol-relative `//host`,
 * backslash-smuggled, control-char-embedded — fails closed.
 */
export function isAllowedPublicationHref(url: unknown): boolean {
  return safeHttpUrl(url) !== "";
}

/**
 * The shared StarterKit configuration — the SINGLE SOURCE OF TRUTH for what a reviewer
 * can author AND what the static renderer can serialize. It is pinned to EXACTLY the
 * sanitize-html allowlist in publication-render.ts (h2,h3,p,strong,em,ul,ol,li,
 * blockquote,a,br), so no authored node/mark is silently dropped on render (M2) and no
 * renderable node escapes the sanitizer.
 *
 * Allowlist ↔ extension map:
 *   h2,h3       -> heading: { levels: [2, 3] }   (StarterKit defaults to 1–6; H1/H4–H6
 *                                                  would be authored then LOST on render)
 *   strong      -> bold        (enabled)
 *   em          -> italic      (enabled)
 *   ul/ol/li    -> bulletList/orderedList/listItem (enabled)
 *   blockquote  -> blockquote  (enabled)
 *   a           -> link        (enabled, href-guarded below)
 *   br          -> hardBreak   (enabled)
 *   (none)      -> strike      DISABLED — sanitize allowlist has no <s>/<del>
 *   (none)      -> codeBlock/code/horizontalRule DISABLED — no <pre>/<code>/<hr>
 */
const starterKit = StarterKit.configure({
  heading: { levels: [2, 3] },
  strike: false,
  codeBlock: false,
  code: false,
  horizontalRule: false,
  link: {
    openOnClick: false,
    autolink: false,
    protocols: ["http", "https"],
    HTMLAttributes: {
      rel: "noopener noreferrer",
      target: "_blank",
    },
    isAllowedUri: (uri, ctx) => ctx.defaultValidate(uri) && isAllowedPublicationHref(uri),
    shouldAutoLink: () => false,
  },
});

/**
 * The render-time extension set (no Placeholder — it is editor-only chrome that emits
 * no document content). Used by `renderToHTMLString` in publication-render.ts.
 */
export const publicationRenderExtensions: Extensions = [starterKit];

/**
 * The editor-time extension set: the same StarterKit plus the visual Placeholder.
 * Placeholder renders only editor decorations and never persists to the doc JSON,
 * so author-time and render-time schemas stay identical for all stored content.
 */
export function publicationEditorExtensions(placeholder: string): Extensions {
  return [starterKit, Placeholder.configure({ placeholder })];
}
