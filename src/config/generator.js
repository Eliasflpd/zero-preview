// ─── ZERO PREVIEW — ORQUESTRADOR DE AGENTES v2 ──────────────────────────────
// Pipeline: VELOCISTA → SOMMELIER → ARQUITETO → EXECUTOR → CRITICO → MEMORIALISTA
// v2: auto-regenerate, CSS templates, silent review, edit mode, real cache L2

import { callClaude, callClaudeStream, alertCritical } from "../lib/api";
import { SYSTEM_PROMPT, REVIEWER_PROMPT } from "./prompts";
import { FIXED_FILES, buildNicheCSS } from "./templates";
import { NICHE_DETECT_PROMPT, getNiche } from "./niches";
import { analyzePrompt } from "./architect";
import { validateCode, getValidationSummary } from "./validator";
import { getCacheEntry, setCacheEntry, recordGeneration, getTopPrompts } from "../lib/cache";

// ─── CONTEXTO BR (injetado em TODA chamada — geração E edit) ─────────────────
const CONTEXTO_BR = `
CONTEXTO BRASIL OBRIGATORIO:
- Valores monetarios SEMPRE em R$ usando: const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
- Metodo de pagamento preferencial: PIX. Inclua PIX em qualquer tela de pagamento ou financeiro.
- Documentos: CPF (mascarado: ***.***-XX) ou CNPJ em formularios.
- Nomes brasileiros: Maria Silva, Joao Santos, Ana Oliveira, Carlos Souza, Fernanda Lima, Pedro Costa.
- Datas no formato DD/MM/AAAA: new Date().toLocaleDateString('pt-BR').
- Telefone: (11) 98765-4321. CEP: 01310-100. Cidades: Sao Paulo, Rio de Janeiro, Belo Horizonte.
- Status em portugues: Ativo, Pendente, Cancelado, Concluido.
- NUNCA use nomes em ingles (John, Jane, Mike). NUNCA use $ sem ser R$. NUNCA use MM/DD/YYYY.`;

