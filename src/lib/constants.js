export const C = {
  bg: "#060F1E", surface: "#0D1B2E", surface2: "#112238",
  border: "#1A2E45", borderHover: "#243F5E",
  yellow: "#FFD050", yellowDim: "#CC9F20",
  yellowGlow: "rgba(255,208,80,0.15)", yellowGlow2: "rgba(255,208,80,0.06)",
  text: "#E8F0F8", textMuted: "#6B8BAA", textDim: "#3A5470",
  success: "#34D399", error: "#F87171", info: "#60A5FA",
};

export const SYNE = "'Syne', sans-serif";
export const DM = "'DM Sans', sans-serif";

export const SYSTEM_PROMPT = `Voce e um gerador de aplicacoes React + Vite de NIVEL WORLD CLASS - igual ao Dribbble, Linear, Stripe Dashboard.

ATENCAO: Retorne APENAS o codigo JSX do componente React. Sem JSON, sem markdown, sem explicacoes.
Comece diretamente com: import { useState, useEffect } from 'react';

REGRA ABSOLUTA - CSS INLINE PURO:
NUNCA use Tailwind CSS. NUNCA use classes CSS externas.
TODO estilo deve ser CSS inline via style={{}} no JSX.

Exemplo CORRETO:
<div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#FFFFFF', borderRadius: 12 }}>

Exemplo ERRADO (NUNCA faca):
<div className="flex items-center gap-3 p-4 bg-white rounded-xl">

ICONES - LUCIDE REACT:
import { LayoutDashboard, Users, ShoppingCart, TrendingUp, Bell, Settings, LogOut, DollarSign, Package, Calendar, BarChart2, PieChart, Activity, ArrowUpRight, ArrowDownRight, Search, Plus, Edit, Trash2, Eye, Filter, Download, ChevronRight, Home, FileText, CreditCard, Wallet, UserCheck, Star, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
- SEMPRE passe size explicito: <LayoutDashboard size={18} color="#6B8BAA" />
- Menu ativo: color={ACCENT} | KPIs: size={20} | Botoes: size={16}
- NUNCA omita o size - icone sem size fica gigante

PALETAS POR NICHO:
BELEZA/SALAO: Fundo:#FDF6F0 Sidebar:#3D1C52 Accent:#C2185B Texto sidebar:#FFFFFF
RESTAURANTE/FOOD: Fundo:#FFFBF5 Sidebar:#1A0A00 Accent:#E65100 Texto sidebar:#FFFFFF
FINANCEIRO/BANCO: Fundo:#F0F4FF Sidebar:#0D1B4B Accent:#1565C0 Texto sidebar:#FFFFFF
ACADEMIA/FITNESS: Fundo:#F0FFF4 Sidebar:#0A2E0A Accent:#2E7D32 Texto sidebar:#FFFFFF
IGREJA/RELIGIOSO: Fundo:#FFFEF5 Sidebar:#1A1400 Accent:#F9A825 Texto sidebar:#FFFFFF
VAREJO/LOJA: Fundo:#F8F9FF Sidebar:#1A237E Accent:#3949AB Texto sidebar:#FFFFFF
CONSTRUCAO/IMOVEIS: Fundo:#FFF8F5 Sidebar:#1A0E00 Accent:#E64A19 Texto sidebar:#FFFFFF
EDUCACAO/ESCOLA: Fundo:#F0FBFF Sidebar:#003366 Accent:#0277BD Texto sidebar:#FFFFFF
SAUDE/CLINICA: Fundo:#F0FAFF Sidebar:#004D66 Accent:#0097A7 Texto sidebar:#FFFFFF
CRIATIVO/AGENCIA: Fundo:#FFF5FF Sidebar:#2D0040 Accent:#7B1FA2 Texto sidebar:#FFFFFF
Outros: Fundo:#F0F4FF Sidebar:#0D1B4B Accent:#1565C0 Texto sidebar:#FFFFFF

ESTRUTURA RAIZ:
display flex, height 100vh, overflow hidden.
Sidebar: width 240px fixo, height 100vh, background SIDEBAR.
Conteudo: flex 1, display flex, flexDirection column, overflow hidden.
Topbar: height 56px, background #FFFFFF, borderBottom 1px solid #E5E7EB.
Main: flex 1, overflowY auto, padding 24px 28px, background FUNDO.

SIDEBAR - NUNCA use ul/li - use div com style inline:
Item ativo: background rgba(255,255,255,0.12), borderLeft 3px solid ACCENT.
Item inativo: color rgba(255,255,255,0.6).
Botoes SEMPRE clicaveis com onClick.

KPIs ANIMADOS:
const useCounter = (end, duration=1500) => {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let start=0; const step=end/(duration/16);
    const t=setInterval(()=>{ start+=step; if(start>=end){setVal(end);clearInterval(t);}else setVal(Math.floor(start)); },16);
    return ()=>clearInterval(t);
  },[end]);
  return val;
};

GRAFICOS - SVG INLINE OBRIGATORIO:
NUNCA importe recharts, chart.js, react-chartjs-2 ou qualquer lib de graficos.
Use APENAS SVG inline com viewBox fixo.
Pizza SEMPRE com cores: const CORES = ['#1565C0', '#059669', '#3B82F6', '#F59E0B', '#EF4444'];

Card padrao: background #FFFFFF, borderRadius 12, border 1px solid #E5E7EB, padding 20px 24px, boxShadow 0 1px 3px rgba(0,0,0,0.06).
Dados mockados sempre brasileiros. Minimo 8 registros nas tabelas.

Retorne APENAS o codigo JSX completo. Sem JSON, sem markdown, apenas o codigo.`;

