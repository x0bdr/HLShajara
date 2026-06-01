"use client";

import { useLocale, useTranslations } from "next-intl";

const DOMAINS_AR = [
  { icon: "🏛️", label: "التحقيقات الدولية" },
  { icon: "📊", label: "تقارير المنظمات" },
  { icon: "⚖️", label: "المحاكم والجنايات" },
  { icon: "📰", label: "الصحافة الاستقصائية" },
  { icon: "📑", label: "وثائق رسمية" },
  { icon: "🎥", label: "توثيق مرئي" },
  { icon: "📍", label: "تقارير ميدانية" },
  { icon: "💻", label: "أرشيف رقمي" },
  { icon: "🌍", label: "مصادر الأمم المتحدة" },
  { icon: "📋", label: "قوائم العقوبات" },
];

const DOMAINS_EN = [
  { icon: "🏛️", label: "International Investigations" },
  { icon: "📊", label: "NGO Reports" },
  { icon: "⚖️", label: "Courts & Tribunals" },
  { icon: "📰", label: "Investigative Journalism" },
  { icon: "📑", label: "Official Documents" },
  { icon: "🎥", label: "Visual Documentation" },
  { icon: "📍", label: "Field Reports" },
  { icon: "💻", label: "Digital Archives" },
  { icon: "🌍", label: "UN Sources" },
  { icon: "📋", label: "Sanctions Lists" },
];

export function DocumentationDomains() {
  const locale = useLocale();
  const t = useTranslations("home");
  const domains = locale === "ar" ? DOMAINS_AR : DOMAINS_EN;

  return (
    <section className="domains-section">
      <div className="domains-inner">
        <div className="domains-header">
          <h2 className="domains-title">{t("domainsTitle")}</h2>
          <p className="domains-lead">{t("domainsLead")}</p>
        </div>
        <div className="domains-grid">
          {domains.map((d, i) => (
            <div key={i} className="domain-item">
              <div className="domain-icon">{d.icon}</div>
              <div className="domain-label">{d.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
