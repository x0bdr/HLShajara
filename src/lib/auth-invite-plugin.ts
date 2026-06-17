import { createAuthEndpoint, APIError, formCsrfMiddleware } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { parseSessionOutput, parseUserOutput } from "better-auth/db";
import * as z from "zod";

const INVITE_TOKEN_PREFIX = "invite:";

const VALID_ROLES = ["admin", "reviewer", "senior_reviewer", "submitter"] as const;

type InviteRole = (typeof VALID_ROLES)[number];

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function getRedirectForRole(role: InviteRole, locale: "ar" | "en"): string {
  switch (role) {
    case "admin":
      return `/${locale}/admin/stats`;
    case "senior_reviewer":
    case "reviewer":
      return `/${locale}/reviewer`;
    default:
      return `/${locale}`;
  }
}

export interface InvitePluginOptions {
  /**
   * Invite token lifetime in seconds. Defaults to 7 days.
   */
  expiresIn?: number;
}

export function invitePlugin(options?: InvitePluginOptions) {
  const expiresIn = options?.expiresIn ?? 7 * 24 * 60 * 60;

  return {
    id: "invite",
    endpoints: {
      inviteVerify: createAuthEndpoint(
        "/invite/verify",
        {
          method: "GET",
          query: z.object({ token: z.string().min(1) }),
          requireHeaders: true,
        },
        async (ctx) => {
          const record = await ctx.context.internalAdapter.findVerificationValue(
            INVITE_TOKEN_PREFIX + ctx.query.token
          );
          if (!record) {
            throw APIError.from("BAD_REQUEST", {
              code: "INVALID_INVITE_TOKEN",
              message: "Invalid or expired invite link.",
            });
          }

          let payload: { role?: InviteRole; redirectTo?: string } = {};
          try {
            payload = JSON.parse(record.value);
          } catch {
            // Treat malformed token as invalid.
            throw APIError.from("BAD_REQUEST", {
              code: "INVALID_INVITE_TOKEN",
              message: "Invalid or expired invite link.",
            });
          }

          const role = payload.role ?? "reviewer";
          if (!VALID_ROLES.includes(role)) {
            throw APIError.from("BAD_REQUEST", {
              code: "INVALID_INVITE_TOKEN",
              message: "Invalid or expired invite link.",
            });
          }

          return ctx.json({
            valid: true,
            role,
            redirectTo: payload.redirectTo ?? null,
          });
        }
      ),

      inviteClaim: createAuthEndpoint(
        "/invite/claim",
        {
          method: "POST",
          use: [formCsrfMiddleware],
          cloneRequest: true,
          body: z.object({
            token: z.string().min(1),
            email: z.string().email(),
            password: z.string().min(1),
            name: z.string().min(1).optional(),
          }),
          requireHeaders: true,
        },
        async (ctx) => {
          const record = await ctx.context.internalAdapter.consumeVerificationValue(
            INVITE_TOKEN_PREFIX + ctx.body.token
          );
          if (!record) {
            throw APIError.from("BAD_REQUEST", {
              code: "INVALID_INVITE_TOKEN",
              message: "Invalid or expired invite link.",
            });
          }

          let payload: { role?: InviteRole; redirectTo?: string } = {};
          try {
            payload = JSON.parse(record.value);
          } catch {
            throw APIError.from("BAD_REQUEST", {
              code: "INVALID_INVITE_TOKEN",
              message: "Invalid or expired invite link.",
            });
          }

          const role = payload.role ?? "reviewer";
          if (!VALID_ROLES.includes(role)) {
            throw APIError.from("BAD_REQUEST", {
              code: "INVALID_INVITE_TOKEN",
              message: "Invalid or expired invite link.",
            });
          }

          const normalizedEmail = normalizeEmail(ctx.body.email);
          const name = ctx.body.name?.trim() || normalizedEmail.split("@")[0];

          const existing = await ctx.context.internalAdapter.findUserByEmail(normalizedEmail);
          if (existing?.user) {
            throw APIError.from("UNPROCESSABLE_ENTITY", {
              code: "USER_ALREADY_EXISTS",
              message: "An account with this email already exists.",
            });
          }

          const minLength = ctx.context.password.config.minPasswordLength ?? 8;
          const maxLength = ctx.context.password.config.maxPasswordLength ?? 128;
          if (ctx.body.password.length < minLength) {
            throw APIError.from("BAD_REQUEST", {
              code: "PASSWORD_TOO_SHORT",
              message: `Password must be at least ${minLength} characters.`,
            });
          }
          if (ctx.body.password.length > maxLength) {
            throw APIError.from("BAD_REQUEST", {
              code: "PASSWORD_TOO_LONG",
              message: `Password must be at most ${maxLength} characters.`,
            });
          }

          const passwordHash = await ctx.context.password.hash(ctx.body.password);

          const user = await ctx.context.internalAdapter.createUser({
            email: normalizedEmail,
            name,
            emailVerified: true,
            role,
          });

          if (!user) {
            throw APIError.from("BAD_REQUEST", {
              code: "FAILED_TO_CREATE_USER",
              message: "Failed to create account. Please try again.",
            });
          }

          await ctx.context.internalAdapter.linkAccount({
            userId: user.id,
            providerId: "credential",
            accountId: user.id,
            password: passwordHash,
          });

          const session = await ctx.context.internalAdapter.createSession(user.id);
          if (!session) {
            throw APIError.from("BAD_REQUEST", {
              code: "FAILED_TO_CREATE_SESSION",
              message: "Failed to create session. Please try again.",
            });
          }

          await setSessionCookie(ctx, { session, user });

          return ctx.json({
            user: parseUserOutput(ctx.context.options, user),
            session: parseSessionOutput(ctx.context.options, session),
            role,
            redirectTo: payload.redirectTo || getRedirectForRole(role, "ar"),
          });
        }
      ),
    },
  };
}
