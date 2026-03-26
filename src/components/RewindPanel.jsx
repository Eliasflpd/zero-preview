import { C, SYNE, DM, MONO, SHADOW, R, EASE } from "../config/theme";

/**
 * RewindPanel — modal com timeline de versões do projeto.
 * Props:
 *   versions: array of { files, prompt, score, at }
 *   currentIndex: number
 *   onRewind: (index) => void
 *   onClose: () => void
 */
export default function RewindPanel({ versions, currentIndex, onRewind, onClose }) {
  if (!versions || versions.length === 0) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(5,10,18,0.85)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: R.lg, padding: 32, maxWidth: 380, textAlign: "center",
          boxShadow: SHADOW.xl,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>↩</div>
          <h3 style={{ fontFamily: SYNE, color: C.text, fontSize: 18, marginBottom: 8 }}>Nenhuma versao</h3>
          <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Gere um app primeiro para criar versoes.</p>
          <button onClick={onClose} style={{
            padding: "8px 20px", background: C.surface2, border: `1px solid ${C.border}`,
            borderRadius: R.sm, fontSize: 12, color: C.text, cursor: "pointer", fontFamily: DM,
          }}>Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(5,10,18,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: `fadeIn 0.2s ${EASE.out}`,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "90vw", maxWidth: 480, maxHeight: "70vh",
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: R.lg, boxShadow: SHADOW.xl,
        display: "flex", flexDirection: "column", overflow: "hidden",
        animation: `scaleIn 0.25s ${EASE.out}`,
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>↩</span>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: SYNE, color: C.text }}>
              Historico de Versoes
            </span>
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: R.full,
              background: C.infoDim, color: C.info, fontWeight: 600,
            }}>
              {versions.length} versao{versions.length !== 1 ? "es" : ""}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: C.textDim,
            cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4,
          }}>x</button>
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {versions.map((v, i) => {
            const isCurrent = i === currentIndex;
            const isLatest = i === versions.length - 1;
            const date = new Date(v.at);

            return (
              <div key={v.at} style={{
                display: "flex", alignItems: "stretch", padding: "0 18px",
              }}>
                {/* Timeline line + dot */}
                <div style={{
                  width: 24, display: "flex", flexDirection: "column", alignItems: "center",
                  flexShrink: 0, position: "relative",
                }}>
                  {i > 0 && <div style={{
                    width: 1, flex: 1, background: C.border,
                  }} />}
                  <div style={{
                    width: isCurrent ? 12 : 8, height: isCurrent ? 12 : 8,
                    borderRadius: "50%", flexShrink: 0,
                    background: isCurrent ? C.yellow : C.textDim,
                    border: isCurrent ? `2px solid ${C.yellow}` : "none",
                    boxShadow: isCurrent ? "0 0 8px rgba(255,208,80,0.3)" : "none",
                    transition: `all 0.2s ${EASE.out}`,
                  }} />
                  {i < versions.length - 1 && <div style={{
                    width: 1, flex: 1, background: C.border,
                  }} />}
                </div>

                {/* Content */}
                <button
                  onClick={() => !isCurrent && onRewind(i)}
                  disabled={isCurrent}
                  style={{
                    flex: 1, textAlign: "left", padding: "8px 12px", margin: "2px 0",
                    background: isCurrent ? C.yellowGlow2 : "transparent",
                    border: isCurrent ? `1px solid rgba(255,208,80,0.15)` : "1px solid transparent",
                    borderRadius: R.sm, cursor: isCurrent ? "default" : "pointer",
                    transition: `all 0.15s ${EASE.out}`,
                  }}
                  onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = C.surface2; }}
                  onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, fontFamily: DM,
                      color: isCurrent ? C.yellow : C.text,
                    }}>
                      v{i + 1}
                    </span>
                    {isCurrent && (
                      <span style={{
                        fontSize: 8, padding: "1px 6px", borderRadius: R.full,
                        background: C.yellowGlow, color: C.yellow, fontWeight: 700,
                      }}>ATUAL</span>
                    )}
                    {isLatest && !isCurrent && (
                      <span style={{
                        fontSize: 8, padding: "1px 6px", borderRadius: R.full,
                        background: C.successDim, color: C.success, fontWeight: 700,
                      }}>MAIS RECENTE</span>
                    )}
                    {v.score != null && (
                      <span style={{
                        fontSize: 8, padding: "1px 5px", borderRadius: 3, fontWeight: 700,
                        background: v.score >= 70 ? "rgba(52,211,153,0.12)" : v.score >= 40 ? "rgba(251,191,36,0.12)" : "rgba(248,113,113,0.12)",
                        color: v.score >= 70 ? C.success : v.score >= 40 ? "#FBBF24" : C.error,
                      }}>
                        {v.score}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 11, color: C.textMuted, lineHeight: 1.4,
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", maxWidth: 320,
                  }}>
                    {v.prompt || "Sem prompt"}
                  </div>
                  <div style={{ fontSize: 9, color: C.textDim, marginTop: 3 }}>
                    {date.toLocaleDateString("pt-BR")} {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: "10px 18px", borderTop: `1px solid ${C.border}`,
          fontSize: 10, color: C.textDim, textAlign: "center",
        }}>
          Clique em uma versao para restaurar &middot; Esc para fechar
        </div>
      </div>
    </div>
  );
}
