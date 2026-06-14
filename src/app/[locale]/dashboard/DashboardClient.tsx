"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageShell } from "@/components";

interface Stats {
  published: number;
  rejected: number;
  corrected: number;
  pending: number;
  underReview: number;
}

export default function DashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("dashboard");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setStats(data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  const items = stats
    ? [
        { label: t("published"), value: stats.published },
        { label: t("rejected"), value: stats.rejected },
        { label: t("corrected"), value: stats.corrected },
        { label: t("pending"), value: stats.pending },
        { label: t("underReview"), value: stats.underReview },
      ]
    : [];

  return (
    <PageShell>
      <div className="page-header-center">
        <div className="ds-h1">{t("title")}</div>
        <p className="ds-lead">{t("lead")}</p>
      </div>

      {loading ? (
        <div className="dash-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card dash-card">
              <div className="skeleton" style={{ height: 36, width: 50, margin: "0 auto 8px" }} />
              <div className="skeleton" style={{ height: 14, width: 80, margin: "0 auto" }} />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="dash-grid">
          {items.map((item) => (
            <div key={item.label} className="card dash-card">
              <div className="dash-value">{item.value}</div>
              <div className="dash-label">{item.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state">
          <p className="ds-body text-fg2">{t("empty")}</p>
        </div>
      )}
    </PageShell>
  );
}
