// ─── ZERO PREVIEW — FOUNDATION TEMPLATES ──────────────────────────────────────
// React 18 + Vite + Tailwind CSS — JSX puro, zero TypeScript
// Zero deps de charts, zero TS = zero crashes de parser

export const FIXED_FILES = {
  // ─── Package.json ────────────────────────────────────────────────────────────
  "package.json": JSON.stringify({
    name: "zp-app", private: true, version: "0.0.0", type: "module",
    scripts: { dev: "vite --host", build: "vite build" },
    dependencies: {
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^6.26.0",
      "lucide-react": "^0.441.0",
      "@supabase/supabase-js": "^2.45.0",
      "clsx": "^2.1.1",
      "tailwind-merge": "^2.5.2",
      "chart.js": "^4.4.0",
      "react-chartjs-2": "^5.2.0",
    },
    devDependencies: {
      "@vitejs/plugin-react-swc": "^3.5.0",
      "autoprefixer": "^10.4.20",
      "postcss": "^8.4.45",
      "tailwindcss": "^3.4.10",
      "vite": "^5.4.3",
    }
  }, null, 2),

  // ─── Tailwind config ─────────────────────────────────────────────────────────
  "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "pulse-slow": "pulse 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};`,

  // ─── PostCSS ─────────────────────────────────────────────────────────────────
  "postcss.config.js": `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };`,

  // ─── HTML entry ──────────────────────────────────────────────────────────────
  "index.html": `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>App</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
</head>
<body class="antialiased">
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
  <script>
  (function(){var e=!1,h=null;window.addEventListener("message",function(m){if(m.data&&m.data.type==="ENABLE_EDIT_MODE")e=!0;if(m.data&&m.data.type==="DISABLE_EDIT_MODE"){e=!1;if(h){h.style.outline="";h=null}}});document.addEventListener("mouseover",function(m){if(!e)return;if(h)h.style.outline="";h=m.target;h.style.outline="2px solid #3B82F6";h.style.outlineOffset="2px";m.stopPropagation()},!0);document.addEventListener("click",function(m){if(!e)return;m.preventDefault();m.stopPropagation();var t=m.target,r=t.getBoundingClientRect();window.parent.postMessage({type:"ELEMENT_CLICKED",data:{tagName:t.tagName,text:(t.textContent||"").slice(0,200),className:t.className||"",rect:{top:r.top,left:r.left,width:r.width,height:r.height}}},"*")},!0)})();
  </script>
