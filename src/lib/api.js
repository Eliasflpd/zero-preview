// ─── ZERO PREVIEW — BACKEND API CLIENT ──────────────────────────────────────
// Todas as chamadas de IA passam pelo backend Railway via SSE streaming.
// Nenhuma API key é exposta no cliente.

import { validateSyntax } from "./syntaxValidator";

const API_BASE = import.meta.env.VITE_API_URL || "https://zero-backend-production-7b37.up.railway.app";

function getLicenseKey() {
  try { return JSON.parse(localStorage.getItem("zp_license")) || ""; } catch { return ""; }
}

// ─── STREAMING: CLAUDE VIA BACKEND SSE ───────────────────────────────────────
// onDelta(text) é chamada com cada pedaço de texto conforme chega
// Retorna o texto completo ao final
// Retry automatico: ate 2 tentativas, segunda com prompt simplificado

// Simplifica prompt removendo agentes/contexto extra para retry direto
function simplifyPrompt(prompt) {
  return prompt
    .replace(/BRIEFING:[\s\S]*?(?=\n\n|$)/i, "")
    .replace(/EXEMPLOS BEM-SUCEDIDOS:[\s\S]*?(?=\n\n|$)/i, "")
    .replace(/HISTORICO DO PROJETO[\s\S]*?(?=\n\n|$)/i, "")
    .replace(/CODIGO DE REFERENCIA[\s\S]*?(?=\n\n|$)/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function _singleStreamCall(systemPrompt, userPrompt, maxTokens, onDelta, timeoutMs) {
  const licenseKey = getLicenseKey();
  if (!licenseKey) throw new Error("Licenca nao configurada. Faca login com sua license key.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${API_BASE}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-license-key": licenseKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        stream: true,
      }),
    });
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === "AbortError") throw new Error("STREAM_TIMEOUT");
    throw e;
  }

  clearTimeout(timeout);

  if (res.status === 401) throw new Error("LICENSE_INVALID");
  if (res.status === 403) throw new Error("LICENSE_EXPIRED");
  if (res.status === 429) throw new Error("RATE_LIMITED");

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
    throw new Error(err.error || `Erro do servidor: ${res.status}`);
  }

  // Read SSE stream with inactivity timeout (45s sem dados = abort)
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let lastChunkAt = Date.now();

  const inactivityLimit = 45000;

  while (true) {
    // Race: next chunk vs inactivity timeout
    const remaining = inactivityLimit - (Date.now() - lastChunkAt);
    if (remaining <= 0) {
      try { reader.cancel(); } catch {}
      throw new Error("STREAM_TIMEOUT");
    }

    const chunkPromise = reader.read();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("STREAM_TIMEOUT")), remaining)
    );

    let result;
    try {
      result = await Promise.race([chunkPromise, timeoutPromise]);
    } catch (e) {
      try { reader.cancel(); } catch {}
      throw e;
    }

    const { done, value } = result;
    if (done) break;
    lastChunkAt = Date.now();

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === "[DONE]") continue;

      try {
        const event = JSON.parse(raw);
        if (event.type === "delta" && event.text) {
          fullText += event.text;
          onDelta?.(event.text, fullText);
        } else if (event.type === "error") {
          throw new Error(event.error || "Erro no streaming");
        }
      } catch (e) {
        if (e.message.includes("Erro")) throw e;
      }
    }
  }

  if (!fullText) throw new Error("EMPTY_RESPONSE");
  return fullText;
}

export async function callClaudeStream(systemPrompt, userPrompt, maxTokens = 12000, onDelta, onRetryStatus) {
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isRetry = attempt > 0;
    const isLastRetry = attempt === MAX_RETRIES;

    // Na segunda tentativa: simplifica prompt e usa system prompt minimo
    const currentSystem = isLastRetry
      ? "Voce gera codigo React+TypeScript+Tailwind. Retorne APENAS codigo TSX. Sem markdown."
      : systemPrompt;
    const currentPrompt = isLastRetry ? simplifyPrompt(userPrompt) : userPrompt;

    // Timeout: 45s primeira, 60s retry, 90s ultimo
    const timeoutMs = isLastRetry ? 90000 : isRetry ? 60000 : 45000;

    try {
      if (isRetry) {
        onRetryStatus?.(`Tentando novamente (${attempt}/${MAX_RETRIES})...`);
        onDelta?.("", ""); // reset stream display
      }

      const fullText = await _singleStreamCall(currentSystem, currentPrompt, maxTokens, onDelta, timeoutMs);

      // Post-stream syntax check (early warning)
      try {
        const syntaxCheck = validateSyntax({ "streamed.tsx": fullText });
        if (!syntaxCheck.valid) {
          console.warn(`[SyntaxValidator] ${syntaxCheck.errors.length} erro(s) detectados no stream:`,
            syntaxCheck.errors.map(e => `L${e.line}: ${e.message}`));
        }
      } catch {}

      return fullText;

    } catch (e) {
      // Auth/license errors — never retry
      if (["LICENSE_INVALID", "LICENSE_EXPIRED", "RATE_LIMITED"].includes(e.message)) throw e;

      // Retryable errors: empty response, timeout
      const isRetryable = e.message === "EMPTY_RESPONSE" || e.message === "STREAM_TIMEOUT";

      if (isRetryable && !isLastRetry) {
        console.warn(`[callClaudeStream] Tentativa ${attempt + 1} falhou (${e.message}), retentando...`);
        continue;
      }

      // Last attempt failed — throw user-friendly error
      if (e.message === "EMPTY_RESPONSE") throw new Error("Resposta vazia do Claude apos multiplas tentativas.");
      if (e.message === "STREAM_TIMEOUT") throw new Error("A geracao demorou demais e foi cancelada. Tente um prompt mais simples.");
      throw e;
    }
  }
}

