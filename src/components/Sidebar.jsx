import { useState, useEffect, useRef, memo } from "react";
import { C, SYNE, DM } from "../lib/constants";

// ─── ÍCONES SVG INLINE ────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconSettings = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconLoader = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
const IconFolder = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

function SidebarInner({ user, projects, activeId, onSelect, onNew, onDelete, onLogout, onSettings, generating, thinkSteps, licenseInfo }) {
  const [hoverId, setHoverId] = useState(null);
  const stepsEndRef = useRef();

  useEffect(() => {
    if (stepsEndRef.current) {
      stepsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [thinkSteps]);

  return (
    <div style={{
      width: 220, minWidth: 220, background: C.surface,
      borderRight: `1px solid ${C.border}`, display: "flex",
      flexDirection: "column", height: "100vh", overflow: "hidden",
    }}>
      {/* ─── LOGO ─── */}
      <div style={{ padding: "14px 14px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, background: C.yellow, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(255,208,80,0.3)", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 900, fontFamily: SYNE, color: C.bg }}>Z</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, fontFamily: SYNE, color: C.text, letterSpacing: -0.5 }}>
          Zero<span style={{ color: C.yellow }}>.</span>
        </span>
      </div>

      {/* ─── USER & LICENSE ─── */}
      <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${C.yellow}, ${C.yellowDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.bg, fontFamily: SYNE, flexShrink: 0 }}>
            Z
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: DM }}>Licenca Ativa</div>
            <div style={{ fontSize: 10, color: C.success }}>Claude Sonnet</div>
          </div>
        </div>
        {licenseInfo?.tokens_used != null && (
          <div style={{ marginTop: 4 }}>
            <div style={{ height: 3, background: C.bg, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(licenseInfo.percent_used || 0, 100)}%`, background: (licenseInfo.percent_used || 0) > 85 ? C.error : C.success, borderRadius: 2, transition: "width 0.5s" }} />
            </div>
            <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>
              {((licenseInfo.tokens_used / 1000) | 0)}k / {((licenseInfo.tokens_limit / 1000) | 0)}k tokens
            </div>
          </div>
        )}
      </div>

      {/* ─── NOVO PROJETO ─── */}
      <div style={{ padding: "10px 10px 6px" }}>
        <button onClick={onNew} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,208,80,0.06)", border: "1px solid rgba(255,208,80,0.2)", borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.yellow, cursor: "pointer", fontFamily: DM, display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,208,80,0.12)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,208,80,0.06)"}
        >
          <IconPlus /> Novo Projeto
        </button>
      </div>

      {/* ─── STEPS DE GERAÇÃO (estilo Claude) ─── */}
      {(generating || (thinkSteps && thinkSteps.length > 0)) && (
        <div style={{ margin: "6px 10px", background: "rgba(255,208,80,0.04)", border: "1px solid rgba(255,208,80,0.15)", borderRadius: 10, padding: "10px 12px", flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.yellow, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            {generating && <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.yellow, display: "inline-block", animation: "pulse 1.4s ease-in-out infinite" }} />}
            {generating ? "Gerando..." : "Concluido"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {(thinkSteps || []).map((step, i) => {
              const isLast = i === (thinkSteps?.length - 1);
              const isDone = !generating || !isLast;
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                  {/* Ícone */}
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: isDone ? "rgba(52,211,153,0.15)" : "rgba(255,208,80,0.15)", border: `1px solid ${isDone ? "rgba(52,211,153,0.4)" : "rgba(255,208,80,0.4)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, color: isDone ? C.success : C.yellow }}>
                    {isDone ? <IconCheck /> : <IconLoader />}
                  </div>
                  {/* Texto */}
                  <span style={{ fontSize: 11, color: isDone ? C.textMuted : C.text, lineHeight: 1.4, fontFamily: DM }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
          <div ref={stepsEndRef} />
        </div>
      )}

      {/* ─── PROJETOS ─── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: 1, textTransform: "uppercase", padding: "6px 2px 4px" }}>
          Projetos ({projects.length})
        </div>
        {projects.length === 0 && (
          <div style={{ fontSize: 11, color: C.textDim, padding: "6px 2px", fontStyle: "italic" }}>Nenhum projeto ainda</div>
        )}
        {projects.map(p => (
          <div key={p.id} style={{ position: "relative", marginBottom: 2 }}
            onMouseEnter={() => setHoverId(p.id)}
            onMouseLeave={() => setHoverId(null)}
          >
            <button onClick={() => onSelect(p.id)} style={{ width: "100%", textAlign: "left", padding: "7px 26px 7px 8px", background: activeId === p.id ? "rgba(255,208,80,0.06)" : hoverId === p.id ? C.surface2 : "transparent", border: activeId === p.id ? "1px solid rgba(255,208,80,0.2)" : "1px solid transparent", borderRadius: 7, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ color: activeId === p.id ? C.yellow : C.textDim, flexShrink: 0 }}>
                <IconFolder />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: activeId === p.id ? C.yellow : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: DM }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>
                  {new Date(p.updatedAt || p.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </button>
            {hoverId === p.id && (
              <button onClick={e => { e.stopPropagation(); onDelete(p.id); }} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textDim, cursor: "pointer", padding: "3px 5px", borderRadius: 4, transition: "color 0.2s", display: "flex", alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.color = C.error}
                onMouseLeave={e => e.currentTarget.style.color = C.textDim}
              >
                <IconTrash />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ─── BOTTOM ─── */}
      <div style={{ padding: "8px 10px", borderTop: `1px solid ${C.border}` }}>
        <button onClick={onSettings} style={{ width: "100%", padding: "8px 10px", background: "transparent", border: "1px solid transparent", borderRadius: 7, fontSize: 11, color: C.textMuted, cursor: "pointer", fontFamily: DM, transition: "all 0.2s", textAlign: "left", marginBottom: 2, display: "flex", alignItems: "center", gap: 8 }}
          onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.surface2; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = "transparent"; }}
        >
          <IconSettings /> Configuracoes
        </button>
        <button onClick={onLogout} style={{ width: "100%", padding: "8px 10px", background: "transparent", border: "1px solid transparent", borderRadius: 7, fontSize: 11, color: C.textMuted, cursor: "pointer", fontFamily: DM, transition: "all 0.2s", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}
          onMouseEnter={e => { e.currentTarget.style.color = C.error; e.currentTarget.style.background = "rgba(248,113,113,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = "transparent"; }}
        >
          <IconLogout /> Sair
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
}

export default memo(SidebarInner);
