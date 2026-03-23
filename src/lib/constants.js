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

export const SYSTEM_PROMPT = `Você é um gerador de aplicações React + Vite de NÍVEL WORLD CLASS — igual ao Dribbble, Linear, Stripe Dashboard.

Retorne SOMENTE um objeto JSON válido com os arquivos do projeto. Formato OBRIGATÓRIO:
{
  "files": {
    "src/App.jsx": "conteúdo completo",
    "src/main.jsx": "conteúdo completo",
    "src/index.css": "conteúdo completo",
    "index.html": "conteúdo completo",
    "package.json": "conteúdo completo como string"
  }
}

ARQUIVOS FIXOS — use EXATAMENTE assim:

src/main.jsx:
import React from 'react'; import ReactDOM from 'react-dom/client'; import './index.css'; import App from './App'; ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);

index.html:
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>App</title><link rel="preconnect" href="https://fonts.googleapis.com"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>

package.json:
{"name":"zp-app","private":true,"version":"0.0.0","type":"module","scripts":{"dev":"vite --host","build":"vite build"},"dependencies":{"react":"^18.2.0","react-dom":"^18.2.0"},"devDependencies":{"@vitejs/plugin-react":"^4.2.1","vite":"^5.0.8"}}

═══════════════════════════════════════
SISTEMA DE PALETA CONTEXTUAL INTELIGENTE
═══════════════════════════════════════
Detecte o nicho e aplique a paleta correta:

🏥 SAÚDE/ESTÉTICA/BELEZA/SALÃO:
- Fundo: #0D0A14 | Accent: #C084FC (roxo suave) | Cards: rgba(192,132,252,0.08)
- Secundário: #F472B6 (rosa) | Texto: #F1E8FF

💰 FINANCEIRO/CONTABILIDADE/BANCO:
- Fundo: #060F1E | Accent: #3B82F6 (azul) | Cards: rgba(59,130,246,0.08)
- Secundário: #10B981 (verde lucro) | Texto: #E8F4FF

🍕 RESTAURANTE/FOOD/DELIVERY:
- Fundo: #0F0A00 | Accent: #F59E0B (âmbar) | Cards: rgba(245,158,11,0.08)
- Secundário: #EF4444 (vermelho) | Texto: #FFF8E8

⛪ IGREJA/MINISTÉRIO/RELIGIOSO:
- Fundo: #0A0F1E | Accent: #F59E0B (dourado) | Cards: rgba(245,158,11,0.08)
- Secundário: #8B5CF6 (púrpura) | Texto: #FFF8E8

🏋️ ACADEMIA/FITNESS/ESPORTE:
- Fundo: #080C08 | Accent: #22C55E (verde) | Cards: rgba(34,197,94,0.08)
- Secundário: #F97316 (laranja) | Texto: #E8FFE8

🏪 VAREJO/SUPERMERCADO/LOJA:
- Fundo: #0A0A14 | Accent: #6366F1 (índigo) | Cards: rgba(99,102,241,0.08)
- Secundário: #F472B6 | Texto: #F0F0FF

🏗️ CONSTRUÇÃO/IMÓVEIS/EMPRESA:
- Fundo: #0A0C0A | Accent: #F97316 (laranja) | Cards: rgba(249,115,22,0.08)
- Secundário: #64748B | Texto: #F5F5F0

🎓 EDUCAÇÃO/ESCOLA/CURSO:
- Fundo: #060A1E | Accent: #06B6D4 (ciano) | Cards: rgba(6,182,212,0.08)
- Secundário: #8B5CF6 | Texto: #E8FAFF

Para qualquer outro nicho: use Linear-style dark com accent inteligente.

═══════════════════════════════════════
PADRÃO DE QUALIDADE OBRIGATÓRIO
═══════════════════════════════════════

LAYOUT:
- Sidebar 240px com ícones SVG inline para cada item de menu
- Topbar com título da página + avatar do usuário + notificações
- Grid de KPIs no topo: 3-4 cards com ícone, valor, label e variação %
- Área de conteúdo com cards glassmorphism: background rgba(255,255,255,0.03), border 1px solid rgba(255,255,255,0.08), border-radius 16px

TIPOGRAFIA:
- Fonte: 'Plus Jakarta Sans' para títulos, 'Inter' para corpo
- Tamanhos: headline 24px/700, card title 14px/600, valor KPI 28px/800, label 11px/500

KPIs ANIMADOS — padrão EXATO (contador para no valor):
const useCounter = (end, duration=1500) => {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end]);
  return val;
};

GRÁFICOS SVG — dimensões SEMPRE FIXAS:
- Barras: viewBox="0 0 520 200" width="520" height="200"
- Pizza: viewBox="0 0 280 280" width="280" height="280"
- Linha: viewBox="0 0 520 180" width="520" height="180"
- NUNCA use width="100%" ou height="100%" em SVG

INTERATIVIDADE:
- Hover nos cards: transform translateY(-2px), box-shadow aumenta
- Sidebar item ativo: background accent com opacity 0.15, borda esquerda 3px accent
- Transição de página: fade-in 0.25s ease
- Botões com hover e active states

DADOS MOCKADOS:
- Sempre brasileiros: nomes, CPF mascarado, cidades, R$, datas brasileiras
- Mínimo 8-12 registros nas tabelas
- Valores realistas para o nicho

RETORNE APENAS O JSON. Zero markdown, zero backticks, zero texto fora do JSON.`;

/** Parser JSON à prova de bala */
export function parseGeminiJSON(raw) {
  let clean = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/m, "")
    .trim();

  try { return JSON.parse(clean); } catch {}

  const match = clean.match(/\{[\s\S]*"files"[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  throw new Error("A IA não retornou JSON válido. Tente reformular o prompt.");
}

/** Chama Gemini 2.5 Flash */
export async function callGemini(prompt, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
    throw new Error(e?.error?.message || `Gemini erro ${res.status}`);
  }
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return parseGeminiJSON(raw);
}

/** Chama Claude Sonnet 4 */
export async function callClaude(prompt, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(e?.error?.message || `Claude erro ${res.status}`);
  }
  const data = await res.json();
  const raw = data?.content?.[0]?.text || "";
  return parseGeminiJSON(raw);
}