// ─── NON-STREAMING FALLBACK (for short calls like niche detection) ───────────
// Retry automatico: ate 1 retry em caso de resposta vazia
export async function callClaude(systemPrompt, userPrompt, maxTokens = 12000) {
  const licenseKey = getLicenseKey();
  if (!licenseKey) throw new Error("Licenca nao configurada. Faca login com sua license key.");

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    let res;
    try {
      res = await fetch(`${API_BASE}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-license-key": licenseKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === "AbortError" && attempt === 0) {
        console.warn("[callClaude] Timeout, retentando...");
        continue;
      }
      throw e;
    }

    clearTimeout(timeout);
    if (res.status === 401) throw new Error("LICENSE_INVALID");
    if (res.status === 403) throw new Error("LICENSE_EXPIRED");
    if (res.status === 429) throw new Error("RATE_LIMITED");

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
      throw new Error(err.error || `Erro do servidor: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text || "";
    if (!text && attempt === 0) {
      console.warn("[callClaude] Resposta vazia, retentando...");
      continue;
    }
    if (!text) throw new Error("Resposta vazia do Claude.");
    return text;
  }
}

// ─── VERIFICAR LICENÇA ───────────────────────────────────────────────────────
export async function checkLicense(licenseKey) {
  const res = await fetch(`${API_BASE}/license/status`, {
    headers: { "x-license-key": licenseKey },
  });

  if (!res.ok) return { valid: false };
  return res.json();
}

// ─── PROJECTS API ────────────────────────────────────────────────────────────
export async function listProjects() {
  const licenseKey = getLicenseKey();
  const res = await fetch(`${API_BASE}/projects`, {
    headers: { "x-license-key": licenseKey },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getProject(id) {
  const licenseKey = getLicenseKey();
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    headers: { "x-license-key": licenseKey },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function saveProject(project) {
  const licenseKey = getLicenseKey();
  const method = project.id ? "PUT" : "POST";
  const url = project.id ? `${API_BASE}/projects/${project.id}` : `${API_BASE}/projects`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-license-key": licenseKey,
    },
    body: JSON.stringify({
      name: project.name,
      files: project.files,
      last_prompt: project.lastPrompt || project.last_prompt || "",
      history: (project.history || []).slice(-10),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao salvar projeto");
  }
  return res.json();
}

export async function deleteProject(id) {
  const licenseKey = getLicenseKey();
  await fetch(`${API_BASE}/projects/${id}`, {
    method: "DELETE",
    headers: { "x-license-key": licenseKey },
  });
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
export async function fetchAdminDashboard(adminKey) {
  const res = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) return null;
  return res.json();
}

// ─── DISPARADOR ──────────────────────────────────────────────────────────────
export async function sendMessage(adminKey, from, to, message, type) {
  const res = await fetch(`${API_BASE}/disparador/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({ from, to, message, type }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getMessages(adminKey, recipient) {
  const url = recipient
    ? `${API_BASE}/disparador/messages?for=${recipient}&limit=50`
    : `${API_BASE}/disparador/messages?limit=50`;
  const res = await fetch(url, {
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function markRead(adminKey, ids) {
  await fetch(`${API_BASE}/disparador/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({ ids }),
  });
}

// ─── CLAUDE AGENT — autonomous tool-use loop ─────────────────────────────────
export async function callClaudeAgent(prompt, files, onProgress) {
  const licenseKey = getLicenseKey();
  if (!licenseKey) throw new Error("Licenca nao configurada.");

  onProgress?.("Agente Claude iniciando...");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300000); // 5min timeout

  const res = await fetch(`${API_BASE}/claude-agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-license-key": licenseKey,
    },
    signal: controller.signal,
    body: JSON.stringify({ prompt, files }),
  });

  clearTimeout(timeout);

  if (res.status === 503) throw new Error("AGENT_UNAVAILABLE");
  if (res.status === 401) throw new Error("LICENSE_INVALID");
  if (res.status === 403) throw new Error("LICENSE_EXPIRED");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro do agente: ${res.status}`);
  }

  const data = await res.json();
  onProgress?.(`Agente completou em ${data.iterations} iteracoes (${data.tokens} tokens)`);
  return data; // { files, iterations, tokens }
}

// ─── ALERT — report critical errors to Discord via backend ───────────────────
export function alertCritical(type, prompt, score) {
  const licenseKey = getLicenseKey();
  if (!licenseKey) return;
  fetch(`${API_BASE}/alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-license-key": licenseKey },
    body: JSON.stringify({ type, prompt, score }),
  }).catch(() => {}); // fire and forget
}

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
export async function healthCheck() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}
