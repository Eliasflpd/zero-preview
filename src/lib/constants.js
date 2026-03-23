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

// ─── PROMPT REFORMULADOR OCULTO ──────────────────────────────────────────────
export const REFORMULATOR_PROMPT = `Voce e um arquiteto de software senior especializado em aplicacoes React profissionais.

Sua unica tarefa e reformular o pedido do usuario em um briefing tecnico detalhado para um gerador de codigo React.

REGRAS:
- Analise a intencao real por tras do pedido
- Identifique o nicho/setor do negocio
- Deduza quais modulos/paginas fazem sentido para esse negocio
- Especifique os dados que devem aparecer (KPIs, tabelas, graficos)
- Defina o tom visual adequado ao nicho
- Seja especifico e tecnico - o gerador de codigo vai seguir seu briefing a risca

FORMATO DE SAIDA - retorne APENAS um JSON:
{
  "nicho": "nome do setor (ex: Financeiro, Salao de Beleza, Academia)",
  "nome_app": "nome sugerido para o app",
  "paginas": ["Dashboard", "Clientes", "..."],
  "kpis": ["KPI 1 com valor exemplo", "KPI 2..."],
  "graficos": ["Tipo de grafico + dado que representa"],
  "tabelas": ["Tabela 1 com colunas sugeridas"],
  "tom_visual": "descricao do estilo visual adequado ao nicho",
  "prompt_final": "prompt completo e detalhado para o gerador React, em portugues, descrevendo tudo acima de forma tecnica e precisa"
}

Retorne APENAS o JSON. Zero texto fora do JSON.`;

// ─── SYSTEM PROMPT PRINCIPAL ─────────────────────────────────────────────────
export const SYSTEM_PROMPT = `Voce e um gerador de aplicacoes React + Vite de NIVEL WORLD CLASS - igual ao Dribbble, Linear, Stripe Dashboard.

Retorne SOMENTE um objeto JSON valido com os arquivos do projeto. Formato OBRIGATORIO:
{
  "files": {
    "src/App.jsx": "conteudo completo",
    "src/main.jsx": "conteudo completo",
    "src/index.css": "conteudo completo",
    "index.html": "conteudo completo",
    "package.json": "conteudo completo como string"
  }
}

ARQUIVOS FIXOS - use EXATAMENTE assim:

src/main.jsx:
import React from 'react'; import ReactDOM from 'react-dom/client'; import './index.css'; import App from './App'; ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);

index.html:
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>App</title><link rel="preconnect" href="https://fonts.googleapis.com"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head><body style="margin:0;padding:0"><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>

package.json:
{"name":"zp-app","private":true,"version":"0.0.0","type":"module","scripts":{"dev":"vite --host","build":"vite build"},"dependencies":{"react":"^18.2.0","react-dom":"^18.2.0","recharts":"^2.12.0","lucide-react":"^0.400.0"},"devDependencies":{"@vitejs/plugin-react":"^4.2.1","vite":"^5.0.8"}}

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
BELEZA/SALAO: Fundo:#FDF6F0 Sidebar:#3D1C52 Accent:#C2185B
RESTAURANTE/FOOD: Fundo:#FFFBF5 Sidebar:#1A0A00 Accent:#E65100
FINANCEIRO/BANCO: Fundo:#F0F4FF Sidebar:#0D1B4B Accent:#1565C0
ACADEMIA/FITNESS: Fundo:#F0FFF4 Sidebar:#0A2E0A Accent:#2E7D32
IGREJA/RELIGIOSO: Fundo:#FFFEF5 Sidebar:#1A1400 Accent:#F9A825
VAREJO/LOJA: Fundo:#F8F9FF Sidebar:#1A237E Accent:#3949AB
CONSTRUCAO/IMOVEIS: Fundo:#FFF8F5 Sidebar:#1A0E00 Accent:#E64A19
EDUCACAO/ESCOLA: Fundo:#F0FBFF Sidebar:#003366 Accent:#0277BD
SAUDE/CLINICA: Fundo:#F0FAFF Sidebar:#004D66 Accent:#0097A7
CRIATIVO/AGENCIA: Fundo:#FFF5FF Sidebar:#2D0040 Accent:#7B1FA2
Outros: Fundo:#F0F4FF Sidebar:#0D1B4B Accent:#1565C0
Texto sidebar sempre: #FFFFFF

ESTRUTURA RAIZ:
<div style={{ display:'flex', height:'100vh', fontFamily:"'Inter', sans-serif", background:FUNDO, overflow:'hidden' }}>
  <Sidebar /> (width:240px fixo)
  <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
    <Topbar /> (height:56px, background:#FFFFFF, borderBottom:'1px solid #E5E7EB')
    <main style={{ flex:1, overflowY:'auto', padding:'24px 28px', background:FUNDO }}>
      conteudo
    </main>
  </div>
</div>

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

BarChart exemplo:
<ResponsiveContainer width="100%" height={240}>
  <BarChart data={data} margin={{top:5,right:20,left:0,bottom:5}}>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false}/>
    <XAxis dataKey="name" tick={{fontSize:11,fill:'#6B7280'}} axisLine={false} tickLine={false}/>
    <YAxis tick={{fontSize:11,fill:'#6B7280'}} axisLine={false} tickLine={false}/>
    <Tooltip contentStyle={{borderRadius:8,border:'1px solid #E5E7EB',fontSize:12}}/>
    <Bar dataKey="valor" fill={ACCENT} radius={[6,6,0,0]}/>
  </BarChart>
</ResponsiveContainer>

Card padrao: { background:'#FFFFFF', borderRadius:12, border:'1px solid #E5E7EB', padding:'20px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }

Dados mockados sempre brasileiros: nomes, CPF mascarado, cidades BR, R$, datas BR. Minimo 8 registros nas tabelas.

RETORNE APENAS O JSON. Zero markdown, zero backticks, zero texto fora do JSON.`;

