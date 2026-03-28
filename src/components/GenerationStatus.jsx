/**
 * MECANISMO 7 — Indicador Visual de Status e Erros
 *
 * O usuario ve exatamente o que esta acontecendo durante a geracao.
 * Transparencia total no processo: tentativas, erros, correcoes.
 *
 * Usa o design system da plataforma (theme.js) com CSS inline.
 */

import { useState, useEffect, memo } from 'react';
import { C, DM, MONO, EASE, SHADOW } from '../config/theme';

/**
 * @typedef {Object} StatusMessage
 * @property {string} id
 * @property {string} message
 * @property {'info' | 'success' | 'error' | 'warning'} type
 * @property {number} timestamp
 */

/**
 * @param {Object} props
 * @param {boolean} props.isGenerating
 * @param {number} props.attempt
 * @param {number} props.maxAttempts
 * @param {StatusMessage[]} props.messages
 * @param {() => void} [props.onDismiss]
 */
function GenerationStatusInner({ isGenerating, attempt, maxAttempts, messages, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isGenerating || messages.length > 0) {
      setVisible(true);
    }
  }, [isGenerating, messages.length]);

  if (!visible) return null;

  const lastMessage = messages[messages.length - 1];
  const hasError = lastMessage?.type === 'error';
  const isRetrying = attempt > 1;

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  // Auto-dismiss apos 5s se concluiu com sucesso
  useEffect(() => {
    if (!isGenerating && !hasError && messages.length > 0) {
      const timer = setTimeout(handleDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, hasError, messages.length]);

  const typeColors = {
    success: C.success,
    error: C.error,
    warning: C.warning,
    info: C.info,
  };

  const typeIcons = {
    success: '\u2713',
    error: '\u2717',
    warning: '\u26A0',
    info: '\u00B7',
  };

  const dotColor = isGenerating ? C.info : hasError ? C.error : C.success;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
      width: 340,
      borderRadius: 14,
      border: `1px solid ${C.border}`,
      background: C.surface,
      boxShadow: SHADOW.lg,
      overflow: 'hidden',
      fontFamily: DM,
      transition: `opacity 0.3s ${EASE.out}, transform 0.3s ${EASE.out}`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            animation: isGenerating ? 'zeroPulse 1.5s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: C.textSub,
            letterSpacing: '0.02em',
          }}>
            {isGenerating ? 'Gerando...' : hasError ? 'Erro' : 'Concluido'}
          </span>
          {isRetrying && (
            <span style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 20,
              background: C.warningDim,
              color: C.warning,
              fontWeight: 600,
            }}>
              Tentativa {attempt}/{maxAttempts}
            </span>
          )}
        </div>
        {!isGenerating && (
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: C.textDim,
              cursor: 'pointer',
              fontSize: 14,
              padding: '2px 6px',
              borderRadius: 4,
              transition: `color 0.2s ${EASE.smooth}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.textDim; }}
          >
            \u2715
          </button>
        )}
      </div>

      {/* Retry progress bar */}
      {isRetrying && (
        <div style={{ height: 2, background: C.bg }}>
          <div style={{
            height: '100%',
            background: C.warning,
            transition: `width 0.5s ${EASE.out}`,
            width: `${(attempt / maxAttempts) * 100}%`,
          }} />
        </div>
      )}

      {/* Messages */}
      <div style={{
        padding: '12px 16px',
        maxHeight: 200,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        {messages.slice(-6).map((msg) => (
          <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{
              fontSize: 11,
              marginTop: 1,
              color: typeColors[msg.type] || C.textMuted,
              flexShrink: 0,
            }}>
              {typeIcons[msg.type] || '\u00B7'}
            </span>
            <p style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: typeColors[msg.type] || C.textMuted,
              margin: 0,
              fontFamily: msg.type === 'error' ? MONO : DM,
              wordBreak: 'break-word',
            }}>
              {msg.message}
            </p>
          </div>
        ))}

        {isGenerating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
            <LoadingDots />
            <span style={{ fontSize: 11, color: C.textDim }}>processando...</span>
          </div>
        )}
      </div>

      {/* Inject pulse animation */}
      <style>{`
        @keyframes zeroPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes zeroBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

/**
 * Dots de loading animados.
 */
function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: C.info,
            animation: `zeroBounce 1s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export const GenerationStatus = memo(GenerationStatusInner);
