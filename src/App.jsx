import { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import PreviewPanel from "./components/PreviewPanel";
import SettingsModal from "./components/SettingsModal";
import { C, SYNE, DM, generateFiles } from "./lib/constants";
import {
  supabase, signUp, signIn, signOut,
  getProjects, createProject, updateProject, deleteProject
} from "./lib/supabase";

function useLS(key, init) {
  const [v, setV] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init; } catch { return init; }
  });
  const set = val => {
    const next = typeof val === "function" ? val(v) : val;
    setV(next); localStorage.setItem(key, JSON.stringify(next));
  };
  return [v, set];
}

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!email.trim() || !password.trim()) { setErr("Preencha todos os campos"); return; }
    if (mode === "register" && !name.trim()) { setErr("Digite seu nome"); return; }
    setLoading(true); setErr("");
    try {
      if (mode === "register") {
        await signUp(email.trim(), password, name.trim());
        const data = await signIn(email.trim(), password);
        onLogin(data.user);
      } else {
        const data = await signIn(email.trim(), password);
        onLogin(data.user);
      }
    } catch (e) { setErr(e.message || "Erro ao autenticar."); }
    finally { setLoading(false); }
  };

  const inp = {
    display: "block", width: "100%", padding: "11px 13px",
    background: C.bg, border: `1px solid ${C.border}`,
    borderRadius: 9, fontSize: 13, color: C.text, fontFamily: DM,
    outline: "none", marginBottom: 12, boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DM, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize: "48px 48px", opacity: 0.2, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 42, height: 42, background: C.yellow, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 28px rgba(255,208,80,0.3)` }}>
              <span style={{ fontSize: 20, fontWeight: 900, fontFamily: SYNE, color: C.bg }}>Z</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: SYNE, color: C.text, letterSpacing: -1 }}>Zero<span style={{ color: C.yellow }}>.</span></span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: SYNE, color: C.text, margin: "0 0 8px", letterSpacing: -1.5 }}>Zero Preview</h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Crie apps React reais com IA.<br />Preview ao vivo via WebContainer.</p>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 26, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.bg, borderRadius: 10, padding: 4 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: mode === m ? C.surface : "transparent", color: mode === m ? C.text : C.textMuted, fontSize: 13, fontWeight: 600, fontFamily: DM, cursor: "pointer" }}>
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>
          {mode === "register" && <input value={name} onChange={e => { setName(e.target.value); setErr(""); }} placeholder="Seu nome" style={inp} onFocus={e => e.target.style.borderColor = C.yellow} onBlur={e => e.target.style.borderColor = C.border} />}
          <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} placeholder="seu@email.com" style={inp} onFocus={e => e.target.style.borderColor = C.yellow} onBlur={e => e.target.style.borderColor = C.border} />
          <input type="password" value={password} onChange={e => { setPassword(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && submit()} placeholder="Senha" style={{ ...inp, marginBottom: err ? 8 : 16 }} onFocus={e => e.target.style.borderColor = C.yellow} onBlur={e => e.target.style.borderColor = C.border} />
          {err && <p style={{ color: C.error, fontSize: 11, marginBottom: 14 }}>{err}</p>}
          <button onClick={submit} disabled={loading} style={{ width: "100%", padding: "12px 0", background: loading ? "rgba(255,208,80,0.4)" : C.yellow, border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, fontFamily: DM, color: C.bg, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Aguarde..." : mode === "login" ? "Entrar →" : "Criar conta →"}
          </button>
        </div>
        <p style={{ textAlign: "center", marginTop: 14, fontSize: 10, color: C.textDim }}>Powered by Gemini 2.5 Flash · Claude Sonnet · WebContainer API</p>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [runId, setRunId] = useState(null);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [thinkMsg, setThinkMsg] = useState("");
  const [model, setModel] = useLS("zp_model", "gemini");
  const textareaRef = useRef();
  const historyEndRef = useRef();

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";

  const getKeys = () => ({
    gemini: (() => { try { return JSON.parse(localStorage.getItem("zp_gemini_key")) || ""; } catch { return ""; } })(),
    claude: (() => { try { return JSON.parse(localStorage.getItem("zp_claude_key")) || ""; } catch { return ""; } })(),
    deepseek: (() => { try { return JSON.parse(localStorage.getItem("zp_deepseek_key")) || ""; } catch { return ""; } })(),
    grok: (() => { try { return JSON.parse(localStorage.getItem("zp_grok_key")) || ""; } catch { return ""; } })(),
  });

  const THINK_MSGS = ["Analisando seu prompt...", "Planejando a arquitetura React...", "Gerando componentes e sidebar...", "Criando dados mockados brasileiros...", "Montando KPIs e gráficos SVG...", "Aplicando design premium...", "Finalizando os arquivos..."];

  useEffect(() => {
    loadProjects();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") onLogout();
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!generating) return;
    let i = 0; setThinkMsg(THINK_MSGS[0]);
    const iv = setInterval(() => { i = (i + 1) % THINK_MSGS.length; setThinkMsg(THINK_MSGS[i]); }, 2500);
    return () => clearInterval(iv);
  }, [generating]);

  useEffect(() => { historyEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, generating]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await getProjects(user.id);
      setProjects(data);
    } catch (e) { console.error("Erro ao carregar projetos:", e); }
    finally { setLoadingProjects(false); }
  };

  const activeProject = projects.find(p => p.id === activeId);
  const hasPreview = !!generatedFiles;

  const handleNew = () => {
    setActiveId(null); setGeneratedFiles(null);
    setPrompt(""); setHistory([]); setError("");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleDelete = async (id) => {
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeId === id) { setActiveId(null); setGeneratedFiles(null); setPrompt(""); setHistory([]); }
    } catch (e) { setError("Erro ao deletar projeto."); }
  };

  const handleSelect = async (id) => {
    if (id === activeId) return;
    const p = projects.find(x => x.id === id);
    if (!p) return;
    setActiveId(id);
    setPrompt("");
    setHistory(p.history || []);
    setError("");
    if (p.files && Object.keys(p.files).length > 0) {
      setGeneratedFiles(p.files);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("Digite um prompt para começar."); return; }
    const keys = getKeys();
    const key = model === "claude" ? keys.claude : keys.gemini;
    if (!key) { setShowSettings(true); setError(`Configure sua chave ${model === "claude" ? "Claude" : "Gemini"} primeiro.`); return; }

    setError(""); setGenerating(true);

    try {
      const result = await generateFiles(
        prompt, key, model,
        (msg, type) => setThinkMsg(msg),
        generatedFiles?.["src/App.jsx"] || null // contexto para iteração
      );

      if (!result?.files?.["src/App.jsx"]) throw new Error("App.jsx não gerado. Tente novamente.");

      const files = result.files;
      const now = new Date().toISOString();
      const newHistory = [...history, { prompt, at: now }];
      const name = prompt.slice(0, 42).trim() + (prompt.length > 42 ? "…" : "");
      const newRunId = `run_${Date.now()}`;

      let savedProject;
      if (activeId) {
        savedProject = await updateProject(activeId, { files, lastPrompt: prompt, history: newHistory, name });
        setProjects(prev => prev.map(p => p.id === activeId ? { ...p, ...savedProject } : p));
      } else {
        savedProject = await createProject({ userId: user.id, name, files, lastPrompt: prompt, history: newHistory });
        setProjects(prev => [savedProject, ...prev]);
        setActiveId(savedProject.id);
      }

      setGeneratedFiles(files);
      setHistory(newHistory);
      setRunId(newRunId);
      setPrompt("");

    } catch (e) { setError(e.message || "Erro ao gerar. Verifique sua chave."); }
    finally { setGenerating(false); }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: DM, overflow: "hidden" }}>
      <Sidebar user={userName} projects={projects} activeId={activeId} onSelect={handleSelect} onNew={handleNew} onDelete={handleDelete} onLogout={handleLogout} onSettings={() => setShowSettings(true)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: SYNE }}>{activeProject ? activeProject.name : "Novo Projeto"}</span>
            {hasPreview && <span style={{ fontSize: 10, color: C.success, background: "rgba(52,211,153,0.1)", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.2)" }}>● React + Vite</span>}
          </div>
          {!getKeys()[model] && (
            <button onClick={() => setShowSettings(true)} style={{ padding: "5px 12px", background: "rgba(248,113,113,0.1)", border: `1px solid ${C.error}`, borderRadius: 6, fontSize: 11, color: C.error, cursor: "pointer", fontFamily: DM }}>
              ⚠ Configurar chave {model === "claude" ? "Claude" : "Gemini"}
            </button>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ width: hasPreview ? 340 : "100%", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: hasPreview ? `1px solid ${C.border}` : "none", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: hasPreview ? "16px" : "0 20%", display: "flex", flexDirection: "column", justifyContent: history.length === 0 ? "center" : "flex-start", paddingTop: history.length === 0 ? 0 : 16 }}>
              {history.length === 0 && (
                <div style={{ textAlign: "center", padding: "0 0 32px" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: model === "claude" ? "rgba(204,120,92,0.1)" : "rgba(66,133,244,0.08)",
                    border: `1px solid ${model === "claude" ? "rgba(204,120,92,0.3)" : "rgba(66,133,244,0.3)"}`,
                    borderRadius: 20, padding: "5px 14px", marginBottom: 18,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: model === "claude" ? "#CC785C" : "#4285F4", display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: model === "claude" ? "#CC785C" : "#4285F4", fontWeight: 600 }}>
                      {model === "claude" ? "◆ Claude Sonnet" : "✦ Gemini 2.5 Flash"} · React + Vite
                    </span>
                  </div>
                  <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: SYNE, color: C.text, margin: "0 0 8px", letterSpacing: -1 }}>O que vamos construir?</h2>
                  <p style={{ fontSize: 13, color: C.textMuted }}>Descreva seu app — a IA gera os arquivos React completos</p>
                </div>
              )}

              {history.map((h, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                    <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: "12px 12px 2px 12px", padding: "9px 13px", fontSize: 12, color: C.text, maxWidth: "88%", lineHeight: 1.6, fontFamily: DM, whiteSpace: "pre-wrap" }}>{h.prompt}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 20, height: 20, background: C.yellow, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: C.bg, fontFamily: SYNE }}>Z</span>
                    </div>
                    <div style={{ background: "rgba(255,208,80,0.06)", border: `1px solid rgba(255,208,80,0.15)`, borderRadius: "2px 12px 12px 12px", padding: "7px 11px", fontSize: 11, color: C.yellow, fontFamily: DM }}>✓ App gerado com sucesso</div>
                  </div>
                </div>
              ))}

              {generating && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                  <div style={{ width: 20, height: 20, background: C.yellow, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: C.bg, fontFamily: SYNE }}>Z</span>
                  </div>
                  <div style={{ background: "rgba(255,208,80,0.06)", border: `1px solid rgba(255,208,80,0.15)`, borderRadius: "2px 12px 12px 12px", padding: "7px 11px", fontSize: 11, color: C.yellow, fontFamily: DM, display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.yellow, animation: "pulse 1.4s ease-in-out infinite", display: "inline-block" }} />
                    {thinkMsg}
                  </div>
                </div>
              )}

              {error && <div style={{ marginBottom: 12, padding: "9px 13px", background: "rgba(248,113,113,0.08)", border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 9 }}><span style={{ fontSize: 11, color: C.error }}>{error}</span></div>}
              <div ref={historyEndRef} />
            </div>

            <div style={{ padding: "8px 16px 14px", flexShrink: 0 }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                <textarea ref={textareaRef} value={prompt} onChange={e => { setPrompt(e.target.value); setError(""); }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                  disabled={generating}
                  placeholder={history.length === 0 ? "Descreva seu app..." : "Descreva uma alteração..."}
                  style={{ width: "100%", minHeight: 56, maxHeight: 140, padding: "13px 14px", background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 13, color: C.text, fontFamily: DM, lineHeight: 1.6, boxSizing: "border-box" }} />
                <div style={{ padding: "7px 10px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setModel("gemini")} style={{
                      padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      fontFamily: DM, cursor: "pointer", transition: "all 0.2s",
                      background: model === "gemini" ? "linear-gradient(135deg, #4285F4, #34A853)" : "transparent",
                      border: model === "gemini" ? "none" : `1px solid ${C.border}`,
                      color: model === "gemini" ? "#fff" : C.textMuted,
                      boxShadow: model === "gemini" ? "0 2px 8px rgba(66,133,244,0.4)" : "none",
                    }}>
                      <span style={{ marginRight: 5 }}>✦</span>Gemini
                    </button>
                    <button onClick={() => setModel("claude")} style={{
                      padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      fontFamily: DM, cursor: "pointer", transition: "all 0.2s",
                      background: model === "claude" ? "linear-gradient(135deg, #CC785C, #D4875A)" : "transparent",
                      border: model === "claude" ? "none" : `1px solid ${C.border}`,
                      color: model === "claude" ? "#fff" : C.textMuted,
                      boxShadow: model === "claude" ? "0 2px 8px rgba(204,120,92,0.4)" : "none",
                    }}>
                      <span style={{ marginRight: 5 }}>◆</span>Claude
                    </button>
                    <button onClick={() => setModel("deepseek")} style={{
                      padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      fontFamily: DM, cursor: "pointer", transition: "all 0.2s",
                      background: model === "deepseek" ? "linear-gradient(135deg, #0066FF, #00C2FF)" : "transparent",
                      border: model === "deepseek" ? "none" : `1px solid ${C.border}`,
                      color: model === "deepseek" ? "#fff" : C.textMuted,
                      boxShadow: model === "deepseek" ? "0 2px 8px rgba(0,102,255,0.4)" : "none",
                    }}>
                      <span style={{ marginRight: 5 }}>🐋</span>DeepSeek
                    </button>
                    <button onClick={() => setModel("grok")} style={{
                      padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      fontFamily: DM, cursor: "pointer", transition: "all 0.2s",
                      background: model === "grok" ? "linear-gradient(135deg, #000000, #333333)" : "transparent",
                      border: model === "grok" ? "none" : `1px solid ${C.border}`,
                      color: model === "grok" ? "#fff" : C.textMuted,
                      boxShadow: model === "grok" ? "0 2px 8px rgba(0,0,0,0.5)" : "none",
                    }}>
                      <span style={{ marginRight: 5 }}>𝕏</span>Grok
                    </button>
                  </div>
                  <button onClick={handleGenerate} disabled={generating || !prompt.trim()} style={{ padding: "6px 14px", background: generating || !prompt.trim() ? "rgba(255,208,80,0.2)" : C.yellow, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: DM, color: C.bg, cursor: generating || !prompt.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    {generating ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span> : "⚡ Gerar"}
                  </button>
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 10, color: C.textDim, marginTop: 6 }}>Enter para gerar · Shift+Enter nova linha</p>
            </div>
          </div>

          {hasPreview && <PreviewPanel files={generatedFiles} runId={runId} onClose={() => { setGeneratedFiles(null); setRunId(null); }} />}
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

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#060F1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #1A2E45", borderTopColor: "#FFD050", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
