import { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import PreviewPanel from "./components/PreviewPanel";
import SettingsModal from "./components/SettingsModal";
import { C, SYNE, DM, callGemini, callClaude, callDeepSeek, reformulatePrompt } from "./lib/constants";

// ─── useLocalStorage ────────────────────────────────────────────────────────
function useLS(key, init) {
  const [v, setV] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init; } catch { return init; }
  });
  const set = val => {
    const next = typeof val === "function" ? val(v) : val;
    setV(next);
    localStorage.setItem(key, JSON.stringify(next));
  };
  return [v, set];
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!name.trim()) { setErr("Digite seu nome"); return; }
    onLogin(name.trim());
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: DM,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
        backgroundSize: "48px 48px", opacity: 0.2, pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 42, height: 42, background: C.yellow, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 28px rgba(255,208,80,0.3)`,
            }}>
              <span style={{ fontSize: 20, fontWeight: 900, fontFamily: SYNE, color: C.bg }}>Z</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: SYNE, color: C.text, letterSpacing: -1 }}>
              Zero<span style={{ color: C.yellow }}>.</span>
            </span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: SYNE, color: C.text, margin: "0 0 8px", letterSpacing: -1.5 }}>
            Zero Preview
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
            Crie apps React reais com IA.<br />Preview ao vivo via WebContainer.
          </p>
        </div>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 18, padding: 26, boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
            Seu nome
          </div>
          <input
            value={name} onChange={e => { setName(e.target.value); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Como podemos te chamar?"
            autoFocus
            style={{
              display: "block", width: "100%", padding: "11px 13px",
              background: C.bg, border: `1px solid ${err ? C.error : C.border}`,
              borderRadius: 9, fontSize: 13, color: C.text, fontFamily: DM,
              outline: "none", marginBottom: err ? 7 : 14, boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = C.yellow}
            onBlur={e => e.target.style.borderColor = err ? C.error : C.border}
          />
          {err && <p style={{ color: C.error, fontSize: 11, marginBottom: 12 }}>{err}</p>}
          <button onClick={submit} style={{
            width: "100%", padding: "12px 0", background: C.yellow,
            border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700,
            fontFamily: DM, color: C.bg, cursor: "pointer", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.background = "#FFD966"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.background = C.yellow; }}
          >
            Entrar no Zero Preview
          </button>
        </div>
        <p style={{ textAlign: "center", marginTop: 14, fontSize: 10, color: C.textDim }}>
          Powered by Gemini · Claude · DeepSeek · WebContainer API
        </p>
      </div>
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
  const [thinkMsg, setThinkMsg] = useState("");
  const [model, setModel] = useLS("zp_model", "gemini"); // gemini | claude | deepseek
  const textareaRef = useRef();
  const historyEndRef = useRef();

  const getKeys = () => ({
    gemini: (() => { try { return JSON.parse(localStorage.getItem("zp_gemini_key")) || ""; } catch { return ""; } })(),
    claude: (() => { try { return JSON.parse(localStorage.getItem("zp_claude_key")) || ""; } catch { return ""; } })(),
    deepseek: (() => { try { return JSON.parse(localStorage.getItem("zp_deepseek_key")) || ""; } catch { return ""; } })(),
  });

  const MODELS = [
    { id: "gemini", label: "Gemini" },
    { id: "claude", label: "Claude" },
    { id: "deepseek", label: "DeepSeek" },
  ];

  const THINK_MSGS = [
    "Entendendo suas intencoes...",
    "Arquitetando o projeto...",
    "Planejando componentes e modulos...",
    "Gerando estrutura React...",
    "Criando dados brasileiros realistas...",
    "Montando KPIs e graficos Recharts...",
    "Aplicando design premium ao nicho...",
    "Finalizando os arquivos...",
  ];

  useEffect(() => {
    if (!generating) return;
    let i = 0;
    setThinkMsg(THINK_MSGS[0]);
    const iv = setInterval(() => { i = (i + 1) % THINK_MSGS.length; setThinkMsg(THINK_MSGS[i]); }, 2500);
    return () => clearInterval(iv);
  }, [generating]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, generating]);

  const activeProject = projects.find(p => p.id === activeId);
  const hasPreview = !!generatedFiles;

  const handleNew = () => {
    setActiveId(null);
    setGeneratedFiles(null);
    setPrompt("");
    setHistory([]);
    setError("");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleDelete = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setGeneratedFiles(null);
      setPrompt("");
      setHistory([]);
    }
  };

  const handleSelect = (id) => {
    if (id === activeId) return;
    const p = projects.find(x => x.id === id);
    if (!p) return;
    setActiveId(id);
    setPrompt("");
    setGeneratedFiles(p.files || null);
    setHistory(p.history || []);
    setError("");
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("Digite um prompt para comecar."); return; }
    const keys = getKeys();
    const key = keys[model];
    if (!key) { setShowSettings(true); setError(`Configure sua chave ${model === "claude" ? "Claude" : model === "deepseek" ? "DeepSeek" : "Gemini"} primeiro.`); return; }

    setError("");
    setGenerating(true);

    try {
      // 1. Reformulador oculto
      const enrichedPrompt = await reformulatePrompt(prompt, key, model);

      // 2. Geracao do app
      let parsed;
      if (model === "claude") parsed = await callClaude(enrichedPrompt, key);
      else if (model === "deepseek") parsed = await callDeepSeek(enrichedPrompt, key);
      else parsed = await callGemini(enrichedPrompt, key);

      if (!parsed?.files?.["src/App.jsx"]) throw new Error("Arquivo App.jsx nao gerado. Tente novamente.");

      const files = parsed.files;
      const now = Date.now();
      const newHistory = [...history, { prompt, at: now }];
      const name = prompt.slice(0, 42).trim() + (prompt.length > 42 ? "..." : "");
      const newRunId = `run_${now}`;

      if (activeId) {
        setProjects(prev => prev.map(p => p.id === activeId
          ? { ...p, files, lastPrompt: prompt, history: newHistory, updatedAt: now }
          : p
        ));
      } else {
        const np = { id: `p_${now}`, name, files, lastPrompt: prompt, history: newHistory, createdAt: now, updatedAt: now };
        setProjects(prev => [np, ...prev]);
        setActiveId(np.id);
      }

      setGeneratedFiles(files);
      setHistory(newHistory);
      setRunId(newRunId);
      setPrompt("");

    } catch (e) {
      setError(e.message || "Erro ao gerar. Verifique sua chave.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: DM, overflow: "hidden" }}>
      <Sidebar
        user={user} projects={projects} activeId={activeId}
        onSelect={handleSelect} onNew={handleNew}
        onDelete={handleDelete} onLogout={onLogout}
        onSettings={() => setShowSettings(true)}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{
          height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: SYNE }}>
              {activeProject ? activeProject.name : "Novo Projeto"}
            </span>
            {hasPreview && (
              <span style={{ fontSize: 10, color: C.success, background: "rgba(52,211,153,0.1)", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.2)" }}>
                React + Vite
              </span>
            )}
          </div>
          {!getKeys()[model] && (
            <button onClick={() => setShowSettings(true)} style={{
              padding: "5px 12px", background: "rgba(248,113,113,0.1)",
              border: `1px solid ${C.error}`, borderRadius: 6,
              fontSize: 11, color: C.error, cursor: "pointer", fontFamily: DM,
            }}>
              Configurar chave {model === "claude" ? "Claude" : model === "deepseek" ? "DeepSeek" : "Gemini"}
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Area de chat */}
          <div style={{
            width: hasPreview ? 340 : "100%", flexShrink: 0,
            display: "flex", flexDirection: "column",
            borderRight: hasPreview ? `1px solid ${C.border}` : "none",
            overflow: "hidden",
          }}>
            {/* Historico */}
            <div style={{
              flex: 1, overflowY: "auto", padding: hasPreview ? "16px" : "0 20%",
              display: "flex", flexDirection: "column",
              justifyContent: history.length === 0 ? "center" : "flex-start",
              paddingTop: history.length === 0 ? 0 : 16,
            }}>
              {history.length === 0 && (
                <div style={{ textAlign: "center", padding: "0 0 32px" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "rgba(255,208,80,0.06)", border: `1px solid rgba(255,208,80,0.2)`,
                    borderRadius: 20, padding: "5px 14px", marginBottom: 18,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.yellow, display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: C.yellow, fontWeight: 600 }}>Gemini · Claude · DeepSeek · React + Vite</span>
                  </div>
                  <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: SYNE, color: C.text, margin: "0 0 8px", letterSpacing: -1 }}>
                    O que vamos construir?
                  </h2>
                  <p style={{ fontSize: 13, color: C.textMuted }}>
                    Descreva seu app - a IA gera os arquivos React completos
                  </p>
                </div>
              )}

              {history.map((h, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                    <div style={{
                      background: C.surface2, border: `1px solid ${C.border}`,
                      borderRadius: "12px 12px 2px 12px", padding: "9px 13px",
                      fontSize: 12, color: C.text, maxWidth: "88%",
                      lineHeight: 1.6, fontFamily: DM, whiteSpace: "pre-wrap",
                    }}>
                      {h.prompt}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{
                      width: 20, height: 20, background: C.yellow, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: C.bg, fontFamily: SYNE }}>Z</span>
                    </div>
                    <div style={{
                      background: "rgba(255,208,80,0.06)", border: `1px solid rgba(255,208,80,0.15)`,
                      borderRadius: "2px 12px 12px 12px", padding: "7px 11px",
                      fontSize: 11, color: C.yellow, fontFamily: DM,
                    }}>
                      App gerado com sucesso
                    </div>
                  </div>
                </div>
              ))}

              {generating && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                  <div style={{
                    width: 20, height: 20, background: C.yellow, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: C.bg, fontFamily: SYNE }}>Z</span>
                  </div>
                  <div style={{
                    background: "rgba(255,208,80,0.06)", border: `1px solid rgba(255,208,80,0.15)`,
                    borderRadius: "2px 12px 12px 12px", padding: "7px 11px",
                    fontSize: 11, color: C.yellow, fontFamily: DM,
                    display: "flex", alignItems: "center", gap: 7,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.yellow, animation: "pulse 1.4s ease-in-out infinite", display: "inline-block" }} />
                    {thinkMsg}
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  marginBottom: 12, padding: "9px 13px",
                  background: "rgba(248,113,113,0.08)", border: `1px solid rgba(248,113,113,0.3)`,
                  borderRadius: 9,
                }}>
                  <span style={{ fontSize: 11, color: C.error }}>{error}</span>
                </div>
              )}
              <div ref={historyEndRef} />
            </div>

            {/* Input fixo embaixo */}
            <div style={{ padding: "8px 16px 14px", flexShrink: 0 }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={e => { setPrompt(e.target.value); setError(""); }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); }
                  }}
                  disabled={generating}
                  placeholder={history.length === 0 ? "Descreva seu app..." : "Descreva uma alteracao..."}
                  style={{
                    width: "100%", minHeight: 56, maxHeight: 140,
                    padding: "13px 14px", background: "transparent",
                    border: "none", outline: "none", resize: "none",
                    fontSize: 13, color: C.text, fontFamily: DM,
                    lineHeight: 1.6, boxSizing: "border-box",
                  }}
                />
                <div style={{
                  padding: "7px 10px", borderTop: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: C.bg,
                }}>
                  {/* Model toggle */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {MODELS.map(m => (
                      <button key={m.id} onClick={() => setModel(m.id)} style={{
                        padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        fontFamily: DM, cursor: "pointer", transition: "all 0.2s",
                        background: model === m.id ? C.yellow : "transparent",
                        border: model === m.id ? "none" : `1px solid ${C.border}`,
                        color: model === m.id ? C.bg : C.textMuted,
                      }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !prompt.trim()}
                    style={{
                      padding: "6px 14px",
                      background: generating || !prompt.trim() ? "rgba(255,208,80,0.2)" : C.yellow,
                      border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700,
                      fontFamily: DM, color: C.bg,
                      cursor: generating || !prompt.trim() ? "not-allowed" : "pointer",
                      transition: "all 0.2s", display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    {generating
                      ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>...</span>
                      : "Gerar"}
                  </button>
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 10, color: C.textDim, marginTop: 6 }}>
                Enter para gerar · Shift+Enter nova linha
              </p>
            </div>
          </div>

          {/* Preview */}
          {hasPreview && (
            <PreviewPanel
              files={generatedFiles}
              runId={runId}
              onClose={() => { setGeneratedFiles(null); setRunId(null); }}
            />
          )}
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

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

// ─── ROOT ────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useLS("zp_user", null);

  if (user && typeof user === "object") {
    localStorage.removeItem("zp_user");
    return null;
  }

  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
