"use client";

import { useLocale, useTranslations } from "next-intl";

const NEGATIVE_AR = ["لا عنف", "لا تهجير", "لا تهديد", "لا اعتداء"];
const POSITIVE_AR = [
  "نعم للعدالة",
  "نعم للمقاطعة الطوعية الشعبية",
  "نعم للوعي السليم",
  "نعم للمقاطعة الاقتصادية الاجتماعية",
];

const NEGATIVE_EN = ["No Violence", "No Displacement", "No Threats", "No Aggression"];
const POSITIVE_EN = [
  "Yes to Justice",
  "Yes to Popular Voluntary Boycott",
  "Yes to Sound Awareness",
  "Yes to Social & Economic Boycott",
];

export function PrinciplesSection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const negative = locale === "ar" ? NEGATIVE_AR : NEGATIVE_EN;
  const positive = locale === "ar" ? POSITIVE_AR : POSITIVE_EN;

  return (
    <section className="principles-section">
      <div className="principles-header">
        <h2 className="principles-title">{t("principlesTitle")}</h2>
      </div>
      <div className="principles-pledges">
        <div className="founding-pledges">
          {negative.map((text, i) => (
            <span key={`n-${i}`} className="pledge-chip negative">
              ✕ {text}
            </span>
          ))}
        </div>
        <div className="founding-pledges">
          {positive.map((text, i) => (
            <span key={`p-${i}`} className="pledge-chip">
              ✓ {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
