import { useState } from "react";
import { C, SYNE, DM } from "../config/theme";

const API_BASE = import.meta.env.VITE_API_URL || "https://zp-backend-production.up.railway.app";

export default function FeedbackForm({ prompt, score, onClose }) {
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (stars === 0) return;
    setSending(true);
    try {
      const licenseKey = JSON.parse(localStorage.getItem("zp_license")) || "";
      await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-license-key": licenseKey },
        body: JSON.stringify({ stars, text: text.trim(), prompt, score }),
      });
      setSent(true);
      localStorage.setItem("zp_last_feedback", Date.now().toString());
      setTimeout(onClose, 1500);
    } catch {}
    setSending(false);
  };

  if (sent) {
    return (
      <div style={{ padding: "16px 20px", background: "rgba(52,211,153,0.06)", border: `1px solid rgba(52,211,153,0.2)`, borderRadius: 12, textAlign: "center" }}>
        <div style={{ fontSize: 20, marginBottom: 4 }}>Obrigado!</div>
        <div style={{ fontSize: 11, color: C.success }}>Seu feedback ajuda a melhorar o Zero Preview</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "14px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: SYNE }}>Como foi essa geracao?</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 14 }}>x</button>
      </div>

      {/* Stars */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setStars(n)} style={{
            width: 32, height: 32, borderRadius: 8, border: "none",
            background: n <= stars ? C.yellow : C.bg,
            color: n <= stars ? C.bg : C.textDim,
            fontSize: 14, cursor: "pointer", transition: "all 0.15s",
            fontWeight: 700,
          }}>
            {n}
          </button>
        ))}
      </div>

      {/* Text */}
      <textarea
        value={text} onChange={e => setText(e.target.value)}
        placeholder="O que poderia ser melhor? (opcional)"
        rows={2}
        style={{ width: "100%", padding: "8px 10px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: C.text, fontFamily: DM, resize: "none", outline: "none", marginBottom: 8, boxSizing: "border-box" }}
      />

      <button onClick={submit} disabled={stars === 0 || sending} style={{
        padding: "7px 16px", background: stars > 0 ? C.yellow : C.border,
        border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700,
        color: C.bg, cursor: stars > 0 ? "pointer" : "not-allowed", fontFamily: DM,
      }}>
        {sending ? "Enviando..." : "Enviar feedback"}
      </button>
    </div>
  );
}
