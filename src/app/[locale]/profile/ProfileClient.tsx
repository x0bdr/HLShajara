"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { authClient } from "@/lib/auth-client";

interface Account {
  id: string;
  providerId: string;
  accountId: string;
}

export default function ProfileClient({
  user,
}: {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
  };
}) {
  const locale = useLocale();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/user/accounts");
      const data = await res.json();
      if (data.ok) setAccounts(data.accounts);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function linkTwitter() {
    setLinking(true);
    try {
      await authClient.signIn.social({
        provider: "twitter",
        callbackURL: window.location.href,
      });
    } catch {
      alert(locale === "ar" ? "فشل الربط" : "Link failed");
      setLinking(false);
    }
  }

  async function unlinkAccount(accountId: string) {
    if (!confirm(locale === "ar" ? "إلغاء ربط هذا الحساب؟" : "Unlink this account?")) return;
    try {
      const res = await fetch("/api/user/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: "twitter", accountId }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchAccounts();
      } else {
        alert(data.message || "Unlink failed");
      }
    } catch {
      alert("Network error");
    }
  }

  const hasTwitter = accounts.some((a) => a.providerId === "twitter");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* User info card */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--green-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 700,
                color: "var(--green-700)",
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="ds-h2" style={{ margin: 0 }}>{user.name}</div>
            <div className="ds-body-sm" style={{ color: "var(--fg2)" }}>{user.email}</div>
            {user.role && (
              <div className="ds-caption" style={{ color: "var(--fg3)", marginTop: 4, textTransform: "capitalize" }}>
                {user.role}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Linked accounts */}
      <div className="card" style={{ padding: 24 }}>
        <div className="ds-h2" style={{ marginBottom: 16 }}>
          {locale === "ar" ? "الحسابات المرتبطة" : "Linked Accounts"}
        </div>

        {loading ? (
          <p className="ds-body text-fg2">Loading...</p>
        ) : accounts.length === 0 ? (
          <p className="ds-body text-fg2">
            {locale === "ar" ? "لا توجد حسابات مرتبطة." : "No linked accounts."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {accounts.map((account) => (
              <div
                key={account.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--stone-50)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {account.providerId === "twitter" && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  )}
                  <span className="ds-body" style={{ textTransform: "capitalize" }}>
                    {account.providerId}
                  </span>
                </div>
                <button
                  className="btn danger btn-sm"
                  onClick={() => unlinkAccount(account.accountId)}
                >
                  {locale === "ar" ? "إلغاء الربط" : "Unlink"}
                </button>
              </div>
            ))}
          </div>
        )}

        {!hasTwitter && (
          <div style={{ marginTop: 16 }}>
            <button className="btn secondary" onClick={linkTwitter} disabled={linking}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginInlineEnd: 6 }}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              {linking
                ? (locale === "ar" ? "جاري الربط..." : "Linking...")
                : (locale === "ar" ? "ربط حساب X" : "Link X Account")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
