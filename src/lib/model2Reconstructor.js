/**
 * MODELO 2 — RECONSTRUTOR DE ARQUIVOS (Dual-Model Pipeline)
 *
 * Quando o Modelo 1 (Arquiteto) gera um diff parcial com
 * "// ... keep existing code (descricao)", este modulo reconstroi
 * o arquivo completo substituindo os "keep" pelo codigo original.
 *
 * Fluxo:
 * 1. Tenta reconstrucao LOCAL (regex — instantaneo, sem AI)
 * 2. Se sobrar "keep" nao resolvido, chama Modelo 2 via backend /reconstruct
 *    (Groq llama3-8b — ultrarrapido, ~200ms)
 *
 * Isso elimina o problema de "reescrever arquivo inteiro a cada edicao"
 * e reduz 70% dos erros em cascata.
 */

const KEEP_PATTERN = /\/\/\s*\.\.\.\s*keep existing code[^\n]*/gi;

/**
 * Reconstroi arquivo localmente (sem chamada AI).
 * Substitui cada "// ... keep existing code (nome)" pelo trecho correspondente do original.
 *
 * @param {string} filename
 * @param {string} originalContent - Conteudo atual do arquivo (vazio se novo)
 * @param {string} diffContent - Output do Modelo 1 para este arquivo
 * @returns {{ filename: string, fullContent: string, isNew: boolean, hasUnresolved: boolean }}
 */
export function reconstructLocally(filename, originalContent, diffContent) {
  // Se nao tem "keep existing code", o diff ja e o arquivo completo
  if (!KEEP_PATTERN.test(diffContent)) {
    return {
      filename,
      fullContent: diffContent,
      isNew: !originalContent,
      hasUnresolved: false,
    };
  }

  // Reset regex lastIndex
  KEEP_PATTERN.lastIndex = 0;

  let result = diffContent;
  const matches = [...diffContent.matchAll(KEEP_PATTERN)];
  let unresolvedCount = 0;

  for (const match of matches) {
    const keepComment = match[0];

    // Extrai o nome da secao mencionada no parenteses
    // Ex: "// ... keep existing code (handleSubmit e handleReset)"
    const nameMatch = keepComment.match(/\(([^)]+)\)/);
    const sectionHint = nameMatch ? nameMatch[1].trim() : '';

    if (sectionHint && originalContent) {
      // Tenta encontrar a secao no original por nome
      const section = extractSectionByName(originalContent, sectionHint);
      if (section) {
        result = result.replace(keepComment, section);
        continue;
      }

      // Tenta por contexto (linhas ao redor do keep no diff)
      const contextSection = extractSectionByContext(originalContent, diffContent, keepComment);
      if (contextSection) {
        result = result.replace(keepComment, contextSection);
        continue;
      }
    }

    // Se o keep e generico (sem nome), tenta inferir pela posicao
    if (!sectionHint && originalContent) {
      const positionalSection = extractByPosition(originalContent, diffContent, keepComment);
      if (positionalSection) {
        result = result.replace(keepComment, positionalSection);
        continue;
      }
    }

    // Nao conseguiu resolver — marca como pendente pro Modelo 2
    unresolvedCount++;
  }

  return {
    filename,
    fullContent: result.trim(),
    isNew: !originalContent,
    hasUnresolved: unresolvedCount > 0,
  };
}

/**
 * Reconstroi usando AI (Modelo 2 via backend /reconstruct).
 * So chamado quando a reconstrucao local deixou "keep" sem resolver.
 *
 * @param {string} filename
 * @param {string} originalContent
 * @param {string} diffContent
 * @param {(prompt: string) => Promise<string>} callModel2 - Funcao que chama o backend /reconstruct
 * @returns {Promise<{ filename: string, fullContent: string, isNew: boolean }>}
 */
