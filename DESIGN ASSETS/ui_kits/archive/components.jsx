/* Shared primitives for the Archive UI kit */
const { useState } = React;

function Logo({ size = 42 }) {
  return <img src="../../assets/logo.jpeg" alt="Lastu Shajara seal"
    style={{ width: size, height: size, borderRadius: "50%" }} />;
}

function Header({ t, view, setView, toggleLang }) {
  return (
    <header className="hdr">
      <div className="hdr-in">
        <div className="brand" onClick={() => setView("home")}>
          <Logo />
          <div>
            <div className="nm">{t.brandName}</div>
            <div className="sub">{t.brandSub}</div>
          </div>
        </div>
        <div className="hdr-spacer"></div>
        <nav className="nav">
          <button className={view === "home" || view === "entity" ? "active" : ""} onClick={() => setView("home")}>{t.navArchive}</button>
          <button className={view === "console" ? "active" : ""} onClick={() => setView("console")}>{t.navConsole}</button>
        </nav>
        <button className="lang" onClick={toggleLang}>{t.langBtn}</button>
      </div>
    </header>
  );
}

function LegalNote({ t }) {
  return (
    <div className="legal">
      <div className="t">{t.legalT}</div>
      <p>{t.legal}</p>
    </div>
  );
}

function EvidenceStrength({ level, lang }) {
  return (
    <span className={`ev e${level}`}>
      <span className="dot"></span>{EV_LABELS[lang][level]}
    </span>
  );
}

function StatusBadge({ status, lang }) {
  return (
    <span className="status" style={{ color: `var(${STATUS_VAR[status]})` }}>
      <span className="d"></span>{STATUS_LABELS[lang][status]}
    </span>
  );
}

function SourceCite({ src, lang }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 8 }}>
      <span className="mark">Tier {src.tier}</span>
      <div style={{ fontSize: 13, color: "var(--fg1)", lineHeight: 1.5 }}>
        {src.title[lang]}{src.ref ? <span> — <a href="#" style={{ color: "var(--brand)" }}>{src.ref}</a></span> : null}
        <div style={{ fontSize: 11, color: "var(--fg3)", marginTop: 2 }}>{src.pub[lang]} · {src.date}</div>
      </div>
    </div>
  );
}

function EvidenceCard({ e, lang, t, onOpen }) {
  const a = e.allegations[0];
  const nSrc = e.allegations.reduce((n, x) => n + x.sources.length, 0);
  return (
    <article className="card" onClick={() => onOpen(e)}>
      <div className="top">
        <div>
          <div className="name">{e.name[lang]}</div>
          <div className="role">{e.role[lang]} · {e.type[lang]}</div>
          <div className="id">{e.id}</div>
        </div>
        <EvidenceStrength level={e.ev} lang={lang} />
      </div>
      <div className="body">
        <div style={{ marginBottom: 9 }}><StatusBadge status={e.status} lang={lang} /></div>
        <div className="alle">{a.desc[lang]}</div>
        <div className="srcline">
          <span className="mark">{t.sources} · {nSrc}</span>
          <span style={{ fontSize: 11.5, color: "var(--fg2)" }}>{a.sources.map(s => "Tier " + s.tier).join(" · ")}</span>
        </div>
      </div>
      <div className="foot">
        <span className="reply">{t.reply}: {e.reply === "filed" ? t.replyFiled : t.replyNone}</span>
        <span className="ver">v{e.version} · {t.audited}</span>
      </div>
    </article>
  );
}

Object.assign(window, { Logo, Header, LegalNote, EvidenceStrength, StatusBadge, SourceCite, EvidenceCard });
