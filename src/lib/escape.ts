/**
 * Single source of truth for output-encoding user-controlled strings before they
 * reach an HTML, markdown, or URL-attribute sink.
 *
 * All three helpers FAIL CLOSED on uncertainty: unknown input is coerced to a
 * string (undefined/null -> ""), and `safeHttpUrl` rejects anything that is not an
 * http/https URL or a scheme-less relative path.
 */

function coerce(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : String(value);
}

/**
 * HTML-escape the five sensitive characters. `&` MUST be replaced first so that
 * the entities produced by later replacements are not themselves re-escaped.
 *
 * Byte-for-byte identical to the legacy escaper that lived in report-pdf.ts, so
 * importing this in place of the local copy is a pure refactor (no PDF change).
 */
export function escapeHtml(text: unknown): string {
  return coerce(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Markdown-active characters plus angle brackets. Backslash-escaping each one
// means a crafted value can never open a link/image/inline-code/raw-HTML
// construct when the surrounding markdown is later rendered to HTML.
const MARKDOWN_SPECIAL = /[\\`*_{}[\]()#+\-.!|<>]/g;

/**
 * Backslash-escape every markdown-active character (and `<`/`>`) so a stored
 * value such as `[label](javascript:alert(1))` or `<img onerror=...>` is inert
 * after a markdown->HTML render.
 */
export function escapeMarkdown(text: unknown): string {
  return coerce(text).replace(MARKDOWN_SPECIAL, (ch) => `\\${ch}`);
}

/**
 * Allow only http/https absolute URLs or scheme-less relative paths; reject
 * javascript:/data:/vbscript:/file: and every other scheme by returning "".
 *
 * Mirrors the platform http/https-only policy (URL_OPTIONS in is-valid.ts). A
 * scheme is anything matching `<letter><...>:` at the very start. No detected
 * scheme => relative path => allowed.
 */
export function safeHttpUrl(url: unknown): string {
  const raw = coerce(url).trim();
  if (raw === "") return "";

  // Reject any embedded control character or whitespace (a scheme smuggled
  // behind a tab/newline is a known sanitizer-bypass; fail closed).
  if (/[\u0000-\u0020\u007f]/.test(raw)) return "";

  // http/https pass; every other scheme (javascript:/data:/vbscript:/file:) is
  // rejected. No leading scheme => relative path => allowed.
  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(raw);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme === "http" || scheme === "https") return raw;
    return "";
  }

  return raw;
}
