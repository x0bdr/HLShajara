"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("profile");
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
      alert(t("linkFailed"));
      setLinking(false);
    }
  }

  async function unlinkAccount(accountId: string) {
    if (!confirm(t("unlinkConfirm"))) return;
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
        alert(data.message || t("unlinkFailed"));
      }
    } catch {
      alert(t("networkError"));
    }
  }

  const hasTwitter = accounts.some((a) => a.providerId === "twitter");

  return (
    <div className="profile-stack">
      {/* User info card */}
      <div className="card profile-card">
        <div className="profile-head">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- user avatar from external OAuth provider
            <img
              src={user.image}
              alt={user.name}
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="ds-h2 profile-name">{user.name}</div>
            <div className="ds-body-sm profile-meta">{user.email}</div>
            {user.role && (
              <div className="ds-caption profile-role">{user.role}</div>
            )}
          </div>
        </div>
      </div>

      {/* Linked accounts */}
      <div className="card profile-card">
        <div className="ds-h2 profile-section-title">
          {t("linkedAccounts")}
        </div>

        {loading ? (
          <p className="ds-body text-fg2">{t("loading")}</p>
        ) : accounts.length === 0 ? (
          <p className="ds-body text-fg2">{t("noAccounts")}</p>
        ) : (
          <div className="profile-accounts">
            {accounts.map((account) => (
              <div key={account.id} className="profile-account-row">
                <div className="profile-account-info">
                  {account.providerId === "twitter" && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  )}
                  <span className="ds-body">{account.providerId}</span>
                </div>
                <button
                  className="btn danger btn-sm"
                  onClick={() => unlinkAccount(account.accountId)}
                >
                  {t("unlink")}
                </button>
              </div>
            ))}
          </div>
        )}

        {!hasTwitter && (
          <div className="profile-link-wrap">
            <button className="btn secondary profile-link-btn" onClick={linkTwitter} disabled={linking}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              {linking ? t("linking") : t("linkX")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
