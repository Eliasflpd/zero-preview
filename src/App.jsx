import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const COLORS = {
  bg: "#060F1E",
  surface: "#0D1B2E",
  surfaceHover: "#112238",
  border: "#1A2E45",
  borderHover: "#243F5E",
  yellow: "#FFD050",
  yellowDim: "#CC9F20",
  yellowGlow: "rgba(255, 208, 80, 0.15)",
  yellowGlow2: "rgba(255, 208, 80, 0.08)",
  text: "#E8F0F8",
  textMuted: "#6B8BAA",
  textDim: "#3A5470",
  success: "#34D399",
  error: "#F87171",
  purple: "#7C3AED",
};

const SYNE = "'Syne', sans-serif";
const DM = "'DM Sans', sans-serif";

const SYSTEM_PROMPT = `Você é um gerador de aplicações web de nível PROFISSIONAL. Crie APENAS código HTML completo e funcional em um único arquivo.

OBRIGATÓRIO em toda geração:
- Sidebar lateral real com navegação entre páginas (Dashboard, Relatórios, Clientes, Configurações etc.)
- KPIs no topo com números animados ao carregar (countUp em JS puro)
- Pelo menos 2 gráficos animados com CSS ou Chart.js via CDN
- Navegação FUNCIONAL — cada item da sidebar troca o conteúdo principal
- Dados mockados realistas (nomes, valores, datas brasileiras)
- Design escuro premium (fundo #0A0F1E, cards com glassmorphism, bordas sutis)
- Tipografia: fonte do Google Fonts carregada via @import
- Micro-animações: hover nos cards, transições suaves, loading states
- Tabelas com dados reais e paginação visual
- Qualidade igual ao Lovable, Linear, Vercel Dashboard

PROIBIDO:
- Código placeholder ou comentários "adicione aqui"
- Componentes vazios ou sem dados
- Design genérico sem personalidade
- Sidebar sem funcionalidade real

Retorne SOMENTE o código HTML completo, começando com <!DOCTYPE html>. Sem explicações, sem markdown, sem backticks.`;

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });
  const set = (v) => {
    const next = typeof v === "function" ? v(val) : v;
    setVal(next);
    localStorage.setItem(key, JSON.stringify(next));
  };
  return [val, set];
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("welcome"); // welcome | login | register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) { setError("Digite seu nome"); return; }
    onLogin({ name: name.trim(), email: email.trim() || `${name.toLowerCase().replace(/\s/g,"")}@zero.app` });
  };

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: DM, position: "relative", overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${COLORS.border} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px)`,
        backgroundSize: "48px 48px", opacity: 0.3,
      }} />
      {/* Glow blobs */}
      <div style={{
        position: "absolute", width: 600, height: 600,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(255,208,80,0.06) 0%, transparent 70%)",
        top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 420,
        padding: "0 24px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            marginBottom: 24,
          }}>
            <div style={{
              width: 44, height: 44, background: COLORS.yellow,
              borderRadius: 10, display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: `0 0 32px ${COLORS.yellowGlow}`,
            }}>
              <span style={{ fontSize: 22, fontWeight: 900, fontFamily: SYNE, color: COLORS.bg }}>Z</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, fontFamily: SYNE, color: COLORS.text, letterSpacing: -1 }}>
              Zero<span style={{ color: COLORS.yellow }}>.</span>
            </span>
          </div>
          <h1 style={{
            fontSize: 38, fontWeight: 800, fontFamily: SYNE,
            color: COLORS.text, margin: "0 0 12px", letterSpacing: -1.5,
            lineHeight: 1.1,
          }}>
            Zero Preview
          </h1>
          <p style={{ fontSize: 16, color: COLORS.textMuted, margin: 0, lineHeight: 1.6 }}>
            Crie aplicações reais com IA.<br />Do prompt ao produto.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`,
          borderRadius: 20, padding: 32,
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          {mode === "welcome" ? (
            <>
              <p style={{ fontSize: 13, color: COLORS.textMuted, textAlign: "center", marginBottom: 24, marginTop: 0 }}>
                Comece a construir seu próximo projeto
              </p>
              <button
                onClick={() => setMode("login")}
                style={{
                  width: "100%", padding: "14px 0", background: COLORS.yellow,
                  border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700,
                  fontFamily: DM, color: COLORS.bg, cursor: "pointer", marginBottom: 12,
                  transition: "all 0.2s", letterSpacing: 0.2,
                }}
                onMouseEnter={e => { e.target.style.background = "#FFD966"; e.target.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.target.style.background = COLORS.yellow; e.target.style.transform = "translateY(0)"; }}
              >
                Entrar
              </button>
              <button
                onClick={() => setMode("register")}
                style={{
                  width: "100%", padding: "14px 0",
                  background: "transparent", border: `1px solid ${COLORS.border}`,
                  borderRadius: 12, fontSize: 15, fontWeight: 600,
                  fontFamily: DM, color: COLORS.text, cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.target.style.borderColor = COLORS.yellow; e.target.style.color = COLORS.yellow; }}
                onMouseLeave={e => { e.target.style.borderColor = COLORS.border; e.target.style.color = COLORS.text; }}
              >
                Criar conta
              </button>
            </>
          ) : (
            <>
              <h3 style={{
                fontFamily: SYNE, fontSize: 18, fontWeight: 700,
                color: COLORS.text, margin: "0 0 24px",
              }}>
                {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
              </h3>
              <label style={{ display: "block", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Seu nome
                </span>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="Como podemos te chamar?"
                  style={{
                    display: "block", width: "100%", marginTop: 8,
                    padding: "12px 14px", background: COLORS.bg,
                    border: `1px solid ${error ? COLORS.error : COLORS.border}`,
                    borderRadius: 10, fontSize: 14, color: COLORS.text,
                    fontFamily: DM, outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = COLORS.yellow}
                  onBlur={e => e.target.style.borderColor = error ? COLORS.error : COLORS.border}
                  autoFocus
                />
              </label>
              {error && <p style={{ color: COLORS.error, fontSize: 12, margin: "-8px 0 12px" }}>{error}</p>}
              <button
                onClick={handleSubmit}
                style={{
                  width: "100%", padding: "14px 0", background: COLORS.yellow,
                  border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700,
                  fontFamily: DM, color: COLORS.bg, cursor: "pointer", marginBottom: 12,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.target.style.background = "#FFD966"; e.target.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.target.style.background = COLORS.yellow; e.target.style.transform = "translateY(0)"; }}
              >
                {mode === "login" ? "Entrar" : "Criar conta"}
              </button>
              <button
                onClick={() => { setMode("welcome"); setError(""); }}
                style={{
                  width: "100%", background: "none", border: "none",
                  color: COLORS.textMuted, fontSize: 13, cursor: "pointer",
                  fontFamily: DM, padding: "8px 0",
                }}
              >
                ← Voltar
              </button>
            </>
          )}
        </div>
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: COLORS.textDim }}>
          Powered by Gemini 2.5 Flash · Zero Preview
        </p>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ user, projects, activeProject, onSelectProject, onNewProject, onLogout, onOpenSettings }) {
  return (
    <div style={{
      width: 240, minWidth: 240, background: COLORS.surface,
      borderRight: `1px solid ${COLORS.border}`, display: "flex",
      flexDirection: "column", height: "100vh", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{
        padding: "20px 16px 16px", borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, background: COLORS.yellow,
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 16px ${COLORS.yellowGlow}`,
        }}>
          <span style={{ fontSize: 16, fontWeight: 900, fontFamily: SYNE, color: COLORS.bg }}>Z</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, fontFamily: SYNE, color: COLORS.text, letterSpacing: -0.5 }}>
          Zero<span style={{ color: COLORS.yellow }}>.</span>
        </span>
      </div>

      {/* User */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.yellow}, ${COLORS.yellowDim})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: COLORS.bg, fontFamily: SYNE,
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, truncate: true, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>Free Plan</div>
          </div>
        </div>
      </div>

      {/* New project button */}
      <div style={{ padding: "12px 12px 8px" }}>
        <button
          onClick={onNewProject}
          style={{
            width: "100%", padding: "10px 14px",
            background: COLORS.yellowGlow2, border: `1px solid rgba(255,208,80,0.2)`,
            borderRadius: 10, fontSize: 13, fontWeight: 600, color: COLORS.yellow,
            cursor: "pointer", fontFamily: DM, display: "flex", alignItems: "center",
            gap: 8, transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = COLORS.yellowGlow; e.currentTarget.style.borderColor = "rgba(255,208,80,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = COLORS.yellowGlow2; e.currentTarget.style.borderColor = "rgba(255,208,80,0.2)"; }}
        >
          <span style={{ fontSize: 16 }}>+</span> Novo Projeto
        </button>
      </div>

      {/* Projects list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.textDim, letterSpacing: 1, textTransform: "uppercase", padding: "8px 4px 6px" }}>
          Projetos ({projects.length})
        </div>
        {projects.length === 0 && (
          <div style={{ fontSize: 12, color: COLORS.textDim, padding: "8px 4px", fontStyle: "italic" }}>
            Nenhum projeto ainda
          </div>
        )}
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => onSelectProject(p.id)}
            style={{
              width: "100%", textAlign: "left", padding: "9px 10px",
              background: activeProject === p.id ? COLORS.yellowGlow2 : "transparent",
              border: activeProject === p.id ? `1px solid rgba(255,208,80,0.2)` : "1px solid transparent",
              borderRadius: 8, cursor: "pointer", marginBottom: 2, transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (activeProject !== p.id) e.currentTarget.style.background = COLORS.surfaceHover; }}
            onMouseLeave={e => { if (activeProject !== p.id) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: activeProject === p.id ? COLORS.yellow : COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: DM }}>
              {p.name}
            </div>
            <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>
              {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
            </div>
          </button>
        ))}
      </div>

      {/* Bottom actions */}
      <div style={{ padding: "12px", borderTop: `1px solid ${COLORS.border}` }}>
        <button
          onClick={onOpenSettings}
          style={{
            width: "100%", padding: "9px 12px", background: "transparent",
            border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12,
            color: COLORS.textMuted, cursor: "pointer", fontFamily: DM,
            marginBottom: 6, transition: "all 0.2s", textAlign: "left",
            display: "flex", alignItems: "center", gap: 8,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderHover; e.currentTarget.style.color = COLORS.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textMuted; }}
        >
          ⚙ Configurações
        </button>
        <button
          onClick={onLogout}
          style={{
            width: "100%", padding: "9px 12px", background: "transparent",
            border: "1px solid transparent", borderRadius: 8, fontSize: 12,
            color: COLORS.textMuted, cursor: "pointer", fontFamily: DM,
            transition: "all 0.2s", textAlign: "left",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = COLORS.error; }}
          onMouseLeave={e => { e.currentTarget.style.color = COLORS.textMuted; }}
        >
          ↩ Sair
        </button>
      </div>
    </div>
  );
}

// ─── SETTINGS MODAL ──────────────────────────────────────────────────────────
function SettingsModal({ onClose }) {
  const [key, setKey] = useLocalStorage("zp_gemini_key", "");
  const [inputKey, setInputKey] = useState(key);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setKey(inputKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(6,15,30,0.85)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 20, padding: 32, width: 460, boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 700, color: COLORS.text, margin: 0 }}>
            Configurações
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 20, cursor: "pointer" }}>×</button>
        </div>

        <label>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
            Chave Gemini API
          </div>
          <input
            type="password"
            value={inputKey}
            onChange={e => setInputKey(e.target.value)}
            placeholder="AIza..."
            style={{
              display: "block", width: "100%", padding: "12px 14px",
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              borderRadius: 10, fontSize: 14, color: COLORS.text,
              fontFamily: DM, outline: "none", boxSizing: "border-box", marginBottom: 8,
            }}
            onFocus={e => e.target.style.borderColor = COLORS.yellow}
            onBlur={e => e.target.style.borderColor = COLORS.border}
          />
          <p style={{ fontSize: 11, color: COLORS.textDim, margin: "0 0 20px" }}>
            Sua chave fica salva localmente. Obtenha em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: COLORS.yellow }}>aistudio.google.com</a>
          </p>
        </label>

        <button
          onClick={handleSave}
          style={{
            padding: "12px 24px", background: saved ? COLORS.success : COLORS.yellow,
            border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
            fontFamily: DM, color: COLORS.bg, cursor: "pointer", transition: "all 0.3s",
          }}
        >
          {saved ? "✓ Salvo!" : "Salvar chave"}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const [projects, setProjects] = useLocalStorage("zp_projects", []);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHTML, setGeneratedHTML] = useState("");
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [geminiKey] = useLocalStorage("zp_gemini_key", "");
  const [thinkingMsg, setThinkingMsg] = useState("");
  const fileInputRef = useRef();
  const textareaRef = useRef();

  const THINKING_MSGS = [
    "Analisando seu prompt...",
    "Construindo a estrutura da aplicação...",
    "Gerando componentes e navegação...",
    "Criando dados mockados realistas...",
    "Aplicando animações e micro-interações...",
    "Finalizando o design...",
  ];

  useEffect(() => {
    let i = 0;
    if (!isGenerating) return;
    const iv = setInterval(() => {
      i = (i + 1) % THINKING_MSGS.length;
      setThinkingMsg(THINKING_MSGS[i]);
    }, 2200);
    setThinkingMsg(THINKING_MSGS[0]);
    return () => clearInterval(iv);
  }, [isGenerating]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleNewProject = () => {
    setActiveProjectId(null);
    setGeneratedHTML("");
    setPrompt("");
    setImage(null);
    setError("");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSelectProject = (id) => {
    const p = projects.find(x => x.id === id);
    if (p) {
      setActiveProjectId(id);
      setGeneratedHTML(p.html || "");
      setPrompt(p.lastPrompt || "");
      setError("");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage({ base64: ev.target.result.split(",")[1], type: file.type, name: file.name });
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("Digite um prompt para começar."); return; }
    const key = geminiKey || localStorage.getItem("zp_gemini_key")?.replace(/"/g, "");
    if (!key) { setShowSettings(true); setError("Configure sua chave Gemini primeiro."); return; }
    setError("");
    setIsGenerating(true);
    setGeneratedHTML("");

    try {
      const userContent = [];
      if (image) {
        userContent.push({ inlineData: { mimeType: image.type, data: image.base64 } });
      }
      userContent.push({ text: prompt });

      const body = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: userContent }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 65536 },
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${key}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `Erro ${res.status}`);
      }

      const data = await res.json();
      let html = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Clean markdown fences
      html = html.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();

      if (!html.includes("<!DOCTYPE") && !html.includes("<html")) {
        throw new Error("A IA não retornou HTML válido. Tente reformular o prompt.");
      }

      setGeneratedHTML(html);

      // Save or update project
      const now = Date.now();
      const projectName = prompt.slice(0, 40).trim() + (prompt.length > 40 ? "…" : "");

      if (activeProjectId) {
        setProjects(prev => prev.map(p => p.id === activeProjectId
          ? { ...p, html, lastPrompt: prompt, updatedAt: now }
          : p
        ));
      } else {
        const newProject = { id: `p_${now}`, name: projectName, html, lastPrompt: prompt, createdAt: now, updatedAt: now };
        setProjects(prev => [newProject, ...prev]);
        setActiveProjectId(newProject.id);
      }
    } catch (e) {
      setError(e.message || "Erro ao gerar. Verifique sua chave e tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate();
  };

  const handleExport = () => {
    if (!generatedHTML) return;
    const blob = new Blob([generatedHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeProject?.name || "app"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasPreview = !!generatedHTML;

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, fontFamily: DM, overflow: "hidden" }}>
      <Sidebar
        user={user}
        projects={projects}
        activeProject={activeProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onLogout={onLogout}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{
          height: 56, background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, fontFamily: SYNE }}>
              {activeProject ? activeProject.name : "Novo Projeto"}
            </span>
            {activeProject && (
              <span style={{ fontSize: 11, color: COLORS.textDim, background: COLORS.bg, padding: "2px 8px", borderRadius: 20, border: `1px solid ${COLORS.border}` }}>
                Atualizado {new Date(activeProject.updatedAt).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {generatedHTML && (
              <button
                onClick={handleExport}
                style={{
                  padding: "7px 16px", background: "transparent",
                  border: `1px solid ${COLORS.border}`, borderRadius: 8,
                  fontSize: 12, color: COLORS.textMuted, cursor: "pointer", fontFamily: DM,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.yellow; e.currentTarget.style.color = COLORS.yellow; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textMuted; }}
              >
                ↓ Exportar HTML
              </button>
            )}
            {!geminiKey && (
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  padding: "7px 16px", background: "rgba(248,113,113,0.1)",
                  border: `1px solid ${COLORS.error}`, borderRadius: 8,
                  fontSize: 12, color: COLORS.error, cursor: "pointer", fontFamily: DM,
                }}
              >
                ⚠ Configurar API Key
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Left: Prompt area */}
          <div style={{
            width: hasPreview ? 400 : "100%", flexShrink: 0,
            display: "flex", flexDirection: "column",
            borderRight: hasPreview ? `1px solid ${COLORS.border}` : "none",
            transition: "width 0.3s ease",
          }}>
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              justifyContent: hasPreview ? "flex-start" : "center",
              padding: hasPreview ? "24px" : "0 40px 60px",
              overflow: "auto",
            }}>
              {!hasPreview && (
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: COLORS.yellowGlow2, border: `1px solid rgba(255,208,80,0.2)`,
                    borderRadius: 20, padding: "6px 16px", marginBottom: 20,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.yellow, display: "inline-block" }} />
                    <span style={{ fontSize: 12, color: COLORS.yellow, fontWeight: 600 }}>Gemini 2.5 Flash</span>
                  </div>
                  <h2 style={{
                    fontSize: 32, fontWeight: 800, fontFamily: SYNE,
                    color: COLORS.text, margin: "0 0 10px", letterSpacing: -1,
                  }}>
                    O que vamos construir?
                  </h2>
                  <p style={{ fontSize: 15, color: COLORS.textMuted, margin: 0 }}>
                    Descreva sua aplicação e a IA gera o código completo
                  </p>
                </div>
              )}

              {/* Prompt input card */}
              <div style={{
                background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                borderRadius: 16, overflow: "hidden",
                boxShadow: hasPreview ? "none" : "0 8px 48px rgba(0,0,0,0.3)",
              }}>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isGenerating}
                  placeholder={`Ex: Crie um dashboard financeiro completo com:\n• Sidebar com navegação entre Visão Geral, Transações, Relatórios, Clientes\n• KPIs animados: faturamento, despesas, lucro, ticket médio\n• Gráfico de barras mensal e pizza de categorias\n• Tabela de últimas transações com filtros\n• Tema escuro premium`}
                  style={{
                    width: "100%", minHeight: hasPreview ? 200 : 240,
                    padding: "18px 20px", background: "transparent",
                    border: "none", outline: "none", resize: "none",
                    fontSize: 14, color: COLORS.text, fontFamily: DM,
                    lineHeight: 1.7, boxSizing: "border-box",
                  }}
                />

                {/* Image preview */}
                {image && (
                  <div style={{ padding: "0 16px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
                      background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}`,
                    }}>
                      <span style={{ fontSize: 14 }}>🖼</span>
                      <span style={{ fontSize: 12, color: COLORS.textMuted }}>{image.name}</span>
                      <button onClick={() => setImage(null)} style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", fontSize: 14 }}>×</button>
                    </div>
                  </div>
                )}

                {/* Mode badge + actions */}
                <div style={{
                  padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: COLORS.bg,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: COLORS.yellowGlow2, border: `1px solid rgba(255,208,80,0.25)`,
                      borderRadius: 8, padding: "5px 12px",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.yellow, display: "inline-block" }} />
                      <span style={{ fontSize: 12, color: COLORS.yellow, fontWeight: 600, fontFamily: SYNE }}>Criar App</span>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "5px 12px", background: "transparent",
                        border: `1px solid ${COLORS.border}`, borderRadius: 8,
                        fontSize: 12, color: COLORS.textMuted, cursor: "pointer",
                        fontFamily: DM, transition: "all 0.2s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderHover; e.currentTarget.style.color = COLORS.text; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textMuted; }}
                    >
                      📎 Imagem
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    style={{
                      padding: "8px 20px",
                      background: isGenerating || !prompt.trim() ? "rgba(255,208,80,0.3)" : COLORS.yellow,
                      border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                      fontFamily: DM, color: COLORS.bg, cursor: isGenerating || !prompt.trim() ? "not-allowed" : "pointer",
                      transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 14 }}>◌</span>
                        Gerando...
                      </>
                    ) : "⚡ Gerar"}
                  </button>
                </div>
              </div>

              {/* Hint */}
              {!hasPreview && (
                <p style={{ textAlign: "center", fontSize: 11, color: COLORS.textDim, marginTop: 14 }}>
                  ⌘ Enter para gerar · Suporta imagens de referência
                </p>
              )}

              {/* Thinking state */}
              {isGenerating && (
                <div style={{
                  marginTop: 20, padding: "14px 18px",
                  background: COLORS.yellowGlow2, border: `1px solid rgba(255,208,80,0.2)`,
                  borderRadius: 12, display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: COLORS.yellow,
                    animation: "pulse 1.4s ease-in-out infinite",
                  }} />
                  <span style={{ fontSize: 13, color: COLORS.yellow, fontFamily: DM }}>{thinkingMsg}</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  marginTop: 16, padding: "12px 16px",
                  background: "rgba(248,113,113,0.08)", border: `1px solid rgba(248,113,113,0.3)`,
                  borderRadius: 10,
                }}>
                  <span style={{ fontSize: 13, color: COLORS.error }}>{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          {hasPreview && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{
                padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: COLORS.surface, flexShrink: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F87171" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FBBF24" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#34D399" }} />
                  </div>
                  <span style={{ fontSize: 11, color: COLORS.textDim, marginLeft: 4 }}>Preview</span>
                </div>
                <button
                  onClick={() => { setGeneratedHTML(""); setActiveProjectId(null); }}
                  style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", fontSize: 18 }}
                >
                  ×
                </button>
              </div>
              <iframe
                srcDoc={generatedHTML}
                style={{ flex: 1, border: "none", background: "#fff" }}
                title="preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          )}
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
        textarea::placeholder { color: ${COLORS.textDim}; }
      `}</style>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useLocalStorage("zp_user", null);

  if (!user) {
    return <LoginScreen onLogin={(u) => setUser(u)} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
