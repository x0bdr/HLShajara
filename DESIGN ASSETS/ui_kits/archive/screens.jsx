/* Screens: ArchiveHome, EntityDetail, ReviewerConsole */
const { useState: useStateS } = React;

function FilterBar({ t, lang, active, setActive }) {
  const toggle = (group, val) => {
    setActive(prev => {
      const set = new Set(prev[group]);
      set.has(val) ? set.delete(val) : set.add(val);
      return { ...prev, [group]: set };
    });
  };
  const Group = ({ label, items, group }) => (
    <div style={{ marginBottom: 14 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map(it => (
          <span key={it} className={"chip" + (active[group].has(it) ? " on" : "")} onClick={() => toggle(group, it)}>
            {active[group].has(it) ? "✓ " : ""}{it}
          </span>
        ))}
      </div>
    </div>
  );
  return (
    <div className="panel" style={{ padding: "16px 18px" }}>
      <Group label={t.byConduct} items={CONDUCT[lang]} group="conduct" />
      <Group label={t.byRole} items={ROLES[lang]} group="role" />
      <Group label={t.byStrength} items={EV_LABELS[lang].slice(2).reverse()} group="strength" />
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "10px 12px", marginTop: 4,
        background: "var(--brick-100)", border: "1px solid #E4C4BD", borderRadius: "var(--radius)" }}>
        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--brick-500)", color: "#fff",
          display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, flex: "none" }}>✕</span>
        <span style={{ fontSize: 11.5, color: "var(--brick-700)", lineHeight: 1.45 }}>{t.noIdentity}</span>
      </div>
    </div>
  );
}

function ArchiveHome({ t, lang, onOpen }) {
  const [active, setActive] = useStateS({ conduct: new Set(), role: new Set(), strength: new Set() });
  const [q, setQ] = useStateS("");
  return (
    <main className="pad" style={{ paddingTop: 28, paddingBottom: 10 }}>
      <div style={{ marginBottom: 18 }}><LegalNote t={t} /></div>
      <h1 className="ds-h1" style={{ margin: "0 0 10px" }}>{t.homeTitle}</h1>
      <p className="ds-lead" style={{ maxWidth: 760, margin: "0 0 22px" }}>{t.homeLead}</p>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.search}
        style={{ width: "100%", boxSizing: "border-box", fontFamily: "var(--font-sans)", fontSize: 15,
          padding: "12px 16px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)",
          background: "var(--surface)", color: "var(--fg1)", marginBottom: 22 }} />
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>
        <FilterBar t={t} lang={lang} active={active} setActive={setActive} />
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{t.resultsCount(ENTITIES.length)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {ENTITIES.map(e => <EvidenceCard key={e.id} e={e} lang={lang} t={t} onOpen={onOpen} />)}
          </div>
        </div>
      </div>
    </main>
  );
}

