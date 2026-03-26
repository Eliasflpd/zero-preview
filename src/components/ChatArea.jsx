import { useState, useRef, useEffect } from "react";
import { C, SYNE, DM, SHADOW, R, EASE } from "../config/theme";
import StreamingCode from "./StreamingCode";
import GenerationProgress from "./GenerationProgress";
import FeedbackForm from "./FeedbackForm";
import NextSteps from "./NextSteps";
import SlashMenu from "./SlashMenu";

const suggestions = [
  { text: "Dashboard para petshop com agendamento e graficos", category: "Dashboard", icon: "📊" },
  { text: "Landing page para escritorio de advocacia com formulario de contato", category: "Landing Page", icon: "🏢" },
  { text: "Painel de vendas para e-commerce de roupas com KPIs e tabela de pedidos", category: "E-commerce", icon: "🛒" },
  { text: "Sistema de agendamento para clinica medica com calendario e pacientes", category: "Saude", icon: "🏥" },
  { text: "Dashboard financeiro com graficos de receita, despesa e fluxo de caixa", category: "Financeiro", icon: "💰" },
  { text: "Cardapio digital para restaurante com categorias e carrinho de pedidos", category: "Restaurante", icon: "🍽️" },
  { text: "Painel admin para academia com alunos, planos e frequencia", category: "Fitness", icon: "💪" },
  { text: "Portfolio de fotografo com galeria, filtros e formulario de orcamento", category: "Criativo", icon: "📸" },
];

