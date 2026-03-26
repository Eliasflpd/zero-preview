// ─── ZERO PREVIEW — BACKEND API CLIENT ──────────────────────────────────────
// Todas as chamadas de IA passam pelo backend Railway via SSE streaming.
// Nenhuma API key é exposta no cliente.

const API_BASE = import.meta.env.VITE_API_URL || "https://zero-backend-production-7b37.up.railway.app";

function getLicenseKey() {
  try { return JSON.parse(localStorage.getItem("zp_license")) || ""; } catch { return ""; }
}

// ─── INTERNAL: single stream attempt (no retry logic) ────────────────────────
async function _doStream(systemPrompt, userPrompt, maxTokens, onDelta) {
  const licenseKey = getLicenseKey();
  if (!licenseKey) throw new Error("Licenca nao configurada. Faca login com sua license key.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  const res = await fetch(`${API_BASE}/v1/messages`, {
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

  clearTimeout(timeout);

  if (res.status === 401) throw new Error("LICENSE_INVALID");
  if (res.status === 403) throw new Error("LICENSE_EXPIRED");
  if (res.status === 429) throw new Error("RATE_LIMITED");

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
    throw new Error(err.error || `Erro do servidor: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

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

  return fullText;
}

// ─── STREAMING WITH SILENT RETRY ─────────────────────────────────────────────
// Retry 1: network failure → up to 3 attempts with 3s/6s/9s delay
// Retry 2: empty response (<100 chars) → 1 retry with simplified prompt
export async function callClaudeStream(systemPrompt, userPrompt, maxTokens = 12000, onDelta, onProgress) {
  const NETWORK_RETRIES = 3;
  const isAuthErr = (e) => ["LICENSE_INVALID", "LICENSE_EXPIRED", "RATE_LIMITED"].includes(e.message);

  // --- Phase 1: Network retry (Failed to fetch) ---
  let lastError;
  for (let attempt = 1; attempt <= NETWORK_RETRIES; attempt++) {
    try {
      const fullText = await _doStream(systemPrompt, userPrompt, maxTokens, onDelta);

      // --- Phase 2: Empty response check ---
      if (!fullText || fullText.length < 100) {
        console.log(`[Zero] Stream retornou ${fullText?.length || 0} chars — retry com prompt simplificado`);
        onProgress?.({ stage: "retrying", attempt: 1, reason: "empty_response" });

        // Simplified prompt: strip BRIEFING, EXEMPLOS, HISTORICO, REFERENCIA
        const simplified = userPrompt
          .replace(/\nBRIEFING:[\s\S]*?(?=\n[A-Z]|\nRetorne|\n$)/i, "")
          .replace(/\nEXEMPLOS BEM-SUCEDIDOS:[\s\S]*?(?=\n[A-Z]|\nRetorne|\n$)/i, "")
          .replace(/\nHISTORICO DO PROJETO[\s\S]*?(?=\n[A-Z]|\nRetorne|\n$)/i, "")
          .replace(/\nCODIGO DE REFERENCIA[\s\S]*?(?=\n[A-Z]|\nRetorne|\n$)/i, "");

        try {
          const retryText = await _doStream(systemPrompt, simplified, maxTokens, onDelta);
          if (retryText && retryText.length >= 100) return retryText;
        } catch (retryErr) {
          if (isAuthErr(retryErr)) throw retryErr;
        }

        throw new Error("Resposta vazia do Claude apos 2 tentativas.");
      }

      return fullText;

    } catch (e) {
      lastError = e;
      if (isAuthErr(e)) throw e;

      // Network error: "Failed to fetch", "NetworkError", "AbortError", "net::"
      const isNetwork = /failed to fetch|networkerror|aborterror|net::/i.test(e.message);
      if (isNetwork && attempt < NETWORK_RETRIES) {
        const delay = attempt * 3000;
        console.log(`[Zero] Network error (attempt ${attempt}/${NETWORK_RETRIES}) — retry em ${delay / 1000}s`);
        onProgress?.({ stage: "retrying", attempt, reason: "network" });
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      throw e;
    }
  }

  throw lastError || new Error("Todas as tentativas falharam.");
}

// ─── NON-STREAMING WITH SILENT RETRY ────────────────────────────────────────
export async function callClaude(systemPrompt, userPrompt, maxTokens = 12000) {
  const licenseKey = getLicenseKey();
  if (!licenseKey) throw new Error("Licenca nao configurada. Faca login com sua license key.");

  const isAuthErr = (e) => ["LICENSE_INVALID", "LICENSE_EXPIRED", "RATE_LIMITED"].includes(e.message);
  const RETRIES = 3;
  let lastError;

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const res = await fetch(`${API_BASE}/v1/messages`, {
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
      if (!text) throw new Error("EMPTY_RESPONSE");
      return text;

    } catch (e) {
      lastError = e;
      if (isAuthErr(e)) throw e;

      const isNetwork = /failed to fetch|networkerror|aborterror|net::/i.test(e.message);
      const isEmpty = e.message === "EMPTY_RESPONSE";

      if ((isNetwork || isEmpty) && attempt < RETRIES) {
        const delay = attempt * 3000;
        console.log(`[Zero] callClaude retry ${attempt}/${RETRIES} (${isNetwork ? "network" : "empty"}) — ${delay / 1000}s`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (isEmpty) throw new Error("Resposta vazia do Claude.");
      throw e;
    }
  }

  throw lastError || new Error("Todas as tentativas falharam.");
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
