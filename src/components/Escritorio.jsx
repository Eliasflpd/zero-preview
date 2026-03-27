import { useState, useEffect, useRef, useCallback } from "react";
import { C, DM, R, EASE } from "../config/theme";
import { callClaude, callClaudeStream, callClaudeAgent, setEscritorioMode } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "https://zero-backend-production-7b37.up.railway.app";
const LS_KEY = "zp_escritorio";
const CANAIS = ["geral", "code", "qa", "claude"];
const MAX_CONTEXTO_MSGS = 20;
const POLL_INTERVAL = 3000;
const WELCOMED_KEY = "zp_escritorio_welcomed";

const ESCRITORIO_SYSTEM = `Voce e Claude.ai trabalhando no projeto Zero Preview — plataforma que gera apps React+TypeScript+Tailwind com IA.

Contexto do projeto:
- 12 agentes: VELOCISTA, SOMMELIER, ARQUITETO, EXECUTOR, CRITICO, REVIEWER, MEMORIALISTA, SPLITTER, COMPACT, CLAUDE AGENT, RETRY SIMPLE, KNOWLEDGE
- Stack: Vite + React + TypeScript (frontend) + Node.js Railway (backend)
- Deploy: Vercel (zero-preview-six.vercel.app) + Railway (zero-backend-production-7b37.up.railway.app)
- 11 providers de IA com fallback automatico (Claude, DeepSeek, Gemini, Groq, Cerebras, SambaNova, Mistral, HuggingFace, Scaleway, Cloudflare)
- Repos: Eliasflpd/zero-preview e Eliasflpd/zero-backend
- CSS Enforcer converte hex hardcoded automaticamente
- Limite de 400 linhas por arquivo gerado
- 20 nichos brasileiros suportados

Voce esta no Escritorio — canal de comunicacao entre Elias (dono), Claude.ai (voce), Code (Claude Code CLI) e Claudin (QA tester).
Responda de forma direta e tecnica sobre o projeto. Maximo 3 paragrafos. Em portugues.`;

const AVATARS = {
  "Elias":     { cor: "#3B82F6", letra: "E" },
  "Claude.ai": { cor: "#F59E0B", letra: "C" },
  "Code":      { cor: "#22C55E", letra: "<>" },
  "Claudin":   { cor: "#8B5CF6", letra: "Q" },
  "Sistema":   { cor: "#6B7280", letra: "S" },
};

// Detectar mencoes no texto
function detectarMencoes(texto) {
  const lower = texto.toLowerCase();
  return {
    claude: /@claude\b/i.test(texto),
    code: /@code\b/i.test(texto),
    claudin: /@claudin\b/i.test(texto),
    todos: /@todos\b/i.test(texto),
  };
}

// Limpar mencao do texto para enviar ao Claude
function limparMencao(texto) {
  return texto.replace(/@(claude|code|claudin|todos)\b/gi, "").trim();
}

function getLicenseKey() {
  try { return JSON.parse(localStorage.getItem("zp_license")) || ""; } catch { return ""; }
}

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}

function saveLocal(msgs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(msgs)); } catch {}
}

function Avatar({ remetente, size = 28 }) {
  const a = AVATARS[remetente] || { cor: C.textDim, letra: "?" };
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: a.cor,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: "#fff", fontFamily: DM,
      flexShrink: 0,
    }}>
      {a.letra}
    </div>
  );
}

