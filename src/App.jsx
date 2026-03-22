import { useState, useEffect, useRef, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

// ─── CORES ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#060F1E", surface: "#0D1B2E", surface2: "#112238",
  border: "#1A2E45", borderHover: "#243F5E",
  yellow: "#FFD050", yellowDim: "#CC9F20",
  yellowGlow: "rgba(255,208,80,0.15)", yellowGlow2: "rgba(255,208,80,0.06)",
  text: "#E8F0F8", textMuted: "#6B8BAA", textDim: "#3A5470",
  success: "#34D399", error: "#F87171", info: "#60A5FA",
};
const SYNE = "'Syne', sans-serif";
const DM = "'DM Sans', sans-serif";

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é um gerador de aplicações React + Vite PROFISSIONAL.

Retorne SOMENTE um objeto JSON válido com os arquivos do projeto. Formato OBRIGATÓRIO:
{
  "files": {
    "src/App.jsx": "conteúdo completo",
    "src/main.jsx": "conteúdo completo",
    "src/index.css": "conteúdo completo",
    "index.html": "conteúdo completo",
    "package.json": "conteúdo completo como string JSON"
  }
}

REGRAS DOS ARQUIVOS:

src/main.jsx — SEMPRE exatamente:
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);

index.html — SEMPRE exatamente:
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>App</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>

package.json — SEMPRE com estas dependências exatas:
{"name":"zp-app","private":true,"version":"0.0.0","type":"module","scripts":{"dev":"vite --host","build":"vite build"},"dependencies":{"react":"^18.2.0","react-dom":"^18.2.0"},"devDependencies":{"@vitejs/plugin-react":"^4.2.1","vite":"^5.0.8"}}

src/App.jsx — QUALIDADE OBRIGATÓRIA:
- Sidebar lateral real com navegação funcional entre pelo menos 4 páginas
- KPIs com números animados usando useState + useEffect contador
- Pelo menos 2 gráficos com SVG puro (barras, linhas ou pizza)
- Dados mockados realistas brasileiros (nomes, R$, datas, porcentagens)
- Design escuro premium: fundo #0A0F1E, cards com border rgba(255,255,255,0.06)
- Micro-animações com CSS transitions nos hovers
- Qualidade visual igual ao Linear, Vercel Dashboard, Lovable

src/index.css — reset básico + @import Google Fonts se necessário

