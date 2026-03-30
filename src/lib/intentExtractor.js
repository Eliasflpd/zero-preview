// ─── ZERO PREVIEW — INTENT EXTRACTOR ─────────────────────────────────────────
// Extrai intencao estruturada do prompt do usuario em JSON.
// Modelos fracos (Groq, Gemini, HuggingFace) fazem isso com ~100% de acerto.
// Output: JSON puro, facil de validar, zero risco de codigo quebrado.

import { callClaude } from "./api";

const INTENT_SYSTEM = `Voce e um extrator de intencao. Dado um pedido de aplicativo, retorne APENAS um JSON valido (sem markdown, sem explicacao).

Formato EXATO:
{
  "appName": "nome do app em portugues",
  "appType": "dashboard|landing|form|chat|crud",
  "niche": "nicho detectado",
  "title": "titulo principal da pagina",
  "subtitle": "subtitulo ou descricao curta",
  "sections": [
    {
      "type": "stats|table|chart|hero|features|cta|form|chat|list|cards|sidebar",
      "title": "titulo da secao",
      "items": [
        { "label": "nome", "value": "valor ou descricao", "icon": "nome do icone Lucide" }
      ]
    }
  ],
  "fields": [
    { "name": "campo", "type": "text|email|phone|number|date|select|textarea", "label": "rotulo", "placeholder": "placeholder" }
  ],
  "features": ["feature1", "feature2"],
  "mockData": {
    "names": ["Nome1 Sobrenome1", "Nome2 Sobrenome2"],
    "currency": "R$",
    "values": [1500, 2300, 890, 4200, 3100]
  }
}

REGRAS:
- appType: escolha o mais proximo do pedido. Dashboard = painel admin. Landing = pagina de vendas. Form = formulario. Chat = mensagens. CRUD = lista com criar/editar/deletar.
- sections: quebre o app em secoes logicas. Stats = cards de KPI. Table = tabela de dados. Chart = grafico. Hero = banner principal. Features = grade de features.
- fields: so preencha se o app tiver formularios.
- mockData: SEMPRE nomes brasileiros, valores em R$, datas DD/MM/AAAA.
- features: liste capacidades do app (ex: "filtro por data", "exportar PDF", "busca").
- Maximo 6 sections, 8 fields, 6 features.
- Se o pedido for vago, assuma dashboard profissional com stats + tabela + grafico.`;

/**
 * Extrai intencao estruturada do prompt do usuario.
 * @param {string} prompt - Pedido do usuario
 * @param {string} niche - Nicho detectado pelo SOMMELIER
 * @returns {Promise<object>} JSON de intencao
 */
export async function extractIntent(prompt, niche) {
  const userMsg = `Nicho: ${niche}\nPedido: ${prompt}`;

  const t0 = Date.now();
  try {
    const raw = await callClaude(INTENT_SYSTEM, userMsg, 2000);
    const cleaned = raw.replace(/```json?\s*/gi, "").replace(/```\s*/g, "").trim();

    // Tenta parsear o JSON
    const intent = JSON.parse(cleaned);

    // Validacao basica
    if (!intent.appName) intent.appName = "Meu App";
    if (!intent.appType) intent.appType = detectAppType(prompt);
    if (!intent.sections || !Array.isArray(intent.sections)) intent.sections = [];
    if (!intent.fields || !Array.isArray(intent.fields)) intent.fields = [];
    if (!intent.features || !Array.isArray(intent.features)) intent.features = [];
    if (!intent.mockData) intent.mockData = { names: ["Maria Silva", "Joao Santos"], currency: "R$", values: [1500, 2300, 890] };
    if (!intent.title) intent.title = intent.appName;
    if (!intent.subtitle) intent.subtitle = "";

    console.log('[Zero AUDIT] intent-extraction', { status: 'ok', strategy: 'ai', reason: null, durationMs: Date.now() - t0 });
    return intent;
  } catch (e) {
    // Fallback: intent basica gerada localmente (zero AI)
    console.log('[Zero AUDIT] intent-extraction', { status: 'failed', strategy: 'local-fallback', reason: e.message, durationMs: Date.now() - t0 });
    return buildLocalIntent(prompt, niche);
  }
}

/**
 * Detecta tipo de app pelo prompt (local, sem AI).
 */
function detectAppType(prompt) {
  const p = prompt.toLowerCase();
  if (/landing|pagina de vend|site|homepage|institucional/.test(p)) return "landing";
  if (/formulario|cadastro|form|registro|inscric/.test(p)) return "form";
  if (/chat|mensag|conversa|whatsapp|inbox/.test(p)) return "chat";
  if (/lista|crud|tabela|gerenci|cadastro de/.test(p)) return "crud";
  return "dashboard";
}