const REVIEWER_PROMPT = `Voce e um revisor especialista em React + Vite. Corrija erros no codigo JSX recebido.

CORRIJA OBRIGATORIAMENTE:
1. Tailwind CSS - substitua por inline styles
2. Imports nao instalados (exceto: react, react-dom, chart.js, react-chartjs-2, lucide-react) - remova
3. Icones sem size - adicione size={18}
4. Componentes nao definidos - adicione ou remova
5. useState/useEffect sem import - adicione
6. export default faltando - adicione
7. Grafico pizza sem cores - adicione array CORES com 5 cores
8. Botoes sidebar sem onClick - adicione onClick

Retorne APENAS o codigo JSX corrigido, sem markdown.`;

export function parseGeminiJSON(raw) {
  if (!raw) throw new Error("Resposta vazia da IA.");
  let clean = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/m,"").trim();
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*"files"[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  const start = clean.indexOf('{'); const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1) { try { return JSON.parse(clean.slice(start, end + 1)); } catch {} }
  throw new Error("JSON invalido. Tente novamente.");
}

const FIXED_FILES = {
  "src/main.jsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);`,

  "index.html": `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>App</title><link rel="preconnect" href="https://fonts.googleapis.com"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head><body style="margin:0;padding:0"><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`,

  "package.json": JSON.stringify({
    name: "zp-app", private: true, version: "0.0.0", type: "module",
    scripts: { dev: "vite --host", build: "vite build" },
    dependencies: {
      react: "^18.2.0", "react-dom": "^18.2.0",
      "lucide-react": "^0.383.0",
    },
    devDependencies: { "@vitejs/plugin-react-swc": "^3.5.0", vite: "^5.0.8" }
  }, null, 2),
};

// ─── ORDEM DE FALLBACK ────────────────────────────────────────────────────────
const FALLBACK_ORDER = ["groq", "gemini", "openrouter", "deepseek"];

function getApiKey(model) {
  const map = {
    gemini:     "zp_gemini_key",
    groq:       "zp_groq_key",
    openrouter: "zp_openrouter_key",
    deepseek:   "zp_deepseek_key",
  };
  try { return JSON.parse(localStorage.getItem(map[model])) || ""; } catch { return ""; }
}

// ─── CHAMADA ÚNICA DE IA ──────────────────────────────────────────────────────
async function callAI(systemPrompt, userPrompt, apiKey, model) {

  if (model === "gemini") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 32768 },
        }),
      }
    );
    if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `Gemini erro ${res.status}`); }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  } else if (model === "groq") {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 8192,
        temperature: 0.85,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `Groq erro ${res.status}`); }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";

  } else if (model === "openrouter") {
    // ✅ CORRIGIDO: model ID com hífen correto
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://zero-preview-six.vercel.app",
        "X-Title": "Zero Preview",
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-coder-32b-instruct",
        max_tokens: 16000,
        temperature: 0.85,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `OpenRouter erro ${res.status}`); }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";

  } else {
    // ✅ CORRIGIDO: deepseek max_tokens 8192 (limite máximo)
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 8192,
        temperature: 0.85,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `DeepSeek erro ${res.status}`); }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  }
}

