import { C, SYNE, DM } from "../config/theme";

// Map progress messages to agent names and icons
function parseStep(msg) {
  const lower = (msg || "").toLowerCase();
  if (lower.includes("nicho")) return { agent: "Sommelier", desc: "Analisando nicho...", pct: 10 };
  if (lower.includes("arquiteto") || lower.includes("secoes") || lower.includes("componentes")) return { agent: "Arquiteto", desc: "Estruturando app...", pct: 20 };
  if (lower.includes("estilos") || lower.includes("css")) return { agent: "Executor", desc: "Aplicando estilos...", pct: 30 };
  if (lower.includes("gerando") || lower.includes("react")) return { agent: "Executor", desc: "Escrevendo codigo...", pct: 50 };
  if (lower.includes("critico") || lower.includes("score")) return { agent: "Critico", desc: msg, pct: 75 };
  if (lower.includes("revisando")) return { agent: "Perfeccionista", desc: "Revisando qualidade...", pct: 85 };
  if (lower.includes("pronto") || lower.includes("editado")) return { agent: "Concluido", desc: msg, pct: 100 };
  if (lower.includes("cache")) return { agent: "Velocista", desc: msg, pct: 95 };
  if (lower.includes("reutilizando")) return { agent: "Velocista", desc: msg, pct: 25 };
  if (lower.includes("regenerando")) return { agent: "Critico", desc: "Score baixo, regenerando...", pct: 60 };
  if (lower.includes("mudanca estrutural")) return { agent: "Arquiteto", desc: "Reconstruindo do zero...", pct: 15 };
  if (lower.includes("edicao")) return { agent: "Executor", desc: "Edicao rapida...", pct: 40 };
  return { agent: "Zero", desc: msg, pct: 50 };
}

export default function GenerationProgress({ steps, generating }) {
  if (!generating && (!steps || steps.length === 0)) return null;

  const lastStep = steps[steps.length - 1] || "";
  const parsed = parseStep(lastStep);
  const isDone = !generating;

  return (
    <div style={{
      padding: "16px 20px",
      background: `linear-gradient(135deg, rgba(255,208,80,0.03), rgba(96,165,250,0.03))`,
      borderBottom: `1px solid ${C.border}`,
    }}>
      {/* Agent name + description */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: isDone ? "rgba(52,211,153,0.1)" : "rgba(255,208,80,0.1)",
          border: `1px solid ${isDone ? "rgba(52,211,153,0.3)" : "rgba(255,208,80,0.3)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: isDone ? C.success : C.yellow, fontFamily: SYNE }}>
            {isDone ? "✓" : parsed.agent.charAt(0)}
          </span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: isDone ? C.success : C.yellow, fontFamily: SYNE }}>
            {isDone ? "Concluido" : parsed.agent}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: DM }}>
            {parsed.desc}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: C.bg, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${isDone ? 100 : parsed.pct}%`,
          background: isDone
            ? C.success
            : `linear-gradient(90deg, ${C.yellow}, ${C.info})`,
          borderRadius: 2,
          transition: "width 0.5s ease",
        }} />
      </div>

      {/* Step history (compact) */}
      {steps.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {steps.slice(0, -1).map((s, i) => (
            <span key={i} style={{
              fontSize: 9, color: C.textDim, padding: "1px 6px",
              background: C.bg, borderRadius: 4, border: `1px solid ${C.border}`,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140,
            }}>
              {s.length > 30 ? s.slice(0, 30) + "..." : s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
