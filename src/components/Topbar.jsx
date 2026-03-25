import { C, SYNE } from "../config/theme";

export default function Topbar({ projectName, hasPreview, sidebarOpen, onToggleSidebar }) {
  return (
    <div style={{ height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onToggleSidebar} style={{ background: "none", border: "none", color: C.text, fontSize: 18, cursor: "pointer", marginRight: 8, padding: 0 }}>
          {sidebarOpen ? "\u2715" : "\u2630"}
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: SYNE }}>
          {projectName || "Novo Projeto"}
        </span>
        {hasPreview && (
          <span style={{ fontSize: 10, color: C.success, background: "rgba(52,211,153,0.1)", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.2)" }}>
            React + Vite
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, color: C.info, background: "rgba(96,165,250,0.1)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(96,165,250,0.2)", fontWeight: 600 }}>
          Claude Sonnet
        </span>
      </div>
    </div>
  );
}