// ─── PARSERS ─────────────────────────────────────────────────────────────────
export function parseGeminiJSON(raw) {
  let clean = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/m,"").trim();
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*"files"[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  throw new Error("A IA nao retornou JSON valido. Tente reformular o prompt.");
}

export function parseReformulatorJSON(raw) {
  let clean = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/m,"").trim();
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*"prompt_final"[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}

// ─── REFORMULADOR ────────────────────────────────────────────────────────────
export async function reformulatePrompt(prompt, apiKey, model) {
  try {
    if (model === "claude") {
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
          max_tokens: 2000,
          system: REFORMULATOR_PROMPT,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) return prompt;
      const data = await res.json();
      const raw = data?.content?.[0]?.text || "";
      const parsed = parseReformulatorJSON(raw);
      return parsed?.prompt_final || prompt;
    } else if (model === "deepseek") {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          max_tokens: 2000,
          temperature: 0.5,
          messages: [
            { role: "system", content: REFORMULATOR_PROMPT },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!res.ok) return prompt;
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content || "";
      const parsed = parseReformulatorJSON(raw);
      return parsed?.prompt_final || prompt;
    } else {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: REFORMULATOR_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 2000 },
          }),
        }
      );
      if (!res.ok) return prompt;
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const parsed = parseReformulatorJSON(raw);
      return parsed?.prompt_final || prompt;
    }
  } catch {
    return prompt;
  }
}

// ─── GEMINI ──────────────────────────────────────────────────────────────────
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

// ─── CLAUDE ──────────────────────────────────────────────────────────────────
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

// ─── DEEPSEEK ────────────────────────────────────────────────────────────────
export async function callDeepSeek(prompt, apiKey) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: 16000,
      temperature: 0.85,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(e?.error?.message || `DeepSeek erro ${res.status}`);
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  return parseGeminiJSON(raw);
}
