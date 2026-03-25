import { C, SYNE, DM } from "../config/theme";

export default function Topbar({ projectName, hasPreview, sidebarOpen, onToggleSidebar, syncing }) {
  return (
    <div style={{ height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onToggleSidebar} style={{ background: "none", border: "none", color: C.text, cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "background 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = C.surface2}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {sidebarOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: SYNE }}>
          {projectName || "Novo Projeto"}
        </span>
        {syncing && (
          <span style={{ fontSize: 9, color: C.info, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.info, animation: "pulse 1s ease-in-out infinite" }} />
            Sincronizando...
          </span>
        )}
        {hasPreview && (
          <span style={{ fontSize: 10, color: C.success, background: "rgba(52,211,153,0.1)", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.2)" }}>
            React + Vite
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {hasPreview && (
          <>
            <span style={{ fontSize: 10, color: C.success, background: "rgba(52,211,153,0.1)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.2)", fontWeight: 600, fontFamily: DM }}>
              React + Vite
            </span>
            <span style={{ color: C.textDim, fontSize: 10, lineHeight: 1 }}>&middot;</span>
          </>
        )}
        <span style={{ fontSize: 10, color: C.info, background: "rgba(96,165,250,0.1)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(96,165,250,0.2)", fontWeight: 600, fontFamily: DM }}>
          Claude Sonnet
        </span>
      </div>
    </div>
  );
}
