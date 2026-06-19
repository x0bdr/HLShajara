import { describe, it, expect, beforeEach, vi } from "vitest";

/* ----------------------------- mocks ----------------------------- */

// DB: insert(...).values(...).returning() and update(...).set(...).where(...).returning().
// select(...).from(...).where(...).limit(...) returns a controllable rows array (for the
// slug-uniqueness + current-row lookups). We capture the values/set payloads to assert the
// sanitized body actually written.
const insertValuesMock = vi.fn();
const updateSetMock = vi.fn();
let selectRows: unknown[] = [];

vi.mock("@/db", () => {
  const selectChain = {
    from: () => selectChain,
    where: () => selectChain,
    orderBy: () => selectChain,
    limit: async () => selectRows,
  };
  return {
    db: {
      select: () => selectChain,
      insert: () => ({
        values: (v: unknown) => {
          insertValuesMock(v);
          return { returning: async () => [{ id: 1, ...(v as object) }] };
        },
      }),
      update: () => ({
        set: (v: unknown) => {
          updateSetMock(v);
          return { where: () => ({ returning: async () => [{ id: 7, ...(v as object) }] }) };
        },
      }),
    },
  };
});

// schema: only the `posts` table object is read; importing it for real is harmless,
// but stub it so the suite needs no DB driver. The route only references posts.* columns
// via drizzle operators which we never execute against a real connection.
vi.mock("@/db/schema", () => ({
  posts: {
    id: { name: "id" },
    slug: { name: "slug" },
    locale: { name: "locale" },
    status: { name: "status" },
    title: { name: "title" },
    excerpt: { name: "excerpt" },
    coverImageUrl: { name: "coverImageUrl" },
    publishedAt: { name: "publishedAt" },
    createdAt: { name: "createdAt" },
    updatedAt: { name: "updatedAt" },
    authorId: { name: "authorId" },
    body: { name: "body" },
  },
}));

// drizzle-orm operators are pure no-ops here (we never hit a real query builder).
vi.mock("drizzle-orm", () => ({
  eq: (...a: unknown[]) => ({ op: "eq", a }),
  and: (...a: unknown[]) => ({ op: "and", a }),
  desc: (...a: unknown[]) => ({ op: "desc", a }),
}));

// session/auth: authenticated reviewer by default.
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({ user: { role: "reviewer" } })),
  getInternalUserId: vi.fn(async () => 99),
  forbiddenResponse: () =>
    new Response(JSON.stringify({ ok: false, message: "forbidden" }), { status: 403 }),
}));
vi.mock("@/lib/auth", () => ({ hasRole: vi.fn(() => true) }));

// rate-limit: allow by default.
vi.mock("@/lib/rate-limit", () => ({
  rateLimitResponse: vi.fn(async () => ({ ok: true })),
}));

// withAudit just runs the callback (no audit side effects in tests).
vi.mock("@/db/persist", () => ({
  withAudit: vi.fn(async (_meta: unknown, cb: () => Promise<unknown>) => cb()),
}));

import { POST, PATCH } from "@/app/api/posts/admin/route";

/* ----------------------------- helpers ----------------------------- */

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/posts/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validDoc(extraContent: unknown[] = []) {
  return JSON.stringify({
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Clean body." }] },
      ...extraContent,
    ],
  });
}

function docWithLink(href: string) {
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href } }] }],
      },
    ],
  });
}

beforeEach(() => {
  insertValuesMock.mockClear();
  updateSetMock.mockClear();
  selectRows = []; // default: no slug conflict / no existing row
});

/* ----------------------------- POST ----------------------------- */

describe("POST /api/posts/admin — TipTap-doc write validation", () => {
  it("rejects a non-JSON (legacy HTML) body with 400 and does NOT insert", async () => {
    const res = await POST(makeRequest({ slug: "s", locale: "en", title: "T", body: "<p>raw</p>" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.message).toBe("Invalid publication body");
    expect(insertValuesMock).not.toHaveBeenCalled();
  });

  it("accepts a valid clean doc with 200 and inserts the re-stringified doc", async () => {
    const res = await POST(makeRequest({ slug: "s", locale: "en", title: "T", body: validDoc() }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(insertValuesMock).toHaveBeenCalledTimes(1);
    const written = insertValuesMock.mock.calls[0][0] as { body: string };
    expect(JSON.parse(written.body).type).toBe("doc");
  });

  it("drops a javascript: link href on write (stored body has no javascript:)", async () => {
    const res = await POST(
      makeRequest({ slug: "s", locale: "en", title: "T", body: docWithLink("javascript:alert(1)") })
    );
    expect(res.status).toBe(200);
    const written = insertValuesMock.mock.calls[0][0] as { body: string };
    expect(written.body.toLowerCase()).not.toContain("javascript:");
    // text preserved, link mark gone
    const stored = JSON.parse(written.body);
    const marks = stored.content[0].content[0].marks ?? [];
    expect(marks.filter((m: { type: string }) => m.type === "link")).toHaveLength(0);
  });

  it("still rejects a missing body (required-field check) with 400", async () => {
    const res = await POST(makeRequest({ slug: "s", locale: "en", title: "T" }));
    expect(res.status).toBe(400);
    expect(insertValuesMock).not.toHaveBeenCalled();
  });

  it("rejects a doc with an UNKNOWN node type (M1 allowlist) with 400 and does NOT insert", async () => {
    const bogus = JSON.stringify({
      type: "doc",
      content: [{ type: "bogusNode", content: [{ type: "text", text: "x" }] }],
    });
    const res = await POST(makeRequest({ slug: "s", locale: "en", title: "T", body: bogus }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe("Invalid publication body");
    expect(insertValuesMock).not.toHaveBeenCalled();
  });

  it("rejects a doc with an UNKNOWN mark type (M1 allowlist) with 400 and does NOT insert", async () => {
    const bogus = JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "evilMark" }] }] },
      ],
    });
    const res = await POST(makeRequest({ slug: "s", locale: "en", title: "T", body: bogus }));
    expect(res.status).toBe(400);
    expect(insertValuesMock).not.toHaveBeenCalled();
  });
});

/* ----------------------------- PATCH ----------------------------- */

function makePatch(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/posts/admin", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/posts/admin — TipTap-doc write validation", () => {
  it("rejects a non-doc body with 400 and does NOT update", async () => {
    selectRows = [{ id: 7, slug: "s", locale: "en", publishedAt: null }];
    const res = await PATCH(makePatch({ id: 7, body: "<p>raw</p>" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe("Invalid publication body");
    expect(updateSetMock).not.toHaveBeenCalled();
  });

  it("accepts a valid doc body and updates with the re-stringified sanitized doc", async () => {
    selectRows = [{ id: 7, slug: "s", locale: "en", publishedAt: null }];
    const res = await PATCH(makePatch({ id: 7, body: docWithLink("javascript:alert(1)") }));
    expect(res.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledTimes(1);
    const written = updateSetMock.mock.calls[0][0] as { body?: string };
    expect(written.body).toBeDefined();
    expect(written.body!.toLowerCase()).not.toContain("javascript:");
  });

  it("allows a partial update with NO body field (status-only) — still succeeds", async () => {
    selectRows = [{ id: 7, slug: "s", locale: "en", publishedAt: null }];
    const res = await PATCH(makePatch({ id: 7, status: "published" }));
    expect(res.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledTimes(1);
    const written = updateSetMock.mock.calls[0][0] as { body?: string; status?: string };
    expect(written.body).toBeUndefined();
    expect(written.status).toBe("published");
  });
});
