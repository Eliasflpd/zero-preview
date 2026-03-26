import { useState, useRef } from "react";
import { C, DM, R, EASE } from "../config/theme";
import Orchestrator from "../lib/orchestrator.js";

const STATUS_ICON = {
  concluido: "\u2705",
  executando: "\uD83D\uDD04",
  falhou: "\u274C",
  pendente: "\u23F3",
};

export default function OrchestratorPanel() {
  const [objetivo, setObjetivo] = useState("");
  const [rodando, setRodando] = useState(false);
  const [tarefas, setTarefas] = useState([]);
  const [log, setLog] = useState([]);
  const [relatorio, setRelatorio] = useState(null);
  const orcRef = useRef(null);

  const iniciar = async () => {
    if (!objetivo.trim()) return;

    setRodando(true);
    setTarefas([]);
    setLog([]);
    setRelatorio(null);

    orcRef.current = new Orchestrator((progresso) => {
      setLog((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString("pt-BR"),
          ...progresso,
        },
      ]);

      if (progresso.tarefas) setTarefas([...progresso.tarefas]);
      if (progresso.tarefaId) {
        setTarefas((prev) => prev.map((t) => (t.id === progresso.tarefaId ? { ...t, status: progresso.stage === "tarefa_concluida" ? "concluido" : progresso.stage === "tarefa_falhou" ? "falhou" : t.status } : t)));
      }
      if (progresso.relatorio) setRelatorio(progresso.relatorio);
      if (progresso.stage === "concluido" || progresso.stage === "erro") {
        setRodando(false);
      }
    });

    try {
      await orcRef.current.run(objetivo);
    } catch (err) {
      setLog((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString("pt-BR"),
          stage: "erro",
          message: err.message,
        },
      ]);
      setRodando(false);
    }
  };

  const parar = () => {
    orcRef.current?.parar();
    setRodando(false);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      padding: 16, gap: 14, fontFamily: DM,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{"\uD83C\uDFAF"}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Modo Orquestrador</span>
        <span style={{ fontSize: 10, color: C.textDim, marginLeft: "auto" }}>Fase 1</span>
      </div>

      {/* Input */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 11, color: C.textDim }}>Descreva o objetivo:</label>
        <textarea
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          placeholder="Ex: Gere um app de gestao de clientes com dashboard, tabela e graficos"
          disabled={rodando}
          style={{
            width: "100%", height: 80, padding: 10, borderRadius: R.sm,
            background: C.surface2, color: C.text, border: `1px solid ${C.border}`,
            resize: "none", fontSize: 12, fontFamily: DM,
            outline: "none",
          }}
        />
      </div>

      {/* Botoes */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={iniciar}
          disabled={rodando || !objetivo.trim()}
          style={{
            flex: 1, padding: "8px 0", borderRadius: R.sm, border: "none",
            background: C.accent || C.info, color: "#fff", fontSize: 12,
            fontWeight: 600, fontFamily: DM, cursor: rodando || !objetivo.trim() ? "default" : "pointer",
            opacity: rodando || !objetivo.trim() ? 0.4 : 1,
            transition: `opacity 0.15s ${EASE.out}`,
          }}
        >
          {rodando ? "\u23F3 Executando..." : "\u25B6 Iniciar"}
        </button>
        {rodando && (
          <button
            onClick={parar}
            style={{
              padding: "8px 14px", borderRadius: R.sm, fontSize: 12,
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.text, fontFamily: DM, cursor: "pointer",
            }}
          >
            {"\u23F9"} Parar
          </button>
        )}
      </div>

      {/* Tarefas */}
      {tarefas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1 }}>
            Tarefas
          </span>
          {tarefas.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 10px", borderRadius: R.xs,
                background: C.surface2, fontSize: 11,
              }}
            >
              <span>{STATUS_ICON[t.status] || STATUS_ICON.pendente}</span>
              <span style={{ color: C.textDim, width: 55, flexShrink: 0 }}>{t.agente}</span>
              <span style={{
                color: C.text, flex: 1, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {t.instrucao}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 3,
          flex: 1, overflowY: "auto", minHeight: 0,
        }}>
          <span style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1 }}>
            Log
          </span>
          {log.map((entry, i) => (
            <div key={i} style={{ display: "flex", gap: 6, fontSize: 10, color: C.textDim }}>
              <span style={{ opacity: 0.4 }}>{entry.time}</span>
              <span>{entry.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Relatorio */}
      {relatorio && (
        <div style={{
          padding: 10, borderRadius: R.sm,
          background: C.surface2, border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span>{"\uD83D\uDCCB"}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Relatorio Final</span>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
            <span style={{ color: C.textDim }}>
              Total: <strong style={{ color: C.text }}>{relatorio.total}</strong>
            </span>
            <span style={{ color: C.success || "#22c55e" }}>
              {"\u2705"} {relatorio.concluidas}
            </span>
            <span style={{ color: C.error || "#ef4444" }}>
              {"\u274C"} {relatorio.falharam}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
