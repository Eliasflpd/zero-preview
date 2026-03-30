/**
 * MECANISMO 6 — Orquestrador Central de Geracao
 *
 * Une todos os mecanismos em um fluxo unico e robusto:
 * 1. Carrega contexto do projeto (Mecanismo 4)
 * 2. Injeta system prompt de engenharia (Mecanismo 1)
 * 3. Chama AI e parseia output (Mecanismo 3)
 * 4. Valida e escreve arquivos no WebContainer
 * 5. Captura erros do preview (Mecanismo 2)
 * 6. Retry com escalada de estrategia (Mecanismo 5)
 *
 * Maximo 3 tentativas. Se todas falharem, reporta ao usuario.
 */

import { ENGINEERING_SYSTEM_PROMPT } from './engineeringPrompt';
import { errorCapture } from './errorCapture';
import { parseAIOutput, sortFilesByDependency, validateFileContent, removeDuplicateConsts, replaceInlineFormatters } from './patchEngine';
import { projectContext } from './projectContext';
import { retryEngine } from './retryEngine';

/**
 * @typedef {Object} GenerationCallbacks
 * @property {(message: string) => void} onStatusUpdate
 * @property {(filename: string) => void} onFileWritten
 * @property {(error: string) => void} onError
 * @property {(files: string[]) => void} onComplete
 */

/**
 * @typedef {Object} GenerationResult
 * @property {boolean} success
 * @property {string[]} filesWritten
 * @property {number} attempts
 * @property {string} [finalError]
 */

/**
 * Orquestrador principal de geracao.
 * Implementa o fluxo completo: geracao -> validacao -> escrita -> retry se necessario.
 *
 * @param {Object} params
 * @param {string} params.userPrompt - Pedido do usuario
 * @param {string} params.projectId - ID do projeto ativo
 * @param {Object} params.webContainerInstance - Instancia do WebContainer
 * @param {GenerationCallbacks} params.callbacks
 * @param {(systemPrompt: string, userPrompt: string) => Promise<string>} callAI - Funcao de chamada ao AI
 * @returns {Promise<GenerationResult>}
 */
