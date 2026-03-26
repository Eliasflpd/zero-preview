import { C, SYNE, DM, R, EASE } from "../config/theme";
import KnowledgeBadge from "./KnowledgeBadge";

const Badge = ({ children, color, bg, border }) => (
  <span style={{
    fontSize: 9, padding: "2px 8px", borderRadius: R.full,
    background: bg, border: `1px solid ${border}`,
    color, fontFamily: DM, fontWeight: 600, whiteSpace: "nowrap",
    display: "inline-flex", alignItems: "center", gap: 4,
  }}>
    {children}
  </span>
);

const ToolBtn = ({ children, onClick, active, color, activeBg, activeBorder, disabled, title }) => (
  <button onClick={onClick} disabled={disabled} title={title} style={{
    padding: "4px 10px", borderRadius: R.sm, fontSize: 10, fontWeight: 600,
    fontFamily: DM, cursor: disabled ? "default" : "pointer",
    transition: `all 0.15s ${EASE.out}`,
    background: active ? activeBg || C.yellowGlow : "transparent",
    border: `1px solid ${active ? activeBorder || C.borderFocus : C.border}`,
    color: active ? color || C.yellow : C.textDim,
    opacity: disabled ? 0.3 : 1,
    display: "flex", alignItems: "center", gap: 4,
  }}>
    {children}
  </button>
);

export default function Topbar({ projectName, knowledge, hasPreview, sidebarOpen, onToggleSidebar, syncing, canUndo, canRedo, onUndo, onRedo, versionInfo, agenticMode, onToggleAgentic, onAgentMode, onImportGitHub }) {
  return (
    <div style={{
      height: 48, background: C.surface,
      borderBottom: `1px solid ${C.border}`,
      borderLeft: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 14px", flexShrink: 0,
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onToggleSidebar} style={{
          background: "none", border: "none", color: C.textMuted,
          cursor: "pointer", padding: 5, display: "flex", alignItems: "center",
          justifyContent: "center", borderRadius: R.xs,
          transition: `all 0.15s ${EASE.out}`,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = C.surface2; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {sidebarOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>
            }
          </svg>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: C.text, fontFamily: SYNE,
            letterSpacing: -0.3, maxWidth: 200, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {projectName || "Novo Projeto"}
          </span>

          {syncing && (
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: C.info,
              display: "inline-block", animation: "pulse 1s ease-in-out infinite",
            }} />
          )}
          {knowledge && <KnowledgeBadge knowledge={knowledge} />}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {/* Undo / Redo */}
        {hasPreview && (
          <div style={{ display: "flex", alignItems: "center", gap: 2, marginRight: 6 }}>
            <button onClick={onUndo} disabled={!canUndo} title="Desfazer" style={{
              background: "none", border: `1px solid ${canUndo ? C.border : "transparent"}`,
              borderRadius: R.xs, padding: "3px 7px", cursor: canUndo ? "pointer" : "default",
              color: canUndo ? C.textSub : C.textDim, fontSize: 13, display: "flex",
              opacity: canUndo ? 1 : 0.3, transition: `all 0.15s ${EASE.out}`,
            }}>{"\u2190"}</button>
            <button onClick={onRedo} disabled={!canRedo} title="Refazer" style={{
              background: "none", border: `1px solid ${canRedo ? C.border : "transparent"}`,
              borderRadius: R.xs, padding: "3px 7px", cursor: canRedo ? "pointer" : "default",
              color: canRedo ? C.textSub : C.textDim, fontSize: 13, display: "flex",
              opacity: canRedo ? 1 : 0.3, transition: `all 0.15s ${EASE.out}`,
            }}>{"\u2192"}</button>
            {versionInfo && (
              <span style={{ fontSize: 9, color: C.textDim, marginLeft: 4, fontFamily: DM }}>{versionInfo}</span>
            )}
          </div>
        )}

        <ToolBtn onClick={onImportGitHub} title="Importar do GitHub">Importar</ToolBtn>

        <ToolBtn
          onClick={onToggleAgentic}
          active={agenticMode}
          color={C.yellow}
          activeBg={C.yellowGlow}
          activeBorder={C.borderFocus}
        >
          {agenticMode ? "Consultor ON" : "Consultor"}
        </ToolBtn>

        {hasPreview && (
          <ToolBtn
            onClick={onAgentMode}
            active={false}
            color={C.purple}
            activeBg={C.purpleDim}
            activeBorder="rgba(167,139,250,0.3)"
            title="Claude Agent — edita arquivos autonomamente"
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.purple }} />
            Agent
          </ToolBtn>
        )}

        {hasPreview && <Badge color={C.success} bg={C.successDim} border="rgba(52,211,153,0.15)">TS + Tailwind</Badge>}
        <Badge color={C.info} bg={C.infoDim} border="rgba(96,165,250,0.15)">Multi-AI</Badge>
      </div>
    </div>
  );
}
