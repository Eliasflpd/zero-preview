// ─── ZERO PREVIEW — SYNTAX VALIDATOR + AUTO-FIX ──────────────────────────────
// Intercepta codigo gerado ANTES do WebContainer.
// Detecta erros de sintaxe e tenta corrigir automaticamente via API.

import { callClaude } from "./api";

// ─── EXTENSOES VALIDAVEIS ───────────────────────────────────────────────────
const VALIDATABLE_EXTENSIONS = /\.(tsx?|jsx?|js|ts)$/;

// ─── DETECTORES DE ERRO ─────────────────────────────────────────────────────

function detectUnterminatedStrings(code, fileName) {
  const errors = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let inString = false;
    let stringChar = null;
    let escaped = false;
    let inTemplate = false;
    let inComment = false;
    let inBlockComment = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      const next = line[j + 1];

      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }

      // Block comment tracking
      if (inBlockComment) {
        if (ch === "*" && next === "/") { inBlockComment = false; j++; }
        continue;
      }
      if (!inString && !inTemplate && ch === "/" && next === "/") break; // line comment
      if (!inString && !inTemplate && ch === "/" && next === "*") { inBlockComment = true; j++; continue; }

      if (inTemplate) {
        if (ch === "`") inTemplate = false;
        continue;
      }

      if (inString) {
        if (ch === stringChar) inString = false;
        continue;
      }

      if (ch === "`") { inTemplate = true; continue; }
      if (ch === "'" || ch === '"') { inString = true; stringChar = ch; }
    }

    if (inString) {
      errors.push({
        file: fileName,
        line: i + 1,
        col: 0,
        message: `String nao terminada (aspas ${stringChar} abertas sem fechar)`,
        type: "unterminated_string",
      });
    }
  }

  return errors;
}

function detectUnterminatedTemplateLiterals(code, fileName) {
  const errors = [];
  let depth = 0;
  let lineNum = 1;
  let startLine = -1;

  for (let i = 0; i < code.length; i++) {
    if (code[i] === "\n") { lineNum++; continue; }
    if (code[i] === "\\" && i + 1 < code.length) { i++; continue; }

    if (code[i] === "`") {
      if (depth === 0) {
        depth++;
        startLine = lineNum;
      } else {
        depth--;
      }
    }
  }

  if (depth > 0) {
    errors.push({
      file: fileName,
      line: startLine,
      col: 0,
      message: "Template literal (backtick) aberto sem fechar",
      type: "unterminated_template",
    });
  }

  return errors;
}

function detectUnbalancedBrackets(code, fileName) {
  const errors = [];
  const stack = [];
  const pairs = { "(": ")", "[": "]", "{": "}" };
  const closers = new Set([")", "]", "}"]);
  let lineNum = 1;
  let inString = false;
  let stringChar = null;
  let inTemplate = false;
  let inComment = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (ch === "\n") { lineNum++; continue; }

    // Skip escaped chars
    if (code[i - 1] === "\\") continue;

    // Comments
    if (!inString && !inTemplate) {
      if (ch === "/" && code[i + 1] === "/") {
        while (i < code.length && code[i] !== "\n") i++;
        lineNum++;
        continue;
      }
      if (ch === "/" && code[i + 1] === "*") {
        i += 2;
        while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) {
          if (code[i] === "\n") lineNum++;
          i++;
        }
        i++; // skip /
        continue;
      }
    }

    // Strings
    if (!inTemplate && (ch === '"' || ch === "'")) {
      if (inString && ch === stringChar) { inString = false; continue; }
      if (!inString) { inString = true; stringChar = ch; continue; }
    }

    if (ch === "`") { inTemplate = !inTemplate; continue; }
    if (inString || inTemplate) continue;

    if (pairs[ch]) {
      stack.push({ ch, line: lineNum, expected: pairs[ch] });
    } else if (closers.has(ch)) {
      if (stack.length === 0) {
        errors.push({ file: fileName, line: lineNum, col: 0, message: `"${ch}" extra sem par de abertura`, type: "unexpected_token" });
      } else {
        const top = stack.pop();
        if (top.expected !== ch) {
          errors.push({ file: fileName, line: lineNum, col: 0, message: `Esperava "${top.expected}" mas encontrou "${ch}"`, type: "unexpected_token" });
        }
      }
    }
  }

  for (const unclosed of stack) {
    errors.push({
      file: fileName,
      line: unclosed.line,
      col: 0,
      message: `"${unclosed.ch}" aberto na linha ${unclosed.line} nunca foi fechado`,
      type: "unclosed_bracket",
    });
  }

  return errors;
}

