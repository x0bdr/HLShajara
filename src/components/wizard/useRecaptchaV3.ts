"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options?: { action?: string }) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

let scriptPromise: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src*="recaptcha/api.js?render=${SITE_KEY}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("reCAPTCHA script failed")));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("reCAPTCHA script failed"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function useRecaptchaV3(action = "submit") {
  const readyRef = useRef(false);

  useEffect(() => {
    if (!SITE_KEY) return;
    loadRecaptchaScript()
      .then(() => {
        window.grecaptcha?.ready(() => {
          readyRef.current = true;
        });
      })
      .catch((err) => {
        console.error("reCAPTCHA load error:", err);
      });
  }, []);

  const execute = useCallback(async (): Promise<string | null> => {
    if (!SITE_KEY) {
      console.warn("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set");
      return null;
    }
    if (typeof window === "undefined") return null;
    await loadRecaptchaScript();
    return new Promise((resolve) => {
      window.grecaptcha?.ready(async () => {
        try {
          const token = await window.grecaptcha?.execute(SITE_KEY, { action });
          resolve(token ?? null);
        } catch (err) {
          console.error("reCAPTCHA execute error:", err);
          resolve(null);
        }
      });
    });
  }, [action]);

  return { execute, siteKey: SITE_KEY };
}
