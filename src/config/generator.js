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
import { splitComponents } from "./splitter";
import { knowledgeToContext, loadKnowledge } from "../lib/knowledge";
import { enforceCSS, countHex, fixRechartsJSX } from "../lib/cssEnforcer";
import { ENGINEERING_SYSTEM_PROMPT, buildErrorRecoveryPrompt } from "../lib/engineeringPrompt";
import { errorCapture } from "../lib/errorCapture";
import { projectContext } from "../lib/projectContext";
import { parseAIOutput, sortFilesByDependency, validateFileContent, removeDuplicateConsts, replaceInlineFormatters } from "../lib/patchEngine";
import { reconstructLocally, reconstructWithAI, hasKeepMarkers } from "../lib/model2Reconstructor";
import { shouldUseTemplate, generateFromTemplate } from "../lib/templateEngine";

const API_BASE = import.meta.env.VITE_API_URL || "https://zero-backend-production-7b37.up.railway.app";

/**
 * Modelo 2 — chama backend /reconstruct para reconstruir arquivo.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function callModel2(prompt) {
  const licenseKey = (() => {
    try { return JSON.parse(localStorage.getItem("zp_license")) || ""; } catch { return ""; }
  })();

  const res = await fetch(`${API_BASE}/reconstruct`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-license-key": licenseKey,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) throw new Error(`Reconstruct failed: ${res.status}`);
  const data = await res.json();
  return data.content || "";
}

// ─── CONTEXTO BR (injetado em TODA chamada — geração E edit) ─────────────────
const CONTEXTO_BR = `
CONTEXTO BRASIL OBRIGATORIO:
- Valores monetarios SEMPRE em R$ usando formatCurrency() importado de @/lib/utils. NUNCA redeclare formatCurrency.
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
  INTENT:       "INTENT",
  TEMPLATE:     "TEMPLATE",
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

  // Carrega contexto persistente do projeto (usado no template e no pipeline)
  const activeProjectId = localStorage.getItem("zp_active_project") || "";
  if (activeProjectId) {
    projectContext.load(activeProjectId);
    projectContext.update({ projectName: prompt.slice(0, 50), description: prompt });
  }

  // ══ STEP 3.5: TEMPLATE ENGINE — Se provider fraco, usa template ═══════════
  if (shouldUseTemplate()) {
    emit(onProgress, STEPS.INTENT, "Extraindo intencao (Template Engine)...");
    try {
      const templateResult = await generateFromTemplate(prompt, nicho, nicheConfig.palette, onProgress);
      files["src/pages/Dashboard.tsx"] = templateResult.code;

      emit(onProgress, STEPS.TEMPLATE, `Template ${templateResult.intent.appType} · ${templateResult.summary.emoji} ${templateResult.score}/100`);

      // Cache e registro
      const duration = Date.now() - startTime;
      recordGeneration({ prompt: prompt.slice(0, 200), nicho, score: templateResult.score, duration, success: true, template: true });
      setCacheEntry(prompt, nicho, files, templateResult.score);

      if (activeProjectId) {
        Object.keys(files).forEach(f => projectContext.addGeneratedFile(f));
        projectContext.clearErrors();
        projectContext.save(activeProjectId);
      }

      emit(onProgress, STEPS.DONE, `Pronto! ${templateResult.summary.emoji} ${templateResult.score}/100 (${(duration / 1000).toFixed(1)}s) [Template]`, "success");
      return { files, validation: templateResult.validation };
    } catch (templateErr) {
      // Fallback: se template engine falhar, continua com pipeline normal
      console.log("[Zero] Template engine falhou, usando pipeline normal:", templateErr.message);
      emit(onProgress, STEPS.TEMPLATE, "Template falhou — usando geracao AI", "warning");
    }
  }

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

  // ══ STEP 4.5: CONTEXTO — Injeta memoria do projeto ══════════════════════
  const projectCtxBlock = activeProjectId ? projectContext.buildContextBlock() : "";

  // ══ STEP 5: EXECUTOR — Generate App.jsx (streaming) ════════════════════════
  emit(onProgress, STEPS.EXECUTOR, "Gerando aplicacao React...");

  // Build compact prompt — avoid wasting tokens on repetitive context
  // Injeta ENGINEERING_SYSTEM_PROMPT (Mecanismo 1) + contexto do projeto (Mecanismo 4)
  let appPrompt = `${prompt}\n\n${CONTEXTO_BR}\n\nBRIEFING:\n${brief.instruction}`;
  if (projectCtxBlock) appPrompt += `\n\n${projectCtxBlock}`;
  if (extras) appPrompt += extras;
  appPrompt += `\n\nRetorne APENAS codigo TSX. Sem markdown. Maximo 400 linhas. Comece com imports.`;
  let appCode = await generateAndValidate(appPrompt, onProgress, onCodeStream);

  files["src/pages/Dashboard.tsx"] = appCode.code;

  // ══ STEP 5.5: SPLITTER — Extract components into separate files ════════════
  const originalCode = appCode.code;
  const splitFiles = splitComponents(appCode.code);
  const splitCount = Object.keys(splitFiles).length;
  if (splitCount > 1) {
    // Validate: Dashboard.tsx must not be truncated
    const dashFile = splitFiles["src/pages/Dashboard.tsx"];
    const isTruncated = !dashFile
      || dashFile.trimEnd().endsWith("const")
      || dashFile.trimEnd().endsWith("const ")
      || dashFile.trimEnd().endsWith("{")
      || dashFile.trimEnd().endsWith("(")
      || !dashFile.includes("export default");

    if (isTruncated) {
      // Split failed — use original unsplit file
      files["src/pages/Dashboard.tsx"] = originalCode;
      emit(onProgress, STEPS.ARCHITECT, "Split cancelado (arquivo protegido)");
    } else {
      for (const [path, content] of Object.entries(splitFiles)) {
        files[path] = content;
      }
      emit(onProgress, STEPS.ARCHITECT, `${splitCount} arquivos gerados`);
    }
  }

  // ══ STEP 6: MEMORIALISTA — Record + VELOCISTA — Cache ══════════════════════
  const duration = Date.now() - startTime;
  recordGeneration({ prompt: prompt.slice(0, 200), nicho, score: appCode.score, duration, success: true });
  setCacheEntry(prompt, nicho, files, appCode.score);

  // Mecanismo 4: registra arquivos gerados no contexto persistente
  if (activeProjectId) {
    Object.keys(files).forEach(f => projectContext.addGeneratedFile(f));
    projectContext.clearErrors();
    projectContext.save(activeProjectId);
  }

  emit(onProgress, STEPS.DONE, `Pronto! ${appCode.summary.emoji} ${appCode.score}/100 (${(duration / 1000).toFixed(1)}s)`, "success");
  return { files, validation: appCode.validation };
}

// ─── EDIT MODE (dual-model — Modelo 1 gera diff, Modelo 2 reconstroi) ───────
async function editMode(prompt, previousCode, files, onProgress, onCodeStream, startTime) {
  emit(onProgress, STEPS.EDIT, "Modo edicao (dual-model)...");

  // Inject project knowledge context if available
  const knowledgeCtx = knowledgeToContext(loadKnowledge(localStorage.getItem("zp_active_project") || ""));

  // Modelo 1 (Arquiteto): gera diff parcial com "keep existing code"
  // Instrui explicitamente a usar o formato diff em vez de reescrever tudo
  const editSystem = `${SYSTEM_PROMPT}\n\n${ENGINEERING_SYSTEM_PROMPT}`;
  const editPrompt = `CODIGO ATUAL DO ARQUIVO:\n\`\`\`tsx\n${previousCode.slice(0, 6000)}\n\`\`\`${knowledgeCtx}\n\nALTERACAO PEDIDA: ${prompt}\n\nUse "// ... keep existing code (descricao)" para secoes que NAO mudam. Escreva completo apenas o codigo novo ou modificado. Sem markdown, sem explicacao. Se a mudanca for pequena, a maioria do arquivo deve ser "keep existing code".`;

  let raw;
  try {
    raw = await callClaude(editSystem, editPrompt, 8192);
  } catch (e) {
    if (isAuthError(e)) throw e;
    raw = await callClaudeStream(editSystem, editPrompt, 8192, onCodeStream);
  }
  let code = cleanCodeFences(raw);
  if (!code || code.length < 50) throw new Error("Codigo muito pequeno. Tente novamente.");

  // Dual-model: se o AI usou "keep existing code", reconstroi com Modelo 2
  if (hasKeepMarkers(code)) {
    emit(onProgress, STEPS.EDIT, "Modelo 2 reconstruindo arquivo...");

    // Passo 1: tenta reconstrucao local (instantanea)
    const localResult = reconstructLocally("src/pages/Dashboard.tsx", previousCode, code);

    if (localResult.hasUnresolved) {
      // Passo 2: sobrou "keep" sem resolver — chama Modelo 2 via backend
      try {
        const aiResult = await reconstructWithAI(
          "src/pages/Dashboard.tsx", previousCode, code, callModel2
        );
        code = aiResult.fullContent;
      } catch (reconstructErr) {
        // Fallback: usa resultado parcial da reconstrucao local
        code = localResult.fullContent;
      }
    } else {
      code = localResult.fullContent;
    }

    // Verifica se a reconstrucao nao ficou vazia ou muito pequena
    if (!code || code.length < 100) {
      // Fallback final: pede pro AI reescrever completo
      emit(onProgress, STEPS.EDIT, "Reconstrucao falhou — modo fallback...");
      const fallbackPrompt = `CODIGO ATUAL:\n\`\`\`tsx\n${previousCode.slice(0, 6000)}\n\`\`\`\n\nALTERACAO: ${prompt}\n\nRetorne o codigo COMPLETO modificado. Sem "keep existing code". Mantenha tudo que funciona. Sem markdown.`;
      try {
        raw = await callClaude("Voce edita codigo React+TypeScript+Tailwind. Retorne APENAS o codigo modificado completo.", fallbackPrompt, 8192);
        code = cleanCodeFences(raw);
      } catch (e) {
        if (isAuthError(e)) throw e;
        raw = await callClaudeStream(SYSTEM_PROMPT, fallbackPrompt, 8192, onCodeStream);
        code = cleanCodeFences(raw);
      }
      if (!code || code.length < 100) throw new Error("Codigo muito pequeno. Tente novamente.");
    }
  }

  // CSS Enforcer no edit mode
  const hexEdit = countHex(code);
  if (hexEdit > 0) {
    code = enforceCSS(code);
    code = fixRechartsJSX(code);
    console.log(`[Zero] CSS Enforcer (edit): ${hexEdit} hex → CSS vars`);
  }

  // Substitui formatters inline por import + remove duplicatas
  code = removeDuplicateConsts(replaceInlineFormatters(code));

  const validation = validateCode(code);
  const summary = getValidationSummary(validation);

  // Mecanismo 3: valida conteudo antes de aplicar
  const patchCheck = validateFileContent("src/pages/Dashboard.tsx", code);
  if (!patchCheck.valid) {
    emit(onProgress, STEPS.CRITICO, `Alerta: ${patchCheck.issues.join(', ')}`, "warning");
  }

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

  // System prompt enriquecido com regras de engenharia (Mecanismo 1)
  const enrichedSystem = `${SYSTEM_PROMPT}\n\n${ENGINEERING_SYSTEM_PROMPT}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      emit(onProgress, STEPS.RETRY, "Score baixo. Regenerando...");

      // Mecanismo 5: usa recovery prompt com escalada de estrategia
      const capturedErrors = errorCapture.getRecentErrors(3);
      if (capturedErrors.length > 0) {
        const errorMsg = capturedErrors.map(e => e.message).join('\n');
        const errorStack = capturedErrors.map(e => e.stack || '').filter(Boolean).join('\n');
        const recoveryBlock = buildErrorRecoveryPrompt(errorMsg, errorStack, attempt + 1);
        appPrompt = `${recoveryBlock}\n\nPEDIDO ORIGINAL:\n${appPrompt}`;
      }
    }

    const appRaw = await callClaudeStream(enrichedSystem, appPrompt, 16000, onCodeStream);
    appCode = cleanCodeFences(appRaw);
    if (!appCode || appCode.length < 100) throw new Error("Codigo muito pequeno. Tente novamente.");

    // CSS Enforcer: converte hex hardcoded → CSS variables (antes do CRITICO)
    const hexBefore = countHex(appCode);
    if (hexBefore > 0) {
      appCode = enforceCSS(appCode);
      console.log(`[Zero] CSS Enforcer: ${hexBefore} hex → CSS vars`);
    }
    appCode = fixRechartsJSX(appCode);

    // Substitui formatters inline por import + remove duplicatas
    appCode = removeDuplicateConsts(replaceInlineFormatters(appCode));

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
          let reviewed = cleanCodeFences(reviewedRaw);
          if (reviewed && reviewed.length > 100) {
            // CSS Enforcer pos-REVIEWER
            const hexReview = countHex(reviewed);
            if (hexReview > 0) {
              reviewed = enforceCSS(reviewed);
              reviewed = fixRechartsJSX(reviewed);
              console.log(`[Zero] CSS Enforcer pos-REVIEWER: ${hexReview} hex → CSS vars`);
            }
            reviewed = removeDuplicateConsts(replaceInlineFormatters(reviewed));
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
