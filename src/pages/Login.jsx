import { useState, useEffect } from "react";
import { C, SYNE, DM, MONO } from "../config/theme";
import { checkLicense, healthCheck } from "../lib/api";

export default function Login({ onLogin }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendUp, setBackendUp] = useState(null);
  const [btnHover, setBtnHover] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    healthCheck().then(setBackendUp);
  }, []);

  const submit = async () => {
    const trimmed = key.trim();
    if (!trimmed) { setErr("Cole sua license key"); return; }
    if (!trimmed.startsWith("zp_")) { setErr("License key deve comecar com zp_"); return; }

    setLoading(true); setErr("");
    try {
      const status = await checkLicense(trimmed);
      if (!status.valid) {
        setErr("Licenca invalida ou expirada.");
        setLoading(false);
        return;
      }
      localStorage.setItem("zp_license", JSON.stringify(trimmed));
      onLogin({ license: trimmed, ...status });
    } catch {
      setErr("Erro ao verificar licenca. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DM, position: "relative", overflow: "hidden" }}>
      {/* Grid background */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize: "48px 48px", opacity: 0.2, pointerEvents: "none" }} />

      {/* Animated gradient orb */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,208,80,0.08) 0%, transparent 70%)", animation: "pulse 4s ease-in-out infinite", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 42, height: 42, background: C.yellow, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 28px rgba(255,208,80,0.3)" }}>
              <span style={{ fontSize: 20, fontWeight: 900, fontFamily: SYNE, color: C.bg }}>Z</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: SYNE, color: C.text, letterSpacing: -1 }}>Zero<span style={{ color: C.yellow }}>.</span></span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: SYNE, color: C.text, margin: "0 0 8px", letterSpacing: -1.5 }}>Zero Preview</h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Crie apps React reais com IA.<br />Preview ao vivo via WebContainer.</p>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
            {["React + Vite", "Preview ao Vivo", "21 Nichos BR", "Claude Sonnet"].map(f => (
              <span key={f} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(255,208,80,0.06)", border: "1px solid rgba(255,208,80,0.15)", color: C.yellowDim }}>
                {f}
              </span>
            ))}
          </div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 26, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>License Key</div>
          <input
            value={key}
            onChange={e => { setKey(e.target.value); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && !loading && submit()}
            placeholder="zp_xxxxxxxxx_xxxxx"
            autoFocus
            disabled={loading}
            style={{
              display: "block", width: "100%", padding: "11px 13px",
              background: C.bg, border: `1px solid ${err ? C.error : inputFocused ? C.yellow : C.border}`,
              borderRadius: 9, fontSize: 13, color: C.text, fontFamily: MONO,
              outline: "none", marginBottom: err ? 7 : 14, boxSizing: "border-box",
              letterSpacing: 0.5,
              transition: "all 0.2s ease",
              boxShadow: inputFocused ? "0 0 0 3px rgba(255,208,80,0.15)" : "none",
            }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          {err && <p style={{ color: C.error, fontSize: 11, marginBottom: 12 }}>{err}</p>}
          <button
            onClick={submit}
            disabled={loading}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              width: "100%", padding: "12px 0",
              background: loading ? C.yellowDim : C.yellow,
              border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700,
              fontFamily: DM, color: C.bg,
              cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s ease",
              transform: btnHover && !loading ? "translateY(-1px)" : "translateY(0)",
              boxShadow: btnHover && !loading ? "0 4px 16px rgba(255,208,80,0.3)" : "none",
            }}
          >
            {loading && <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>&#8635;</span>}
            {loading ? "Verificando..." : "Ativar Licenca"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: backendUp === null ? C.textDim : backendUp ? C.success : C.error }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: backendUp === null ? C.textDim : backendUp ? C.success : C.error, display: "inline-block", animation: backendUp === null ? "pulse 1.4s ease-in-out infinite" : "none" }} />
            {backendUp === null ? "Verificando backend..." : backendUp ? "Backend online" : "Backend offline"}
          </div>
          {backendUp === false && (
            <button onClick={() => { setBackendUp(null); healthCheck().then(setBackendUp); }} style={{ marginTop: 6, padding: "4px 14px", background: "transparent", border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 6, fontSize: 10, color: C.error, cursor: "pointer", fontFamily: DM }}>
              Verificar novamente
            </button>
          )}
          {backendUp !== false && (
            <p style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>Claude Sonnet via backend seguro</p>
          )}
        </div>
      </div>

      {/* Version badge */}
      <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontSize: 9, color: C.textDim, fontFamily: MONO }}>Zero Preview v2.0 — Build {new Date().toISOString().slice(0,10).replace(/-/g,'')}</span>
      </div>
    </div>
  );
}
