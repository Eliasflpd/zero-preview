// ─── ZERO PREVIEW — ARQUITETO (Pre-Generation Analysis) ─────────────────────
// Analyzes the prompt and produces a structured brief for the Executor

import { getNiche } from "./niches";

// Keyword detection for features
const CHART_KEYWORDS = ["grafico", "chart", "dashboard", "kpi", "metricas", "vendas", "receita", "analytics", "relatorio", "estatisticas"];
const TABLE_KEYWORDS = ["tabela", "lista", "registros", "estoque", "produtos", "clientes", "pedidos", "cadastro", "historico"];
const FORM_KEYWORDS = ["formulario", "cadastro", "form", "registro", "adicionar", "criar", "novo"];
const AUTH_KEYWORDS = ["login", "autenticacao", "senha", "usuario", "perfil", "conta"];
const MULTI_PAGE_KEYWORDS = ["paginas", "menu", "navegacao", "tabs", "abas", "secoes"];

function hasKeywords(prompt, keywords) {
  const lower = prompt.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function countKeywordHits(prompt, keywords) {
  const lower = prompt.toLowerCase();
  return keywords.filter(k => lower.includes(k)).length;
}

// Estimate complexity from prompt length and feature count
function estimateComplexity(prompt, features) {
  const featureCount = Object.values(features).filter(Boolean).length;
  const wordCount = prompt.split(/\s+/).length;

  if (featureCount >= 4 || wordCount > 60) return "complexo";
  if (featureCount >= 2 || wordCount > 25) return "medio";
  return "simples";
}

// Estimate number of pages/sections
function estimatePages(prompt, complexity) {
  if (hasKeywords(prompt, AUTH_KEYWORDS)) return Math.max(3, complexity === "complexo" ? 5 : 3);
  if (hasKeywords(prompt, MULTI_PAGE_KEYWORDS)) return complexity === "complexo" ? 5 : 3;
  if (complexity === "complexo") return 4;
  if (complexity === "medio") return 2;
  return 1;
}

// Main analysis function
export function analyzePrompt(prompt, nichoId) {
  const niche = getNiche(nichoId);

  const features = {
    needsCharts: hasKeywords(prompt, CHART_KEYWORDS),
    needsTable: hasKeywords(prompt, TABLE_KEYWORDS),
    needsForm: hasKeywords(prompt, FORM_KEYWORDS),
    needsAuth: hasKeywords(prompt, AUTH_KEYWORDS),
    needsMultiPage: hasKeywords(prompt, MULTI_PAGE_KEYWORDS),
  };

  const complexity = estimateComplexity(prompt, features);
  const pages = estimatePages(prompt, complexity);

  // Suggest components based on analysis
  const components = ["Sidebar", "Header"];
  if (features.needsCharts) components.push("StatsCards", "ChartSection");
  if (features.needsTable) components.push("DataTable");
  if (features.needsForm) components.push("FormModal");
  if (features.needsAuth) components.push("LoginForm");
  if (pages > 1) components.push("TabNavigation");
  // Always include at least 5
  if (components.length < 5) {
    const extras = ["EmptyState", "LoadingSkeleton", "ActionButton", "StatusBadge", "SearchBar"];
    for (const e of extras) {
      if (components.length >= 5) break;
      if (!components.includes(e)) components.push(e);
    }
  }

  // Build the architect brief
  const brief = {
    complexity,
    pages,
    features,
    components,
    niche: {
      id: nichoId,
      label: niche.label,
      palette: niche.palette,
      personality: niche.personality,
      suggestIcons: niche.suggestIcons,
    },
    // Instruction block to inject into the prompt
    instruction: buildInstruction(complexity, pages, features, components, niche),
  };

  return brief;
}

function buildInstruction(complexity, pages, features, components, niche) {
  const lines = [];

  lines.push(`COMPLEXIDADE: ${complexity.toUpperCase()}`);
  lines.push(`PAGINAS/SECOES: ${pages}`);
  lines.push(`COMPONENTES NECESSARIOS: ${components.join(", ")}`);
  lines.push(`PALETA: bg=${niche.palette.bg} sidebar=${niche.palette.sidebar} accent=${niche.palette.accent}`);
  lines.push(`PERSONALIDADE: ${niche.personality}`);

  if (features.needsCharts) {
    lines.push("GRAFICOS: Sim — use Recharts com ResponsiveContainer. Minimo 1 BarChart ou LineChart.");
  }
  if (features.needsTable) {
    lines.push("TABELA: Sim — com dados brasileiros, ordenacao, minimo 8 linhas. Use overflowX auto para mobile.");
  }
  if (features.needsForm) {
    lines.push("FORMULARIO: Sim — com validacao basica, campos brasileiros (nome, CPF, telefone).");
  }
  if (features.needsAuth) {
    lines.push("AUTH: Sim — inclua tela de login simulada com email/senha.");
  }

  if (niche.forbid && niche.forbid.length > 0) {
    lines.push(`PROIBICOES DO NICHO: ${niche.forbid.join(", ")}`);
  }

  lines.push(`ICONES SUGERIDOS: ${(niche.suggestIcons || []).join(", ")}`);

  return lines.join("\n");
}
