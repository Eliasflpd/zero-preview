import { useState, useMemo } from "react";
import { diffLines } from "diff";
import { C, SYNE, DM, MONO, SHADOW, R, EASE } from "../config/theme";

/**
 * DiffReview — Modal que mostra antes/depois de cada arquivo modificado.
 * Props:
 *   oldFiles: { "path": "content", ... }
 *   newFiles: { "path": "content", ... }
 *   onApply: () => void  — aplica todas as mudanças
 *   onCancel: () => void — cancela
 */
export default function DiffReview({ oldFiles, newFiles, onApply, onCancel }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewMode, setViewMode] = useState("unified"); // "unified" | "split"

  // Calcular arquivos modificados, adicionados, removidos
  const fileChanges = useMemo(() => {
    const changes = [];
    const allPaths = new Set([...Object.keys(oldFiles || {}), ...Object.keys(newFiles || {})]);

    for (const path of allPaths) {
      const oldContent = (oldFiles || {})[path] || "";
      const newContent = (newFiles || {})[path] || "";

      if (!oldContent && newContent) {
        changes.push({ path, type: "added", additions: newContent.split("\n").length, deletions: 0 });
      } else if (oldContent && !newContent) {
        changes.push({ path, type: "removed", additions: 0, deletions: oldContent.split("\n").length });
      } else if (oldContent !== newContent) {
        const diff = diffLines(oldContent, newContent);
        const additions = diff.filter(d => d.added).reduce((sum, d) => sum + d.count, 0);
        const deletions = diff.filter(d => d.removed).reduce((sum, d) => sum + d.count, 0);
        changes.push({ path, type: "modified", additions, deletions });
      }
    }

    // Ordena: modificados primeiro, depois adicionados, depois removidos
    changes.sort((a, b) => {
      const order = { modified: 0, added: 1, removed: 2 };
      return (order[a.type] || 0) - (order[b.type] || 0);
    });

    return changes;
  }, [oldFiles, newFiles]);

  // Se nenhum arquivo selecionado, seleciona o primeiro
  const activeFile = selectedFile || fileChanges[0]?.path;

  // Diff do arquivo ativo
  const activeDiff = useMemo(() => {
    if (!activeFile) return [];
    const oldContent = (oldFiles || {})[activeFile] || "";
    const newContent = (newFiles || {})[activeFile] || "";
    return diffLines(oldContent, newContent);
  }, [activeFile, oldFiles, newFiles]);

  const totalAdditions = fileChanges.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = fileChanges.reduce((s, f) => s + f.deletions, 0);

  if (fileChanges.length === 0) {
    // Nenhuma mudança — aplica direto
    onApply?.();
    return null;
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(5,10,18,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: `fadeIn 0.2s ${EASE.out}`,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "90vw", maxWidth: 1000, height: "80vh",
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: R.lg, boxShadow: SHADOW.xl,
        display: "flex", flexDirection: "column", overflow: "hidden",
        animation: `scaleIn 0.25s ${EASE.out}`,
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: SYNE, color: C.text }}>
              Revisar Mudancas
            </span>
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: R.full,
              background: C.successDim, color: C.success, fontWeight: 600,
            }}>
              +{totalAdditions}
            </span>
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: R.full,
              background: C.errorDim, color: C.error, fontWeight: 600,
            }}>
              -{totalDeletions}
            </span>
            <span style={{ fontSize: 10, color: C.textDim }}>
              {fileChanges.length} arquivo{fileChanges.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["unified", "split"].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: "3px 10px", borderRadius: R.xs, fontSize: 10, fontWeight: 600,
                fontFamily: DM, cursor: "pointer",
                background: viewMode === mode ? C.yellowGlow : "transparent",
                border: `1px solid ${viewMode === mode ? C.borderFocus : C.border}`,
                color: viewMode === mode ? C.yellow : C.textDim,
                transition: `all 0.15s ${EASE.out}`,
              }}>
                {mode === "unified" ? "Unificado" : "Lado a lado"}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* File list */}
          <div style={{
            width: 220, borderRight: `1px solid ${C.border}`,
            overflowY: "auto", padding: "6px 0",
          }}>
            {fileChanges.map(f => (
              <button key={f.path} onClick={() => setSelectedFile(f.path)} style={{
                width: "100%", textAlign: "left", padding: "7px 12px",
                background: activeFile === f.path ? C.surface2 : "transparent",
                border: "none", cursor: "pointer",
                borderLeft: activeFile === f.path ? `2px solid ${C.yellow}` : "2px solid transparent",
                display: "flex", alignItems: "center", gap: 6,
                transition: `all 0.1s ${EASE.out}`,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: f.type === "added" ? C.success : f.type === "removed" ? C.error : C.info,
                }} />
                <span style={{
                  fontSize: 11, color: activeFile === f.path ? C.text : C.textMuted,
                  fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", flex: 1,
                }}>
                  {f.path.split("/").pop()}
                </span>
                <span style={{ fontSize: 9, color: C.textDim, flexShrink: 0 }}>
                  {f.additions > 0 && <span style={{ color: C.success }}>+{f.additions}</span>}
                  {f.additions > 0 && f.deletions > 0 && " "}
                  {f.deletions > 0 && <span style={{ color: C.error }}>-{f.deletions}</span>}
                </span>
              </button>
            ))}
          </div>

          {/* Diff view */}
          <div style={{ flex: 1, overflowY: "auto", fontFamily: MONO, fontSize: 12, lineHeight: 1.6 }}>
            {/* File path header */}
            <div style={{
              padding: "8px 14px", background: C.bg,
              borderBottom: `1px solid ${C.border}`,
              fontSize: 11, color: C.textMuted, position: "sticky", top: 0, zIndex: 1,
            }}>
              {activeFile}
            </div>

            {activeDiff.map((part, i) => {
              const lines = part.value.replace(/\n$/, "").split("\n");
              return lines.map((line, j) => (
                <div key={`${i}-${j}`} style={{
                  padding: "0 14px 0 36px", position: "relative",
                  background: part.added
                    ? "rgba(52,211,153,0.06)"
                    : part.removed
                      ? "rgba(248,113,113,0.06)"
                      : "transparent",
                  borderLeft: part.added
                    ? `3px solid ${C.success}`
                    : part.removed
                      ? `3px solid ${C.error}`
                      : "3px solid transparent",
                  color: part.added ? "#6EE7B7" : part.removed ? "#FCA5A5" : C.textMuted,
                  minHeight: 22, display: "flex", alignItems: "center",
                }}>
                  <span style={{
                    position: "absolute", left: 10, width: 16, textAlign: "center",
                    color: part.added ? C.success : part.removed ? C.error : C.textDim,
                    fontSize: 11, fontWeight: 600, userSelect: "none",
                  }}>
                    {part.added ? "+" : part.removed ? "-" : " "}
                  </span>
                  <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{line || " "}</span>
                </div>
              ));
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 18px", borderTop: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8,
          background: C.bg,
        }}>
          <button onClick={onCancel} style={{
            padding: "8px 20px", background: "transparent",
            border: `1px solid ${C.border}`, borderRadius: R.sm,
            fontSize: 12, fontWeight: 600, color: C.textSub,
            cursor: "pointer", fontFamily: DM,
          }}>
            Cancelar
          </button>
          <button onClick={onApply} style={{
            padding: "8px 24px",
            background: `linear-gradient(135deg, ${C.yellow}, #FFE088)`,
            border: "none", borderRadius: R.sm,
            fontSize: 12, fontWeight: 700, color: C.bg,
            cursor: "pointer", fontFamily: DM,
            boxShadow: `0 4px 16px rgba(255,208,80,0.25)`,
          }}>
            Aplicar tudo
          </button>
        </div>
      </div>
    </div>
  );
}
