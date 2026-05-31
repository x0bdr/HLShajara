"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { EvidenceCard, LegalNote } from "@/components";
import type { Entity } from "@/lib/types";

export default function RecordPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const t = useTranslations("record");
  const legal = useTranslations("legal");
  const locale = useLocale();

  useEffect(() => {
    fetch("/api/entity")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setEntities(data.entities);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = entities.filter((e) =>
    e.name.toLowerCase().includes(filter.toLowerCase())
  );

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

      <div style={{ marginBottom: 24 }}>
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

      {loading ? (
        <p className="ds-body" style={{ textAlign: "center" }}>
          {t("loading")}
        </p>
      ) : filtered.length === 0 ? (
        <p
          className="ds-body"
          style={{ textAlign: "center", color: "var(--fg2)" }}
        >
          {t("empty")}
        </p>
      ) : (
        <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {filtered.map((e) => (
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
