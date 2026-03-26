// ─── ZERO PREVIEW — VERSION CONTROL ──────────────────────────────────────────
// Git-style undo/redo for generated projects.
// Each generation pushes a version. User can navigate back and forward.
// Max 20 versions per project to avoid memory bloat.

import { useState, useCallback, useRef } from "react";

const MAX_VERSIONS = 20;

export default function useVersions() {
  const [versions, setVersions] = useState([]);  // array of { files, prompt, score, at }
  const [currentIndex, setCurrentIndex] = useState(-1);
  const projectIdRef = useRef(null);

  // Reset when switching projects
  const initProject = useCallback((projectId, initialFiles) => {
    if (projectIdRef.current === projectId) return;
    projectIdRef.current = projectId;
    if (initialFiles) {
      setVersions([{ files: initialFiles, prompt: "Versao inicial", score: null, at: Date.now() }]);
      setCurrentIndex(0);
    } else {
      setVersions([]);
      setCurrentIndex(-1);
    }
  }, []);

  // Push new version after generation
  const pushVersion = useCallback((files, prompt, score) => {
    setVersions(prev => {
      // If we're not at the end (user did undo), cut forward history
      const trimmed = prev.slice(0, (currentIndex + 1) || prev.length);
      const next = [...trimmed, { files, prompt, score, at: Date.now() }];
      // Keep max versions
      const capped = next.length > MAX_VERSIONS ? next.slice(next.length - MAX_VERSIONS) : next;
      setCurrentIndex(capped.length - 1);
      return capped;
    });
  }, [currentIndex]);

  // Undo — go to previous version
  const undo = useCallback(() => {
    if (currentIndex <= 0) return null;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return versions[newIndex];
  }, [currentIndex, versions]);

  // Redo — go to next version
  const redo = useCallback(() => {
    if (currentIndex >= versions.length - 1) return null;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return versions[newIndex];
  }, [currentIndex, versions]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < versions.length - 1;
  const versionCount = versions.length;
  const currentVersion = currentIndex + 1;

  // Rewind — jump to any version by index
  const rewindTo = useCallback((index) => {
    if (index < 0 || index >= versions.length) return null;
    setCurrentIndex(index);
    return versions[index];
  }, [versions]);

  return {
    pushVersion,
    undo,
    redo,
    canUndo,
    canRedo,
    versionCount,
    currentVersion,
    currentIndex,
    versions,
    rewindTo,
    initProject,
  };
}
