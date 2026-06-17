/**
 * Per-step client-side validation for the report wizard.
 *
 * Validates format/content at the step level so users get immediate feedback
 * instead of a generic error at the final review step.
 */

import type { SubmitInput } from "@/lib/validation";
import type { StepId } from "./registry";

export type StepFieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/;
const PHONE_RE = /^[\d\s\+\-\(\)]+$/;

function isEmail(v: string): boolean {
  return EMAIL_RE.test(v.trim());
}

function isUrl(v: string): boolean {
  return URL_RE.test(v.trim());
}

function isPhone(v: string): boolean {
  return PHONE_RE.test(v.trim());
}

function addError(errors: StepFieldErrors, field: string, message: string) {
  if (!errors[field]) errors[field] = message;
}

function validateLocationInfo(form: SubmitInput): StepFieldErrors {
  const errors: StepFieldErrors = {};
  const meta = form.reportMetadata ?? {};

  const email = (meta.entityEmail ?? "").trim();
  if (email && !isEmail(email)) {
    addError(errors, "entityEmail", "invalidEmail");
  }

  const website = (meta.websiteName ?? "").trim();
  if (website && !isUrl(website)) {
    addError(errors, "websiteName", "invalidUrl");
  }

  const mapsLink = (meta.googleMapsLink ?? "").trim();
  if (mapsLink && !isUrl(mapsLink)) {
    addError(errors, "googleMapsLink", "invalidUrl");
  }

  const phone = (meta.contactPhone ?? "").trim();
  if (phone && !isPhone(phone)) {
    addError(errors, "contactPhone", "invalidPhone");
  }

  for (const method of meta.socialContactMethods ?? []) {
    const value = (method.value ?? "").trim();
    if (!value) continue;
    if (method.type === "email" && !isEmail(value)) {
      addError(errors, `socialContactMethods.${method.type}`, "invalidEmail");
    }
    if (method.type === "website" && !isUrl(value)) {
      addError(errors, `socialContactMethods.${method.type}`, "invalidUrl");
    }
    if ((method.type === "phone" || method.type === "whatsapp") && !isPhone(value)) {
      addError(errors, `socialContactMethods.${method.type}`, "invalidPhone");
    }
  }

  return errors;
}

function validateAboutYou(form: SubmitInput): StepFieldErrors {
  const errors: StepFieldErrors = {};
  const methods = form.reportMetadata?.contactMethods ?? [];

  for (const method of methods) {
    const value = (method.value ?? "").trim();
    if (!value) continue;
    if (method.type === "email" && !isEmail(value)) {
      addError(errors, `contactMethods.${method.type}`, "invalidEmail");
    }
    if (method.type === "website" && !isUrl(value)) {
      addError(errors, `contactMethods.${method.type}`, "invalidUrl");
    }
    if ((method.type === "phone" || method.type === "whatsapp") && !isPhone(value)) {
      addError(errors, `contactMethods.${method.type}`, "invalidPhone");
    }
  }

  return errors;
}

function validateMediaEvidence(form: SubmitInput): StepFieldErrors {
  const errors: StepFieldErrors = {};
  const mediaLink = (form.reportMetadata?.mediaLink ?? "").trim();
  if (mediaLink && !isUrl(mediaLink)) {
    addError(errors, "mediaLink", "invalidUrl");
  }
  return errors;
}

function validateExperience(form: SubmitInput): StepFieldErrors {
  const errors: StepFieldErrors = {};
  const description = form.allegationDescription?.trim() ?? "";
  if (description.length > 0 && description.length < 20) {
    addError(errors, "allegationDescription", "tooShort");
  }
  return errors;
}

const STEP_VALIDATORS: Partial<Record<StepId, (form: SubmitInput) => StepFieldErrors>> = {
  "location-info": validateLocationInfo,
  "about-you": validateAboutYou,
  "media-evidence": validateMediaEvidence,
  experience: validateExperience,
};

export function validateStep(stepId: StepId, form: SubmitInput): StepFieldErrors {
  const validator = STEP_VALIDATORS[stepId];
  return validator ? validator(form) : {};
}

export function formatStepErrors(
  errors: StepFieldErrors,
  t: (key: string) => string,
): string[] {
  const messages: string[] = [];
  const seen = new Set<string>();
  for (const code of Object.values(errors)) {
    if (seen.has(code)) continue;
    seen.add(code);
    messages.push(t(`validation.${code}`));
  }
  return messages;
}

export function formatApiValidationErrors(
  errors: Record<string, string[]> | undefined,
  t: (key: string) => string,
): string[] {
  if (!errors) return [];
  const messages: string[] = [];
  for (const [field, issues] of Object.entries(errors)) {
    for (const issue of issues) {
      const key = `validation.api.${field}.${issue}`;
      const translated = t(key);
      if (translated !== key) {
        messages.push(translated);
      } else {
        messages.push(`${field}: ${issue}`);
      }
    }
  }
  return messages;
}
