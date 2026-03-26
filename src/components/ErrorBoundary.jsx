import React from "react";
import { C, SYNE, DM, MONO, SHADOW, R } from "../config/theme";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isReact31 = this.state.error?.message?.includes("Objects are not valid") ||
                      this.state.error?.message?.includes("minified React error #31");

    return (
      <div style={{
        background: C.bg, minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: DM, padding: 24,
      }}>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: R.lg, padding: "36px 32px", maxWidth: 460,
          width: "100%", textAlign: "center", boxShadow: SHADOW.lg,
        }}>
          {/* Icon */}
          <div style={{
            width: 56, height: 56, borderRadius: R.md, margin: "0 auto 16px",
            background: C.errorDim, border: `1px solid rgba(248,113,113,0.15)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <h1 style={{
            fontFamily: SYNE, color: C.text, fontSize: 22,
            fontWeight: 800, margin: "0 0 8px", letterSpacing: -0.5,
          }}>
            {isReact31 ? "Erro no app gerado" : "Algo deu errado"}
          </h1>

          <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 20px", lineHeight: 1.6 }}>
            {isReact31
              ? "O codigo gerado tentou exibir um objeto como texto. Recarregue para voltar."
              : "Um erro inesperado ocorreu na plataforma."}
          </p>

          <pre style={{
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: R.sm, padding: "10px 14px", fontFamily: MONO,
            color: C.error, fontSize: 11, textAlign: "left",
            overflowX: "auto", margin: "0 0 24px",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            maxHeight: 90, overflowY: "auto", lineHeight: 1.5,
          }}>
            {this.state.error?.message || "Erro desconhecido"}
          </pre>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: `linear-gradient(135deg, ${C.yellow}, #FFE088)`,
                color: C.bg, border: "none", borderRadius: R.sm,
                padding: "10px 24px", fontFamily: DM, fontSize: 13,
                fontWeight: 700, cursor: "pointer",
                boxShadow: `0 4px 16px rgba(255,208,80,0.25)`,
              }}
            >
              Recarregar
            </button>
            <button
              onClick={() => {
                const license = localStorage.getItem("zp_license");
                const user = localStorage.getItem("zp_user");
                const adminKey = localStorage.getItem("zp_admin_key");
                const onboarded = localStorage.getItem("zp_onboarded");
                localStorage.clear();
                if (license) localStorage.setItem("zp_license", license);
                if (user) localStorage.setItem("zp_user", user);
                if (adminKey) localStorage.setItem("zp_admin_key", adminKey);
                if (onboarded) localStorage.setItem("zp_onboarded", onboarded);
                window.location.reload();
              }}
              style={{
                background: "transparent", color: C.textSub,
                border: `1px solid ${C.border}`, borderRadius: R.sm,
                padding: "10px 24px", fontFamily: DM, fontSize: 13,
                fontWeight: 600, cursor: "pointer",
              }}
            >
              Limpar projetos
            </button>
          </div>
        </div>
      </div>
    );
  }
}
