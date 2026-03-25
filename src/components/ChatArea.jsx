import { useState, useRef, useEffect } from "react";
import { C, SYNE, DM } from "../config/theme";
import StreamingCode from "./StreamingCode";
import GenerationProgress from "./GenerationProgress";
import FeedbackForm from "./FeedbackForm";
import NextSteps from "./NextSteps";

const suggestions = [
  { text: "Dashboard para petshop com agendamento e graficos", category: "Dashboard" },
  { text: "Landing page para escritorio de advocacia com formulario de contato", category: "Landing Page" },
  { text: "Painel de vendas para e-commerce de roupas com KPIs e tabela de pedidos", category: "E-commerce" },
  { text: "Sistema de agendamento para clinica medica com calendario e pacientes", category: "Saude" },
  { text: "Dashboard financeiro com graficos de receita, despesa e fluxo de caixa", category: "Financeiro" },
  { text: "Cardapio digital para restaurante com categorias e carrinho de pedidos", category: "Restaurante" },
  { text: "Painel admin para academia com alunos, planos e frequencia", category: "Fitness" },
  { text: "Portfolio de fotografo com galeria, filtros e formulario de orcamento", category: "Criativo" },
];

export default function ChatArea({
  history, generating, streamingCode, error, thinkSteps,
  prompt, onPromptChange, onGenerate, onRetry,
  licenseInfo, hasPreview, disabled,
  onSuggestionClick,
}) {
  const historyEndRef = useRef();
  const [showFeedback, setShowFeedback] = useState(false);
  const prevHistoryLen = useRef(history.length);

  // Show feedback after first successful generation (not on every one)
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

  return (
    <div style={{ width: hasPreview ? 340 : "100%", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: hasPreview ? `1px solid ${C.border}` : "none", overflow: "hidden" }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: hasPreview ? "16px" : "0 20%", display: "flex", flexDirection: "column", justifyContent: history.length === 0 ? "center" : "flex-start", paddingTop: history.length === 0 ? 0 : 16 }}>

        {history.length === 0 && !generating && (
          <div style={{ textAlign: "center", padding: "0 0 32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 18 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.info, display: "inline-block" }} />
              <span style={{ fontSize: 11, color: C.info, fontWeight: 600 }}>Claude Sonnet &middot; React + Vite</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: SYNE, color: C.text, margin: "0 0 8px", letterSpacing: -1, background: `linear-gradient(135deg, ${C.text}, ${C.yellow})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              O que vamos construir?
            </h2>
            <p style={{ fontSize: 13, color: C.textMuted }}>Descreva seu app — a IA gera os arquivos React completos</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 520, margin: "20px auto 0", textAlign: "left" }}>
              {suggestions.map(s => (
                <button key={s.text} onClick={() => typeof onSuggestionClick === "function" && onSuggestionClick(s.text)} style={{
                  padding: "10px 14px", background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 10, fontSize: 11, color: C.textMuted, fontFamily: DM,
                  cursor: "pointer", textAlign: "left", lineHeight: 1.4,
                  transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.yellow; e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.surface2; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = C.surface; }}
                >
                  <span style={{ fontSize: 9, color: C.yellow, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.category}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((h, i) => (
          <div key={`hist_${h.at}_${i}`} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
              <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: "12px 12px 2px 12px", padding: "9px 13px", fontSize: 12, color: C.text, maxWidth: "88%", lineHeight: 1.6, fontFamily: DM, whiteSpace: "pre-wrap" }}>{h.prompt}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 20, height: 20, background: C.yellow, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: C.bg, fontFamily: SYNE }}>Z</span>
              </div>
              <div style={{ background: "rgba(255,208,80,0.06)", border: "1px solid rgba(255,208,80,0.15)", borderRadius: "2px 12px 12px 12px", padding: "7px 11px", fontSize: 11, color: C.yellow, fontFamily: DM, display: "flex", alignItems: "center", gap: 8 }}>
                App gerado com sucesso
                {h.score != null && (
                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, fontWeight: 700, background: h.score >= 70 ? "rgba(5,150,105,0.15)" : h.score >= 40 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)", color: h.score >= 70 ? C.success : h.score >= 40 ? "#F59E0B" : C.error }}>
                    {h.score}/100
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {showFeedback && !generating && history.length > 0 && (
          <FeedbackForm
            prompt={history[history.length - 1]?.prompt}
            score={history[history.length - 1]?.score}
            onClose={() => setShowFeedback(false)}
          />
        )}

        {!generating && hasPreview && history.length > 0 && (
          <NextSteps onSelect={onSuggestionClick} visible={true} />
        )}

        {(generating || (thinkSteps && thinkSteps.length > 0 && !hasPreview)) && (
          <GenerationProgress steps={thinkSteps || []} generating={generating} />
        )}

        {generating && streamingCode && <StreamingCode code={streamingCode} />}

        {error && (
          <div style={{ marginBottom: 12, padding: "12px 14px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: C.error, marginBottom: 8, lineHeight: 1.5 }}>{error}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => (onRetry || onGenerate)()} style={{ padding: "4px 12px", background: "rgba(248,113,113,0.1)", border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 6, fontSize: 10, color: C.error, cursor: "pointer", fontFamily: DM, fontWeight: 600 }}>
                Tentar novamente
              </button>
              {typeof onSuggestionClick === "function" && (
                <button onClick={() => onSuggestionClick("Dashboard simples para minha empresa")} style={{ padding: "4px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 10, color: C.textMuted, cursor: "pointer", fontFamily: DM }}>
                  Usar prompt simples
                </button>
              )}
            </div>
          </div>
        )}
        <div ref={historyEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "8px 16px 14px", flexShrink: 0 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <textarea
            value={prompt}
            onChange={e => onPromptChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onGenerate(); } }}
            disabled={disabled}
            placeholder={history.length === 0 ? "Descreva seu app..." : "Descreva uma alteracao..."}
            style={{ width: "100%", minHeight: 56, maxHeight: 140, padding: "13px 14px", background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 13, color: C.text, fontFamily: DM, lineHeight: 1.6, boxSizing: "border-box" }}
          />
          <div style={{ padding: "7px 10px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, gap: 8 }}>
            <span style={{ fontSize: 10, color: C.textDim }}>
              {licenseInfo?.tokens_used != null
                ? `${((licenseInfo.tokens_used / 1000) | 0)}k / ${((licenseInfo.tokens_limit / 1000) | 0)}k tokens`
                : "Claude Sonnet"}
            </span>
            <button onClick={onGenerate} disabled={disabled || !prompt.trim()} style={{ padding: "6px 14px", background: disabled || !prompt.trim() ? "rgba(255,208,80,0.2)" : C.yellow, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: DM, color: C.bg, cursor: disabled || !prompt.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              {generating
                ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>&#8635;</span>
                : "Gerar"}
            </button>
          </div>
        </div>
        {!prompt.trim() && (
          <p style={{ textAlign: "center", fontSize: 10, color: C.textDim, marginTop: 6, lineHeight: 1.4 }}>
            Dica: seja especifico! &lsquo;Dashboard para petshop com graficos de vendas&rsquo; funciona melhor que &lsquo;faz um app&rsquo;
          </p>
        )}
        {prompt.trim() && (
          <p style={{ textAlign: "center", fontSize: 10, color: C.textDim, marginTop: 6 }}>Enter para gerar &middot; Shift+Enter nova linha</p>
        )}
      </div>
    </div>
  );
}
