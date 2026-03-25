import { C, DM } from "../config/theme";

// ─── NEXT STEPS — Suggestions after successful generation ────────────────────
// Inspired by Emergent.sh — shows contextual "what to do next" after generating

const SUGGESTIONS = [
  { label: "Mudar cores do tema", prompt: "muda as cores para tons de azul escuro com detalhes em dourado" },
  { label: "Adicionar mais dados", prompt: "adiciona mais 10 registros na tabela com dados variados" },
  { label: "Melhorar graficos", prompt: "adiciona um grafico de pizza e um grafico de area alem dos existentes" },
  { label: "Adicionar busca", prompt: "adiciona campo de busca funcional que filtra a tabela de dados" },
  { label: "Modo escuro", prompt: "converte para modo escuro com fundo #0F172A e cards #1E293B" },
  { label: "Adicionar modal", prompt: "adiciona modal de detalhes que abre ao clicar em uma linha da tabela" },
  { label: "Melhorar mobile", prompt: "melhora o layout mobile com sidebar colapsavel e cards empilhados" },
  { label: "Adicionar notificacoes", prompt: "adiciona sino de notificacoes no header com dropdown de 5 alertas" },
];

export default function NextSteps({ onSelect, visible }) {
  if (!visible) return null;

  // Pick 4 random suggestions
  const picks = [...SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 4);

  return (
    <div style={{ padding: "10px 16px 6px" }}>
      <div style={{ fontSize: 10, color: C.textDim, marginBottom: 6, fontFamily: DM }}>Proximos passos:</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {picks.map(s => (
          <button
            key={s.label}
            onClick={() => onSelect(s.prompt)}
            style={{
              padding: "4px 10px", borderRadius: 6,
              background: C.surface, border: `1px solid ${C.border}`,
              fontSize: 10, color: C.textMuted, cursor: "pointer",
              fontFamily: DM, transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.yellow; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
