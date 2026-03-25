import { C, SYNE, DM } from "../config/theme";

export default function Topbar({ projectName, hasPreview, sidebarOpen, onToggleSidebar, syncing, canUndo, canRedo, onUndo, onRedo, versionInfo, agenticMode, onToggleAgentic }) {
  const undoRedoBtn = (label, icon, enabled, onClick) => (
    <button onClick={onClick} disabled={!enabled} style={{
      background: "none", border: `1px solid ${enabled ? C.border : "transparent"}`,
      borderRadius: 6, padding: "3px 6px", cursor: enabled ? "pointer" : "default",
      color: enabled ? C.text : C.textDim, fontSize: 14, display: "flex", alignItems: "center",
      opacity: enabled ? 1 : 0.3, transition: "all 0.15s",
    }} title={label}>
      {icon}
    </button>
  );

  return (
    <div style={{ height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
            Sync
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Undo / Redo */}
        {hasPreview && (
          <div style={{ display: "flex", alignItems: "center", gap: 2, marginRight: 4 }}>
            {undoRedoBtn("Desfazer (Ctrl+Z)", "\u2190", canUndo, onUndo)}
            {undoRedoBtn("Refazer (Ctrl+Y)", "\u2192", canRedo, onRedo)}
            {versionInfo && (
              <span style={{ fontSize: 9, color: C.textDim, marginLeft: 4, fontFamily: DM }}>{versionInfo}</span>
            )}
          </div>
        )}

        {/* Agentic Mode Toggle */}
        <button onClick={onToggleAgentic} style={{
          padding: "3px 10px", borderRadius: 8, fontSize: 9, fontWeight: 700,
          fontFamily: DM, cursor: "pointer", transition: "all 0.15s",
          background: agenticMode ? "rgba(255,208,80,0.15)" : "transparent",
          border: `1px solid ${agenticMode ? "rgba(255,208,80,0.4)" : C.border}`,
          color: agenticMode ? C.yellow : C.textDim,
        }}>
          {agenticMode ? "Modo Agente ON" : "Modo Agente"}
        </button>

        {hasPreview && (
          <span style={{ fontSize: 9, color: C.success, background: "rgba(52,211,153,0.08)", padding: "2px 8px", borderRadius: 12, border: "1px solid rgba(52,211,153,0.2)", fontFamily: DM }}>
            TS + Tailwind
          </span>
        )}
        <span style={{ fontSize: 9, color: C.info, background: "rgba(96,165,250,0.08)", padding: "2px 8px", borderRadius: 12, border: "1px solid rgba(96,165,250,0.2)", fontFamily: DM }}>
          Multi-AI
        </span>
      </div>
    </div>
  );
}
