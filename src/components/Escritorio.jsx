import { useState, useEffect, useRef, useCallback } from "react";
import { C, DM, R, EASE } from "../config/theme";
import { callClaude } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "https://zero-backend-production-7b37.up.railway.app";
const LS_KEY = "zp_escritorio";
const CANAIS = ["geral", "code", "qa"];
const POLL_INTERVAL = 3000;
const WELCOMED_KEY = "zp_escritorio_welcomed";

const AVATARS = {
  "Elias":     { cor: "#3B82F6", letra: "E" },
  "Claude.ai": { cor: "#F59E0B", letra: "C" },
  "Code":      { cor: "#22C55E", letra: "<>" },
  "Claudin":   { cor: "#8B5CF6", letra: "Q" },
  "Sistema":   { cor: "#6B7280", letra: "S" },
};

function getLicenseKey() {
  try { return JSON.parse(localStorage.getItem("zp_license")) || ""; } catch { return ""; }
}

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}

function saveLocal(msgs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(msgs)); } catch {}
}

function Avatar({ remetente, size = 28 }) {
  const a = AVATARS[remetente] || { cor: C.textDim, letra: "?" };
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: a.cor,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: "#fff", fontFamily: DM,
      flexShrink: 0,
    }}>
      {a.letra}
    </div>
  );
}

function Mensagem({ msg, onEnviarParaClaude }) {
  const time = new Date(msg.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const deCor = AVATARS[msg.de]?.cor || C.text;
  const paraCor = msg.para ? (AVATARS[msg.para]?.cor || C.textDim) : null;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ display: "flex", gap: 8, padding: "6px 0", position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Avatar remetente={msg.de} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: deCor, fontFamily: DM }}>{msg.de}</span>
          {msg.para && (
            <>
              <span style={{ fontSize: 9, color: C.textDim }}>{"\u2192"}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, color: paraCor, fontFamily: DM,
                background: `${paraCor}15`, padding: "1px 6px", borderRadius: R.full,
              }}>{msg.para}</span>
            </>
          )}
          <span style={{ fontSize: 9, color: C.textDim }}>{time}</span>
        </div>
        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4, wordBreak: "break-word" }}>{msg.texto}</div>
      </div>
      {hovered && msg.de !== "Sistema" && (
        <button
          onClick={() => onEnviarParaClaude?.(msg.texto)}
          title="Perguntar ao Claude.ai sobre esta mensagem"
          style={{
            position: "absolute", right: 0, top: 4,
            padding: "3px 8px", borderRadius: R.sm, border: "none",
            background: "#F59E0B", color: "#fff",
            fontSize: 9, fontWeight: 700, fontFamily: DM,
            cursor: "pointer", opacity: 0.9,
          }}
        >
          {"\uD83E\uDD16"} Claude.ai
        </button>
      )}
    </div>
  );
}

