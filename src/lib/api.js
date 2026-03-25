// ─── ZERO PREVIEW — BACKEND API CLIENT ──────────────────────────────────────
// Todas as chamadas de IA passam pelo backend Railway via SSE streaming.
// Nenhuma API key é exposta no cliente.

const API_BASE = import.meta.env.VITE_API_URL || "https://zp-backend-production.up.railway.app";

function getLicenseKey() {
  try { return JSON.parse(localStorage.getItem("zp_license")) || ""; } catch { return ""; }
}

// ─── STREAMING: CLAUDE VIA BACKEND SSE ───────────────────────────────────────
// onDelta(text) é chamada com cada pedaço de texto conforme chega
// Retorna o texto completo ao final
export async function callClaudeStream(systemPrompt, userPrompt, maxTokens = 12000, onDelta) {
  const licenseKey = getLicenseKey();
  if (!licenseKey) throw new Error("Licenca nao configurada. Faca login com sua license key.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000); // 3min timeout for streaming

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

  // Read SSE stream
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

  if (!fullText) throw new Error("Resposta vazia do Claude.");
  return fullText;
}

// ─── NON-STREAMING FALLBACK (for short calls like niche detection) ───────────
export async function callClaude(systemPrompt, userPrompt, maxTokens = 12000) {
  const licenseKey = getLicenseKey();
  if (!licenseKey) throw new Error("Licenca nao configurada. Faca login com sua license key.");

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
  if (!text) throw new Error("Resposta vazia do Claude.");
  return text;
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