// Renderizar texto com mencoes destacadas
function TextoComMencoes({ texto }) {
  const parts = texto.split(/(@(?:claude|code|claudin|todos))/gi);
  return (
    <span>
      {parts.map((part, i) => {
        if (/^@claude$/i.test(part)) return <span key={i} style={{ color: "#F59E0B", fontWeight: 700 }}>{part}</span>;
        if (/^@code$/i.test(part)) return <span key={i} style={{ color: "#22C55E", fontWeight: 700 }}>{part}</span>;
        if (/^@claudin$/i.test(part)) return <span key={i} style={{ color: "#8B5CF6", fontWeight: 700 }}>{part}</span>;
        if (/^@todos$/i.test(part)) return <span key={i} style={{ color: "#EF4444", fontWeight: 700 }}>{part}</span>;
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function Mensagem({ msg, onEnviarParaClaude }) {
  const time = new Date(msg.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const deCor = AVATARS[msg.de]?.cor || C.text;
  const paraCor = msg.para ? (AVATARS[msg.para]?.cor || C.textDim) : null;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ display: "flex", gap: 8, padding: "6px 0", position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Avatar remetente={msg.de} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: deCor, fontFamily: DM }}>{msg.de}</span>
          {msg.para && (
            <>
              <span style={{ fontSize: 9, color: C.textDim }}>{"\u2192"}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, color: paraCor, fontFamily: DM,
                background: `${paraCor}15`, padding: "1px 6px", borderRadius: R.full,
              }}>{msg.para}</span>
            </>
          )}
          <span style={{ fontSize: 9, color: C.textDim }}>{time}</span>
        </div>
        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4, wordBreak: "break-word" }}>
          <TextoComMencoes texto={msg.texto} />
        </div>
      </div>
      {hovered && msg.de !== "Sistema" && (
        <button
          onClick={() => onEnviarParaClaude?.(msg.texto)}
          title="Perguntar ao Claude.ai sobre esta mensagem"
          style={{
            position: "absolute", right: 0, top: 4,
            padding: "3px 8px", borderRadius: R.sm, border: "none",
            background: "#F59E0B", color: "#fff",
            fontSize: 9, fontWeight: 700, fontFamily: DM,
            cursor: "pointer",
          }}
        >
          {"\uD83E\uDD16"} Claude.ai
        </button>
      )}
    </div>
  );
}

