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
ARSENAL DE PALETAS — DETECÇÃO AUTOMÁTICA POR NICHO
═══════════════════════════════════════
Analise o prompt e escolha a paleta EXATA. NUNCA use dark roxo genérico.
Use sempre temas LIGHT ou COLORIDOS vibrantes — nunca fundos pretos/muito escuros.

💅 BELEZA / SALÃO / SOBRANCELHAS / SPA / ESTÉTICA:
- Fundo: #FDF6F0 | Surface: #FFFFFF | Sidebar: #3D1C52
- Accent: #C2185B (rosa forte) | Secundário: #F8BBD0
- Cards: border 1px solid #F8E0EC | Texto: #2D1B33
- Estilo: feminino, elegante, clean, espaçado

🍕 RESTAURANTE / DELIVERY / FOOD / LANCHONETE:
- Fundo: #FFFBF5 | Surface: #FFFFFF | Sidebar: #1A0A00
- Accent: #E65100 (laranja quente) | Secundário: #FFF3E0
- Cards: border 1px solid #FFE0B2 | Texto: #1A0A00
- Estilo: apetitoso, quente, convidativo

💰 FINANCEIRO / CONTABILIDADE / BANCO / INVESTIMENTO:
- Fundo: #F0F4FF | Surface: #FFFFFF | Sidebar: #0D1B4B
- Accent: #1565C0 (azul profissional) | Secundário: #E3F2FD
- Cards: border 1px solid #BBDEFB | Texto: #0D1B4B
- Estilo: sério, confiável, clean, corporativo

🏋️ ACADEMIA / FITNESS / ESPORTE / CROSSFIT:
- Fundo: #F0FFF4 | Surface: #FFFFFF | Sidebar: #0A2E0A
- Accent: #2E7D32 (verde energia) | Secundário: #E8F5E9
- Cards: border 1px solid #C8E6C9 | Texto: #0A2E0A
- Estilo: energético, forte, motivacional

⛪ IGREJA / MINISTÉRIO / RELIGIOSO / PASTORAL:
- Fundo: #FFFEF5 | Surface: #FFFFFF | Sidebar: #1A1400
- Accent: #F9A825 (dourado) | Secundário: #FFF8E1
- Cards: border 1px solid #FFECB3 | Texto: #1A1400
- Estilo: sagrado, acolhedor, elegante

🏪 VAREJO / LOJA / SUPERMERCADO / COMÉRCIO:
- Fundo: #F8F9FF | Surface: #FFFFFF | Sidebar: #1A237E
- Accent: #3949AB (índigo) | Secundário: #E8EAF6
- Cards: border 1px solid #C5CAE9 | Texto: #1A237E
- Estilo: moderno, organizado, confiável

🏗️ CONSTRUÇÃO / IMÓVEIS / ENGENHARIA:
- Fundo: #FFF8F5 | Surface: #FFFFFF | Sidebar: #1A0E00
- Accent: #E64A19 (laranja construção) | Secundário: #FBE9E7
- Cards: border 1px solid #FFCCBC | Texto: #1A0E00
- Estilo: robusto, sólido, profissional

🎓 EDUCAÇÃO / ESCOLA / CURSO / ENSINO:
- Fundo: #F0FBFF | Surface: #FFFFFF | Sidebar: #003366
- Accent: #0277BD (azul educação) | Secundário: #E1F5FE
- Cards: border 1px solid #B3E5FC | Texto: #003366
- Estilo: inteligente, organizado, moderno

🌿 NATUREZA / ORGÂNICO / SUSTENTÁVEL / PLANTAS:
- Fundo: #F5FBF0 | Surface: #FFFFFF | Sidebar: #1B4020
- Accent: #388E3C (verde natureza) | Secundário: #E8F5E9
- Cards: border 1px solid #C8E6C9 | Texto: #1B4020
- Estilo: natural, fresco, orgânico

🏥 SAÚDE / CLÍNICA / MÉDICO / FARMÁCIA:
- Fundo: #F0FAFF | Surface: #FFFFFF | Sidebar: #004D66
- Accent: #0097A7 (ciano saúde) | Secundário: #E0F7FA
- Cards: border 1px solid #B2EBF2 | Texto: #004D66
- Estilo: limpo, confiável, asséptico, profissional

🎨 CRIATIVO / AGÊNCIA / DESIGN / MARKETING:
- Fundo: #FFF5FF | Surface: #FFFFFF | Sidebar: #2D0040
- Accent: #7B1FA2 (roxo criativo) | Secundário: #F3E5F5
- Cards: border 1px solid #E1BEE7 | Texto: #2D0040
- Estilo: criativo, vibrante, moderno

Para qualquer outro nicho: use paleta light profissional com accent azul corporativo #1565C0.

REGRAS DE DESIGN UNIVERSAL:
- NUNCA use fundo preto puro — mínimo #0D1B2E se dark for necessário
- Sidebar sempre mais escura que o conteúdo
- Cards com sombra suave: box-shadow 0 1px 3px rgba(0,0,0,0.08)
- Bordas arredondadas: 12px cards, 8px botões, 20px modais
- Espaçamento generoso: padding mínimo 20px nos cards

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
  if (!raw) throw new Error("Resposta vazia da IA.");

  let clean = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/m, "")
    .trim();

  // Tenta parse direto
  try { return JSON.parse(clean); } catch {}

  // Tenta extrair JSON com "files"
  const match = clean.match(/\{[\s\S]*"files"[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  // Tenta qualquer JSON válido
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(clean.slice(start, end + 1)); } catch {}
  }

  throw new Error("A IA não retornou JSON válido. Tente um prompt mais simples.");
}

