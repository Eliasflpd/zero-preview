import { C, SYNE, DM } from "../lib/constants";

export default function Sidebar({ user, projects, activeId, onSelect, onNew, onDelete, onLogout, onSettings }) {
  return (
    <div style={{
      width: 220, minWidth: 220, background: C.surface,
      borderRight: `1px solid ${C.border}`, display: "flex",
      flexDirection: "column", height: "100vh", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, background: C.yellow, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 16px rgba(255,208,80,0.3)`,
        }}>
          <span style={{ fontSize: 15, fontWeight: 900, fontFamily: SYNE, color: C.bg }}>Z</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, fontFamily: SYNE, color: C.text, letterSpacing: -0.5 }}>
          Zero<span style={{ color: C.yellow }}>.</span>
        </span>
      </div>

      {/* User */}
      <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.yellow}, ${C.yellowDim})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: C.bg, fontFamily: SYNE, flexShrink: 0,
        }}>
          {String(user).charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user}
          </div>
          <div style={{ fontSize: 10, color: C.textMuted }}>Free Plan</div>
        </div>
      </div>

      {/* New project */}
      <div style={{ padding: "10px 10px 6px" }}>
        <button onClick={onNew} style={{
          width: "100%", padding: "9px 12px",
          background: "rgba(255,208,80,0.06)", border: `1px solid rgba(255,208,80,0.2)`,
          borderRadius: 9, fontSize: 12, fontWeight: 600, color: C.yellow,
          cursor: "pointer", fontFamily: DM, display: "flex", alignItems: "center",
          gap: 7, transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,208,80,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,208,80,0.06)"; }}
        >
          <span style={{ fontSize: 15 }}>+</span> Novo Projeto
        </button>
      </div>

      {/* Projects */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: 1, textTransform: "uppercase", padding: "6px 2px 4px" }}>
          Projetos ({projects.length})
        </div>
        {projects.length === 0 && (
          <div style={{ fontSize: 11, color: C.textDim, padding: "6px 2px", fontStyle: "italic" }}>Nenhum projeto ainda</div>
        )}
        {projects.map(p => (
          <div key={p.id} style={{ position: "relative", marginBottom: 2 }}>
            <button onClick={() => onSelect(p.id)} style={{
              width: "100%", textAlign: "left", padding: "8px 28px 8px 8px",
              background: activeId === p.id ? "rgba(255,208,80,0.06)" : "transparent",
              border: activeId === p.id ? `1px solid rgba(255,208,80,0.2)` : "1px solid transparent",
              borderRadius: 7, cursor: "pointer", transition: "all 0.15s",
            }}
              onMouseEnter={e => { if (activeId !== p.id) e.currentTarget.style.background = C.surface2; }}
              onMouseLeave={e => { if (activeId !== p.id) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ fontSize: 12, fontWeight: 500, color: activeId === p.id ? C.yellow : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: DM }}>
                {p.name}
              </div>
              <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>
                {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
              </div>
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(p.id); }}
              style={{
                position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: C.textDim, cursor: "pointer",
                fontSize: 14, padding: "2px 5px", borderRadius: 4, transition: "color 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.error}
              onMouseLeave={e => e.currentTarget.style.color = C.textDim}
            >×</button>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div style={{ padding: "8px 10px", borderTop: `1px solid ${C.border}` }}>
        {[
          { label: "⚙ Configurações", fn: onSettings },
          { label: "↩ Sair", fn: onLogout, danger: true },
        ].map(({ label, fn, danger }) => (
          <button key={label} onClick={fn} style={{
            width: "100%", padding: "8px 10px", background: "transparent",
            border: "1px solid transparent", borderRadius: 7, fontSize: 11,
            color: C.textMuted, cursor: "pointer", fontFamily: DM,
            transition: "color 0.2s", textAlign: "left", marginBottom: 2,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = danger ? C.error : C.text; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
