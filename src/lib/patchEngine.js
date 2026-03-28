/**
 * MECANISMO 3 — Patch Cirurgico (Diff-Based Editing)
 *
 * Ao inves de reescrever arquivos inteiros, parseia e aplica
 * apenas as mudancas necessarias. Elimina erros em cascata.
 *
 * Suporta multiplos formatos de output do AI:
 * - ```typescript filename="src/App.tsx"
 * - // FILE: src/App.tsx
 * - === src/App.tsx ===
 * - `src/App.tsx` seguido de bloco de codigo
 */

/**
 * @typedef {Object} FilePatch
 * @property {string} filename
 * @property {string} content
 * @property {boolean} isNew
 */

/**
 * @typedef {Object} ParsedGeneration
 * @property {FilePatch[]} files
 * @property {boolean} hasErrors
 * @property {string[]} shellCommands
 */

/**
 * Parser robusto para extrair arquivos do output do AI.
 * Tenta multiplos formatos de marcacao.
 *
 * @param {string} rawOutput - Output bruto do AI
 * @returns {ParsedGeneration}
 */
export function parseAIOutput(rawOutput) {
  if (!rawOutput || typeof rawOutput !== 'string') {
    return { files: [], hasErrors: true, shellCommands: [] };
  }

  const files = [];
  const shellCommands = [];

  // Formato 1: ```lang filename="path"
  extractCodeBlocksWithFilename(rawOutput, files);

  // Formato 2: // FILE: path
  if (files.length === 0) {
    extractFileMarkers(rawOutput, files);
  }

  // Formato 3: === path ===
  if (files.length === 0) {
    extractEqualsMarkers(rawOutput, files);
  }

  // Formato 4: `path` seguido de code block
  if (files.length === 0) {
    extractBacktickFiles(rawOutput, files);
  }

  // Fallback: bloco de codigo unico -> assume src/App.tsx
  if (files.length === 0) {
    extractSingleBlock(rawOutput, files);
  }

  // Extrai comandos shell (npm install, yarn add)
  extractShellCommands(rawOutput, shellCommands);

  // Remove duplicatas (mesmo filename, mantem o ultimo)
  const deduped = deduplicateFiles(files);

  return {
    files: deduped,
    hasErrors: false,
    shellCommands,
  };
}

/**
 * @param {string} raw
 * @param {FilePatch[]} files
 */
