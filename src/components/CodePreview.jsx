import { useState, useEffect, useRef } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

var BACKEND = 'https://zero-backend-production.up.railway.app'

// ── CAMADA 1: PRE-VALIDAÇÃO CIRÚRGICA ────────────────────────────────
function preValidate(code) {
  if (!code || !code.trim()) return 'Código vazio'
  var backticks = (code.match(/`/g) || []).length
  if (backticks > 0) {
    var line = code.split('\n').findIndex(function(l){ return l.indexOf('`') >= 0 })
    return 'Template literal (backtick) encontrado na linha ' + (line + 1)
  }
  if (!/export\s+default\s+function/.test(code)) return 'Componente sem export default function'
  var opens = (code.match(/\{/g) || []).length
  var closes = (code.match(/\}/g) || []).length
  if (Math.abs(opens - closes) > 2) return 'Chaves nao balanceadas: ' + opens + ' abre, ' + closes + ' fecha'
  return null
}

// ── CAMADA 2: AUTO-FIX EM 3 ESTRATÉGIAS ──────────────────────────────
async function fixStrategy1(code, error, licenseKey) {
  // Estratégia 1: Fix cirúrgico do erro específico
  var res = await fetch(BACKEND + '/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-license-key': licenseKey },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: 'You are an expert React JSX error fixer. Return ONLY the fixed raw JSX. ' +
        'OUTPUT: Start with exactly "export default function". End with "}". Nothing else. ' +
        'ZERO backticks. ZERO imports. ZERO className. Only style={{}} with plain strings. ' +
        'Fix ONLY the specific error mentioned. Keep everything else identical.',
      messages: [{ role: 'user', content: 'Error: ' + error + '\n\nCode:\n' + code.slice(0, 5000) }]
    })
  })
  var data = await res.json()
  return data.content && data.content[0] ? data.content[0].text.trim() : null
}

async function fixStrategy2(code, error, licenseKey) {
  // Estratégia 2: Reescrever o trecho problemático identificando o contexto
  var res = await fetch(BACKEND + '/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-license-key': licenseKey },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: 'You are an expert React JSX fixer. The previous fix attempt failed. ' +
        'This time, identify the ROOT CAUSE of the error and rewrite the affected section completely. ' +
        'Return ONLY complete fixed JSX starting with "export default function". ' +
        'ABSOLUTE RULES: ZERO backtick characters. ZERO imports. ZERO className. ' +
        'Use ONLY single/double quotes and + concatenation. style={{}} with plain strings only.',
      messages: [{ role: 'user', content: 'Previous fix failed. Root cause error: ' + error + '\n\nRewrite this:\n' + code.slice(0, 4000) }]
    })
  })
  var data = await res.json()
  return data.content && data.content[0] ? data.content[0].text.trim() : null
}

async function fixStrategy3(componentName, originalPrompt, existingStyle, licenseKey) {
  // Estratégia 3: Gerar do zero com prompt original + estilo dos outros componentes
  var res = await fetch(BACKEND + '/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-license-key': licenseKey },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: 'You are an expert React component engineer. ' +
        'Generate a SIMPLE, CLEAN, WORKING React component. ' +
        'Prioritize correctness over complexity. ' +
        'OUTPUT: Start with exactly "export default function". End with "}". Nothing else. ' +
        'CRITICAL: ZERO backtick characters anywhere. ZERO imports. ZERO className. ' +
        'Use ONLY style={{}} with plain string values. String concatenation with + only. ' +
        'Keep the component simple and focused — no complex state logic.',
      messages: [{ role: 'user', content: 'Create a simple working version of: ' + (originalPrompt || componentName) + '. ' + (existingStyle ? 'Match this visual style: ' + existingStyle : '') + '. Keep it simple and error-free.' }]
    })
  })
  var data = await res.json()
  return data.content && data.content[0] ? data.content[0].text.trim() : null
}

// ── CAMADA 4: FALLBACK VISUAL GARANTIDO ───────────────────────────────
function buildFallback(componentName) {
  return 'export default function ' + (componentName || 'Componente') + 'Fallback() {\n' +
    '  return (\n' +
    '    <div style={{\n' +
    '      minHeight: "200px",\n' +
    '      display: "flex",\n' +
    '      flexDirection: "column",\n' +
    '      alignItems: "center",\n' +
    '      justifyContent: "center",\n' +
    '      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",\n' +
    '      border: "1px solid rgba(74,222,128,0.2)",\n' +
    '      borderRadius: "12px",\n' +
    '      margin: "16px",\n' +
    '      padding: "40px",\n' +
    '      gap: "12px"\n' +
    '    }}>\n' +
    '      <div style={{ fontSize: "2rem" }}>⬡</div>\n' +
    '      <p style={{ color: "#4ade80", fontFamily: "system-ui", fontWeight: 700, margin: 0 }}>' + (componentName || 'Componente') + '</p>\n' +
    '      <p style={{ color: "#71717a", fontFamily: "system-ui", fontSize: "0.85rem", margin: 0, textAlign: "center" }}>Componente temporariamente indisponivel. Use o painel Claude para corrigir.</p>\n' +
    '    </div>\n' +
    '  )\n' +
    '}'
}