/** Chamada simples para um arquivo */
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
          generationConfig: { temperature: 0.85, maxOutputTokens: 65536 },
        }),
      }
    );
    if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `Gemini erro ${res.status}`); }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  } else if (model === "deepseek") {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-coder",
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

  } else if (model === "grok") {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-3",
        max_tokens: 32000,
        temperature: 0.85,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `Grok erro ${res.status}`); }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";

  } else {
    // Claude
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 16000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `Claude erro ${res.status}`); }
    const data = await res.json();
    const textBlock = data?.content?.find(b => b.type === "text");
    return textBlock?.text || data?.content?.[0]?.text || "";
  }
}

/** Arquivos fixos — nunca mudam */
const FIXED_FILES = {
  "src/main.jsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);`,

  "index.html": `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>App</title><link rel="preconnect" href="https://fonts.googleapis.com"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`,

  "package.json": JSON.stringify({
    name: "zp-app", private: true, version: "0.0.0", type: "module",
    scripts: { dev: "vite --host", build: "vite build" },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      recharts: "^2.12.7",
      "lucide-react": "^0.383.0",
    },
    devDependencies: { "@vitejs/plugin-react": "^4.2.1", vite: "^5.0.8" }
  }, null, 2),
};

/**
 * Geração arquivo por arquivo — igual ao Lovable
 * Cada arquivo é uma chamada separada → sem limite de tamanho
 * previousCode = código atual para iteração
 */
export async function generateFiles(prompt, apiKey, model, onProgress, previousCode = null) {
  const files = { ...FIXED_FILES };

  // Detecta nicho para paleta
  const nichoPrompt = `Detecte o nicho do seguinte pedido e responda APENAS com uma palavra em inglês: beauty, food, finance, fitness, church, retail, construction, education, nature, health, creative, or generic.\n\nPedido: ${prompt}`;
  let nicho = "generic";
  try {
    const nichoRaw = await callAI("Você detecta nichos de negócio.", nichoPrompt, apiKey, model);
    nicho = nichoRaw.trim().toLowerCase().split(/\s/)[0] || "generic";
  } catch {}

  onProgress?.("Nicho detectado: " + nicho, "info");

  // PASSO 1 — Gera src/index.css
  onProgress?.("Gerando estilos (1/2)...", "info");
  const cssSystem = `Você é um especialista em CSS para React. Retorne APENAS o código CSS puro, sem explicações, sem markdown.`;
  const cssPrompt = `Crie um src/index.css moderno para um app React no nicho "${nicho}".
Inclua: reset CSS, variáveis de cor, font-face para Inter e Plus Jakarta Sans do Google Fonts, estilos base para body e #root.
Use as cores do nicho ${nicho} como variáveis CSS (--color-primary, --color-bg, --color-surface, --color-text).`;

  try {
    const css = await callAI(cssSystem, cssPrompt, apiKey, model);
    files["src/index.css"] = css.replace(/^```css\s*/i, "").replace(/\s*```$/m, "").trim();
  } catch {
    files["src/index.css"] = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; background: #f8f9ff; color: #1a1a2e; }
#root { min-height: 100vh; }`;
  }

  // PASSO 2 — Gera src/App.jsx
  onProgress?.("Gerando aplicação React (2/2)...", "info");
  const appSystem = `${SYSTEM_PROMPT}

ATENÇÃO: Retorne APENAS o código JSX do componente React. Sem JSON, sem markdown, sem explicações.
Comece diretamente com: import { useState, useEffect } from 'react';`;

  // Se é iteração, passa o código anterior como contexto
  const appPrompt = previousCode
    ? `CÓDIGO ATUAL DO APP:
\`\`\`jsx
${previousCode.slice(0, 8000)}
\`\`\`

MODIFICAÇÃO SOLICITADA: ${prompt}

Aplique a modificação no código acima e retorne o App.jsx COMPLETO e ATUALIZADO.
Mantenha tudo que não foi pedido para mudar.
Retorne APENAS o código JSX completo, sem markdown.`
    : `${prompt}

Nicho detectado: ${nicho}
Use a paleta de cores do nicho ${nicho} conforme o sistema de paletas.
Retorne APENAS o código completo do src/App.jsx. Sem JSON, sem markdown, apenas o código JSX.`;

  const appRaw = await callAI(appSystem, appPrompt, apiKey, model);
  const appCode = appRaw
    .replace(/^```jsx?\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/m, "")
    .trim();

  if (!appCode || appCode.length < 100) {
    throw new Error("Código gerado muito pequeno. Tente novamente.");
  }

  files["src/App.jsx"] = appCode;
  onProgress?.("Arquivos gerados com sucesso!", "success");

  return { files };
}

/** Chama Gemini 2.5 Flash — mantido para compatibilidade */
export async function callGemini(prompt, apiKey) {
  return generateFiles(prompt, apiKey, "gemini", null);
}

/** Chama Claude — mantido para compatibilidade */
export async function callClaude(prompt, apiKey) {
  return generateFiles(prompt, apiKey, "claude", null);
}
