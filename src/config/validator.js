// ─── ZERO PREVIEW — CRITICO (10-Layer Code Validator) ────────────────────────
//
// Scores generated React code BEFORE it goes to the WebContainer.
// If it fails 3+ layers, the code gets flagged for regeneration.

// ─── V1: App Component ──────────────────────────────────────────────────────
function v1_hasAppComponent(code) {
  const hasIt =
    /function\s+App\b/.test(code) ||
    /const\s+App\b/.test(code) ||
    /export\s+default\s+function\b/.test(code) ||
    /export\s+default\s+class\b/.test(code);

  return {
    id: "V1",
    name: "App Component",
    passed: hasIt,
    message: hasIt ? "Found App component definition" : "Missing App component definition",
  };
}

// ─── V2: Valid JSX ───────────────────────────────────────────────────────────
function v2_hasValidJSX(code) {
  const hasReturn = /return\s*\(/.test(code) || /return\s*</.test(code);
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  const balanced = Math.abs(openParens - closeParens) <= 2;
  const passed = hasReturn && balanced;

  return {
    id: "V2",
    name: "Valid JSX",
    passed,
    message: passed
      ? "Found valid JSX return with balanced parentheses"
      : !hasReturn
        ? "Missing JSX return statement (return ( or return <)"
        : "Unbalanced parentheses detected",
  };
}

// ─── V3: State Management ────────────────────────────────────────────────────
function v3_hasState(code) {
  const hasUseState = /useState/.test(code);

  return {
    id: "V3",
    name: "State Management",
    passed: hasUseState,
    message: hasUseState
      ? "Found useState for interactivity"
      : "Missing useState — app appears static",
  };
}

// ─── V4: Brazilian Data ──────────────────────────────────────────────────────
function v4_hasBrazilianData(code) {
  const patterns = [
    "R$",
    "BRL",
    "pt-BR",
    "CPF",
    ".toLocaleDateString",
    "Intl.NumberFormat",
    "reais",
    "PIX",
    "(11)",
    "(21)",
    "(31)",
  ];
  const found = patterns.filter(p => code.includes(p));
  const passed = found.length >= 1;

  return {
    id: "V4",
    name: "Brazilian Data",
    passed,
    message: passed
      ? `Found Brazilian data patterns: ${found.join(", ")}`
      : "Missing Brazilian data (R$, BRL, pt-BR, CPF, PIX, etc.)",
  };
}

// ─── V5: Responsive Design ──────────────────────────────────────────────────
function v5_hasResponsive(code) {
  const patterns = [
    "minmax", "auto-fit", "auto-fill",
    "isMobile", "window.innerWidth", "@media",
    "repeat(auto", "flexWrap",
    "md:", "lg:", "sm:", // Tailwind responsive breakpoints
    "grid-cols-1",
    "hidden md:flex",
  ];
  const found = patterns.filter(p => code.includes(p));
  const passed = found.length >= 1;

  return {
    id: "V5",
    name: "Responsive Design",
    passed,
    message: passed
      ? `Found responsive patterns: ${found.join(", ")}`
      : "Missing responsive design patterns (minmax, isMobile, @media, etc.)",
  };
}

// ─── V6: Color System — CSS variables, não hex hardcoded ────────────────────
function v6_hasColorSystem(code) {
  const hasColorVars = /var\(--\w+\)/.test(code);
  const hasThemeVar = /\bTHEME\s*=/.test(code) || /\bCOLORS\s*=/.test(code) || /\bPALETA\s*=/.test(code);
  // Hex em className ou fill/stroke é proibido. Hex em dados mockados (chartData, etc) é tolerado.
  // Checamos hex em atributos de estilo: fill=, stroke=, className contendo #, bg-[#], text-[#]
  const forbiddenHexPatterns = /(?:fill|stroke|stop-color|className)=["'][^"']*#[0-9a-fA-F]{3,8}|bg-\[#[0-9a-fA-F]{3,8}\]|text-\[#[0-9a-fA-F]{3,8}\]|border-\[#[0-9a-fA-F]{3,8}\]/;
  const hasForbiddenHex = forbiddenHexPatterns.test(code);
  const passed = (hasColorVars || hasThemeVar) && !hasForbiddenHex;

  return {
    id: "V6",
    name: "Color System",
    passed,
    message: passed
      ? hasColorVars
        ? "CSS variables detected (var(--*))"
        : "THEME/COLORS/PALETA variable detected"
      : hasForbiddenHex
        ? "Hex hardcoded em estilos (use CSS variables: var(--accent), var(--sidebar), etc)"
        : "Missing CSS variables — use var(--accent), var(--sidebar), var(--bg)",
  };
}

// ─── V7: Loading State ──────────────────────────────────────────────────────
function v7_hasLoadingState(code) {
  const hasLoadingState = /loading[,\]]/.test(code);
  const hasLoadingUI =
    /Skeleton/.test(code) ||
    /Spinner/.test(code) ||
    /Carregando/.test(code) ||
    /isLoading/.test(code);
  const passed = hasLoadingState || hasLoadingUI;

  return {
    id: "V7",
    name: "Loading State",
    passed,
    message: passed
      ? "Found loading state handling"
      : "Missing loading state (loading useState, Skeleton, Spinner, Carregando, isLoading)",
  };
}

// ─── V8: Error Handling ─────────────────────────────────────────────────────
function v8_hasErrorHandling(code) {
  const passed =
    /ErrorBoundary/.test(code) ||
    /ErrorFallback/.test(code) ||
    /getDerivedStateFromError/.test(code) ||
    /try\s*\{/.test(code) ||
    /catch\b/.test(code) ||
    /\.catch\(/.test(code);

  return {
    id: "V8",
    name: "Error Handling",
    passed,
    message: passed
      ? "Found error handling pattern"
      : "Missing error handling (ErrorBoundary, try/catch, .catch, etc.)",
  };
}

// ─── V9: Component Count ────────────────────────────────────────────────────
// Must detect REAL React components — not constants like THEME, CHART_COLORS
function v9_hasComponents(code) {
  // Match function/const declarations that are followed by JSX-like patterns
  // Real components: function Sidebar(...) or const Sidebar = (...) =>
  const fnComponents = code.match(/function\s+[A-Z][a-zA-Z]+\s*\(/g) || [];
  const arrowComponents = code.match(/const\s+[A-Z][a-zA-Z]+\s*=\s*\(?[^=]*\)?\s*=>/g) || [];
  // Class components
  const classComponents = code.match(/class\s+[A-Z][a-zA-Z]+\s+extends/g) || [];

  // Filter out known non-components: THEME, CHART_COLORS, COLORS, etc.
  const nonComponents = /^(THEME|CHART_COLORS|COLORS|PALETA|FIXED|API|STATUS|MOCK)/;
  const allMatches = [
    ...fnComponents.map(m => m.match(/[A-Z][a-zA-Z]+/)?.[0]).filter(Boolean),
    ...arrowComponents.map(m => m.match(/const\s+([A-Z][a-zA-Z]+)/)?.[1]).filter(Boolean),
    ...classComponents.map(m => m.match(/class\s+([A-Z][a-zA-Z]+)/)?.[1]).filter(Boolean),
  ].filter(name => !nonComponents.test(name));

  const unique = [...new Set(allMatches)];
  const passed = unique.length >= 5;

  return {
    id: "V9",
    name: "Component Count",
    passed,
    message: passed
      ? `Found ${unique.length} components: ${unique.slice(0, 8).join(", ")}`
      : `Only ${unique.length} component(s): ${unique.join(", ")} — need at least 5`,
  };
}

// ─── V10: No Forbidden Patterns ─────────────────────────────────────────────
// Allowed packages that exist in the generated app's package.json
const ALLOWED_PACKAGES = new Set([
  "react", "react-dom", "chart.js", "react-chartjs-2", "lucide-react",
  "react/jsx-runtime", "react-dom/client",
  "react-router-dom", "clsx", "tailwind-merge",
  "@supabase/supabase-js",
]);

function v10_noForbiddenPatterns(code) {
  // With the new Tailwind stack, className IS correct. style={{}} is forbidden.
  const hasInlineStyles = /style=\{\{/.test(code);
  const hasCommonJS = /require\(/.test(code);
  const forbidden = [];
  if (hasInlineStyles) forbidden.push("style={{}} (use Tailwind className)");
  if (hasCommonJS) forbidden.push("require() (CommonJS)");
  const passed = forbidden.length === 0;

  return {
    id: "V10",
    name: "No Forbidden Patterns",
    passed,
    message: passed
      ? "No forbidden patterns detected"
      : `Forbidden patterns found: ${forbidden.join(", ")}`,
  };
}

// ─── V11: Import Safety (anti-tela-branca) ──────────────────────────────────
function v11_importSafety(code) {
  const problems = [];

  // Allowed @/ imports (Shadcn components + utils that exist in template)
  const ALLOWED_LOCAL_PREFIXES = [
    "@/components/ui/",  // Shadcn components
    "@/components/",     // Splitter-generated components
    "@/lib/",            // Utils
    "@/pages/",          // Pages
  ];

  // Check for @/ imports — allow known prefixes
  const atImports = code.match(/from\s+['"]@\/[^'"]+['"]/g) || [];
  for (const imp of atImports) {
    const match = imp.match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
      const path = match[1];
      const allowed = ALLOWED_LOCAL_PREFIXES.some(prefix => path.startsWith(prefix));
      if (!allowed) problems.push(`${path} (unknown @/ path)`);
    }
  }

  // Check for ./ imports (should not exist — everything is defined in same file or @/ path)
  const localImports = code.match(/from\s+['"]\.\/[^'"]+['"]/g) || [];
  for (const imp of localImports) {
    if (imp.includes("index.css")) continue;
    problems.push(imp.trim() + " (use @/ path or define in same file)");
  }

  // Check for package imports that aren't in ALLOWED_PACKAGES
  const pkgImports = code.match(/import\s+.*from\s+['"]([^./@][^'"]*)['"]/g) || [];
  for (const imp of pkgImports) {
    const match = imp.match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
      const pkg = match[1].split("/")[0];
      if (!ALLOWED_PACKAGES.has(match[1]) && !ALLOWED_PACKAGES.has(pkg)) {
        problems.push(`${pkg} (not in package.json)`);
      }
    }
  }

  const passed = problems.length === 0;
  return {
    id: "V11",
    name: "Import Safety",
    passed,
    message: passed
      ? "All imports resolve to valid packages or files"
      : `Broken imports will cause white screen: ${problems.slice(0, 3).join(", ")}`,
  };
}

// ─── Main Validator ─────────────────────────────────────────────────────────

// Returns { score, total, passed, failed, details[] }
export function validateCode(code) {
  if (!code || typeof code !== "string") {
    return { score: 0, total: 11, passed: 0, failed: 11, details: [], shouldRegenerate: true };
  }

  const checks = [
    v1_hasAppComponent(code),
    v2_hasValidJSX(code),
    v3_hasState(code),
    v4_hasBrazilianData(code),
    v5_hasResponsive(code),
    v6_hasColorSystem(code),
    v7_hasLoadingState(code),
    v8_hasErrorHandling(code),
    v9_hasComponents(code),
    v10_noForbiddenPatterns(code),
    v11_importSafety(code),
  ];

  const passed = checks.filter(c => c.passed).length;
  const failed = checks.length - passed;
  const score = Math.round((passed / checks.length) * 100);

  // V11 failure is critical — always triggers regeneration
  const v11Failed = !checks[10].passed;

  return {
    score,
    total: checks.length,
    passed,
    failed,
    details: checks,
    shouldRegenerate: failed >= 3 || v11Failed,
  };
}

// ─── Summary Helper ─────────────────────────────────────────────────────────

export function getValidationSummary(result) {
  if (result.score >= 90) return { emoji: "\uD83D\uDFE2", label: "Excelente" };
  if (result.score >= 70) return { emoji: "\uD83D\uDFE1", label: "Bom" };
  if (result.score >= 50) return { emoji: "\uD83D\uDFE0", label: "Aceitavel" };
  return { emoji: "\uD83D\uDD34", label: "Precisa regenerar" };
}
