import { useState } from "react";
import { C, SYNE, DM, MONO } from "../config/theme";

// ─── GITHUB SYNC — Push project files to user's GitHub repo ──────────────────
// Uses GitHub's Contents API with a Personal Access Token.
// No OAuth needed — user pastes their token once, saved in localStorage.

const GITHUB_API = "https://api.github.com";

export default function GitHubSync({ files, projectName, onClose }) {
  const [token, setToken] = useState(() => localStorage.getItem("zp_github_token") || "");
  const [repoName, setRepoName] = useState(() => {
    const safe = (projectName || "meu-app").replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase().slice(0, 40);
    return `zero-preview-${safe}`;
  });
  const [step, setStep] = useState("config"); // config | pushing | done | error
  const [progress, setProgress] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");

  const push = async () => {
    if (!token.trim() || !repoName.trim()) return;
    localStorage.setItem("zp_github_token", token.trim());
    setStep("pushing");
    setError("");

    try {
      const headers = {
        "Authorization": `Bearer ${token.trim()}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      };

      // 1. Get authenticated user
      setProgress("Verificando conta GitHub...");
      const userRes = await fetch(`${GITHUB_API}/user`, { headers });
      if (!userRes.ok) throw new Error("Token invalido. Verifique e tente novamente.");
      const user = await userRes.json();
      const owner = user.login;

      // 2. Create repo (or use existing)
      setProgress(`Criando repositorio ${repoName}...`);
      const createRes = await fetch(`${GITHUB_API}/user/repos`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: repoName,
          description: `Gerado com Zero Preview — ${projectName || "App React"}`,
          private: false,
          auto_init: true,
        }),
      });

      if (createRes.status === 422) {
        // Repo already exists — that's ok
        setProgress("Repositorio ja existe, atualizando...");
      } else if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.message || "Erro ao criar repositorio");
      }

      // 3. Push each file
      const fileEntries = Object.entries(files).filter(([_, v]) => v && typeof v === "string");
      let pushed = 0;

      for (const [path, content] of fileEntries) {
        pushed++;
        setProgress(`Enviando ${path} (${pushed}/${fileEntries.length})...`);

        // Check if file exists (to get SHA for update)
        let sha = null;
        try {
          const existRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/contents/${path}`, { headers });
          if (existRes.ok) {
            const existData = await existRes.json();
            sha = existData.sha;
          }
        } catch {}

        const body = {
          message: `${sha ? "update" : "add"}: ${path}`,
          content: btoa(unescape(encodeURIComponent(content))),
        };
        if (sha) body.sha = sha;

        const pushRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/contents/${path}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(body),
        });

        if (!pushRes.ok) {
          const err = await pushRes.json();
          console.warn(`Falha ao enviar ${path}: ${err.message}`);
        }

        // Small delay to avoid rate limit
        if (pushed % 5 === 0) await new Promise(r => setTimeout(r, 500));
      }

      setRepoUrl(`https://github.com/${owner}/${repoName}`);
      setStep("done");

    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(6,15,30,0.88)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "24px 28px", width: 480,
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: SYNE, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
            Enviar para GitHub
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 20, cursor: "pointer" }}>x</button>
        </div>

        {step === "config" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Personal Access Token</div>
              <input
                type="password" value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                style={{ display: "block", width: "100%", padding: "10px 13px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 12, color: C.text, fontFamily: MONO, outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <p style={{ fontSize: 10, color: C.textDim, margin: 0 }}>
                  Crie em <a href="https://github.com/settings/tokens/new?scopes=repo&description=ZeroPreview" target="_blank" rel="noreferrer" style={{ color: C.yellow }}>github.com/settings/tokens</a> com permissao "repo"
                </p>
                {token && (
                  <button onClick={() => { setToken(""); localStorage.removeItem("zp_github_token"); }} style={{ fontSize: 9, color: C.error, background: "none", border: "none", cursor: "pointer", fontFamily: DM }}>
                    Esquecer token
                  </button>
                )}
              </div>
              <div style={{ fontSize: 9, color: C.textDim, padding: "4px 0", background: "rgba(245,158,11,0.06)", borderRadius: 4, textAlign: "center", marginTop: 4 }}>
                O token fica salvo localmente no seu navegador
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Nome do repositorio</div>
              <input
                value={repoName}
                onChange={e => setRepoName(e.target.value)}
                style={{ display: "block", width: "100%", padding: "10px 13px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 12, color: C.text, fontFamily: MONO, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <button onClick={push} disabled={!token.trim() || !repoName.trim()} style={{
              width: "100%", padding: "11px 0", background: token.trim() ? C.yellow : C.border,
              border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700,
              fontFamily: DM, color: C.bg, cursor: token.trim() ? "pointer" : "not-allowed",
            }}>
              Enviar para GitHub
            </button>
          </>
        )}

        {step === "pushing" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: C.yellow, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 4 }}>{progress}</div>
            <div style={{ fontSize: 10, color: C.textDim }}>Nao feche esta janela</div>
          </div>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>&#10003;</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.success, fontFamily: SYNE, marginBottom: 8 }}>Enviado com sucesso!</div>
            <a href={repoUrl} target="_blank" rel="noreferrer" style={{
              display: "inline-block", padding: "8px 20px", background: C.yellow,
              borderRadius: 8, fontSize: 13, fontWeight: 700, color: C.bg,
              textDecoration: "none", fontFamily: DM,
            }}>
              Abrir no GitHub
            </a>
          </div>
        )}

        {step === "error" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 13, color: C.error, marginBottom: 12 }}>{error}</div>
            <button onClick={() => setStep("config")} style={{
              padding: "8px 20px", background: "transparent", border: `1px solid ${C.border}`,
              borderRadius: 8, fontSize: 12, color: C.textMuted, cursor: "pointer", fontFamily: DM,
            }}>
              Tentar novamente
            </button>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
