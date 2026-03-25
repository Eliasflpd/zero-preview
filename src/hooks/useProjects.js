// ─── ZERO PREVIEW — PROJECT PERSISTENCE HOOK ────────────────────────────────
// Dual-write: localStorage (offline fallback) + Supabase (source of truth)
// On mount: fetch from Supabase, merge with localStorage
// On write: save to both simultaneously
// If Supabase is down: localStorage works, sync later

import { useState, useEffect, useRef, useCallback } from "react";
import { listProjects, saveProject, deleteProject as apiDeleteProject } from "../lib/api";
import { safeSetItem } from "../lib/storage";

const LS_KEY = "zp_projects";

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
}
function saveLocal(projects) {
  try { safeSetItem(LS_KEY, JSON.stringify(projects)); } catch {}
}

export default function useProjects() {
  const [projects, setProjects] = useState(loadLocal);
  const [syncing, setSyncing] = useState(false);
  const syncedRef = useRef(false);

  // ─── On mount: fetch from Supabase and merge with local ────────────────────
  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;

    (async () => {
      setSyncing(true);
      try {
        const remote = await listProjects();
        if (remote && remote.length > 0) {
          // Merge: remote is source of truth for IDs that exist there.
          // Local-only projects (not in remote) get pushed up.
          const local = loadLocal();
          const remoteIds = new Set(remote.map(p => p.id));
          const localOnly = local.filter(p => !remoteIds.has(p.id));

          // Push local-only projects to Supabase (best-effort)
          for (const p of localOnly.slice(0, 10)) {
            try { await saveProject(p); } catch {}
          }

          // Remote projects are canonical — map to our format
          const merged = remote.map(p => ({
            id: p.id,
            name: p.name,
            files: p.files || {},
            lastPrompt: p.last_prompt || "",
            history: p.history || [],
            createdAt: new Date(p.created_at).getTime(),
            updatedAt: new Date(p.updated_at).getTime(),
          }));

          setProjects(merged);
          saveLocal(merged);
        }
      } catch {
        // Supabase down — localStorage is fine as fallback
      }
      setSyncing(false);
    })();
  }, []);

  // ─── Save to localStorage whenever projects change ─────────────────────────
  useEffect(() => {
    saveLocal(projects);
  }, [projects]);

  // ─── CRUD operations (dual-write) ──────────────────────────────────────────
  const updateProject = useCallback((id, updater) => {
    setProjects(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p;
        const updated = typeof updater === "function" ? updater(p) : { ...p, ...updater };
        // Async save to Supabase (fire and forget)
        saveProject(updated).catch(() => {});
        return updated;
      });
      return next;
    });
  }, []);

  const addProject = useCallback((project) => {
    setProjects(prev => {
      const next = [project, ...prev].slice(0, 50);
      // Async save to Supabase
      saveProject(project).then(saved => {
        // Update with server-assigned ID if different
        if (saved?.id && saved.id !== project.id) {
          setProjects(current => current.map(p => p.id === project.id ? { ...p, id: saved.id } : p));
        }
      }).catch(() => {});
      return next;
    });
  }, []);

  const removeProject = useCallback((id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    apiDeleteProject(id).catch(() => {});
  }, []);

  return { projects, setProjects, addProject, updateProject, removeProject, syncing };
}