function extractCodeBlocksWithFilename(raw, files) {
  const regex = /```(?:typescript|tsx|jsx|javascript|js|ts|css|json|html)?\s+(?:filename=["']([^"']+)["']|\/\/\s*([^\n]+\.(?:tsx?|jsx?|css|json|html)))\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const filename = (match[1] || match[2] || '').trim();
    const content = (match[3] || '').trim();
    if (filename && content) {
      files.push({ filename, content, isNew: false });
    }
  }
}

/**
 * @param {string} raw
 * @param {FilePatch[]} files
 */
function extractFileMarkers(raw, files) {
  const regex = /\/\/\s*FILE:\s*([^\n]+)\n([\s\S]*?)(?=\/\/\s*FILE:|$)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const filename = (match[1] || '').trim();
    const content = (match[2] || '').trim();
    if (filename && content) {
      files.push({ filename, content, isNew: false });
    }
  }
}

/**
 * @param {string} raw
 * @param {FilePatch[]} files
 */
function extractEqualsMarkers(raw, files) {
  const regex = /={3,}\s*([^\n]+\.\w+)\s*={3,}\n([\s\S]*?)(?=={3,}|$)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const filename = (match[1] || '').trim();
    const content = (match[2] || '').trim();
    if (filename && content) {
      files.push({ filename, content, isNew: false });
    }
  }
}

/**
 * @param {string} raw
 * @param {FilePatch[]} files
 */
function extractBacktickFiles(raw, files) {
  const regex = /`([^`]+\.\w+)`\s*\n```[\w]*\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const filename = (match[1] || '').trim();
    const content = (match[2] || '').trim();
    if (filename && content) {
      files.push({ filename, content, isNew: false });
    }
  }
}

/**
 * @param {string} raw
 * @param {FilePatch[]} files
 */
function extractSingleBlock(raw, files) {
  const match = raw.match(/```(?:typescript|tsx|jsx|javascript)?\n([\s\S]+?)```/);
  if (match) {
    files.push({
      filename: 'src/App.tsx',
      content: match[1].trim(),
      isNew: false,
    });
  }
}

/**
 * @param {string} raw
 * @param {string[]} commands
 */
function extractShellCommands(raw, commands) {
  const regex = /```(?:bash|shell|sh)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const cmd = (match[1] || '').trim();
    if (cmd) commands.push(cmd);
  }
}

/**
 * Remove duplicatas mantendo a ultima ocorrencia de cada filename.
 * @param {FilePatch[]} files
 * @returns {FilePatch[]}
 */
function deduplicateFiles(files) {
  const seen = new Map();
  for (const file of files) {
    seen.set(file.filename, file);
  }
  return Array.from(seen.values());
}

/**
 * Ordena arquivos pela ordem correta de dependencia.
 * types -> utils/lib -> hooks -> components -> pages -> App/main
 *
 * @param {FilePatch[]} files
 * @returns {FilePatch[]}
 */
export function sortFilesByDependency(files) {
  const priority = (filename) => {
    if (filename.includes('types') || filename.endsWith('.d.ts')) return 0;
    if (filename.includes('utils') || filename.includes('lib/')) return 1;
    if (filename.includes('hooks/')) return 2;
    if (filename.includes('components/')) return 3;
    if (filename.includes('pages/') || filename.includes('routes/')) return 4;
    if (filename === 'src/App.tsx' || filename === 'src/main.tsx') return 5;
    if (filename.endsWith('.css')) return 1;
    if (filename.endsWith('.json')) return 0;
    return 3;
  };

  return [...files].sort((a, b) => priority(a.filename) - priority(b.filename));
}

/**
 * Validacao basica de conteudo antes de escrever no WebContainer.
 * Detecta problemas obvios que causariam erro de build.
 *
 * @param {string} filename
 * @param {string} content
 * @returns {{ valid: boolean, issues: string[] }}
 */
export function validateFileContent(filename, content) {
  const issues = [];

  if (!content || content.trim().length === 0) {
    issues.push('Arquivo vazio');
    return { valid: false, issues };
  }

  const isTsOrJsx = /\.(tsx?|jsx?)$/.test(filename);

  if (isTsOrJsx) {
    // Chaves balanceadas
    const opens = (content.match(/\{/g) || []).length;
    const closes = (content.match(/\}/g) || []).length;
    if (Math.abs(opens - closes) > 3) {
      issues.push(`Chaves desbalanceadas: ${opens} abre, ${closes} fecha`);
    }

    // Parenteses balanceados
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (Math.abs(openParens - closeParens) > 3) {
      issues.push(`Parenteses desbalanceados: ${openParens} abre, ${closeParens} fecha`);
    }

    // Imports possivelmente incompletos
    const importLines = content.match(/^import .+/gm) || [];
    for (const line of importLines) {
      if (line.includes("from '") && !line.endsWith("'") && !line.endsWith("';")) {
        issues.push(`Import possivelmente incompleto: ${line.substring(0, 60)}`);
      }
    }

    // Verifica se tem export (componentes devem exportar algo)
    if (filename.includes('components/') || filename.includes('pages/')) {
      if (!content.includes('export ')) {
        issues.push('Arquivo de componente/pagina sem nenhum export');
      }
    }
  }

  if (filename.endsWith('.json')) {
    try {
      JSON.parse(content);
    } catch {
      issues.push('JSON invalido');
    }
  }

  return { valid: issues.length === 0, issues };
}