export default function Escritorio() {
  const [canal, setCanal] = useState("geral");
  const [mensagens, setMensagens] = useState(loadLocal);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState({});
  const scrollRef = useRef(null);

  // Chat com Claude
  const [chatInput, setChatInput] = useState("");
  const [chatResposta, setChatResposta] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatInputRef = useRef(null);

  const msgs = mensagens[canal] || [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs.length, canal]);

  useEffect(() => {
    setUnread(prev => ({ ...prev, [canal]: 0 }));
  }, [canal, msgs.length]);

  const adicionarMensagem = useCallback((de, texto, canalDest = "geral", para = null) => {
    const nova = { de, texto, at: Date.now(), para };
    setMensagens(prev => {
      const updated = { ...prev, [canalDest]: [...(prev[canalDest] || []), nova] };
      saveLocal(updated);
      return updated;
    });
    const key = getLicenseKey();
    if (key) {
      fetch(`${API_BASE}/escritorio/mensagem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-license-key": key },
        body: JSON.stringify({ de, texto, canal: canalDest, para }),
      }).catch(() => {});
    }
    if (canalDest !== canal) {
      setUnread(prev => ({ ...prev, [canalDest]: (prev[canalDest] || 0) + 1 }));
    }
  }, [canal]);

  const enviar = () => {
    const texto = input.trim();
    if (!texto) return;
    adicionarMensagem("Elias", texto, canal);
    setInput("");
  };

  // Polling backend
  useEffect(() => {
    const key = getLicenseKey();
    if (!key) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/escritorio/mensagens?canal=${canal}&limit=50`, {
          headers: { "x-license-key": key },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const remoteMsgs = data.reverse().map(m => ({
            de: m.sender, texto: m.message, at: new Date(m.created_at).getTime(),
            para: m.recipient || null,
          }));
          const localCount = (mensagens[canal] || []).length;
          if (remoteMsgs.length > localCount) {
            setMensagens(prev => {
              const updated = { ...prev, [canal]: remoteMsgs };
              saveLocal(updated);
              return updated;
            });
          }
        }
      } catch {}
    };
    const interval = setInterval(poll, POLL_INTERVAL);
    poll();
    return () => clearInterval(interval);
  }, [canal]);

  // API publica
  useEffect(() => {
    window.__escritorio = {
      enviar: (de, texto, canalDest = "geral", para = null) => {
        adicionarMensagem(de, texto, canalDest, para);
      },
    };
    return () => { delete window.__escritorio; };
  }, [adicionarMensagem]);

  // Boas vindas
  useEffect(() => {
    if (!sessionStorage.getItem(WELCOMED_KEY)) {
      sessionStorage.setItem(WELCOMED_KEY, "1");
      setTimeout(() => {
        adicionarMensagem("Sistema", "Escritorio aberto \u2014 Claude.ai, Code e Claudin conectados.", "geral");
      }, 500);
    }
  }, [adicionarMensagem]);

  // Chat: enviar ao Claude
  const enviarParaClaude = async () => {
    const texto = chatInput.trim();
    if (!texto || chatLoading) return;
    setChatLoading(true);
    setChatResposta("");
    try {
      const resposta = await callClaude(
        "Voce e um assistente do projeto Zero Preview. Responda de forma concisa e direta em portugues.",
        texto,
        2000
      );
      setChatResposta(resposta);
    } catch (err) {
      setChatResposta(`Erro: ${err.message}`);
    } finally {
      setChatLoading(false);
    }
  };

  // Preencher chat a partir de mensagem do canal
  const preencherChat = (texto) => {
    setChatInput(texto);
    chatInputRef.current?.focus();
  };

  // Postar resposta do Claude no canal
  const postarNoCanal = () => {
    if (!chatResposta || chatResposta.startsWith("Erro:")) return;
    adicionarMensagem("Claude.ai", chatResposta, canal);
    setChatResposta("");
    setChatInput("");
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      fontFamily: DM,
    }}>
      {/* Tabs */}
      <div style={{
        display: "flex", gap: 2, padding: "8px 12px",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {CANAIS.map(c => {
          const count = unread[c] || 0;
          return (
            <button key={c} onClick={() => setCanal(c)} style={{
              padding: "4px 12px", borderRadius: R.sm, fontSize: 11,
              fontWeight: canal === c ? 700 : 500, fontFamily: DM,
              background: canal === c ? C.surface2 : "transparent",
              color: canal === c ? C.text : C.textDim,
              border: "none", cursor: "pointer",
              transition: `all 0.1s ${EASE.out}`,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              # {c}
              {count > 0 && canal !== c && (
                <span style={{
                  background: "#EF4444", color: "#fff", fontSize: 9,
                  fontWeight: 700, borderRadius: R.full, padding: "1px 5px",
                  minWidth: 16, textAlign: "center", lineHeight: 1.3,
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", padding: "8px 12px",
        display: "flex", flexDirection: "column", gap: 2,
        minHeight: 0,
      }}>
        {msgs.length === 0 && (
          <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", padding: 20 }}>
            Nenhuma mensagem em #{canal}
          </div>
        )}
        {msgs.map((msg, i) => <Mensagem key={i} msg={msg} onEnviarParaClaude={preencherChat} />)}
      </div>

      {/* Input do canal */}
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
        }}>
          Enviar
        </button>
      </div>

      {/* Chat com Claude.ai */}
      <div style={{
        borderTop: `2px solid ${C.border}`,
        padding: "8px 12px",
        display: "flex", flexDirection: "column", gap: 6,
        maxHeight: 200, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Avatar remetente="Claude.ai" size={20} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", fontFamily: DM }}>Chat com Claude.ai</span>
        </div>

        {/* Resposta do Claude */}
        {(chatResposta || chatLoading) && (
          <div style={{
            padding: "6px 10px", borderRadius: R.sm,
            background: C.surface2, fontSize: 11, color: C.text,
            lineHeight: 1.5, maxHeight: 80, overflowY: "auto",
            wordBreak: "break-word",
          }}>
            {chatLoading ? (
              <span style={{ color: C.textDim, fontStyle: "italic" }}>Claude pensando...</span>
            ) : (
              <>
                {chatResposta}
                {!chatResposta.startsWith("Erro:") && (
                  <button onClick={postarNoCanal} style={{
                    display: "block", marginTop: 4,
                    padding: "2px 8px", borderRadius: R.sm, border: "none",
                    background: "#22C55E", color: "#fff",
                    fontSize: 9, fontWeight: 700, fontFamily: DM,
                    cursor: "pointer",
                  }}>
                    {"\u2192"} Enviar para #{canal}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Input do chat */}
        <div style={{ display: "flex", gap: 6 }}>
          <input
            ref={chatInputRef}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarParaClaude(); } }}
            placeholder="Pergunte ao Claude.ai..."
            disabled={chatLoading}
            style={{
              flex: 1, padding: "6px 10px", borderRadius: R.sm,
              background: C.surface2, color: C.text,
              border: `1px solid #F59E0B40`, fontSize: 11,
              fontFamily: DM, outline: "none",
              opacity: chatLoading ? 0.5 : 1,
            }}
          />
          <button onClick={enviarParaClaude} disabled={!chatInput.trim() || chatLoading} style={{
            padding: "6px 12px", borderRadius: R.sm, border: "none",
            background: chatInput.trim() && !chatLoading ? "#F59E0B" : C.surface2,
            color: chatInput.trim() && !chatLoading ? "#fff" : C.textDim,
            fontSize: 10, fontWeight: 700, fontFamily: DM,
            cursor: chatInput.trim() && !chatLoading ? "pointer" : "default",
          }}>
            {"\u2192"}
          </button>
        </div>
      </div>
    </div>
  );
}