export default function ChatArea({
  history, generating, streamingCode, error, thinkSteps,
  prompt, onPromptChange, onGenerate, onRetry,
  licenseInfo, hasPreview, disabled,
  onSuggestionClick, onSlashCommand,
}) {
  const historyEndRef = useRef();
  const textareaRef = useRef();
  const [showFeedback, setShowFeedback] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [showSlash, setShowSlash] = useState(false);
  const prevHistoryLen = useRef(history.length);

  // Detect "/" at start of input for slash commands
  useEffect(() => {
    if (prompt.startsWith("/")) {
      const query = prompt.slice(1).split(/\s/)[0] || "";
      if (!prompt.includes(" ")) {
        setSlashQuery(query);
        setShowSlash(true);
        return;
      }
    }
    setShowSlash(false);
  }, [prompt]);

  useEffect(() => {
    if (history.length > prevHistoryLen.current && history.length === 1) {
      const lastFeedback = localStorage.getItem("zp_last_feedback");
      if (!lastFeedback || Date.now() - parseInt(lastFeedback) > 86400000) {
        setTimeout(() => setShowFeedback(true), 2000);
      }
    }
    prevHistoryLen.current = history.length;
  }, [history.length]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, generating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
  }, [prompt]);

  return (
    <div style={{
      width: hasPreview ? 360 : "100%", flexShrink: 0,
      display: "flex", flexDirection: "column",
      borderRight: hasPreview ? `1px solid ${C.border}` : "none",
      overflow: "hidden",
    }}>
      {/* Messages area */}
      <div className="scroll-fade" style={{
        flex: 1, overflowY: "auto", padding: hasPreview ? "16px" : "0 20%",
        display: "flex", flexDirection: "column",
        justifyContent: history.length === 0 ? "center" : "flex-start",
        paddingTop: history.length === 0 ? 0 : 20,
      }}>
        {/* Empty state */}
        {history.length === 0 && !generating && (
          <div style={{ textAlign: "center", padding: "0 0 32px" }}>
            {/* Status badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: C.infoDim, border: `1px solid rgba(96,165,250,0.12)`,
              borderRadius: R.full, padding: "5px 14px", marginBottom: 20,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.info }} />
              <span style={{ fontSize: 10, color: C.info, fontWeight: 600 }}>Claude Sonnet 4 &middot; React + TypeScript</span>
            </div>

            <h2 style={{
              fontSize: hasPreview ? 22 : 32, fontWeight: 800, fontFamily: SYNE,
              margin: "0 0 10px", letterSpacing: -1.2, lineHeight: 1.15,
              background: `linear-gradient(135deg, ${C.text} 30%, ${C.yellow})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              O que vamos construir?
            </h2>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, maxWidth: 360, margin: "0 auto" }}>
              Descreva seu app e a IA gera os arquivos React completos com preview ao vivo
            </p>

            {/* Spacer */}
            <div style={{ height: 8 }} />
          </div>
        )}

        {/* Chat history */}
        {history.map((h, i) => (
          <div key={`hist_${h.at}_${i}`} style={{ marginBottom: 16, animation: `fadeIn 0.3s ${EASE.out}` }}>
            {/* User message */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <div style={{
                background: C.surface2, border: `1px solid ${C.border}`,
                borderRadius: "14px 14px 4px 14px", padding: "10px 14px",
                fontSize: 12, color: C.text, maxWidth: "88%", lineHeight: 1.6,
                fontFamily: DM, whiteSpace: "pre-wrap",
              }}>
                {h.prompt}
              </div>
            </div>
            {/* AI response */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{
                width: 22, height: 22, flexShrink: 0,
                background: `linear-gradient(135deg, ${C.yellow}, #FFE088)`,
                borderRadius: R.xs, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 12px rgba(255,208,80,0.15)",
              }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: C.bg, fontFamily: SYNE }}>Z</span>
              </div>
              <div style={{
                background: C.yellowGlow2, border: `1px solid rgba(255,208,80,0.1)`,
                borderRadius: "4px 14px 14px 14px", padding: "8px 12px",
                fontSize: 11, color: C.yellow, fontFamily: DM,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                App gerado com sucesso
                {h.score != null && (
                  <span style={{
                    fontSize: 9, padding: "1px 7px", borderRadius: R.xs, fontWeight: 700,
                    background: h.score >= 70 ? C.successDim : h.score >= 40 ? C.warningDim : C.errorDim,
                    color: h.score >= 70 ? C.success : h.score >= 40 ? C.warning : C.error,
                  }}>
                    {h.score}/100
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {showFeedback && !generating && history.length > 0 && (
          <FeedbackForm prompt={history[history.length - 1]?.prompt} score={history[history.length - 1]?.score} onClose={() => setShowFeedback(false)} />
        )}

        {!generating && hasPreview && history.length > 0 && (
          <NextSteps onSelect={onSuggestionClick} visible={true} />
        )}

        {(generating || (thinkSteps && thinkSteps.length > 0 && !hasPreview)) && (
          <GenerationProgress steps={thinkSteps || []} generating={generating} />
        )}

        {generating && streamingCode && <StreamingCode code={streamingCode} />}

        {/* Error state */}
        {error && (
          <div style={{
            marginBottom: 12, padding: "12px 14px",
            background: C.errorDim, border: `1px solid rgba(248,113,113,0.15)`,
            borderRadius: R.md, animation: `fadeIn 0.3s ${EASE.out}`,
          }}>
            <div style={{
              fontSize: 11, color: C.error, marginBottom: 10, lineHeight: 1.6,
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.error, flexShrink: 0, marginTop: 5 }} />
              {error}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => (onRetry || onGenerate)()} style={{
                padding: "5px 14px", background: "rgba(248,113,113,0.08)",
                border: `1px solid rgba(248,113,113,0.2)`, borderRadius: R.sm,
                fontSize: 10, color: C.error, cursor: "pointer", fontFamily: DM, fontWeight: 600,
              }}>
                Tentar novamente
              </button>
              {typeof onSuggestionClick === "function" && (
                <button onClick={() => onSuggestionClick("Dashboard simples para minha empresa")} style={{
                  padding: "5px 14px", background: C.surface,
                  border: `1px solid ${C.border}`, borderRadius: R.sm,
                  fontSize: 10, color: C.textMuted, cursor: "pointer", fontFamily: DM,
                }}>
                  Usar prompt simples
                </button>
              )}
            </div>
          </div>
        )}
        <div ref={historyEndRef} />
      </div>

      {/* ─── INPUT AREA ─── */}
      <div style={{ padding: "8px 14px 14px", flexShrink: 0, position: "relative" }}>
        <SlashMenu
          query={slashQuery}
          visible={showSlash}
          onSelect={(cmd) => {
            setShowSlash(false);
            onPromptChange("");
            onSlashCommand?.(cmd.key);
          }}
          onClose={() => setShowSlash(false)}
          anchorRect={{ bottom: 70, left: 16 }}
        />
        <div style={{
          background: C.surface,
          border: `1px solid ${inputFocused ? C.borderHover : C.border}`,
          borderRadius: R.md, overflow: "hidden",
          boxShadow: inputFocused ? `0 0 0 3px ${C.yellowGlow2}` : "none",
          transition: `all 0.25s ${EASE.out}`,
        }}>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => onPromptChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onGenerate(); } }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            disabled={disabled}
            placeholder={history.length === 0 ? "Descreva seu app..." : "Descreva uma alteracao..."}
            rows={1}
            style={{
              width: "100%", minHeight: 48, maxHeight: 140,
              padding: "14px 16px", background: "transparent",
              border: "none", outline: "none", resize: "none",
              fontSize: 13, color: C.text, fontFamily: DM,
              lineHeight: 1.6, boxSizing: "border-box",
            }}
          />
          <div style={{
            padding: "6px 10px", borderTop: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: C.bg, gap: 8,
          }}>
            <span style={{ fontSize: 10, color: C.textDim }}>
              {licenseInfo?.tokens_used != null
                ? `${((licenseInfo.tokens_used / 1000) | 0)}k / ${((licenseInfo.tokens_limit / 1000) | 0)}k tokens`
                : "Claude Sonnet 4"
              }
            </span>
            <button onClick={onGenerate} disabled={disabled || !prompt.trim()} style={{
              padding: "7px 16px",
              background: disabled || !prompt.trim()
                ? "rgba(255,208,80,0.15)"
                : `linear-gradient(135deg, ${C.yellow}, #FFE088)`,
              border: "none", borderRadius: R.sm,
              fontSize: 12, fontWeight: 700, fontFamily: DM, color: C.bg,
              cursor: disabled || !prompt.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              boxShadow: !disabled && prompt.trim() ? "0 2px 8px rgba(255,208,80,0.2)" : "none",
              transition: `all 0.2s ${EASE.out}`,
            }}>
              {generating ? (
                <span style={{
                  width: 14, height: 14, border: "2px solid rgba(5,10,18,0.3)",
                  borderTopColor: C.bg, borderRadius: "50%",
                  animation: "spin 0.7s linear infinite", display: "inline-block",
                }} />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
              {generating ? "Gerando..." : "Gerar"}
            </button>
          </div>
        </div>
        <p style={{
          textAlign: "center", fontSize: 10, color: C.textDim,
          marginTop: 6, lineHeight: 1.4,
        }}>
          {prompt.trim()
            ? "Enter para gerar \u00B7 Shift+Enter nova linha"
            : "Dica: seja especifico — 'Dashboard para petshop com graficos' funciona melhor"
          }
        </p>
      </div>
    </div>
  );
}
