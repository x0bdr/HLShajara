import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000, // 1 minute
  maxRequests: 10,
};

/**
 * PostgreSQL-backed distributed rate limiter.
 * Replaces in-memory Map for multi-instance deployments.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  // Upsert: try to find existing record, create if not found
  let record = await db.query.rateLimits.findFirst({
    where: eq(rateLimits.key, key),
  });

  if (!record) {
    const [inserted] = await db
      .insert(rateLimits)
      .values({ key, count: 1, windowStart: now })
      .returning();
    record = inserted;
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }

  // If window expired, reset
  if (record.windowStart < windowStart) {
    const [updated] = await db
      .update(rateLimits)
      .set({ count: 1, windowStart: now })
      .where(eq(rateLimits.id, record.id))
      .returning();
    record = updated;
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }

  // Within window: increment and check
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(record.windowStart.getTime() + config.windowMs),
    };
  }

  const [updated] = await db
    .update(rateLimits)
    .set({ count: sql`${rateLimits.count} + 1` })
    .where(eq(rateLimits.id, record.id))
    .returning();

  return {
    allowed: true,
    remaining: config.maxRequests - (updated?.count ?? record.count + 1),
    resetAt: new Date(record.windowStart.getTime() + config.windowMs),
  };
}

/**
 * Convenience wrapper for IP-based rate limiting on API routes.
 */
export async function rateLimitResponse(
  request: Request,
  config?: RateLimitConfig
): Promise<{ ok: false; response: Response } | { ok: true }> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const key = `ip:${ip}`;
  const result = await checkRateLimit(key, config);

  if (!result.allowed) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ ok: false, code: "RATE_LIMITED", message: "Too many requests. Please wait." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt.getTime() / 1000)),
          },
        }
      ),
    };
  }

  return { ok: true };
}
