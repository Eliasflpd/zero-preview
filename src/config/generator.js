// ─── ZERO PREVIEW — ORQUESTRADOR DE AGENTES ─────────────────────────────────
// Conecta: SOMMELIER → ARQUITETO → EXECUTOR → CRITICO → MEMORIALISTA/VELOCISTA

import { callClaude, callClaudeStream } from "../lib/api";
import { SYSTEM_PROMPT, REVIEWER_PROMPT } from "./prompts";
import { FIXED_FILES } from "./templates";
import { NICHE_DETECT_PROMPT, getNiche } from "./niches";
import { analyzePrompt } from "./architect";
import { validateCode, getValidationSummary } from "./validator";
import { getCacheEntry, setCacheEntry, recordGeneration, getTopPrompts } from "../lib/cache";

function cleanCodeFences(raw) {
  return raw.replace(/^```jsx?\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/m, "").trim();
}

function isAuthError(e) {
  return e.message === "LICENSE_INVALID" || e.message === "LICENSE_EXPIRED" || e.message === "RATE_LIMITED";
}

// ─── MAIN PIPELINE ───────────────────────────────────────────────────────────
// onProgress(msg, type) — status steps
// onCodeStream(delta, fullText) — code appearing in real time
export async function generateFiles(prompt, onProgress, previousCode = null, onCodeStream = null) {
  const startTime = Date.now();
  const files = { ...FIXED_FILES };

  // ── STEP 0: VELOCISTA — Check cache first ──────────────────────────────────
  // (skip cache for modifications/iterations)
  if (!previousCode) {
    // Quick niche guess for cache lookup (no AI call)
    const quickNiche = guessNicheLocal(prompt);
    const cached = getCacheEntry(prompt, quickNiche);
    if (cached && cached.level === 1) {
      onProgress?.(`Cache hit! ${cached.savings}`, "success");
      onProgress?.("Pronto!", "success");
      recordGeneration({ prompt, nicho: quickNiche, score: cached.entry.score, duration: Date.now() - startTime, success: true, cached: true });
      return { files: cached.entry.files };
    }
    // Level 2/3: inject as context for the AI, but still generate
    if (cached && cached.level === 2) {
      onProgress?.(`Prompt similar encontrado (${Math.round(cached.similarity * 100)}%). Adaptando...`, "info");
    }
  }

  // ── STEP 1: SOMMELIER — Detect niche ───────────────────────────────────────
  let nicho = "generic";
  try {
    const nichoRaw = await callClaude(NICHE_DETECT_PROMPT, `Nicho deste pedido: ${prompt}`, 50);
    nicho = nichoRaw.trim().toLowerCase().split(/\s/)[0] || "generic";
  } catch (e) {
    if (isAuthError(e)) throw e;
    nicho = guessNicheLocal(prompt);
  }
  const nicheConfig = getNiche(nicho);
  onProgress?.(`Nicho: ${nicheConfig.label}`, "info");

  // ── STEP 2: ARQUITETO — Analyze prompt ─────────────────────────────────────
  const brief = analyzePrompt(prompt, nicho);
  onProgress?.(`Arquiteto: ${brief.complexity} · ${brief.pages} secoes · ${brief.components.length} componentes`, "info");

  // ── STEP 3: MEMORIALISTA — Inject top examples ─────────────────────────────
  const topPrompts = getTopPrompts(3);
  let examplesBlock = "";
  if (topPrompts.length > 0) {
    examplesBlock = `\n\nEXEMPLOS DE PROMPTS BEM-SUCEDIDOS (use como referencia de qualidade):\n${topPrompts.map((p, i) => `${i + 1}. "${p}"`).join("\n")}`;
  }

  // ── STEP 4: EXECUTOR — Generate CSS ────────────────────────────────────────
  onProgress?.("Gerando estilos (1/4)...", "info");
  try {
    const cssPrompt = `CSS moderno para React.
Nicho: "${nicheConfig.label}".
Paleta: bg=${nicheConfig.palette.bg}, accent=${nicheConfig.palette.accent}, sidebar=${nicheConfig.palette.sidebar}.
Inclua: reset, CSS variables com :root, fontes ${nicheConfig.fonts || "Inter"}, body, #root, scrollbar dark, @keyframes fadeInUp e pulse.
Retorne APENAS CSS puro, sem markdown.`;
    const css = await callClaude("Especialista CSS. Retorne APENAS CSS puro, sem markdown, sem explicacoes.", cssPrompt, 4000);
    files["src/index.css"] = cleanCodeFences(css);
  } catch (e) {
    if (isAuthError(e)) throw e;
    files["src/index.css"] = buildFallbackCSS(nicheConfig);
  }

  // ── STEP 5: EXECUTOR — Generate App.jsx (STREAMING) ────────────────────────
  onProgress?.("Gerando aplicacao React (2/4)...", "info");

  const archInstruction = brief.instruction;
  const appPrompt = previousCode
    ? `CODIGO ATUAL:\n\`\`\`jsx\n${previousCode.slice(0, 8000)}\n\`\`\`\n\nMODIFICACAO: ${prompt}\n\nBRIEFING DO ARQUITETO:\n${archInstruction}\n\nRetorne App.jsx COMPLETO. Apenas JSX.`
    : `${prompt}\n\nBRIEFING DO ARQUITETO:\n${archInstruction}${examplesBlock}\n\nRetorne APENAS src/App.jsx completo. Sem markdown.`;

  const appRaw = await callClaudeStream(SYSTEM_PROMPT, appPrompt, 16000, onCodeStream);
  let appCode = cleanCodeFences(appRaw);
  if (!appCode || appCode.length < 100) throw new Error("Codigo muito pequeno. Tente novamente.");

  // ── STEP 6: CRITICO — Validate before review ──────────────────────────────
  const preValidation = validateCode(appCode);
  const preSummary = getValidationSummary(preValidation);
  onProgress?.(`Critico pre-revisao: ${preSummary.emoji} ${preValidation.score}/100 (${preSummary.label})`, "info");

  // ── STEP 7: EXECUTOR — Review + Fix (STREAMING) ────────────────────────────
  onProgress?.("Revisando codigo (3/4)...", "info");

  // Build targeted review instructions based on what CRITICO found
  const failedChecks = preValidation.details.filter(d => !d.passed).map(d => `- ${d.name}: ${d.message}`);
  const reviewExtra = failedChecks.length > 0
    ? `\n\nPROBLEMAS DETECTADOS PELO VALIDADOR (corrija OBRIGATORIAMENTE):\n${failedChecks.join("\n")}`
    : "";

  try {
    const reviewedRaw = await callClaudeStream(
      REVIEWER_PROMPT,
      `Revise e corrija:\n\n${appCode.slice(0, 14000)}${reviewExtra}`,
      16000,
      onCodeStream
    );
    const reviewed = cleanCodeFences(reviewedRaw);
    if (reviewed && reviewed.length > 100) appCode = reviewed;
  } catch (e) {
    if (isAuthError(e)) throw e;
    // Keep pre-review code
  }

  // ── STEP 8: CRITICO — Final validation ─────────────────────────────────────
  const finalValidation = validateCode(appCode);
  const finalSummary = getValidationSummary(finalValidation);
  onProgress?.(`Critico final: ${finalSummary.emoji} ${finalValidation.score}/100 (${finalSummary.label})`, "info");

  files["src/App.jsx"] = appCode;

  // ── STEP 9: MEMORIALISTA — Record result ───────────────────────────────────
  const duration = Date.now() - startTime;
  recordGeneration({
    prompt: prompt.slice(0, 200),
    nicho,
    score: finalValidation.score,
    duration,
    success: true,
  });

  // VELOCISTA — Cache if good score
  setCacheEntry(prompt, nicho, files, finalValidation.score);

  onProgress?.(`Pronto! (${(duration / 1000).toFixed(1)}s)`, "success");
  return { files, validation: finalValidation };
}

// ─── LOCAL NICHE GUESS (no AI call, for cache lookup) ────────────────────────
function guessNicheLocal(prompt) {
  const p = prompt.toLowerCase();
  const map = [
    [["salao", "beleza", "cabeleir", "maquia", "unha"], "beauty"],
    [["restaurante", "lanchonete", "pizzaria", "cardapio", "food"], "food"],
    [["banco", "financ", "investim", "fintech", "pagament"], "finance"],
    [["academia", "fitness", "crossfit", "personal", "treino"], "fitness"],
    [["igreja", "culto", "ministerio", "congreg", "dizimo"], "church"],
    [["loja", "varejo", "comercio", "pdv", "estoque"], "retail"],
    [["construt", "obra", "engenharia", "imovel"], "construction"],
    [["escola", "educac", "faculdade", "cursinho", "aluno"], "education"],
    [["clinica", "hospital", "medic", "saude", "consultorio"], "health"],
    [["agencia", "design", "marketing", "criativ", "portfolio"], "creative"],
    [["advog", "juridic", "escritorio", "processo", "lei"], "law"],
    [["veterinar", "vet", "animal", "pet clinic"], "vet"],
    [["idioma", "ingles", "espanhol", "lingua", "fluenc"], "languages"],
    [["petshop", "pet shop", "racao", "banho e tosa"], "petshop"],
    [["farmacia", "drogaria", "medicament", "remedios"], "pharmacy"],
    [["imobiliaria", "corretor", "aluguel", "imov"], "realestate"],
    [["ong", "voluntari", "social", "doacao", "caridade"], "ministry"],
    [["mecanica", "oficina", "automovel", "carro", "motor"], "automotive"],
    [["buffet", "evento", "festa", "casamento", "aniversario"], "events"],
    [["artesanato", "handmade", "atelie", "feito a mao", "croche"], "crafts"],
  ];
  for (const [keywords, id] of map) {
    if (keywords.some(k => p.includes(k))) return id;
  }
  return "generic";
}

// ─── FALLBACK CSS ────────────────────────────────────────────────────────────
function buildFallbackCSS(niche) {
  return `:root{--bg:${niche.palette.bg};--sidebar:${niche.palette.sidebar};--accent:${niche.palette.accent};--card:#FFFFFF;--border:#E5E7EB;--text:#1A1A2E;--text-muted:#6B7280;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
#root{min-height:100vh}
@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`;
}
