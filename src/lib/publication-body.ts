/**
 * Shared TipTap-doc parse/validate + link-href sanitize used by BOTH the write path
 * (src/app/api/posts/admin/route.ts — POST/PATCH) and the render path
 * (src/lib/publication-render.ts). One module so the "what counts as a valid body"
 * and "drop unsafe link hrefs" rules cannot diverge between write-time and render-time.
 *
 * Everything here is pure + dependency-free of React/DOM (Zod + the shared escape
 * helper only) so it runs under the project's `node` Vitest environment.
 */

import { z } from "zod";
import { safeHttpUrl } from "@/lib/escape";

/**
 * Hard caps protecting the write path from oversized / pathologically-nested bodies
 * (T-2la-04 DoS). `MAX_BODY_CHARS` bounds the serialized JSON; `MAX_DEPTH` and
 * `MAX_NODES` bound the tree the renderer + sanitizer must walk.
 */
export const MAX_BODY_CHARS = 200_000;
const MAX_DEPTH = 100;
const MAX_NODES = 20_000;

/**
 * A TipTap/ProseMirror node: a `type` plus optional `content` children, `marks`,
 * `attrs`, and `text`. Recursive + permissive on the leaf shape (the render layer's
 * extension set + the sanitize-html allowlist are the real gate on which nodes/marks
 * actually reach the DOM); this schema's job is the STRUCTURAL contract: "this is a
 * ProseMirror document, not arbitrary JSON / raw HTML / garbage".
 */
export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
  [key: string]: unknown;
}

export interface TiptapDoc {
  type: "doc";
  content: TiptapNode[];
  [key: string]: unknown;
}

/**
 * ALLOWLIST of node + mark types the write path accepts (M1, fail-closed).
 *
 * This MUST stay in lockstep with the shared TipTap extension set
 * (publication-extensions.ts) and the sanitize-html allowlist (publication-render.ts):
 * a reviewer can only author these nodes/marks, the renderer can only serialize these,
 * and the sanitizer only keeps the tags they map to. A doc containing ANY other node
 * (e.g. a hand-crafted `{"type":"bogusNode"}`) or mark is REJECTED on POST/PATCH before
 * a DB write — so the public render is never asked to serialize an unknown node (the
 * stored-DoS vector where `renderToHTMLString` throws and 500s every public view).
 *
 * `doc` is listed for completeness; the root is independently pinned by `tiptapDocSchema`.
 */
export const ALLOWED_NODE_TYPES = [
  "doc",
  "paragraph",
  "heading",
  "text",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
] as const;

export const ALLOWED_MARK_TYPES = ["bold", "italic", "link"] as const;

const nodeTypeSchema = z.enum(ALLOWED_NODE_TYPES);
const markTypeSchema = z.enum(ALLOWED_MARK_TYPES);

const markSchema: z.ZodType<{ type: string; attrs?: Record<string, unknown> }> = z.object({
  type: markTypeSchema,
  attrs: z.record(z.string(), z.unknown()).optional(),
}).loose();

const nodeSchema: z.ZodType<TiptapNode> = z.lazy(() =>
  z.object({
    type: nodeTypeSchema,
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(nodeSchema).optional(),
    marks: z.array(markSchema).optional(),
    text: z.string().optional(),
  }).loose()
) as z.ZodType<TiptapNode>;

/**
 * `tiptapDocSchema`: asserts the parsed value is `{ type:"doc", content: [...] }`.
 * Anything else (a string, `{type:"x"}`, a node without a doc root) is rejected.
 */
export const tiptapDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(nodeSchema),
}).loose() as z.ZodType<TiptapDoc>;

/** Walk a parsed doc and reject if it is deeper or larger than the prose caps. */
function withinBounds(doc: TiptapDoc): boolean {
  let nodeCount = 0;
  function walk(node: TiptapNode, depth: number): boolean {
    if (depth > MAX_DEPTH) return false;
    if (++nodeCount > MAX_NODES) return false;
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        if (!walk(child, depth + 1)) return false;
      }
    }
    return true;
  }
  for (const child of doc.content) {
    if (!walk(child, 1)) return false;
  }
  return true;
}

export type ParseResult = { ok: true; doc: TiptapDoc } | { ok: false };

/**
 * `parseTiptapDoc`: JSON.parse inside try/catch -> size bound -> tiptapDocSchema
 * -> depth/count bound. Returns `{ ok:true, doc } | { ok:false }` and NEVER throws
 * (fail-closed). A legacy raw-HTML string, non-JSON garbage, a non-doc object, or an
 * oversized/over-deep body all return `{ ok:false }`.
 */
export function parseTiptapDoc(body: unknown): ParseResult {
  if (typeof body !== "string") return { ok: false };
  if (body.length > MAX_BODY_CHARS) return { ok: false };

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return { ok: false };
  }

  const result = tiptapDocSchema.safeParse(parsed);
  if (!result.success) return { ok: false };
  if (!withinBounds(result.data)) return { ok: false };

  return { ok: true, doc: result.data };
}

/**
 * `sanitizeDocLinks`: returns a NEW doc (no mutation of the input) in which every
 * `link` mark whose `attrs.href` fails `safeHttpUrl` has been DROPPED — the marked
 * text survives, only the unsafe link mark is removed. This is the write-time (and
 * pre-render) layer of the three-layer link defense (T-2la-02).
 */
export function sanitizeDocLinks<T extends TiptapDoc>(doc: T): T {
  function cleanNode(node: TiptapNode): TiptapNode {
    const next: TiptapNode = { ...node };

    if (Array.isArray(node.marks)) {
      next.marks = node.marks.filter((mark) => {
        if (mark.type !== "link") return true;
        const href = mark.attrs?.href;
        return safeHttpUrl(href) !== "";
      });
    }

    if (Array.isArray(node.content)) {
      next.content = node.content.map(cleanNode);
    }

    return next;
  }

  return {
    ...doc,
    content: doc.content.map(cleanNode),
  };
}
