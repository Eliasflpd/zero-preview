/**
 * MECANISMO 2 — Captura de Erros do WebContainer
 *
 * Intercepta TODOS os erros do preview em tempo real:
 * - console.error do iframe
 * - window.onerror (runtime errors)
 * - unhandledrejection (promises)
 * - Build errors do terminal do WebContainer
 *
 * Os erros capturados alimentam o retry engine para correcao automatica.
 */

/** @typedef {'console-error' | 'unhandled-rejection' | 'syntax-error' | 'runtime-error' | 'build-error'} ErrorType */

/**
 * @typedef {Object} CapturedError
 * @property {ErrorType} type
 * @property {string} message
 * @property {string} [stack]
 * @property {string} [filename]
 * @property {number} [line]
 * @property {number} [column]
 * @property {number} timestamp
 */

const BUILD_ERROR_PATTERNS = [
  /error:/i,
  /Error:/,
  /Cannot find module/,
  /Module not found/,
  /SyntaxError/,
  /TypeError/,
  /ReferenceError/,
  /failed to compile/i,
  /Build failed/i,
  /\u2718 \[ERROR\]/,
  /ENOENT/,
];

class ErrorCapture {
  constructor() {
    /** @type {CapturedError[]} */
    this._errors = [];
    /** @type {((error: CapturedError) => void)[]} */
    this._listeners = [];
    /** @type {((event: MessageEvent) => void) | null} */
    this._messageHandler = null;
  }

  /**
   * Intercepta saida do terminal do WebContainer (build errors, npm errors).
   * Chamar isso com cada linha de output do terminal.
   * @param {string} output
   */
  interceptTerminalOutput(output) {
    const isError = BUILD_ERROR_PATTERNS.some(pattern => pattern.test(output));
    if (isError) {
      this._capture({
        type: 'build-error',
        message: output,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Retorna script para injetar no iframe do preview.
   * Captura console.error, window.onerror e unhandledrejection
   * e envia via postMessage para o parent.
   * @returns {string}
   */
  getInjectionScript() {
    return `
      (function() {
        if (window.__ZERO_ERROR_CAPTURE__) return;
        window.__ZERO_ERROR_CAPTURE__ = true;

        var originalConsoleError = console.error.bind(console);
        console.error = function() {
          var args = Array.prototype.slice.call(arguments);
          originalConsoleError.apply(console, args);
          window.parent.postMessage({
            type: 'ZERO_PREVIEW_ERROR',
            errorType: 'console-error',
            message: args.map(function(a) {
              return typeof a === 'object' ? JSON.stringify(a) : String(a);
            }).join(' '),
            timestamp: Date.now()
          }, '*');
        };

        window.addEventListener('error', function(event) {
          window.parent.postMessage({
            type: 'ZERO_PREVIEW_ERROR',
            errorType: 'runtime-error',
            message: event.message || 'Unknown runtime error',
            stack: event.error ? event.error.stack || '' : '',
            filename: event.filename || '',
            line: event.lineno || 0,
            column: event.colno || 0,
            timestamp: Date.now()
          }, '*');
        });

        window.addEventListener('unhandledrejection', function(event) {
          var reason = event.reason || {};
          window.parent.postMessage({
            type: 'ZERO_PREVIEW_ERROR',
            errorType: 'unhandled-rejection',
            message: String(reason.message || reason),
            stack: reason.stack || '',
            timestamp: Date.now()
          }, '*');
        });
      })();
    `;
  }

  /**
   * Comeca a escutar mensagens do iframe de preview.
   * Chamar UMA VEZ na inicializacao do app.
   */
  startListening() {
    // Evita listeners duplicados
    if (this._messageHandler) return;

    this._messageHandler = (event) => {
      if (event.data && event.data.type === 'ZERO_PREVIEW_ERROR') {
        this._capture({
          type: event.data.errorType || 'runtime-error',
          message: event.data.message || 'Unknown error',
          stack: event.data.stack,
          filename: event.data.filename,
          line: event.data.line,
          column: event.data.column,
          timestamp: event.data.timestamp || Date.now(),
        });
      }
    };

    window.addEventListener('message', this._messageHandler);
  }

  /**
   * Para de escutar mensagens. Cleanup para evitar memory leak.
   */
  stopListening() {
    if (this._messageHandler) {
      window.removeEventListener('message', this._messageHandler);
      this._messageHandler = null;
    }
  }

  /**
   * @param {CapturedError} error
   * @private
   */
  _capture(error) {
    this._errors.push(error);
    // Limita a 50 erros para nao estourar memoria
    if (this._errors.length > 50) {
      this._errors = this._errors.slice(-30);
    }
    this._listeners.forEach(fn => fn(error));
  }

  /**
   * Registra callback para novos erros.
   * @param {(error: CapturedError) => void} callback
   * @returns {() => void} Funcao de cleanup
   */
  onError(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(fn => fn !== callback);
    };
  }

  /**
   * Retorna os N erros mais recentes.
   * @param {number} [count=5]
   * @returns {CapturedError[]}
   */
  getRecentErrors(count = 5) {
    return this._errors.slice(-count);
  }

  /**
   * Formata erros recentes para enviar ao AI como contexto de retry.
   * @returns {string}
   */
  formatErrorsForAI() {
    const recent = this.getRecentErrors(3);
    if (recent.length === 0) return '';

    const formatted = recent.map((err, i) => {
      const parts = [`[ERRO ${i + 1}] Tipo: ${err.type}`, `Mensagem: ${err.message}`];
      if (err.filename) parts.push(`Arquivo: ${err.filename}`);
      if (err.line) parts.push(`Linha: ${err.line}`);
      if (err.stack) parts.push(`Stack:\n${err.stack}`);
      return parts.join('\n');
    });

    return `\nERROS CAPTURADOS DO PREVIEW:\n${formatted.join('\n---\n')}\n`;
  }

  /**
   * Limpa todos os erros capturados.
   */
  clearErrors() {
    this._errors = [];
  }

  /**
   * Retorna true se ha erros capturados.
   * @returns {boolean}
   */
  hasErrors() {
    return this._errors.length > 0;
  }
}

export const errorCapture = new ErrorCapture();
