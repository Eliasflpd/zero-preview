import { callClaude, callClaudeStream } from "./api";

// ─── CORES ───────────────────────────────────────────────────────────────────
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

// ─── PROMPTS ─────────────────────────────────────────────────────────────────
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

GRAFICOS - RECHARTS OBRIGATORIO:
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
SEMPRE use ResponsiveContainer com width="100%" e height numerico.
NUNCA use SVG manual para graficos.
Pizza SEMPRE com cores: const CORES = ['#1565C0', '#059669', '#3B82F6', '#F59E0B', '#EF4444'];

Card padrao: background #FFFFFF, borderRadius 12, border 1px solid #E5E7EB, padding 20px 24px, boxShadow 0 1px 3px rgba(0,0,0,0.06).
Dados mockados sempre brasileiros. Minimo 8 registros nas tabelas.

Retorne APENAS o codigo JSX completo. Sem JSON, sem markdown, apenas o codigo.`;

const REVIEWER_PROMPT = `Voce e um revisor especialista em React + Vite. Corrija erros no codigo JSX recebido.

CORRIJA OBRIGATORIAMENTE:
1. Tailwind CSS - substitua por inline styles
2. Imports nao instalados (exceto: react, react-dom, recharts, lucide-react) - remova
3. Icones sem size - adicione size={18}
4. Componentes nao definidos - adicione ou remova
5. useState/useEffect sem import - adicione
6. export default faltando - adicione
7. Grafico pizza sem cores - adicione array CORES com 5 cores
8. Botoes sidebar sem onClick - adicione onClick

Retorne APENAS o codigo JSX corrigido, sem markdown.`;

// ─── FIXED FILES (template para apps gerados) ────────────────────────────────
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
      recharts: "^2.12.7", "lucide-react": "^0.383.0",
    },
    devDependencies: { "@vitejs/plugin-react": "^4.2.1", vite: "^5.0.8" }
  }, null, 2),
};

// ─── HELPER ──────────────────────────────────────────────────────────────────
function cleanCodeFences(raw) {
  return raw.replace(/^```jsx?\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/m, "").trim();
}

// ─── GERAÇÃO COM STREAMING ──────────────────────────────────────────────────
// onProgress(msg, type) — status steps
// onCodeStream(delta, fullText) — código aparecendo em tempo real
export async function generateFiles(prompt, onProgress, previousCode = null, onCodeStream = null) {
  const files = { ...FIXED_FILES };

  // 1 — Detecta nicho (fast, non-streaming)
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

  // 3 — App.jsx (STREAMING — user sees code appearing in real time)
  onProgress?.("Gerando aplicacao React (2/3)...", "info");
  const appPrompt = previousCode
    ? `CODIGO ATUAL:\n\`\`\`jsx\n${previousCode.slice(0, 8000)}\n\`\`\`\n\nMODIFICACAO: ${prompt}\n\nRetorne App.jsx COMPLETO. Apenas JSX.`
    : `${prompt}\n\nNicho: ${nicho}. Use paleta do nicho.\nRetorne APENAS src/App.jsx completo. Sem markdown.`;

  const appRaw = await callClaudeStream(
    SYSTEM_PROMPT,
    appPrompt,
    12000,
    onCodeStream // cada delta é enviado para a UI em tempo real
  );

  const appCode = cleanCodeFences(appRaw);
  if (!appCode || appCode.length < 100) throw new Error("Codigo muito pequeno. Tente novamente.");

  // 4 — Revisor (streaming também — user vê a correção acontecendo)
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
