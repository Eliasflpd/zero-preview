/**
 * MECANISMO 5 — Retry Inteligente com Escalada de Estrategia
 *
 * Sistema de retry que escala a profundidade de analise a cada tentativa:
 * 1. direct-fix: correcao direta do erro
 * 2. deep-analysis: analise de causa raiz com 4 hipoteses
 * 3. surgical-rewrite: reescrita completa do modulo problematico
 *
 * Elimina o loop infinito de erros limitando a 3 tentativas
 * com estrategia diferente em cada uma.
 */

import { errorCapture } from './errorCapture';
import { buildErrorRecoveryPrompt } from './engineeringPrompt';

/** @typedef {'direct-fix' | 'deep-analysis' | 'surgical-rewrite'} RetryStrategy */

const STRATEGY_MESSAGES = {
  'direct-fix': 'Corrigindo o erro detectado...',
  'deep-analysis': 'Analisando a causa raiz do problema...',
  'surgical-rewrite': 'Aplicando correcao cirurgica no modulo problematico...',
};

class RetryEngine {
  constructor() {
    /** @type {number} */
    this._attempt = 0;
    /** @type {number} */
    this._maxAttempts = 3;
    /** @type {RetryStrategy} */
    this._strategy = 'direct-fix';
  }

  /**
   * Reseta o estado do retry para nova geracao.
   */
  reset() {
    this._attempt = 0;
    this._strategy = 'direct-fix';
    errorCapture.clearErrors();
  }

  /**
   * Verifica se ainda ha tentativas disponiveis.
   * @returns {boolean}
   */
  shouldRetry() {
    return this._attempt < this._maxAttempts;
  }

  /**
   * Incrementa tentativa e atualiza estrategia.
   */
  incrementAttempt() {
    this._attempt++;
    if (this._attempt === 1) {
      this._strategy = 'direct-fix';
    } else if (this._attempt === 2) {
      this._strategy = 'deep-analysis';
    } else {
      this._strategy = 'surgical-rewrite';
    }
  }

  /**
   * Constroi o prompt de retry baseado nos erros capturados e na tentativa atual.
   * @param {string} originalUserRequest - Pedido original do usuario
   * @returns {string}
   */
  buildRetryPrompt(originalUserRequest) {
    const errors = errorCapture.getRecentErrors(3);
    const errorMessage = errors.map(e => e.message).join('\n');
    const errorStack = errors.map(e => e.stack || '').filter(Boolean).join('\n');

    const recoveryInstructions = buildErrorRecoveryPrompt(
      errorMessage || 'Erro desconhecido',
      errorStack,
      this._attempt
    );

    return `${recoveryInstructions}

PEDIDO ORIGINAL DO USUARIO:
"${originalUserRequest}"

Por favor, corrija o codigo para que este pedido funcione sem erros.`;
  }

  /**
   * Retorna info sobre a tentativa atual.
   * @returns {{ attempt: number, strategy: RetryStrategy, hasMoreAttempts: boolean }}
   */
  getAttemptInfo() {
    return {
      attempt: this._attempt,
      strategy: this._strategy,
      hasMoreAttempts: this.shouldRetry(),
    };
  }

  /**
   * Mensagem de status para o usuario durante o retry.
   * @returns {string}
   */
  getStatusMessage() {
    return STRATEGY_MESSAGES[this._strategy] || 'Processando...';
  }

  /**
   * Retorna o numero maximo de tentativas.
   * @returns {number}
   */
  getMaxAttempts() {
    return this._maxAttempts;
  }
}

export const retryEngine = new RetryEngine();