function EntityDetail({ e, t, lang, onBack, onConsole }) {
  const a = e.allegations[0];
  const Row = ({ k, v }) => (
    <div style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ width: 130, flex: "none", fontSize: 12.5, color: "var(--fg2)", fontWeight: 600 }}>{k}</span>
      <span style={{ fontSize: 13.5, color: "var(--fg1)" }}>{v}</span>
    </div>
  );
  return (
    <main className="pad" style={{ paddingTop: 22, paddingBottom: 10, maxWidth: 860, margin: "0 auto" }}>
      <button className="btn ghost" style={{ paddingInline: 0, marginBottom: 14 }} onClick={onBack}>
        {lang === "ar" ? "→ " : "← "}{t.back}
      </button>
      <div className="panel" style={{ overflow: "hidden", marginBottom: 18 }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex",
          justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
          <div>
            <h1 className="ds-h2" style={{ margin: "0 0 4px" }}>{e.name[lang]}</h1>
            <div style={{ fontSize: 13.5, color: "var(--fg2)" }}>{e.role[lang]} · {e.type[lang]}</div>
            <div className="ds-mono" style={{ marginTop: 7 }}>{e.id} · v{e.version}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <EvidenceStrength level={e.ev} lang={lang} />
            <StatusBadge status={e.status} lang={lang} />
          </div>
        </div>
        <div style={{ padding: "16px 24px" }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{t.allegations}</div>
          <p className="ds-body" style={{ margin: "0 0 14px" }}>{a.desc[lang]}</p>
          <Row k={t.conduct} v={a.classification[lang]} />
          <Row k={t.period} v={a.period[lang]} />
          <Row k={t.location} v={a.location[lang]} />
          <div className="eyebrow" style={{ margin: "18px 0 10px" }}>{t.sources} · {a.sources.length}</div>
          {a.sources.map((s, i) => <SourceCite key={i} src={s} lang={lang} />)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="panel" style={{ padding: "16px 20px" }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>{t.auditTrail}</div>
          <div className="timeline">
            <div className="tl-item"><div style={{ fontSize: 13, fontWeight: 600 }}>{t.stages[5]}</div>
              <div className="ds-meta">v{e.version} · {e.id}</div></div>
            <div className="tl-item"><div style={{ fontSize: 13, fontWeight: 600 }}>{t.legalGate}</div>
              <div className="ds-meta">phrasing · privacy · reply contact</div></div>
            <div className="tl-item"><div style={{ fontSize: 13, fontWeight: 600 }}>{t.stages[3]}</div>
              <div className="ds-meta">2 reviewers · no self-approval</div></div>
            <div className="tl-item"><div style={{ fontSize: 13, fontWeight: 600 }}>{t.stages[2]}</div>
              <div className="ds-meta">{a.sources.length} sources verified</div></div>
          </div>
        </div>
        <div className="panel" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="eyebrow">{t.reply}</div>
          <p className="ds-body-sm" style={{ margin: 0 }}>
            {e.reply === "filed" ? t.replyFiled : t.replyNone}
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
            <button className="btn secondary">{t.addReply}</button>
            <button className="btn primary" onClick={onConsole}>{t.openConsole}</button>
          </div>
        </div>
      </div>
    </main>
  );
}

function ReviewerConsole({ t, lang }) {
  const [sel, setSel] = useStateS(ENTITIES[2]);
  const Stage = ({ i, state }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5,
      color: state === "todo" ? "var(--fg3)" : "var(--fg2)" }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", display: "grid", placeItems: "center",
        fontSize: 10, fontWeight: 700,
        background: state === "done" ? "var(--green-700)" : state === "now" ? "var(--brass-500)" : "var(--stone-200)",
        color: state === "todo" ? "var(--fg2)" : "#fff",
        boxShadow: state === "now" ? "0 0 0 3px var(--brass-50)" : "none" }}>
        {state === "done" ? "✓" : i + 1}</span>
      {t.stages[i]}
    </div>
  );
  return (
    <main className="pad" style={{ paddingTop: 24, paddingBottom: 10 }}>
      <h1 className="ds-h2" style={{ margin: "0 0 4px" }}>{t.consoleTitle}</h1>
      <p className="ds-body-sm" style={{ margin: "0 0 18px", color: "var(--fg2)" }}>{t.consoleSub}</p>
      <div className="panel" style={{ padding: "14px 18px", marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>{t.pipeline}</div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {[0, 1, 2].map(i => <Stage key={i} i={i} state="done" />)}
          <Stage i={3} state="now" />
          <Stage i={4} state="todo" /><Stage i={5} state="todo" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 18, alignItems: "start" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{t.queue}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ENTITIES.map(e => (
              <div key={e.id} className={"queue-item" + (sel.id === e.id ? " sel" : "")} onClick={() => setSel(e)}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>{e.id}</div>
                  <div className="ds-mono" style={{ marginTop: 4, whiteSpace: "nowrap" }}>{e.allegations[0].sources.length} src · {e.allegations[0].sources.map(s => s.tier).join("/")}</div>
                </div>
                <EvidenceStrength level={e.ev} lang={lang} />
              </div>
            ))}
          </div>
        </div>
        <div className="panel" style={{ padding: "18px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
            <div style={{ minWidth: 0 }}>
              <h2 className="ds-h3" style={{ margin: "0 0 6px", fontSize: 22, lineHeight: 1.3 }}>{sel.name[lang]}</h2>
              <div className="ds-mono" style={{ whiteSpace: "nowrap" }}>{sel.id}</div>
            </div>
            <div style={{ flex: "none" }}><EvidenceStrength level={sel.ev} lang={lang} /></div>
          </div>
          <p className="ds-body-sm" style={{ margin: "14px 0" }}>{sel.allegations[0].desc[lang]}</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <span className="rev ok">✓ {t.reviewer1}</span>
            <span className="rev wait">◴ {t.reviewer2} · {t.pending}</span>
            <span style={{ fontSize: 11, color: "var(--fg2)", padding: "4px 9px", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius)" }}>{t.legalGate}</span>
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <button className="btn primary">{t.approve}</button>
            <button className="btn secondary">{t.escalate}</button>
            <button className="btn" style={{ background: "transparent", color: "var(--brick-500)", border: "1px solid var(--brick-100)" }}>{t.reject}</button>
          </div>
          <div className="eyebrow" style={{ margin: "20px 0 10px" }}>{t.rejectionRules}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {REJECTION_RULES[lang].map(([code, desc]) => (
              <span key={code} title={desc} style={{ fontFamily: "var(--font-mono)", fontSize: 10.5,
                color: "var(--brick-700)", background: "var(--brick-100)", border: "1px solid #E4C4BD",
                padding: "3px 8px", borderRadius: "var(--radius-sm)" }}>{code}</span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

Object.assign(window, { ArchiveHome, EntityDetail, ReviewerConsole });
