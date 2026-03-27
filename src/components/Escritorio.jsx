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

// WhatsApp colors
const WA = {
  header: "#075E54",
  headerLight: "#128C7E",
  bg: "#0B141A",
  bgPattern: "#0A1014",
  balloonLeft: "#202C33",
  balloonRight: "#005C4B",
  balloonSystem: "#182229",
  inputBg: "#2A3942",
  inputBorder: "#3B4A54",
  text: "#E9EDEF",
  textDim: "#8696A0",
  textTime: "#8696A0",
  green: "#25D366",
  check: "#53BDEB",
  tabActive: "#00A884",
  tabBg: "#111B21",
  unread: "#25D366",
};

const AVATARS = {
  "Elias":     { cor: "#3B82F6", letra: "E" },
  "Claude.ai": { cor: "#F59E0B", letra: "C" },
  "Code":      { cor: "#22C55E", letra: "<>" },
  "Claudin":   { cor: "#8B5CF6", letra: "Q" },
  "Sistema":   { cor: "#6B7280", letra: "S" },
};

function detectarMencoes(texto) {
  return {
    claude: /@claude\b/i.test(texto),
    code: /@code\b/i.test(texto),
    claudin: /@claudin\b/i.test(texto),
    todos: /@todos\b/i.test(texto),
  };
}

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

function Avatar({ remetente, size = 32 }) {
  const a = AVATARS[remetente] || { cor: WA.textDim, letra: "?" };
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: a.cor,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: "#fff",
      flexShrink: 0, fontFamily: "system-ui, sans-serif",
    }}>
      {a.letra}
    </div>
  );
}

