"use client";

import { useLocale, useTranslations } from "next-intl";

const PLEDGES_AR = [
  { text: "لا عنف", negative: true },
  { text: "لا تهجير", negative: true },
  { text: "لا تهديد", negative: true },
  { text: "لا اعتداء", negative: true },
  { text: "نعم للعدالة", negative: false },
  { text: "نعم للمقاطعة الطوعية الشعبية", negative: false },
  { text: "نعم للوعي السلمي", negative: false },
  { text: "نعم للمقاطعة الاقتصادية الاجتماعية", negative: false },
];

const PLEDGES_EN = [
  { text: "No Violence", negative: true },
  { text: "No Displacement", negative: true },
  { text: "No Threats", negative: true },
  { text: "No Aggression", negative: true },
  { text: "Yes to Justice", negative: false },
  { text: "Yes to Popular Voluntary Boycott", negative: false },
  { text: "Yes to Peaceful Awareness", negative: false },
  { text: "Yes to Social & Economic Boycott", negative: false },
];

export function PrinciplesSection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const pledges = locale === "ar" ? PLEDGES_AR : PLEDGES_EN;

  return (
    <section className="principles-section">
      <div className="principles-header">
        <h2 className="principles-title">{t("principlesTitle")}</h2>
      </div>
      <div className="principles-grid">
        {pledges.map((p, i) => (
          <div key={i} className={`principle-card${p.negative ? " negative" : ""}`}>
            <div className="principle-symbol">{p.negative ? "✕" : "✓"}</div>
            <div className="principle-label">{p.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
