import { useState, useEffect } from "react";
import { C, SYNE, DM, MONO, SHADOW, R, EASE } from "../config/theme";
import { checkLicense, healthCheck } from "../lib/api";

export default function Login({ onLogin }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendUp, setBackendUp] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { healthCheck().then(setBackendUp); }, []);

  const submit = async () => {
    const trimmed = key.trim();
    if (!trimmed) { setErr("Cole sua license key"); return; }
    if (!trimmed.startsWith("zp_")) { setErr("License key deve comecar com zp_"); return; }

    setLoading(true); setErr("");
    try {
      const status = await checkLicense(trimmed);
      if (!status.valid) { setErr("Licenca invalida ou expirada."); setLoading(false); return; }
      localStorage.setItem("zp_license", JSON.stringify(trimmed));
      onLogin({ license: trimmed, ...status });
    } catch { setErr("Erro ao verificar licenca. Tente novamente."); }
    setLoading(false);
  };

  const features = [
    { icon: "⚡", label: "React + Vite + TypeScript" },
    { icon: "🎯", label: "Preview ao Vivo" },
    { icon: "🇧🇷", label: "21 Nichos BR" },
    { icon: "🤖", label: "Claude Sonnet 4" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: DM,
      position: "relative", overflow: "hidden",
    }}>
      {/* Background layers */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          radial-gradient(ellipse 600px 400px at 50% 40%, rgba(255,208,80,0.04) 0%, transparent 70%),
          radial-gradient(ellipse 800px 600px at 30% 60%, rgba(96,165,250,0.02) 0%, transparent 70%),
          radial-gradient(ellipse 800px 600px at 70% 30%, rgba(167,139,250,0.02) 0%, transparent 70%)
        `,
        pointerEvents: "none",
      }} />

      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
        backgroundSize: "64px 64px",
      }} />

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 400,
        padding: "0 20px",
        opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: `all 0.7s ${EASE.out}`,
      }}>
        {/* Logo + Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 20,
          }}>
            <div style={{
              width: 44, height: 44, background: `linear-gradient(135deg, ${C.yellow}, #FFE088)`,
              borderRadius: R.md, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 32px rgba(255,208,80,0.25), ${SHADOW.md}`,
            }}>
              <span style={{ fontSize: 22, fontWeight: 900, fontFamily: SYNE, color: C.bg }}>Z</span>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: SYNE, color: C.text, letterSpacing: -1, lineHeight: 1.1 }}>
                Zero<span style={{ color: C.yellow }}>.</span>
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 500, letterSpacing: 0.3 }}>PREVIEW</div>
            </div>
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 800, fontFamily: SYNE, margin: "0 0 8px",
            letterSpacing: -1.2, lineHeight: 1.15,
            background: `linear-gradient(135deg, ${C.text} 40%, ${C.yellow})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Crie apps com IA
          </h1>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
            Descreva seu app e veja ele rodando ao vivo em segundos.
          </p>
        </div>

        {/* Feature chips */}
        <div style={{
          display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap",
          marginBottom: 24,
        }}>
          {features.map(f => (
            <span key={f.label} style={{
              fontSize: 10, padding: "4px 10px", borderRadius: R.full,
              background: C.yellowGlow2, border: `1px solid ${C.border}`,
              color: C.textSub, display: "inline-flex", alignItems: "center", gap: 4,
              fontWeight: 500,
            }}>
              <span style={{ fontSize: 11 }}>{f.icon}</span> {f.label}
            </span>
          ))}
        </div>

        {/* Login card */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: R.lg, padding: "24px 22px",
          boxShadow: SHADOW.lg,
          backdropFilter: "blur(12px)",
        }}>
          <label style={{
            fontSize: 11, color: C.textMuted, fontWeight: 600,
            letterSpacing: 0.8, textTransform: "uppercase",
            display: "block", marginBottom: 8,
          }}>
            License Key
          </label>

          <input
            value={key}
            onChange={e => { setKey(e.target.value); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && !loading && submit()}
            placeholder="zp_xxxxxxxxx_xxxxx"
            autoFocus
            disabled={loading}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              display: "block", width: "100%", padding: "12px 14px",
              background: C.bg, borderRadius: R.sm, fontSize: 13, fontFamily: MONO,
              color: C.text, outline: "none", boxSizing: "border-box",
              letterSpacing: 0.5, lineHeight: 1.4,
              border: `1px solid ${err ? C.error : inputFocused ? C.borderFocus : C.border}`,
              boxShadow: inputFocused ? `0 0 0 3px ${C.yellowGlow}, ${SHADOW.sm}` : SHADOW.sm,
              transition: `all 0.25s ${EASE.out}`,
            }}
          />

          {err && (
            <p style={{
              color: C.error, fontSize: 11, marginTop: 8,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.error, flexShrink: 0 }} />
              {err}
            </p>
          )}

          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: "100%", padding: "12px 0", marginTop: 16,
              background: loading
                ? `linear-gradient(135deg, ${C.yellowDim}, ${C.yellowDim})`
                : `linear-gradient(135deg, ${C.yellow}, #FFE088)`,
              border: "none", borderRadius: R.sm,
              fontSize: 14, fontWeight: 700, fontFamily: DM, color: C.bg,
              cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: loading ? "none" : `0 4px 16px rgba(255,208,80,0.25), ${SHADOW.sm}`,
              transform: "translateY(0)",
              transition: `all 0.25s ${EASE.out}`,
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 24px rgba(255,208,80,0.35), ${SHADOW.md}`; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = loading ? "none" : `0 4px 16px rgba(255,208,80,0.25), ${SHADOW.sm}`; }}
          >
            {loading && (
              <span style={{
                width: 16, height: 16, border: "2px solid rgba(5,10,18,0.3)",
                borderTopColor: C.bg, borderRadius: "50%",
                animation: "spin 0.7s linear infinite", display: "inline-block",
              }} />
            )}
            {loading ? "Verificando..." : "Ativar Licenca"}
          </button>
        </div>

        {/* Backend status */}
        <div style={{
          textAlign: "center", marginTop: 16,
          opacity: mounted ? 1 : 0, transition: `opacity 0.5s ${EASE.out} 0.3s`,
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11,
            color: backendUp === null ? C.textDim : backendUp ? C.success : C.error,
            padding: "4px 12px", borderRadius: R.full,
            background: backendUp === null ? "transparent" : backendUp ? C.successDim : C.errorDim,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: backendUp === null ? C.textDim : backendUp ? C.success : C.error,
              display: "inline-block",
              animation: backendUp === null ? "pulse 1.4s ease-in-out infinite" : "none",
            }} />
            {backendUp === null ? "Conectando..." : backendUp ? "Backend online" : "Backend offline"}
          </div>

          {backendUp === false && (
            <button
              onClick={() => { setBackendUp(null); healthCheck().then(setBackendUp); }}
              style={{
                marginTop: 8, padding: "5px 14px", background: "transparent",
                border: `1px solid ${C.errorDim}`, borderRadius: R.sm,
                fontSize: 10, color: C.error, cursor: "pointer", fontFamily: DM, display: "block", margin: "8px auto 0",
              }}
            >
              Tentar novamente
            </button>
          )}
        </div>

        {/* Version */}
        <div style={{
          textAlign: "center", marginTop: 32,
          fontSize: 10, color: C.textDim, fontFamily: MONO, letterSpacing: 0.5,
        }}>
          Zero Preview v3.0
        </div>
      </div>
    </div>
  );
}