</body>
</html>`,

  // ─── CSS ─────────────────────────────────────────────────────────────────────
  "src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg: #F0F4FF;
    --sidebar: #0D1B4B;
    --sidebar-text: #FFFFFF;
    --accent: #1565C0;
    --accent-light: rgba(21,101,192,0.08);
    --card: #FFFFFF;
    --border: #E5E7EB;
  }

  body {
    background-color: var(--bg);
  }
}`,

  // ─── Main entry point ────────────────────────────────────────────────────────
  "src/main.jsx": `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);`,

  // ─── Formatters (zero imports, zero deps) ─────────────────────────────────
  "src/utils/formatters.js": [
    'export const formatCurrency = (v) =>',
    '  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);',
    'export const formatDate = (d) => new Date(d).toLocaleDateString("pt-BR");',
    'export const formatPercent = (v) => `${v.toFixed(1)}%`;',
    'export const formatPhone = (p) => p.replace(/(\\d{2})(\\d{5})(\\d{4})/, "($1) $2-$3");',
  ].join('\n'),

  // ─── Utility: cn() + re-exports ──────────────────────────────────────────
  "src/lib/utils.js": `import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export { formatCurrency, formatDate, formatPercent, formatPhone } from "../utils/formatters";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}`,

  // ─── Chart.js Setup (registra componentes globalmente) ─────────────────
  "src/lib/chartSetup.js": `import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler
);

export default ChartJS;`,

  // ─── Shadcn/UI: Button ───────────────────────────────────────────────────────
  "src/components/ui/button.jsx": `import * as React from "react";
import { cn } from "@/lib/utils";

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
    const variants = {
      default: "bg-[var(--accent)] text-white hover:opacity-90 shadow-sm",
      outline: "border border-[var(--border)] bg-white hover:bg-gray-50",
      ghost: "hover:bg-gray-100",
      destructive: "bg-red-500 text-white hover:bg-red-600",
    };
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-11 px-8",
      icon: "h-9 w-9",
    };
    return <button className={cn(base, variants[variant], sizes[size], className)} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
export { Button };`,

  // ─── Shadcn/UI: Card ─────────────────────────────────────────────────────────
  "src/components/ui/card.jsx": `import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border border-[var(--border)] bg-white shadow-sm", className)} {...props} />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };`,

  // ─── Shadcn/UI: Badge ────────────────────────────────────────────────────────
  "src/components/ui/badge.jsx": `import { cn } from "@/lib/utils";

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-[var(--accent)]/10 text-[var(--accent)] border-transparent",
    success: "bg-emerald-50 text-emerald-700 border-transparent",
    warning: "bg-amber-50 text-amber-700 border-transparent",
    destructive: "bg-red-50 text-red-700 border-transparent",
    outline: "border-[var(--border)] text-gray-600",
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)} {...props} />
  );
}

export { Badge };`,

  // ─── Shadcn/UI: Input ────────────────────────────────────────────────────────
  "src/components/ui/input.jsx": `import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn("flex h-9 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/20 focus-visible:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50", className)}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";
export { Input };`,

  // ─── Supabase client ────────────────────────────────────────────────────────
  "src/lib/supabase.js": `import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

export const isSupabaseConfigured = !SUPABASE_URL.includes('your-project');
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchData(table) {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from(table).select('*');
  if (error) { console.error('Supabase error:', error); return []; }
  return data || [];
}

export async function insertData(table, row) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) { console.error('Supabase error:', error); return null; }
  return data;
}`,

  // ─── Brazilian Integrations ────────────────────────────────────────────────
  "src/lib/integrations.js": `export function openWhatsApp(phone, message) {
  const cleanPhone = phone.replace(/\\D/g, '');
  const encoded = message ? encodeURIComponent(message) : '';
  window.open('https://wa.me/55' + cleanPhone + (encoded ? '?text=' + encoded : ''), '_blank');
}

export const WHATSAPP_BUTTON_STYLE = {
  position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
  borderRadius: '50%', background: '#25D366', color: '#FFFFFF',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,211,102,0.4)',
  zIndex: 1000, border: 'none', fontSize: 28,
};

export function generatePixPayload(key, name, value) {
  return 'PIX: ' + key + ' | ' + name + (value ? ' | R$ ' + value.toFixed(2) : '');
}

export function formatPhoneBR(phone) {
  const digits = phone.replace(/\\D/g, '');
  if (digits.length === 11) return '(' + digits.slice(0,2) + ') ' + digits.slice(2,7) + '-' + digits.slice(7);
  if (digits.length === 10) return '(' + digits.slice(0,2) + ') ' + digits.slice(2,6) + '-' + digits.slice(6);
  return phone;
}

export function formatCEP(cep) {
  const digits = cep.replace(/\\D/g, '');
  if (digits.length === 8) return digits.slice(0,5) + '-' + digits.slice(5);
  return cep;
}

export function formatCPF(cpf) {
  const digits = cpf.replace(/\\D/g, '');
  return '***.' + digits.slice(3,6) + '.' + digits.slice(6,9) + '-' + digits.slice(9,11);
}

export function formatCNPJ(cnpj) {
  const digits = cnpj.replace(/\\D/g, '');
  return digits.slice(0,2) + '.' + digits.slice(2,5) + '.' + digits.slice(5,8) + '/' + digits.slice(8,12) + '-' + digits.slice(12);
}`,
};

// ─── Niche CSS variables (injected into src/index.css) ───────────────────────
export function buildNicheCSS(palette) {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg: ${palette.bg};
    --sidebar: ${palette.sidebar};
    --sidebar-text: ${palette.text || '#FFFFFF'};
    --accent: ${palette.accent};
    --accent-light: ${palette.accent}15;
    --card: #FFFFFF;
    --border: #E5E7EB;
  }

  body {
    background-color: var(--bg);
  }
}`;
}