function cleanCodeFences(raw) {
  return raw.replace(/^```jsx?\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/m, "").trim();
}

function isAuthError(e) {
  return e.message === "LICENSE_INVALID" || e.message === "LICENSE_EXPIRED" || e.message === "RATE_LIMITED";
}

// ─── STEP ENUM — contract between generator and UI ───────────────────────────
// GenerationProgress reads .step to show agent name. Text can change freely.
export const STEPS = {
  REBUILD:      "REBUILD",
  CACHE_HIT:    "CACHE_HIT",
  CACHE_REUSE:  "CACHE_REUSE",
  SOMMELIER:    "SOMMELIER",
  ARCHITECT:    "ARCHITECT",
  CSS:          "CSS",
  MEMORIALISTA: "MEMORIALISTA",
  EXECUTOR:     "EXECUTOR",
  CRITICO:      "CRITICO",
  REVIEWER:     "REVIEWER",
  DONE:         "DONE",
  EDIT:         "EDIT",
  RETRY:        "RETRY",
};

function emit(onProgress, step, message, type = "info") {
  onProgress?.({ step, message, type });
}

// buildNicheCSS is now imported from templates.js

// ─── EDIT vs REBUILD DISCRIMINATOR ───────────────────────────────────────────
// Detects if a prompt with previousCode is a small edit or a full rebuild
function shouldRebuild(prompt, previousCode) {
  const p = prompt.toLowerCase();

  // Rebuild triggers: explicit "refaz", niche change, "do zero", etc.
  const rebuildKeywords = [
    "refaz", "refaca", "recria", "recrie", "recomeca", "do zero", "desde o inicio",
    "muda tudo", "troca tudo", "novo app", "novo sistema", "outro tipo",
    "transforma em", "converte para", "vira um", "agora quero",
    "esquece isso", "descarta", "apaga tudo",
  ];
  if (rebuildKeywords.some(k => p.includes(k))) return true;

  // Niche shift: previous code is niche X, prompt asks for niche Y
  const prevNiche = guessNicheLocal(extractPromptHint(previousCode));
  const newNiche = guessNicheLocal(prompt);
  if (prevNiche !== "generic" && newNiche !== "generic" && prevNiche !== newNiche) return true;

  // Very long prompts (>150 words) with previousCode suggest a full redesign
  if (prompt.split(/\s+/).length > 150) return true;

  // Layer 4: Structural depth — features that require full architecture change
  const structuralKeywords = [
    "login", "auth", "autenticac", "senha", "usuario", "cadastro", "registro de usuario",
    "pagina", "rota", "router", "navegac", "menu com abas", "tabs", "multiplas telas",
    "banco de dados", "backend", "api externa", "fetch de dados reais", "integrac",
    "multiplos componentes", "separar em arquivos", "componentizar", "adiciona sidebar",
    "adiciona dashboard", "sistema completo", "painel admin",
  ];
  if (structuralKeywords.some(k => p.includes(k))) return true;

  return false;
}

// Extract a hint about what the previous code was (from comments or component names)
function extractPromptHint(code) {
  // Try to find niche clues in the code itself
  const themeMatch = code.match(/sidebar:\s*['"]([^'"]+)['"]/);
  const titleMatch = code.match(/(?:Dashboard|Painel|Sistema)\s+(?:de\s+)?(\w+)/i);
  return (themeMatch?.[1] || "") + " " + (titleMatch?.[1] || "");
}

// ─── MAIN PIPELINE ───────────────────────────────────────────────────────────
export async function generateFiles(prompt, onProgress, previousCode = null, onCodeStream = null, projectHistory = null) {
  const startTime = Date.now();
  const files = { ...FIXED_FILES };

  // ══ DISCRIMINATOR: Edit leve vs Pipeline completo ══════════════════════════
  if (previousCode) {
    if (shouldRebuild(prompt, previousCode)) {
      emit(onProgress, STEPS.REBUILD, "Mudanca estrutural detectada — gerando do zero");
      // Fall through to full pipeline (previousCode ignored)
    } else {
      return await editMode(prompt, previousCode, files, onProgress, onCodeStream, startTime);
    }
  }

  // ══ STEP 0: VELOCISTA — Cache check ════════════════════════════════════════
  const quickNiche = guessNicheLocal(prompt);
  const cached = getCacheEntry(prompt, quickNiche);

  if (cached && cached.level === 1) {
    emit(onProgress, STEPS.CACHE_HIT, `Cache hit! ${cached.savings}`, "success");
    emit(onProgress, STEPS.DONE, "Pronto!", "success");
    recordGeneration({ prompt, nicho: quickNiche, score: cached.entry.score, duration: Date.now() - startTime, success: true, cached: true });
    return { files: cached.entry.files, validation: { score: cached.entry.score } };
  }

  // ══ STEP 1: SOMMELIER — Detect niche (local first, AI fallback) ════════════
  let nicho = quickNiche;
  if (nicho === "generic") {
    try {
      const nichoRaw = await callClaude(NICHE_DETECT_PROMPT, `Nicho: ${prompt}`, 30);
      nicho = nichoRaw.trim().toLowerCase().split(/\s/)[0] || "generic";
    } catch (e) {
      if (isAuthError(e)) throw e;
    }
  }
  const nicheConfig = getNiche(nicho);
  emit(onProgress, STEPS.SOMMELIER, `Nicho: ${nicheConfig.label}`);

  // ══ STEP 2: ARQUITETO — Analyze prompt ═════════════════════════════════════
  const brief = analyzePrompt(prompt, nicho);
  emit(onProgress, STEPS.ARCHITECT, `${brief.complexity} · ${brief.pages} secoes · ${brief.components.length} componentes`);

  // ══ STEP 3: CSS template (no AI call — saves ~4000 tokens) ═════════════════
  files["src/index.css"] = buildNicheCSS(nicheConfig.palette);
  // Add App.tsx router that imports Dashboard
  files["src/App.tsx"] = `import Dashboard from "./pages/Dashboard";\nexport default function App() { return <Dashboard />; }`;

  emit(onProgress, STEPS.CSS, "Estilos aplicados", "success");

  // ══ STEP 4: MEMORIALISTA — Build enhanced prompt ═══════════════════════════
  const topPrompts = getTopPrompts(3);
  let extras = "";
  if (topPrompts.length > 0) {
    extras += `\n\nEXEMPLOS BEM-SUCEDIDOS:\n${topPrompts.map((p, i) => `${i + 1}. "${p}"`).join("\n")}`;
  }

  // Project history insights: learn from past failures
  if (projectHistory) {
    const pastFails = projectHistory
      .filter(h => h.score && h.score < 50)
      .slice(0, 3);
    if (pastFails.length > 0) {
      const failNotes = pastFails.map(h => `- Prompt "${h.prompt?.slice(0, 60)}" gerou score ${h.score}/100`).join("\n");
      extras += `\n\nHISTORICO DO PROJETO (evite repetir erros):\n${failNotes}`;
    }
  }

  // VELOCISTA Level 2: inject cached code as reference
  if (cached && (cached.level === 2 || cached.level === 3)) {
    const refCode = cached.entry.files?.["src/pages/Dashboard.tsx"];
    if (refCode) {
      extras += `\n\nCODIGO DE REFERENCIA (projeto similar, use como base de estrutura):\n\`\`\`jsx\n${refCode.slice(0, 4000)}\n\`\`\``;
      emit(onProgress, STEPS.CACHE_REUSE, "Reutilizando estrutura de projeto similar");
    }
  }

  // ══ STEP 5: EXECUTOR — Generate App.jsx (streaming) ════════════════════════
  emit(onProgress, STEPS.EXECUTOR, "Gerando aplicacao React...");

  const appPrompt = `${prompt}\n\n${CONTEXTO_BR}\n\nBRIEFING DO ARQUITETO:\n${brief.instruction}${extras}\n\nRetorne APENAS o codigo de src/pages/Dashboard.tsx. Sem markdown. Comece com imports.`;
  let appCode = await generateAndValidate(appPrompt, onProgress, onCodeStream);

  files["src/pages/Dashboard.tsx"] = appCode.code;

  // ══ STEP 6: MEMORIALISTA — Record + VELOCISTA — Cache ══════════════════════
  const duration = Date.now() - startTime;
  recordGeneration({ prompt: prompt.slice(0, 200), nicho, score: appCode.score, duration, success: true });
  setCacheEntry(prompt, nicho, files, appCode.score);

  emit(onProgress, STEPS.DONE, `Pronto! ${appCode.summary.emoji} ${appCode.score}/100 (${(duration / 1000).toFixed(1)}s)`, "success");
  return { files, validation: appCode.validation };
}

