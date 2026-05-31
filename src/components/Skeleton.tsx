"use client";

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 20, width: "60%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: "40%" }} />
        </div>
        <div className="skeleton" style={{ height: 24, width: 80, borderRadius: "var(--radius-pill)" }} />
      </div>
      <div className="skeleton" style={{ height: 16, width: "90%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <div className="skeleton" style={{ height: 22, width: 60, borderRadius: "var(--radius-sm)" }} />
        <div className="skeleton" style={{ height: 22, width: 100, borderRadius: "var(--radius-sm)" }} />
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="stats-bar">
      {[1, 2, 3].map((i) => (
        <div key={i} className="stat-item">
          <div className="skeleton" style={{ height: 32, width: 60, margin: "0 auto 6px" }} />
          <div className="skeleton" style={{ height: 14, width: 80, margin: "0 auto" }} />
        </div>
      ))}
    </div>
  );
}
