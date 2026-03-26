import { useState, useEffect, useRef } from "react";
import { C, DM, MONO, SHADOW, R, EASE } from "../config/theme";

const COMMANDS = [
  { key: "rewind",     label: "/rewind",     desc: "Voltar para versao anterior",          icon: "↩" },
  { key: "exportar",   label: "/exportar",   desc: "Exportar projeto como ZIP",            icon: "📦" },
  { key: "limpar",     label: "/limpar",     desc: "Limpar historico e resetar projeto",    icon: "🗑" },
  { key: "github",     label: "/github",     desc: "Publicar no GitHub",                   icon: "🐙" },
  { key: "modo-escuro",label: "/modo-escuro",desc: "Toggle dark mode no app gerado",       icon: "🌙" },
  { key: "modelo",     label: "/modelo",     desc: "Trocar modelo de IA",                  icon: "🤖" },
];

/**
 * SlashMenu — popup de autocomplete quando o usuario digita "/" no textarea.
 * Props:
 *   query: string — texto depois do "/"
 *   visible: boolean
 *   onSelect: (command) => void
 *   onClose: () => void
 *   anchorRect: { bottom, left } — posição do textarea
 */
export default function SlashMenu({ query, visible, onSelect, onClose, anchorRect }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const listRef = useRef();

  const filtered = COMMANDS.filter(c =>
    c.key.startsWith(query.toLowerCase()) || c.label.includes(query.toLowerCase())
  );

  // Reset selection when query changes
  useEffect(() => { setSelectedIdx(0); }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filtered[selectedIdx]) onSelect(filtered[selectedIdx]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, filtered, selectedIdx, onSelect, onClose]);

  if (!visible || filtered.length === 0) return null;

  return (
    <div style={{
      position: "absolute",
      bottom: anchorRect?.bottom || 80,
      left: anchorRect?.left || 16,
      width: 260,
      background: C.surface,
      border: `1px solid ${C.borderHover}`,
      borderRadius: R.md,
      boxShadow: SHADOW.lg,
      overflow: "hidden",
      zIndex: 100,
      animation: `slideUp 0.15s ${EASE.out}`,
    }} ref={listRef}>
      <div style={{
        padding: "6px 10px", borderBottom: `1px solid ${C.border}`,
        fontSize: 9, color: C.textDim, fontWeight: 600,
        letterSpacing: 0.8, textTransform: "uppercase",
      }}>
        Comandos
      </div>
      {filtered.map((cmd, i) => (
        <button
          key={cmd.key}
          onClick={() => onSelect(cmd)}
          onMouseEnter={() => setSelectedIdx(i)}
          style={{
            width: "100%", textAlign: "left",
            padding: "8px 10px",
            background: i === selectedIdx ? C.surface2 : "transparent",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
            borderLeft: i === selectedIdx ? `2px solid ${C.yellow}` : "2px solid transparent",
            transition: `all 0.1s ${EASE.out}`,
          }}
        >
          <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{cmd.icon}</span>
          <div>
            <div style={{
              fontSize: 12, fontWeight: 600, fontFamily: MONO,
              color: i === selectedIdx ? C.yellow : C.text,
            }}>
              {cmd.label}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>{cmd.desc}</div>
          </div>
        </button>
      ))}
      <div style={{
        padding: "4px 10px", borderTop: `1px solid ${C.border}`,
        fontSize: 9, color: C.textDim, display: "flex", gap: 8,
      }}>
        <span>↑↓ navegar</span>
        <span>Enter selecionar</span>
        <span>Esc fechar</span>
      </div>
    </div>
  );
}

export { COMMANDS };