// ─── TYPESCRIPT GENERICS — nao confundir com JSX ────────────────────────────

const TS_BUILTINS = new Set([
  'string','number','boolean','void','null','undefined','never','any',
  'unknown','object','symbol','bigint','T','K','V','U','E','R','S','P',
  'Props','State','Ref','Context','Event','Handler','Dispatch','Action',
]);

const TYPE_CONTEXT_BEFORE = /[=:,(<|]\s*$/;
const TYPE_CONTEXT_AFTER = /^\s*[,)>|&;\]]/;
const DOM_TYPE = /^HTML\w+Element$|^SVG\w+Element$|^Element$|^Node$|^Event$/;
const UTILITY_TYPES = /^(Promise|Array|Record|Map|Set|Partial|Required|Readonly|Pick|Omit|Exclude|Extract|NonNullable|ReturnType|InstanceType|Parameters|Awaited|Uppercase|Lowercase|Capitalize)$/;

const SELF_CLOSING_TAGS = new Set([
  "img", "br", "hr", "input", "meta", "link", "area",
  "base", "col", "embed", "source", "track", "wbr",
]);

// Tags Shadcn/Radix complexas que frequentemente ficam sem fechar
// O auto-fix local trata essas antes de cair no auto-fix via API
const COMPLEX_SHADCN_TAGS = new Set([
  "Tooltip", "TooltipProvider", "TooltipContent", "TooltipTrigger",
  "PopoverContent", "Popover", "PopoverTrigger",
  "DialogContent", "Dialog", "DialogTrigger",
  "SheetContent", "Sheet", "SheetTrigger",
  "DropdownMenuContent", "DropdownMenu", "DropdownMenuTrigger",
  "SelectContent", "Select", "SelectTrigger",
  "AccordionContent", "Accordion", "AccordionItem",
]);

// Arquivos que podem conter JSX (nao .ts puro)
const JSX_EXTENSIONS = /\.(tsx|jsx|js)$/;

// Paths que sempre sao validos — pular validacao JSX
const SKIP_PATTERNS = [
  'src/components/ui/',   // shadcn components — sempre validos
  'src/lib/supabase',     // cliente supabase — sem JSX
  'node_modules/',        // deps externas
];

function isJSXOpenTag(tagName, lineContent) {
  // 1. Pular tipos primitivos e generics comuns
  if (TS_BUILTINS.has(tagName)) return false;

  // 2. Pular tipos DOM nativos (HTMLButtonElement, SVGSVGElement, etc)
  if (DOM_TYPE.test(tagName)) return false;

  // 3. Pular utility types do TypeScript
  if (UTILITY_TYPES.test(tagName)) return false;

  // 4. Verificar contexto antes da tag — se vier apos = : , ( < | e tipo TS
  const tagIdx = lineContent.indexOf('<' + tagName);
  if (tagIdx >= 0) {
    const beforeTag = lineContent.substring(0, tagIdx);
    if (TYPE_CONTEXT_BEFORE.test(beforeTag)) return false;
  }

  // 5. Verificar contexto depois da tag — se vier , ) > | & ; ] e tipo TS
  if (tagIdx >= 0) {
    const closeAngle = lineContent.indexOf('>', tagIdx + tagName.length + 1);
    if (closeAngle >= 0) {
      const afterTag = lineContent.substring(closeAngle + 1);
      if (TYPE_CONTEXT_AFTER.test(afterTag)) return false;
    }
  }

  // 6. Pular se linha contem palavras-chave de tipo TS
  if (/\b(interface|type\s+\w+|extends|implements|keyof|typeof|infer)\b/.test(lineContent)) return false;

  // 7. Pular se e arrow function com generic: const fn = <T>() =>
  if (/const\s+\w+\s*=\s*</.test(lineContent)) return false;

  // 8. Pular se e chamada de metodo com generic: foo.bar<T>(), supabase.from<T>()
  if (/\.\w+\s*</.test(lineContent)) return false;

  // 9. Pular se e declaracao de funcao com generic: function foo<T>
  if (/function\s+\w+\s*</.test(lineContent)) return false;

  // 10. Pular se e new com generic: new Map<string, number>()
  if (/new\s+\w+\s*</.test(lineContent)) return false;

  // Se passou tudo — e JSX real
  return true;
}