// ── SANDBOX HTML ──────────────────────────────────────────────────────
function getSandboxHTML() {
  var style = '<style>' +
    'body{min-height:100vh;display:flex;align-items:flex-start;justify-content:center;' +
    'background:#0a0a0f;font-family:system-ui,sans-serif;margin:0;}' +
    '#root{width:100%;}' +
    '.zp-err{padding:20px;color:#f87171;font-family:monospace;font-size:13px;' +
    'background:#1a0a0a;border:1px solid #7f1d1d;border-radius:8px;margin:16px;' +
    'white-space:pre-wrap;line-height:1.6;}' +
    '</style>'
  var script = '<script>' +
    'window.addEventListener("message",function(e){' +
    'if(typeof e.data!=="string")return;' +
    'var root=document.getElementById("root");' +
    'try{' +
    'var code=e.data;' +
    'code=code.replace(/^import\\s+.*?;?$/gm,"");' +
    'var isApp=/export\\s+default\\s+function\\s+App\\b/.test(code);' +
    'if(isApp){code=code.replace(/export\\s+default\\s+function\\s+App\\b/,"var __C__=function App");}' +
    'else{' +
    'code=code.replace(/export\\s+default\\s+function\\s+(\\w+)/,"var __C__=function $1");' +
    'code=code.replace(/export\\s+default\\s+function\\b/,"var __C__=function");' +
    'code=code.replace(/export\\s+default\\s+/,"var __C__=");' +
    '}' +
    'var t=Babel.transform(code,{presets:["react"]}).code;' +
    'var fn=new Function("React","ReactDOM","useState","useEffect","useRef","useCallback","useMemo",' +
    't+";return typeof __C__!==\\"undefined\\"?__C__:null;");' +
    'var Comp=fn(React,ReactDOM,React.useState,React.useEffect,React.useRef,React.useCallback,React.useMemo);' +
    'if(Comp){var c=document.createElement("div");root.innerHTML="";root.appendChild(c);' +
    'ReactDOM.createRoot(c).render(React.createElement(Comp));' +
    'window.parent.postMessage({type:"ok"},"*");}' +
    'else{root.innerHTML="<div class=\\"zp-err\\">Componente nao encontrado.</div>";' +
    'window.parent.postMessage({type:"err",msg:"Componente nao encontrado"},"*");}' +
    '}catch(err){' +
    'root.innerHTML="<div class=\\"zp-err\\">"+err.message+"</div>";' +
    'window.parent.postMessage({type:"err",msg:err.message},"*");}' +
    '});<\/script>'
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"/>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>' +
    '<script src="https://cdn.tailwindcss.com"><\/script>' +
    '<script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>' +
    '<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>' +
    '<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>' +
    style + '</head><body><div id="root"></div>' + script + '</body></html>'
}