export default function Escritorio() {
  const [canal, setCanal] = useState("geral");
  const [mensagens, setMensagens] = useState(loadLocal);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState({});
  const scrollRef = useRef(null);

  // Claude streaming state
  const [claudeDigitando, setClaudeDigitando] = useState(false);
  const [claudeResposta, setClaudeResposta] = useState("");
  const chatInputRef = useRef(null);

  const msgs = mensagens[canal] || [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs.length, canal, claudeDigitando]);

  useEffect(() => {
    setUnread(prev => ({ ...prev, [canal]: 0 }));
  }, [canal, msgs.length]);

  const adicionarMensagem = useCallback((de, texto, canalDest = "geral", para = null) => {
    const nova = { de, texto, at: Date.now(), para };
    setMensagens(prev => {
      const updated = { ...prev, [canalDest]: [...(prev[canalDest] || []), nova] };
      saveLocal(updated);
      return updated;
    });
    const key = getLicenseKey();
    if (key) {
      fetch(`${API_BASE}/escritorio/mensagem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-license-key": key },
        body: JSON.stringify({ de, texto, canal: canalDest, para }),
      }).catch(() => {});
    }
    if (canalDest !== canal) {
      setUnread(prev => ({ ...prev, [canalDest]: (prev[canalDest] || 0) + 1 }));
    }
  }, [canal]);

  // Chamar Claude via API e postar resposta no canal
  // Montar contexto do historico de todos os canais para o #claude
  const montarContexto = useCallback(() => {
    const todas = [];
    for (const c of ["geral", "code", "qa"]) {
      const msgs = mensagens[c] || [];
      for (const m of msgs.slice(-MAX_CONTEXTO_MSGS)) {
        todas.push({ ...m, canal: c });
      }
    }
    // Ordenar por timestamp
    todas.sort((a, b) => a.at - b.at);
    // Pegar ultimas MAX_CONTEXTO_MSGS
    const recentes = todas.slice(-MAX_CONTEXTO_MSGS);
    if (recentes.length === 0) return "";
    return recentes.map(m => `[#${m.canal}] ${m.de}${m.para ? ` → ${m.para}` : ""}: ${m.texto}`).join("\n");
  }, [mensagens]);

  const chamarClaude = useCallback(async (prompt, canalDest) => {
    setClaudeDigitando(true);
    setClaudeResposta("");
    setEscritorioMode(true);
    let fullText = "";
    try {
      await callClaudeStream(
        ESCRITORIO_SYSTEM,
        prompt,
        2000,
        (chunk) => {
          fullText += chunk;
          setClaudeResposta(fullText);
        }
      );
      // Postar resposta completa no canal
      if (fullText && fullText.length > 5) {
        adicionarMensagem("Claude.ai", fullText, canalDest);
      }
    } catch (err) {
      // Fallback non-streaming
      try {
        const resposta = await callClaude(
          ESCRITORIO_SYSTEM,
          prompt,
          2000
        );
        if (resposta && resposta.length > 5) {
          setClaudeResposta(resposta);
          adicionarMensagem("Claude.ai", resposta, canalDest);
        }
      } catch (err2) {
        adicionarMensagem("Sistema", `Erro ao chamar Claude: ${err2.message}`, canalDest);
      }
    } finally {
      setEscritorioMode(false);
      setClaudeDigitando(false);
      setTimeout(() => setClaudeResposta(""), 3000);
    }
  }, [adicionarMensagem]);

  // Acionar Code: tenta claude-agent, fallback clipboard
  const acionarCode = useCallback(async (prompt) => {
    adicionarMensagem("Code", "Recebi! Executando tarefa...", canal, "Elias");
    navigator.clipboard?.writeText(prompt).catch(() => {});
    try {
      const result = await callClaudeAgent(prompt, {}, (status) => {
        adicionarMensagem("Code", `Agent: ${status}`, canal);
      });
      if (result?.files) {
        const fileCount = Object.keys(result.files).length;
        adicionarMensagem("Code", `Tarefa concluida! ${fileCount} arquivo(s) gerado(s) em ${result.iterations} iteracoes (${result.tokens} tokens).`, canal, "Elias");
      }
    } catch (err) {
      adicionarMensagem("Code", `Agent indisponivel. Cole no terminal: "${prompt.slice(0, 100)}..."`, canal, "Elias");
    }
  }, [canal, adicionarMensagem]);

  // Acionar Claudin: chama /escritorio/testar no backend
  const acionarClaudin = useCallback(async (prompt) => {
    adicionarMensagem("Claudin", "Iniciando testes...", canal, "Elias");
    const key = getLicenseKey();
    if (!key) {
      adicionarMensagem("Claudin", "Sem licenca — teste manual necessario.", canal, "Elias");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/escritorio/testar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-license-key": key },
        body: JSON.stringify({ tarefa: prompt, canal }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const erros = (data.erros || []).length > 0 ? `\nErros: ${data.erros.join(", ")}` : "";
      adicionarMensagem("Claudin", `Teste concluido! Score: ${data.score}/100 | ${data.lineCount} linhas | Provider: ${data.provider}${erros}`, canal, "Elias");
    } catch (err) {
      adicionarMensagem("Claudin", `Teste falhou: ${err.message}. Testar manualmente.`, canal, "Elias");
    }
  }, [canal, adicionarMensagem]);

  // Enviar mensagem com deteccao de mencoes
  // SEGURANCA: esta funcao so e chamada pelo input do Elias.
  // @Code e @Claudin so acionam aqui — nunca pela API publica.
  const enviar = useCallback(() => {
    const texto = input.trim();
    if (!texto) return;

    // Postar como Elias (unico remetente autorizado a acionar agentes)
    adicionarMensagem("Elias", texto, canal);
    setInput("");

    // Canal #claude: SEMPRE chama Claude com historico completo
    if (canal === "claude") {
      const contexto = montarContexto();
      const promptCompleto = contexto
        ? `Historico recente do Escritorio:\n${contexto}\n\nElias diz: ${texto}`
        : texto;
      chamarClaude(promptCompleto, "claude");
      return;
    }

    const mencoes = detectarMencoes(texto);
    const prompt = limparMencao(texto);

    if (mencoes.todos) {
      chamarClaude(prompt, canal);
      acionarCode(prompt);
      acionarClaudin(prompt);
      return;
    }

    if (mencoes.claude) {
      chamarClaude(prompt, canal);
    }

    if (mencoes.code) {
      acionarCode(prompt);
    }

    if (mencoes.claudin) {
      acionarClaudin(prompt);
    }
  }, [input, canal, adicionarMensagem, chamarClaude, montarContexto]);

  // Preencher input com mensagem + @Claude
  const preencherChat = (texto) => {
    setInput(`@Claude ${texto}`);
    chatInputRef.current?.focus();
  };

  // Polling backend
  useEffect(() => {
    const key = getLicenseKey();
    if (!key) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/escritorio/mensagens?canal=${canal}&limit=50`, {
          headers: { "x-license-key": key },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const remoteMsgs = data.reverse().map(m => ({
            de: m.sender, texto: m.message, at: new Date(m.created_at).getTime(),
            para: m.recipient || null,
          }));
          const localCount = (mensagens[canal] || []).length;
          if (remoteMsgs.length > localCount) {
            setMensagens(prev => {
              const updated = { ...prev, [canal]: remoteMsgs };
              saveLocal(updated);
              return updated;
            });
          }
        }
      } catch {}
    };
    const interval = setInterval(poll, POLL_INTERVAL);
    poll();
    return () => clearInterval(interval);
  }, [canal]);

  // API publica
  useEffect(() => {
    window.__escritorio = {
      // API publica: outros agentes postam mensagens, mas NAO acionam @Code/@Claudin
      // Somente enviar() (input do Elias) processa mencoes e aciona agentes
      enviar: (de, texto, canalDest = "geral", para = null) => {
        adicionarMensagem(de, texto, canalDest, para);
      },
    };
    return () => { delete window.__escritorio; };
  }, [adicionarMensagem]);

  // Boas vindas
  useEffect(() => {
    if (!sessionStorage.getItem(WELCOMED_KEY)) {
      sessionStorage.setItem(WELCOMED_KEY, "1");
      setTimeout(() => {
        adicionarMensagem("Sistema", "Escritorio aberto \u2014 use @Claude, @Code, @Claudin ou @todos para mencionar agentes.", "geral");
      }, 500);
    }
  }, [adicionarMensagem]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: DM }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, padding: "8px 12px", borderBottom: `1px solid ${C.border}` }}>
        {CANAIS.map(c => {
          const count = unread[c] || 0;
          return (
            <button key={c} onClick={() => setCanal(c)} style={{
              padding: "4px 12px", borderRadius: R.sm, fontSize: 11,
              fontWeight: canal === c ? 700 : 500, fontFamily: DM,
              background: canal === c ? C.surface2 : "transparent",
              color: canal === c ? C.text : C.textDim,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {c === "claude" ? "\uD83E\uDD16 claude" : `# ${c}`}
              {count > 0 && canal !== c && (
                <span style={{
                  background: "#EF4444", color: "#fff", fontSize: 9,
                  fontWeight: 700, borderRadius: R.full, padding: "1px 5px",
                  minWidth: 16, textAlign: "center",
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", padding: "8px 12px",
        display: "flex", flexDirection: "column", gap: 2, minHeight: 0,
      }}>
        {msgs.length === 0 && (
          <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", padding: 20 }}>
            Nenhuma mensagem em #{canal}
          </div>
        )}
        {msgs.map((msg, i) => <Mensagem key={i} msg={msg} onEnviarParaClaude={preencherChat} />)}
      </div>

      {/* Claude digitando (streaming visivel) */}
      {claudeDigitando && (
        <div style={{
          padding: "6px 12px", borderTop: `1px solid ${C.border}`,
          background: `${"#F59E0B"}08`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Avatar remetente="Claude.ai" size={18} />
            <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 700, fontFamily: DM }}>
              Claude esta digitando...
            </span>
          </div>
          {claudeResposta && (
            <div style={{
              fontSize: 11, color: C.text, lineHeight: 1.4,
              maxHeight: 60, overflowY: "auto", wordBreak: "break-word",
              padding: "4px 8px", borderRadius: R.sm,
              background: `${"#F59E0B"}10`, borderLeft: `3px solid #F59E0B`,
            }}>
              {claudeResposta}
            </div>
          )}
        </div>
      )}

      {/* Input unificado */}
      <div style={{
        display: "flex", gap: 6, padding: "8px 12px",
        borderTop: `1px solid ${C.border}`,
      }}>
        <input
          ref={chatInputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder={canal === "claude" ? "Fale com Claude.ai (historico completo incluso)..." : `#${canal} — use @Claude @Code @Claudin @todos`}
          disabled={claudeDigitando}
          style={{
            flex: 1, padding: "6px 10px", borderRadius: R.sm,
            background: C.surface2, color: C.text,
            border: `1px solid ${C.border}`, fontSize: 12,
            fontFamily: DM, outline: "none",
            opacity: claudeDigitando ? 0.5 : 1,
          }}
        />
        <button onClick={enviar} disabled={!input.trim() || claudeDigitando} style={{
          padding: "6px 14px", borderRadius: R.sm, border: "none",
          background: input.trim() && !claudeDigitando ? (C.accent || C.info) : C.surface2,
          color: input.trim() && !claudeDigitando ? "#fff" : C.textDim,
          fontSize: 11, fontWeight: 600, fontFamily: DM,
          cursor: input.trim() && !claudeDigitando ? "pointer" : "default",
        }}>
          Enviar
        </button>
      </div>
    </div>
  );
}
