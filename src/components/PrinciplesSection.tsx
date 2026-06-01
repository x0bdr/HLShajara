"use client";

import { useLocale, useTranslations } from "next-intl";

const PRINCIPLES_AR = [
  { icon: "⚖️", label: "الدليل لا الادّعاء", desc: "لا ادّعاء بدون مصدر موثَّق وقابل للتحقق." },
  { icon: "🛡️", label: "سلوك لا هوية", desc: "نركّز على الأفعال المحددة لا على الهوية أو الأصل." },
  { icon: "📄", label: "لا مصدر، لا نشر", desc: "كل مدخل مرتبط بمصادر دولية مصنّفة بمستويات موثوقية." },
  { icon: "✉️", label: "حق الرد", desc: "أي شخص مدرج يحقّله تقديم بيان أو تصحيح مباشر." },
  { icon: "👤", label: "خصوصية الأبرياء", desc: "لا ننشر أسماء أطفال أو أشخاص غير متورّطين." },
  { icon: "⚖️", label: "لا تصفٍّ ذاتي", desc: "لا عنف، لا تهديد، لا تهجير — فقط مساءلة قانونية." },
];

const PRINCIPLES_EN = [
  { icon: "⚖️", label: "Evidence over Allegation", desc: "No claim without a documented, verifiable source." },
  { icon: "🛡️", label: "Conduct, not Identity", desc: "We focus on specific acts, not identity or origin." },
  { icon: "📄", label: "No Source, No Publication", desc: "Every entry is linked to internationally classified sources." },
  { icon: "✉️", label: "Right of Reply", desc: "Anyone listed has the right to submit a statement or correction." },
  { icon: "👤", label: "Privacy of the Innocent", desc: "We do not publish names of children or uninvolved persons." },
  { icon: "⚖️", label: "No Vigilantism", desc: "No violence, no threats, no displacement — only legal accountability." },
];

export function PrinciplesSection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const principles = locale === "ar" ? PRINCIPLES_AR : PRINCIPLES_EN;

  return (
    <section className="principles-section">
      <div className="principles-header">
        <h2 className="principles-title">{t("principlesTitle")}</h2>
        <p className="principles-lead">{t("principlesLead")}</p>
      </div>
      <div className="principles-grid">
        {principles.map((p, i) => (
          <div key={i} className="principle-card">
            <div className="principle-icon">{p.icon}</div>
            <div className="principle-label">{p.label}</div>
            <div className="principle-desc">{p.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
