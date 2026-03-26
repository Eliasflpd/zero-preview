import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import WCManager from "../lib/wcManager";
import { C, DM } from "../config/theme";

const DeployModal = lazy(() => import("./DeployModal"));
const GitHubSync = lazy(() => import("./GitHubSync"));
const EditPanel = lazy(() => import("./EditPanel"));

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
  const [status, setStatus] = useState("booting");
  const [logs, setLogs] = useState([]);
  const [url, setUrl] = useState("");
  const [runtimeError, setRuntimeError] = useState(null);
  const [deviceWidth, setDeviceWidth] = useState("100%");
  const [showDeploy, setShowDeploy] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const prevRunId = useRef(null);
  const loadTimer = useRef(null);
  const autoFixCount = useRef(0); // max 2 per generation to prevent infinite loop
  const autoFixTimer = useRef(null);

  // Reset auto-fix counter when runId changes (new generation)
  useEffect(() => { autoFixCount.current = 0; }, [runId]);

  const triggerAutoFix = useCallback((errorMsg) => {
    if (!onAutoFix || autoFixCount.current >= 5 || autoFixing) return;
    autoFixCount.current++;
    setAutoFixing(true);
    addLog(`Auto-debug: corrigindo automaticamente (tentativa ${autoFixCount.current}/5)...`, "info");
    // Wait 2s for errors to settle, then fix
    clearTimeout(autoFixTimer.current);
    autoFixTimer.current = setTimeout(() => {
      onAutoFix(`O app gerou este erro: "${errorMsg.slice(0, 300)}". Corrija o erro sem alterar a estrutura ou aparencia do app.`);
      setAutoFixing(false);
    }, 2000);
  }, [onAutoFix, autoFixing]);

  // Toggle edit mode in iframe
  const toggleEditMode = () => {
    const iframe = document.querySelector('iframe[title="Preview"]');
    if (iframe?.contentWindow) {
      const newMode = !editMode;
      setEditMode(newMode);
      iframe.contentWindow.postMessage({ type: newMode ? "ENABLE_EDIT_MODE" : "DISABLE_EDIT_MODE" }, "*");
      if (!newMode) setSelectedElement(null);
    }
  };

  // Listen for element clicks from iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "ELEMENT_CLICKED" && editMode) {
        setSelectedElement(e.data.data);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [editMode]);

  const addLog = useCallback((text, type = "default") => {
    const clean = String(text).trim();
    if (!clean) return;
    // Detect Vite/React compile errors in terminal output
    if (type === "default" && (clean.includes("Error:") || clean.includes("error TS") || clean.includes("SyntaxError"))) {
      type = "error";
      // AUTO-DEBUG: trigger automatic fix for compile errors
      if (clean.includes("SyntaxError") || clean.includes("error TS") || clean.includes("Unexpected token") || clean.includes("Cannot find")) {
        triggerAutoFix(clean);
      }
    }
    setLogs(prev => [...prev.slice(-400), { text: clean, type }]);
  }, [triggerAutoFix]);

  // Listen for runtime errors from iframe via postMessage
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "PREVIEW_UNCAUGHT_EXCEPTION" || e.data?.type === "error") {
        const msg = e.data.message || e.data.error || "Erro desconhecido no preview";
        setRuntimeError(msg);
        addLog(`Runtime error: ${msg}`, "error");
        // AUTO-DEBUG: also trigger for runtime errors
        triggerAutoFix(msg);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [addLog, triggerAutoFix]);

  useEffect(() => {
    // ALWAYS run when runId changes — even if same value (project reopen)
    const isRerun = prevRunId.current === runId;
    if (isRerun && WCManager.serverUrl) {
      // Server still alive from before — reuse it
      setUrl(WCManager.serverUrl);
      setStatus("ready");
      return;
    }

    prevRunId.current = runId;
    let active = true;
    setLogs([]);
    setStatus("booting");
    setUrl("");
    setRuntimeError(null);

    // TIMEOUT: if preview doesn't load in 15s, kill and restart
    clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => {
      if (active && !url) {
        addLog("Timeout — reiniciando WebContainer...", "info");
        WCManager.killDev().then(() => {
          if (active && files && Object.keys(files).length > 0) {
            WCManager.run(
              files,
              (text, type) => { if (active) addLog(text, type); },
              (serverUrl) => { if (active) { setUrl(serverUrl); setStatus("ready"); clearTimeout(loadTimer.current); } }
            ).catch(e => { if (active) { addLog(e.message, "error"); setStatus("error"); } });
          }
        });
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
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[
            { label: "Mobile", w: "375px", svg: <svg width="10" height="14" viewBox="0 0 10 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="8" height="14" rx="1.5"/><line x1="4" y1="13" x2="6" y2="13"/></svg> },
            { label: "Tablet", w: "768px", svg: <svg width="13" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="14" height="10" rx="1.5"/><line x1="7" y1="9" x2="9" y2="9"/></svg> },
            { label: "Desktop", w: "100%", svg: <svg width="14" height="12" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="14" height="9" rx="1"/><line x1="5" y1="13" x2="11" y2="13"/><line x1="8" y1="10" x2="8" y2="13"/></svg> },
          ].map(d => (
            <button key={d.w} onClick={() => setDeviceWidth(d.w)} title={d.label} style={{
              padding: "4px 6px", borderRadius: 5, fontSize: 9, fontWeight: 600,
              fontFamily: DM, cursor: "pointer", transition: "all 0.15s",
              background: deviceWidth === d.w ? "rgba(255,208,80,0.15)" : "transparent",
              border: `1px solid ${deviceWidth === d.w ? "rgba(255,208,80,0.3)" : C.border}`,
              color: deviceWidth === d.w ? C.yellow : C.textDim,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {d.svg}
            </button>
          ))}
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
            <button onClick={toggleEditMode} style={{
              padding: "4px 10px", background: editMode ? "rgba(59,130,246,0.15)" : "transparent",
              border: `1px solid ${editMode ? "rgba(59,130,246,0.4)" : C.border}`, borderRadius: 5,
              fontSize: 10, color: editMode ? "#3B82F6" : C.textMuted, cursor: "pointer", fontFamily: DM, fontWeight: 600,
            }}>{editMode ? "Editando..." : "Editar"}</button>
          )}
          {url && (
            <button onClick={() => setShowGitHub(true)} style={{
              padding: "4px 10px", background: "transparent",
              border: `1px solid ${C.border}`, borderRadius: 5,
              fontSize: 10, color: C.textMuted, cursor: "pointer", fontFamily: DM, fontWeight: 600,
            }}>GitHub</button>
          )}
          {url && (
            <button onClick={() => setShowDeploy(true)} style={{
              padding: "4px 10px", background: "rgba(52,211,153,0.1)",
              border: "1px solid rgba(52,211,153,0.3)", borderRadius: 5,
              fontSize: 10, color: C.success, cursor: "pointer", fontFamily: DM, fontWeight: 600,
            }}>Publicar</button>
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
          <iframe key={runId + url} src={url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" scrolling="auto" style={{ width: deviceWidth, maxWidth: "100%", height: "100%", border: "none", margin: deviceWidth !== "100%" ? "0 auto" : "0", display: "block", transition: "width 0.3s ease", overflow: "auto", background: "#ffffff" }} title="Preview" />
        )}

        {/* Runtime error overlay */}
        {/* Visual Edit Panel */}
        {editMode && selectedElement && (
          <Suspense fallback={null}>
            <EditPanel
              element={selectedElement}
              onEdit={(editPrompt) => { setEditMode(false); setSelectedElement(null); if (onAutoFix) onAutoFix(editPrompt); }}
              onClose={() => setSelectedElement(null)}
            />
          </Suspense>
        )}

        {(runtimeError || autoFixing) && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(6,15,30,0.95)", borderTop: `2px solid ${autoFixing ? C.yellow : C.error}`,
            padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: autoFixing ? C.yellow : C.error }}>
                {autoFixing ? "Auto-debug em andamento..." : "Erro detectado"}
              </span>
              {!autoFixing && <button onClick={() => setRuntimeError(null)} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 14 }}>x</button>}
            </div>
            {autoFixing ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 14, height: 14, border: `2px solid ${C.yellow}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 10, color: C.yellow, fontFamily: DM }}>Corrigindo erro automaticamente... (tentativa {autoFixCount.current}/5)</span>
              </div>
            ) : (
              <>
                <code style={{ fontSize: 10, color: C.textMuted, fontFamily: "'Courier New', monospace", wordBreak: "break-all", lineHeight: 1.4 }}>
                  {runtimeError?.slice(0, 300)}
                </code>
                {onAutoFix && autoFixCount.current < 5 && (
                  <button onClick={handleAutoFix} style={{
                    padding: "6px 12px", background: C.yellow, border: "none", borderRadius: 6,
                    fontSize: 11, fontWeight: 700, color: C.bg, cursor: "pointer", fontFamily: DM,
                    alignSelf: "flex-start",
                  }}>
                    Corrigir manualmente
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <Terminal logs={logs} />

      {showDeploy && (
        <Suspense fallback={null}>
          <DeployModal files={files} projectName={projectName} onClose={() => setShowDeploy(false)} />
        </Suspense>
      )}
      {showGitHub && (
        <Suspense fallback={null}>
          <GitHubSync files={files} projectName={projectName} onClose={() => setShowGitHub(false)} />
        </Suspense>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
