// ─── ZERO PREVIEW — PROJECT EXPORTER ─────────────────────────────────────────
// ZIP export using fflate (9KB gzip, zero deps, fastest option)
// Replaces manual ZIP creator with proper compression

import { zipSync, strToU8 } from "fflate";

/**
 * Exporta arquivos do projeto como ZIP e faz download.
 * Adiciona vercel.json, README.md e instruções de deploy.
 * @param {Object} files - mapa { "path": "conteudo" }
 * @param {string} projectName - nome do projeto para o arquivo zip
 */
export async function exportToZip(files, projectName) {
  const exportFiles = { ...files };

  // Add vercel.json with required headers
  exportFiles["vercel.json"] = JSON.stringify({
    headers: [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
        ]
      }
    ]
  }, null, 2);

  // Add README with deploy instructions
  const safeName = (projectName || "meu-app").replace(/[^a-zA-Z0-9-_ ]/g, "").slice(0, 40);
  exportFiles["README.md"] = `# ${safeName}

Gerado com [Zero Preview](https://zero-preview-six.vercel.app)

## Deploy no Vercel em 3 passos

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Arraste esta pasta ou conecte o repositorio
3. Clique "Deploy" — pronto!

## Rodar localmente

\`\`\`bash
npm install
npm run dev
\`\`\`

## Stack
- React 18
- Vite 5
- TypeScript + Tailwind CSS
- Recharts (graficos)
- Lucide React (icones)
`;

  // Build fflate structure
  const zipData = {};
  for (const [path, content] of Object.entries(exportFiles)) {
    if (typeof content === "string") {
      zipData[path] = strToU8(content);
    }
  }

  // Compress with fflate (level 6 = good balance)
  const zipped = zipSync(zipData, { level: 6 });

  // Trigger download
  const blob = new Blob([zipped], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return true;
}

/**
 * Exporta um único arquivo como download.
 */
export function exportSingleFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copia conteúdo para clipboard.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
}
