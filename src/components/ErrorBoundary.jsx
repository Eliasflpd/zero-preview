import React from "react";
import { C, SYNE, DM } from "../config/theme";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DM }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, maxWidth: 480, width: "100%", textAlign: "center" }}>
          <h1 style={{ fontFamily: SYNE, color: C.error, fontSize: 24, margin: "0 0 12px" }}>
            Algo deu errado
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 16px" }}>
            Um erro inesperado ocorreu.
          </p>
          <pre style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, color: C.yellow, fontSize: 13, textAlign: "left", overflowX: "auto", margin: "0 0 24px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error?.message || "Erro desconhecido"}
          </pre>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => window.location.reload()}
              style={{ background: C.error, color: C.bg, border: "none", borderRadius: 8, padding: "10px 20px", fontFamily: DM, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Recarregar
            </button>
            <button
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              style={{ background: "transparent", color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 20px", fontFamily: DM, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Limpar dados e recarregar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