// ─── EDIT MODE (lightweight — 1 AI call) ─────────────────────────────────────
async function editMode(prompt, previousCode, files, onProgress, onCodeStream, startTime) {
  emit(onProgress, STEPS.EDIT, "Modo edicao rapida...");

  const editPrompt = `CODIGO ATUAL:\n\`\`\`jsx\n${previousCode.slice(0, 10000)}\n\`\`\`\n\nALTERACAO SOLICITADA: ${prompt}\n\n${CONTEXTO_BR}\n\nREGRAS:\n- Retorne o App.jsx COMPLETO modificado\n- Mantenha TODAS as funcionalidades existentes\n- Apenas aplique a alteracao pedida\n- Mantenha o objeto THEME existente\n- Mantenha todos os componentes existentes\n- CSS inline, sem Tailwind\n- Sem markdown, sem explicacoes\n\nRetorne APENAS o codigo.`;

  const raw = await callClaudeStream(SYSTEM_PROMPT, editPrompt, 16000, onCodeStream);
  const code = cleanCodeFences(raw);
  if (!code || code.length < 100) throw new Error("Codigo muito pequeno. Tente novamente.");

  const validation = validateCode(code);
  const summary = getValidationSummary(validation);
  files["src/pages/Dashboard.tsx"] = code;

  const duration = Date.now() - startTime;
  recordGeneration({ prompt: prompt.slice(0, 200), nicho: "edit", score: validation.score, duration, success: true });

  emit(onProgress, STEPS.DONE, `Editado! ${summary.emoji} ${validation.score}/100 (${(duration / 1000).toFixed(1)}s)`, "success");
  return { files, validation };
}

