import { useState, useEffect, useRef, useCallback } from "react";
import WCManager from "../lib/wcManager";
import { C, DM } from "../config/theme";

function Terminal({ logs }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div ref={ref} style={{
      background: "#020810", borderTop: `1px solid ${C.border}`,
      height: 120, overflowY: "auto", padding: "8px 12px",
      fontFamily: "'Courier New', monospace", fontSize: 10.5, flexShrink: 0,
    }}>
      {logs.length === 0 && <div style={{ color: C.textDim, fontStyle: "italic" }}>Terminal pronto...</div>}
      {logs.map((l, i) => (
        <div key={`log_${i}_${l.text.slice(0,20)}`} style={{
          color: l.type === "error" ? C.error : l.type === "success" ? C.success : l.type === "info" ? C.info : "#7A9FBA",
          lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-all",
        }}>
          {l.type === "info" ? "ℹ " : l.type === "success" ? "✓ " : l.type === "error" ? "✗ " : "  "}{l.text}
        </div>
      ))}
    </div>
  );
}

/**
 * PreviewPanel
 * 
 * REGRA FUNDAMENTAL:
 * - runId muda APENAS quando uma nova geração acontece
 * - Clicar na sidebar NÃO muda runId → useEffect não dispara → WC não reinicia
 * - Só o botão Gerar muda runId → WC roda de novo
 */
export default function PreviewPanel({ files, runId, onClose }) {
  const [status, setStatus] = useState(() => WCManager.serverUrl ? "ready" : "booting");
  const [logs, setLogs] = useState([]);
  const [url, setUrl] = useState(WCManager.serverUrl || "");
  const prevRunId = useRef(null);

  const addLog = useCallback((text, type = "default") => {
    const clean = String(text).trim();
    if (!clean) return;
    setLogs(prev => [...prev.slice(-400), { text: clean, type }]);
  }, []);

  useEffect(() => {
    // Se runId não mudou, só garante que o iframe está com a URL certa
    if (prevRunId.current === runId) {
      if (WCManager.serverUrl) {
        setUrl(WCManager.serverUrl);
        setStatus("ready");
      }
      return;
    }

    // runId mudou — nova geração — roda o WC
    prevRunId.current = runId;
    let active = true;
    setLogs([]);
    setStatus("booting");
    setUrl("");

    WCManager.run(
      files,
      (text, type) => { if (active) addLog(text, type); },
      (serverUrl) => { if (active) { setUrl(serverUrl); setStatus("ready"); } }
    ).catch(e => {
      if (active) { addLog(e.message, "error"); setStatus("error"); }
    });

    return () => { active = false; };
  }, [runId]); // ← APENAS runId. Nunca files.

  const statusInfo = {
    booting: { label: "Iniciando...", color: C.info },
    installing: { label: "Instalando dependências...", color: C.yellow },
    ready: { label: "● Preview ao vivo", color: C.success },
    error: { label: "Erro", color: C.error },
  }[status] || { label: "Aguardando...", color: C.textMuted };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: `1px solid ${C.border}` }}>
      {/* Header */}
      <div style={{
        padding: "9px 14px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: C.surface, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F87171" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FBBF24" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#34D399" }} />
          </div>
          <span style={{ fontSize: 11, color: statusInfo.color, fontFamily: DM }}>{statusInfo.label}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {url && (
            <a href={url} target="_blank" rel="noreferrer" style={{
              padding: "4px 10px", background: "transparent",
              border: `1px solid ${C.border}`, borderRadius: 5,
              fontSize: 10, color: C.textMuted, textDecoration: "none", fontFamily: DM,
            }}>↗ Abrir</a>
          )}
          {url && (
            <button onClick={() => { const iframe = document.querySelector('iframe[title="Preview"]'); if (iframe) iframe.src = iframe.src; }} style={{
              padding: "4px 10px", background: "transparent",
              border: `1px solid ${C.border}`, borderRadius: 5,
              fontSize: 10, color: C.textMuted, cursor: "pointer", fontFamily: DM,
            }}>↻ Reload</button>
          )}
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      </div>

      {/* iframe */}
      <div style={{ flex: 1, position: "relative", background: C.bg }}>
        {status !== "ready" && (
          <div style={{
            position: "absolute", inset: 0, background: C.bg,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
          }}>
            <div style={{
              width: 32, height: 32, border: `3px solid ${C.border}`,
              borderTopColor: C.yellow, borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }} />
            <span style={{ fontSize: 12, color: C.textMuted, fontFamily: DM }}>{statusInfo.label}</span>
          </div>
        )}
        {url && (
          <iframe src={url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style={{ width: "100%", height: "100%", border: "none" }} title="Preview" />
        )}
      </div>

      <Terminal logs={logs} />
    </div>
  );
}
