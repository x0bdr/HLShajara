/**
 * Ready-library validation helpers.
 *
 * Prefer these over hand-rolled regex so validation stays strict, tested,
 * and consistent across the app.
 */

import { z } from "zod";

export function isValid<T>(schema: z.ZodType<T>, value: unknown): value is T {
  return schema.safeParse(value).success;
}

const emailSchema = z.string().trim().email();
const urlSchema = z.string().trim().url();
const phoneSchema = z.string().trim().regex(/^[\d\s\+\-\(\)]+$/);

export function isValidEmail(value: string): boolean {
  return isValid(emailSchema, value);
}

export function isValidUrl(value: string): boolean {
  return isValid(urlSchema, value);
}

export function isValidPhone(value: string): boolean {
  return isValid(phoneSchema, value);
}
