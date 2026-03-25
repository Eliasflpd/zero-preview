import { useState, useEffect } from "react";
import { C, SYNE, DM, MONO } from "../config/theme";
import { fetchAdminDashboard } from "../lib/api";

// ─── STATUS COLORS ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  ok:            { color: C.success, label: "Ativo" },
  expiring:      { color: "#F59E0B", label: "Expirando" },
  expired:       { color: C.error, label: "Expirado" },
  limit:         { color: C.error, label: "Limite" },
  inactive:      { color: C.textDim, label: "Inativo" },
  inactive_user: { color: "#F59E0B", label: "Sem uso" },
  no_projects:   { color: C.info, label: "Sem projetos" },
};

// ─── MY LICENSE TAB ──────────────────────────────────────────────────────────
function MyLicenseTab({ licenseInfo, onLogout }) {
  const licenseKey = (() => {
    try { return JSON.parse(localStorage.getItem("zp_license")) || ""; } catch { return ""; }
  })();
  const maskedKey = licenseKey ? licenseKey.slice(0, 6) + "..." + licenseKey.slice(-4) : "—";
  const pct = licenseInfo?.percent_used ?? 0;
  const barColor = pct > 85 ? C.error : pct > 60 ? C.yellow : C.success;

  return (
    <>
      {/* License Key */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>License Key</div>
        <div style={{ padding: "10px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, color: C.text, fontFamily: MONO, letterSpacing: 0.5 }}>{maskedKey}</div>
      </div>
      {/* Status */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Status</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: licenseInfo?.valid ? C.success : C.error }} />
          <span style={{ fontSize: 13, color: licenseInfo?.valid ? C.success : C.error, fontWeight: 600 }}>{licenseInfo?.valid ? "Ativa" : "Inativa"}</span>
          {licenseInfo?.expires_at && <span style={{ fontSize: 11, color: C.textMuted, marginLeft: "auto" }}>Expira: {new Date(licenseInfo.expires_at).toLocaleDateString("pt-BR")}</span>}
        </div>
      </div>
      {/* Token Usage */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Uso de Tokens (mensal)</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: SYNE }}>{licenseInfo?.tokens_used != null ? `${((licenseInfo.tokens_used / 1000) | 0)}k` : "—"}</span>
          <span style={{ fontSize: 13, color: C.textMuted, alignSelf: "flex-end" }}>/ {licenseInfo?.tokens_limit ? `${((licenseInfo.tokens_limit / 1000) | 0)}k` : "—"}</span>
        </div>
        <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 3, transition: "width 0.5s ease" }} />
        </div>
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 4, textAlign: "right" }}>{pct}% utilizado</div>
      </div>
      {/* Info */}
      <div style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 11, color: C.info }}>
        Todas as chamadas passam pelo backend seguro. Nenhuma API key no navegador.
      </div>
      {/* Logout */}
      <button onClick={onLogout} style={{ width: "100%", padding: "10px 0", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 9, fontSize: 13, fontWeight: 600, fontFamily: DM, color: C.error, cursor: "pointer" }}>
        Sair e trocar licenca
      </button>
    </>
  );
}

// ─── ADMIN TAB ───────────────────────────────────────────────────────────────
function AdminTab() {
  const [adminKey, setAdminKey] = useState(() => {
    try { return localStorage.getItem("zp_admin_key") || ""; } catch { return ""; }
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const loadDashboard = async () => {
    if (!adminKey.trim()) return;
    setLoading(true);
    const result = await fetchAdminDashboard(adminKey.trim());
    if (result) {
      setData(result);
      setAuthenticated(true);
      localStorage.setItem("zp_admin_key", adminKey.trim());
    } else {
      setData(null);
      setAuthenticated(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (adminKey) loadDashboard();
  }, []);

  if (!authenticated) {
    return (
      <div>
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
          Insira a chave de administrador para ver os dados dos clientes.
        </div>
        <input
          type="password" value={adminKey}
          onChange={e => setAdminKey(e.target.value)}
          onKeyDown={e => e.key === "Enter" && loadDashboard()}
          placeholder="Admin Key"
          style={{ display: "block", width: "100%", padding: "10px 13px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, color: C.text, fontFamily: MONO, outline: "none", marginBottom: 12, boxSizing: "border-box" }}
        />
        <button onClick={loadDashboard} disabled={loading} style={{ padding: "9px 20px", background: C.yellow, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: DM, color: C.bg, cursor: "pointer" }}>
          {loading ? "Verificando..." : "Acessar Painel"}
        </button>
      </div>
    );
  }

  const { summary, clients } = data;
  const needHelp = clients.filter(c => c.help_note);

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Clientes", value: summary.total_clients, color: C.info },
          { label: "Projetos", value: summary.total_projects, color: C.success },
          { label: "Precisam ajuda", value: summary.need_help, color: summary.need_help > 0 ? C.error : C.success },
        ].map(s => (
          <div key={s.label} style={{ background: C.bg, borderRadius: 10, padding: "10px 12px", border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: SYNE }}>{s.value}</div>
            <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Clients who need help — shown first */}
      {needHelp.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.error, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Precisam de ajuda</div>
          {needHelp.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 8, marginBottom: 4, fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_CONFIG[c.status]?.color || C.textDim, flexShrink: 0 }} />
              <span style={{ color: C.text, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</span>
              <span style={{ color: C.error, fontSize: 10, flexShrink: 0 }}>{c.help_note}</span>
            </div>
          ))}
        </div>
      )}

      {/* All Clients Table */}
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Todos os clientes</div>
      <div style={{ maxHeight: 240, overflowY: "auto", borderRadius: 8, border: `1px solid ${C.border}` }}>
        {clients.map((c, i) => {
          const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.ok;
          return (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderBottom: i < clients.length - 1 ? `1px solid ${C.border}` : "none", fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
                <div style={{ color: C.textDim, fontSize: 9 }}>
                  {c.projects} projetos · {((c.tokens_used / 1000) | 0)}k tokens · {c.last_active_hours != null ? (c.last_active_hours < 1 ? "ativo agora" : `${c.last_active_hours}h atras`) : "nunca usou"}
                </div>
              </div>
              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 600, background: `${cfg.color}18`, color: cfg.color, flexShrink: 0 }}>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Refresh */}
      <button onClick={loadDashboard} style={{ marginTop: 12, padding: "7px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 11, color: C.textMuted, cursor: "pointer", fontFamily: DM }}>
        Atualizar dados
      </button>
    </div>
  );
}

// ─── SETTINGS MODAL (with tabs) ──────────────────────────────────────────────
export default function SettingsModal({ licenseInfo, onClose, onLogout }) {
  const [tab, setTab] = useState("license");

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
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: SYNE, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Configuracoes</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 20, cursor: "pointer", padding: 4 }}>x</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.bg, borderRadius: 10, padding: 3 }}>
          {[
            { id: "license", label: "Minha Licenca" },
            { id: "admin", label: "Admin" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
              fontSize: 12, fontWeight: 600, fontFamily: DM, cursor: "pointer",
              transition: "all 0.2s",
              background: tab === t.id ? C.surface : "transparent",
              color: tab === t.id ? C.text : C.textDim,
              boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "license" && <MyLicenseTab licenseInfo={licenseInfo} onLogout={onLogout} />}
        {tab === "admin" && <AdminTab />}
      </div>
    </div>
  );
}