export async function orchestrateGeneration(params, callAI) {
  const { userPrompt, projectId, webContainerInstance, callbacks } = params;
  const { onStatusUpdate, onFileWritten, onError, onComplete } = callbacks;

  // Carrega contexto do projeto
  projectContext.load(projectId);
  retryEngine.reset();
  errorCapture.clearErrors();

  const writtenFiles = [];
  let success = false;

  // Inicia captura de erros do preview
  errorCapture.startListening();

  while (retryEngine.shouldRetry() && !success) {
    retryEngine.incrementAttempt();
    const { attempt } = retryEngine.getAttemptInfo();

    // Status para o usuario
    if (attempt === 1) {
      onStatusUpdate('Gerando codigo...');
    } else {
      onStatusUpdate(retryEngine.getStatusMessage());
    }

    try {
      // Monta system prompt completo (Mecanismo 1 + Mecanismo 4)
      const fullSystemPrompt = [
        ENGINEERING_SYSTEM_PROMPT,
        projectContext.buildContextBlock(),
      ].join('\n\n');

      // Monta user prompt (com retry se necessario — Mecanismo 5)
      const fullUserPrompt = attempt > 1
        ? retryEngine.buildRetryPrompt(userPrompt)
        : userPrompt;

      // Chama o AI
      const rawOutput = await callAI(fullSystemPrompt, fullUserPrompt);

      if (!rawOutput || rawOutput.trim().length < 20) {
        onError('O AI retornou uma resposta vazia ou muito curta.');
        continue;
      }

      // Parseia o output (Mecanismo 3)
      onStatusUpdate('Processando arquivos gerados...');
      const parsed = parseAIOutput(rawOutput);

      if (parsed.files.length === 0) {
        onError('O AI nao gerou nenhum arquivo. Tente reformular o pedido.');
        continue;
      }

      // Ordena por dependencia
      const sortedFiles = sortFilesByDependency(parsed.files);

      // Sanitiza: substitui formatters inline + remove duplicatas em .ts/.tsx
      for (const file of sortedFiles) {
        if (/\.(tsx?|jsx?)$/.test(file.filename)) {
          file.content = removeDuplicateConsts(replaceInlineFormatters(file.content));
        }
      }

      // Valida e escreve cada arquivo
      let allValid = true;
      for (const file of sortedFiles) {
        const validation = validateFileContent(file.filename, file.content);

        if (!validation.valid) {
          onStatusUpdate(`Problema em ${file.filename}: ${validation.issues.join(', ')}`);
          allValid = false;
          projectContext.addError(`${file.filename}: ${validation.issues.join(', ')}`);
          continue;
        }

        // Escreve no WebContainer
        if (webContainerInstance) {
          await writeFileToWC(webContainerInstance, file.filename, file.content);
        }

        writtenFiles.push(file.filename);
        projectContext.addGeneratedFile(file.filename);
        onFileWritten(file.filename);
      }

      // Executa comandos shell se houver (ex: npm install)
      if (webContainerInstance && parsed.shellCommands.length > 0) {
        for (const cmd of parsed.shellCommands) {
          if (cmd.startsWith('npm install') || cmd.startsWith('yarn add') || cmd.startsWith('npx ')) {
            onStatusUpdate(`Instalando: ${cmd}`);
            await runInWC(webContainerInstance, cmd);

            // Registra pacotes instalados no contexto
            const packages = cmd.replace(/^(npm install|yarn add)\s+/, '').split(/\s+/);
            packages.forEach(pkg => {
              if (pkg && !pkg.startsWith('-')) {
                projectContext.addPackage(pkg);
              }
            });
          }
        }
      }

      // Aguarda o preview carregar e verifica erros (Mecanismo 2)
      await wait(2000);
      const capturedErrors = errorCapture.getRecentErrors(3);

      if (capturedErrors.length === 0 && allValid) {
        success = true;
        projectContext.clearErrors();
        projectContext.save(projectId);
        onStatusUpdate('Geracao concluida com sucesso!');
        onComplete(writtenFiles);
      } else if (capturedErrors.length > 0) {
        const errorSummary = capturedErrors.map(e => e.message).join('; ');
        onStatusUpdate(`Erro detectado: ${errorSummary.substring(0, 120)}`);
        projectContext.addError(errorSummary);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError(`Erro na geracao: ${message}`);

      if (!retryEngine.shouldRetry()) {
        break;
      }
    }
  }

  if (!success && writtenFiles.length === 0) {
    onError(
      `Nao foi possivel gerar o codigo sem erros apos ${retryEngine.getAttemptInfo().attempt} tentativas. ` +
      'Tente simplificar o pedido ou dividir em partes menores.'
    );
  }

  return {
    success,
    filesWritten: writtenFiles,
    attempts: retryEngine.getAttemptInfo().attempt,
    finalError: success ? undefined : 'Maximo de tentativas atingido',
  };
}

// --- Helpers ---

/**
 * Escreve arquivo no WebContainer, criando diretorios se necessario.
 * @param {Object} instance
 * @param {string} filename
 * @param {string} content
 */
async function writeFileToWC(instance, filename, content) {
  // Garante que os diretorios existem
  const parts = filename.split('/');
  if (parts.length > 1) {
    const dir = parts.slice(0, -1).join('/');
    try {
      await instance.fs.mkdir(dir, { recursive: true });
    } catch {
      // Diretorio ja existe — ok
    }
  }
  await instance.fs.writeFile(filename, content);
}

/**
 * Executa comando no WebContainer.
 * @param {Object} instance
 * @param {string} command
 */
async function runInWC(instance, command) {
  const parts = command.split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);
  try {
    const process = await instance.spawn(cmd, args);
    await process.exit;
  } catch {
    // Comando falhou — nao bloqueia o fluxo
  }
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