// ── LIVE PREVIEW COM 5 CAMADAS ────────────────────────────────────────
function LivePreview({ code, componentName, originalPrompt, onCodeFixed, onOpenClaude, licenseKey }) {
  var iframeRef = useRef(null)

  // Estados das camadas
  var statusState = useState('idle') // idle | fixing1 | fixing2 | fixing3 | fallback | failed
  var status = statusState[0]; var setStatus = statusState[1]
  var strategyState = useState(0); var strategy = strategyState[0]; var setStrategy = strategyState[1]

  var activeCodeRef = useRef(code)
  var mountedRef = useRef(true)

  useEffect(function() { return function() { mountedRef.current = false } }, [])

  useEffect(function() {
    activeCodeRef.current = code
    setStatus('idle')
    setStrategy(0)
  }, [code])

  // ── Carregar iframe e pre-validar ─────────────────────────────────
  useEffect(function() {
    var iframe = iframeRef.current
    if (!iframe) return

    var preErr = preValidate(code)
    if (preErr && licenseKey && onCodeFixed) {
      runAutoFix(code, preErr, 0)
      return
    }

    var blob = new Blob([getSandboxHTML()], { type: 'text/html' })
    var url = URL.createObjectURL(blob)
    iframe.src = url
    iframe.onload = function() {
      try { iframe.contentWindow.postMessage(activeCodeRef.current, '*') } catch(e) {}
    }
    return function() { URL.revokeObjectURL(url) }
  }, [code])

  // ── Escutar erros do iframe ───────────────────────────────────────
  useEffect(function() {
    function onMsg(e) {
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type === 'ok') { if(mountedRef.current) setStatus('idle') }
      if (e.data.type === 'err') {
        if (licenseKey && onCodeFixed) {
          runAutoFix(activeCodeRef.current, e.data.msg || 'Runtime error', 0)
        } else {
          if(mountedRef.current) setStatus('failed')
        }
      }
    }
    window.addEventListener('message', onMsg)
    return function() { window.removeEventListener('message', onMsg) }
  }, [licenseKey, onCodeFixed])

  // ── Orquestrador das 3 estratégias de fix ────────────────────────
  async function runAutoFix(brokenCode, errorMsg, strategyIndex) {
    if (!mountedRef.current) return
    if (strategyIndex === 0) { setStatus('fixing1'); setStrategy(1) }
    else if (strategyIndex === 1) { setStatus('fixing2'); setStrategy(2) }
    else if (strategyIndex === 2) { setStatus('fixing3'); setStrategy(3) }
    else {
      // Camada 4: Fallback visual garantido
      var fallback = buildFallback(componentName)
      setStatus('fallback')
      onCodeFixed(fallback)
      return
    }

    try {
      var fixed = null
      if (strategyIndex === 0) fixed = await fixStrategy1(brokenCode, errorMsg, licenseKey)
      else if (strategyIndex === 1) fixed = await fixStrategy2(brokenCode, errorMsg, licenseKey)
      else if (strategyIndex === 2) fixed = await fixStrategy3(componentName, originalPrompt, '', licenseKey)

      if (!mountedRef.current) return

      if (fixed && fixed.trim() && fixed !== brokenCode && /export\s+default\s+function/.test(fixed)) {
        activeCodeRef.current = fixed
        onCodeFixed(fixed)
        // Tentar injetar no iframe sem reload
        try {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(fixed, '*')
          }
        } catch(ex) {}
      } else {
        // Estratégia falhou — tentar a próxima
        runAutoFix(brokenCode, errorMsg, strategyIndex + 1)
      }
    } catch(e) {
      if(mountedRef.current) runAutoFix(brokenCode, errorMsg, strategyIndex + 1)
    }
  }

  function openInNewTab() {
    var blob = new Blob([getSandboxHTML()], { type: 'text/html' })
    var url = URL.createObjectURL(blob)
    var win = window.open(url, '_blank')
    setTimeout(function() {
      if (win && !win.closed) win.postMessage(activeCodeRef.current, '*')
    }, 1500)
  }

  // ── Labels e cores por status ─────────────────────────────────────
  var statusConfig = {
    idle:     null,
    fixing1:  { label: 'Corrigindo erro (tentativa 1/3)...', color: '#4ade80', bg: 'rgba(10,26,10,0.96)', border: 'rgba(74,222,128,0.3)' },
    fixing2:  { label: 'Reescrevendo trecho problemático (2/3)...', color: '#f59e0b', bg: 'rgba(26,20,10,0.96)', border: 'rgba(245,158,11,0.3)' },
    fixing3:  { label: 'Gerando do zero (3/3)...', color: '#8b5cf6', bg: 'rgba(20,10,26,0.96)', border: 'rgba(139,92,246,0.3)' },
    fallback: { label: 'Usando placeholder — clique em Claude para ajuda', color: '#f59e0b', bg: 'rgba(26,20,10,0.96)', border: 'rgba(245,158,11,0.3)', icon: '⚠' },
    failed:   { label: 'Não foi possível corrigir — fale com o Claude', color: '#f87171', bg: 'rgba(26,10,10,0.96)', border: 'rgba(248,113,113,0.3)', icon: '✕' }
  }
  var cfg = statusConfig[status]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Badge de status do auto-fix */}
      {cfg && (
        <div style={{
          position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, background: cfg.bg, border: '1px solid ' + cfg.border,
          borderRadius: '10px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', whiteSpace: 'nowrap',
          maxWidth: '90%'
        }}>
          {/* Ícone ou spinner */}
          {(status === 'fixing1' || status === 'fixing2' || status === 'fixing3') ? (
            <span style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: cfg.color, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
          ) : (
            <span style={{ color: cfg.color, fontSize: '0.9rem', flexShrink: 0 }}>{cfg.icon}</span>
          )}
          <span style={{ color: cfg.color, fontSize: '0.78rem', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>{cfg.label}</span>
          {/* Camada 5: Botão para abrir Claude */}
          {(status === 'fallback' || status === 'failed') && onOpenClaude && (
            <button onClick={function() { onOpenClaude('Encontrei um erro no componente "' + (componentName || 'este componente') + '". Pode me explicar o problema e sugerir como corrigir?') }}
              style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', borderRadius: '6px', padding: '3px 10px', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600, flexShrink: 0 }}>
              ⬡ Pedir ajuda ao Claude
            </button>
          )}
        </div>
      )}

      {/* Botão Abrir */}
      <button onClick={openInNewTab} style={{
        position: 'absolute', top: '8px', right: '8px', zIndex: 10,
        background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
        color: '#4ade80', borderRadius: '6px', padding: '4px 10px',
        fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'monospace'
      }}>Abrir</button>

      <iframe ref={iframeRef} style={{ width: '100%', height: '100%', border: 'none' }} title="Preview" sandbox="allow-scripts allow-same-origin" />
    </div>
  )
}

