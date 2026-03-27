import { useState, useRef, useEffect } from "react";

const NAV = {
  bg: "#1C1C1E",
  bar: "#2C2C2E",
  border: "#3A3A3C",
  text: "#E5E5EA",
  textDim: "#8E8E93",
  accent: "#0A84FF",
  btnHover: "#3A3A3C",
};

const BOOKMARKS = [
  { label: "Zero Preview", url: "https://zero-preview-six.vercel.app" },
  { label: "Railway Logs", url: "https://railway.app" },
  { label: "Supabase", url: "https://supabase.com/dashboard" },
  { label: "GitHub", url: "https://github.com/Eliasflpd/zero-preview" },
  { label: "Vercel", url: "https://vercel.com" },
];

function NavBtn({ children, onClick, disabled, title }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 30, height: 30, borderRadius: 6, border: "none",
        background: hovered && !disabled ? NAV.btnHover : "transparent",
        color: disabled ? NAV.textDim : NAV.text,
        fontSize: 15, cursor: disabled ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.1s, opacity 0.1s",
      }}
    >{children}</button>
  );
}

export default function Navegador() {
  const [url, setUrl] = useState("https://zero-preview-six.vercel.app");
  const [inputUrl, setInputUrl] = useState(url);
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [history, setHistory] = useState([url]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const iframeRef = useRef(null);

  const navegar = (novaUrl) => {
    let destino = novaUrl.trim();
    if (!destino) return;
    if (!destino.startsWith("http://") && !destino.startsWith("https://")) {
      destino = "https://" + destino;
    }
    setUrl(destino);
    setInputUrl(destino);
    setLoading(true);
    setIframeError(false);
    const newHistory = [...history.slice(0, historyIdx + 1), destino];
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  const voltar = () => {
    if (historyIdx <= 0) return;
    const idx = historyIdx - 1;
    setHistoryIdx(idx);
    setUrl(history[idx]);
    setInputUrl(history[idx]);
    setLoading(true);
    setIframeError(false);
  };

  const avancar = () => {
    if (historyIdx >= history.length - 1) return;
    const idx = historyIdx + 1;
    setHistoryIdx(idx);
    setUrl(history[idx]);
    setInputUrl(history[idx]);
    setLoading(true);
    setIframeError(false);
  };

  const recarregar = () => {
    setLoading(true);
    setIframeError(false);
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  };

  const abrirNovaAba = () => {
    window.open(url, "_blank");
  };

  // Timeout para detectar iframe bloqueado
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      if (loading) setIframeError(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [loading, url]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: NAV.bg, fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Barra de navegacao */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "8px 10px", background: NAV.bar,
        borderBottom: `1px solid ${NAV.border}`,
      }}>
        <NavBtn onClick={voltar} disabled={historyIdx <= 0} title="Voltar">{"\u2190"}</NavBtn>
        <NavBtn onClick={avancar} disabled={historyIdx >= history.length - 1} title="Avancar">{"\u2192"}</NavBtn>
        <NavBtn onClick={recarregar} title="Recarregar">{"\uD83D\uDD04"}</NavBtn>

        {/* Barra de endereco */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          background: NAV.bg, borderRadius: 8,
          border: `1px solid ${NAV.border}`, padding: "0 10px",
        }}>
          <span style={{ fontSize: 11, color: NAV.textDim, marginRight: 4 }}>{"\uD83D\uDD12"}</span>
          <input
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") navegar(inputUrl); }}
            style={{
              flex: 1, background: "transparent", border: "none",
              color: NAV.text, fontSize: 12, padding: "6px 0",
              outline: "none", fontFamily: "inherit",
            }}
          />
          {loading && (
            <div style={{
              width: 12, height: 12, border: `2px solid ${NAV.accent}`,
              borderTop: "2px solid transparent", borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
          )}
        </div>

        <NavBtn onClick={abrirNovaAba} title="Abrir em nova aba">{"\u2197"}</NavBtn>
      </div>

      {/* Bookmarks */}
      <div style={{
        display: "flex", gap: 4, padding: "4px 10px",
        borderBottom: `1px solid ${NAV.border}`,
        overflowX: "auto",
      }}>
        {BOOKMARKS.map(b => (
          <button key={b.url} onClick={() => navegar(b.url)} style={{
            padding: "3px 10px", borderRadius: 4, border: "none",
            background: url === b.url ? NAV.accent + "20" : "transparent",
            color: url === b.url ? NAV.accent : NAV.textDim,
            fontSize: 10, fontWeight: 500, cursor: "pointer",
            whiteSpace: "nowrap", fontFamily: "inherit",
          }}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Conteudo */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <iframe
          ref={iframeRef}
          src={url}
          onLoad={() => setLoading(false)}
          onError={() => setIframeError(true)}
          style={{
            width: "100%", height: "100%", border: "none",
            background: "#fff",
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="Navegador"
        />

        {/* Overlay de erro / bloqueio */}
        {iframeError && (
          <div style={{
            position: "absolute", inset: 0,
            background: NAV.bg, display: "flex",
            flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 12,
          }}>
            <span style={{ fontSize: 36 }}>{"\uD83D\uDEAB"}</span>
            <span style={{ fontSize: 13, color: NAV.text, fontWeight: 500 }}>
              Site bloqueou carregamento em iframe
            </span>
            <span style={{ fontSize: 11, color: NAV.textDim, maxWidth: 260, textAlign: "center" }}>
              {url}
            </span>
            <button onClick={abrirNovaAba} style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
              background: NAV.accent, color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              {"\u2197"} Abrir em nova aba
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
