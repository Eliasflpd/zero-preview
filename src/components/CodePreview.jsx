import { useEffect, useRef, useState } from 'react'

const GOOGLE_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>`

const APPEAR_ANIM = `
<style>
  @keyframes __zp_in { from { opacity:0; transform:translateY(14px) scale(.985); } to { opacity:1; transform:none; } }
  body { animation: __zp_in .5s cubic-bezier(.22,1,.36,1) both; }
</style>`

function wrapHtml(raw) {
  const lower = raw.trim().toLowerCase()
  if (lower.startsWith('<!doctype') || lower.startsWith('<html')) {
    // inject fonts + anim into existing HTML
    return raw
      .replace(/<head>/i, `<head>${GOOGLE_FONTS}${APPEAR_ANIM}`)
      .replace(/<\/head>/i, `${GOOGLE_FONTS}${APPEAR_ANIM}</head>`)
  }
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
${GOOGLE_FONTS}
${APPEAR_ANIM}
<style>
  *,*::before,*::after{box-sizing:border-box;}
  body{margin:0;padding:0;font-family:'DM Sans','Inter',sans-serif;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;}
</style>
</head>
<body>${raw}</body>
</html>`
}

const S = {
  wrap: { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' },
  tabBar: { display: 'flex', alignItems: 'center', height: '40px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', padding: '0 12px', gap: '4px', flexShrink: 0 },
  tab: { padding: '5px 14px', borderRadius: '6px', fontSize: '.78rem', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)', transition: 'all .15s', background: 'transparent', color: 'var(--muted)' },
  tabActive: { background: 'var(--bg3)', color: 'var(--text)' },
  tabSep: { flex: 1 },
  copyBtn: { padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted)', fontSize: '.72rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', transition: 'all .15s' },
  body: { flex: 1, position: 'relative', overflow: 'hidden' },
  iframe: { width: '100%', height: '100%', border: 'none', display: 'block', background: 'white' },
  codeWrap: { height: '100%', overflowY: 'auto', padding: '20px 24px', background: 'var(--bg)' },
  codePre: { fontFamily: 'var(--font-mono)', fontSize: '.78rem', lineHeight: 1.8, color: '#B8CFEA', whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
  // loading overlay
  loadOverlay: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', background: 'var(--bg)', zIndex: 10 },
  loadIcon: { width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg,#2D6BE4,#4A8FF0)', display: 'grid', placeItems: 'center', fontSize: '1.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'white', boxShadow: '0 0 30px rgba(45,107,228,.4)' },
  loadText: { fontFamily: 'var(--font-head)', fontSize: '1rem', fontWeight: 700, color: 'var(--text2)', letterSpacing: '-.01em' },
  loadSub: { fontSize: '.82rem', color: 'var(--muted)', fontWeight: 300 },
  barWrap: { width: '200px', height: '3px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' },
  // empty state
  empty: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', background: 'var(--bg)', color: 'var(--muted)', padding: '40px' },
  emptyIcon: { width: '64px', height: '64px', borderRadius: '16px', background: 'var(--bg3)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: '1.8rem' },
  emptyTitle: { fontFamily: 'var(--font-head)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text2)', textAlign: 'center' },
  emptySub: { fontSize: '.85rem', color: 'var(--muted)', textAlign: 'center', maxWidth: '300px', lineHeight: 1.6, fontWeight: 300 },
}

export default function CodePreview({ code, loading }) {
  const [tab, setTab] = useState('preview')
  const [copied, setCopied] = useState(false)
  const [barW, setBarW] = useState(0)
  const iframeRef = useRef(null)
  const timerRef = useRef(null)

  // anima a barra de loading
  useEffect(() => {
    if (loading) {
      setBarW(0)
      timerRef.current = setInterval(() => {
        setBarW(w => w >= 88 ? 88 : w + Math.random() * 6)
      }, 200)
    } else {
      setBarW(100)
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [loading])

  // injeta o HTML no iframe
  useEffect(() => {
    if (!code || !iframeRef.current) return
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
    if (!doc) return
    doc.open()
    doc.write(wrapHtml(code))
    doc.close()
  }, [code])

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={S.wrap}>
      {/* tab bar */}
      <div style={S.tabBar}>
        {['preview', 'codigo'].map(t => (
          <button
            key={t}
            style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }}
            onClick={() => setTab(t)}
          >
            {t === 'preview' ? 'Preview' : 'Codigo'}
          </button>
        ))}
        <div style={S.tabSep} />
        {code && (
          <button
            style={{ ...S.copyBtn, color: copied ? 'var(--green)' : 'var(--muted)' }}
            onClick={copyCode}
          >
            {copied ? '✓ copiado' : 'copiar'}
          </button>
        )}
      </div>

      {/* body */}
      <div style={S.body}>

        {/* loading overlay */}
        {loading && (
          <div style={S.loadOverlay}>
            <div style={S.loadIcon}>ZP</div>
            <div>
              <div style={S.loadText}>Gerando com IA...</div>
              <div style={S.loadSub}>Construindo seu {tab === 'preview' ? 'projeto' : 'codigo'}</div>
            </div>
            <div style={S.barWrap}>
              <div style={{ height: '100%', width: `${barW}%`, background: 'linear-gradient(90deg,#2D6BE4,#FFD050)', borderRadius: '2px', transition: 'width .2s ease' }} />
            </div>
          </div>
        )}

        {/* empty state */}
        {!loading && !code && (
          <div style={S.empty}>
            <div style={S.emptyIcon}>✦</div>
            <div style={S.emptyTitle}>Preview aparece aqui</div>
            <div style={S.emptySub}>Descreva no campo abaixo o que quer criar. A IA monta e exibe o resultado em tempo real.</div>
          </div>
        )}

        {/* preview iframe */}
        {tab === 'preview' && (
          <iframe
            ref={iframeRef}
            style={{ ...S.iframe, opacity: loading ? 0 : 1, transition: 'opacity .4s ease' }}
            sandbox="allow-scripts allow-same-origin"
            title="preview"
          />
        )}

        {/* codigo */}
        {tab === 'codigo' && !loading && code && (
          <div style={S.codeWrap}>
            <pre style={S.codePre}>{code}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