function detectUnclosedJSX(code, fileName) {
  // .ts puros NAO contem JSX — pular completamente
  if (!JSX_EXTENSIONS.test(fileName)) return [];

  // Pular arquivos em paths conhecidos
  if (SKIP_PATTERNS.some(p => fileName.includes(p))) return [];

  const errors = [];
  const lines = code.split("\n");
  const openTagRegex = /<([A-Z][a-zA-Z0-9]*|[a-z][a-z0-9-]*)\b[^>]*(?<!\/)>/g;
  const closeTagRegex = /<\/([A-Z][a-zA-Z0-9]*|[a-z][a-z0-9-]*)\s*>/g;

  // Contar opens filtrados por isJSXOpenTag
  const opens = {};
  const closes = {};
  let match;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    openTagRegex.lastIndex = 0;

    while ((match = openTagRegex.exec(line)) !== null) {
      const tag = match[1];
      if (SELF_CLOSING_TAGS.has(tag.toLowerCase())) continue;
      if (!isJSXOpenTag(tag, line)) continue;

      if (!opens[tag]) opens[tag] = [];
      opens[tag].push(i + 1);
    }
  }

  // Contar closes (sem filtro — closing tags sao sempre </Tag>)
  while ((match = closeTagRegex.exec(code)) !== null) {
    const tag = match[1];
    if (!closes[tag]) closes[tag] = 0;
    closes[tag]++;
  }

  for (const [tag, lineNums] of Object.entries(opens)) {
    const closeCount = closes[tag] || 0;
    const diff = lineNums.length - closeCount;
    if (diff > 0) {
      // So reporta se o codigo tem return (contexto JSX)
      if (!code.includes("return")) continue;
      errors.push({
        file: fileName,
        line: lineNums[lineNums.length - 1],
        col: 0,
        message: `Tag JSX <${tag}> aberta ${diff}x sem fechar (</${tag}> faltando)`,
        type: "unclosed_jsx",
      });
    }
  }

  return errors;
}

// ─── DETECTOR: TYPE ANNOTATIONS EM ARROW FUNCTIONS DENTRO DE JSX PROPS ──────
// Padroes como formatter={(v:any)=> quebram Babel/Vite dentro de JSX
// O correto e (v)=> ou definir tipo fora do JSX

function detectBrokenTypedArrowsInJSX(code, fileName) {
  if (!JSX_EXTENSIONS.test(fileName)) return [];
  const errors = [];
  const lines = code.split("\n");
  // Detecta (param:type)=> ou (param:type)= /> dentro de JSX props (apos ={)
  const pattern = /=\{[^}]*\((\w+)\s*:\s*\w+\)\s*=\s*>?/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(line)) !== null) {
      errors.push({
        file: fileName,
        line: i + 1,
        col: match.index,
        message: `Arrow function com type annotation dentro de JSX prop quebra o parser. Use (${match[1]}) => em vez de (${match[1]}:type) =>`,
        type: "typed_arrow_in_jsx",
      });
    }
  }
  return errors;
}

// ─── VALIDADOR PRINCIPAL ────────────────────────────────────────────────────

/**
 * Valida sintaxe de todos os arquivos JS/TS/JSX/TSX.
 * @param {Object} files - { "filename.tsx": "conteudo" }
 * @returns {{ valid: boolean, errors: Array<{file, line, col, message, type}> }}
 */
