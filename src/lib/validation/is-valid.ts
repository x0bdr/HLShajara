/**
 * Ready-library validation + sanitization helpers.
 *
 * Uses the `validator` package for email/URL/phone checks instead of
 * hand-rolled regex so validation stays strict and consistent.
 */

import validator from "validator";
import { z } from "zod";

export function isValid<T>(schema: z.ZodType<T>, value: unknown): value is T {
  return schema.safeParse(value).success;
}

const URL_OPTIONS: validator.IsURLOptions = {
  protocols: ["http", "https"],
  require_protocol: true,
  require_valid_protocol: true,
  require_tld: true,
};

const EMAIL_OPTIONS: validator.IsEmailOptions = {
  allow_ip_domain: false,
};

export function sanitizeInput(value: string): string {
  // Trim + collapse whitespace + strip non-printable control chars.
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

export function sanitizeEmail(value: string): string {
  const trimmed = sanitizeInput(value).toLowerCase();
  return validator.normalizeEmail(trimmed) || trimmed;
}

export function sanitizeUrl(value: string): string {
  return sanitizeInput(value);
}

export function isValidEmail(value: string): boolean {
  return validator.isEmail(sanitizeInput(value), EMAIL_OPTIONS);
}

export function isValidUrl(value: string): boolean {
  return validator.isURL(sanitizeUrl(value), URL_OPTIONS);
}

export function isValidPhone(value: string): boolean {
  const cleaned = sanitizeInput(value);
  // Allow digits, spaces, +, -, (, ) and require at least 5 digits.
  if (!/^[\d\s\+\-\(\)]+$/.test(cleaned)) return false;
  return (cleaned.match(/\d/g) ?? []).length >= 5;
}
