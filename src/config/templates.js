// ─── ZERO PREVIEW — NEW FOUNDATION TEMPLATES ─────────────────────────────────
// React 18 + TypeScript + Vite + Tailwind CSS + Shadcn/UI
// Same stack as Lovable, v0, Bolt.new — industry standard 2026

export const FIXED_FILES = {
  // ─── Package.json ────────────────────────────────────────────────────────────
  "package.json": JSON.stringify({
    name: "zp-app", private: true, version: "0.0.0", type: "module",
    scripts: { dev: "vite --host", build: "tsc -b && vite build" },
    dependencies: {
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^6.26.0",
      "recharts": "^2.12.7",
      "lucide-react": "^0.441.0",
      "@supabase/supabase-js": "^2.45.0",
      "clsx": "^2.1.1",
      "tailwind-merge": "^2.5.2",
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.3.4",
      "@types/react": "^18.3.5",
      "@types/react-dom": "^18.3.0",
      "autoprefixer": "^10.4.20",
      "postcss": "^8.4.45",
      "tailwindcss": "^3.4.10",
      "@types/node": "^22.5.0",
      "typescript": "^5.5.4",
      "vite": "^5.4.3",
    }
  }, null, 2),

  // ─── TypeScript config ───────────────────────────────────────────────────────
  "tsconfig.json": JSON.stringify({
    compilerOptions: {
      target: "ES2020", useDefineForClassFields: true, lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext", skipLibCheck: true, moduleResolution: "bundler",
      allowImportingTsExtensions: true, isolatedModules: true, moduleDetection: "force",
      noEmit: true, jsx: "react-jsx", strict: false, noUnusedLocals: false, noUnusedParameters: false,
      noFallthroughCasesInSwitch: true,
      baseUrl: ".", paths: { "@/*": ["./src/*"] }
    },
    include: ["src"]
  }, null, 2),

  // ─── Tailwind config ─────────────────────────────────────────────────────────
  "tailwind.config.ts": `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Colors via CSS variables — use bg-[var(--accent)] syntax only (JIT)
      // Do NOT register as Tailwind named colors to avoid dual system
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
  <script type="module" src="/src/main.tsx"></script>
  <script>
  // Zero Preview — Visual Edit Mode bridge
  (function(){var e=!1,h=null;window.addEventListener("message",function(m){if(m.data&&m.data.type==="ENABLE_EDIT_MODE")e=!0;if(m.data&&m.data.type==="DISABLE_EDIT_MODE"){e=!1;if(h){h.style.outline="";h=null}}});document.addEventListener("mouseover",function(m){if(!e)return;if(h)h.style.outline="";h=m.target;h.style.outline="2px solid #3B82F6";h.style.outlineOffset="2px";m.stopPropagation()},!0);document.addEventListener("click",function(m){if(!e)return;m.preventDefault();m.stopPropagation();var t=m.target,r=t.getBoundingClientRect();window.parent.postMessage({type:"ELEMENT_CLICKED",data:{tagName:t.tagName,text:(t.textContent||"").slice(0,200),className:t.className||"",rect:{top:r.top,left:r.left,width:r.width,height:r.height}}},"*")},!0)})();
  </script>
</body>
</html>`,

  // ─── CSS (Tailwind imports + CSS variables for niche colors) ──────────────
  // The niche CSS variables are injected by the generator based on detected niche
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
  "src/main.tsx": `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);`,

  // ─── TypeScript env declaration ──────────────────────────────────────────────
  "src/vite-env.d.ts": `/// <reference types="vite/client" />`,

  // ─── Utility: cn() + formatCurrency + formatDate ─────────────────────────────
  "src/lib/utils.ts": `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\\d{2})(\\d{5})(\\d{4})/, "($1) $2-$3");
}`,

  // ─── Shadcn/UI: Button ───────────────────────────────────────────────────────
  "src/components/ui/button.tsx": `import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
    const variants: Record<string, string> = {
      default: "bg-[var(--accent)] text-white hover:opacity-90 shadow-sm",
      outline: "border border-[var(--border)] bg-white hover:bg-gray-50",
      ghost: "hover:bg-gray-100",
      destructive: "bg-red-500 text-white hover:bg-red-600",
    };
    const sizes: Record<string, string> = {
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
  "src/components/ui/card.tsx": `import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border border-[var(--border)] bg-white shadow-sm", className)} {...props} />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };`,

  // ─── Shadcn/UI: Badge ────────────────────────────────────────────────────────
  "src/components/ui/badge.tsx": `import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
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
  "src/components/ui/input.tsx": `import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
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
  "src/lib/supabase.ts": `import { createClient } from '@supabase/supabase-js';

// Supabase configuration — user can replace with their own project
// To connect to a real database:
// 1. Create a project at supabase.com
// 2. Get URL and anon key from Settings → API
// 3. Replace the values below

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// This flag indicates if Supabase is configured with real credentials
export const isSupabaseConfigured = !SUPABASE_URL.includes('your-project');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: fetch data with error handling
export async function fetchData<T>(table: string): Promise<T[]> {
  if (!isSupabaseConfigured) return []; // Return empty if not configured
  const { data, error } = await supabase.from(table).select('*');
  if (error) { console.error('Supabase error:', error); return []; }
  return (data || []) as T[];
}

// Helper: insert data
export async function insertData<T>(table: string, row: Partial<T>): Promise<T | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) { console.error('Supabase error:', error); return null; }
  return data as T;
}

// Helper: update data
export async function updateData<T>(table: string, id: string, updates: Partial<T>): Promise<T | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
  if (error) { console.error('Supabase error:', error); return null; }
  return data as T;
}

// Helper: delete data
export async function deleteData(table: string, id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) { console.error('Supabase error:', error); return false; }
  return true;
}
`,
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
