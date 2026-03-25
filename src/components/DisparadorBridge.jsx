import { useState, useEffect, useRef } from "react";
import { C, SYNE, DM, MONO } from "../config/theme";
import { sendMessage, getMessages } from "../lib/api";

// ─── DISPARADOR BRIDGE ──────────────────────────────────────────────────────
// This component serves TWO purposes:
// 1. Visible UI: floating panel where Elias can read/write messages
// 2. Hidden DOM bridge: data-disparador attributes that the Extension can read
//
// The Extension can't make fetch calls to our backend.
// But it CAN read the DOM. So we render the latest messages as data attributes
// on a hidden div. The Extension reads those. Elias pastes Extension's reply
// into the textarea. The bridge sends it to the backend.

const SENDER_COLORS = { code: C.info, extension: C.yellow, elias: C.success };
const SENDER_LABELS = { code: "Code", extension: "Claudin", elias: "Elias" };

export default function DisparadorBridge({ adminKey }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sender, setSender] = useState("elias");
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef();

  const load = async () => {
    if (!adminKey) return;
    const msgs = await getMessages(adminKey);
    setMessages(msgs || []);
    const unreadCount = (msgs || []).filter(m => !m.read && m.recipient !== sender).length;
    setUnread(unreadCount);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [adminKey]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    if (!newMsg.trim() || !adminKey) return;
    setSending(true);
    await sendMessage(adminKey, sender, "all", newMsg.trim(), "message");
    setNewMsg("");
    await load();
    setSending(false);
  };

  const lastForExtension = messages
    .filter(m => m.recipient === "extension" || m.recipient === "all")
    .slice(0, 5)
    .map(m => `[${m.sender}] ${m.message}`)
    .join("\n---\n");

  return (
    <>
      {/* Hidden DOM bridge — Extension reads this */}
      <div
        id="disparador-bridge"
        data-disparador-messages={lastForExtension}
        data-disparador-count={messages.length}
        data-disparador-last-sender={messages[0]?.sender || ""}
        style={{ display: "none" }}
      />

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 900,
          width: 44, height: 44, borderRadius: 12,
          background: open ? C.surface : C.yellow,
          border: `1px solid ${open ? C.border : "transparent"}`,
          color: open ? C.textMuted : C.bg,
          fontSize: 18, fontWeight: 800, fontFamily: SYNE,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          transition: "all 0.2s",
        }}
      >
        {open ? "x" : "D"}
        {!open && unread > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            width: 16, height: 16, borderRadius: "50%",
            background: C.error, color: "#fff", fontSize: 9, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{unread}</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 72, right: 20, zIndex: 900,
          width: 360, maxHeight: 480, borderRadius: 16,
          background: C.surface, border: `1px solid ${C.border}`,
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: SYNE, color: C.yellow }}>Disparador</span>
              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,208,80,0.1)", color: C.yellow, fontWeight: 600 }}>
                {messages.length} msgs
              </span>
            </div>
            <button onClick={load} style={{ background: "none", border: "none", fontSize: 10, color: C.textDim, cursor: "pointer", fontFamily: DM }}>Atualizar</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 10, minHeight: 200, maxHeight: 300 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: 24, fontSize: 11, color: C.textDim }}>
                Canal vazio. Envie a primeira mensagem.
              </div>
            )}
            {[...messages].reverse().map(m => {
              const color = SENDER_COLORS[m.sender] || C.textMuted;
              const label = SENDER_LABELS[m.sender] || m.sender;
              return (
                <div key={m.id} style={{ marginBottom: 6, padding: "6px 8px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color }}>{label}</span>
                    <span style={{ fontSize: 8, color: C.textDim, marginLeft: "auto" }}>
                      {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: C.text, lineHeight: 1.5, whiteSpace: "pre-wrap", maxHeight: 100, overflowY: "auto" }}>
                    {m.message.length > 500 ? m.message.slice(0, 500) + "..." : m.message}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div style={{ padding: "8px 10px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              {Object.entries(SENDER_LABELS).map(([id, label]) => (
                <button key={id} onClick={() => setSender(id)} style={{
                  padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 600,
                  border: `1px solid ${sender === id ? (SENDER_COLORS[id] + "50") : C.border}`,
                  background: sender === id ? (SENDER_COLORS[id] + "15") : "transparent",
                  color: sender === id ? SENDER_COLORS[id] : C.textDim,
                  cursor: "pointer", fontFamily: DM,
                }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <textarea
                value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Mensagem..."
                rows={2}
                style={{ flex: 1, padding: "6px 8px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 10, color: C.text, fontFamily: DM, resize: "none", outline: "none" }}
              />
              <button onClick={send} disabled={sending || !newMsg.trim()} style={{
                padding: "0 12px", background: C.yellow, border: "none", borderRadius: 6,
                fontSize: 10, fontWeight: 700, color: C.bg, cursor: "pointer", fontFamily: DM,
                alignSelf: "flex-end",
              }}>
                {sending ? "..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
