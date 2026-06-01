"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "./Button";

export function HeroSection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const nav = useTranslations("nav");

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-seal">
          <Image
            src="/logo.jpeg"
            alt="لست شجرة"
            width={120}
            height={120}
            className="hero-seal-img"
            priority
          />
        </div>
        <div className="hero-kicker">
          {locale === "ar" ? "سجلّ موثَّق · مصادر دولية · مساءلة شعبية" : "Documented Record · International Sources · Civic Accountability"}
        </div>
        <h1 className="hero-title">
          {t("title")}
        </h1>
        <p className="hero-subtitle">
          {t("subtitle")}
        </p>
        <p className="hero-lead">
          {t("lead")}
        </p>
        <div className="hero-actions">
          <Link href={`/${locale}/submit`}>
            <Button variant="primary">{nav("submit")}</Button>
          </Link>
          <Link href={`/${locale}/record`}>
            <Button variant="secondary">{nav("record")}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
