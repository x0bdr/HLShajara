"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

interface Stats {
  published: number;
  rejected: number;
  corrected: number;
  pending: number;
  underReview: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("dashboard");
  const locale = useLocale();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setStats(data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  const statCard = (label: string, value: number, color: string) => (
    <div
      className="card"
      style={{
        padding: 24,
        textAlign: "center",
        borderTop: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 700, color, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 14, color: "var(--fg2)" }}>{label}</div>
    </div>
  );

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        <div className="ds-h1" style={{ marginBottom: 8 }}>{t("title")}</div>
        <p className="ds-lead">{t("lead")}</p>
      </header>

      {loading ? (
        <p className="ds-body" style={{ textAlign: "center" }}>{t("loading")}</p>
      ) : stats ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 16,
          }}
        >
          {statCard(t("published"), stats.published, "#16a34a")}
          {statCard(t("rejected"), stats.rejected, "#dc2626")}
          {statCard(t("corrected"), stats.corrected, "#2563eb")}
          {statCard(t("pending"), stats.pending, "#ca8a04")}
          {statCard(t("underReview"), stats.underReview, "#7c3aed")}
        </div>
      ) : (
        <p className="ds-body" style={{ textAlign: "center", color: "var(--fg2)" }}>
          {t("empty")}
        </p>
      )}
    </main>
  );
}
