"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

interface InviteClientProps {
  token: string;
}

interface VerifyResponse {
  valid: boolean;
  role: string;
  redirectTo: string | null;
}

interface ClaimResponse {
  redirectTo: string;
}

export default function InviteClient({ token }: InviteClientProps) {
  const t = useTranslations("invite");
  const locale = useLocale();

  const [status, setStatus] = useState<"verifying" | "invalid" | "ready" | "submitting" | "done">("verifying");
  const [role, setRole] = useState<string>("");
  const [redirectTo, setRedirectTo] = useState<string>(`/${locale}/reviewer`);
  const [error, setError] = useState<string>("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch(`/api/auth/invite/verify?token=${encodeURIComponent(token)}`);
        const data = (await res.json()) as VerifyResponse;

        if (!res.ok || !data.valid) {
          if (!cancelled) setStatus("invalid");
          return;
        }

        if (!cancelled) {
          setRole(data.role);
          setRedirectTo(data.redirectTo || defaultRedirect(data.role, locale));
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, locale]);

  function defaultRedirect(roleName: string, loc: string): string {
    if (roleName === "admin") return `/${loc}/admin/stats`;
    if (roleName === "senior_reviewer" || roleName === "reviewer") return `/${loc}/reviewer`;
    return `/${loc}`;
  }

  function roleLabel(roleName: string): string {
    return t(`role.${roleName}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("passwordTooShort", { min: 8 }));
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/auth/invite/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password, name: name.trim() || undefined }),
      });

      const data = (await res.json()) as ClaimResponse & { message?: string; code?: string };

      if (!res.ok) {
        setStatus("ready");
        setError(mapError(data.code, data.message));
        return;
      }

      setStatus("done");
      window.location.href = data.redirectTo || redirectTo;
    } catch {
      setStatus("ready");
      setError(t("genericError"));
    }
  }

  function mapError(code?: string, fallback?: string): string {
    switch (code) {
      case "PASSWORD_TOO_SHORT":
        return t("passwordTooShort", { min: 8 });
      case "PASSWORD_TOO_LONG":
        return t("passwordTooLong");
      case "USER_ALREADY_EXISTS":
        return t("userExists");
      case "INVALID_INVITE_TOKEN":
        return t("invalidToken");
      default:
        return fallback || t("genericError");
    }
  }

  if (status === "verifying") {
    return (
      <div className="login-card" style={{ textAlign: "center" }}>
        <div className="ds-h1">{t("title")}</div>
        <p className="ds-body" style={{ color: "var(--fg2)", marginTop: 16 }}>
          {t("verifying")}
        </p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="login-card" style={{ textAlign: "center" }}>
        <div className="ds-h1">{t("title")}</div>
        <div className="login-error" style={{ marginTop: 16 }}>
          {t("invalidToken")}
        </div>
      </div>
    );
  }

  return (
    <div className="login-card">
      <div className="login-header">
        <div className="ds-h1">{t("title")}</div>
        <p className="ds-body" style={{ color: "var(--fg2)", marginTop: 8 }}>
          {t("subtitle", { role: roleLabel(role) })}
        </p>
      </div>

      {error && <div className="login-error">{error}</div>}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-field">
          <label htmlFor="name">{t("name")}</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="ds-input"
            autoComplete="name"
          />
        </div>

        <div className="form-field">
          <label htmlFor="email">{t("email")}</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="ds-input"
            autoComplete="email"
            dir="ltr"
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">{t("password")}</label>
          <div className="login-password-row">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="ds-input"
              autoComplete="new-password"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="btn secondary login-show-btn"
            >
              {showPassword ? t("hide") : t("show")}
            </button>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="confirmPassword">{t("confirmPassword")}</label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="ds-input"
            autoComplete="new-password"
            dir="ltr"
          />
        </div>

        <button
          type="submit"
          disabled={status === "submitting" || status === "done"}
          className="btn primary login-submit"
        >
          {status === "submitting" || status === "done" ? t("redirecting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