export function validateSyntax(files) {
  const allErrors = [];

  for (const [fileName, content] of Object.entries(files)) {
    if (!VALIDATABLE_EXTENSIONS.test(fileName)) continue;
    if (!content || typeof content !== "string") continue;

    // Pular arquivos .ts puros (sem JSX) e paths conhecidos como seguros
    const isTsPure = fileName.endsWith('.ts') && !fileName.endsWith('.tsx');
    const isSkipped = SKIP_PATTERNS.some(p => fileName.includes(p));

    if (isTsPure || isSkipped) continue;

    // Detectores universais (todos os .jsx/.tsx/.js)
    allErrors.push(
      ...detectUnterminatedStrings(content, fileName),
      ...detectUnterminatedTemplateLiterals(content, fileName),
      ...detectUnbalancedBrackets(content, fileName),
    );

    // JSX detector — detectUnclosedJSX filtra internamente tambem
    allErrors.push(
      ...detectUnclosedJSX(content, fileName),
    );

    // Typed arrow functions em JSX props — quebra Babel/Vite
    allErrors.push(
      ...detectBrokenTypedArrowsInJSX(content, fileName),
    );
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

// ─── LOCAL FIX — Tags Shadcn/Radix complexas (sem API) ──────────────────────

/**
 * Fix deterministico local para tags complexas nao fechadas.
 * Roda ANTES do auto-fix via API — zero tokens, <1ms.
 * Retorna o codigo corrigido ou o original se nao encontrou nada.
 */
function fixUnclosedComplexTags(code) {
  let result = code;

  for (const tag of COMPLEX_SHADCN_TAGS) {
    // Contar abertas vs fechadas
    const openPattern = new RegExp(`<${tag}\\b[^>]*(?<!\\/)>`, "g");
    const closePattern = new RegExp(`<\\/${tag}\\s*>`, "g");
    const selfClosePattern = new RegExp(`<${tag}\\b[^>]*\\/>`, "g");

    const opens = (result.match(openPattern) || []).length;
    const closes = (result.match(closePattern) || []).length;
    const diff = opens - closes;

    if (diff <= 0) continue;

    // Para cada tag aberta sem fechar, decidir: self-close ou adicionar closing tag
    // Regex para encontrar tags abertas com posicao
    const findOpen = new RegExp(`(<${tag}\\b[^>]*(?<!\\/)>)`, "g");
    let m;
    let openPositions = [];

    while ((m = findOpen.exec(result)) !== null) {
      openPositions.push({ index: m.index, length: m[0].length, match: m[0] });
    }

    // Tratar as ultimas `diff` tags abertas (as que ficaram sem fechar)
    const toFix = openPositions.slice(-diff);

    // Processar de tras pra frente para nao invalidar indices
    for (let i = toFix.length - 1; i >= 0; i--) {
      const pos = toFix[i];
      const afterTag = result.slice(pos.index + pos.length);

      // Verificar se tem conteudo real entre abertura e proxima tag/fechamento
      const nextTagMatch = afterTag.match(/^\s*(<[A-Za-z]|<\/|{|$)/);
      const hasChildren = nextTagMatch && !nextTagMatch[0].trim().startsWith("</") && nextTagMatch[0].trim() !== "";

      if (!hasChildren || /^\s*<\//.test(afterTag) || /^\s*$/.test(afterTag.split("\n")[0])) {
        // Sem children visivel — converter para self-closing
        const selfClose = pos.match.replace(/>$/, " />");
        result = result.slice(0, pos.index) + selfClose + result.slice(pos.index + pos.length);
      } else {
        // Tem children — adicionar closing tag no final da linha ou antes da proxima tag de mesmo nivel
        const insertPos = pos.index + pos.length;
        // Encontrar o proximo fechamento de tag pai ou final do bloco
        const restCode = result.slice(insertPos);
        const nextClose = restCode.search(/<\/[A-Z]/);

        if (nextClose >= 0) {
          const insertAt = insertPos + nextClose;
          result = result.slice(0, insertAt) + `</${tag}>` + result.slice(insertAt);
        } else {
          // Fallback: adicionar closing tag no final do arquivo antes do ultimo }
          const lastBrace = result.lastIndexOf("}");
          if (lastBrace >= 0) {
            result = result.slice(0, lastBrace) + `</${tag}>\n` + result.slice(lastBrace);
          }
        }
      }
    }
  }

  return result;
}

// ─── AUTO-FIX VIA API ───────────────────────────────────────────────────────

const AUTOFIX_SYSTEM = `Voce e um corretor de sintaxe JSX/TypeScript. Receba codigo com erros e retorne APENAS o codigo corrigido. Sem explicacao, sem markdown, sem \`\`\`. Comece direto com imports.`;

/**
 * Tenta corrigir erros de sintaxe chamando a API.
 * @param {Object} files - { "filename.tsx": "conteudo" }
 * @param {Array} errors - lista de erros do validateSyntax
 * @returns {{ files: Object, fixed: boolean, fixedCount: number }}
 */
export async function autoFix(files, errors) {
  // Agrupa erros por arquivo
  const errorsByFile = {};
  for (const err of errors) {
    if (!errorsByFile[err.file]) errorsByFile[err.file] = [];
    errorsByFile[err.file].push(err);
  }

  const fixedFiles = { ...files };
  let fixedCount = 0;

  // Fase 1: Fix local deterministico para tags Shadcn/Radix complexas (zero tokens)
  for (const [fileName, fileErrors] of Object.entries(errorsByFile)) {
    const hasUnclosedJSX = fileErrors.some(e => e.type === "unclosed_jsx");
    if (!hasUnclosedJSX) continue;

    const code = fixedFiles[fileName];
    if (!code) continue;

    const localFixed = fixUnclosedComplexTags(code);
    if (localFixed !== code) {
      fixedFiles[fileName] = localFixed;
      // Re-validate after local fix
      const recheck = validateSyntax({ [fileName]: localFixed });
      const remaining = recheck.errors.filter(e => e.file === fileName);
      if (remaining.length < fileErrors.length) {
        fixedCount++;
        // Remove fixed errors from errorsByFile so API fix skips them
        errorsByFile[fileName] = remaining;
        console.log(`[Zero] Local fix: ${fileName} — tags Shadcn corrigidas (${fileErrors.length - remaining.length} erros resolvidos)`);
      }
      if (remaining.length === 0) {
        delete errorsByFile[fileName];
      }
    }
  }

  // Fase 1.5: Fix local para typed arrows em JSX props (zero tokens)
  for (const [fileName, fileErrors] of Object.entries(errorsByFile)) {
    const hasTypedArrow = fileErrors.some(e => e.type === "typed_arrow_in_jsx");
    if (!hasTypedArrow) continue;

    let code = fixedFiles[fileName];
    if (!code) continue;

    // Remove type annotations de arrow functions dentro de JSX props: (v:any)=> → (v)=>
    // Tambem corrige o caso quebrado (v:any)= /> → (v) =>
    code = code.replace(/=\{([^}]*)\((\w+)\s*:\s*\w+\)\s*=\s*\/?>/g, (match, before, param) => {
      return `={${before}(${param}) =>`;
    });
    // Fix simples inline tambem: (param:Type) => dentro de ={...}
    code = code.replace(/(\=\{[^}]*)\((\w+)\s*:\s*\w+\)\s*=>/g, (match, before, param) => {
      return `${before}(${param}) =>`;
    });

    if (code !== fixedFiles[fileName]) {
      fixedFiles[fileName] = code;
      const recheck = validateSyntax({ [fileName]: code });
      const remaining = recheck.errors.filter(e => e.file === fileName);
      if (remaining.length < fileErrors.length) {
        fixedCount++;
        errorsByFile[fileName] = remaining;
        console.log(`[Zero] Local fix: ${fileName} — typed arrow em JSX corrigido`);
      }
      if (remaining.length === 0) {
        delete errorsByFile[fileName];
      }
    }
  }

  // Fase 2: Fix via API para erros restantes
  for (const [fileName, fileErrors] of Object.entries(errorsByFile)) {
    const code = fixedFiles[fileName];
    if (!code) continue;

    const errorList = fileErrors
      .map(e => `- Linha ${e.line}: ${e.message}`)
      .join("\n");

    const prompt = `ARQUIVO: ${fileName}\n\nERROS DETECTADOS:\n${errorList}\n\nCODIGO COM ERROS:\n${code.slice(0, 12000)}\n\nRetorne o codigo COMPLETO corrigido. Corrija APENAS os erros de sintaxe listados. Nao mude logica, layout ou estilo.`;

    try {
      const fixed = await callClaude(AUTOFIX_SYSTEM, prompt, 16000);
      const cleaned = fixed
        .replace(/^```[a-z]*\s*/i, "")
        .replace(/\s*```$/m, "")
        .trim();

      if (cleaned && cleaned.length > 50) {
        // Re-validate o fix
        const recheck = validateSyntax({ [fileName]: cleaned });
        const prevErrorCount = fileErrors.length;
        const newErrorCount = recheck.errors.length;

        // Só aplica se melhorou
        if (newErrorCount < prevErrorCount) {
          fixedFiles[fileName] = cleaned;
          fixedCount++;
        }
      }
    } catch {
      // Se a API falhar, mantém o arquivo original
    }
  }

  return {
    files: fixedFiles,
    fixed: fixedCount > 0,
    fixedCount,
  };
}

// ─── RESULTADO FORMATADO ────────────────────────────────────────────────────

/**
 * Retorna um resumo legivel dos erros de sintaxe.
 */
export function formatSyntaxErrors(errors) {
  if (errors.length === 0) return "Sintaxe OK";
  return errors
    .map(e => `${e.file}:${e.line} → ${e.message}`)
    .join("\n");
}
