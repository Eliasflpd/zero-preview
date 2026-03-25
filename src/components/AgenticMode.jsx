import { useState, useRef, useEffect } from "react";
import { C, SYNE, DM } from "../config/theme";
import { AGENTIC_QUESTIONS, detectNicheFromMessage, buildBriefingPrompt } from "../config/agenticQuestions";

// ─── PHASES ──────────────────────────────────────────────────────────────────
const PHASES = {
  CHAT: "chat",           // Initial: user describes their business
  GATHERING: "gathering", // System asks smart questions
  GENERATING: "generating", // Pipeline running
  VERIFYING: "verifying",   // Score being calculated
  DONE: "done",            // Result ready
};

export default function AgenticMode({ onGenerate, generating, thinkSteps, hasPreview, score }) {
  const [phase, setPhase] = useState(PHASES.CHAT);
  const [messages, setMessages] = useState([
    { from: "system", text: "Me conta sobre seu negocio. Quanto mais detalhes, melhor o app que vou criar pra voce." }
  ]);
  const [input, setInput] = useState("");
  const [niche, setNiche] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [originalMessage, setOriginalMessage] = useState("");
  const endRef = useRef();
  const inputRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, [phase, currentQ]);

  // Track generation phases
  useEffect(() => {
    if (generating && phase === PHASES.GATHERING) setPhase(PHASES.GENERATING);
    if (!generating && phase === PHASES.GENERATING) setPhase(PHASES.VERIFYING);
    if (hasPreview && (phase === PHASES.VERIFYING || phase === PHASES.GENERATING)) {
      setTimeout(() => setPhase(PHASES.DONE), 1500);
    }
  }, [generating, hasPreview]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    if (phase === PHASES.CHAT) {
      // First message — detect niche and start questions
      setMessages(prev => [...prev, { from: "user", text }]);
      setOriginalMessage(text);
      const detected = detectNicheFromMessage(text);
      setNiche(detected);
      const qs = AGENTIC_QUESTIONS[detected] || AGENTIC_QUESTIONS.generic;
      setQuestions(qs);
      setPhase(PHASES.GATHERING);
      setCurrentQ(0);
      // Ask first question
      setTimeout(() => {
        setMessages(prev => [...prev, { from: "system", text: qs[0] }]);
      }, 500);

    } else if (phase === PHASES.GATHERING) {
      // Answer to a question
      const q = questions[currentQ];
      setMessages(prev => [...prev, { from: "user", text }]);
      setAnswers(prev => ({ ...prev, [q]: text }));

      const nextQ = currentQ + 1;
      if (nextQ < questions.length) {
        setCurrentQ(nextQ);
        setTimeout(() => {
          setMessages(prev => [...prev, { from: "system", text: questions[nextQ] }]);
        }, 500);
      } else {
        // All questions answered — build briefing and generate
        const allAnswers = { ...answers, [q]: text };
        const briefing = buildBriefingPrompt(niche, allAnswers, originalMessage);

        setTimeout(() => {
          setMessages(prev => [...prev, {
            from: "system",
            text: "Entendi seu negocio! Vou criar o app agora. Acompanhe o progresso abaixo."
          }]);
          onGenerate(briefing);
        }, 800);
      }
    }
  };

  // Phase indicator
  const PhaseBar = () => (
    <div style={{ display: "flex", gap: 4, padding: "8px 0", marginBottom: 8 }}>
      {[
        { id: PHASES.GATHERING, label: "Entender", n: "1" },
        { id: PHASES.GENERATING, label: "Criar", n: "2" },
        { id: PHASES.VERIFYING, label: "Validar", n: "3" },
      ].map(p => {
        const isActive = phase === p.id;
        const isDone = [PHASES.GATHERING, PHASES.GENERATING, PHASES.VERIFYING, PHASES.DONE].indexOf(phase)
          > [PHASES.GATHERING, PHASES.GENERATING, PHASES.VERIFYING, PHASES.DONE].indexOf(p.id);
        return (
          <div key={p.id} style={{
            flex: 1, padding: "6px 8px", borderRadius: 8, textAlign: "center",
            background: isActive ? "rgba(255,208,80,0.1)" : isDone ? "rgba(52,211,153,0.08)" : C.bg,
            border: `1px solid ${isActive ? "rgba(255,208,80,0.3)" : isDone ? "rgba(52,211,153,0.2)" : C.border}`,
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: isDone ? C.success : isActive ? C.yellow : C.textDim, letterSpacing: 0.5 }}>
              {isDone ? "v" : p.n}
            </div>
            <div style={{ fontSize: 10, color: isActive ? C.yellow : isDone ? C.success : C.textDim, fontWeight: 600, fontFamily: DM }}>
              {p.label}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {phase !== PHASES.CHAT && <PhaseBar />}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 8, padding: "0 4px" }}>
            {m.from === "system" && (
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 6, marginTop: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: C.bg, fontFamily: SYNE }}>Z</span>
              </div>
            )}
            <div style={{
              maxWidth: "85%", padding: "8px 12px", borderRadius: m.from === "user" ? "12px 12px 2px 12px" : "2px 12px 12px 12px",
              background: m.from === "user" ? C.surface2 : "rgba(255,208,80,0.06)",
              border: `1px solid ${m.from === "user" ? C.border : "rgba(255,208,80,0.15)"}`,
              fontSize: 12, color: m.from === "user" ? C.text : C.yellow, lineHeight: 1.5, fontFamily: DM,
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {/* Generation progress inside agentic mode */}
        {phase === PHASES.GENERATING && thinkSteps?.length > 0 && (
          <div style={{ padding: "8px 4px" }}>
            {thinkSteps.map((s, i) => (
              <div key={i} style={{ fontSize: 10, color: C.textMuted, padding: "2px 0", fontFamily: DM }}>
                {typeof s === "string" ? s : s?.message || ""}
              </div>
            ))}
          </div>
        )}

        {/* Score display */}
        {phase === PHASES.DONE && score != null && (
          <div style={{ padding: "12px 4px", textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: SYNE, color: score >= 70 ? C.success : score >= 40 ? C.yellow : C.error }}>
              {score}/100
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
              {score >= 70 ? "Excelente! Seu app esta pronto." : score >= 40 ? "Bom! Voce pode ajustar com prompts." : "Basico. Tente descrever com mais detalhes."}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input — hidden during generation */}
      {(phase === PHASES.CHAT || phase === PHASES.GATHERING) && (
        <div style={{ padding: "8px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") send(); }}
              placeholder={phase === PHASES.CHAT ? "Descreva seu negocio..." : "Sua resposta..."}
              style={{
                flex: 1, padding: "10px 14px", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 10,
                fontSize: 13, color: C.text, fontFamily: DM, outline: "none",
              }}
            />
            <button onClick={send} style={{
              padding: "0 16px", background: C.yellow, border: "none",
              borderRadius: 10, fontSize: 12, fontWeight: 700, color: C.bg,
              cursor: "pointer", fontFamily: DM, flexShrink: 0,
            }}>
              Enviar
            </button>
          </div>
        </div>
      )}

      {/* Done actions */}
      {phase === PHASES.DONE && (
        <div style={{ padding: "8px 0", display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => { setPhase(PHASES.CHAT); setMessages([{ from: "system", text: "Que bom! Quando quiser criar outro app, e so me contar." }]); }} style={{
            flex: 1, padding: "10px 0", background: C.success, border: "none",
            borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff",
            cursor: "pointer", fontFamily: DM,
          }}>
            Perfeito!
          </button>
          <button onClick={() => { setPhase(PHASES.CHAT); setMessages(prev => [...prev, { from: "system", text: "O que gostaria de ajustar?" }]); }} style={{
            flex: 1, padding: "10px 0", background: "transparent",
            border: `1px solid ${C.border}`, borderRadius: 10,
            fontSize: 12, fontWeight: 600, color: C.textMuted,
            cursor: "pointer", fontFamily: DM,
          }}>
            Ajustar algo
          </button>
        </div>
      )}
    </div>
  );
}