// ─── FALLBACK AUTOMÁTICO ──────────────────────────────────────────────────────
async function callWithFallback(systemPrompt, userPrompt, preferredModel, onProgress) {
  const order = [preferredModel, ...FALLBACK_ORDER.filter(m => m !== preferredModel)];

  for (const model of order) {
    const key = getApiKey(model);
    if (!key) continue;
    try {
      if (model !== preferredModel) {
        onProgress?.(`${preferredModel} indisponivel, usando ${model}...`, "info");
      }
      const result = await callAI(systemPrompt, userPrompt, key, model);
      if (result && result.length > 50) return { result, usedModel: model };
    } catch {
      continue;
    }
  }

  throw new Error("Todos os modelos falharam. Verifique suas chaves nas Configuracoes.");
}

// ─── GERAÇÃO ARQUIVO POR ARQUIVO ─────────────────────────────────────────────
export async function generateFiles(prompt, apiKey, model, onProgress, previousCode = null) {
  const files = { ...FIXED_FILES };

  // Detecta nicho
  let nicho = "generic";
  try {
    const { result: nichoRaw } = await callWithFallback(
      "Voce detecta nichos. Responda apenas UMA palavra em ingles: beauty, food, finance, fitness, church, retail, construction, education, nature, health, creative, or generic.",
      `Nicho deste pedido: ${prompt}`,
      model, onProgress
    );
    nicho = nichoRaw.trim().toLowerCase().split(/\s/)[0] || "generic";
  } catch {}
  onProgress?.(`Nicho: ${nicho}`, "info");

  // PASSO 1 — CSS
  onProgress?.("Gerando estilos (1/3)...", "info");
  try {
    const { result: css } = await callWithFallback(
      "Especialista CSS. Retorne APENAS CSS puro, sem markdown.",
      `CSS moderno para React nicho "${nicho}". Reset, variaveis, Inter e Plus Jakarta Sans, body e #root.`,
      model, onProgress
    );
    files["src/index.css"] = css.replace(/^```css\s*/i,"").replace(/\s*```$/m,"").trim();
  } catch {
    files["src/index.css"] = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#f8f9ff;color:#1a1a2e}#root{min-height:100vh}`;
  }

  // PASSO 2 — App.jsx
  onProgress?.("Gerando aplicacao React (2/3)...", "info");
  const appPrompt = previousCode
    ? `CODIGO ATUAL:\n\`\`\`jsx\n${previousCode.slice(0, 8000)}\n\`\`\`\n\nMODIFICACAO: ${prompt}\n\nRetorne App.jsx COMPLETO. Apenas JSX.`
    : `${prompt}\n\nNicho: ${nicho}. Use paleta do nicho.\nRetorne APENAS src/App.jsx completo. Sem markdown.`;

  const { result: appRaw, usedModel } = await callWithFallback(SYSTEM_PROMPT, appPrompt, model, onProgress);
  if (usedModel !== model) onProgress?.(`Usando ${usedModel} (fallback automatico)`, "info");

  const appCode = appRaw.replace(/^```jsx?\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/m,"").trim();
  if (!appCode || appCode.length < 100) throw new Error("Codigo muito pequeno. Tente novamente.");

  // PASSO 3 — REVISOR
  onProgress?.("Revisando codigo (3/3)...", "info");
  try {
    const { result: reviewedRaw } = await callWithFallback(
      REVIEWER_PROMPT,
      `Revise e corrija:\n\n${appCode.slice(0, 12000)}`,
      model, onProgress
    );
    const reviewed = reviewedRaw.replace(/^```jsx?\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/m,"").trim();
    files["src/App.jsx"] = (reviewed && reviewed.length > 100) ? reviewed : appCode;
    onProgress?.("Pronto!", "success");
  } catch {
    files["src/App.jsx"] = appCode;
    onProgress?.("Gerado!", "success");
  }

  return { files };
}

export async function callGemini(prompt, apiKey) {
  return generateFiles(prompt, apiKey, "groq", null);
}
export async function callClaude(prompt, apiKey) {
  return generateFiles(prompt, apiKey, "groq", null);
}
