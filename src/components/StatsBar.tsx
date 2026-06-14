"use client";

import { useTranslations } from "next-intl";

interface StatsBarProps {
  entries: number;
  sources: number;
  verdicts: number;
}

export function StatsBar({ entries, sources, verdicts }: StatsBarProps) {
  const t = useTranslations("home");

  const stats = [
    { n: entries, label: t("stats.entries") },
    { n: sources, label: t("stats.sources") },
    { n: verdicts, label: t("stats.verdicts") },
  ];

  return (
    <section className="stats-bar">
      {stats.map((s) => (
        <div key={s.label} className="stat-item">
          <div className="stat-number">{s.n}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </section>
  );
}
