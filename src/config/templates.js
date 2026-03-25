// ─── ZERO PREVIEW — FILE TEMPLATES ───────────────────────────────────────────
// Fixed files included in every generated app

export const FIXED_FILES = {
  "src/main.jsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);`,

  "index.html": `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>App</title><link rel="preconnect" href="https://fonts.googleapis.com"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head><body style="margin:0;padding:0"><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`,

  "package.json": JSON.stringify({
    name: "zp-app", private: true, version: "0.0.0", type: "module",
    scripts: { dev: "vite --host", build: "vite build" },
    dependencies: {
      react: "^18.2.0", "react-dom": "^18.2.0",
      recharts: "^2.12.7", "lucide-react": "^0.383.0",
    },
    devDependencies: { "@vitejs/plugin-react": "^4.2.1", vite: "^5.0.8" }
  }, null, 2),
};
