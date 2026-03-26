import { useState, useEffect, useRef } from "react";
import { C, DM, R, EASE } from "../config/theme";

const LS_KEY = "zp_escritorio";
const CANAIS = ["geral", "code", "qa"];

const AVATARS = {
  "Elias":     { cor: "#3B82F6", letra: "E" },
  "Claude.ai": { cor: "#F59E0B", letra: "C" },
  "Code":      { cor: "#22C55E", letra: "<>" },
  "Claudin":   { cor: "#8B5CF6", letra: "Q" },
};

function loadMensagens() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}

function saveMensagens(msgs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(msgs)); } catch {}
}

function Avatar({ remetente }) {
  const a = AVATARS[remetente] || { cor: C.textDim, letra: "?" };
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", background: a.cor,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 700, color: "#fff", fontFamily: DM,
      flexShrink: 0,
    }}>
      {a.letra}
    </div>
  );
}

function Mensagem({ msg }) {
  const time = new Date(msg.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ display: "flex", gap: 8, padding: "6px 0" }}>
      <Avatar remetente={msg.de} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: AVATARS[msg.de]?.cor || C.text, fontFamily: DM }}>{msg.de}</span>
          <span style={{ fontSize: 9, color: C.textDim }}>{time}</span>
        </div>
        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4, wordBreak: "break-word" }}>{msg.texto}</div>
      </div>
    </div>
  );
}

export default function Escritorio() {
  const [canal, setCanal] = useState("geral");
  const [mensagens, setMensagens] = useState(loadMensagens);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  const msgs = mensagens[canal] || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs.length, canal]);

  const enviar = () => {
    const texto = input.trim();
    if (!texto) return;

    const nova = { de: "Elias", texto, at: Date.now() };
    const updated = { ...mensagens, [canal]: [...(mensagens[canal] || []), nova] };
    setMensagens(updated);
    saveMensagens(updated);
    setInput("");
  };

  // API publica para outros agentes adicionarem mensagens
  useEffect(() => {
    window.__escritorio = {
      enviar: (de, texto, canalDest = "geral") => {
        setMensagens(prev => {
          const updated = { ...prev, [canalDest]: [...(prev[canalDest] || []), { de, texto, at: Date.now() }] };
          saveMensagens(updated);
          return updated;
        });
      },
    };
    return () => { delete window.__escritorio; };
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      fontFamily: DM,
    }}>
      {/* Tabs de canal */}
      <div style={{
        display: "flex", gap: 2, padding: "8px 12px",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {CANAIS.map(c => (
          <button key={c} onClick={() => setCanal(c)} style={{
            padding: "4px 12px", borderRadius: R.sm, fontSize: 11,
            fontWeight: canal === c ? 700 : 500, fontFamily: DM,
            background: canal === c ? C.surface2 : "transparent",
            color: canal === c ? C.text : C.textDim,
            border: "none", cursor: "pointer",
            transition: `all 0.1s ${EASE.out}`,
          }}>
            {c === "geral" ? "# geral" : c === "code" ? "# code" : "# qa"}
          </button>
        ))}
      </div>

      {/* Lista de mensagens */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", padding: "8px 12px",
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        {msgs.length === 0 && (
          <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", padding: 20 }}>
            Nenhuma mensagem em #{canal}
          </div>
        )}
        {msgs.map((msg, i) => <Mensagem key={i} msg={msg} />)}
      </div>

      {/* Input */}
      <div style={{
        display: "flex", gap: 6, padding: "8px 12px",
        borderTop: `1px solid ${C.border}`,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder={`Mensagem em #${canal}...`}
          style={{
            flex: 1, padding: "6px 10px", borderRadius: R.sm,
            background: C.surface2, color: C.text,
            border: `1px solid ${C.border}`, fontSize: 12,
            fontFamily: DM, outline: "none",
          }}
        />
        <button onClick={enviar} disabled={!input.trim()} style={{
          padding: "6px 14px", borderRadius: R.sm, border: "none",
          background: input.trim() ? (C.accent || C.info) : C.surface2,
          color: input.trim() ? "#fff" : C.textDim,
          fontSize: 11, fontWeight: 600, fontFamily: DM,
          cursor: input.trim() ? "pointer" : "default",
          transition: `all 0.1s ${EASE.out}`,
        }}>
          Enviar
        </button>
      </div>
    </div>
  );
}
