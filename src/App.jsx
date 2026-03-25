import { useState, useRef, useEffect, lazy, Suspense } from "react";
const Sidebar = lazy(() => import("./components/Sidebar"));
const PreviewPanel = lazy(() => import("./components/PreviewPanel"));
const SettingsModal = lazy(() => import("./components/SettingsModal"));
import { C, SYNE, DM, generateFiles } from "./lib/constants";
import { checkLicense, healthCheck } from "./lib/api";
import { pruneProjects, trimProject, safeSetItem, getStorageUsage, MAX_PROJECTS } from "./lib/storage";

function useLS(key, init) {
  const [v, setV] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init; } catch { return init; }
  });
  const set = val => {
    const next = typeof val === "function" ? val(v) : val;
    setV(next);
    try { safeSetItem(key, JSON.stringify(next)); } catch {}
  };
  return [v, set];
}

// ─── LOGIN COM LICENSE KEY ───────────────────────────────────────────────────
function Login({ onLogin }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendUp, setBackendUp] = useState(null); // null=checking, true=up, false=down

  useEffect(() => {
    healthCheck().then(setBackendUp);
  }, []);

  const submit = async () => {
    const trimmed = key.trim();
    if (!trimmed) { setErr("Cole sua license key"); return; }
    if (!trimmed.startsWith("zp_")) { setErr("License key deve comecar com zp_"); return; }

    setLoading(true); setErr("");
    try {
      const status = await checkLicense(trimmed);
      if (!status.valid) {
        setErr("Licenca invalida ou expirada.");
        setLoading(false);
        return;
      }
      // Salva licença e dados do usuário
      localStorage.setItem("zp_license", JSON.stringify(trimmed));
      onLogin({ license: trimmed, ...status });
    } catch {
      setErr("Erro ao verificar licenca. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DM, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize: "48px 48px", opacity: 0.2, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 42, height: 42, background: C.yellow, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 28px rgba(255,208,80,0.3)" }}>
              <span style={{ fontSize: 20, fontWeight: 900, fontFamily: SYNE, color: C.bg }}>Z</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: SYNE, color: C.text, letterSpacing: -1 }}>Zero<span style={{ color: C.yellow }}>.</span></span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: SYNE, color: C.text, margin: "0 0 8px", letterSpacing: -1.5 }}>Zero Preview</h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Crie apps React reais com IA.<br />Preview ao vivo via WebContainer.</p>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 26, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>License Key</div>
          <input
            value={key}
            onChange={e => { setKey(e.target.value); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && !loading && submit()}
            placeholder="zp_xxxxxxxxx_xxxxx"
            autoFocus
            disabled={loading}
            style={{
              display: "block", width: "100%", padding: "11px 13px",
              background: C.bg, border: `1px solid ${err ? C.error : C.border}`,
              borderRadius: 9, fontSize: 13, color: C.text, fontFamily: "'JetBrains Mono', monospace",
              outline: "none", marginBottom: err ? 7 : 14, boxSizing: "border-box",
              letterSpacing: 0.5,
            }}
            onFocus={e => e.target.style.borderColor = C.yellow}
            onBlur={e => e.target.style.borderColor = err ? C.error : C.border}
          />
          {err && <p style={{ color: C.error, fontSize: 11, marginBottom: 12 }}>{err}</p>}
          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: "100%", padding: "12px 0",
              background: loading ? C.yellowDim : C.yellow,
              border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700,
              fontFamily: DM, color: C.bg,
              cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading && <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>&#8635;</span>}
            {loading ? "Verificando..." : "Ativar Licenca"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: backendUp === null ? C.textDim : backendUp ? C.success : C.error }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: backendUp === null ? C.textDim : backendUp ? C.success : C.error, display: "inline-block", animation: backendUp === null ? "pulse 1.4s ease-in-out infinite" : "none" }} />
            {backendUp === null ? "Verificando backend..." : backendUp ? "Backend online" : "Backend offline — tente novamente em breve"}
          </div>
          <p style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>Claude Sonnet via backend seguro</p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const [projects, setProjects] = useLS("zp_projects", []);
  const [activeId, setActiveId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [runId, setRunId] = useState(null);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [thinkSteps, setThinkSteps] = useState([]);
  const [licenseInfo, setLicenseInfo] = useState(user);
  const [streamingCode, setStreamingCode] = useState("");
  const textareaRef = useRef();
  const historyEndRef = useRef();
  const lastGenRef = useRef(0);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth <= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Atualiza info da licença periodicamente
  useEffect(() => {
    const refresh = async () => {
      try {
        const key = JSON.parse(localStorage.getItem("zp_license")) || "";
        if (!key) return;
        const status = await checkLicense(key);
        if (status.valid) setLicenseInfo(prev => ({ ...prev, ...status }));
      } catch {}
    };
    refresh();
    const interval = setInterval(refresh, 60000); // a cada minuto
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!generating) return;
    setThinkSteps([]);
  }, [generating]);

  useEffect(() => { historyEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, generating]);

  const activeProject = projects.find(p => p.id === activeId);
  const hasPreview = !!generatedFiles;

  const handleNew = () => {
    setActiveId(null); setGeneratedFiles(null);
    setPrompt(""); setHistory([]); setError(""); setThinkSteps([]);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleDelete = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeId === id) { setActiveId(null); setGeneratedFiles(null); setPrompt(""); setHistory([]); setThinkSteps([]); }
  };

  const handleSelect = (id) => {
    if (id === activeId) return;
    const p = projects.find(x => x.id === id);
    if (!p) return;
    setActiveId(id); setPrompt("");
    setGeneratedFiles(p.files || null);
    setHistory(p.history || []); setError(""); setThinkSteps([]);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("Digite um prompt para comecar."); return; }
    const now = Date.now();
    if (now - lastGenRef.current < 10000) { setError("Aguarde 10 segundos entre geracoes."); return; }
    lastGenRef.current = now;

    setError(""); setGenerating(true); setThinkSteps([]); setStreamingCode("");

    try {
      const result = await generateFiles(
        prompt,
        (msg) => setThinkSteps(prev => [...prev, msg]),
        generatedFiles?.["src/App.jsx"] || null,
        (_delta, fullText) => setStreamingCode(fullText)
      );

      if (!result?.files?.["src/App.jsx"]) throw new Error("App.jsx nao gerado. Tente novamente.");

      const files = result.files;
      const now = Date.now();
      const newHistory = [...history, { prompt, at: now }];
      const name = prompt.slice(0, 42).trim() + (prompt.length > 42 ? "..." : "");
      const newRunId = `run_${now}`;

      if (activeId) {
        setProjects(prev => prev.map(p => p.id === activeId ? trimProject({ ...p, files, lastPrompt: prompt, history: newHistory, updatedAt: now }) : p));
      } else {
        const np = trimProject({ id: `p_${now}`, name, files, lastPrompt: prompt, history: newHistory, createdAt: now, updatedAt: now });
        setProjects(prev => pruneProjects([np, ...prev]));
        setActiveId(np.id);
      }

      setGeneratedFiles(files);
      setHistory(newHistory);
      setRunId(newRunId);
      setPrompt("");

      // Refresh license info após geração (tokens podem ter mudado)
      try {
        const key = JSON.parse(localStorage.getItem("zp_license")) || "";
        if (key) {
          const status = await checkLicense(key);
          if (status.valid) setLicenseInfo(prev => ({ ...prev, ...status }));
        }
      } catch {}

    } catch (e) {
      if (e.message === "LICENSE_INVALID" || e.message === "LICENSE_EXPIRED") {
        setError("Licenca invalida ou expirada. Faca login novamente.");
        setTimeout(() => onLogout(), 2000);
        return;
      }
      setError(e.message || "Erro ao gerar. Tente novamente.");
    } finally { setGenerating(false); }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: DM, overflow: "hidden" }}>
      {sidebarOpen && (
        <Suspense fallback={null}>
          <div onClick={() => setSidebarOpen(false)} style={{ display: window.innerWidth <= 768 ? "block" : "none", position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} />
          <div style={window.innerWidth <= 768 ? { position: "fixed", zIndex: 100, height: "100vh", top: 0, left: 0 } : {}}>
            <Sidebar
              user={user} projects={projects} activeId={activeId}
              onSelect={(id) => { handleSelect(id); if (window.innerWidth <= 768) setSidebarOpen(false); }}
              onNew={() => { handleNew(); if (window.innerWidth <= 768) setSidebarOpen(false); }}
              onDelete={handleDelete} onLogout={onLogout}
              onSettings={() => setShowSettings(true)}
              generating={generating}
              thinkSteps={thinkSteps}
              licenseInfo={licenseInfo}
              onCloseSidebar={() => setSidebarOpen(false)}
            />
          </div>
        </Suspense>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setSidebarOpen(s => !s)} style={{ background: "none", border: "none", color: C.text, fontSize: 18, cursor: "pointer", marginRight: 8, padding: 0 }}>
              {sidebarOpen ? "\u2715" : "\u2630"}
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: SYNE }}>
              {activeProject ? activeProject.name : "Novo Projeto"}
            </span>
            {hasPreview && (
              <span style={{ fontSize: 10, color: C.success, background: "rgba(52,211,153,0.1)", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.2)" }}>
                React + Vite
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: C.info, background: "rgba(96,165,250,0.1)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(96,165,250,0.2)", fontWeight: 600 }}>
              Claude Sonnet
            </span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Chat */}
          <div style={{ width: hasPreview ? 340 : "100%", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: hasPreview ? `1px solid ${C.border}` : "none", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: hasPreview ? "16px" : "0 20%", display: "flex", flexDirection: "column", justifyContent: history.length === 0 ? "center" : "flex-start", paddingTop: history.length === 0 ? 0 : 16 }}>

              {history.length === 0 && !generating && (
                <div style={{ textAlign: "center", padding: "0 0 32px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 18 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.info, display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: C.info, fontWeight: 600 }}>Claude Sonnet &middot; React + Vite</span>
                  </div>
                  <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: SYNE, color: C.text, margin: "0 0 8px", letterSpacing: -1 }}>O que vamos construir?</h2>
                  <p style={{ fontSize: 13, color: C.textMuted }}>Descreva seu app — a IA gera os arquivos React completos</p>
                </div>
              )}

              {history.map((h, i) => (
                <div key={`hist_${h.at}_${i}`} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                    <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: "12px 12px 2px 12px", padding: "9px 13px", fontSize: 12, color: C.text, maxWidth: "88%", lineHeight: 1.6, fontFamily: DM, whiteSpace: "pre-wrap" }}>{h.prompt}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 20, height: 20, background: C.yellow, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: C.bg, fontFamily: SYNE }}>Z</span>
                    </div>
                    <div style={{ background: "rgba(255,208,80,0.06)", border: "1px solid rgba(255,208,80,0.15)", borderRadius: "2px 12px 12px 12px", padding: "7px 11px", fontSize: 11, color: C.yellow, fontFamily: DM }}>
                      App gerado com sucesso
                    </div>
                  </div>
                </div>
              ))}

              {generating && streamingCode && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                    <div style={{ width: 20, height: 20, background: C.yellow, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: C.bg, fontFamily: SYNE }}>Z</span>
                    </div>
                    <span style={{ fontSize: 11, color: C.yellow, fontWeight: 600 }}>Escrevendo codigo...</span>
                  </div>
                  <pre style={{ background: "#020810", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 10.5, color: "#7A9FBA", fontFamily: "'JetBrains Mono', 'Courier New', monospace", lineHeight: 1.6, maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>
                    {streamingCode.slice(-2000)}<span style={{ background: C.yellow, width: 2, display: "inline-block", animation: "pulse 1s ease-in-out infinite" }}>&nbsp;</span>
                  </pre>
                </div>
              )}

              {error && (
                <div style={{ marginBottom: 12, padding: "9px 13px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 9 }}>
                  <span style={{ fontSize: 11, color: C.error }}>{error}</span>
                </div>
              )}
              <div ref={historyEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "8px 16px 14px", flexShrink: 0 }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                <textarea ref={textareaRef} value={prompt}
                  onChange={e => { setPrompt(e.target.value); setError(""); }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                  disabled={generating}
                  placeholder={history.length === 0 ? "Descreva seu app..." : "Descreva uma alteracao..."}
                  style={{ width: "100%", minHeight: 56, maxHeight: 140, padding: "13px 14px", background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 13, color: C.text, fontFamily: DM, lineHeight: 1.6, boxSizing: "border-box" }}
                />
                <div style={{ padding: "7px 10px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, gap: 8 }}>
                  <span style={{ fontSize: 10, color: C.textDim }}>
                    {licenseInfo?.tokens_used != null
                      ? `${((licenseInfo.tokens_used / 1000) | 0)}k / ${((licenseInfo.tokens_limit / 1000) | 0)}k tokens`
                      : "Claude Sonnet"}
                  </span>
                  <button onClick={handleGenerate} disabled={generating || !prompt.trim()} style={{ padding: "6px 14px", background: generating || !prompt.trim() ? "rgba(255,208,80,0.2)" : C.yellow, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: DM, color: C.bg, cursor: generating || !prompt.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    {generating
                      ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>&#8635;</span>
                      : "Gerar"}
                  </button>
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 10, color: C.textDim, marginTop: 6 }}>Enter para gerar &middot; Shift+Enter nova linha</p>
            </div>
          </div>

          {hasPreview && <Suspense fallback={null}><PreviewPanel files={generatedFiles} runId={runId} onClose={() => { setGeneratedFiles(null); setRunId(null); }} /></Suspense>}
        </div>
      </div>

      {showSettings && <Suspense fallback={null}><SettingsModal licenseInfo={licenseInfo} onClose={() => setShowSettings(false)} onLogout={onLogout} /></Suspense>}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        textarea::placeholder { color: ${C.textDim}; }
        ::selection { background: rgba(255,208,80,0.2); color: ${C.yellow}; }
      `}</style>
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useLS("zp_user", null);

  const handleLogout = () => {
    localStorage.removeItem("zp_license");
    localStorage.removeItem("zp_user");
    setUser(null);
  };

  // Migração: se user antigo (string), força logout
  if (user && typeof user === "string") {
    handleLogout();
    return null;
  }

  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}