// ── CODE PREVIEW PRINCIPAL ────────────────────────────────────────────
export default function CodePreview({ code, loading, onCodeFixed, licenseKey, componentName, originalPrompt, onOpenClaude }) {
  var tabState = useState('code'); var tab = tabState[0]; var setTab = tabState[1]
  useEffect(function() { if (code) setTab('preview') }, [code])

  if (loading) return (
    <div style={S.placeholder}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <span style={{ width: '24px', height: '24px', border: '2px solid rgba(74,222,128,0.2)', borderTopColor: '#4ade80', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
        <span style={S.pulse}>Gerando componente...</span>
      </div>
    </div>
  )

  if (!code) return (
    <div style={S.placeholder}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '2rem', color: 'rgba(74,222,128,0.15)' }}>⬡</span>
        <span style={S.empty}>Descreva um componente ou app completo na sidebar</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Ctrl+Enter para gerar</span>
      </div>
    </div>
  )

  return (
    <div style={S.wrap}>
      <div style={S.toolbar}>
        <div style={S.tabs}>
          <button style={Object.assign({}, S.tab, tab === 'code' ? S.tabActive : {})} onClick={function() { setTab('code') }}>{'</> Código'}</button>
          <button style={Object.assign({}, S.tab, tab === 'preview' ? S.tabActive : {})} onClick={function() { setTab('preview') }}>{'▶ Preview'}</button>
        </div>
        <button style={S.copy} onClick={function() { navigator.clipboard.writeText(code) }}>Copiar</button>
      </div>
      <div style={Object.assign({}, S.panel, { display: tab === 'code' ? 'flex' : 'none', background: '#1e1e1e' })}>
        <SyntaxHighlighter language="jsx" style={vscDarkPlus}
          customStyle={{ margin: 0, borderRadius: 0, background: 'transparent', fontSize: '0.83rem', lineHeight: '1.65', width: '100%' }}
          showLineNumbers lineNumberStyle={{ color: '#3a4255', minWidth: '2.5em' }}>
          {code}
        </SyntaxHighlighter>
      </div>
      <div style={Object.assign({}, S.panel, { display: tab === 'preview' ? 'flex' : 'none' })}>
        <LivePreview
          code={code}
          componentName={componentName}
          originalPrompt={originalPrompt}
          onCodeFixed={onCodeFixed}
          onOpenClaude={onOpenClaude}
          licenseKey={licenseKey}
        />
      </div>
    </div>
  )
}

var S = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, height: '44px' },
  tabs: { display: 'flex', gap: '4px', height: '100%', alignItems: 'center' },
  tab: { background: 'none', border: 'none', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '6px 14px', cursor: 'pointer', borderRadius: '4px', transition: 'all 0.15s' },
  tabActive: { background: 'var(--border)', color: 'var(--accent)', fontWeight: 700 },
  copy: { background: 'var(--border)', border: 'none', color: 'var(--text)', borderRadius: '4px', padding: '4px 14px', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' },
  panel: { flex: 1, overflow: 'auto', flexDirection: 'column' },
  placeholder: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
  empty: { color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontSize: '0.85rem', maxWidth: '240px', textAlign: 'center', lineHeight: 1.5 },
  pulse: { color: 'var(--accent)', fontFamily: 'var(--font-ui)', fontSize: '0.85rem' },
}