RETORNE APENAS O JSON. Sem explicações, sem markdown, sem backticks, sem texto antes ou depois.`;

// ─── VITE CONFIG para o projeto gerado ───────────────────────────────────────
const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });`;

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useLS(key, init) {
  const [v, setV] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init; }
    catch { return init; }
  });
  const set = (val) => {
    const next = typeof val === "function" ? val(v) : val;
    setV(next);
    localStorage.setItem(key, JSON.stringify(next));
  };
  return [v, set];
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
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
        backgroundSize: "48px 48px", opacity: 0.25, pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 400, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, background: C.yellow, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 32px ${C.yellowGlow}`,
            }}>
              <span style={{ fontSize: 22, fontWeight: 900, fontFamily: SYNE, color: C.bg }}>Z</span>
            </div>
            <span style={{ fontSize: 26, fontWeight: 800, fontFamily: SYNE, color: C.text, letterSpacing: -1 }}>
              Zero<span style={{ color: C.yellow }}>.</span>
            </span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, fontFamily: SYNE, color: C.text, margin: "0 0 10px", letterSpacing: -1.5 }}>
            Zero Preview
          </h1>
          <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.6 }}>
            Crie apps React reais com IA.<br />Preview ao vivo via WebContainer.
          </p>
        </div>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
            Seu nome
          </div>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Como podemos te chamar?"
            autoFocus
            style={{
              display: "block", width: "100%", padding: "12px 14px",
              background: C.bg, border: `1px solid ${err ? C.error : C.border}`,
              borderRadius: 10, fontSize: 14, color: C.text, fontFamily: DM,
              outline: "none", marginBottom: err ? 8 : 16, boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = C.yellow}
            onBlur={e => e.target.style.borderColor = err ? C.error : C.border}
          />
          {err && <p style={{ color: C.error, fontSize: 12, marginBottom: 12 }}>{err}</p>}
          <button onClick={submit} style={{
            width: "100%", padding: "13px 0", background: C.yellow,
            border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
            fontFamily: DM, color: C.bg, cursor: "pointer", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.background = "#FFD966"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = C.yellow; }}
          >
            Entrar no Zero Preview →
          </button>
        </div>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: C.textDim }}>
          Powered by Gemini 2.5 Flash · WebContainer API
        </p>
      </div>
    </div>
  );
}

// ─── SETTINGS MODAL ──────────────────────────────────────────────────────────
function SettingsModal({ onClose }) {
  const [key, setKey] = useLS("zp_gemini_key", "");
  const [input, setInput] = useState(key);
  const [saved, setSaved] = useState(false);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(6,15,30,0.85)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: 32, width: 460,
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Configurações</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
          Chave Gemini API
        </div>
        <input
          type="password" value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="AIza..."
          style={{
            display: "block", width: "100%", padding: "12px 14px",
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 10, fontSize: 14, color: C.text, fontFamily: DM,
            outline: "none", marginBottom: 8, boxSizing: "border-box",
          }}
          onFocus={e => e.target.style.borderColor = C.yellow}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <p style={{ fontSize: 11, color: C.textDim, marginBottom: 20 }}>
          Salva só no seu browser. Obtenha em{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: C.yellow }}>
            aistudio.google.com
          </a>
        </p>
        <button
          onClick={() => { setKey(input.trim()); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          style={{
            padding: "11px 24px", background: saved ? C.success : C.yellow,
            border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
            fontFamily: DM, color: C.bg, cursor: "pointer", transition: "background 0.3s",
          }}
        >
          {saved ? "✓ Salvo!" : "Salvar chave"}
        </button>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ user, projects, activeId, onSelect, onNew, onLogout, onSettings }) {
  return (
    <div style={{
      width: 240, minWidth: 240, background: C.surface,
      borderRight: `1px solid ${C.border}`, display: "flex",
      flexDirection: "column", height: "100vh", overflow: "hidden",
    }}>
      <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, background: C.yellow, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 16px ${C.yellowGlow}`,
        }}>
          <span style={{ fontSize: 16, fontWeight: 900, fontFamily: SYNE, color: C.bg }}>Z</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, fontFamily: SYNE, color: C.text, letterSpacing: -0.5 }}>
          Zero<span style={{ color: C.yellow }}>.</span>
        </span>
      </div>

      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.yellow}, ${C.yellowDim})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: C.bg, fontFamily: SYNE, flexShrink: 0,
        }}>
          {String(user).charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user}</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>Free Plan</div>
        </div>
      </div>

      <div style={{ padding: "10px 12px 6px" }}>
        <button onClick={onNew} style={{
          width: "100%", padding: "10px 14px",
          background: C.yellowGlow2, border: `1px solid rgba(255,208,80,0.2)`,
          borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.yellow,
          cursor: "pointer", fontFamily: DM, display: "flex", alignItems: "center",
          gap: 8, transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = C.yellowGlow; e.currentTarget.style.borderColor = "rgba(255,208,80,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.yellowGlow2; e.currentTarget.style.borderColor = "rgba(255,208,80,0.2)"; }}
        >
          <span style={{ fontSize: 16 }}>+</span> Novo Projeto
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: 1, textTransform: "uppercase", padding: "8px 4px 6px" }}>
          Projetos ({projects.length})
        </div>
        {projects.length === 0 && (
          <div style={{ fontSize: 12, color: C.textDim, padding: "8px 4px", fontStyle: "italic" }}>Nenhum projeto ainda</div>
        )}
        {projects.map(p => (
          <button key={p.id} onClick={() => onSelect(p.id)} style={{
            width: "100%", textAlign: "left", padding: "9px 10px",
            background: activeId === p.id ? C.yellowGlow2 : "transparent",
            border: activeId === p.id ? `1px solid rgba(255,208,80,0.2)` : "1px solid transparent",
            borderRadius: 8, cursor: "pointer", marginBottom: 2, transition: "all 0.15s",
          }}
            onMouseEnter={e => { if (activeId !== p.id) e.currentTarget.style.background = C.surface2; }}
            onMouseLeave={e => { if (activeId !== p.id) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: activeId === p.id ? C.yellow : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: DM }}>
              {p.name}
            </div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>
              {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
            </div>
          </button>
        ))}
      </div>

      <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}` }}>
        {[
          { label: "⚙ Configurações", action: onSettings },
          { label: "↩ Sair", action: onLogout, danger: true },
        ].map(({ label, action, danger }) => (
          <button key={label} onClick={action} style={{
            width: "100%", padding: "9px 12px", background: "transparent",
            border: "1px solid transparent", borderRadius: 8, fontSize: 12,
            color: C.textMuted, cursor: "pointer", fontFamily: DM,
            transition: "color 0.2s", textAlign: "left", marginBottom: 4,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = danger ? C.error : C.text; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── TERMINAL ────────────────────────────────────────────────────────────────
function Terminal({ logs }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div ref={ref} style={{
      background: "#020810", borderTop: `1px solid ${C.border}`,
      height: 130, overflowY: "auto", padding: "10px 14px",
      fontFamily: "'Courier New', monospace", fontSize: 11, flexShrink: 0,
    }}>
      {logs.length === 0 && (
        <div style={{ color: C.textDim, fontStyle: "italic" }}>Terminal pronto...</div>
      )}
      {logs.map((l, i) => (
        <div key={i} style={{
          color: l.type === "error" ? C.error : l.type === "success" ? C.success : l.type === "info" ? C.info : "#8DB4CC",
          lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-all",
        }}>
          {l.type === "info" ? "ℹ " : l.type === "success" ? "✓ " : l.type === "error" ? "✗ " : "  "}{l.text}
        </div>
      ))}
    </div>
  );
}

// ─── PREVIEW PANEL (WebContainer) ────────────────────────────────────────────
function PreviewPanel({ files, onClose }) {
  const [status, setStatus] = useState("booting");
  const [logs, setLogs] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const wcRef = useRef(null);

  const addLog = useCallback((text, type = "default") => {
    setLogs(prev => [...prev.slice(-300), { text: String(text).trim(), type }]);
  }, []);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        addLog("Iniciando WebContainer...", "info");

        if (!wcRef.current) {
          wcRef.current = await WebContainer.boot();
        }
        const wc = wcRef.current;

        if (!active) return;
        addLog("Montando arquivos do projeto...", "info");

        // Converter paths para FileSystemTree
        const fsTree = {};
        for (const [path, contents] of Object.entries(files)) {
          const parts = path.split("/");
          if (parts.length === 1) {
            fsTree[path] = { file: { contents } };
          } else {
            const dir = parts[0];
            if (!fsTree[dir]) fsTree[dir] = { directory: {} };
            fsTree[dir].directory[parts.slice(1).join("/")] = { file: { contents } };
          }
        }
        fsTree["vite.config.js"] = { file: { contents: VITE_CONFIG } };

        await wc.mount(fsTree);
        if (!active) return;
        addLog("Arquivos montados!", "success");

        setStatus("installing");
        addLog("Rodando npm install...", "info");

        const install = await wc.spawn("npm", ["install"]);
        install.output.pipeTo(new WritableStream({
          write(data) { if (active) addLog(data); }
        }));
        const code = await install.exit;
        if (code !== 0) throw new Error(`npm install falhou (exit ${code})`);
        if (!active) return;
        addLog("Dependências instaladas!", "success");

        setStatus("running");
        addLog("Iniciando vite dev server...", "info");

        const dev = await wc.spawn("npm", ["run", "dev"]);
        dev.output.pipeTo(new WritableStream({
          write(data) { if (active) addLog(data); }
        }));

        wc.on("server-ready", (port, url) => {
          if (!active) return;
          addLog(`Servidor pronto → ${url}`, "success");
          setPreviewUrl(url);
          setStatus("ready");
        });

      } catch (e) {
        if (active) {
          addLog(e.message, "error");
          setStatus("error");
        }
      }
    }

    run();
    return () => { active = false; };
  }, [files, addLog]);

  const statusInfo = {
    booting: { label: "Iniciando WebContainer...", color: C.info },
    installing: { label: "Instalando dependências...", color: C.yellow },
    running: { label: "Iniciando servidor Vite...", color: C.yellow },
    ready: { label: "● Preview ao vivo", color: C.success },
    error: { label: "Erro no WebContainer", color: C.error },
  }[status];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: `1px solid ${C.border}` }}>
      {/* Header */}
      <div style={{
        padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: C.surface, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F87171" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FBBF24" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#34D399" }} />
          </div>
          <span style={{ fontSize: 12, color: statusInfo.color, fontFamily: DM }}>{statusInfo.label}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noreferrer" style={{
              padding: "5px 12px", background: "transparent",
              border: `1px solid ${C.border}`, borderRadius: 6,
              fontSize: 11, color: C.textMuted, textDecoration: "none", fontFamily: DM,
            }}>
              ↗ Abrir
            </a>
          )}
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
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
              width: 34, height: 34, border: `3px solid ${C.border}`,
              borderTopColor: C.yellow, borderRadius: "50%", animation: "spin 1s linear infinite",
            }} />
            <span style={{ fontSize: 13, color: C.textMuted, fontFamily: DM }}>{statusInfo.label}</span>
          </div>
        )}
        {previewUrl && (
          <iframe
            src={previewUrl}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Zero Preview — WebContainer"
          />
        )}
      </div>

      <Terminal logs={logs} />
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const [projects, setProjects] = useLS("zp_projects", []);
  const [activeId, setActiveId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [thinkMsg, setThinkMsg] = useState("");
  const [geminiKey] = useLS("zp_gemini_key", "");
  const textareaRef = useRef();

  const THINK_MSGS = [
    "Analisando seu prompt...",
    "Planejando a arquitetura React...",
    "Gerando componentes e sidebar...",
    "Criando dados mockados brasileiros...",
    "Montando KPIs e gráficos SVG...",
    "Aplicando design premium...",
    "Finalizando os arquivos do projeto...",
  ];

  useEffect(() => {
    if (!generating) return;
    let i = 0;
    setThinkMsg(THINK_MSGS[0]);
    const iv = setInterval(() => { i = (i + 1) % THINK_MSGS.length; setThinkMsg(THINK_MSGS[i]); }, 2500);
    return () => clearInterval(iv);
  }, [generating]);

  const activeProject = projects.find(p => p.id === activeId);
  const hasPreview = !!generatedFiles;

  const handleNew = () => {
    setActiveId(null);
    setGeneratedFiles(null);
    setPrompt("");
    setError("");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSelect = (id) => {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    setActiveId(id);
    setPrompt(p.lastPrompt || "");
    setGeneratedFiles(p.files || null);
    setError("");
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("Digite um prompt para começar."); return; }
    const key = geminiKey || localStorage.getItem("zp_gemini_key")?.replace(/"/g, "");
    if (!key) { setShowSettings(true); setError("Configure sua chave Gemini primeiro."); return; }

    setError("");
    setGenerating(true);
    setGeneratedFiles(null);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.85, maxOutputTokens: 65536 },
          }),
        }
      );

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e?.error?.message || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();
      let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) { try { parsed = JSON.parse(match[0]); } catch { throw new Error("JSON inválido na resposta da IA."); } }
        else throw new Error("A IA não retornou JSON. Reformule o prompt.");
      }

      if (!parsed?.files?.["src/App.jsx"]) throw new Error("Arquivo src/App.jsx não gerado. Tente novamente.");

      const files = parsed.files;
      const now = Date.now();
      const name = prompt.slice(0, 40).trim() + (prompt.length > 40 ? "…" : "");

      if (activeId) {
        setProjects(prev => prev.map(p => p.id === activeId ? { ...p, files, lastPrompt: prompt, updatedAt: now } : p));
      } else {
        const np = { id: `p_${now}`, name, files, lastPrompt: prompt, createdAt: now, updatedAt: now };
        setProjects(prev => [np, ...prev]);
        setActiveId(np.id);
      }

      setGeneratedFiles(files);
    } catch (e) {
      setError(e.message || "Erro ao gerar. Verifique sua chave e tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: DM, overflow: "hidden" }}>
      <Sidebar
        user={user} projects={projects} activeId={activeId}
        onSelect={handleSelect} onNew={handleNew}
        onLogout={onLogout} onSettings={() => setShowSettings(true)}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{
          height: 54, background: C.surface, borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: SYNE }}>
              {activeProject ? activeProject.name : "Novo Projeto"}
            </span>
            {hasPreview && (
              <span style={{ fontSize: 10, color: C.success, background: "rgba(52,211,153,0.1)", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.2)" }}>
                ● React + Vite
              </span>
            )}
          </div>
          {!geminiKey && (
            <button onClick={() => setShowSettings(true)} style={{
              padding: "6px 14px", background: "rgba(248,113,113,0.1)",
              border: `1px solid ${C.error}`, borderRadius: 7,
              fontSize: 12, color: C.error, cursor: "pointer", fontFamily: DM,
            }}>
              ⚠ Configurar API Key
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Prompt area */}
          <div style={{
            width: hasPreview ? 360 : "100%", flexShrink: 0,
            display: "flex", flexDirection: "column",
            borderRight: hasPreview ? `1px solid ${C.border}` : "none",
            overflow: "auto",
          }}>
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              justifyContent: hasPreview ? "flex-start" : "center",
              padding: hasPreview ? "20px" : "0 40px 60px",
            }}>
              {!hasPreview && (
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: C.yellowGlow2, border: `1px solid rgba(255,208,80,0.2)`,
                    borderRadius: 20, padding: "6px 16px", marginBottom: 20,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.yellow, display: "inline-block" }} />
                    <span style={{ fontSize: 12, color: C.yellow, fontWeight: 600 }}>Gemini 2.5 Flash · React + Vite</span>
                  </div>
                  <h2 style={{ fontSize: 30, fontWeight: 800, fontFamily: SYNE, color: C.text, margin: "0 0 10px", letterSpacing: -1 }}>
                    O que vamos construir?
                  </h2>
                  <p style={{ fontSize: 14, color: C.textMuted }}>
                    Descreva seu app — a IA gera os arquivos React completos
                  </p>
                </div>
              )}

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => (e.metaKey || e.ctrlKey) && e.key === "Enter && !e.shiftKey && handleGenerate()}
                  disabled={generating}
                  placeholder={`Ex: Crie um dashboard financeiro com:\n• Sidebar: Visão Geral, Transações, Clientes, Relatórios\n• KPIs animados: faturamento, despesas, lucro\n• Gráficos SVG de barras mensais e pizza\n• Tabela de transações com dados reais\n• Tema escuro premium`}
                  style={{
                    width: "100%", minHeight: hasPreview ? 180 : 220,
                    padding: "16px 18px", background: "transparent",
                    border: "none", outline: "none", resize: "none",
                    fontSize: 13, color: C.text, fontFamily: DM,
                    lineHeight: 1.7, boxSizing: "border-box",
                  }}
                />
                <div style={{
                  padding: "10px 14px", borderTop: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: C.bg,
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: C.yellowGlow2, border: `1px solid rgba(255,208,80,0.2)`,
                    borderRadius: 7, padding: "4px 10px",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.yellow, display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: C.yellow, fontWeight: 600, fontFamily: SYNE }}>Criar App React</span>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !prompt.trim()}
                    style={{
                      padding: "8px 18px",
                      background: generating || !prompt.trim() ? "rgba(255,208,80,0.25)" : C.yellow,
                      border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                      fontFamily: DM, color: C.bg,
                      cursor: generating || !prompt.trim() ? "not-allowed" : "pointer",
                      transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    {generating
                      ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span> Gerando...</>
                      : "⚡ Gerar"}
                  </button>
                </div>
              </div>

              {!hasPreview && (
                <p style={{ textAlign: "center", fontSize: 11, color: C.textDim, marginTop: 12 }}>
                  ⌘ Enter para gerar · Preview ao vivo via WebContainer
                </p>
              )}

              {generating && (
                <div style={{
                  marginTop: 16, padding: "12px 16px",
                  background: C.yellowGlow2, border: `1px solid rgba(255,208,80,0.2)`,
                  borderRadius: 10, display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.yellow, animation: "pulse 1.4s ease-in-out infinite" }} />
                  <span style={{ fontSize: 12, color: C.yellow }}>{thinkMsg}</span>
                </div>
              )}

              {error && (
                <div style={{
                  marginTop: 14, padding: "11px 14px",
                  background: "rgba(248,113,113,0.08)", border: `1px solid rgba(248,113,113,0.3)`,
                  borderRadius: 9,
                }}>
                  <span style={{ fontSize: 12, color: C.error }}>{error}</span>
                </div>
              )}
            </div>
          </div>

          {hasPreview && (
            <PreviewPanel files={generatedFiles} onClose={() => setGeneratedFiles(null)} />
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
        textarea::placeholder { color: ${C.textDim}; line-height: 1.7; }
        ::selection { background: rgba(255,208,80,0.2); color: ${C.yellow}; }
      `}</style>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useLS("zp_user", null); if (user && typeof user === "object") { localStorage.removeItem("zp_user"); window.location.reload(); }
  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
