// ─── ZERO PREVIEW — PROJECT KNOWLEDGE ────────────────────────────────────────
// Auto-detects stack, components, patterns from generated code.
// Persists per-project in localStorage. Injected into AI context on edits.

const LS_PREFIX = "zp_knowledge_";
const MAX_KNOWLEDGE_ENTRIES = 20;

// ─── STACK DETECTOR (deterministic, no LLM cost) ────────────────────────────

function detectStack(files) {
  const stack = [];

  const pkg = files["package.json"];
  if (pkg) {
    try {
      const parsed = typeof pkg === "string" ? JSON.parse(pkg) : pkg;
      const deps = { ...parsed.dependencies, ...parsed.devDependencies };
      if (deps.react) stack.push("React " + (deps.react.replace(/[\^~]/, "") || "18"));
      if (deps.next) stack.push("Next.js");
      if (deps.vue) stack.push("Vue");
      if (deps.vite) stack.push("Vite");
      if (deps.tailwindcss) stack.push("Tailwind CSS");
      if (deps.recharts) stack.push("Recharts");
      if (deps["lucide-react"]) stack.push("Lucide Icons");
      if (deps["@supabase/supabase-js"]) stack.push("Supabase");
      if (deps["react-router-dom"]) stack.push("React Router");
      if (deps["react-hook-form"]) stack.push("React Hook Form");
      if (deps.zod) stack.push("Zod");
    } catch {}
  }

  // Detect TypeScript
  const hasTS = Object.keys(files).some(f => f.endsWith(".tsx") || f.endsWith(".ts"));
  if (hasTS) stack.push("TypeScript");

  return stack;
}

// ─── COMPONENT DETECTOR ──────────────────────────────────────────────────────

function detectComponents(files) {
  const components = [];

  for (const [path, content] of Object.entries(files)) {
    if (typeof content !== "string") continue;
    if (!path.endsWith(".jsx") && !path.endsWith(".tsx")) continue;
    if (path.includes("node_modules")) continue;

    // Extract component name from export or function declaration
    const exportMatch = content.match(/export\s+default\s+function\s+(\w+)/);
    const constMatch = content.match(/export\s+default\s+(\w+)/);
    const fnMatch = content.match(/function\s+(\w+)\s*\(/);
    const name = exportMatch?.[1] || constMatch?.[1] || fnMatch?.[1] || path.split("/").pop().replace(/\.\w+$/, "");

    const lines = content.split("\n").length;

    components.push({
      name,
      path,
      lines,
    });
  }

  return components;
}

// ─── NICHE DETECTOR (heuristic) ──────────────────────────────────────────────

function detectNiche(files) {
  const allContent = Object.values(files).filter(v => typeof v === "string").join(" ").toLowerCase();

  const nicheKeywords = {
    church:      ["igreja", "celula", "culto", "pastor", "membro", "dizimo", "oracao"],
    finance:     ["financeiro", "receita", "despesa", "fluxo de caixa", "investimento", "saldo"],
    ecommerce:   ["produto", "carrinho", "pedido", "estoque", "loja", "compra"],
    health:      ["paciente", "consulta", "medico", "clinica", "agendamento", "prontuario"],
    food:        ["cardapio", "restaurante", "pedido", "mesa", "cozinha", "delivery"],
    beauty:      ["salao", "beleza", "agendamento", "servico", "cliente", "horario"],
    fitness:     ["academia", "aluno", "treino", "plano", "frequencia", "personal"],
    education:   ["aluno", "professor", "turma", "nota", "escola", "curso"],
    construction:["obra", "orcamento", "material", "construcao", "projeto", "engenheiro"],
    creative:    ["portfolio", "projeto", "galeria", "design", "criativo", "orcamento"],
  };

  let bestNiche = "generic";
  let bestScore = 0;

  for (const [niche, keywords] of Object.entries(nicheKeywords)) {
    const score = keywords.filter(kw => allContent.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestNiche = niche;
    }
  }

  return bestScore >= 2 ? bestNiche : "generic";
}

// ─── CONVENTION DETECTOR ─────────────────────────────────────────────────────

function detectConventions(files) {
  const conventions = [];
  const allContent = Object.values(files).filter(v => typeof v === "string").join("\n");

  if (allContent.includes("className=")) conventions.push("Tailwind CSS classes");
  if (allContent.includes("style={{")) conventions.push("CSS inline");
  if (allContent.includes("'use client'")) conventions.push("Next.js App Router");
  if (allContent.includes("ResponsiveContainer")) conventions.push("Recharts com ResponsiveContainer");
  if (allContent.includes("formatCurrency")) conventions.push("Moeda BR (R$)");
  if (allContent.includes("lucide-react")) conventions.push("Icones Lucide");
  if (allContent.includes("pt-BR")) conventions.push("Locale pt-BR");
  if (allContent.includes("supabase")) conventions.push("Supabase como backend");

  return conventions;
}

// ─── MAIN: ANALYZE PROJECT ───────────────────────────────────────────────────

export function analyzeProject(files) {
  if (!files || Object.keys(files).length === 0) return null;

  return {
    stack: detectStack(files),
    nicho: detectNiche(files),
    components: detectComponents(files),
    conventions: detectConventions(files),
    fileCount: Object.keys(files).length,
    analyzedAt: Date.now(),
  };
}

// ─── PERSISTENCE (localStorage) ──────────────────────────────────────────────

export function saveKnowledge(projectId, knowledge) {
  try {
    const key = LS_PREFIX + projectId;
    localStorage.setItem(key, JSON.stringify(knowledge));
    pruneKnowledge();
  } catch {}
}

export function loadKnowledge(projectId) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + projectId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function deleteKnowledge(projectId) {
  localStorage.removeItem(LS_PREFIX + projectId);
}

// Keep only the newest N knowledge entries
function pruneKnowledge() {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_PREFIX)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        entries.push({ key, at: data.analyzedAt || 0 });
      } catch {
        entries.push({ key, at: 0 });
      }
    }
  }
  if (entries.length > MAX_KNOWLEDGE_ENTRIES) {
    entries.sort((a, b) => b.at - a.at);
    for (const entry of entries.slice(MAX_KNOWLEDGE_ENTRIES)) {
      localStorage.removeItem(entry.key);
    }
  }
}

// ─── FORMAT FOR AI CONTEXT ───────────────────────────────────────────────────
// Compact string to inject into system prompt during edits

export function knowledgeToContext(knowledge) {
  if (!knowledge) return "";

  const parts = [];
  if (knowledge.stack?.length) parts.push(`Stack: ${knowledge.stack.join(", ")}`);
  if (knowledge.nicho && knowledge.nicho !== "generic") parts.push(`Nicho: ${knowledge.nicho}`);
  if (knowledge.components?.length) {
    const names = knowledge.components.map(c => c.name).slice(0, 15).join(", ");
    parts.push(`Componentes: ${names}`);
  }
  if (knowledge.conventions?.length) parts.push(`Convencoes: ${knowledge.conventions.join(", ")}`);

  return parts.length > 0
    ? `\nCONTEXTO DO PROJETO (auto-detectado):\n${parts.join("\n")}\nMantenha essas convencoes ao editar.`
    : "";
}
