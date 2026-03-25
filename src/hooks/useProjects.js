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

          // Push local-only projects to Supabase, replace local id with server id
          const uploadedLocalIds = new Set();
          for (const p of localOnly.slice(0, 10)) {
            try {
              const saved = await saveProject(p);
              if (saved?.id) uploadedLocalIds.add(p.id); // mark as synced
            } catch {} // keep in local for next mount
          }

          // Merge: for shared IDs, keep whichever has newer updatedAt
          const localMap = new Map(local.map(p => [p.id, p]));
          const merged = remote.map(p => {
            const remoteFormatted = {
              id: p.id,
              name: p.name,
              files: p.files || {},
              lastPrompt: p.last_prompt || "",
              history: p.history || [],
              createdAt: new Date(p.created_at).getTime(),
              updatedAt: new Date(p.updated_at).getTime(),
            };
            const localVersion = localMap.get(p.id);
            if (localVersion && localVersion.updatedAt > remoteFormatted.updatedAt) {
              saveProject(localVersion).catch(() => {});
              return localVersion;
            }
            return remoteFormatted;
          });

          // Only add local-only projects that FAILED to upload (not yet in Supabase)
          for (const p of localOnly) {
            if (!uploadedLocalIds.has(p.id)) merged.push(p);
          }

          setProjects(merged.slice(0, 50));
          saveLocal(merged.slice(0, 50));
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
        // Async save to Supabase — track errors for Farejador
        saveProject(updated).catch(err => {
          try { localStorage.setItem("zp_sync_error", JSON.stringify({ at: Date.now(), op: "update", id, error: err.message })); } catch {}
        });
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
      }).catch(err => {
        try { localStorage.setItem("zp_sync_error", JSON.stringify({ at: Date.now(), op: "create", error: err.message })); } catch {}
      });
      return next;
    });
  }, []);

  const removeProject = useCallback((id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    apiDeleteProject(id).catch(err => {
      try { localStorage.setItem("zp_sync_error", JSON.stringify({ at: Date.now(), op: "delete", id, error: err.message })); } catch {}
    });
  }, []);

  return { projects, setProjects, addProject, updateProject, removeProject, syncing };
}
