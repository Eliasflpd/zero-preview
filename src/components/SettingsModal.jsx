import { useState } from "react";
import { C, SYNE, DM } from "../lib/constants";

export default function SettingsModal({ onClose }) {
  const [geminiKey, setGeminiKey] = useState(() => {
    try { return JSON.parse(localStorage.getItem("zp_gemini_key")) || ""; } catch { return ""; }
  });
  const [claudeKey, setClaudeKey] = useState(() => {
    try { return JSON.parse(localStorage.getItem("zp_claude_key")) || ""; } catch { return ""; }
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem("zp_gemini_key", JSON.stringify(geminiKey.trim()));
    localStorage.setItem("zp_claude_key", JSON.stringify(claudeKey.trim()));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Field = ({ label, value, onChange, placeholder, link, linkText }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </div>
      <input
        type="password" value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          display: "block", width: "100%", padding: "11px 13px",
          background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 9, fontSize: 13, color: C.text, fontFamily: DM,
          outline: "none", marginBottom: 6, boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = C.yellow}
        onBlur={e => e.target.style.borderColor = C.border}
      />
      <p style={{ fontSize: 11, color: C.textDim, margin: 0 }}>
        Obtenha em{" "}
        <a href={link} target="_blank" rel="noreferrer" style={{ color: C.yellow }}>{linkText}</a>
      </p>
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(6,15,30,0.88)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: 32, width: 460,
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: SYNE, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
            Configurações de IA
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <div style={{
          background: "rgba(255,208,80,0.06)", border: "1px solid rgba(255,208,80,0.2)",
          borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: C.yellow,
        }}>
          💡 Configure pelo menos uma chave. O modelo selecionado no chat será usado para gerar.
        </div>

        <Field
          label="Gemini 2.5 Flash (Grátis)"
          value={geminiKey}
          onChange={setGeminiKey}
          placeholder="AIza..."
          link="https://aistudio.google.com/apikey"
          linkText="aistudio.google.com"
        />

        <Field
          label="Claude Sonnet 4 (Premium)"
          value={claudeKey}
          onChange={setClaudeKey}
          placeholder="sk-ant-..."
          link="https://console.anthropic.com/settings/keys"
          linkText="console.anthropic.com"
        />

        <button onClick={save} style={{
          padding: "10px 22px", background: saved ? C.success : C.yellow,
          border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700,
          fontFamily: DM, color: C.bg, cursor: "pointer", transition: "background 0.3s",
        }}>
          {saved ? "✓ Salvo!" : "Salvar chaves"}
        </button>
      </div>
    </div>
  );
}
