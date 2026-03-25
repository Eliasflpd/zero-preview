import { useState, useEffect, useRef, useCallback } from "react";
import WCManager from "../lib/wcManager";
import { C, DM } from "../config/theme";
import { exportToZip } from "../lib/exporter";

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
          {l.type === "info" ? "i " : l.type === "success" ? "v " : l.type === "error" ? "x " : "  "}{l.text}
        </div>
      ))}
    </div>
  );
}

export default function PreviewPanel({ files, runId, onClose, onAutoFix, projectName }) {
  const [status, setStatus] = useState(() => WCManager.serverUrl ? "ready" : "booting");
  const [logs, setLogs] = useState([]);
  const [url, setUrl] = useState(WCManager.serverUrl || "");
  const [runtimeError, setRuntimeError] = useState(null);
  const prevRunId = useRef(null);
  const loadTimer = useRef(null);

  const addLog = useCallback((text, type = "default") => {
    const clean = String(text).trim();
    if (!clean) return;
    // Detect Vite/React errors in terminal output
    if (type === "default" && (clean.includes("Error:") || clean.includes("error TS") || clean.includes("SyntaxError"))) {
      type = "error";
    }
    setLogs(prev => [...prev.slice(-400), { text: clean, type }]);
  }, []);

  // Listen for runtime errors from iframe via postMessage
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "PREVIEW_UNCAUGHT_EXCEPTION" || e.data?.type === "error") {
        const msg = e.data.message || e.data.error || "Erro desconhecido no preview";
        setRuntimeError(msg);
        addLog(`Runtime error: ${msg}`, "error");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [addLog]);

  useEffect(() => {
    if (prevRunId.current === runId) {
      if (WCManager.serverUrl) {
        setUrl(WCManager.serverUrl);
        setStatus("ready");
      }
      return;
    }

    prevRunId.current = runId;
    let active = true;
    setLogs([]);
    setStatus("booting");
    setUrl("");
    setRuntimeError(null);

    // Timeout: if preview doesn't load in 30s, show waiting message
    clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => {
      if (active && status !== "ready") {
        addLog("WebContainer demorando mais que o esperado...", "info");
      }
    }, 15000);

    WCManager.run(
      files,
      (text, type) => { if (active) addLog(text, type); },
      (serverUrl) => {
        if (active) {
          setUrl(serverUrl);
          setStatus("ready");
          clearTimeout(loadTimer.current);
        }
      }
    ).catch(e => {
      if (active) { addLog(e.message, "error"); setStatus("error"); }
    });

    return () => { active = false; clearTimeout(loadTimer.current); };
  }, [runId]);

  const statusInfo = {
    booting: { label: "Iniciando...", color: C.info },
    installing: { label: "Instalando dependencias...", color: C.yellow },
    ready: { label: "Preview ao vivo", color: C.success },
    error: { label: "Erro", color: C.error },
  }[status] || { label: "Aguardando...", color: C.textMuted };

  const handleAutoFix = () => {
    if (onAutoFix && runtimeError) {
      onAutoFix(`O app gerou este erro de runtime: "${runtimeError}". Corrija sem alterar a estrutura ou aparencia.`);
      setRuntimeError(null);
    }
  };

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
            }}>Abrir</a>
          )}
          {url && (
            <button onClick={() => exportToZip(files, projectName)} style={{
              padding: "4px 10px", background: C.yellowGlow,
              border: `1px solid rgba(255,208,80,0.3)`, borderRadius: 5,
              fontSize: 10, color: C.yellow, cursor: "pointer", fontFamily: DM, fontWeight: 600,
            }}>Exportar ZIP</button>
          )}
          {url && (
            <button onClick={() => { const iframe = document.querySelector('iframe[title="Preview"]'); if (iframe) { iframe.src = iframe.src; setRuntimeError(null); } }} style={{
              padding: "4px 10px", background: "transparent",
              border: `1px solid ${C.border}`, borderRadius: 5,
              fontSize: 10, color: C.textMuted, cursor: "pointer", fontFamily: DM,
            }}>Reload</button>
          )}
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>x</button>
        </div>
      </div>

      {/* iframe + error overlay */}
      <div style={{ flex: 1, position: "relative", background: C.bg }}>
        {status !== "ready" && !url && (
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

        {/* Runtime error overlay */}
        {runtimeError && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(6,15,30,0.95)", borderTop: `2px solid ${C.error}`,
            padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.error }}>Erro de Runtime</span>
              <button onClick={() => setRuntimeError(null)} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 14 }}>x</button>
            </div>
            <code style={{ fontSize: 10, color: C.textMuted, fontFamily: "'Courier New', monospace", wordBreak: "break-all", lineHeight: 1.4 }}>
              {runtimeError.slice(0, 300)}
            </code>
            {onAutoFix && (
              <button onClick={handleAutoFix} style={{
                padding: "6px 12px", background: C.yellow, border: "none", borderRadius: 6,
                fontSize: 11, fontWeight: 700, color: C.bg, cursor: "pointer", fontFamily: DM,
                alignSelf: "flex-start",
              }}>
                Corrigir automaticamente
              </button>
            )}
          </div>
        )}
      </div>

      <Terminal logs={logs} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