export async function reconstructWithAI(filename, originalContent, diffContent, callModel2) {
  const prompt = `Voce e um reconstrutor de codigo. Tarefa unica e simples.

ARQUIVO ORIGINAL (${filename}):
\`\`\`
${originalContent || '(arquivo novo)'}
\`\`\`

DIFF GERADO (contem "// ... keep existing code" onde o codigo original deve ser mantido):
\`\`\`
${diffContent}
\`\`\`

INSTRUCAO:
Reconstrua o arquivo completo substituindo cada "// ... keep existing code" pelo trecho correspondente do arquivo original.
Onde nao for possivel identificar o trecho, mantenha o codigo do diff como esta.
Retorne APENAS o codigo do arquivo reconstruido. Sem explicacoes, sem markdown, sem backticks.`;

  const raw = await callModel2(prompt);

  // Limpa possivel markdown da resposta
  const cleaned = raw
    .replace(/^```[\w]*\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

  return {
    filename,
    fullContent: cleaned,
    isNew: !originalContent,
  };
}

/**
 * Verifica se um output do AI contem marcadores "keep existing code".
 * @param {string} content
 * @returns {boolean}
 */
export function hasKeepMarkers(content) {
  KEEP_PATTERN.lastIndex = 0;
  return KEEP_PATTERN.test(content);
}

// ─── Extratores internos ────────────────────────────────────────────────────

/**
 * Extrai secao do codigo pelo nome de funcao/variavel/componente.
 * @param {string} code
 * @param {string} hint - Ex: "handleSubmit", "imports", "useState hooks"
 * @returns {string|null}
 */
function extractSectionByName(code, hint) {
  // Se o hint menciona "imports"
  if (/imports?/i.test(hint)) {
    const importBlock = code.match(/^(import[\s\S]*?)(?=\n(?!import))/m);
    return importBlock ? importBlock[1] : null;
  }

  // Hint pode ter multiplos nomes: "handleSubmit e handleReset"
  const names = hint.split(/\s+(?:e|and|,)\s+/).map(n => n.trim()).filter(Boolean);

  if (names.length > 1) {
    // Extrair cada um e juntar
    const sections = names.map(name => extractSingleName(code, name)).filter(Boolean);
    return sections.length > 0 ? sections.join('\n\n') : null;
  }

  return extractSingleName(code, names[0] || hint);
}

/**
 * Extrai uma unica funcao/variavel/classe pelo nome.
 * @param {string} code
 * @param {string} name
 * @returns {string|null}
 */
function extractSingleName(code, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Funcao (function name, const name =, async function name)
  const fnPatterns = [
    new RegExp(`((?:export\\s+)?(?:async\\s+)?function\\s+${escaped}\\s*\\([\\s\\S]*?\\n\\})`, 'm'),
    new RegExp(`((?:export\\s+)?(?:const|let|var)\\s+${escaped}\\s*=\\s*(?:\\([^)]*\\)|[^=])\\s*=>\\s*\\{[\\s\\S]*?\\n\\})`, 'm'),
    new RegExp(`((?:export\\s+)?(?:const|let|var)\\s+${escaped}\\s*=[\\s\\S]*?;)`, 'm'),
  ];

  for (const pattern of fnPatterns) {
    const match = code.match(pattern);
    if (match) return match[1];
  }

  // Classe
  const classPattern = new RegExp(`((?:export\\s+)?class\\s+${escaped}[\\s\\S]*?\\n\\})`, 'm');
  const classMatch = code.match(classPattern);
  if (classMatch) return classMatch[1];

  // Interface/type (TypeScript)
  const typePattern = new RegExp(`((?:export\\s+)?(?:interface|type)\\s+${escaped}[\\s\\S]*?\\n\\})`, 'm');
  const typeMatch = code.match(typePattern);
  if (typeMatch) return typeMatch[1];

  return null;
}

/**
 * Tenta extrair secao pelo contexto — olha linhas antes e depois do "keep" no diff.
 * @param {string} original
 * @param {string} diff
 * @param {string} keepComment
 * @returns {string|null}
 */
function extractSectionByContext(original, diff, keepComment) {
  const lines = diff.split('\n');
  const keepLineIndex = lines.findIndex(l => l.includes(keepComment));
  if (keepLineIndex < 0) return null;

  // Pega a linha antes e depois do keep no diff
  const lineBefore = (lines[keepLineIndex - 1] || '').trim();
  const lineAfter = (lines[keepLineIndex + 1] || '').trim();

  if (!lineBefore && !lineAfter) return null;

  const originalLines = original.split('\n');

  // Encontra posicao da linha antes no original
  let startIdx = -1;
  let endIdx = -1;

  if (lineBefore) {
    startIdx = originalLines.findIndex(l => l.trim() === lineBefore);
  }
  if (lineAfter) {
    endIdx = originalLines.findIndex((l, i) => i > startIdx && l.trim() === lineAfter);
  }

  if (startIdx >= 0 && endIdx > startIdx) {
    // Extrai tudo entre a linha antes e a linha depois
    return originalLines.slice(startIdx + 1, endIdx).join('\n');
  }

  return null;
}

/**
 * Extrai secao pela posicao relativa (inicio, meio, fim do arquivo).
 * Ultimo recurso antes de chamar Modelo 2.
 * @param {string} original
 * @param {string} diff
 * @param {string} keepComment
 * @returns {string|null}
 */
function extractByPosition(original, diff, keepComment) {
  const diffLines = diff.split('\n');
  const keepIdx = diffLines.findIndex(l => l.includes(keepComment));
  const totalDiffLines = diffLines.length;

  if (keepIdx < 0 || totalDiffLines === 0) return null;

  const position = keepIdx / totalDiffLines; // 0.0 = inicio, 1.0 = fim
  const originalLines = original.split('\n');
  const totalOrigLines = originalLines.length;

  // Estima a posicao correspondente no original
  const startLine = Math.floor(position * totalOrigLines);

  // Pega a proxima linha real do diff (depois do keep)
  const nextRealLine = diffLines.slice(keepIdx + 1).find(l => l.trim().length > 0);

  if (nextRealLine) {
    // Encontra onde essa linha aparece no original
    const endLine = originalLines.findIndex((l, i) => i >= startLine && l.trim() === nextRealLine.trim());
    if (endLine > startLine) {
      return originalLines.slice(startLine, endLine).join('\n');
    }
  }

  return null;
}
