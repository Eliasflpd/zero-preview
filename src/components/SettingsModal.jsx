import { C, SYNE, DM } from "../lib/constants";

export default function SettingsModal({ licenseInfo, onClose, onLogout }) {
  const licenseKey = (() => {
    try { return JSON.parse(localStorage.getItem("zp_license")) || ""; } catch { return ""; }
  })();

  const maskedKey = licenseKey
    ? licenseKey.slice(0, 6) + "..." + licenseKey.slice(-4)
    : "—";

  const pct = licenseInfo?.percent_used ?? 0;
  const barColor = pct > 85 ? C.error : pct > 60 ? C.yellow : C.success;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(6,15,30,0.88)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: 32, width: 420,
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: SYNE, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
            Sua Licenca
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 22, cursor: "pointer" }}>x</button>
        </div>

        {/* License Key */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
            License Key
          </div>
          <div style={{
            padding: "10px 14px", background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 9, fontSize: 13, color: C.text,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
          }}>
            {maskedKey}
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
            Status
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: licenseInfo?.valid ? C.success : C.error,
            }} />
            <span style={{ fontSize: 13, color: licenseInfo?.valid ? C.success : C.error, fontWeight: 600 }}>
              {licenseInfo?.valid ? "Ativa" : "Inativa"}
            </span>
            {licenseInfo?.expires_at && (
              <span style={{ fontSize: 11, color: C.textMuted, marginLeft: "auto" }}>
                Expira: {new Date(licenseInfo.expires_at).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        </div>

        {/* Token Usage */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
            Uso de Tokens (mensal)
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: SYNE }}>
              {licenseInfo?.tokens_used != null ? `${((licenseInfo.tokens_used / 1000) | 0)}k` : "—"}
            </span>
            <span style={{ fontSize: 13, color: C.textMuted, alignSelf: "flex-end" }}>
              / {licenseInfo?.tokens_limit ? `${((licenseInfo.tokens_limit / 1000) | 0)}k` : "—"}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${Math.min(pct, 100)}%`,
              background: barColor, borderRadius: 3,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4, textAlign: "right" }}>
            {pct}% utilizado
          </div>
        </div>

        {/* Info */}
        <div style={{
          background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)",
          borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 11, color: C.info,
        }}>
          Todas as chamadas de IA passam pelo backend seguro. Nenhuma API key e armazenada no seu navegador.
        </div>

        {/* Logout */}
        <button onClick={onLogout} style={{
          width: "100%", padding: "10px 0",
          background: "rgba(248,113,113,0.08)", border: `1px solid rgba(248,113,113,0.3)`,
          borderRadius: 9, fontSize: 13, fontWeight: 600,
          fontFamily: DM, color: C.error, cursor: "pointer",
        }}>
          Sair e trocar licenca
        </button>
      </div>
    </div>
  );
}
