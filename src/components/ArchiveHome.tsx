"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { Entity } from "@/lib/types";
import { EvidenceCard } from "./EvidenceCard";
import { STATUS_LABELS, TYPE_LABELS, EVIDENCE_LABELS } from "@/lib/labels";
import { Button } from "./Button";

interface ArchiveHomeProps {
  entities: Entity[];
  showHeader?: boolean;
}

export function ArchiveHome({ entities, showHeader = true }: ArchiveHomeProps) {
  const locale = useLocale() as "ar" | "en";
  const router = useRouter();
  const t = useTranslations("home");
  const record = useTranslations("record");

  const [q, setQ] = useState("");
  const [activeStatus, setActiveStatus] = useState<Set<string>>(new Set());
  const [activeType, setActiveType] = useState<Set<string>>(new Set());
  const [activeEvidence, setActiveEvidence] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return entities.filter((e) => {
      if (q) {
        const text = `${e.name} ${e.role}`.toLowerCase();
        if (!text.includes(q.toLowerCase())) return false;
      }
      if (activeStatus.size > 0 && !activeStatus.has(e.status)) return false;
      if (activeType.size > 0 && !activeType.has(e.type)) return false;
      if (activeEvidence.size > 0 && !activeEvidence.has(String(e.evidence))) return false;
      return true;
    });
  }, [entities, q, activeStatus, activeType, activeEvidence]);

  const statusOptions = Object.keys(STATUS_LABELS[locale]) as Array<keyof typeof STATUS_LABELS["ar"]>;
  const typeOptions = Object.keys(TYPE_LABELS[locale]) as Array<keyof typeof TYPE_LABELS["ar"]>;
  const evidenceOptions = [0, 1, 2, 3, 4] as const;

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) => {
    set((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  };

  return (
    <section className="archive-section">
      {showHeader && (
        <>
          <h2 className="archive-title">{t("recordTitle")}</h2>
          <p className="archive-lead">{t("lead")}</p>
        </>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={record("searchPlaceholder")}
        className="archive-search"
      />

      <Button
        variant="secondary"
        className="filter-toggle"
        onClick={() => setShowFilters((s) => !s)}
      >
        {locale === "ar" ? "الفلاتر" : "Filters"}
        {((activeStatus.size + activeType.size + activeEvidence.size) > 0) && (
          <span className="filter-badge">
            {activeStatus.size + activeType.size + activeEvidence.size}
          </span>
        )}
      </Button>

      <div className="archive-layout">
        {/* Filter sidebar */}
        <aside className={`archive-filters${showFilters ? " open" : ""}`}>
          <FilterGroup
            label={record("filterStatus")}
            items={statusOptions.map((s) => ({
              key: s,
              label: STATUS_LABELS[locale][s],
              active: activeStatus.has(s),
              onToggle: () => toggle(setActiveStatus, s),
            }))}
          />
          <FilterGroup
            label={record("filterType")}
            items={typeOptions.map((s) => ({
              key: s,
              label: TYPE_LABELS[locale][s],
              active: activeType.has(s),
              onToggle: () => toggle(setActiveType, s),
            }))}
          />
          <FilterGroup
            label={record("filterEvidence")}
            items={evidenceOptions.map((s) => ({
              key: String(s),
              label: EVIDENCE_LABELS[locale][s],
              active: activeEvidence.has(String(s)),
              onToggle: () => toggle(setActiveEvidence, String(s)),
            }))}
          />
          <div className="filter-notice">
            <span className="filter-notice-mark">✕</span>
            <span>
              {locale === "ar"
                ? "الفلترة حسب الطائفة أو الدين أو العرق أو العائلة غير متاحة بالتصميم."
                : "Filtering by sect, religion, ethnicity, or family is unavailable by design."}
            </span>
          </div>
        </aside>

        {/* Results */}
        <div className="archive-results">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="archive-results-count">
          {filtered.length} {locale === "ar" ? "سجلّات" : "entries"}
        </div>
        {(activeStatus.size + activeType.size + activeEvidence.size + (q ? 1 : 0)) > 0 && (
          <button
            className="btn ghost btn-sm"
            onClick={() => {
              setActiveStatus(new Set());
              setActiveType(new Set());
              setActiveEvidence(new Set());
              setQ("");
            }}
          >
            {locale === "ar" ? "مسح الفلاتر" : "Clear filters"}
          </button>
        )}
      </div>
      <div className="archive-grid">
        {filtered.length === 0 ? (
          <div className="card" style={{ gridColumn: "1 / -1", padding: 48, textAlign: "center" }}>
            <p className="ds-body" style={{ color: "var(--fg2)", marginBottom: 12 }}>
              {locale === "ar" ? "لا توجد نتائج مطابقة." : "No matching results."}
            </p>
            <button
              className="btn secondary btn-sm"
              onClick={() => {
                setActiveStatus(new Set());
                setActiveType(new Set());
                setActiveEvidence(new Set());
                setQ("");
              }}
            >
              {locale === "ar" ? "مسح الفلاتر" : "Clear filters"}
            </button>
          </div>
        ) : (
          filtered.map((e) => (
            <EvidenceCard
              key={e.id}
              entity={e}
              lang={locale}
              onOpen={() => router.push(`/${locale}/entity/${e.id}`)}
            />
          ))
        )}
      </div>
        </div>
      </div>
    </section>
  );
}

function FilterGroup({
  label,
  items,
}: {
  label: string;
  items: { key: string; label: string; active: boolean; onToggle: () => void }[];
}) {
  return (
    <div className="filter-group">
      <div className="filter-group-label">{label}</div>
      <div className="filter-chips">
        {items.map((it) => (
          <button
            key={it.key}
            className={`chip${it.active ? " on" : ""}`}
            onClick={it.onToggle}
          >
            {it.active ? "✓ " : ""}{it.label}
          </button>
        ))}
      </div>
    </div>
  );
}