function TextoComMencoes({ texto }) {
  const parts = texto.split(/(@(?:claude|code|claudin|todos))/gi);
  return (
    <span>
      {parts.map((part, i) => {
        if (/^@claude$/i.test(part)) return <span key={i} style={{ color: "#F59E0B", fontWeight: 600 }}>{part}</span>;
        if (/^@code$/i.test(part)) return <span key={i} style={{ color: "#25D366", fontWeight: 600 }}>{part}</span>;
        if (/^@claudin$/i.test(part)) return <span key={i} style={{ color: "#A78BFA", fontWeight: 600 }}>{part}</span>;
        if (/^@todos$/i.test(part)) return <span key={i} style={{ color: "#F87171", fontWeight: 600 }}>{part}</span>;
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function Balao({ msg, onEnviarParaClaude }) {
  const isElias = msg.de === "Elias";
  const isSistema = msg.de === "Sistema";
  const time = new Date(msg.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const cor = AVATARS[msg.de]?.cor || WA.textDim;
  const [hovered, setHovered] = useState(false);

  if (isSistema) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
        <div style={{
          background: WA.balloonSystem, borderRadius: 8, padding: "4px 12px",
          fontSize: 11, color: WA.textDim, maxWidth: "85%", textAlign: "center",
        }}>
          {msg.texto}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex", justifyContent: isElias ? "flex-end" : "flex-start",
        padding: "2px 0", gap: 6, alignItems: "flex-end",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isElias && <Avatar remetente={msg.de} size={28} />}
      <div style={{
        position: "relative",
        background: isElias ? WA.balloonRight : WA.balloonLeft,
        borderRadius: isElias ? "8px 0 8px 8px" : "0 8px 8px 8px",
        padding: "6px 10px 18px 10px", maxWidth: "78%", minWidth: 80,
      }}>
        {!isElias && (
          <div style={{ fontSize: 11, fontWeight: 600, color: cor, marginBottom: 2 }}>
            {msg.de}
            {msg.para && <span style={{ color: WA.textDim, fontWeight: 400 }}> {"\u2192"} {msg.para}</span>}
          </div>
        )}
        {/* Conteudo: imagem, documento, codigo ou texto */}
        {msg.tipo === "imagem" && msg.dados?.src ? (
          <div>
            <img src={msg.dados.src} alt={msg.dados.nome || "imagem"} style={{
              maxWidth: 200, maxHeight: 200, borderRadius: 6, display: "block", marginBottom: 2,
            }} />
            <span style={{ fontSize: 10, color: WA.textDim }}>{msg.dados.nome}</span>
          </div>
        ) : msg.tipo === "documento" && msg.dados ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <span style={{ fontSize: 28 }}>{"\uD83D\uDCC4"}</span>
            <div>
              <div style={{ fontSize: 12, color: WA.text, fontWeight: 500 }}>{msg.dados.nome}</div>
              <div style={{ fontSize: 10, color: WA.textDim }}>{msg.dados.tamanho}</div>
            </div>
          </div>
        ) : msg.tipo === "codigo" && msg.dados?.code ? (
          <pre style={{
            background: "#1E1E1E", borderRadius: 6, padding: "8px 10px",
            fontSize: 11, color: "#D4D4D4", fontFamily: "'Fira Code', 'Consolas', monospace",
            lineHeight: 1.4, overflowX: "auto", maxHeight: 200, whiteSpace: "pre-wrap",
            margin: 0,
          }}>{msg.dados.code}</pre>
        ) : (
          <div style={{ fontSize: 13, color: WA.text, lineHeight: 1.45, wordBreak: "break-word" }}>
            <TextoComMencoes texto={msg.texto} />
          </div>
        )}
        <div style={{
          position: "absolute", bottom: 4, right: 8,
          display: "flex", alignItems: "center", gap: 3,
        }}>
          <span style={{ fontSize: 10, color: WA.textTime }}>{time}</span>
          {isElias && <span style={{ fontSize: 11, color: WA.check }}>{"\u2713\u2713"}</span>}
        </div>

        {hovered && !isSistema && (
          <button
            onClick={() => onEnviarParaClaude?.(msg.texto)}
            style={{
              position: "absolute", top: -8, right: isElias ? "auto" : -8, left: isElias ? -8 : "auto",
              width: 24, height: 24, borderRadius: "50%", border: "none",
              background: "#F59E0B", color: "#fff", fontSize: 11,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
            }}
            title="Perguntar ao Claude.ai"
          >{"\uD83E\uDD16"}</button>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", padding: "2px 0" }}>
      <Avatar remetente="Claude.ai" size={28} />
      <div style={{
        background: WA.balloonLeft, borderRadius: "0 8px 8px 8px",
        padding: "10px 14px", display: "flex", gap: 4, alignItems: "center",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: WA.textDim,
            animation: `typingBounce 1.4s infinite ${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

function DateSeparator({ date }) {
  const d = new Date(date);
  const hoje = new Date();
  const label = d.toDateString() === hoje.toDateString() ? "Hoje"
    : d.toDateString() === new Date(hoje.getTime() - 86400000).toDateString() ? "Ontem"
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
      <span style={{
        background: WA.balloonSystem, borderRadius: 8, padding: "3px 12px",
        fontSize: 11, color: WA.textDim,
      }}>{label}</span>
    </div>
  );
}

export default function Escritorio() {
  const [canal, setCanal] = useState("geral");
  const [mensagens, setMensagens] = useState(loadLocal);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState({});
  const scrollRef = useRef(null);
  const [claudeDigitando, setClaudeDigitando] = useState(false);
  const [claudeResposta, setClaudeResposta] = useState("");
  const chatInputRef = useRef(null);
  const [showAttach, setShowAttach] = useState(false);
  const imgInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [codeModal, setCodeModal] = useState(false);
  const [codeText, setCodeText] = useState("");

  const msgs = mensagens[canal] || [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs.length, canal, claudeDigitando]);

  useEffect(() => { setUnread(prev => ({ ...prev, [canal]: 0 })); }, [canal, msgs.length]);

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

  const montarContexto = useCallback(() => {
    const todas = [];
    for (const c of ["geral", "code", "qa"]) {
      const ms = mensagens[c] || [];
      for (const m of ms.slice(-MAX_CONTEXTO_MSGS)) todas.push({ ...m, canal: c });
    }
    todas.sort((a, b) => a.at - b.at);
    const recentes = todas.slice(-MAX_CONTEXTO_MSGS);
    if (recentes.length === 0) return "";
    return recentes.map(m => `[#${m.canal}] ${m.de}${m.para ? ` > ${m.para}` : ""}: ${m.texto}`).join("\n");
  }, [mensagens]);

  const chamarClaude = useCallback(async (prompt, canalDest) => {
    setClaudeDigitando(true);
    setClaudeResposta("");
    setEscritorioMode(true);
    let fullText = "";
    try {
      await callClaudeStream(ESCRITORIO_SYSTEM, prompt, 2000, (chunk) => {
        fullText += chunk;
        setClaudeResposta(fullText);
      });
      if (fullText && fullText.length > 5) adicionarMensagem("Claude.ai", fullText, canalDest);
    } catch {
      try {
        const resp = await callClaude(ESCRITORIO_SYSTEM, prompt, 2000);
        if (resp && resp.length > 5) { setClaudeResposta(resp); adicionarMensagem("Claude.ai", resp, canalDest); }
      } catch (e2) { adicionarMensagem("Sistema", `Erro: ${e2.message}`, canalDest); }
    } finally {
      setEscritorioMode(false);
      setClaudeDigitando(false);
      setTimeout(() => setClaudeResposta(""), 3000);
    }
  }, [adicionarMensagem]);

  const acionarCode = useCallback(async (prompt) => {
    adicionarMensagem("Code", "Recebi! Executando tarefa...", canal, "Elias");
    navigator.clipboard?.writeText(prompt).catch(() => {});

    try {
      const result = await callClaudeAgent(prompt, {}, (s) => adicionarMensagem("Code", `Agent: ${s}`, canal));

      // Detectar resposta vazia / 0 iteracoes
      if (!result?.files || result.iterations === 0 || Object.keys(result.files || {}).length === 0) {
        throw new Error("EMPTY_AGENT");
      }

      const n = Object.keys(result.files).length;
      adicionarMensagem("Code", `Concluido! ${n} arquivo(s), ${result.iterations} iteracoes, ${result.tokens} tokens.`, canal, "Elias");
    } catch (err) {
      // Fallback: tentar via callClaude direto (usa fallback providers no backend)
      const isQuota = /429|quota|EMPTY_AGENT|AGENT_UNAVAILABLE/i.test(err.message);

      if (isQuota) {
        adicionarMensagem("Code", "Agent com quota esgotada. Tentando via provider alternativo...", canal, "Elias");
        try {
          setEscritorioMode(true);
          const resp = await callClaude(
            "Voce e um dev React+TypeScript+Tailwind. Execute a tarefa e retorne APENAS o codigo. Sem markdown.",
            prompt,
            8000
          );
          setEscritorioMode(false);
          if (resp && resp.length > 50) {
            adicionarMensagem("Code", `Tarefa executada via fallback (${resp.length} chars). Codigo gerado com sucesso.`, canal, "Elias");
          } else {
            throw new Error("vazio");
          }
        } catch {
          setEscritorioMode(false);
          adicionarMensagem("Code", `Quota esgotada ate Apr 1 \u2014 execute manualmente: "${prompt.slice(0, 120)}..."`, canal, "Elias");
        }
      } else {
        adicionarMensagem("Code", `Agent indisponivel. Cole no terminal: "${prompt.slice(0, 100)}..."`, canal, "Elias");
      }
    }
  }, [canal, adicionarMensagem]);

  const acionarClaudin = useCallback(async (prompt) => {
    adicionarMensagem("Claudin", "Iniciando testes...", canal, "Elias");
    const key = getLicenseKey();
    if (!key) { adicionarMensagem("Claudin", "Sem licenca.", canal, "Elias"); return; }

    // Tentar ate 2x (segunda com header x-preferred-provider diferente)
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      try {
        const headers = { "Content-Type": "application/json", "x-license-key": key };
        if (tentativa > 0) {
          headers["x-preferred-provider"] = "groq"; // Fallback para Groq na segunda tentativa
          adicionarMensagem("Claudin", "Testando com provider alternativo...", canal, "Elias");
        }

        const res = await fetch(`${API_BASE}/escritorio/testar`, {
          method: "POST", headers,
          body: JSON.stringify({ tarefa: prompt, canal }),
        });

        // Se 429 e primeira tentativa, tenta de novo
        if (res.status === 429 && tentativa === 0) continue;
        if (!res.ok) throw new Error(`${res.status}`);

        const d = await res.json();
        const erros = (d.erros || []).length > 0 ? ` | Erros: ${d.erros.join(", ")}` : "";
        adicionarMensagem("Claudin", `Score: ${d.score}/100 | ${d.lineCount} linhas | ${d.provider}${erros}`, canal, "Elias");
        return; // Sucesso, sair do loop
      } catch (e) {
        if (tentativa === 1 || !/429/.test(e.message)) {
          adicionarMensagem("Claudin", `Teste falhou apos ${tentativa + 1} tentativa(s). Execute manualmente.`, canal, "Elias");
          return;
        }
        // 429 na primeira tentativa — continua pro retry
      }
    }
  }, [canal, adicionarMensagem]);

  const enviar = useCallback(() => {
    const texto = input.trim();
    if (!texto) return;
    adicionarMensagem("Elias", texto, canal);
    setInput("");
    if (canal === "claude") {
      const ctx = montarContexto();
      chamarClaude(ctx ? `Historico:\n${ctx}\n\nElias: ${texto}` : texto, "claude");
      return;
    }
    const m = detectarMencoes(texto);
    const p = limparMencao(texto);
    if (m.todos) { chamarClaude(p, canal); acionarCode(p); acionarClaudin(p); return; }
    if (m.claude) chamarClaude(p, canal);
    if (m.code) acionarCode(p);
    if (m.claudin) acionarClaudin(p);
  }, [input, canal, adicionarMensagem, chamarClaude, montarContexto, acionarCode, acionarClaudin]);

  const preencherChat = (texto) => { setInput(`@Claude ${texto}`); chatInputRef.current?.focus(); };

  // Polling
  useEffect(() => {
    const key = getLicenseKey();
    if (!key) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/escritorio/mensagens?canal=${canal}&limit=50`, { headers: { "x-license-key": key } });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const remote = data.reverse().map(m => ({ de: m.sender, texto: m.message, at: new Date(m.created_at).getTime(), para: m.recipient || null }));
          if (remote.length > (mensagens[canal] || []).length) {
            setMensagens(prev => { const u = { ...prev, [canal]: remote }; saveLocal(u); return u; });
          }
        }
      } catch {}
    };
    const iv = setInterval(poll, POLL_INTERVAL);
    poll();
    return () => clearInterval(iv);
  }, [canal]);

  useEffect(() => {
    window.__escritorio = { enviar: (de, texto, cd = "geral", para = null) => adicionarMensagem(de, texto, cd, para) };
    return () => { delete window.__escritorio; };
  }, [adicionarMensagem]);

  useEffect(() => {
    if (!sessionStorage.getItem(WELCOMED_KEY)) {
      sessionStorage.setItem(WELCOMED_KEY, "1");
      setTimeout(() => adicionarMensagem("Sistema", "Escritorio aberto \u2014 use @Claude, @Code, @Claudin ou @todos", "geral"), 500);
    }
  }, [adicionarMensagem]);

  // Agrupar mensagens por data
  const msgsComData = [];
  let lastDate = "";
  for (const msg of msgs) {
    const d = new Date(msg.at).toDateString();
    if (d !== lastDate) { msgsComData.push({ type: "date", date: msg.at }); lastDate = d; }
    msgsComData.push({ type: "msg", msg });
  }

  const handleAttach = (tipo) => {
    setShowAttach(false);
    if (tipo === "imagem") imgInputRef.current?.click();
    else if (tipo === "documento") docInputRef.current?.click();
    else if (tipo === "codigo") setCodeModal(true);
  };

  const handleImagem = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      adicionarMensagem("Elias", `[imagem] ${file.name}`, canal, null);
      // Adicionar mensagem com dados de imagem
      setMensagens(prev => {
        const arr = prev[canal] || [];
        const last = arr[arr.length - 1];
        if (last && last.de === "Elias" && last.texto.startsWith("[imagem]")) {
          arr[arr.length - 1] = { ...last, tipo: "imagem", dados: { src: reader.result, nome: file.name } };
        }
        const updated = { ...prev, [canal]: [...arr] };
        saveLocal(updated);
        return updated;
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDocumento = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kb = (file.size / 1024).toFixed(1);
    adicionarMensagem("Elias", `[documento] ${file.name}`, canal, null);
    setMensagens(prev => {
      const arr = prev[canal] || [];
      const last = arr[arr.length - 1];
      if (last && last.de === "Elias" && last.texto.startsWith("[documento]")) {
        arr[arr.length - 1] = { ...last, tipo: "documento", dados: { nome: file.name, tamanho: `${kb} KB` } };
      }
      const updated = { ...prev, [canal]: [...arr] };
      saveLocal(updated);
      return updated;
    });
    e.target.value = "";
  };

  const handleCodigoConfirm = () => {
    if (!codeText.trim()) return;
    adicionarMensagem("Elias", `[codigo]`, canal, null);
    setMensagens(prev => {
      const arr = prev[canal] || [];
      const last = arr[arr.length - 1];
      if (last && last.de === "Elias" && last.texto === "[codigo]") {
        arr[arr.length - 1] = { ...last, tipo: "codigo", dados: { code: codeText.slice(0, 5000) } };
      }
      const updated = { ...prev, [canal]: [...arr] };
      saveLocal(updated);
      return updated;
    });
    setCodeText("");
    setCodeModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: WA.bg, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header WhatsApp */}
      <div style={{
        background: WA.header, padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <Avatar remetente="Sistema" size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Zero Preview</div>
          <div style={{ fontSize: 11, color: "#ffffff90" }}>Elias, Claude.ai, Code, Claudin</div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: WA.green }} />
      </div>

      {/* Tabs de canal */}
      <div style={{
        display: "flex", background: WA.tabBg, borderBottom: `1px solid ${WA.inputBorder}`,
      }}>
        {CANAIS.map(c => {
          const count = unread[c] || 0;
          const active = canal === c;
          return (
            <button key={c} onClick={() => setCanal(c)} style={{
              flex: 1, padding: "8px 4px", border: "none", cursor: "pointer",
              background: "transparent",
              borderBottom: active ? `2px solid ${WA.tabActive}` : "2px solid transparent",
              color: active ? WA.tabActive : WA.textDim,
              fontSize: 11, fontWeight: active ? 700 : 500,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              fontFamily: "inherit",
            }}>
              {c === "claude" ? "\uD83E\uDD16" : "#"} {c}
              {count > 0 && !active && (
                <span style={{
                  background: WA.unread, color: "#000", fontSize: 9,
                  fontWeight: 800, borderRadius: 10, padding: "1px 5px", minWidth: 16, textAlign: "center",
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", padding: "8px 10px",
        display: "flex", flexDirection: "column", gap: 1, minHeight: 0,
        backgroundImage: `radial-gradient(circle at 20% 80%, ${WA.bgPattern} 0%, transparent 50%)`,
      }}>
        {msgsComData.length === 0 && (
          <div style={{ fontSize: 12, color: WA.textDim, textAlign: "center", padding: 30 }}>
            Nenhuma mensagem em #{canal}
          </div>
        )}
        {msgsComData.map((item, i) =>
          item.type === "date"
            ? <DateSeparator key={`d${i}`} date={item.date} />
            : <Balao key={i} msg={item.msg} onEnviarParaClaude={preencherChat} />
        )}
        {claudeDigitando && <TypingIndicator />}
      </div>

      {/* Input WhatsApp */}
      <div style={{
        display: "flex", gap: 6, padding: "6px 8px", alignItems: "flex-end",
        background: WA.tabBg,
      }}>
        {/* Clip button */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowAttach(s => !s)} style={{
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: "transparent", color: WA.textDim, fontSize: 18,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>{"\uD83D\uDCCE"}</button>
          {showAttach && (
            <div style={{
              position: "absolute", bottom: 42, left: 0,
              background: WA.balloonLeft, borderRadius: 8, padding: 4,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)", minWidth: 150,
            }}>
              {[
                { icon: "\uD83D\uDCF7", label: "Imagem", tipo: "imagem" },
                { icon: "\uD83D\uDCC4", label: "Documento", tipo: "documento" },
                { icon: "\uD83D\uDCCB", label: "Colar codigo", tipo: "codigo" },
              ].map(a => (
                <button key={a.tipo} onClick={() => handleAttach(a.tipo)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                  width: "100%", border: "none", background: "transparent",
                  color: WA.text, fontSize: 12, cursor: "pointer", borderRadius: 4,
                  fontFamily: "inherit",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = WA.inputBg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 16 }}>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <input
          ref={chatInputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder={canal === "claude" ? "Fale com Claude.ai..." : `Mensagem em #${canal}`}
          disabled={claudeDigitando}
          style={{
            flex: 1, padding: "9px 14px", borderRadius: 20,
            background: WA.inputBg, color: WA.text,
            border: "none", fontSize: 13, outline: "none",
            fontFamily: "inherit",
            opacity: claudeDigitando ? 0.5 : 1,
          }}
        />

        {/* Send button */}
        <button onClick={enviar} disabled={!input.trim() || claudeDigitando} style={{
          width: 36, height: 36, borderRadius: "50%", border: "none",
          background: input.trim() && !claudeDigitando ? WA.tabActive : WA.inputBg,
          color: "#fff", fontSize: 16, cursor: input.trim() && !claudeDigitando ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s",
        }}>
          {input.trim() ? "\u27A4" : "\uD83C\uDFA4"}
        </button>
      </div>

      {/* Hidden file inputs */}
      <input ref={imgInputRef} type="file" accept="image/*" hidden onChange={handleImagem} />
      <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv,.json" hidden onChange={handleDocumento} />

      {/* Modal de codigo */}
      {codeModal && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
        }}>
          <div style={{
            background: WA.balloonLeft, borderRadius: 12, padding: 16,
            width: "90%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: WA.text }}>Colar codigo</span>
              <button onClick={() => { setCodeModal(false); setCodeText(""); }} style={{
                background: "none", border: "none", color: WA.textDim, fontSize: 16, cursor: "pointer",
              }}>{"\u2715"}</button>
            </div>
            <textarea
              value={codeText}
              onChange={e => setCodeText(e.target.value)}
              placeholder="Cole seu codigo aqui..."
              autoFocus
              style={{
                width: "100%", height: 160, padding: 10, borderRadius: 8,
                background: "#1E1E1E", color: "#D4D4D4", border: `1px solid ${WA.inputBorder}`,
                fontSize: 12, fontFamily: "'Fira Code', 'Consolas', monospace",
                resize: "none", outline: "none",
              }}
            />
            <button onClick={handleCodigoConfirm} disabled={!codeText.trim()} style={{
              padding: "8px 0", borderRadius: 8, border: "none",
              background: codeText.trim() ? WA.tabActive : WA.inputBg,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: codeText.trim() ? "pointer" : "default",
            }}>
              Enviar codigo
            </button>
          </div>
        </div>
      )}

      {/* Animacao typing */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
