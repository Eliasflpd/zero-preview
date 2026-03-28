import { C, SYNE, DM } from "../config/theme";
import { STEPS } from "../config/generator";

// ─── AGENT DISPLAY CONFIG ────────────────────────────────────────────────────
// Intentional coupling: imports STEPS enum so renaming a step in generator
// without updating this map breaks at build time, not silently at runtime.
const AGENT_MAP = {
  [STEPS.REBUILD]:      { name: "Arquiteto",       pct: 10 },
  [STEPS.CACHE_HIT]:    { name: "Velocista",       pct: 100 },
  [STEPS.CACHE_REUSE]:  { name: "Velocista",       pct: 25 },
  [STEPS.SOMMELIER]:    { name: "Sommelier",       pct: 15 },
  [STEPS.ARCHITECT]:    { name: "Arquiteto",       pct: 25 },
  [STEPS.CSS]:          { name: "Executor",        pct: 30 },
  [STEPS.INTENT]:       { name: "Template Engine", pct: 40 },
  [STEPS.TEMPLATE]:     { name: "Template Engine", pct: 80 },
  [STEPS.MEMORIALISTA]: { name: "Memorialista",    pct: 35 },
  [STEPS.EXECUTOR]:     { name: "Executor",        pct: 50 },
  [STEPS.CRITICO]:      { name: "Critico",         pct: 75 },
  [STEPS.REVIEWER]:     { name: "Perfeccionista",  pct: 85 },
  [STEPS.DONE]:         { name: "Concluido",       pct: 100 },
  [STEPS.EDIT]:         { name: "Executor",        pct: 40 },
  [STEPS.RETRY]:        { name: "Critico",         pct: 60 },
};

function resolveAgent(stepObj) {
  // Structured event: { step: "SOMMELIER", message: "..." }
  if (stepObj && typeof stepObj === "object" && stepObj.step) {
    const config = AGENT_MAP[stepObj.step];
    if (config) return { ...config, desc: stepObj.message };
  }
  // Legacy string fallback
  const msg = typeof stepObj === "string" ? stepObj : stepObj?.message || "";
  return { name: "Zero", pct: 50, desc: msg };
}

export default function GenerationProgress({ steps, generating }) {
  if (!generating && (!steps || steps.length === 0)) return null;

  const lastStep = steps[steps.length - 1];
  const agent = resolveAgent(lastStep);
  const isDone = !generating;

  return (
    <div style={{
      padding: "16px 20px",
      background: "linear-gradient(135deg, rgba(255,208,80,0.03), rgba(96,165,250,0.03))",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: isDone ? "rgba(52,211,153,0.1)" : "rgba(255,208,80,0.1)",
          border: `1px solid ${isDone ? "rgba(52,211,153,0.3)" : "rgba(255,208,80,0.3)"}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: isDone ? C.success : C.yellow, fontFamily: SYNE }}>
            {isDone ? "v" : agent.name.charAt(0)}
          </span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: isDone ? C.success : C.yellow, fontFamily: SYNE }}>
            {isDone ? "Concluido" : agent.name}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: DM }}>{agent.desc}</div>
        </div>
      </div>

      <div style={{ height: 4, background: C.bg, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${isDone ? 100 : agent.pct}%`,
          background: isDone ? C.success : `linear-gradient(90deg, ${C.yellow}, ${C.info})`,
          borderRadius: 2, transition: "width 0.5s ease",
        }} />
      </div>

      {steps.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {steps.slice(0, -1).map((s, i) => {
            const a = resolveAgent(s);
            return (
              <span key={i} style={{
                fontSize: 9, color: C.textDim, padding: "1px 6px",
                background: C.bg, borderRadius: 4, border: `1px solid ${C.border}`,
                whiteSpace: "nowrap",
              }}>
                {a.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
