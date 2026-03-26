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

function detectUnclosedJSX(code, fileName) {
  const errors = [];
  // Match opening JSX tags (not self-closing, not fragments)
  const openTagRegex = /<([A-Z][a-zA-Z0-9]*|[a-z][a-z0-9-]*)\b[^>]*(?<!\/)>/g;
  const closeTagRegex = /<\/([A-Z][a-zA-Z0-9]*|[a-z][a-z0-9-]*)\s*>/g;
  const selfClosingTags = new Set(["img", "br", "hr", "input", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr"]);

  const opens = {};
  const closes = {};
  let match;

  while ((match = openTagRegex.exec(code)) !== null) {
    const tag = match[1];
    if (selfClosingTags.has(tag.toLowerCase())) continue;
    if (!opens[tag]) opens[tag] = [];
    const line = code.slice(0, match.index).split("\n").length;
    opens[tag].push(line);
  }

  while ((match = closeTagRegex.exec(code)) !== null) {
    const tag = match[1];
    if (!closes[tag]) closes[tag] = 0;
    closes[tag]++;
  }

  for (const [tag, lines] of Object.entries(opens)) {
    const closeCount = closes[tag] || 0;
    const diff = lines.length - closeCount;
    if (diff > 0) {
      // Only report if the tag appears in JSX context (after return)
      const returnIndex = code.indexOf("return");
      if (returnIndex === -1) continue;
      errors.push({
        file: fileName,
        line: lines[lines.length - 1],
        col: 0,
        message: `Tag JSX <${tag}> aberta ${diff}x sem fechar (</${tag}> faltando)`,
        type: "unclosed_jsx",
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

    // Run all detectors
    allErrors.push(
      ...detectUnterminatedStrings(content, fileName),
      ...detectUnterminatedTemplateLiterals(content, fileName),
      ...detectUnbalancedBrackets(content, fileName),
      ...detectUnclosedJSX(content, fileName),
    );
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
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

  for (const [fileName, fileErrors] of Object.entries(errorsByFile)) {
    const code = files[fileName];
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
