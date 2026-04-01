/**
 * MECANISMO 3 — Patch Cirurgico (Diff-Based Editing)
 *
 * Ao inves de reescrever arquivos inteiros, parseia e aplica
 * apenas as mudancas necessarias. Elimina erros em cascata.
 *
 * Suporta multiplos formatos de output do AI:
 * - ```typescript filename="src/App.jsx"
 * - // FILE: src/App.jsx
 * - === src/App.jsx ===
 * - `src/App.jsx` seguido de bloco de codigo
 */

/**
 * Sanitiza codigo TSX para evitar crashes do SWC.
 * Corrige: arrow functions quebradas em props, typed params em JSX, etc.
 *
 * @param {string} content
 * @returns {string}
 */
export function sanitizeTSXForSWC(content, filename = '') {
  if (!content) return content;
  const original = content;
  let result = content;

  // Fix: (v)= /> ou (e)= /> → ($1) =>  (arrow function quebrada em prop JSX)
  result = result.replace(/\((\w+)\)=\s*\/>/g, '($1) =>');

  // Fix: typed arrow params em JSX props — (e: React.ChangeEvent<...>) => ...
  result = result.replace(/\((\w+)\s*:\s*(?:React\.)?\w+(?:<[^>]*>)?\)\s*=>/g, '($1) =>');

  // Fix: (e: any) => ou (v: number) => dentro de JSX
  result = result.replace(/\((\w+)\s*:\s*\w+\)\s*=>/g, '($1) =>');

  // Strip TS type annotations: `: string`, `: number`, `: any`, `as Type`
  // Remove `<Type>` generic params from function declarations
  result = result.replace(/:\s*(?:string|number|boolean|any|void|never|object)\b/g, '');
  result = result.replace(/:\s*(?:React\.)\w+(?:<[^>]*>)?/g, '');
  result = result.replace(/\bas\s+\w+/g, '');

  // Remove interface/type declarations entirely
  result = result.replace(/^(?:export\s+)?(?:interface|type)\s+\w+[\s\S]*?^\}/gm, '');

  if (result !== original) {
    console.log('[Zero AUDIT] sanitize-swc', { file: filename, changes: original.length - result.length });
  }

  return result;
}

/**
 * Remove qualquer import de libs de charts (recharts, chart.js, react-chartjs-2).
 * Os apps gerados usam SVG inline — zero dependencias de graficos.
 *
 * @param {string} content
 * @returns {string}
 */
export function replaceRechartsImports(content) {
  if (!content) return content;

  // APENAS remove recharts — chart.js e react-chartjs-2 sao as libs CORRETAS
  const hasRecharts = /recharts/.test(content);
  if (!hasRecharts) return content;

  let result = content;

  // Remove APENAS imports de recharts (nunca chart.js ou react-chartjs-2)
  result = result.replace(/import\s+\{[^}]*\}\s+from\s+["']recharts["'];?\n?/g, '');

  return result.replace(/\n{3,}/g, '\n\n');
}

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

  // Fallback: bloco de codigo unico -> assume src/App.jsx
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
      filename: 'src/App.jsx',
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
    if (filename === 'src/App.jsx' || filename === 'src/main.jsx') return 5;
    if (filename.endsWith('.css')) return 1;
    if (filename.endsWith('.json')) return 0;
    return 3;
  };

  return [...files].sort((a, b) => priority(a.filename) - priority(b.filename));
}

/**
 * Nomes de formatters que existem em @/utils/formatters e @/lib/utils.
 * Se o AI declarar esses nomes inline, substituimos por import.
 */
const KNOWN_FORMATTERS = ['formatCurrency', 'formatDate', 'formatPercent', 'formatPhone'];

/**
 * Remove declaracoes inline de formatters conhecidos e garante que o import existe.
 * Resolve: AI redeclarando formatCurrency/formatDate dentro do arquivo gerado.
 *
 * @param {string} content - Conteudo do arquivo .tsx/.ts
 * @returns {string} - Conteudo limpo com import correto
 */
