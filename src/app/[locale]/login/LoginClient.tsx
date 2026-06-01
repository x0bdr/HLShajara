"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginClient() {
  const t = useTranslations("login");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || `/${locale}/reviewer`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [needsTOTP, setNeedsTOTP] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!needsTOTP) {
        const res = await authClient.signIn.email({
          email,
          password,
          callbackURL: redirectTo,
        });

        if (res.error) {
          setError(res.error.message || t("invalidCredentials"));
          setLoading(false);
          return;
        }

        if ((res.data as any)?.twoFactorRedirect) {
          setNeedsTOTP(true);
          setLoading(false);
          return;
        }

        window.location.href = redirectTo;
        return;
      }

      const verifyRes = await fetch("/api/auth/two-factor/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.message || t("invalidCredentials"));
        setLoading(false);
        return;
      }

      window.location.href = redirectTo;
    } catch (err) {
      setError(t("invalidCredentials"));
      setLoading(false);
    }
  }

  return (
    <>
      <div className="login-card">
        <div className="page-header-center" style={{ marginBottom: 24 }}>
          <div className="ds-h1">{t("title")}</div>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <div className="login-social">
          <button
            type="button"
            className="btn twitter"
            onClick={() => authClient.signIn.social({ provider: "twitter", callbackURL: redirectTo })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            {locale === "ar" ? "تسجيل الدخول بـ X" : "Sign in with X"}
          </button>
          <div className="login-divider">
            <span>{locale === "ar" ? "أو" : "OR"}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!needsTOTP ? (
            <>
              <div className="form-field">
                <label>{t("email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="ds-input"
                />
              </div>
              <div className="form-field">
                <label>{t("password")}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="ds-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="btn secondary"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {showPassword
                      ? (locale === "ar" ? "إخفاء" : "Hide")
                      : (locale === "ar" ? "إظهار" : "Show")}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="form-field">
              <label>{t("totpCode")}</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
                autoFocus
                className="ds-input"
                style={{ letterSpacing: 8, textAlign: "center" }}
              />
              <p className="ds-caption" style={{ marginTop: 8, color: "var(--fg2)" }}>
                {t("totpRequired")}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn primary"
            style={{ justifyContent: "center" }}
          >
            {loading ? t("redirecting") : t("submit")}
          </button>
        </form>
      </div>
    </>
  );
}
