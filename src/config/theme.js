// ─── ZERO PREVIEW — DESIGN TOKENS v3 ─────────────────────────────────────────
// Inspirado: Linear, Vercel, Raycast — dark premium, profundidade real

export const C = {
  // Backgrounds — 5 níveis de profundidade
  bg:        "#050A12",      // nível 0 — fundo absoluto (quase preto azulado)
  surface:   "#0A1422",      // nível 1 — sidebar, cards base
  surface2:  "#0F1D30",      // nível 2 — hover states, cards elevados
  surface3:  "#142640",      // nível 3 — elementos em foco
  surfaceAlt:"#0C1826",      // alternativo — fundos de modais/overlays

  // Borders — hierarquia sutil
  border:      "rgba(255,255,255,0.06)",     // padrão — quase invisível
  borderHover: "rgba(255,255,255,0.12)",     // hover
  borderFocus: "rgba(255,208,80,0.35)",      // focus — accent glow

  // Accent — amarelo dourado premium
  yellow:     "#FFD050",
  yellowDim:  "#BF9930",
  yellowGlow: "rgba(255,208,80,0.12)",
  yellowGlow2:"rgba(255,208,80,0.04)",
  yellowSoft: "rgba(255,208,80,0.08)",

  // Text — 4 níveis de hierarquia
  text:       "#F0F4FA",     // primário — títulos, conteúdo principal
  textSub:    "#B8C9DC",     // secundário — descrições
  textMuted:  "#6B8BAA",     // terciário — labels, metadados
  textDim:    "#3A5470",     // quaternário — placeholders, hints

  // Semantic
  success:    "#34D399",
  successDim: "rgba(52,211,153,0.12)",
  error:      "#F87171",
  errorDim:   "rgba(248,113,113,0.08)",
  info:       "#60A5FA",
  infoDim:    "rgba(96,165,250,0.08)",
  warning:    "#FBBF24",
  warningDim: "rgba(251,191,36,0.08)",
  purple:     "#A78BFA",
  purpleDim:  "rgba(167,139,250,0.10)",
};

// Tipografia
export const SYNE = "'Syne', sans-serif";
export const DM   = "'DM Sans', sans-serif";
export const MONO = "'JetBrains Mono', 'Fira Code', monospace";

// Easing curves
export const EASE = {
  out:    "cubic-bezier(0.16, 1, 0.3, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
};

// Shadows — profundidade real
export const SHADOW = {
  sm:  "0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)",
  md:  "0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)",
  lg:  "0 12px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)",
  xl:  "0 24px 60px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)",
  glow:"0 0 30px rgba(255,208,80,0.15), 0 0 60px rgba(255,208,80,0.05)",
};

// Border radius
export const R = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};
