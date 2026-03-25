import { useState } from "react";
import { C, SYNE, DM, MONO } from "../config/theme";

export default function GitHubImport({ onImport, onClose }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState(null);

  const parseGitHubUrl = (input) => {
    // Accepts: https://github.com/user/repo or user/repo
    const match = input.match(/(?:github\.com\/)?([^\/]+)\/([^\/\s#?]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  };

  const fetchRepo = async () => {
    const parsed = parseGitHubUrl(url.trim());
    if (!parsed) { setError("URL invalida. Use: github.com/usuario/repositorio"); return; }

    setLoading(true); setError("");
    try {
      // Fetch repo tree via GitHub API (no auth needed for public repos)
      const treeRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/main?recursive=1`);
      if (!treeRes.ok) {
        // Try 'master' branch
        const masterRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/master?recursive=1`);
        if (!masterRes.ok) throw new Error("Repositorio nao encontrado ou privado");
        var treeData = await masterRes.json();
      } else {
        var treeData = await treeRes.json();
      }

      // Filter to source files only (no binaries, no node_modules)
      const sourceFiles = (treeData.tree || []).filter(f =>
        f.type === "blob" &&
        f.size < 50000 &&
        !f.path.includes("node_modules") &&
        !f.path.includes(".git/") &&
        !f.path.includes("dist/") &&
        !f.path.includes(".lock") &&
        (f.path.endsWith(".tsx") || f.path.endsWith(".ts") || f.path.endsWith(".jsx") ||
         f.path.endsWith(".js") || f.path.endsWith(".css") || f.path.endsWith(".json") ||
         f.path.endsWith(".html") || f.path.endsWith(".md"))
      );

      // Fetch file contents (max 20 files to avoid rate limit)
      const toFetch = sourceFiles.slice(0, 20);
      const fileMap = {};

      for (const file of toFetch) {
        try {
          const contentRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${file.path}`);
          if (contentRes.ok) {
            const contentData = await contentRes.json();
            if (contentData.encoding === "base64" && contentData.content) {
              fileMap[file.path] = atob(contentData.content);
            }
          }
        } catch {}
        // Small delay to avoid rate limit
        await new Promise(r => setTimeout(r, 200));
      }

      if (Object.keys(fileMap).length === 0) throw new Error("Nenhum arquivo fonte encontrado");

      setFiles(fileMap);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(6,15,30,0.88)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "24px 28px", width: 500,
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        maxHeight: "80vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: SYNE, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
            Importar do GitHub
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 20, cursor: "pointer" }}>x</button>
        </div>

        {!files ? (
          <>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
              Cole a URL de um repositorio publico do GitHub. O Zero Preview vai importar os arquivos e voce pode melhorar com IA.
            </div>
            <input
              value={url} onChange={e => { setUrl(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && fetchRepo()}
              placeholder="https://github.com/usuario/repositorio"
              style={{ display: "block", width: "100%", padding: "10px 13px", background: C.bg, border: `1px solid ${error ? C.error : C.border}`, borderRadius: 9, fontSize: 12, color: C.text, fontFamily: MONO, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
            />
            {error && <p style={{ fontSize: 10, color: C.error, marginBottom: 8 }}>{error}</p>}
            <button onClick={fetchRepo} disabled={loading || !url.trim()} style={{
              width: "100%", padding: "10px 0",
              background: loading ? C.yellowDim : url.trim() ? C.yellow : C.border,
              border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700,
              fontFamily: DM, color: C.bg, cursor: url.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {loading ? "Importando..." : "Importar repositorio"}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, color: C.success, marginBottom: 12, fontWeight: 600 }}>
              {Object.keys(files).length} arquivos importados!
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto", borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 12 }}>
              {Object.keys(files).map(path => (
                <div key={path} style={{ padding: "4px 10px", fontSize: 10, color: C.textMuted, borderBottom: `1px solid ${C.border}`, fontFamily: MONO }}>
                  {path} ({files[path].length} chars)
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { onImport(files); onClose(); }} style={{
                flex: 1, padding: "10px 0", background: C.yellow, border: "none",
                borderRadius: 9, fontSize: 13, fontWeight: 700, color: C.bg, cursor: "pointer", fontFamily: DM,
              }}>
                Carregar no editor
              </button>
              <button onClick={() => setFiles(null)} style={{
                padding: "10px 16px", background: "transparent", border: `1px solid ${C.border}`,
                borderRadius: 9, fontSize: 12, color: C.textMuted, cursor: "pointer", fontFamily: DM,
              }}>
                Voltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
