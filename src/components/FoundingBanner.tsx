"use client";

import { useLocale } from "next-intl";

const PLEDGES_AR = [
  { text: "لا عنف", negative: true },
  { text: "لا تهجير", negative: true },
  { text: "لا تهديد", negative: true },
  { text: "لا اعتداء", negative: true },
  { text: "نعم للعدالة", negative: false },
  { text: "نعم للمقاطعة الطوعية", negative: false },
  { text: "نعم للوعي", negative: false },
];

const PLEDGES_EN = [
  { text: "No Violence", negative: true },
  { text: "No Displacement", negative: true },
  { text: "No Threats", negative: true },
  { text: "No Aggression", negative: true },
  { text: "Yes to Justice", negative: false },
  { text: "Yes to Civic Boycott", negative: false },
  { text: "Yes to Awareness", negative: false },
];

export function FoundingBanner() {
  const locale = useLocale();
  const pledges = locale === "ar" ? PLEDGES_AR : PLEDGES_EN;

  return (
    <section className="founding-banner">
      <div className="founding-inner">
        <div className="founding-date">
          <div className="year">2026</div>
          <div className="label">
            {locale === "ar" ? "التأسيس" : "Founded"}
          </div>
          <div className="day">
            {locale === "ar" ? "٣٠ مايو" : "30 May"}
          </div>
        </div>
        <div className="founding-pledges">
          {pledges.map((p, i) => (
            <span key={i} className={`pledge-chip${p.negative ? " negative" : ""}`}>
              {p.negative ? "✕" : "✓"} {p.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
