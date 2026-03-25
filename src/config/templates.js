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
