import { C, DM, R } from "../config/theme";

/**
 * KnowledgeBadge — compact inline display of project knowledge.
 * Shows stack, niche, and component count below the project name in sidebar or topbar.
 */
export default function KnowledgeBadge({ knowledge }) {
  if (!knowledge) return null;

  const pills = [];
  if (knowledge.nicho && knowledge.nicho !== "generic") {
    pills.push({ label: knowledge.nicho, color: C.yellow, bg: C.yellowGlow2 });
  }
  if (knowledge.stack?.length) {
    // Show max 3 stack items
    knowledge.stack.slice(0, 3).forEach(s => {
      pills.push({ label: s, color: C.info, bg: C.infoDim });
    });
  }
  if (knowledge.components?.length) {
    pills.push({ label: `${knowledge.components.length} componentes`, color: C.success, bg: C.successDim });
  }

  if (pills.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
      {pills.map((p, i) => (
        <span key={i} style={{
          fontSize: 8, padding: "1px 6px", borderRadius: R.full,
          background: p.bg, color: p.color, fontWeight: 600,
          fontFamily: DM, lineHeight: "14px", whiteSpace: "nowrap",
        }}>
          {p.label}
        </span>
      ))}
    </div>
  );
}
