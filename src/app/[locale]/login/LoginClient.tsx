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

        // Check if 2FA is required
        if ((res.data as any)?.twoFactorRedirect) {
          setNeedsTOTP(true);
          setLoading(false);
          return;
        }

        // Success — redirect
        window.location.href = redirectTo;
        return;
      }

      // Verify TOTP
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

      // Success — redirect
      window.location.href = redirectTo;
    } catch (err) {
      setError(t("invalidCredentials"));
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 24, textAlign: "center" }}>
        {t("title")}
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 16,
            borderRadius: "var(--radius)",
            background: "rgba(220, 38, 38, 0.1)",
            color: "#dc2626",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {!needsTOTP ? (
          <>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--fg1)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
                {t("password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--fg1)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                }}
              />
            </div>
          </>
        ) : (
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
              {t("totpCode")}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              required
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg1)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                letterSpacing: 8,
                textAlign: "center",
              }}
            />
            <p className="ds-caption" style={{ marginTop: 8, color: "var(--fg2)" }}>
              {t("totpRequired")}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 20px",
            borderRadius: "var(--radius)",
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? t("redirecting") : t("submit")}
        </button>
      </form>
    </main>
  );
}
