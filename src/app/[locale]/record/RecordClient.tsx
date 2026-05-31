"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { EvidenceCard, LegalNote } from "@/components";
import type { Entity } from "@/lib/types";

export default function RecordPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [evidence, setEvidence] = useState("");
  const t = useTranslations("record");
  const legal = useTranslations("legal");
  const locale = useLocale();

  // Debounced server-side search with filters
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.trim()) params.set("q", filter.trim());
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (evidence) params.set("evidence", evidence);

    const url = `/api/entity${params.toString() ? "?" + params.toString() : ""}`;

    const timeout = setTimeout(() => {
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) setEntities(data.entities);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [filter, status, type, evidence]);

  const selectStyle = {
    padding: "8px 12px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--fg1)",
    fontFamily: "var(--font-sans)",
    fontSize: 14,
    flex: 1,
  };

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        <div className="ds-h1" style={{ marginBottom: 8 }}>
          {t("title")}
        </div>
        <p className="ds-lead">{t("lead")}</p>
      </header>

      <div style={{ marginBottom: 24 }}>
        <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--fg1)",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
          <option value="">{t("filterStatus")}: {t("all")}</option>
          <option value="alleged">{t("status_alleged")}</option>
          <option value="confirmed">{t("status_confirmed")}</option>
          <option value="disputed">{t("status_disputed")}</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
          <option value="">{t("filterType")}: {t("all")}</option>
          <option value="individual">{t("type_individual")}</option>
          <option value="organization">{t("type_organization")}</option>
          <option value="military_unit">{t("type_military_unit")}</option>
          <option value="security_branch">{t("type_security_branch")}</option>
          <option value="official_body">{t("type_official_body")}</option>
        </select>
        <select value={evidence} onChange={(e) => setEvidence(e.target.value)} style={selectStyle}>
          <option value="">{t("filterEvidence")}: {t("all")}</option>
          <option value="0">0 — {locale === "ar" ? "قيد المراجعة" : "Under review"}</option>
          <option value="1">1 — {locale === "ar" ? "موثّق" : "Documented"}</option>
          <option value="2">2 — {locale === "ar" ? "مؤكد" : "Corroborated"}</option>
          <option value="3">3 — {locale === "ar" ? "محكمة" : "Court-confirmed"}</option>
        </select>
      </div>

      {loading ? (
        <p className="ds-body" style={{ textAlign: "center" }}>
          {t("loading")}
        </p>
      ) : entities.length === 0 ? (
        <p
          className="ds-body"
          style={{ textAlign: "center", color: "var(--fg2)" }}
        >
          {t("empty")}
        </p>
      ) : (
        <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {entities.map((e) => (
            <EvidenceCard
              key={e.id}
              entity={e}
              lang={locale as "ar" | "en"}
            />
          ))}
        </section>
      )}
    </main>
  );
}
