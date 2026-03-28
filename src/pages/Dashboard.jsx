import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { C, DM } from "../config/theme";
import { generateFiles } from "../config/generator";
import { checkLicense, callClaudeAgent } from "../lib/api";
import { trimProject, generateProjectId } from "../lib/storage";
import useProjects from "../hooks/useProjects";
import useVersions from "../hooks/useVersions";
import Topbar from "../components/Topbar";
import ChatArea from "../components/ChatArea";
import DiffReview from "../components/DiffReview";
import RewindPanel from "../components/RewindPanel";
import { analyzeProject, saveKnowledge, loadKnowledge } from "../lib/knowledge";
import WCManager from "../lib/wcManager";
import { projectContext } from "../lib/projectContext";
import { retryEngine } from "../lib/retryEngine";
import { GenerationStatus } from "../components/GenerationStatus";

// All lazy imports have stale-chunk protection — auto-reload on deploy
function safeLazy(importFn) {
  return lazy(() => importFn().catch(() => {
    const reloads = parseInt(sessionStorage.getItem("zp_chunk_reloads") || "0");
    if (reloads < 2) {
      sessionStorage.setItem("zp_chunk_reloads", String(reloads + 1));
      window.location.reload();
    }
    return { default: () => null };
  }));
}
const Sidebar = safeLazy(() => import("../components/Sidebar"));
const PreviewPanel = safeLazy(() => import("../components/PreviewPanel"));
const SettingsModal = safeLazy(() => import("../components/SettingsModal"));
const DisparadorBridge = safeLazy(() => import("../components/DisparadorBridge"));
const AgenticMode = safeLazy(() => import("../components/AgenticMode"));
const GitHubImport = safeLazy(() => import("../components/GitHubImport"));
const OrchestratorPanel = safeLazy(() => import("../components/OrchestratorPanel"));
const Escritorio = safeLazy(() => import("../components/Escritorio"));
const Navegador = safeLazy(() => import("../components/Navegador"));

