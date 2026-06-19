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
 * Allow only http/https absolute URLs or single-slash site-relative paths;
 * reject javascript:/data:/vbscript:/file:, protocol-relative `//host`, and
 * every other scheme by returning "".
 *
 * Mirrors the platform http/https-only policy (URL_OPTIONS in is-valid.ts). A
 * scheme is anything matching `<letter><...>:` at the very start. A leading
 * `//` (or `/\`, `\/`, `\\`) is protocol-relative — in an href it resolves to
 * an external `https://host` (open-redirect/phishing) — so it is rejected. A
 * relative path is allowed only when it starts with exactly one forward slash.
 */
export function safeHttpUrl(url: unknown): string {
  const raw = coerce(url).trim();
  if (raw === "") return "";

  // Reject any embedded control character or whitespace (a scheme smuggled
  // behind a tab/newline is a known sanitizer-bypass; fail closed).
  if (/[\u0000-\u0020\u007f]/.test(raw)) return "";

  // Reject any backslash anywhere: browsers coerce `\` to `/`, so `https:/\/\evil`
  // and `/\evil.com` are treated as `https://evil` / `//evil.com` (external).
  // Legitimate http/https URLs and site-relative paths never contain a backslash.
  if (raw.includes("\\")) return "";

  // Reject protocol-relative URLs: `//evil.com` resolves to `https://evil.com`
  // in an href. Fail closed before the scheme/relative branches.
  if (/^\/\//.test(raw)) return "";

  // http/https pass; every other scheme (javascript:/data:/vbscript:/file:) is
  // rejected.
  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(raw);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme === "http" || scheme === "https") return raw;
    return "";
  }

  // No scheme. Allow a site-relative path only when it starts with exactly one
  // forward slash (`/uploads/a.jpg`). A bare `evil.com` or a backslash-leading
  // path has no scheme and no leading single slash — reject it (fail closed).
  if (raw.startsWith("/")) return raw;

  return "";
}

/**
 * Allow ONLY http/https ABSOLUTE URLs — no site-relative paths. Used where a value
 * is consumed as a fully-qualified URL by an external system (e.g. an `og:image` /
 * JSON-LD `image` / `<img src>` that must resolve without a base). A scheme-less
 * `/path`, a protocol-relative `//host`, and every non-http(s) scheme return "".
 *
 * Reuses `safeHttpUrl` (which already fails closed on control chars, backslashes,
 * protocol-relative, and disallowed schemes), then additionally rejects the
 * site-relative branch that `safeHttpUrl` permits.
 */
export function safeAbsoluteHttpUrl(url: unknown): string {
  const safe = safeHttpUrl(url);
  if (safe === "") return "";
  return /^https?:\/\//i.test(safe) ? safe : "";
}

/**
 * Serialize `data` to a JSON string that is SAFE to embed inside a
 * `<script type="application/ld+json">…</script>` block via dangerouslySetInnerHTML.
 *
 * `JSON.stringify` alone is NOT safe here: it does not escape `<`/`>`/`&`, so a
 * reviewer-authored value containing `</script>` (e.g. a post title of
 * `</script><script>alert(document.domain)</script>`) closes the script element and
 * executes attacker HTML on the PUBLIC page (stored XSS). It also leaves the raw
 * U+2028 / U+2029 line/paragraph separators, which are valid JSON but ILLEGAL in a
 * JS string literal and break inline-script parsers.
 *
 * Fix: replace `&`/`<`/`>` and U+2028/U+2029 with their `\uXXXX` JSON escape
 * sequences. These are valid JSON escapes (so the structured data is byte-identical
 * after JSON.parse) AND no literal `</script>` or unescaped angle bracket can survive
 * to break out of the inline script element.
 */
export function jsonLdSafe(data: unknown): string {
  return JSON.stringify(data)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
