// ─── ZERO PREVIEW — AI CODE GENERATOR ────────────────────────────────────────
import { callClaude, callClaudeStream } from "../lib/api";
import { SYSTEM_PROMPT, REVIEWER_PROMPT } from "./prompts";
import { FIXED_FILES } from "./templates";

function cleanCodeFences(raw) {
  return raw.replace(/^```jsx?\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/m, "").trim();
}

// onProgress(msg, type) — status steps
// onCodeStream(delta, fullText) — code appearing in real time
export async function generateFiles(prompt, onProgress, previousCode = null, onCodeStream = null) {
  const files = { ...FIXED_FILES };

  // 1 — Detect niche (fast, non-streaming)
  let nicho = "generic";
  try {
    const nichoRaw = await callClaude(
      "Voce detecta nichos. Responda apenas UMA palavra em ingles: beauty, food, finance, fitness, church, retail, construction, education, nature, health, creative, or generic.",
      `Nicho deste pedido: ${prompt}`,
      100
    );
    nicho = nichoRaw.trim().toLowerCase().split(/\s/)[0] || "generic";
  } catch (e) {
    if (e.message === "LICENSE_INVALID" || e.message === "LICENSE_EXPIRED" || e.message === "RATE_LIMITED") throw e;
  }
  onProgress?.(`Nicho: ${nicho}`, "info");

  // 2 — CSS (fast, non-streaming)
  onProgress?.("Gerando estilos (1/3)...", "info");
  try {
    const css = await callClaude(
      "Especialista CSS. Retorne APENAS CSS puro, sem markdown.",
      `CSS moderno para React nicho "${nicho}". Reset, variaveis, Inter e Plus Jakarta Sans, body e #root.`,
      4000
    );
    files["src/index.css"] = cleanCodeFences(css);
  } catch (e) {
    if (e.message === "LICENSE_INVALID" || e.message === "LICENSE_EXPIRED" || e.message === "RATE_LIMITED") throw e;
    files["src/index.css"] = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#f8f9ff;color:#1a1a2e}#root{min-height:100vh}`;
  }

  // 3 — App.jsx (STREAMING)
  onProgress?.("Gerando aplicacao React (2/3)...", "info");
  const appPrompt = previousCode
    ? `CODIGO ATUAL:\n\`\`\`jsx\n${previousCode.slice(0, 8000)}\n\`\`\`\n\nMODIFICACAO: ${prompt}\n\nRetorne App.jsx COMPLETO. Apenas JSX.`
    : `${prompt}\n\nNicho: ${nicho}. Use paleta do nicho.\nRetorne APENAS src/App.jsx completo. Sem markdown.`;

  const appRaw = await callClaudeStream(SYSTEM_PROMPT, appPrompt, 12000, onCodeStream);
  const appCode = cleanCodeFences(appRaw);
  if (!appCode || appCode.length < 100) throw new Error("Codigo muito pequeno. Tente novamente.");

  // 4 — Reviewer (STREAMING)
  onProgress?.("Revisando codigo (3/3)...", "info");
  try {
    const reviewedRaw = await callClaudeStream(
      REVIEWER_PROMPT,
      `Revise e corrija:\n\n${appCode.slice(0, 12000)}`,
      12000,
      onCodeStream
    );
    const reviewed = cleanCodeFences(reviewedRaw);
    files["src/App.jsx"] = (reviewed && reviewed.length > 100) ? reviewed : appCode;
    onProgress?.("Pronto!", "success");
  } catch (e) {
    if (e.message === "LICENSE_INVALID" || e.message === "LICENSE_EXPIRED" || e.message === "RATE_LIMITED") throw e;
    files["src/App.jsx"] = appCode;
    onProgress?.("Gerado!", "success");
  }

  return { files };
}
