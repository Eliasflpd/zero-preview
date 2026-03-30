// ─── ZERO PREVIEW — TEMPLATE ENGINE ──────────────────────────────────────────
// Motor de templates: modelo fraco extrai JSON de intencao → template gera codigo valido.
// NUNCA depende de modelo fraco pra gerar codigo React livre.
// Pipeline: prompt → extractIntent() → getTemplateBuilder() → codigo TSX 100% valido.

import { extractIntent } from "./intentExtractor";
import { getTemplateBuilder } from "../templates/index";
import { validateCode, getValidationSummary } from "../config/validator";

// Providers considerados "fracos" (template-only)
const WEAK_PROVIDERS = new Set([
  "auto", "groq", "gemini", "huggingface", "sambanova",
  "mistral", "scaleway", "cloudflare", "deepseek", "cerebras",
]);

// Providers tier-1 (geracao livre)
const TIER1_PROVIDERS = new Set(["claude", "gpt-4o", "gpt-4"]);

/**
 * Verifica se o provider atual deve usar template engine.
 * @returns {boolean}
 */
export function shouldUseTemplate() {
  const provider = (localStorage.getItem("zp_provider") || "auto").toLowerCase();
  // Se for tier-1, usa geracao livre
  if (TIER1_PROVIDERS.has(provider)) return false;
  // Qualquer outro → template
  return true;
}

/**
 * Gera codigo TSX via template engine.
 * @param {string} prompt - Pedido do usuario
 * @param {string} niche - Nicho detectado
 * @param {object} palette - Paleta de cores do nicho
 * @param {function} onProgress - Callback de progresso
 * @returns {Promise<{code: string, score: number, validation: object, summary: object, intent: object}>}
 */
export async function generateFromTemplate(prompt, niche, palette, onProgress) {
  const t0 = Date.now();

  // Step 1: Extrair intencao (modelo fraco faz isso bem)
  onProgress?.({ step: "INTENT", message: "Extraindo intencao...", type: "info" });
  const intent = await extractIntent(prompt, niche);

  // Step 2: Escolher template pelo tipo de app
  const builder = getTemplateBuilder(intent.appType);

  // Step 3: Gerar codigo a partir do template + intencao
  onProgress?.({ step: "TEMPLATE", message: `Template: ${intent.appType}`, type: "info" });
  let code;
  try {
    code = builder(intent, palette);
    console.log('[Zero AUDIT] template-engine', { status: 'ok', fallbackUsed: false, reason: null, durationMs: Date.now() - t0 });
  } catch (e) {
    console.log('[Zero AUDIT] template-engine', { status: 'failed', fallbackUsed: false, reason: e.message, durationMs: Date.now() - t0 });
    throw e;
  }

  // Step 4: Validar (deve passar com score alto, ja que template e valido)
  const validation = validateCode(code);
  const summary = getValidationSummary(validation);

  return {
    code,
    score: validation.score,
    validation,
    summary,
    intent,
  };
}

export { WEAK_PROVIDERS, TIER1_PROVIDERS };