export default function Dashboard({ user, onLogout }) {
  const { projects, addProject, updateProject, removeProject, syncing } = useProjects();
  const { pushVersion, undo, redo, canUndo, canRedo, versionCount, currentVersion, currentIndex, versions, rewindTo, initProject } = useVersions();
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
  const [agenticMode, setAgenticMode] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [pendingDiff, setPendingDiff] = useState(null); // { oldFiles, newFiles, prompt, score }
  const [showRewind, setShowRewind] = useState(false);
  const [knowledge, setKnowledge] = useState(null);
  const [syntaxStatus, setSyntaxStatus] = useState(null); // { valid, errors }
  const [activeProvider, setActiveProvider] = useState(() => {
    try { return localStorage.getItem("zp_provider") || "auto"; } catch { return "auto"; }
  });
  const [orchestratorOpen, setOrchestratorOpen] = useState(false);
  const [escritorioOpen, setEscritorioOpen] = useState(false);
  const [navegadorOpen, setNavegadorOpen] = useState(false);
  const [statusMessages, setStatusMessages] = useState([]);
  const lastGenRef = useRef(0);
  const promptRef = useRef(prompt);
  promptRef.current = prompt;

  // Update syntax status after each run
  useEffect(() => {
    if (!runId) return;
    // Poll briefly for validation result (WCManager sets it during run)
    const timer = setTimeout(() => {
      const v = WCManager.lastValidation;
      if (v) setSyntaxStatus(v);
    }, 3000);
    return () => clearTimeout(timer);
  }, [runId]);

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
    // Only set files if project has real content (not empty object)
    const hasFiles = p.files && Object.keys(p.files).length > 0;
    setGeneratedFiles(hasFiles ? p.files : null);
    if (hasFiles) setRunId(`run_load_${Date.now()}`); // trigger WebContainer reload
    setHistory(p.history || []); setError(""); setThinkSteps([]);
    initProject(id, hasFiles ? p.files : null);
    setKnowledge(loadKnowledge(id));
    // Mecanismo 4: carrega contexto persistente do projeto
    projectContext.load(id);
    if (p.name) projectContext.update({ projectName: p.name });
    try { localStorage.setItem("zp_active_project", id); } catch {}
  };

  const handleUndo = () => {
    const prev = undo();
    if (prev) {
      setGeneratedFiles(prev.files);
      setRunId(`run_undo_${Date.now()}`);
    }
  };

  const handleRedo = () => {
    const next = redo();
    if (next) {
      setGeneratedFiles(next.files);
      setRunId(`run_redo_${Date.now()}`);
    }
  };

  // GitHub Import — load repo files into editor
  const handleGitHubImport = (importedFiles) => {
    const now = Date.now();
    const files = { ...importedFiles };
    const name = "Projeto importado do GitHub";
    const np = trimProject({ id: generateProjectId(), name, files, lastPrompt: "Importado do GitHub", history: [{ prompt: "Import GitHub", at: now }], createdAt: now, updatedAt: now });
    addProject(np);
    setActiveId(np.id);
    setGeneratedFiles(files);
    setHistory(np.history);
    setRunId(`run_import_${now}`);
    pushVersion(files, "Import GitHub", null);
  };

  // Claude Agent mode — autonomous multi-file editing
  const handleAgentMode = async (agentPrompt) => {
    if (!agentPrompt?.trim()) return;
    setError(""); setGenerating(true); setThinkSteps([]);
    setThinkSteps([{ step: "EXECUTOR", message: "Agente Claude trabalhando autonomamente..." }]);

    try {
      const result = await callClaudeAgent(
        agentPrompt,
        generatedFiles || {},
        (msg) => setThinkSteps(prev => [...prev, { step: "EXECUTOR", message: msg }])
      );

      if (result?.files && Object.keys(result.files).length > 0) {
        const merged = { ...(generatedFiles || {}), ...result.files };
        const now = Date.now();
        const score = null;
        const newHistory = [...history, { prompt: agentPrompt, at: now, score, agent: true }];

        if (activeId) {
          updateProject(activeId, p => trimProject({ ...p, files: merged, lastPrompt: agentPrompt, history: newHistory, updatedAt: now }));
        } else {
          const name = agentPrompt.slice(0, 42) + (agentPrompt.length > 42 ? "..." : "");
          const np = trimProject({ id: generateProjectId(), name, files: merged, lastPrompt: agentPrompt, history: newHistory, createdAt: now, updatedAt: now });
          addProject(np);
          setActiveId(np.id);
        }

        setGeneratedFiles(merged);
        setHistory(newHistory);
        setRunId(`run_agent_${now}`);
        setPrompt("");
        pushVersion(merged, agentPrompt, null);
        setThinkSteps(prev => [...prev, { step: "DONE", message: `Agente completou (${result.iterations} iteracoes, ${result.tokens} tokens)` }]);
      }
    } catch (e) {
      if (e.message === "AGENT_UNAVAILABLE") {
        setError("Agente Claude indisponivel (sem creditos Anthropic). Use o modo normal.");
      } else {
        setError(e.message || "Erro do agente.");
      }
    } finally { setGenerating(false); }
  };

  // Aplica arquivos gerados (usada diretamente ou após DiffReview)
  const applyFiles = (files, currentPrompt, score, failedNames) => {
    const now = Date.now();
    const newHistory = [...history, { prompt: currentPrompt, at: now, score, problems: failedNames || [] }];
    const name = currentPrompt.slice(0, 42).trim() + (currentPrompt.length > 42 ? "..." : "");
    const newRunId = `run_${now}`;

    if (activeId) {
      updateProject(activeId, p => trimProject({ ...p, files, lastPrompt: currentPrompt, history: newHistory, updatedAt: now }));
    } else {
      const np = trimProject({ id: generateProjectId(), name, files, lastPrompt: currentPrompt, history: newHistory, createdAt: now, updatedAt: now });
      addProject(np);
      setActiveId(np.id);
    }

    setGeneratedFiles(files);
    setHistory(newHistory);
    setRunId(newRunId);
    setPrompt("");
    pushVersion(files, currentPrompt, score);

    // Auto-analyze and save project knowledge
    try {
      const k = analyzeProject(files);
      if (k) {
        const pid = activeId || `p_${now}`;
        saveKnowledge(pid, k);
        setKnowledge(k);
      }
    } catch {}
  };

  // Handler quando DiffReview é confirmado
  const handleDiffApply = () => {
    if (!pendingDiff) return;
    applyFiles(pendingDiff.newFiles, pendingDiff.prompt, pendingDiff.score, pendingDiff.failedNames);
    setPendingDiff(null);
  };

  const handleDiffCancel = () => {
    setPendingDiff(null);
  };

  // Rewind to a specific version
  const handleRewind = (index) => {
    const version = rewindTo(index);
    if (version) {
      setGeneratedFiles(version.files);
      setRunId(`run_rewind_${Date.now()}`);
      setShowRewind(false);
    }
  };

  // Slash command handler
  const handleSlashCommand = (key) => {
    switch (key) {
      case "rewind":
        setShowRewind(true);
        break;
      case "exportar":
        if (generatedFiles) {
          import("../lib/exporter").then(m => m.exportToZip(generatedFiles, activeProject?.name)).catch(console.error);
        }
        break;
      case "limpar":
        handleNew();
        break;
      case "github":
        setShowImport(true);
        break;
      case "modo-escuro":
        if (generatedFiles) {
          promptRef.current = "Adicione modo escuro com toggle no header. Mantenha a estrutura atual.";
          setPrompt(promptRef.current);
        }
        break;
      case "modelo":
        setShowSettings(true);
        break;
      default:
        break;
    }
  };

  // Esc+Esc para abrir rewind
  useEffect(() => {
    let lastEsc = 0;
    const handler = (e) => {
      if (e.key === "Escape") {
        const now = Date.now();
        if (now - lastEsc < 500) {
          setShowRewind(true);
        }
        lastEsc = now;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Agentic mode generates with a rich briefing instead of raw prompt
  const handleAgenticGenerate = (briefing) => {
    promptRef.current = briefing;
    setPrompt(briefing);
    requestAnimationFrame(() => handleGenerate());
  };

  const handleGenerate = async (retryOverride) => {
    let currentPrompt = retryOverride || promptRef.current || prompt;
    // If prompt is empty, try last history entry (for "Tentar novamente" button)
    if (!currentPrompt.trim() && history.length > 0) {
      currentPrompt = history[history.length - 1]?.prompt || "";
    }
    if (!currentPrompt.trim()) { setError("Digite um prompt para comecar."); return; }
    const now = Date.now();
    // Skip cooldown for retries (retryOverride set)
    if (!retryOverride && now - lastGenRef.current < 10000) { setError("Aguarde 10 segundos entre geracoes."); return; }
    lastGenRef.current = now;
    promptRef.current = currentPrompt;

    setError(""); setGenerating(true); setThinkSteps([]); setStreamingCode(""); setStatusMessages([]);

    try {
      const onProgressFn = (event) => {
        const msg = typeof event === "string" ? event : event?.message || "";
        const step = typeof event === "object" ? event?.step : null;
        const type = typeof event === "object" ? event?.type : "info";
        setThinkSteps(prev => [...prev, { step, message: msg }]);
        // Mecanismo 7: alimenta o GenerationStatus
        setStatusMessages(prev => [...prev, {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          message: msg,
          type: type === "success" ? "success" : type === "warning" ? "warning" : step === "RETRY" ? "warning" : "info",
          timestamp: Date.now(),
        }]);
      };

      const result = await generateFiles(
        currentPrompt,
        onProgressFn,
        generatedFiles?.["src/pages/Dashboard.tsx"] || null,
        (_delta, fullText) => setStreamingCode(fullText),
        history
      );

      if (!result?.files?.["src/pages/Dashboard.tsx"]) throw new Error("App.jsx nao gerado. Tente novamente.");

      const files = result.files;
      const score = result.validation?.score;
      const failedNames = (result.validation?.details || []).filter(d => !d.passed).map(d => d.name);

      // Se é uma EDIÇÃO (já tinha files), mostra diff review antes de aplicar
      if (generatedFiles && Object.keys(generatedFiles).length > 0) {
        setPendingDiff({ oldFiles: generatedFiles, newFiles: files, prompt: currentPrompt, score, failedNames });
        // Não aplica ainda — espera o usuário confirmar no DiffReview
      } else {
        // Primeira geração — aplica direto
        applyFiles(files, currentPrompt, score, failedNames);
      }

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
          knowledge={knowledge}
          hasPreview={hasPreview}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(s => !s)}
          syncing={syncing}
          canUndo={canUndo} canRedo={canRedo}
          onUndo={handleUndo} onRedo={handleRedo}
          versionInfo={versionCount > 0 ? `v${currentVersion}/${versionCount}` : null}
          agenticMode={agenticMode}
          onToggleAgentic={() => setAgenticMode(a => !a)}
          onImportGitHub={() => setShowImport(true)}
          onAgentMode={() => {
            const p = promptRef.current || prompt;
            if (p.trim()) handleAgentMode(p);
          }}
          syntaxStatus={syntaxStatus}
          activeProvider={activeProvider}
          onProviderChange={(id) => { setActiveProvider(id); try { localStorage.setItem("zp_provider", id); } catch {} }}
          orchestratorOpen={orchestratorOpen}
          onToggleOrchestrator={() => { setOrchestratorOpen(o => !o); setEscritorioOpen(false); setNavegadorOpen(false); }}
          escritorioOpen={escritorioOpen}
          onToggleEscritorio={() => { setEscritorioOpen(o => !o); setOrchestratorOpen(false); setNavegadorOpen(false); }}
          navegadorOpen={navegadorOpen}
          onToggleNavegador={() => { setNavegadorOpen(o => !o); setOrchestratorOpen(false); setEscritorioOpen(false); }}
        />

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {agenticMode ? (
            <div style={{ width: hasPreview ? 340 : "100%", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: hasPreview ? `1px solid ${C.border}` : "none", overflow: "hidden", padding: "8px 16px" }}>
              <Suspense fallback={null}>
                <AgenticMode
                  onGenerate={handleAgenticGenerate}
                  generating={generating}
                  thinkSteps={thinkSteps}
                  hasPreview={hasPreview}
                  score={history[history.length - 1]?.score}
                />
              </Suspense>
            </div>
          ) : (
            <ChatArea
              history={history}
              generating={generating}
              streamingCode={streamingCode}
              error={error}
              thinkSteps={thinkSteps}
              prompt={prompt}
              onPromptChange={(v) => { promptRef.current = v; setPrompt(v); setError(""); }}
              onGenerate={handleGenerate}
              onRetry={() => { const lastPrompt = history[history.length - 1]?.prompt; if (lastPrompt) handleGenerate(lastPrompt); else handleGenerate(); }}
              onSuggestionClick={(s) => { promptRef.current = s; setPrompt(s); }}
              onSlashCommand={handleSlashCommand}
              licenseInfo={licenseInfo}
              hasPreview={hasPreview}
              disabled={generating}
            />
          )}

          {hasPreview && (
            <Suspense fallback={null}>
              <PreviewPanel files={generatedFiles} runId={runId} projectName={activeProject?.name} onClose={() => { setGeneratedFiles(null); setRunId(null); }} onAutoFix={(fixPrompt) => { promptRef.current = fixPrompt; setPrompt(fixPrompt); requestAnimationFrame(() => handleGenerate()); }} />
            </Suspense>
          )}
        </div>
      </div>

      {showImport && (
        <Suspense fallback={null}>
          <GitHubImport onImport={handleGitHubImport} onClose={() => setShowImport(false)} />
        </Suspense>
      )}

      {showSettings && (
        <Suspense fallback={null}>
          <SettingsModal licenseInfo={licenseInfo} onClose={() => setShowSettings(false)} onLogout={onLogout} />
        </Suspense>
      )}

      {/* Diff Review modal — shows before applying edits */}
      {pendingDiff && (
        <DiffReview
          oldFiles={pendingDiff.oldFiles}
          newFiles={pendingDiff.newFiles}
          onApply={handleDiffApply}
          onCancel={handleDiffCancel}
        />
      )}

      {/* Rewind panel — Esc+Esc or /rewind */}
      {showRewind && (
        <RewindPanel
          versions={versions}
          currentIndex={currentIndex}
          onRewind={handleRewind}
          onClose={() => setShowRewind(false)}
        />
      )}

      {/* Orchestrator side panel */}
      {orchestratorOpen && (
        <div style={{
          position: "fixed", right: 0, top: 0, height: "100vh", width: 340,
          background: C.surface, borderLeft: `1px solid ${C.border}`,
          zIndex: 200, display: "flex", flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.3)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderBottom: `1px solid ${C.border}`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: DM }}>{"\uD83C\uDFAF"} Orquestrador</span>
            <button onClick={() => setOrchestratorOpen(false)} style={{
              background: "none", border: "none", color: C.textDim, cursor: "pointer",
              fontSize: 16, padding: 4, lineHeight: 1,
            }}>{"\u2715"}</button>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Suspense fallback={null}>
              <OrchestratorPanel />
            </Suspense>
          </div>
        </div>
      )}

      {/* Escritorio side panel — WhatsApp style */}
      {escritorioOpen && (
        <div style={{
          position: "fixed", right: 0, top: 0, height: "100vh", width: 380,
          zIndex: 200, display: "flex", flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.4)",
          overflow: "hidden", borderRadius: "0",
        }}>
          {/* Close button floating */}
          <button onClick={() => setEscritorioOpen(false)} style={{
            position: "absolute", top: 10, right: 10, zIndex: 10,
            width: 28, height: 28, borderRadius: "50%", border: "none",
            background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 14,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>{"\u2715"}</button>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Suspense fallback={null}>
              <Escritorio />
            </Suspense>
          </div>
        </div>
      )}

      {/* Navegador side panel */}
      {navegadorOpen && (
        <div style={{
          position: "fixed", right: 0, top: 0, height: "100vh", width: 420,
          zIndex: 200, display: "flex", flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.4)", overflow: "hidden",
        }}>
          <button onClick={() => setNavegadorOpen(false)} style={{
            position: "absolute", top: 8, right: 8, zIndex: 10,
            width: 28, height: 28, borderRadius: "50%", border: "none",
            background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: 14,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>{"\u2715"}</button>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Suspense fallback={null}>
              <Navegador />
            </Suspense>
          </div>
        </div>
      )}

      {/* Mecanismo 7: Indicador visual de status da geracao */}
      <GenerationStatus
        isGenerating={generating}
        attempt={retryEngine.getAttemptInfo().attempt}
        maxAttempts={retryEngine.getMaxAttempts()}
        messages={statusMessages}
        onDismiss={() => setStatusMessages([])}
      />

      {/* Disparador floating bridge — only if admin key exists */}
      {(() => { const ak = localStorage.getItem("zp_admin_key"); return ak ? <Suspense fallback={null}><DisparadorBridge adminKey={ak} /></Suspense> : null; })()}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
}
