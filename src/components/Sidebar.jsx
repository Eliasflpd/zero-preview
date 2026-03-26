import { useState, useEffect, useRef, memo } from "react";
import { C, SYNE, DM, SHADOW, R, EASE } from "../config/theme";

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ children, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconPlus = () => <Icon><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>;
const IconSettings = () => <Icon><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>;
const IconLogout = () => <Icon><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Icon>;
const IconTrash = () => <Icon size={12}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></Icon>;
const IconCheck = () => <Icon size={10}><polyline points="20 6 9 17 4 12"/></Icon>;
const IconLoader = () => <span style={{ width: 10, height: 10, border: "2px solid rgba(255,208,80,0.3)", borderTopColor: C.yellow, borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />;
const IconFolder = () => <Icon size={13}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></Icon>;

function SidebarInner({ user, projects, activeId, onSelect, onNew, onDelete, onLogout, onSettings, generating, thinkSteps, licenseInfo }) {
  const [hoverId, setHoverId] = useState(null);
  const stepsEndRef = useRef();

  useEffect(() => {
    if (stepsEndRef.current) stepsEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [thinkSteps]);

  const tokenPercent = licenseInfo?.percent_used || 0;

  return (
    <div style={{
      width: 240, minWidth: 240, background: C.surface,
      borderRight: `1px solid ${C.border}`, display: "flex",
      flexDirection: "column", height: "100vh", overflow: "hidden",
      transition: `all 0.3s ${EASE.out}`,
    }}>
      {/* ─── LOGO ─── */}
      <div style={{
        padding: "16px 16px 14px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32,
          background: `linear-gradient(135deg, ${C.yellow}, #FFE088)`,
          borderRadius: R.sm, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 20px rgba(255,208,80,0.2)`, flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 900, fontFamily: SYNE, color: C.bg }}>Z</span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, fontFamily: SYNE, color: C.text, letterSpacing: -0.5, lineHeight: 1.1 }}>
            Zero<span style={{ color: C.yellow }}>.</span>
          </div>
          <div style={{ fontSize: 8, color: C.yellowDim, fontWeight: 700, letterSpacing: 1.5, opacity: 0.6 }}>v3.0</div>
        </div>
      </div>

      {/* ─── LICENSE STATUS ─── */}
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: C.success, boxShadow: `0 0 8px ${C.success}`,
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.textSub }}>Licenca Ativa</span>
          <span style={{
            fontSize: 9, padding: "1px 7px", borderRadius: R.full,
            background: C.purpleDim, color: C.purple, fontWeight: 600, marginLeft: "auto",
          }}>Sonnet</span>
        </div>
        {licenseInfo?.tokens_used != null && (
          <div>
            <div style={{
              height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${Math.min(tokenPercent, 100)}%`,
                background: tokenPercent > 85
                  ? `linear-gradient(90deg, ${C.error}, #FF9494)`
                  : tokenPercent > 60
                    ? `linear-gradient(90deg, ${C.warning}, #FCD34D)`
                    : `linear-gradient(90deg, ${C.success}, #6EE7B7)`,
                transition: `width 0.8s ${EASE.out}`,
              }} />
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span>{((licenseInfo.tokens_used / 1000) | 0)}k usados</span>
              <span>{((licenseInfo.tokens_limit / 1000) | 0)}k limite</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── NOVO PROJETO ─── */}
      <div style={{ padding: "10px 12px 6px" }}>
        <button onClick={onNew} style={{
          width: "100%", padding: "9px 12px",
          background: C.yellowSoft, border: `1px solid rgba(255,208,80,0.15)`,
          borderRadius: R.sm, fontSize: 12, fontWeight: 600, color: C.yellow,
          cursor: "pointer", fontFamily: DM,
          display: "flex", alignItems: "center", gap: 8,
          transition: `all 0.2s ${EASE.out}`,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = C.yellowGlow; e.currentTarget.style.borderColor = "rgba(255,208,80,0.3)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.yellowSoft; e.currentTarget.style.borderColor = "rgba(255,208,80,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <IconPlus /> Novo Projeto
        </button>
      </div>

      {/* ─── GENERATION STEPS ─── */}
      {(generating || (thinkSteps && thinkSteps.length > 0)) && (
        <div style={{
          margin: "6px 12px", background: C.yellowGlow2,
          border: `1px solid rgba(255,208,80,0.1)`, borderRadius: R.md,
          padding: "10px 12px", flexShrink: 0, maxHeight: 180, overflowY: "auto",
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: C.yellow,
            letterSpacing: 1, textTransform: "uppercase", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {generating && <span style={{
              width: 5, height: 5, borderRadius: "50%", background: C.yellow,
              display: "inline-block", animation: "pulse 1.2s ease-in-out infinite",
            }} />}
            {generating ? "Gerando..." : "Concluido"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(thinkSteps || []).map((step, i) => {
              const isLast = i === (thinkSteps?.length - 1);
              const isDone = !generating || !isLast;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 7,
                  animation: isLast ? `fadeIn 0.3s ${EASE.out}` : "none",
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                    background: isDone ? C.successDim : C.yellowGlow,
                    border: `1px solid ${isDone ? "rgba(52,211,153,0.25)" : "rgba(255,208,80,0.25)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isDone ? C.success : C.yellow,
                  }}>
                    {isDone ? <IconCheck /> : <IconLoader />}
                  </div>
                  <span style={{
                    fontSize: 10, color: isDone ? C.textMuted : C.textSub,
                    lineHeight: 1.5, fontFamily: DM,
                  }}>
                    {typeof step === "string" ? step : step?.message || ""}
                  </span>
                </div>
              );
            })}
          </div>
          <div ref={stepsEndRef} />
        </div>
      )}

      {/* ─── PROJECTS LIST ─── */}
      <div className="scroll-fade" style={{ flex: 1, overflowY: "auto", padding: "6px 12px" }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.textMuted,
          letterSpacing: 1, textTransform: "uppercase",
          padding: "8px 4px 6px",
        }}>
          Projetos ({projects.length})
        </div>

        {projects.length === 0 && (
          <div style={{ padding: "20px 8px", textAlign: "center" }}>
            <div style={{
              width: 40, height: 40, borderRadius: R.md,
              background: C.yellowGlow2, border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 10px", color: C.textDim,
            }}>
              <IconFolder />
            </div>
            <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.5, fontWeight: 500 }}>Nenhum projeto ainda</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>Descreva seu app para comecar</div>
          </div>
        )}

        {projects.map(p => {
          const isActive = activeId === p.id;
          const isHover = hoverId === p.id;
          const lastScore = p.history?.[p.history.length - 1]?.score;

          return (
            <div key={p.id} style={{ position: "relative", marginBottom: 2 }}
              onMouseEnter={() => setHoverId(p.id)}
              onMouseLeave={() => setHoverId(null)}
            >
              <button onClick={() => onSelect(p.id)} style={{
                width: "100%", textAlign: "left", padding: "8px 28px 8px 10px",
                background: isActive ? C.yellowSoft : isHover ? C.surface2 : "transparent",
                border: isActive ? `1px solid rgba(255,208,80,0.15)` : "1px solid transparent",
                borderRadius: R.sm, cursor: "pointer",
                transition: `all 0.15s ${EASE.out}`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{
                  width: 3, height: 20, borderRadius: 2, flexShrink: 0,
                  background: isActive ? C.yellow : "transparent",
                  transition: `all 0.2s ${EASE.out}`,
                }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 12, fontWeight: isActive ? 600 : 500,
                    color: isActive ? C.text : C.textSub,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontFamily: DM, lineHeight: 1.3,
                  }}>
                    {p.name}
                  </div>
                  <div style={{
                    fontSize: 10, color: C.textDim, marginTop: 2,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    {new Date(p.updatedAt || p.createdAt).toLocaleDateString("pt-BR")}
                    {lastScore != null && (
                      <span style={{
                        fontSize: 8, padding: "0 5px", borderRadius: 3, fontWeight: 700, lineHeight: "16px",
                        background: lastScore >= 70 ? C.successDim : lastScore >= 40 ? C.warningDim : C.errorDim,
                        color: lastScore >= 70 ? C.success : lastScore >= 40 ? C.warning : C.error,
                      }}>
                        {lastScore}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {isHover && (
                <button onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                  style={{
                    position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: C.textDim, cursor: "pointer",
                    padding: 4, borderRadius: R.xs, display: "flex", alignItems: "center",
                    transition: `color 0.15s ${EASE.out}`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = C.error}
                  onMouseLeave={e => e.currentTarget.style.color = C.textDim}
                >
                  <IconTrash />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── BOTTOM ACTIONS ─── */}
      <div style={{ padding: "8px 12px 10px", borderTop: `1px solid ${C.border}` }}>
        {[
          { label: "Configuracoes", icon: <IconSettings />, action: onSettings, hoverColor: C.text, hoverBg: C.surface2 },
          { label: "Sair", icon: <IconLogout />, action: onLogout, hoverColor: C.error, hoverBg: C.errorDim },
        ].map(item => (
          <button key={item.label} onClick={item.action} style={{
            width: "100%", padding: "9px 10px", background: "transparent",
            border: "none", borderRadius: R.sm,
            fontSize: 13, color: C.textSub, cursor: "pointer", fontFamily: DM,
            textAlign: "left", marginBottom: 1,
            display: "flex", alignItems: "center", gap: 8,
            transition: `all 0.15s ${EASE.out}`,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = item.hoverColor; e.currentTarget.style.background = item.hoverBg; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = "transparent"; }}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(SidebarInner);
