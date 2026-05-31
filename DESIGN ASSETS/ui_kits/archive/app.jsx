/* App shell — view routing + language/direction toggle */
const { useState: useStateA, useEffect: useEffectA } = React;

function App() {
  const [lang, setLang] = useStateA("en");
  const [view, setView] = useStateA("home");
  const [entity, setEntity] = useStateA(null);
  const t = STRINGS[lang];

  useEffectA(() => {
    document.documentElement.lang = t.lang;
    document.documentElement.dir = t.dir;
  }, [lang]);

  const toggleLang = () => setLang(l => (l === "en" ? "ar" : "en"));
  const openEntity = (e) => { setEntity(e); setView("entity"); window.scrollTo(0, 0); };

  return (
    <div dir={t.dir}>
      <Header t={t} view={view} setView={(v) => { setView(v); window.scrollTo(0, 0); }} toggleLang={toggleLang} />
      <div className="kit-shell">
        {view === "home" && <ArchiveHome t={t} lang={lang} onOpen={openEntity} />}
        {view === "entity" && entity && (
          <EntityDetail e={entity} t={t} lang={lang}
            onBack={() => { setView("home"); window.scrollTo(0, 0); }}
            onConsole={() => { setView("console"); window.scrollTo(0, 0); }} />
        )}
        {view === "console" && <ReviewerConsole t={t} lang={lang} />}
      </div>
      <footer className="footer">
        <div className="footer-in" dir={t.dir}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="../../assets/logo.jpeg" alt="" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--paper)", padding: 3 }} />
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--on-green)" }}>{t.brandName}</div>
              <div style={{ fontSize: 12, color: "var(--green-200)" }}>{t.footerNote}</div>
            </div>
          </div>
          <div className="creed">
            {t.creed.map(c => <span key={c}>{c}</span>)}
          </div>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