// ─── GENERATE + VALIDATE + AUTO-RETRY ────────────────────────────────────────
async function generateAndValidate(appPrompt, onProgress, onCodeStream) {
  let appCode = "";
  let validation;
  let summary;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      emit(onProgress, STEPS.RETRY, "Score baixo. Regenerando...");
    }

    const appRaw = await callClaudeStream(SYSTEM_PROMPT, appPrompt, 16000, onCodeStream);
    appCode = cleanCodeFences(appRaw);
    if (!appCode || appCode.length < 100) throw new Error("Codigo muito pequeno. Tente novamente.");

    validation = validateCode(appCode);
    summary = getValidationSummary(validation);
    emit(onProgress, STEPS.CRITICO, `${summary.emoji} ${validation.score}/100`);

    if (validation.score >= 40) {
      const failedChecks = validation.details.filter(d => !d.passed);
      if (failedChecks.length > 0) {
        emit(onProgress, STEPS.REVIEWER, "Revisando qualidade...");
        const reviewExtra = `\n\nCORRIJA ESTES PROBLEMAS:\n${failedChecks.map(d => `- ${d.name}: ${d.message}`).join("\n")}`;
        try {
          const reviewedRaw = await callClaude(
            REVIEWER_PROMPT,
            `Revise e corrija:\n\n${appCode.slice(0, 14000)}${reviewExtra}`,
            16000
          );
          const reviewed = cleanCodeFences(reviewedRaw);
          if (reviewed && reviewed.length > 100) {
            const reviewValidation = validateCode(reviewed);
            if (reviewValidation.score >= validation.score) {
              appCode = reviewed;
              validation = reviewValidation;
              summary = getValidationSummary(validation);
              emit(onProgress, STEPS.CRITICO, `Revisado: ${summary.emoji} ${validation.score}/100`);
            }
          }
        } catch (e) {
          if (isAuthError(e)) throw e;
        }
      }
      break;
    }

    // Score < 40 on first attempt — will retry
    if (attempt === 0 && validation.score < 40) continue;
  }

  // Alert Discord if still critical after all attempts
  if (validation.score < 40) {
    alertCritical("SCORE_BAIXO", appPrompt.slice(0, 100), validation.score);
  }
  const v11 = validation.details?.find(d => d.id === "V11");
  if (v11 && !v11.passed) {
    alertCritical("V11_FALHOU", appPrompt.slice(0, 100), validation.score);
  }

  return { code: appCode, score: validation.score, validation, summary };
}

// ─── LOCAL NICHE GUESS (no AI call) ──────────────────────────────────────────
function guessNicheLocal(prompt) {
  const p = prompt.toLowerCase();
  const map = [
    [["salao", "beleza", "cabeleir", "maquia", "unha"], "beauty"],
    [["restaurante", "lanchonete", "pizzaria", "cardapio", "food"], "food"],
    [["banco", "financ", "investim", "fintech", "pagament"], "finance"],
    [["academia", "fitness", "crossfit", "personal", "treino"], "fitness"],
    [["igreja", "culto", "congreg", "dizimo", "celula"], "church"],
    [["loja", "varejo", "comercio", "pdv", "estoque"], "retail"],
    [["construt", "obra", "engenharia"], "construction"],
    [["escola", "educac", "faculdade", "cursinho", "aluno"], "education"],
    [["clinica", "hospital", "medic", "saude", "consultorio"], "health"],
    [["agencia", "design", "marketing", "criativ", "portfolio"], "creative"],
    [["advog", "juridic", "escritorio de", "processo", "direito"], "law"],
    [["veterinar", "vet", "animal", "pet clinic"], "vet"],
    [["idioma", "ingles", "espanhol", "lingua", "fluenc"], "languages"],
    [["petshop", "pet shop", "racao", "banho e tosa"], "petshop"],
    [["farmacia", "drogaria", "medicament", "remedios"], "pharmacy"],
    [["imobiliaria", "corretor", "aluguel", "imovel"], "realestate"],
    [["ong", "voluntari", "social", "doacao", "ministerio"], "ministry"],
    [["mecanica", "oficina", "automovel", "carro", "motor"], "automotive"],
    [["buffet", "evento", "festa", "casamento", "aniversario"], "events"],
    [["artesanato", "handmade", "atelie", "feito a mao", "croche"], "crafts"],
  ];
  for (const [keywords, id] of map) {
    if (keywords.some(k => p.includes(k))) return id;
  }
  return "generic";
}
