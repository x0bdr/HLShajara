"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

interface Stats {
  xSignups: number;
  activeSessions: number;
}

export default function StatsAdminClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStats(data.stats);
        } else {
          setError(data.message || "Failed to load stats");
        }
      })
      .catch(() => setError(locale === "ar" ? "خطأ في الاتصال" : "Network error"))
      .finally(() => setLoading(false));
  }, [locale]);

  if (loading) {
    return <p className="ds-body empty-text">{locale === "ar" ? "جارِ التحميل..." : "Loading..."}</p>;
  }

  if (error) {
    return (
      <div className="card empty-state">
        <p className="ds-body text-fg2">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card empty-state">
        <p className="ds-body text-fg2">{locale === "ar" ? "لا توجد بيانات." : "No data available."}</p>
      </div>
    );
  }

  const cards = [
    {
      label: locale === "ar" ? "المستخدمون المسجّلون عبر X" : "Users signed up with X",
      value: stats.xSignups,
    },
    {
      label: locale === "ar" ? "الجلسات النشطة" : "Active sessions",
      value: stats.activeSessions,
    },
  ];

  return (
    <div className="dash-grid">
      {cards.map((card) => (
        <div key={card.label} className="card dash-card">
          <div className="dash-value">{card.value}</div>
          <div className="dash-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
