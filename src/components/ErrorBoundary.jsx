import React from "react";
import { C, SYNE, DM } from "../config/theme";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isReact31 = this.state.error?.message?.includes("Objects are not valid") ||
                      this.state.error?.message?.includes("minified React error #31");

    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DM }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, maxWidth: 480, width: "100%", textAlign: "center" }}>
          <h1 style={{ fontFamily: SYNE, color: C.error, fontSize: 24, margin: "0 0 12px" }}>
            {isReact31 ? "Erro no app gerado" : "Algo deu errado"}
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 16px" }}>
            {isReact31
              ? "O codigo gerado tentou exibir um objeto no lugar de texto. Recarregue para voltar."
              : "Um erro inesperado ocorreu."}
          </p>
          <pre style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, color: C.yellow, fontSize: 12, textAlign: "left", overflowX: "auto", margin: "0 0 24px", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 100, overflowY: "auto" }}>
            {this.state.error?.message || "Erro desconhecido"}
          </pre>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => window.location.reload()}
              style={{ background: C.yellow, color: C.bg, border: "none", borderRadius: 8, padding: "10px 20px", fontFamily: DM, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Recarregar
            </button>
            <button
              onClick={() => {
                // Preserve login — only clear project data
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
              style={{ background: "transparent", color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 20px", fontFamily: DM, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Limpar projetos (manter login)
            </button>
          </div>
        </div>
      </div>
    );
  }
}