/**
 * Fallback local — gera intent sem AI quando extractor falha.
 */
function buildLocalIntent(prompt, niche) {
  const appType = detectAppType(prompt);
  const title = prompt.slice(0, 60).replace(/[^\w\sáéíóúãõâêç-]/gi, "").trim() || "Dashboard";

  const baseIntent = {
    appName: title,
    appType,
    niche,
    title,
    subtitle: `Sistema de gestao - ${niche}`,
    sections: [],
    fields: [],
    features: ["Responsivo", "Dados em tempo real", "Filtros"],
    mockData: {
      names: ["Maria Silva", "Joao Santos", "Ana Oliveira", "Carlos Souza", "Fernanda Lima"],
      currency: "R$",
      values: [2450, 1890, 3200, 980, 4100],
    },
  };

  // Gera sections baseado no tipo
  if (appType === "dashboard") {
    baseIntent.sections = [
      { type: "stats", title: "Resumo", items: [
        { label: "Total", value: "R$ 12.450", icon: "DollarSign" },
        { label: "Clientes", value: "384", icon: "Users" },
        { label: "Pedidos", value: "47", icon: "ShoppingCart" },
        { label: "Crescimento", value: "+12.5%", icon: "TrendingUp" },
      ]},
      { type: "chart", title: "Receita Mensal", items: [
        { label: "Jan", value: "2450" }, { label: "Fev", value: "3200" },
        { label: "Mar", value: "2800" }, { label: "Abr", value: "4100" },
        { label: "Mai", value: "3600" }, { label: "Jun", value: "4800" },
      ]},
      { type: "table", title: "Ultimos Registros", items: [
        { label: "Maria Silva", value: "R$ 2.450", icon: "CheckCircle" },
        { label: "Joao Santos", value: "R$ 1.890", icon: "Clock" },
        { label: "Ana Oliveira", value: "R$ 3.200", icon: "CheckCircle" },
        { label: "Carlos Souza", value: "R$ 980", icon: "AlertCircle" },
      ]},
    ];
  } else if (appType === "landing") {
    baseIntent.sections = [
      { type: "hero", title: title, items: [{ label: "CTA", value: "Comece Agora", icon: "ArrowRight" }] },
      { type: "features", title: "Funcionalidades", items: [
        { label: "Rapido", value: "Resultados em minutos", icon: "Zap" },
        { label: "Seguro", value: "Protecao total dos dados", icon: "Shield" },
        { label: "Suporte", value: "Atendimento 24/7", icon: "Headphones" },
      ]},
      { type: "cta", title: "Pronto para comecar?", items: [{ label: "Criar Conta", value: "Gratis por 7 dias", icon: "ArrowRight" }] },
    ];
  } else if (appType === "crud") {
    baseIntent.sections = [
      { type: "stats", title: "Resumo", items: [
        { label: "Total", value: "156", icon: "Database" },
        { label: "Ativos", value: "142", icon: "CheckCircle" },
        { label: "Pendentes", value: "14", icon: "Clock" },
      ]},
      { type: "table", title: "Registros", items: [
        { label: "Maria Silva", value: "Ativo", icon: "CheckCircle" },
        { label: "Joao Santos", value: "Pendente", icon: "Clock" },
        { label: "Ana Oliveira", value: "Ativo", icon: "CheckCircle" },
      ]},
    ];
    baseIntent.fields = [
      { name: "nome", type: "text", label: "Nome", placeholder: "Nome completo" },
      { name: "email", type: "email", label: "E-mail", placeholder: "email@exemplo.com" },
      { name: "telefone", type: "phone", label: "Telefone", placeholder: "(11) 98765-4321" },
    ];
  } else if (appType === "form") {
    baseIntent.sections = [
      { type: "form", title: "Cadastro", items: [] },
    ];
    baseIntent.fields = [
      { name: "nome", type: "text", label: "Nome Completo", placeholder: "Seu nome" },
      { name: "email", type: "email", label: "E-mail", placeholder: "email@exemplo.com" },
      { name: "telefone", type: "phone", label: "Telefone", placeholder: "(11) 98765-4321" },
      { name: "mensagem", type: "textarea", label: "Mensagem", placeholder: "Descreva sua necessidade..." },
    ];
  } else if (appType === "chat") {
    baseIntent.sections = [
      { type: "sidebar", title: "Conversas", items: [
        { label: "Maria Silva", value: "Oi, tudo bem?", icon: "MessageCircle" },
        { label: "Joao Santos", value: "Enviei o orcamento", icon: "MessageCircle" },
        { label: "Ana Oliveira", value: "Quando fica pronto?", icon: "MessageCircle" },
      ]},
      { type: "chat", title: "Chat", items: [] },
    ];
  }

  return baseIntent;
}

export { detectAppType, buildLocalIntent };
