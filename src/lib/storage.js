// src/lib/storage.js

const MAX_PROJECTS = 50;

// Gerar UUID v4 valido para Supabase
export function generateProjectId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
const MAX_HISTORY = 10;
const STORAGE_LIMIT = 5 * 1024 * 1024; // ~5MB

export function getStorageUsage() {
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    used += (key.length + (localStorage.getItem(key) || "").length) * 2; // UTF-16
  }
  return { used, limit: STORAGE_LIMIT, percent: Math.round((used / STORAGE_LIMIT) * 100) };
}

export function pruneProjects(projects) {
  if (projects.length <= MAX_PROJECTS) return projects;
  // Sort by updatedAt desc, keep newest
  const sorted = [...projects].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  return sorted.slice(0, MAX_PROJECTS);
}

export function trimProject(project) {
  return {
    ...project,
    history: (project.history || []).slice(-MAX_HISTORY),
  };
}

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.code === 22) {
      // Try to free space by pruning projects
      try {
        const raw = localStorage.getItem("zp_projects");
        if (raw) {
          const projects = JSON.parse(raw);
          // Remove files from oldest half of projects
          const sorted = [...projects].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          const half = Math.ceil(sorted.length / 2);
          const trimmed = sorted.map((p, i) => i >= half ? { ...p, files: null } : trimProject(p));
          localStorage.setItem("zp_projects", JSON.stringify(trimmed));
        }
        // Retry
        localStorage.setItem(key, value);
      } catch {
        throw new Error("Armazenamento cheio. Exclua projetos antigos para continuar.");
      }
    } else {
      throw e;
    }
  }
}

export function exportProject(project) {
  const data = JSON.stringify(project, null, 2);
  return new Blob([data], { type: "application/json" });
}

export function importProject(jsonString) {
  const p = JSON.parse(jsonString);
  if (!p.id || !p.name) throw new Error("Projeto invalido.");
  return {
    id: p.id && !p.id.startsWith("p_") ? p.id : generateProjectId(),
    name: p.name,
    files: p.files || {},
    lastPrompt: p.lastPrompt || "",
    history: p.history || [],
    createdAt: p.createdAt || Date.now(),
    updatedAt: p.updatedAt || Date.now(),
  };
}

export { MAX_PROJECTS };