export function replaceInlineFormatters(content) {
  if (!content) return content;

  const lines = content.split('\n');
  const linesToRemove = new Set();
  const foundFormatters = new Set();

  // Regex: const formatCurrency = ... ou function formatDate(...)
  // Captura variantes: const, let, var, function, export const, export function
  const declPatterns = KNOWN_FORMATTERS.map(name => ({
    name,
    regex: new RegExp(`^\\s*(?:export\\s+)?(?:const|let|var|function)\\s+${name}\\s*[=(]`),
  }));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { name, regex } of declPatterns) {
      if (!regex.test(line)) continue;

      foundFormatters.add(name);
      // Remove a declaracao inteira (pode ser multiline)
      let braceDepth = 0;
      let parenDepth = 0;
      let started = false;
      let j = i;

      for (; j < lines.length; j++) {
        const l = lines[j];
        for (const ch of l) {
          if (ch === '{') { braceDepth++; started = true; }
          else if (ch === '}') { braceDepth--; }
          else if (ch === '(') { parenDepth++; started = true; }
          else if (ch === ')') { parenDepth--; }
        }
        linesToRemove.add(j);
        if (started && braceDepth <= 0 && parenDepth <= 0) {
          if (j + 1 < lines.length && lines[j + 1].trim() === ';') {
            linesToRemove.add(j + 1);
          }
          break;
        }
        if (!started && (l.trimEnd().endsWith(';') || l.trimEnd().endsWith(','))) break;
      }
      break; // one match per line
    }
  }

  if (foundFormatters.size === 0) return content;

  // Filtra linhas removidas
  let result = lines.filter((_, i) => !linesToRemove.has(i)).join('\n');

  // Verifica se ja existe import de @/lib/utils ou @/utils/formatters
  const hasUtilsImport = /import\s+\{[^}]*\}\s+from\s+["']@\/lib\/utils["']/.test(result);
  const hasFormattersImport = /import\s+\{[^}]*\}\s+from\s+["']@\/utils\/formatters["']/.test(result);

  if (hasUtilsImport) {
    // Adiciona os formatters faltantes ao import existente de @/lib/utils
    const utilsImportMatch = result.match(/import\s+\{([^}]*)\}\s+from\s+["']@\/lib\/utils["']/);
    if (utilsImportMatch) {
      const existingImports = utilsImportMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      for (const name of foundFormatters) {
        if (!existingImports.includes(name)) {
          existingImports.push(name);
        }
      }
      const newImport = `import { ${existingImports.join(', ')} } from "@/lib/utils"`;
      result = result.replace(/import\s+\{[^}]*\}\s+from\s+["']@\/lib\/utils["'][;]?/, newImport + ';');
    }
  } else if (!hasFormattersImport) {
    // Nenhum import existe — adiciona import de @/lib/utils no topo (apos outros imports)
    const lastImportIdx = result.lastIndexOf('\nimport ');
    if (lastImportIdx !== -1) {
      const lineEnd = result.indexOf('\n', lastImportIdx + 1);
      const formattersArr = Array.from(foundFormatters);
      const newImportLine = `\nimport { ${formattersArr.join(', ')} } from "@/lib/utils";`;
      result = result.slice(0, lineEnd) + newImportLine + result.slice(lineEnd);
    } else {
      // Sem imports — coloca no topo
      const formattersArr = Array.from(foundFormatters);
      result = `import { ${formattersArr.join(', ')} } from "@/lib/utils";\n` + result;
    }
  }

  return result.replace(/\n{3,}/g, '\n\n');
}

/**
 * Remove declaracoes duplicadas de const/function no mesmo arquivo.
 * Mantém apenas a primeira ocorrência de cada declaração.
 * Resolve: [plugin:vite:react-babel] Duplicate declaration
 *
 * @param {string} content - Conteudo do arquivo
 * @returns {string} - Conteudo sem duplicatas
 */
export function removeDuplicateConsts(content) {
  if (!content) return content;

  const seen = new Map(); // name -> first occurrence line index
  const lines = content.split('\n');
  const linesToRemove = new Set();

  // Pattern: const name = ..., function name(...), let name =
  const declRegex = /^(?:export\s+)?(?:const|let|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=(]/;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const match = trimmed.match(declRegex);
    if (!match) continue;

    const name = match[1];
    if (!seen.has(name)) {
      seen.set(name, i);
      continue;
    }

    // Duplicate found — remove this entire declaration block
    // Find the end of the declaration (track braces/parens)
    let braceDepth = 0;
    let parenDepth = 0;
    let started = false;
    let j = i;

    for (; j < lines.length; j++) {
      const line = lines[j];
      for (const ch of line) {
        if (ch === '{') { braceDepth++; started = true; }
        else if (ch === '}') { braceDepth--; }
        else if (ch === '(') { parenDepth++; started = true; }
        else if (ch === ')') { parenDepth--; }
      }

      linesToRemove.add(j);

      // Declaration ends when all braces/parens are closed
      if (started && braceDepth <= 0 && parenDepth <= 0) {
        // Also check if next line is just a semicolon
        if (j + 1 < lines.length && lines[j + 1].trim() === ';') {
          linesToRemove.add(j + 1);
        }
        break;
      }

      // Simple single-line declaration (no braces opened)
      if (!started && (line.endsWith(';') || line.endsWith(','))) {
        break;
      }
    }
  }

  if (linesToRemove.size === 0) return content;

  const result = lines.filter((_, i) => !linesToRemove.has(i)).join('\n');
  // Clean up multiple blank lines left behind
  return result.replace(/\n{3,}/g, '\n\n');
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
