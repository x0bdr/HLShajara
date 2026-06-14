"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { EvidenceCard, LegalNote, SkeletonCard } from "@/components";
import { pushDataLayer, GTM_EVENTS } from "@/lib/gtm";
import type { Entity } from "@/lib/types";

export default function RecordPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [evidence, setEvidence] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const t = useTranslations("record");
  const legal = useTranslations("legal");
  const locale = useLocale();
  const router = useRouter();

  function trackFilter(name: string, value: string) {
    if (value) {
      pushDataLayer(GTM_EVENTS.RECORD_FILTER, { filter: name, value, locale });
    }
  }

  // Debounced server-side search with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.trim()) params.set("q", filter.trim());
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (evidence) params.set("evidence", evidence);
    params.set("page", String(page));
    params.set("limit", "20");

    const url = `/api/entity?${params.toString()}`;

    const timeout = setTimeout(() => {
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) {
            setEntities(data.entities);
            setHasMore(data.hasMore);
          }
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [filter, status, type, evidence, page]);

  return (
    <>
      <div className="page-header-center">
        <div className="ds-h1">{t("title")}</div>
        <p className="ds-lead">{t("lead")}</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="archive-search"
        />
      </div>

      <div className="filter-bar">
        <select value={status} onChange={(e) => { trackFilter("status", e.target.value); setStatus(e.target.value); }} className="ds-select">
          <option value="">{t("filterStatus")}: {t("all")}</option>
          <option value="alleged">{t("status_alleged")}</option>
          <option value="investigating">{t("status_investigating")}</option>
          <option value="indicted">{t("status_indicted")}</option>
          <option value="sanctioned">{t("status_sanctioned")}</option>
          <option value="convicted">{t("status_convicted")}</option>
          <option value="deceased">{t("status_deceased")}</option>
        </select>
        <select value={type} onChange={(e) => { trackFilter("type", e.target.value); setType(e.target.value); }} className="ds-select">
          <option value="">{t("filterType")}: {t("all")}</option>
          <option value="individual">{t("type_individual")}</option>
          <option value="organization">{t("type_organization")}</option>
          <option value="military_unit">{t("type_military_unit")}</option>
          <option value="security_branch">{t("type_security_branch")}</option>
          <option value="official_body">{t("type_official_body")}</option>
        </select>
        <select value={evidence} onChange={(e) => { trackFilter("evidence", e.target.value); setEvidence(e.target.value); }} className="ds-select">
          <option value="">{t("filterEvidence")}: {t("all")}</option>
          <option value="0">0 — {locale === "ar" ? "قيد المراجعة" : "Under review"}</option>
          <option value="1">1 — {locale === "ar" ? "موثّق" : "Documented"}</option>
          <option value="2">2 — {locale === "ar" ? "مؤكد" : "Corroborated"}</option>
          <option value="3">3 — {locale === "ar" ? "محكمة" : "Court-confirmed"}</option>
        </select>
      </div>

      {loading ? (
        <section className="record-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </section>
      ) : entities.length === 0 ? (
        <div className="card empty-state-lg">
          <p className="ds-body text-fg2">{t("empty")}</p>
        </div>
      ) : (
        <>
          <section className="record-list">
            {entities.map((e) => (
              <EvidenceCard
                key={e.id}
                entity={e}
                lang={locale as "ar" | "en"}
                onOpen={() => router.push(`/${locale}/entity/${e.id}`)}
              />
            ))}
          </section>
          <div className="pagination-bar">
            <button
              className="btn secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {locale === "ar" ? "السابق" : "Previous"}
            </button>
            <span className="ds-body-sm" style={{ color: "var(--fg2)" }}>
              {locale === "ar" ? `الصفحة ${page}` : `Page ${page}`}
            </span>
            <button
              className="btn secondary"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              {locale === "ar" ? "التالي" : "Next"}
            </button>
          </div>
        </>
      )}
    </>
  );
}
