import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { C, DM } from "../config/theme";
import { generateFiles } from "../config/generator";
import { checkLicense } from "../lib/api";
import { trimProject } from "../lib/storage";
import useProjects from "../hooks/useProjects";
import Topbar from "../components/Topbar";
import ChatArea from "../components/ChatArea";

const Sidebar = lazy(() => import("../components/Sidebar"));
const PreviewPanel = lazy(() => import("../components/PreviewPanel"));
const SettingsModal = lazy(() => import("../components/SettingsModal"));
const DisparadorBridge = lazy(() => import("../components/DisparadorBridge"));

export default function Dashboard({ user, onLogout }) {
  const { projects, addProject, updateProject, removeProject, syncing } = useProjects();
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
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const lastGenRef = useRef(0);
  const promptRef = useRef(prompt);
  promptRef.current = prompt;

  // Auto-close sidebar on mobile resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth <= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Refresh license info periodically
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
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { if (generating) setThinkSteps([]); }, [generating]);

  // ─── ONBOARDING: auto-generate on first login ────────────────────────────
  const onboardedRef = useRef(false);
  useEffect(() => {
    if (onboardedRef.current) return;
    if (projects.length > 0 || history.length > 0 || generating) return;
    // Check if this is truly first time (not just empty after delete)
    const hasEverGenerated = localStorage.getItem("zp_onboarded");
    if (hasEverGenerated) return;
    onboardedRef.current = true;
    // Auto-generate with a proven prompt after a short delay
    const timer = setTimeout(() => {
      const onboardPrompt = "Dashboard para petshop com graficos de vendas mensais, tabela de clientes e agendamento de banho e tosa";
      promptRef.current = onboardPrompt;
      setPrompt(onboardPrompt);
      localStorage.setItem("zp_onboarded", "true");
      // Don't auto-trigger — let the user see the prompt first and click Gerar
      // This way they understand what happened
    }, 500);
    return () => clearTimeout(timer);
  }, [projects, history, generating]);

  const activeProject = projects.find(p => p.id === activeId);
  const hasPreview = !!generatedFiles;
  const isMobile = () => window.innerWidth <= 768;

  const handleNew = () => {
    setActiveId(null); setGeneratedFiles(null);
    setPrompt(""); setHistory([]); setError(""); setThinkSteps([]);
  };

  const handleDelete = (id) => {
    removeProject(id);
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
    const currentPrompt = promptRef.current || prompt;
    if (!currentPrompt.trim()) { setError("Digite um prompt para comecar."); return; }
    const now = Date.now();
    if (now - lastGenRef.current < 10000) { setError("Aguarde 10 segundos entre geracoes."); return; }
    lastGenRef.current = now;

    setError(""); setGenerating(true); setThinkSteps([]); setStreamingCode("");

    try {
      const onProgressFn = (event) => {
        const msg = typeof event === "string" ? event : event?.message || "";
        const step = typeof event === "object" ? event?.step : null;
        setThinkSteps(prev => [...prev, { step, message: msg }]);
      };

      const result = await generateFiles(
        currentPrompt,
        onProgressFn,
        generatedFiles?.["src/App.jsx"] || null,
        (_delta, fullText) => setStreamingCode(fullText),
        history
      );

      if (!result?.files?.["src/App.jsx"]) throw new Error("App.jsx nao gerado. Tente novamente.");

      const files = result.files;
      const now = Date.now();
      const score = result.validation?.score;
      const failedNames = (result.validation?.details || []).filter(d => !d.passed).map(d => d.name);
      const newHistory = [...history, { prompt: currentPrompt, at: now, score, problems: failedNames }];
      const name = currentPrompt.slice(0, 42).trim() + (currentPrompt.length > 42 ? "..." : "");
      const newRunId = `run_${now}`;

      if (activeId) {
        updateProject(activeId, p => trimProject({ ...p, files, lastPrompt: currentPrompt, history: newHistory, updatedAt: now }));
      } else {
        const np = trimProject({ id: `p_${now}`, name, files, lastPrompt: currentPrompt, history: newHistory, createdAt: now, updatedAt: now });
        addProject(np);
        setActiveId(np.id);
      }

      setGeneratedFiles(files);
      setHistory(newHistory);
      setRunId(newRunId);
      setPrompt("");

      // Refresh license info after generation
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
      if (e.message === "RATE_LIMITED") {
        setError("Muitas requisicoes. Aguarde 1 minuto e tente novamente.");
      } else if (e.message?.includes("Codigo muito pequeno")) {
        setError("A IA gerou um codigo incompleto. Tente reformular o prompt com mais detalhes.");
      } else if (e.name === "AbortError" || e.message?.includes("abort")) {
        setError("A geracao demorou demais e foi cancelada. Tente um prompt mais simples.");
      } else {
        setError(e.message || "Erro ao gerar. Tente novamente.");
      }
    } finally { setGenerating(false); }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: DM, overflow: "hidden" }}>
      {sidebarOpen && (
        <Suspense fallback={null}>
          <div onClick={() => setSidebarOpen(false)} style={{ display: isMobile() ? "block" : "none", position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} />
          <div style={isMobile() ? { position: "fixed", zIndex: 100, height: "100vh", top: 0, left: 0 } : {}}>
            <Sidebar
              user={user} projects={projects} activeId={activeId}
              onSelect={(id) => { handleSelect(id); if (isMobile()) setSidebarOpen(false); }}
              onNew={() => { handleNew(); if (isMobile()) setSidebarOpen(false); }}
              onDelete={handleDelete} onLogout={onLogout}
              onSettings={() => setShowSettings(true)}
              generating={generating}
              thinkSteps={thinkSteps}
              licenseInfo={licenseInfo}
            />
          </div>
        </Suspense>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar
          projectName={activeProject?.name}
          hasPreview={hasPreview}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(s => !s)}
          syncing={syncing}
        />

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <ChatArea
            history={history}
            generating={generating}
            streamingCode={streamingCode}
            error={error}
            thinkSteps={thinkSteps}
            prompt={prompt}
            onPromptChange={(v) => { promptRef.current = v; setPrompt(v); setError(""); }}
            onGenerate={handleGenerate}
            onSuggestionClick={(s) => setPrompt(s)}
            licenseInfo={licenseInfo}
            hasPreview={hasPreview}
            disabled={generating}
          />

          {hasPreview && (
            <Suspense fallback={null}>
              <PreviewPanel files={generatedFiles} runId={runId} projectName={activeProject?.name} onClose={() => { setGeneratedFiles(null); setRunId(null); }} onAutoFix={(fixPrompt) => { promptRef.current = fixPrompt; setPrompt(fixPrompt); requestAnimationFrame(() => handleGenerate()); }} />
            </Suspense>
          )}
        </div>
      </div>

      {showSettings && (
        <Suspense fallback={null}>
          <SettingsModal licenseInfo={licenseInfo} onClose={() => setShowSettings(false)} onLogout={onLogout} />
        </Suspense>
      )}

      {/* Disparador floating bridge — only if admin key exists */}
      {(() => { const ak = localStorage.getItem("zp_admin_key"); return ak ? <Suspense fallback={null}><DisparadorBridge adminKey={ak} /></Suspense> : null; })()}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
}
