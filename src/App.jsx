import { useState, useEffect, useRef } from 'react'
import Logo from './Logo.jsx'

// ── AUTO-FIX AGENT ───────────────────────────────────────────────────
async function autoFixCode(brokenCode, errorMessage, licenseKey) {
  var system = 'You are a React JSX error fixer. ' +
    'You receive broken JSX code and an error message. ' +
    'Return ONLY the fixed code, no explanation, no markdown. ' +
    'STRICT RULES: ' +
    'No template literals (backticks). ' +
    'No imports. No className. No Tailwind. ' +
    'Use only inline styles and string concatenation with +. ' +
    'Start directly with: export default function'
  var prompt = 'Fix this error: ' + errorMessage + '\n\nBroken code:\n' + brokenCode
  var res = await fetch('https://zero-backend-production.up.railway.app/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-license-key': licenseKey },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: system,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  var data = await res.json()
  return data.content && data.content[0] ? data.content[0].text : brokenCode
}

// ── TOAST SYSTEM ─────────────────────────────────────────────────────
function ToastContainer({toasts}){
  return(
    <div style={{position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%)',zIndex:99998,display:'flex',flexDirection:'column',gap:'8px',alignItems:'center',pointerEvents:'none'}}>
      {toasts.map(function(t){
        var bg = t.type==='error'?'#ef4444':t.type==='warning'?'#f59e0b':'#18181b'
        var border = t.type==='error'?'#ef444466':t.type==='warning'?'#f59e0b66':'#3f3f46'
        var icon = t.type==='error'?'✕':t.type==='warning'?'⚠':t.type==='success'?'✓':'⬡'
        var iconColor = t.type==='error'?'#fca5a5':t.type==='warning'?'#fde68a':t.type==='success'?'#4ade80':'#4ade80'
        return(
          <div key={t.id} style={{background:bg,border:'1px solid '+border,borderRadius:'10px',padding:'10px 18px',display:'flex',alignItems:'center',gap:'10px',boxShadow:'0 8px 32px rgba(0,0,0,0.5)',animation:'fadeIn 0.2s ease',pointerEvents:'auto',maxWidth:'420px',backdropFilter:'blur(8px)'}}>
            <span style={{color:iconColor,fontSize:'0.85rem',fontWeight:700,flexShrink:0}}>{icon}</span>
            <span style={{color:'#fafafa',fontSize:'0.83rem',fontFamily:'var(--font-ui)',lineHeight:1.4}}>{t.message}</span>
            {t.duration&&<span style={{color:'#71717a',fontSize:'0.72rem',fontFamily:'var(--font-mono)',flexShrink:0,marginLeft:'4px'}}>{t.duration}</span>}
          </div>
        )
      })}
    </div>
  )
}

function useToast(){
  var toastsState = useState([]); var toasts = toastsState[0]; var setToasts = toastsState[1]
  function addToast(message, type, duration){
    var id = Date.now()
    var toast = {id:id, message:message, type:type||'info', duration:duration||null}
    setToasts(function(prev){return prev.concat([toast])})
    setTimeout(function(){setToasts(function(prev){return prev.filter(function(t){return t.id!==id})})}, 3500)
    return id
  }
  function toast(msg){ return addToast(msg,'info') }
  toast.success = function(msg,dur){ return addToast(msg,'success',dur) }
  toast.error = function(msg){ return addToast(msg,'error') }
  toast.warning = function(msg){ return addToast(msg,'warning') }
  return {toasts:toasts, toast:toast}
}

// ── CMD+K COMMAND PALETTE ────────────────────────────────────────────
var CMD_ACTIONS = [
  {id:'new-project',  label:'Novo projeto',         icon:'⊕', group:'Projetos',   key:'N'},
  {id:'search',       label:'Buscar projetos',       icon:'🔍',group:'Projetos',   key:'F'},
  {id:'starred',      label:'Ver estrelados',         icon:'★', group:'Projetos'},
  {id:'new-folder',   label:'Nova pasta',            icon:'📁',group:'Projetos'},
  {id:'undo',         label:'Desfazer',              icon:'↩', group:'Editor',    key:'Z'},
  {id:'preview',      label:'Pre-visualizacao',      icon:'▶', group:'Editor',    key:'P'},
  {id:'desktop',      label:'Visualizar: Desktop',   icon:'🖥', group:'Dispositivo'},
  {id:'tablet',       label:'Visualizar: Tablet',    icon:'⬜',group:'Dispositivo'},
  {id:'mobile',       label:'Visualizar: Mobile',    icon:'📱',group:'Dispositivo'},
  {id:'app-view',     label:'Ver App Completo',      icon:'⊞', group:'Editor'},
  {id:'export-zip',   label:'Exportar ZIP',          icon:'⬇', group:'Editor',    key:'E'},
  {id:'deploy',       label:'Deploy no Vercel',      icon:'🚀',group:'Editor'},
  {id:'share',        label:'Compartilhar link',     icon:'⬡', group:'Editor'},
  {id:'publish',      label:'Publicar / Despublicar',icon:'◉', group:'Editor'},
  {id:'shortcuts',    label:'Ver atalhos de teclado',icon:'⌨', group:'Ajuda'},
]

function CommandPalette({open, onClose, onAction, screen}){
  var queryState = useState(''); var query = queryState[0]; var setQuery = queryState[1]
  var selectedState = useState(0); var selected = selectedState[0]; var setSelected = selectedState[1]
  var inputRef = useRef(null)

  useEffect(function(){
    if(open){ setQuery(''); setSelected(0); setTimeout(function(){if(inputRef.current)inputRef.current.focus()},50) }
  },[open])

  var filtered = CMD_ACTIONS.filter(function(a){
    var q = query.toLowerCase()
    if(!q) return true
    return a.label.toLowerCase().indexOf(q)>=0 || a.group.toLowerCase().indexOf(q)>=0
  })

  var groups = {}
  filtered.forEach(function(a){
    if(!groups[a.group]) groups[a.group]=[]
    groups[a.group].push(a)
  })

  function handleKey(e){
    if(e.key==='ArrowDown'){e.preventDefault();setSelected(function(s){return Math.min(s+1,filtered.length-1)})}
    if(e.key==='ArrowUp'){e.preventDefault();setSelected(function(s){return Math.max(s-1,0)})}
    if(e.key==='Enter'){e.preventDefault();if(filtered[selected]){onAction(filtered[selected].id);onClose()}}
    if(e.key==='Escape'){onClose()}
  }

  if(!open) return null
  var flatIndex = 0
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:99999,display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:'15vh',backdropFilter:'blur(4px)'}} onClick={onClose}>
      <div style={{width:'560px',background:'#18181b',border:'1px solid #3f3f46',borderRadius:'14px',boxShadow:'0 24px 64px rgba(0,0,0,0.8)',overflow:'hidden',animation:'fadeIn 0.15s ease'}} onClick={function(e){e.stopPropagation()}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'14px 16px',borderBottom:'1px solid #27272a'}}>
          <span style={{color:'#71717a',fontSize:'0.9rem',flexShrink:0}}>⌘</span>
          <input ref={inputRef} value={query} onChange={function(e){setQuery(e.target.value);setSelected(0)}} onKeyDown={handleKey} placeholder="O que você quer fazer?" style={{flex:1,background:'transparent',border:'none',color:'#fafafa',fontFamily:'var(--font-ui)',fontSize:'0.95rem',outline:'none'}}/>
          <kbd style={{background:'#27272a',border:'1px solid #3f3f46',borderRadius:'5px',padding:'2px 7px',fontSize:'0.7rem',color:'#71717a',fontFamily:'var(--font-mono)',flexShrink:0}}>ESC</kbd>
        </div>
        <div style={{maxHeight:'360px',overflowY:'auto',padding:'6px'}}>
          {Object.keys(groups).map(function(group){
            return(
              <div key={group}>
                <p style={{fontSize:'0.65rem',color:'#52525b',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,padding:'8px 10px 4px',fontFamily:'var(--font-mono)'}}>{group}</p>
                {groups[group].map(function(action){
                  var idx = flatIndex++
                  var isSelected = idx===selected
                  return(
                    <button key={action.id} onClick={function(){onAction(action.id);onClose()}} onMouseEnter={function(){setSelected(idx)}}
                      style={{display:'flex',alignItems:'center',gap:'12px',width:'100%',background:isSelected?'rgba(74,222,128,0.08)':'transparent',border:'none',borderRadius:'8px',padding:'9px 10px',cursor:'pointer',textAlign:'left',transition:'background 0.1s'}}>
                      <span style={{fontSize:'0.85rem',width:'20px',textAlign:'center',flexShrink:0}}>{action.icon}</span>
                      <span style={{flex:1,fontSize:'0.87rem',color:isSelected?'#fafafa':'#a1a1aa',fontFamily:'var(--font-ui)'}}>{action.label}</span>
                      {action.key&&<kbd style={{background:'#27272a',border:'1px solid #3f3f46',borderRadius:'4px',padding:'1px 6px',fontSize:'0.65rem',color:'#71717a',fontFamily:'var(--font-mono)',flexShrink:0}}>{'⌘'+action.key}</kbd>}
                    </button>
                  )
                })}
              </div>
            )
          })}
          {filtered.length===0&&<p style={{color:'#52525b',fontSize:'0.85rem',textAlign:'center',padding:'24px',fontFamily:'var(--font-ui)'}}>Nenhum resultado encontrado.</p>}
        </div>
      </div>
    </div>
  )
}

// ── SHORTCUTS HELP MODAL ─────────────────────────────────────────────
function ShortcutsModal({onClose}){
  var shortcuts=[
    {key:'⌘K',desc:'Abrir command palette'},
    {key:'⌘Enter',desc:'Gerar componente'},
    {key:'⌘Z',desc:'Desfazer'},
    {key:'⌘P',desc:'Pre-visualizacao'},
    {key:'⌘E',desc:'Exportar ZIP'},
    {key:'⌘/',desc:'Mostrar atalhos'},
    {key:'ESC',desc:'Fechar modais'},
    {key:'↑↓',desc:'Navegar no palette'},
  ]
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}} onClick={onClose}>
      <div style={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:'14px',padding:'24px',width:'380px',boxShadow:'0 24px 64px rgba(0,0,0,0.8)',animation:'fadeIn 0.15s ease'}} onClick={function(e){e.stopPropagation()}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
          <h3 style={{fontSize:'1rem',fontWeight:600,color:'#fafafa',margin:0,fontFamily:'var(--font-ui)'}}>Atalhos de teclado</h3>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#71717a',cursor:'pointer',fontSize:'1rem'}}>✕</button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
          {shortcuts.map(function(s,i){
            return(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',borderRadius:'7px',background:i%2===0?'rgba(255,255,255,0.02)':'transparent'}}>
                <span style={{fontSize:'0.85rem',color:'#a1a1aa',fontFamily:'var(--font-ui)'}}>{s.desc}</span>
                <kbd style={{background:'#27272a',border:'1px solid #3f3f46',borderRadius:'5px',padding:'3px 10px',fontSize:'0.72rem',color:'#d4d4d8',fontFamily:'var(--font-mono)'}}>{s.key}</kbd>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


// ── MODAL GLOBAL (substitui todos os window.prompt) ──────────────────
function Modal({title, placeholder, defaultValue, onConfirm, onCancel, confirmLabel, children}){
  var valState = useState(defaultValue||''); var val = valState[0]; var setVal = valState[1]
  useEffect(function(){
    var el = document.getElementById('zp-modal-input')
    if(el) { el.focus(); el.select() }
  }, [])
  function handleKey(e){
    if(e.key==='Enter') { e.preventDefault(); if(val.trim()) onConfirm(val.trim()) }
    if(e.key==='Escape') onCancel()
  }
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}} onClick={onCancel}>
      <div style={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:'14px',padding:'24px',width:'420px',boxShadow:'0 20px 60px rgba(0,0,0,0.8)',animation:'fadeIn 0.15s ease'}} onClick={function(e){e.stopPropagation()}}>
        <h3 style={{fontSize:'1rem',fontWeight:600,color:'#fafafa',margin:'0 0 16px',fontFamily:'var(--font-ui)'}}>{title}</h3>
        {children}
        {placeholder!==undefined&&(
          <input id="zp-modal-input" value={val} onChange={function(e){setVal(e.target.value)}} onKeyDown={handleKey} placeholder={placeholder} style={{width:'100%',background:'#09090b',border:'1px solid #3f3f46',borderRadius:'8px',color:'#fafafa',fontFamily:'var(--font-ui)',fontSize:'0.9rem',padding:'11px 14px',outline:'none',marginBottom:'16px',boxSizing:'border-box'}}/>
        )}
        <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
          <button onClick={onCancel} style={{background:'transparent',border:'1px solid #3f3f46',color:'#a1a1aa',borderRadius:'8px',padding:'8px 18px',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:'0.85rem',fontWeight:500}}>Cancelar</button>
          <button onClick={function(){if(!placeholder||val.trim())onConfirm(val.trim())}} style={{background:'#4ade80',color:'#000',border:'none',borderRadius:'8px',padding:'8px 18px',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:'0.85rem',fontWeight:700}}>{confirmLabel||'Confirmar'}</button>
        </div>
      </div>
    </div>
  )
}

// ── SEARCH BAR INLINE ─────────────────────────────────────────────────
function SearchBar({value, onChange, onClose}){
  var ref = useRef(null)
  useEffect(function(){ if(ref.current) ref.current.focus() }, [])
  return(
    <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#18181b',border:'1px solid #4ade8066',borderRadius:'8px',padding:'4px 12px',flex:1,maxWidth:'320px'}}>
      <span style={{color:'#71717a',fontSize:'0.85rem'}}>🔍</span>
      <input ref={ref} value={value} onChange={function(e){onChange(e.target.value)}} placeholder="Buscar projetos..." onKeyDown={function(e){if(e.key==='Escape'){onChange('');onClose()}}} style={{background:'transparent',border:'none',color:'#fafafa',fontFamily:'var(--font-ui)',fontSize:'0.85rem',outline:'none',flex:1,padding:'4px 0'}}/>
      {value&&<button onClick={function(){onChange('');onClose()}} style={{background:'none',border:'none',color:'#71717a',cursor:'pointer',fontSize:'0.8rem',padding:'2px 4px'}}>✕</button>}
    </div>
  )
}


// ── TEMPLATES PRONTOS COM CODIGO EMBUTIDO ────────────────────────────
var TEMPLATES = [
  {
    id: 'landing',
    name: 'Landing Page',
    desc: 'Pagina de vendas premium com hero e features',
    icon: '🚀',
    color: '#6366f1',
    code: "export default function LandingHero() {\n  var btnState = useState(false)\n  var hovered = btnState[0]\n  var setHovered = btnState[1]\n  return (\n    <div style={{ background: '#09090b', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>\n      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: '64px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(12px)', zIndex: 10 }}>\n        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>\n          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '8px' }} />\n          <span style={{ color: '#fafafa', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>Nexus</span>\n        </div>\n        <div style={{ display: 'flex', gap: '32px' }}>\n          {['Produto', 'Preco', 'Sobre', 'Blog'].map(function(item) {\n            return <a key={item} style={{ color: '#a1a1aa', fontSize: '0.85rem', textDecoration: 'none', cursor: 'pointer' }}>{item}</a>\n          })}\n        </div>\n        <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>Comecar gratis</button>\n      </nav>\n      <section style={{ textAlign: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>\n        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />\n        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '99px', padding: '5px 14px', marginBottom: '28px' }}>\n          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />\n          <span style={{ color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 500 }}>Novo: Integracao com IA agora disponivel</span>\n        </div>\n        <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#fafafa', margin: '0 0 20px', letterSpacing: '-0.05em', lineHeight: 1.1, maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}>\n          Construa produtos\n          <span style={{ display: 'block', background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>que as pessoas amam</span>\n        </h1>\n        <p style={{ color: '#71717a', fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto 40px', lineHeight: 1.7 }}>Plataforma completa para times modernos. Do prototipo ao deploy em minutos.</p>\n        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>\n          <button onMouseEnter={function() { setHovered(true) }} onMouseLeave={function() { setHovered(false) }} style={{ background: hovered ? '#4f46e5' : '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px 28px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 40px rgba(99,102,241,0.4)', transition: 'all 0.2s' }}>Comecar agora gratis</button>\n          <button style={{ background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '13px 28px', fontSize: '0.95rem', cursor: 'pointer' }}>Ver demonstracao</button>\n        </div>\n        <p style={{ color: '#3f3f46', fontSize: '0.78rem', marginTop: '20px' }}>Sem cartao de credito. Cancele quando quiser.</p>\n      </section>\n      <section style={{ padding: '60px 48px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>\n        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>\n          {[\n            { icon: '\u26a1', title: 'Velocidade extrema', desc: 'Deploy em segundos. Infraestrutura que escala automaticamente com seu crescimento.' },\n            { icon: '\ud83d\udd12', title: 'Seguranca total', desc: 'Criptografia de ponta a ponta. Seus dados nunca estao expostos.' },\n            { icon: '\ud83c\udfaf', title: 'Analytics em tempo real', desc: 'Dashboards interativos com insights acionaveis para seu negocio.' }\n          ].map(function(f) {\n            return (\n              <div key={f.title} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px' }}>\n                <div style={{ fontSize: '1.8rem', marginBottom: '14px' }}>{f.icon}</div>\n                <h3 style={{ color: '#fafafa', fontWeight: 700, fontSize: '1rem', margin: '0 0 10px' }}>{f.title}</h3>\n                <p style={{ color: '#71717a', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>\n              </div>\n            )\n          })}\n        </div>\n      </section>\n    </div>\n  )\n}"
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    desc: 'Painel admin com metricas, grafico e tabela',
    icon: '📊',
    color: '#38bdf8',
    code: "export default function Dashboard() {\n  var activeState = useState('dashboard')\n  var active = activeState[0]; var setActive = activeState[1]\n  var nav = ['Dashboard', 'Relatorios', 'Clientes', 'Produtos', 'Configuracoes']\n  var metrics = [\n    { label: 'Receita Total', value: 'R$ 84.320', change: '+12.5%', up: true, color: '#4ade80' },\n    { label: 'Novos Clientes', value: '1.284', change: '+8.2%', up: true, color: '#818cf8' },\n    { label: 'Pedidos', value: '3.847', change: '+23.1%', up: true, color: '#38bdf8' },\n    { label: 'Taxa de Retencao', value: '94.2%', change: '-1.3%', up: false, color: '#fb923c' }\n  ]\n  var rows = [\n    { name: 'Ana Carolina', email: 'ana@email.com', valor: 'R$ 1.240', status: 'Pago', color: '#4ade80' },\n    { name: 'Bruno Martins', email: 'bruno@email.com', valor: 'R$ 890', status: 'Pendente', color: '#f59e0b' },\n    { name: 'Carla Souza', email: 'carla@email.com', valor: 'R$ 2.100', status: 'Pago', color: '#4ade80' },\n    { name: 'Diego Lima', email: 'diego@email.com', valor: 'R$ 450', status: 'Cancelado', color: '#f87171' },\n    { name: 'Elena Costa', email: 'elena@email.com', valor: 'R$ 3.300', status: 'Pago', color: '#4ade80' }\n  ]\n  var bars = [65, 45, 78, 52, 89, 43, 76]\n  var days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']\n  return (\n    <div style={{ display: 'flex', height: '100vh', background: '#09090b', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>\n      <aside style={{ width: '220px', background: '#111113', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>\n        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>\n          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>\n            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', borderRadius: '8px' }} />\n            <span style={{ color: '#fafafa', fontWeight: 700, fontSize: '0.95rem' }}>AdminPro</span>\n          </div>\n        </div>\n        <nav style={{ padding: '12px 10px', flex: 1 }}>\n          {nav.map(function(item) {\n            var isA = active === item.toLowerCase()\n            return (\n              <button key={item} onClick={function() { setActive(item.toLowerCase()) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none', background: isA ? 'rgba(56,189,248,0.1)' : 'transparent', color: isA ? '#38bdf8' : '#71717a', fontSize: '0.83rem', fontWeight: isA ? 600 : 400, cursor: 'pointer', marginBottom: '2px', textAlign: 'left', transition: 'all 0.15s' }}>\n                {item}\n              </button>\n            )\n          })}\n        </nav>\n        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>\n          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>\n            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>A</div>\n            <div>\n              <p style={{ color: '#fafafa', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Admin</p>\n              <p style={{ color: '#52525b', fontSize: '0.7rem', margin: 0 }}>admin@nexus.com</p>\n            </div>\n          </div>\n        </div>\n      </aside>\n      <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>\n        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>\n          <div>\n            <h1 style={{ color: '#fafafa', fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Dashboard</h1>\n            <p style={{ color: '#52525b', fontSize: '0.8rem', margin: '4px 0 0' }}>21 de marco de 2026</p>\n          </div>\n          <button style={{ background: '#38bdf8', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>Exportar</button>\n        </div>\n        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>\n          {metrics.map(function(m) {\n            return (\n              <div key={m.label} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>\n                <p style={{ color: '#71717a', fontSize: '0.75rem', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</p>\n                <p style={{ color: '#fafafa', fontSize: '1.7rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>{m.value}</p>\n                <span style={{ fontSize: '0.75rem', color: m.up ? '#4ade80' : '#f87171', fontWeight: 600 }}>{m.change}</span>\n              </div>\n            )\n          })}\n        </div>\n        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', marginBottom: '20px' }}>\n          <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>\n            <h3 style={{ color: '#fafafa', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 20px' }}>Vendas da Semana</h3>\n            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '120px' }}>\n              {bars.map(function(h, i) {\n                return (\n                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>\n                    <div style={{ width: '100%', height: h + '%', background: i === 4 ? 'linear-gradient(180deg, #38bdf8, #818cf8)' : 'rgba(56,189,248,0.2)', borderRadius: '6px 6px 0 0', transition: 'all 0.3s' }} />\n                    <span style={{ color: '#52525b', fontSize: '0.65rem' }}>{days[i]}</span>\n                  </div>\n                )\n              })}\n            </div>\n          </div>\n          <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>\n            <h3 style={{ color: '#fafafa', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 16px' }}>Distribuicao</h3>\n            {[['Online', 68, '#38bdf8'], ['Loja Fisica', 24, '#818cf8'], ['Parceiros', 8, '#4ade80']].map(function(item) {\n              return (\n                <div key={item[0]} style={{ marginBottom: '14px' }}>\n                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>\n                    <span style={{ color: '#a1a1aa', fontSize: '0.78rem' }}>{item[0]}</span>\n                    <span style={{ color: '#fafafa', fontSize: '0.78rem', fontWeight: 600 }}>{item[1]}%</span>\n                  </div>\n                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>\n                    <div style={{ width: item[1] + '%', height: '100%', background: item[2], borderRadius: '99px' }} />\n                  </div>\n                </div>\n              )\n            })}\n          </div>\n        </div>\n        <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>\n          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>\n            <h3 style={{ color: '#fafafa', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Transacoes Recentes</h3>\n            <span style={{ color: '#38bdf8', fontSize: '0.78rem', cursor: 'pointer' }}>Ver tudo</span>\n          </div>\n          <table style={{ width: '100%', borderCollapse: 'collapse' }}>\n            <thead>\n              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>\n                {['Cliente', 'Email', 'Valor', 'Status'].map(function(h) {\n                  return <th key={h} style={{ color: '#52525b', fontSize: '0.72rem', fontWeight: 600, padding: '10px 20px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>\n                })}\n              </tr>\n            </thead>\n            <tbody>\n              {rows.map(function(r) {\n                return (\n                  <tr key={r.name} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>\n                    <td style={{ padding: '12px 20px', color: '#fafafa', fontSize: '0.83rem', fontWeight: 500 }}>{r.name}</td>\n                    <td style={{ padding: '12px 20px', color: '#71717a', fontSize: '0.83rem' }}>{r.email}</td>\n                    <td style={{ padding: '12px 20px', color: '#fafafa', fontSize: '0.83rem', fontWeight: 600 }}>{r.valor}</td>\n                    <td style={{ padding: '12px 20px' }}>\n                      <span style={{ background: r.color + '18', color: r.color, border: '1px solid ' + r.color + '33', borderRadius: '99px', padding: '3px 10px', fontSize: '0.7rem', fontWeight: 600 }}>{r.status}</span>\n                    </td>\n                  </tr>\n                )\n              })}\n            </tbody>\n          </table>\n        </div>\n      </main>\n    </div>\n  )\n}"
  },
  {
    id: 'igreja',
    name: 'Gestao de Igreja',
    desc: 'Sistema completo Eklesia com sidebar dourada',
    icon: '✦',
    color: '#f59e0b',
    code: "export default function EklesiaApp() {\n  var tabState = useState('dashboard')\n  var tab = tabState[0]; var setTab = tabState[1]\n  var nav = [\n    { id: 'dashboard', label: 'Dashboard', icon: '\u229e' },\n    { id: 'membros', label: 'Membros', icon: '\u2295' },\n    { id: 'celulas', label: 'Celulas', icon: '\u25ce' },\n    { id: 'financeiro', label: 'Financeiro', icon: '\u25c8' },\n    { id: 'agenda', label: 'Agenda', icon: '\u25f7' }\n  ]\n  var stats = [\n    { label: 'Membros Ativos', value: '842', icon: '\u2295', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },\n    { label: 'Celulas Ativas', value: '34', icon: '\u25ce', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },\n    { label: 'Visitantes', value: '127', icon: '\u2726', color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.2)' },\n    { label: 'Ofertas do Mes', value: 'R$ 28.450', icon: '\u25c8', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' }\n  ]\n  var membros = [\n    { nome: 'Pr. Josias Ferreira', cargo: 'Pastor Titular', status: 'Ativo', batizado: true },\n    { nome: 'Ana Paula Costa', cargo: 'Lider de Celula', status: 'Ativo', batizado: true },\n    { nome: 'Marcos Vinicius', cargo: 'Membro', status: 'Ativo', batizado: true },\n    { nome: 'Lidia Santos', cargo: 'Visitante', status: 'Novo', batizado: false },\n    { nome: 'Roberto Alves', cargo: 'Diacono', status: 'Ativo', batizado: true }\n  ]\n  return (\n    <div style={{ display: 'flex', height: '100vh', background: '#0a0f1e', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>\n      <aside style={{ width: '230px', background: '#0d1426', borderRight: '1px solid rgba(245,158,11,0.1)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>\n        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(245,158,11,0.08)' }}>\n          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>\n            <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>\u2726</div>\n            <div>\n              <p style={{ color: '#fafafa', fontWeight: 800, fontSize: '0.95rem', margin: 0, letterSpacing: '-0.02em' }}>Eklesia</p>\n              <p style={{ color: '#52525b', fontSize: '0.65rem', margin: 0 }}>Gestao de Igreja</p>\n            </div>\n          </div>\n        </div>\n        <nav style={{ padding: '12px 10px', flex: 1 }}>\n          {nav.map(function(item) {\n            var isA = tab === item.id\n            return (\n              <button key={item.id} onClick={function() { setTab(item.id) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none', background: isA ? 'rgba(245,158,11,0.1)' : 'transparent', color: isA ? '#f59e0b' : '#52525b', fontSize: '0.83rem', fontWeight: isA ? 600 : 400, cursor: 'pointer', marginBottom: '2px', textAlign: 'left', transition: 'all 0.15s', borderLeft: isA ? '2px solid #f59e0b' : '2px solid transparent' }}>\n                <span style={{ fontSize: '0.9rem', width: '16px', textAlign: 'center' }}>{item.icon}</span>\n                {item.label}\n              </button>\n            )\n          })}\n        </nav>\n        <div style={{ padding: '16px', borderTop: '1px solid rgba(245,158,11,0.08)' }}>\n          <p style={{ color: '#3f3f46', fontSize: '0.68rem', textAlign: 'center', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>\n            \"Edificai uns aos outros\"\n          </p>\n        </div>\n      </aside>\n      <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px', background: '#0a0f1e' }}>\n        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>\n          <div>\n            <h1 style={{ color: '#fafafa', fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>\n              {nav.find(function(n) { return n.id === tab }) ? nav.find(function(n) { return n.id === tab }).label : 'Dashboard'}\n            </h1>\n            <p style={{ color: '#3f3f46', fontSize: '0.78rem', margin: '3px 0 0' }}>Igreja Evangelica da Graca</p>\n          </div>\n          <button style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}>+ Adicionar</button>\n        </div>\n        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>\n          {stats.map(function(s) {\n            return (\n              <div key={s.label} style={{ background: '#0d1426', border: '1px solid ' + s.border, borderRadius: '14px', padding: '20px' }}>\n                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>\n                  <span style={{ color: '#52525b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>\n                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: s.bg, border: '1px solid ' + s.border, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: '0.85rem' }}>{s.icon}</div>\n                </div>\n                <p style={{ color: '#fafafa', fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>{s.value}</p>\n              </div>\n            )\n          })}\n        </div>\n        <div style={{ background: '#0d1426', border: '1px solid rgba(245,158,11,0.1)', borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }}>\n          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(245,158,11,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>\n            <h3 style={{ color: '#fafafa', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Membros Recentes</h3>\n            <span style={{ color: '#f59e0b', fontSize: '0.78rem', cursor: 'pointer' }}>Ver todos</span>\n          </div>\n          <table style={{ width: '100%', borderCollapse: 'collapse' }}>\n            <thead>\n              <tr style={{ background: 'rgba(245,158,11,0.03)' }}>\n                {['Nome', 'Cargo', 'Batizado', 'Status'].map(function(h) {\n                  return <th key={h} style={{ color: '#3f3f46', fontSize: '0.7rem', fontWeight: 600, padding: '10px 20px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>\n                })}\n              </tr>\n            </thead>\n            <tbody>\n              {membros.map(function(m) {\n                return (\n                  <tr key={m.nome} style={{ borderTop: '1px solid rgba(245,158,11,0.05)' }}>\n                    <td style={{ padding: '12px 20px' }}>\n                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>\n                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b44, #d9770644)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>\n                          {m.nome.charAt(0)}\n                        </div>\n                        <span style={{ color: '#fafafa', fontSize: '0.83rem', fontWeight: 500 }}>{m.nome}</span>\n                      </div>\n                    </td>\n                    <td style={{ padding: '12px 20px', color: '#71717a', fontSize: '0.8rem' }}>{m.cargo}</td>\n                    <td style={{ padding: '12px 20px' }}>\n                      <span style={{ color: m.batizado ? '#34d399' : '#52525b', fontSize: '0.8rem' }}>{m.batizado ? 'Sim' : 'Nao'}</span>\n                    </td>\n                    <td style={{ padding: '12px 20px' }}>\n                      <span style={{ background: m.status === 'Ativo' ? 'rgba(52,211,153,0.1)' : 'rgba(129,140,248,0.1)', color: m.status === 'Ativo' ? '#34d399' : '#818cf8', border: '1px solid ' + (m.status === 'Ativo' ? 'rgba(52,211,153,0.2)' : 'rgba(129,140,248,0.2)'), borderRadius: '99px', padding: '3px 10px', fontSize: '0.7rem', fontWeight: 600 }}>{m.status}</span>\n                    </td>\n                  </tr>\n                )\n              })}\n            </tbody>\n          </table>\n        </div>\n        <div style={{ background: '#0d1426', border: '1px solid rgba(245,158,11,0.1)', borderRadius: '14px', padding: '20px' }}>\n          <h3 style={{ color: '#fafafa', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 16px' }}>Versiculo do Dia</h3>\n          <p style={{ color: '#f59e0b', fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.7, margin: '0 0 8px' }}>\n            \"Nao se inquietem com nada, mas em tudo, pela oracao e suplica, com accao de gracas, apresentem seus pedidos a Deus.\"\n          </p>\n          <p style={{ color: '#52525b', fontSize: '0.78rem', margin: 0 }}>Filipenses 4:6</p>\n        </div>\n      </main>\n    </div>\n  )\n}"
  },
  {
    id: 'saas',
    name: 'Login SaaS',
    desc: 'Tela de login premium com Google OAuth',
    icon: '⚡',
    color: '#8b5cf6',
    code: "export default function LoginSaaS() {\n  var emailState = useState('')\n  var passState = useState('')\n  var email = emailState[0]; var setEmail = emailState[1]\n  var pass = passState[0]; var setPass = passState[1]\n  var focusState = useState('')\n  var focus = focusState[0]; var setFocus = focusState[1]\n  var loadState = useState(false)\n  var loading = loadState[0]; var setLoading = loadState[1]\n  var doneState = useState(false)\n  var done = doneState[0]; var setDone = doneState[1]\n  function handleLogin() {\n    if (!email || !pass) return\n    setLoading(true)\n    setTimeout(function() { setLoading(false); setDone(true) }, 1800)\n  }\n  return (\n    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', fontFamily: 'system-ui, sans-serif', overflow: 'hidden', position: 'relative' }}>\n      <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />\n      <div style={{ flex: 1, display: 'none' }} />\n      <div style={{ width: '100%', maxWidth: '420px', margin: 'auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>\n        <div style={{ textAlign: 'center', marginBottom: '36px' }}>\n          <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', borderRadius: '12px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}>\u25c8</div>\n          <h1 style={{ color: '#fafafa', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.04em' }}>Bem-vindo de volta</h1>\n          <p style={{ color: '#52525b', fontSize: '0.85rem', margin: 0 }}>Entre na sua conta para continuar</p>\n        </div>\n        {done ? (\n          <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>\n            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>\u2713</div>\n            <p style={{ color: '#34d399', fontWeight: 700, margin: '0 0 4px' }}>Login realizado!</p>\n            <p style={{ color: '#52525b', fontSize: '0.82rem', margin: 0 }}>Redirecionando para o painel...</p>\n          </div>\n        ) : (\n          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '28px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>\n            <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', color: '#d1d5db', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '20px', fontWeight: 500 }}>\n              <span style={{ fontSize: '1.1rem' }}>G</span>\n              Continuar com Google\n            </button>\n            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>\n              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />\n              <span style={{ color: '#3f3f46', fontSize: '0.75rem' }}>ou</span>\n              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />\n            </div>\n            {[\n              { label: 'Email', id: 'email', type: 'email', val: email, set: setEmail, ph: 'voce@empresa.com' },\n              { label: 'Senha', id: 'pass', type: 'password', val: pass, set: setPass, ph: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' }\n            ].map(function(field) {\n              var isFoc = focus === field.id\n              return (\n                <div key={field.id} style={{ marginBottom: '16px' }}>\n                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 500, marginBottom: '6px' }}>{field.label}</label>\n                  <input\n                    type={field.type}\n                    value={field.val}\n                    onChange={function(e) { field.set(e.target.value) }}\n                    onFocus={function() { setFocus(field.id) }}\n                    onBlur={function() { setFocus('') }}\n                    placeholder={field.ph}\n                    style={{ width: '100%', background: isFoc ? 'rgba(139,92,246,0.05)' : 'rgba(0,0,0,0.3)', border: '1px solid ' + (isFoc ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'), borderRadius: '9px', padding: '10px 14px', color: '#fafafa', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'inherit' }}\n                  />\n                </div>\n              )\n            })}\n            <div style={{ textAlign: 'right', marginBottom: '20px' }}>\n              <span style={{ color: '#8b5cf6', fontSize: '0.78rem', cursor: 'pointer' }}>Esqueci minha senha</span>\n            </div>\n            <button onClick={handleLogin} style={{ width: '100%', background: loading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer', boxShadow: '0 0 30px rgba(139,92,246,0.3)', transition: 'all 0.2s' }}>\n              {loading ? 'Entrando...' : 'Entrar'}\n            </button>\n            <p style={{ color: '#52525b', fontSize: '0.78rem', textAlign: 'center', marginTop: '16px', margin: '16px 0 0' }}>\n              Nao tem conta? <span style={{ color: '#8b5cf6', cursor: 'pointer' }}>Criar gratis</span>\n            </p>\n          </div>\n        )}\n      </div>\n    </div>\n  )\n}"
  },
  {
    id: 'loja',
    name: 'Loja Virtual',
    desc: 'E-commerce com grid, carrinho e filtros',
    icon: '🛍️',
    color: '#f97316',
    code: "export default function LojaVirtual() {\n  var cartState = useState(0)\n  var cart = cartState[0]; var setCart = cartState[1]\n  var produtos = [\n    { nome: 'Tenis Air Pro', preco: 'R$ 349', original: 'R$ 499', img: '\ud83d\udc5f', tag: 'Novo', color: '#f97316' },\n    { nome: 'Jaqueta Urban', preco: 'R$ 289', original: null, img: '\ud83e\udde5', tag: null, color: null },\n    { nome: 'Oculos Solar', preco: 'R$ 179', original: 'R$ 249', img: '\ud83d\udd76\ufe0f', tag: '-28%', color: '#4ade80' },\n    { nome: 'Mochila Pro', preco: 'R$ 199', original: null, img: '\ud83c\udf92', tag: null, color: null },\n    { nome: 'Bone Classic', preco: 'R$ 89', original: 'R$ 129', img: '\ud83e\udde2', tag: 'Off', color: '#f87171' },\n    { nome: 'Camiseta Dry', preco: 'R$ 69', original: null, img: '\ud83d\udc55', tag: null, color: null }\n  ]\n  var cats = ['Todos', 'Calcados', 'Roupas', 'Acessorios', 'Promocoes']\n  var catState = useState('Todos')\n  var catSel = catState[0]; var setCatSel = catState[1]\n  return (\n    <div style={{ minHeight: '100vh', background: '#09090b', fontFamily: 'system-ui, sans-serif' }}>\n      <nav style={{ background: '#111113', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 10 }}>\n        <span style={{ color: '#fafafa', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.03em' }}>\n          MODO<span style={{ color: '#f97316' }}>.</span>\n        </span>\n        <div style={{ display: 'flex', gap: '6px' }}>\n          {cats.map(function(c) {\n            var isA = catSel === c\n            return (\n              <button key={c} onClick={function() { setCatSel(c) }} style={{ background: isA ? '#f97316' : 'transparent', color: isA ? '#000' : '#71717a', border: 'none', borderRadius: '99px', padding: '5px 14px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: isA ? 700 : 400, transition: 'all 0.15s' }}>{c}</button>\n            )\n          })}\n        </div>\n        <button onClick={function() { setCart(function(p) { return p + 1 }) }} style={{ position: 'relative', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316', borderRadius: '10px', padding: '7px 16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>\n          Carrinho\n          {cart > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', background: '#f97316', borderRadius: '50%', color: '#000', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{cart}</span>}\n        </button>\n      </nav>\n      <div style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #09090b 50%)', padding: '50px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>\n        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '200px', background: 'radial-gradient(ellipse, rgba(249,115,22,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />\n        <span style={{ display: 'inline-block', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '99px', padding: '4px 14px', color: '#f97316', fontSize: '0.75rem', fontWeight: 600, marginBottom: '16px' }}>Sale \u2014 ate 50% off</span>\n        <h2 style={{ color: '#fafafa', fontSize: '3rem', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.04em' }}>Nova Colecao</h2>\n        <p style={{ color: '#71717a', fontSize: '1rem', margin: '0 0 24px' }}>Estilo que define quem voce e.</p>\n        <button style={{ background: '#f97316', color: '#000', border: 'none', borderRadius: '10px', padding: '12px 28px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 0 30px rgba(249,115,22,0.4)' }}>Ver Colecao</button>\n      </div>\n      <div style={{ padding: '36px 40px' }}>\n        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '18px' }}>\n          {produtos.map(function(p) {\n            return (\n              <div key={p.nome} style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden', transition: 'all 0.2s' }} onMouseEnter={function(e) { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)' }} onMouseLeave={function(e) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}>\n                <div style={{ height: '160px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', position: 'relative' }}>\n                  {p.img}\n                  {p.tag && <span style={{ position: 'absolute', top: '12px', right: '12px', background: p.color, color: '#000', borderRadius: '6px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 800 }}>{p.tag}</span>}\n                </div>\n                <div style={{ padding: '14px 16px' }}>\n                  <p style={{ color: '#fafafa', fontWeight: 600, fontSize: '0.88rem', margin: '0 0 6px' }}>{p.nome}</p>\n                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>\n                    <span style={{ color: '#f97316', fontWeight: 800, fontSize: '1rem' }}>{p.preco}</span>\n                    {p.original && <span style={{ color: '#3f3f46', fontSize: '0.78rem', textDecoration: 'line-through' }}>{p.original}</span>}\n                  </div>\n                  <button onClick={function() { setCart(function(c) { return c + 1 }) }} style={{ width: '100%', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316', borderRadius: '8px', padding: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Adicionar ao Carrinho</button>\n                </div>\n              </div>\n            )\n          })}\n        </div>\n      </div>\n    </div>\n  )\n}"
  },
  {
    id: 'portfolio',
    name: 'Portfolio Dev',
    desc: 'Site pessoal com projetos e contato',
    icon: '💼',
    color: '#ec4899',
    code: "export default function Portfolio() {\n  var secState = useState('sobre')\n  var sec = secState[0]; var setSec = secState[1]\n  var projetos = [\n    { nome: 'FinanceApp', tech: ['React', 'Node', 'Postgres'], desc: 'Gestao financeira pessoal com IA', color: '#4ade80', emoji: '\ud83d\udcb0' },\n    { nome: 'ShopFlow', tech: ['Next.js', 'Stripe', 'Redis'], desc: 'E-commerce de alta conversao', color: '#818cf8', emoji: '\ud83d\uded2' },\n    { nome: 'Eklesia', tech: ['React', 'Supabase', 'PWA'], desc: 'SaaS para gestao de igrejas', color: '#f59e0b', emoji: '\u2726' },\n    { nome: 'ZeroPrev', tech: ['Vite', 'Claude API', 'Railway'], desc: 'Gerador de componentes com IA', color: '#f97316', emoji: '\u2b21' }\n  ]\n  var skills = ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'PostgreSQL', 'Docker', 'GraphQL']\n  return (\n    <div style={{ minHeight: '100vh', background: '#030712', fontFamily: 'system-ui, sans-serif', color: '#fafafa' }}>\n      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 60px', height: '60px', position: 'sticky', top: 0, background: 'rgba(3,7,18,0.8)', backdropFilter: 'blur(12px)', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>\n        <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.03em' }}>\n          dev<span style={{ color: '#ec4899' }}>.</span>portfolio\n        </span>\n        <div style={{ display: 'flex', gap: '6px' }}>\n          {['sobre', 'projetos', 'contato'].map(function(s) {\n            var isA = sec === s\n            return <button key={s} onClick={function() { setSec(s) }} style={{ background: isA ? 'rgba(236,72,153,0.1)' : 'transparent', border: isA ? '1px solid rgba(236,72,153,0.3)' : '1px solid transparent', color: isA ? '#ec4899' : '#71717a', borderRadius: '8px', padding: '6px 16px', fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s' }}>{s}</button>\n          })}\n        </div>\n        <a style={{ color: '#71717a', fontSize: '0.8rem', textDecoration: 'none' }}>github.com/dev</a>\n      </nav>\n      {sec === 'sobre' && (\n        <div>\n          <div style={{ padding: '80px 60px', display: 'flex', gap: '60px', alignItems: 'center', maxWidth: '1000px', margin: '0 auto' }}>\n            <div style={{ flex: 1 }}>\n              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: '99px', padding: '5px 14px', marginBottom: '24px' }}>\n                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'none' }} />\n                <span style={{ color: '#a1a1aa', fontSize: '0.78rem' }}>Disponivel para projetos</span>\n              </div>\n              <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.05em', lineHeight: 1.05 }}>\n                Ola, sou\n                <span style={{ display: 'block', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dev Fullstack</span>\n              </h1>\n              <p style={{ color: '#71717a', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 0 32px', maxWidth: '420px' }}>Construo produtos digitais que escalam. Especialista em React, Node.js e arquiteturas modernas.</p>\n              <div style={{ display: 'flex', gap: '12px' }}>\n                <button onClick={function() { setSec('projetos') }} style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 0 30px rgba(236,72,153,0.3)' }}>Ver Projetos</button>\n                <button onClick={function() { setSec('contato') }} style={{ background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 24px', cursor: 'pointer', fontSize: '0.9rem' }}>Contato</button>\n              </div>\n            </div>\n            <div style={{ width: '260px', height: '260px', flexShrink: 0, borderRadius: '24px', background: 'linear-gradient(135deg, #1a0a1e, #0a0f1e)', border: '1px solid rgba(236,72,153,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 0 60px rgba(236,72,153,0.08)' }}>\n              <div style={{ fontSize: '5rem' }}>\ud83d\udc68\u200d\ud83d\udcbb</div>\n              <p style={{ color: '#52525b', fontSize: '0.78rem', margin: 0 }}>5+ anos de experiencia</p>\n            </div>\n          </div>\n          <div style={{ padding: '0 60px 60px', maxWidth: '1000px', margin: '0 auto' }}>\n            <p style={{ color: '#3f3f46', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>Stack principal</p>\n            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>\n              {skills.map(function(s) {\n                return <span key={s} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', color: '#a1a1aa', fontFamily: 'monospace' }}>{s}</span>\n              })}\n            </div>\n          </div>\n        </div>\n      )}\n      {sec === 'projetos' && (\n        <div style={{ padding: '60px', maxWidth: '1000px', margin: '0 auto' }}>\n          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.04em' }}>Projetos</h2>\n          <p style={{ color: '#52525b', margin: '0 0 36px', fontSize: '0.9rem' }}>Alguns dos produtos que construi.</p>\n          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '18px' }}>\n            {projetos.map(function(p) {\n              return (\n                <div key={p.nome} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px', transition: 'all 0.2s' }} onMouseEnter={function(e) { e.currentTarget.style.borderColor = p.color + '44' }} onMouseLeave={function(e) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>\n                  <div style={{ fontSize: '2rem', marginBottom: '14px' }}>{p.emoji}</div>\n                  <h3 style={{ color: '#fafafa', fontWeight: 700, margin: '0 0 8px', fontSize: '1.05rem' }}>{p.nome}</h3>\n                  <p style={{ color: '#71717a', fontSize: '0.83rem', margin: '0 0 16px', lineHeight: 1.5 }}>{p.desc}</p>\n                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>\n                    {p.tech.map(function(t) {\n                      return <span key={t} style={{ background: p.color + '15', border: '1px solid ' + p.color + '30', color: p.color, borderRadius: '6px', padding: '3px 10px', fontSize: '0.7rem', fontWeight: 600 }}>{t}</span>\n                    })}\n                  </div>\n                </div>\n              )\n            })}\n          </div>\n        </div>\n      )}\n      {sec === 'contato' && (\n        <div style={{ padding: '80px 60px', maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>\n          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>\u2709\ufe0f</div>\n          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.04em' }}>Vamos conversar</h2>\n          <p style={{ color: '#71717a', margin: '0 0 36px', fontSize: '0.9rem', lineHeight: 1.7 }}>Aberto a oportunidades, freelas e projetos inovadores.</p>\n          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>\n            {[\n              { ph: 'Seu nome' },\n              { ph: 'Seu email' }\n            ].map(function(f) {\n              return <input key={f.ph} placeholder={f.ph} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 16px', color: '#fafafa', fontSize: '0.87rem', outline: 'none', fontFamily: 'inherit' }} />\n            })}\n            <textarea placeholder=\"Sua mensagem...\" rows={4} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 16px', color: '#fafafa', fontSize: '0.87rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />\n            <button style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 0 30px rgba(236,72,153,0.3)' }}>Enviar Mensagem</button>\n          </div>\n        </div>\n      )}\n    </div>\n  )\n}"
  }
]


import CodePreview from './components/CodePreview.jsx'

var BACKEND_URL = 'https://zero-backend-production.up.railway.app'

// ── AGENT MODE ───────────────────────────────────────────────────────
// Recebe um prompt livre e retorna um plano JSON de componentes

// ── SANITIZE: remove caracteres que quebram JSON ──────────────────────
function sanitizeStr(str) {
  if (!str) return ''
  return str
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/[\uFFFE\uFFFF]/g, '')
    .replace(/`/g, "'")
    .replace(/\\/g, '/')
    .replace(/->/g, ' ')
    .replace(/<-/g, ' ')
    .replace(/</g, ' ')
    .replace(/>/g, ' ')
    .trim()
}

async function callAgentPlan(userPrompt, licenseKey){
  // Design intelligence extraída de Framer Gallery, Land-book, Godly e tendências 2025
  var DESIGN_INTELLIGENCE =
    'DESIGN INTELLIGENCE - Padrões dos melhores sites do mundo em 2025 (Framer, Land-book, Godly, Awwwards): ' +
    '1. TIPOGRAFIA: Títulos hero enormes (3rem a 6rem), bold ou black weight, tracking negativo (-0.02em a -0.05em). ' +
    'Mix de serif expressivo no hero + sans-serif limpo no corpo. Hierarquia clara: título > subtítulo > corpo. ' +
    '2. CORES: Paletas de 2 cores máximo + neutros. Dark mode dominante com #0a0a0f ou #09090b como base. ' +
    'Accent vibrante: verde #4ade80, roxo #8b5cf6, azul #3b82f6, laranja #f97316 ou dourado #f59e0b. ' +
    'Gradientes sutis de fundo: linear de #0f0c29 para #302b63, ou radial accent no centro. ' +
    '3. LAYOUT: Whitespace generoso (padding mínimo 80px vertical). Grid de 12 colunas. Max-width 1200px centralizado. ' +
    'Secões alternando fundo escuro e fundo levemente mais claro (#111113). ' +
    '4. COMPONENTES PREMIUM: Cards com border 1px rgba(255,255,255,0.08) + border-radius 16px + backdrop-filter blur. ' +
    'Botões CTA com sombra colorida: box-shadow 0 0 30px rgba(accent,0.4). ' +
    'Badges com gradiente + border sutil. Stats em números grandes (3rem+) com cor accent. ' +
    '5. DETALHES QUE IMPRESSIONAM: Separadores com gradiente transparente. ' +
    'Avatares com ring colorido. Progress bars com gradiente. ' +
    'Ícones como emojis ou caracteres unicode estilizados. ' +
    'Background com noise texture simulada via padrao radial sutil. ' +
    '6. FILOSOFIA: Cada componente deve causar aquela sensacao de "uau" - premium, confiante, memorável. ' +
    'Inspiracao: Linear, Vercel, Stripe, Framer, Notion. ' +
    'Nunca generico. Sempre com personalidade visual forte e identidade única.'

  var systemPrompt =
    'You are an elite UI/UX designer and React app planner trained on the best websites from Framer Gallery, Land-book, Godly, and Awwwards. ' +
    'Your mission: plan apps so visually stunning they make users say WOW - surpassing Lovable, Webflow, and any competitor. ' +
    DESIGN_INTELLIGENCE +
    ' When given a description, return ONLY a valid JSON array of components to build. ' +
    'Each item: {"name":"ComponentName","description":"descricao visual DETALHADA em português com cores hex específicas, tamanhos de fonte, gradientes, espacamentos, e elementos de design que tornam o componente EXCEPCIONAL"} ' +
    'REGRAS: ' +
    'Retorne entre 3 e 5 componentes. ' +
    'Nomes em PascalCase: Navbar, Hero, Features, Stats, Testimonials, Pricing, Footer, Dashboard, Sidebar, MembersTable, etc. ' +
    'Descricões DEVEM incluir: cores hex específicas, tamanhos de fonte, tipo de gradiente, espacamento, e o que torna cada componente visualmente impactante. ' +
    'Todo texto de UI em Português Brasileiro (pt-BR). ' +
    'Retorne SOMENTE o array JSON - sem texto antes ou depois. Deve ser parseável por JSON.parse(). ' +
    'Exemplo: [{"name":"Hero","description":"Hero com fundo #09090b, gradiente radial roxo #8b5cf6 opacity 15% no centro, titulo 5rem font-weight 800 tracking -0.04em branco puro, subtitulo 1.2rem #a1a1aa, botao CTA roxo #8b5cf6 com box-shadow 0 0 40px rgba(139,92,246,0.4), badge verde acima do titulo, padding 120px 0"}]'

  // Extrator robusto de JSON — tenta 4 estratégias
  async function tryFetch(prompt){
    var res = await fetch('https://zero-backend-production.up.railway.app/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-license-key': licenseKey },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: sanitizeStr(prompt) }]
      })
    })
    if(!res.ok) throw new Error('HTTP ' + res.status)
    var data = await res.json()
    if(data.error) throw new Error(data.error.message || 'API error')
    return data.content && data.content[0] ? data.content[0].text : ''
  }

  function extractJSON(text){
    if(!text) return null
    // Limpar fences
    text = text.replace(/```json/gi,'').replace(/```/g,'').trim()
    // Estrategia 1: regex greedy
    var m = text.match(/\[[\s\S]*\]/)
    if(m){ try{ return JSON.parse(m[0]) }catch(e){} }
    // Estrategia 2: do primeiro [ ao ultimo ]
    var start = text.indexOf('[')
    var end = text.lastIndexOf(']')
    if(start>=0 && end>start){ try{ return JSON.parse(text.slice(start,end+1)) }catch(e){} }
    // Estrategia 3: tentar parsear direto
    try{ return JSON.parse(text) }catch(e){}
    return null
  }

  // Gerar plano fallback baseado no prompt quando API falha
  function buildFallbackPlan(prompt){
    var lower = prompt.toLowerCase()
    if(lower.indexOf('salao')+lower.indexOf('beleza')+lower.indexOf('sobrancelha')>-3){
      return [{name:'Navbar',description:'Navbar preta com logo dourado e links de navegacao'},{name:'Hero',description:'Hero com foto simulada, titulo grande e botao agendar dourado'},{name:'Servicos',description:'Cards de servicos com precos e descricoes'},{name:'Footer',description:'Rodape com contato e redes sociais'}]
    }
    if(lower.indexOf('academia')+lower.indexOf('gym')+lower.indexOf('fitness')>-3){
      return [{name:'Navbar',description:'Navbar escura com logo'},{name:'Hero',description:'Hero impactante com CTA'},{name:'Planos',description:'Cards de planos e precos'},{name:'Footer',description:'Rodape com links'}]
    }
    if(lower.indexOf('igreja')+lower.indexOf('eklesia')>-2){
      return [{name:'Sidebar',description:'Sidebar com navegacao dourada'},{name:'Dashboard',description:'Dashboard com cards de membros'},{name:'MembersTable',description:'Tabela de membros recentes'},{name:'Footer',description:'Rodape com versiculo'}]
    }
    // Generico
    var names = ['Navbar','Hero','Features','Pricing','Footer']
    return names.map(function(n){ return {name:n,description:'Componente '+n+' profissional com design premium escuro'} })
  }

  // Tentar ate 2 vezes + fallback
  var text = ''
  var plan = null
  try{
    text = await tryFetch(userPrompt)
    plan = extractJSON(text)
  }catch(e){ plan = null }

  if(!plan || plan.length === 0){
    // Segunda tentativa com prompt mais simples
    try{
      var simplePrompt = 'Return a JSON array of 4 components for: ' + sanitizeStr(userPrompt.slice(0,100)) + '. Format: [{"name":"Navbar","description":"dark navbar with logo"},{"name":"Hero","description":"hero section"}]. Only JSON, nothing else.'
      var simpleSystem = 'Return ONLY a valid JSON array. No text before or after. No markdown.'
      var res2 = await fetch('https://zero-backend-production.up.railway.app/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-license-key': licenseKey },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: simpleSystem,
          messages: [{ role: 'user', content: simplePrompt }]
        })
      })
      var data2 = await res2.json()
      var text2 = data2.content && data2.content[0] ? data2.content[0].text : ''
      plan = extractJSON(text2)
    }catch(e2){ plan = null }
  }

  // Fallback local — nunca falha
  if(!plan || plan.length === 0){
    plan = buildFallbackPlan(userPrompt)
  }

  return plan
}

// Detecta se o prompt e para modo agente (app/site/sistema completo)
function detectAgentMode(prompt){
  var triggers = [
    'crie um site', 'crie um app', 'crie uma landing', 'crie um sistema',
    'crie um dashboard', 'crie um crm', 'crie uma loja', 'crie um portfolio',
    'criar um site', 'criar um app', 'criar uma landing', 'criar um sistema',
    'faca um site', 'faca um app', 'faca uma landing',
    'construa um', 'monte um', 'desenvolva um',
    'complete', 'completo', 'completa', 'inteiro', 'inteira',
    'com navbar', 'com hero', 'com rodape', 'com header',
  ]
  var lower = prompt.toLowerCase()
  return triggers.some(function(t){ return lower.indexOf(t) >= 0 })
}

// Componente visual do progresso do Agente
function AgentProgress({steps, currentStep, done, inline}){
  if(!steps || steps.length === 0) return null
  if(inline){
    // Versao sidebar — ocupa o espaco dos componentes
    return(
      <div style={{
        padding:'12px 0', animation:'fadeIn 0.2s ease'
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px',padding:'0 2px'}}>
          <span style={{fontSize:'0.7rem',fontWeight:600,color:'#fafafa',fontFamily:'var(--font-ui)',display:'flex',alignItems:'center',gap:'6px'}}>
            {done
              ? <span style={{color:'#4ade80',display:'flex',alignItems:'center',gap:'5px'}}>
                  <span style={{fontSize:'0.75rem'}}>✓</span> App completo!
                </span>
              : <span style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <span style={{width:'6px',height:'6px',background:'#4ade80',borderRadius:'50%',display:'inline-block',animation:'pulse-glow 1.5s ease infinite',flexShrink:0}}/>
                  Construindo...
                </span>
            }
          </span>
          <span style={{fontSize:'0.65rem',color:'#52525b',fontFamily:'var(--font-mono)'}}>{Math.min(currentStep+1,steps.length)}/{steps.length}</span>
        </div>
        {/* Mini barra de progresso geral */}
        <div style={{height:'2px',background:'rgba(255,255,255,0.06)',borderRadius:'99px',marginBottom:'10px',overflow:'hidden'}}>
          <div style={{
            height:'100%',
            width:(done?100:Math.round((currentStep/steps.length)*100))+'%',
            background:'linear-gradient(90deg, #4ade80, #22d3ee)',
            borderRadius:'99px', transition:'width 0.6s ease',
            boxShadow:'0 0 8px rgba(74,222,128,0.5)'
          }}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
          {steps.map(function(step,i){
            var isDone=i<currentStep||done
            var isActive=i===currentStep&&!done
            var isPending=i>currentStep&&!done
            return(
              <div key={i} style={{
                display:'flex',alignItems:'center',gap:'8px',
                padding:'6px 8px',borderRadius:'7px',
                background:isActive?'rgba(74,222,128,0.06)':'transparent',
                borderLeft:isActive?'2px solid #4ade80':'2px solid transparent',
                transition:'all 0.3s'
              }}>
                <span style={{
                  width:'16px',height:'16px',borderRadius:'50%',flexShrink:0,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:'0.6rem',fontWeight:700,
                  background:isDone?'#4ade80':isActive?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.04)',
                  color:isDone?'#000':isActive?'#4ade80':'#3f3f46'
                }}>
                  {isDone?'✓':isActive
                    ?<span style={{width:'7px',height:'7px',border:'1.5px solid #4ade80',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite'}}/>
                    :i+1
                  }
                </span>
                <span style={{
                  fontSize:'0.78rem',flex:1,fontFamily:'var(--font-ui)',
                  color:isDone?'#52525b':isActive?'#fafafa':'#3f3f46',
                  fontWeight:isActive?600:400
                }}>{step.name}</span>
                {isDone&&<span style={{fontSize:'0.6rem',color:'#4ade80',fontFamily:'var(--font-mono)'}}>✓</span>}
                {isActive&&<span style={{fontSize:'0.6rem',color:'#52525b',fontFamily:'var(--font-mono)',animation:'pulse-glow 1.5s ease infinite'}}>gen...</span>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  // Versao floating (legado — nao usada mais)
  return(
    <div style={{
      position:'fixed', bottom:'80px', left:'50%', transform:'translateX(-50%)',
      zIndex:9997, background:'#18181b', border:'1px solid #3f3f46',
      borderRadius:'14px', padding:'18px 24px', minWidth:'360px', maxWidth:'480px',
      boxShadow:'0 16px 48px rgba(0,0,0,0.7)', animation:'fadeIn 0.2s ease'
    }}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
        <span style={{fontSize:'0.82rem',fontWeight:600,color:'#fafafa',fontFamily:'var(--font-ui)',display:'flex',alignItems:'center',gap:'8px'}}>
          {done
            ? <span style={{color:'#4ade80'}}>✓ App completo!</span>
            : <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <span style={{width:'8px',height:'8px',background:'#4ade80',borderRadius:'50%',display:'inline-block',animation:'pulse-glow 1.5s ease infinite'}}/>
                Construindo seu app...
              </span>
          }
        </span>
        <span style={{fontSize:'0.7rem',color:'#71717a',fontFamily:'var(--font-mono)'}}>{Math.min(currentStep+1,steps.length)}/{steps.length}</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {steps.map(function(step, i){
          var isDone = i < currentStep || done
          var isActive = i === currentStep && !done
          var isPending = i > currentStep && !done
          return(
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'7px 10px', borderRadius:'8px',
              background: isActive ? 'rgba(74,222,128,0.08)' : 'transparent',
              border: isActive ? '1px solid rgba(74,222,128,0.2)' : '1px solid transparent',
              transition:'all 0.3s'
            }}>
              <span style={{
                width:'18px', height:'18px', borderRadius:'50%', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.65rem', fontWeight:700,
                background: isDone ? '#4ade80' : isActive ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)',
                border: isActive ? '1px solid #4ade80' : 'none',
                color: isDone ? '#000' : isActive ? '#4ade80' : '#52525b'
              }}>
                {isDone ? '✓' : isActive
                  ? <span style={{width:'8px',height:'8px',border:'1.5px solid #4ade80',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite'}}/>
                  : i+1
                }
              </span>
              <span style={{
                fontSize:'0.8rem',
                color: isDone ? '#a1a1aa' : isActive ? '#fafafa' : '#52525b',
                fontFamily:'var(--font-ui)',
                flex:1,
                fontWeight: isActive ? 500 : 400
              }}>{step.name}</span>
              {isDone && <span style={{fontSize:'0.65rem',color:'#4ade80',fontFamily:'var(--font-mono)',flexShrink:0}}>✓</span>}
              {isActive && <span style={{fontSize:'0.65rem',color:'#71717a',fontFamily:'var(--font-mono)',flexShrink:0}}>gerando...</span>}
              {isPending && <span style={{fontSize:'0.65rem',color:'#3f3f46',fontFamily:'var(--font-mono)',flexShrink:0}}>aguardando</span>}
            </div>
          )
        })}
      </div>
      {done && (
        <div style={{marginTop:'12px',paddingTop:'12px',borderTop:'1px solid #27272a',display:'flex',justifyContent:'center'}}>
          <span style={{fontSize:'0.75rem',color:'#71717a',fontFamily:'var(--font-mono)'}}>
            {steps.length} componentes gerados com sucesso
          </span>
        </div>
      )}
    </div>
  )
}



// ══════════════════════════════════════════════════════════════════════
// INTRO SCREEN — Person of Interest style
// ══════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════
// INTRO SCREEN — Person of Interest / Vigilância Total
// ══════════════════════════════════════════════════════════════════════
function IntroScreen({onDone}){
  var phaseState    = useState(0);  var phase    = phaseState[0];    var setPhase    = phaseState[1]
  var glitchState   = useState(false); var glitch = glitchState[0];  var setGlitch   = glitchState[1]
  var tickState     = useState(0);  var tick     = tickState[0];     var setTick     = tickState[1]
  var progressState = useState(0);  var progress = progressState[0]; var setProgress = progressState[1]
  var logState      = useState([]); var logs     = logState[0];      var setLogs     = logState[1]
  var matrixState   = useState([]); var matrix   = matrixState[0];   var setMatrix   = matrixState[1]
  var exitState     = useState(false); var exiting = exitState[0];   var setExiting  = exitState[1]

  var ALL_LOGS = [
    'BOOT_SEQUENCE.............. INICIANDO',
    'KERNEL v4.2.1.............. CARREGADO',
    'REDE_NEURAL_CONV........... ONLINE',
    'BANCO_FACIAL_DB............ 2.847.391 REGISTROS',
    'GRADE_VIGILANCIA_SP........ 4.109 CAMERAS ATIVAS',
    'RECONHECIMENTO_FACIAL...... ATIVO',
    'ANALISE_COMPORTAMENTO...... EXECUTANDO',
    'CRIPTOGRAFIA_AES256........ HABILITADA',
    'INTERCEPTACAO_DADOS........ STREAMING',
    'AVALIACAO_AMEACA........... NOMINAL',
    'RASTREAMENTO_GPS........... HABILITADO',
    'INTEGRACAO_IA.............. CONECTADA',
    'MONITORAMENTO_CELULAR...... 847 ALVOS',
    'SISTEMA_ZERO_PREVIEW....... INICIALIZANDO',
    'STATUS_GERAL............... OPERACIONAL',
  ]

  var MATRIX_CHARS = '01アイウエオカキ01ABCDEF9834'.split('')

  useEffect(function(){
    // Matrix rain
    var cols = Math.floor(window.innerWidth / 14)
    var initial = []
    for(var i = 0; i < cols; i++){
      initial.push({
        x: i * 14,
        y: Math.random() * -500,
        speed: 1.5 + Math.random() * 3,
        chars: Array.from({length: 20}, function(){ return MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)] }),
        opacity: 0.15 + Math.random() * 0.3
      })
    }
    setMatrix(initial)

    // Tick geral
    var tickInt = setInterval(function(){
      setTick(function(t){ return t + 1 })
      setProgress(function(p){ return Math.min(100, p + 0.6) })
      setMatrix(function(prev){ return prev.map(function(col){
        var ny = col.y + col.speed
        if(ny > window.innerHeight + 200) ny = -200 - Math.random()*300
        var nc = col.chars.slice()
        if(Math.random() < 0.1) nc[Math.floor(Math.random()*nc.length)] = MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)]
        return Object.assign({}, col, {y: ny, chars: nc})
      })})
    }, 40)

    // Fases
    var t1 = setTimeout(function(){ setPhase(1) }, 600)
    var t2 = setTimeout(function(){ setPhase(2) }, 2400)
    var t3 = setTimeout(function(){ setPhase(3) }, 4200)
    var t4 = setTimeout(function(){ setPhase(4) }, 6000)

    // Logs progressivos
    ALL_LOGS.forEach(function(log, i){
      setTimeout(function(){ setLogs(function(l){ return l.concat([log]) }) }, 600 + i * 380)
    })

    // Glitches
    var glitchTimes = [900, 2100, 3300, 4800, 5500]
    var gTimers = glitchTimes.map(function(t){
      return setTimeout(function(){
        setGlitch(true)
        setTimeout(function(){ setGlitch(false) }, 120)
      }, t)
    })

    // Saída
    var tExit = setTimeout(function(){ setExiting(true) }, 7200)
    var tDone = setTimeout(function(){ onDone() }, 8000)

    return function(){
      clearInterval(tickInt)
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4)
      clearTimeout(tExit); clearTimeout(tDone)
      gTimers.forEach(function(t){ clearTimeout(t) })
    }
  }, [])

  var cameras = [
    { id:'CAM_0091', loc:'AV PAULISTA 1578',   lat:'-23.5612', lon:'-46.6560', faces:3, threat:'BAIXA'  },
    { id:'CAM_0147', loc:'TERMINAL TIETÊ',      lat:'-23.5155', lon:'-46.6256', faces:7, threat:'MEDIA'  },
    { id:'CAM_0203', loc:'AEROPORTO CGH T2',    lat:'-23.6273', lon:'-46.6566', faces:2, threat:'BAIXA'  },
    { id:'CAM_0318', loc:'METRO SE LINHA 3',    lat:'-23.5461', lon:'-46.6334', faces:5, threat:'ALTA'   },
    { id:'CAM_0425', loc:'CENTRO FINANC SP',    lat:'-23.5492', lon:'-46.6388', faces:4, threat:'MEDIA'  },
    { id:'CAM_0512', loc:'MARGINAL PINHEIROS',  lat:'-23.5720', lon:'-46.7019', faces:1, threat:'BAIXA'  },
  ]

  var threatColor = { 'BAIXA':'#4ade80', 'MEDIA':'#f59e0b', 'ALTA':'#f87171' }

  var now = new Date()
  var timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()+Math.floor(tick/25)%60).padStart(2,'0')

  return(
    <div
      onClick={onDone}
      style={{
        position:'fixed', inset:0, zIndex:99999,
        background:'#000',
        fontFamily:'"JetBrains Mono","Courier New",monospace',
        overflow:'hidden', cursor:'pointer',
        opacity: exiting ? 0 : 1,
        transition: exiting ? 'opacity 0.8s ease' : 'none'
      }}
    >

      {/* ── MATRIX RAIN ── */}
      <canvas style={{display:'none'}}/>
      <div style={{position:'absolute',inset:0,overflow:'hidden',zIndex:1}}>
        {matrix.map(function(col, ci){
          return(
            <div key={ci} style={{
              position:'absolute', left: col.x + 'px', top: col.y + 'px',
              display:'flex', flexDirection:'column', gap:'2px',
              opacity: phase >= 1 ? col.opacity : 0,
              transition:'opacity 1s',
              pointerEvents:'none'
            }}>
              {col.chars.map(function(ch, i){
                var isTip = i === 0
                return(
                  <span key={i} style={{
                    fontSize:'11px', lineHeight:'12px',
                    color: isTip ? '#fff' : 'rgba(74,222,128,' + (0.8 - i*0.04) + ')',
                    textShadow: isTip ? '0 0 8px #fff, 0 0 12px rgba(74,222,128,0.8)' : 'none',
                    display:'block', width:'12px', textAlign:'center'
                  }}>{ch}</span>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* ── SCAN LINE ── */}
      <div style={{
        position:'absolute', left:0, right:0, height:'1px', zIndex:20,
        background:'linear-gradient(90deg,transparent,rgba(74,222,128,0.9),transparent)',
        boxShadow:'0 0 20px rgba(74,222,128,0.8), 0 0 40px rgba(74,222,128,0.3)',
        top: (tick * 1.8 % 110 - 5) + '%',
        transition:'top 0.04s linear', pointerEvents:'none'
      }}/>

      {/* ── GRADE DE CAMERAS ── */}
      {phase >= 1 && (
        <div style={{
          position:'absolute', inset:0, zIndex:5,
          display:'grid', gridTemplateColumns:'repeat(3,1fr)', gridTemplateRows:'repeat(2,1fr)',
          gap:'2px', padding:'2px',
          opacity: phase >= 4 ? 0 : 0.85,
          transition:'opacity 0.5s',
          filter: glitch ? 'hue-rotate(180deg) brightness(1.5) saturate(3)' : 'none'
        }}>
          {cameras.map(function(cam, i){
            var isActive   = i < phase + 1
            var isLocked   = phase >= 3 && i < 4
            var isHighThreat = cam.threat === 'ALTA'
            var tc = threatColor[cam.threat]
            var scanAnim = isActive && !isLocked
            return(
              <div key={i} style={{
                position:'relative', background:'#030303',
                border:'1px solid ' + (isHighThreat && isLocked ? 'rgba(248,113,113,0.6)' : isLocked ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.06)'),
                overflow:'hidden',
                boxShadow: isHighThreat && isLocked ? 'inset 0 0 30px rgba(248,113,113,0.08)' : isLocked ? 'inset 0 0 30px rgba(74,222,128,0.05)' : 'none',
                transition:'all 0.4s ' + (i*0.1) + 's'
              }}>
                {/* CRT scanlines */}
                <div style={{
                  position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
                  backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)'
                }}/>

                {/* Corpo humano simulado */}
                <div style={{
                  position:'absolute', top:'50%', left:'50%',
                  transform:'translate(-50%,-50%)', zIndex:2,
                  opacity: isActive ? 0.2 : 0, transition:'opacity 0.6s'
                }}>
                  {/* Cabeça */}
                  <div style={{
                    width:'28px', height:'28px', borderRadius:'50%',
                    border:'1px solid rgba(74,222,128,0.5)',
                    margin:'0 auto 2px',
                    background:'rgba(74,222,128,0.04)'
                  }}/>
                  {/* Tronco */}
                  <div style={{
                    width:'22px', height:'38px',
                    border:'1px solid rgba(74,222,128,0.3)',
                    borderRadius:'3px 3px 0 0', margin:'0 auto'
                  }}/>
                </div>

                {/* Retângulo de detecção facial */}
                {isActive && (
                  <div style={{
                    position:'absolute', top:'22%', left:'50%',
                    transform:'translateX(-50%)',
                    width: isLocked ? '52px' : '44px',
                    height: isLocked ? '52px' : '44px',
                    border:'1.5px solid ' + tc,
                    zIndex:3,
                    boxShadow:'0 0 12px ' + tc + '44',
                    transition:'all 0.4s'
                  }}>
                    {/* Cantos do retângulo */}
                    {[
                      {top:'-3px',left:'-3px',borderTop:'2px solid '+tc,borderLeft:'2px solid '+tc},
                      {top:'-3px',right:'-3px',borderTop:'2px solid '+tc,borderRight:'2px solid '+tc},
                      {bottom:'-3px',left:'-3px',borderBottom:'2px solid '+tc,borderLeft:'2px solid '+tc},
                      {bottom:'-3px',right:'-3px',borderBottom:'2px solid '+tc,borderRight:'2px solid '+tc},
                    ].map(function(s,si){
                      return <div key={si} style={Object.assign({position:'absolute',width:'8px',height:'8px'},s)}/>
                    })}
                    {/* Cruz de mira */}
                    <div style={{position:'absolute',top:'50%',left:'-10px',width:'6px',height:'1px',background:tc,transform:'translateY(-50%)'}}/>
                    <div style={{position:'absolute',top:'50%',right:'-10px',width:'6px',height:'1px',background:tc,transform:'translateY(-50%)'}}/>
                    <div style={{position:'absolute',left:'50%',top:'-10px',width:'1px',height:'6px',background:tc,transform:'translateX(-50%)'}}/>
                    <div style={{position:'absolute',left:'50%',bottom:'-10px',width:'1px',height:'6px',background:tc,transform:'translateX(-50%)'}}/>
                  </div>
                )}

                {/* Identificação */}
                {isLocked && (
                  <div style={{
                    position:'absolute', top:'15%', left:'50%',
                    transform:'translateX(-50%)',
                    fontSize:'0.45rem', color:tc, zIndex:4,
                    letterSpacing:'0.08em', whiteSpace:'nowrap',
                    textShadow:'0 0 8px ' + tc
                  }}>
                    ID: {(8823 + i*1337).toString(16).toUpperCase()}
                  </div>
                )}

                {/* Info inferior */}
                <div style={{
                  position:'absolute', bottom:0, left:0, right:0, zIndex:4,
                  background:'linear-gradient(transparent,rgba(0,0,0,0.9))',
                  padding:'12px 6px 5px', fontSize:'0.45rem'
                }}>
                  <div style={{color:'rgba(74,222,128,0.8)',marginBottom:'1px',letterSpacing:'0.06em'}}>{cam.id} — {cam.loc}</div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'rgba(255,255,255,0.3)'}}>FACES: {cam.faces}</span>
                    <span style={{color: tc, fontWeight:700}}>{'AMEACA: ' + cam.threat}</span>
                  </div>
                </div>

                {/* Header */}
                <div style={{
                  position:'absolute', top:0, left:0, right:0, zIndex:4,
                  padding:'4px 6px', display:'flex', justifyContent:'space-between',
                  fontSize:'0.42rem', color:'rgba(74,222,128,0.5)'
                }}>
                  <span>{cam.lat + ',' + cam.lon}</span>
                  <span style={{
                    color: isLocked ? tc : 'rgba(255,255,255,0.25)',
                    fontWeight: isLocked ? 700 : 400
                  }}>
                    {isLocked ? (cam.threat==='ALTA' ? '⬡ ALERTA' : '✓ IDENTIFICADO') : isActive ? 'RASTREANDO' : 'AGUARDANDO'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── PAINEL CENTRAL ── */}
      {phase >= 2 && (
        <div style={{
          position:'absolute', inset:0, zIndex:10,
          display:'flex', alignItems:'center', justifyContent:'center',
          pointerEvents:'none'
        }}>
          <div style={{
            background:'rgba(0,0,0,0.92)',
            border:'1px solid rgba(74,222,128,0.4)',
            borderRadius:'3px', padding:'24px 32px',
            width:'420px',
            boxShadow:'0 0 80px rgba(74,222,128,0.15), 0 0 160px rgba(74,222,128,0.05)',
            filter: glitch ? 'brightness(2) saturate(4)' : 'none',
            transition:'filter 0.05s'
          }}>
            {/* Linhas de log */}
            <div style={{marginBottom:'16px', height:'160px', overflow:'hidden'}}>
              {logs.map(function(log, i){
                var isLast = i === logs.length - 1
                return(
                  <div key={i} style={{
                    fontSize:'0.55rem',
                    color: isLast ? '#4ade80' : 'rgba(74,222,128,0.4)',
                    letterSpacing:'0.04em', lineHeight:'1.9',
                    textShadow: isLast ? '0 0 10px rgba(74,222,128,0.6)' : 'none'
                  }}>
                    <span style={{color:'rgba(74,222,128,0.25)'}}>{'> '}</span>
                    {log}
                    {isLast && <span style={{animation:'none',opacity:tick%2===0?1:0}}>_</span>}
                  </div>
                )
              })}
            </div>

            {/* Separador */}
            <div style={{height:'1px',background:'linear-gradient(90deg,transparent,rgba(74,222,128,0.4),transparent)',margin:'0 0 16px'}}/>

            {/* Logo */}
            <div style={{textAlign:'center',marginBottom:'16px'}}>
              <div style={{fontSize:'0.55rem',color:'rgba(74,222,128,0.4)',letterSpacing:'0.35em',marginBottom:'8px'}}>
                SISTEMA OPERACIONAL
              </div>
              <div style={{
                fontSize:'2.4rem', fontWeight:900, letterSpacing:'-0.03em',
                fontFamily:'"Inter",sans-serif',
                filter: phase >= 3 ? 'none' : 'brightness(0.5)',
                transition:'filter 0.5s'
              }}>
                <span style={{
                  color:'#4ade80',
                  textShadow: phase >= 3 ? '0 0 30px rgba(74,222,128,0.9),0 0 60px rgba(74,222,128,0.5),0 0 100px rgba(74,222,128,0.2)' : 'none',
                  transition:'text-shadow 0.5s'
                }}>Zero</span>
                <span style={{
                  color:'#fff',
                  textShadow: phase >= 3 ? '0 0 20px rgba(255,255,255,0.6)' : 'none',
                  transition:'text-shadow 0.5s'
                }}>Preview</span>
              </div>
              <div style={{fontSize:'0.5rem',color:'rgba(74,222,128,0.35)',letterSpacing:'0.25em',marginTop:'6px'}}>
                {'CONSTRUTOR DE INTERFACES v2.0.1'}
              </div>
            </div>

            {/* Barra de progresso */}
            <div>
              <div style={{height:'3px',background:'rgba(255,255,255,0.05)',borderRadius:'99px',overflow:'hidden',marginBottom:'6px',boxShadow:'inset 0 1px 3px rgba(0,0,0,0.5)'}}>
                <div style={{
                  height:'100%', width:Math.min(100,progress)+'%',
                  background:'linear-gradient(90deg,#4ade80,#22d3ee,#4ade80)',
                  backgroundSize:'200% 100%',
                  borderRadius:'99px',
                  boxShadow:'0 0 12px rgba(74,222,128,0.9), 0 0 24px rgba(74,222,128,0.4)',
                  transition:'width 0.1s linear'
                }}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.48rem',color:'rgba(74,222,128,0.35)',letterSpacing:'0.08em'}}>
                <span>CARREGANDO MODULOS</span>
                <span>{Math.min(100,Math.round(progress))}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DADOS NOS CANTOS ── */}
      <div style={{position:'absolute',top:'10px',left:'12px',zIndex:30,fontSize:'0.42rem',color:'rgba(74,222,128,0.35)',letterSpacing:'0.08em',lineHeight:1.9}}>
        <div style={{color:'rgba(74,222,128,0.6)',fontWeight:700,marginBottom:'2px'}}>{'// SISTEMA DE VIGILÂNCIA'}</div>
        <div>{'LAT -23.5505 | LON -46.6333'}</div>
        <div>{'LOCALIZAÇÃO: SÃO PAULO, BR'}</div>
        <div>{'CAMERAS ATIVAS: 4.109'}</div>
      </div>
      <div style={{position:'absolute',top:'10px',right:'12px',zIndex:30,fontSize:'0.42rem',color:'rgba(74,222,128,0.35)',letterSpacing:'0.08em',lineHeight:1.9,textAlign:'right'}}>
        <div style={{color:'rgba(74,222,128,0.6)',fontWeight:700,marginBottom:'2px'}}>{'// TIMESTAMP'}</div>
        <div>{'21 MAR 2026'}</div>
        <div style={{color:'rgba(74,222,128,0.7)',fontWeight:700,fontSize:'0.55rem'}}>{timeStr}</div>
        <div>{'UTC-3 | SECURE'}</div>
      </div>
      <div style={{position:'absolute',bottom:'10px',left:'12px',zIndex:30,fontSize:'0.42rem',color:'rgba(74,222,128,0.25)',letterSpacing:'0.08em',lineHeight:1.9}}>
        <div>{'PROTOCOLO: OMEGA-9'}</div>
        <div>{'CRIPTOGRAFIA: AES-256-GCM'}</div>
        <div>{'UPTIME: 99.97%'}</div>
      </div>
      <div style={{position:'absolute',bottom:'10px',right:'12px',zIndex:30,fontSize:'0.42rem',color:'rgba(74,222,128,0.25)',letterSpacing:'0.08em',lineHeight:1.9,textAlign:'right'}}>
        <div>{'BUILD: 2.0.1-STABLE'}</div>
        <div>{'NODE: ONLINE'}</div>
        <div style={{color:'rgba(74,222,128,0.5)'}}>{'CLIQUE PARA ENTRAR'}</div>
      </div>

      {/* ── VINHETA NAS BORDAS ── */}
      <div style={{
        position:'absolute',inset:0,zIndex:25,pointerEvents:'none',
        background:'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)'
      }}/>

      {/* ── GLITCH OVERLAY ── */}
      {glitch && (
        <div style={{
          position:'absolute',inset:0,zIndex:50,pointerEvents:'none',
          background:'rgba(74,222,128,0.03)',
          mixBlendMode:'screen'
        }}>
          <div style={{position:'absolute',top:(Math.random()*80)+'%',left:0,right:0,height:'2px',background:'rgba(74,222,128,0.4)'}}/>
          <div style={{position:'absolute',top:(Math.random()*80+10)+'%',left:0,right:0,height:'1px',background:'rgba(255,0,0,0.3)'}}/>
        </div>
      )}
    </div>
  )
}

// ── CREDIT METER ──────────────────────────────────────────────────────
function CreditMeter({limit, spent, onSetup}){
  var remaining = Math.max(0, limit - spent)
  var pct = Math.max(0, Math.min(100, (remaining / limit) * 100))
  var brl = (remaining * 5.8).toFixed(2)
  var usd = remaining.toFixed(3)
  var isLow = pct < 25
  var isCritical = pct < 10
  var isEmpty = pct <= 0

  var color = isEmpty ? '#ef4444' : isCritical ? '#f97316' : isLow ? '#f59e0b' : '#4ade80'
  var bgColor = isEmpty ? 'rgba(239,68,68,0.08)' : isCritical ? 'rgba(249,115,22,0.08)' : isLow ? 'rgba(245,158,11,0.08)' : 'rgba(74,222,128,0.06)'
  var borderColor = isEmpty ? 'rgba(239,68,68,0.3)' : isCritical ? 'rgba(249,115,22,0.3)' : isLow ? 'rgba(245,158,11,0.3)' : 'rgba(74,222,128,0.15)'

  return(
    <div
      onClick={onSetup}
      title={'Clique para ajustar o limite. Gasto total: US$' + spent.toFixed(4)}
      style={{
        display:'flex', alignItems:'center', gap:'8px', cursor:'pointer',
        background:bgColor, border:'1px solid '+borderColor,
        borderRadius:'10px', padding:'5px 12px', transition:'all 0.3s',
        position:'relative', overflow:'hidden'
      }}
    >
      {/* Barra de progresso de fundo */}
      <div style={{
        position:'absolute', left:0, top:0, bottom:0,
        width:pct+'%', background:color,
        opacity:0.07, transition:'width 0.8s ease', borderRadius:'10px'
      }}/>

      {/* Ícone pulsante quando crítico */}
      <span style={{
        fontSize:'0.75rem', flexShrink:0,
        animation: isCritical ? 'pulse-glow 1s ease infinite' : 'none'
      }}>
        {isEmpty ? '🔴' : isCritical ? '🟠' : isLow ? '🟡' : '🟢'}
      </span>

      <div style={{display:'flex',flexDirection:'column',gap:'1px',zIndex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
          <span style={{
            fontSize:'0.72rem', fontWeight:700, color:color,
            fontFamily:'var(--font-mono)', lineHeight:1
          }}>
            {'R$'+brl}
          </span>
          <span style={{fontSize:'0.62rem',color:'var(--muted)',fontFamily:'var(--font-mono)'}}>
            {'US$'+usd}
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
          {/* Mini barra */}
          <div style={{width:'60px',height:'3px',background:'rgba(255,255,255,0.08)',borderRadius:'99px',overflow:'hidden'}}>
            <div style={{
              height:'100%', width:pct+'%', background:color,
              borderRadius:'99px', transition:'width 0.8s ease',
              boxShadow: isCritical ? '0 0 6px '+color : 'none'
            }}/>
          </div>
          <span style={{fontSize:'0.58rem',color:'var(--muted)',fontFamily:'var(--font-mono)'}}>
            {isEmpty ? 'ESGOTADO' : Math.round(pct)+'%'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── CREDIT SETUP MODAL ────────────────────────────────────────────────
function CreditSetupModal({limit, spent, onSave, onClose}){
  var inputState=useState((limit||5).toFixed(2))
  var val=inputState[0];var setVal=inputState[1]
  var num=parseFloat(val)||0
  var remaining=Math.max(0,num-spent)

  function handleSave(){
    if(num>0){
      localStorage.setItem('zp-credit-limit',num.toFixed(6))
      onSave(num)
    }
    onClose()
  }
  function handleReset(){
    localStorage.setItem('zp-credit-spent','0')
    localStorage.setItem('zp-credit-limit',(limit||5).toFixed(6))
    onSave(limit||5,true)
    onClose()
  }

  return(
    <div style={{
      position:'fixed',inset:0,zIndex:9999,
      background:'rgba(0,0,0,0.7)',backdropFilter:'blur(6px)',
      display:'flex',alignItems:'center',justifyContent:'center'
    }} onClick={onClose}>
      <div style={{
        background:'#18181b',border:'1px solid #3f3f46',borderRadius:'16px',
        padding:'28px',width:'340px',boxShadow:'0 24px 64px rgba(0,0,0,0.8)'
      }} onClick={function(e){e.stopPropagation()}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
          <span style={{fontSize:'1.3rem'}}>💰</span>
          <h3 style={{margin:0,color:'#fafafa',fontFamily:'var(--font-ui)',fontSize:'1rem',fontWeight:700}}>
            Controle de Credito API
          </h3>
        </div>

        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block',fontSize:'0.75rem',color:'#a1a1aa',fontFamily:'var(--font-ui)',marginBottom:'6px'}}>
            Limite de credito (USD)
          </label>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{color:'#71717a',fontFamily:'var(--font-mono)',fontSize:'0.9rem'}}>$</span>
            <input
              type="number" step="0.50" min="0.50"
              value={val}
              onChange={function(e){setVal(e.target.value)}}
              style={{
                flex:1,background:'#09090b',border:'1px solid #3f3f46',
                borderRadius:'8px',padding:'8px 12px',color:'#fafafa',
                fontFamily:'var(--font-mono)',fontSize:'0.9rem',outline:'none'
              }}
            />
          </div>
          {num>0&&(
            <p style={{margin:'8px 0 0',fontSize:'0.72rem',color:'#71717a',fontFamily:'var(--font-ui)'}}>
              {'Equivale a R$'+(num*5.8).toFixed(2)+' aproximadamente'}
            </p>
          )}
        </div>

        {/* Stats */}
        <div style={{
          background:'#09090b',border:'1px solid #27272a',borderRadius:'10px',
          padding:'12px 14px',marginBottom:'20px',display:'flex',flexDirection:'column',gap:'6px'
        }}>
          {[
            ['Limite definido','US$'+num.toFixed(3)+' / R$'+(num*5.8).toFixed(2),'#fafafa'],
            ['Ja gasto','US$'+spent.toFixed(4)+' / R$'+(spent*5.8).toFixed(3),'#f87171'],
            ['Saldo restante','US$'+remaining.toFixed(4)+' / R$'+(remaining*5.8).toFixed(2),'#4ade80'],
          ].map(function(row){
            return(
              <div key={row[0]} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'0.75rem',color:'#71717a',fontFamily:'var(--font-ui)'}}>{row[0]}</span>
                <span style={{fontSize:'0.75rem',color:row[2],fontFamily:'var(--font-mono)',fontWeight:600}}>{row[1]}</span>
              </div>
            )
          })}
        </div>

        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={handleReset} style={{
            flex:1,background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)',
            color:'#f87171',borderRadius:'8px',padding:'9px',fontSize:'0.78rem',
            cursor:'pointer',fontFamily:'var(--font-ui)',fontWeight:600
          }}>Zerar gasto</button>
          <button onClick={handleSave} style={{
            flex:2,background:'#4ade80',border:'none',color:'#000',
            borderRadius:'8px',padding:'9px',fontSize:'0.82rem',
            cursor:'pointer',fontFamily:'var(--font-ui)',fontWeight:700
          }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}


// ── API COST BADGE ────────────────────────────────────────────────────
function ApiCostBadge({tokens, cost}){
  if(tokens===0) return null
  var usd = cost.toFixed(4)
  var brl = (cost*5.8).toFixed(3)
  return(
    <div style={{
      display:'flex', alignItems:'center', gap:'6px',
      background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.15)',
      borderRadius:'8px', padding:'4px 10px', cursor:'default'
    }} title={'Tokens usados: '+tokens.toLocaleString()}>
      <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#4ade80',flexShrink:0,animation:'pulse-glow 2s ease infinite'}}/>
      <span style={{fontSize:'0.7rem',color:'#4ade80',fontFamily:'var(--font-mono)',fontWeight:600}}>
        {'US$'+usd}
      </span>
      <span style={{fontSize:'0.65rem',color:'var(--muted)',fontFamily:'var(--font-mono)'}}>
        {'~ R$'+brl}
      </span>
    </div>
  )
}

// ── THUMBNAIL CAPTURE ─────────────────────────────────────────────────
function buildThumbnailHTML(){
  var p1='<!DOCTYPE html><html><head><meta charset="UTF-8"/>'
  var p2='<script src="https://cdn.tailwindcss.com"><\/script>'
  var p3='<script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>'
  var p4='<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>'
  var p5='<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>'
  var p6='<script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"><\/script>'
  var style='<style>*{box-sizing:border-box;margin:0;padding:0;}body{width:1200px;height:630px;overflow:hidden;background:#111827;font-family:system-ui,sans-serif;}#root{width:100%;height:100%;}</style>'
  var body='</head><body><div id="root"></div>'
  var script='<script>window.addEventListener("message",function(e){if(typeof e.data!=="string")return;var code=e.data;code=code.replace(/^import\\s+.*?;?$/gm,"");code=code.replace(/export\\s+default\\s+function\\s+(\\w+)/,"var __C__=function $1");code=code.replace(/export\\s+default\\s+function\\b/,"var __C__=function");code=code.replace(/export\\s+default\\s+/,"var __C__=");try{var t=Babel.transform(code,{presets:["react"]}).code;var fn=new Function("React","ReactDOM","useState","useEffect","useRef","useCallback","useMemo",t+";return typeof __C__!==\\"undefined\\"?__C__:null;");var Comp=fn(React,ReactDOM,React.useState,React.useEffect,React.useRef,React.useCallback,React.useMemo);if(Comp){ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Comp));}setTimeout(function(){html2canvas(document.body,{width:1200,height:630,scale:0.5,useCORS:true,allowTaint:true,backgroundColor:"#111827"}).then(function(canvas){window.parent.postMessage({type:"thumbnail",data:canvas.toDataURL("image/jpeg",0.7)},"*");}).catch(function(){window.parent.postMessage({type:"thumbnail",data:null},"*");});},1200);}catch(err){window.parent.postMessage({type:"thumbnail",data:null},"*");}});<\/script></body></html>'
  return p1+p2+p3+p4+p5+p6+style+body+script
}
function captureThumbnail(code,callback){
  var iframe=document.createElement('iframe')
  iframe.style.cssText='position:fixed;top:-9999px;left:-9999px;width:1200px;height:630px;border:none;pointer-events:none;'
  document.body.appendChild(iframe)
  var blob=new Blob([buildThumbnailHTML()],{type:'text/html'})
  var url=URL.createObjectURL(blob)
  var done=false
  var timer=setTimeout(function(){if(done)return;done=true;window.removeEventListener('message',onMsg);try{document.body.removeChild(iframe)}catch(e){};URL.revokeObjectURL(url);callback(null)},12000)
  function onMsg(e){if(!e.data||e.data.type!=='thumbnail')return;if(done)return;done=true;clearTimeout(timer);window.removeEventListener('message',onMsg);try{document.body.removeChild(iframe)}catch(e){};URL.revokeObjectURL(url);callback(e.data.data)}
  window.addEventListener('message',onMsg)
  iframe.src=url
  iframe.onload=function(){setTimeout(function(){try{iframe.contentWindow.postMessage(code,'*')}catch(e){}},300)}
}

// ── CLAUDE PANEL ──────────────────────────────────────────────────────
function ClaudePanel({licenseKey,initMsg,forceOpen}){
  var visState=useState(false);var visible=visState[0];var setVisible=visState[1]
  var inputState=useState('');var input=inputState[0];var setInput=inputState[1]
  var msgsState=useState([{role:'ai',text:'Olá! Sou o Claude. Posso responder dúvidas, explicar código e dar sugestões.'}])
  var messages=msgsState[0];var setMessages=msgsState[1]
  var loadingState=useState(false);var loadingChat=loadingState[0];var setLoadingChat=loadingState[1]
  var posState=useState({x:window.innerWidth-400,y:80});var pos=posState[0];var setPos=posState[1]
  var sizeState=useState({w:360,h:480});var size=sizeState[0];var setSize=sizeState[1]
  var dragging=useRef(false);var dragOffset=useRef({x:0,y:0})
  var resizing=useRef(false);var resizeStart=useRef({x:0,y:0,w:0,h:0})
  var endRef=useRef(null)
  useEffect(function(){if(endRef.current)endRef.current.scrollIntoView({behavior:'smooth'})},[messages])
  function startDrag(e){dragging.current=true;dragOffset.current={x:e.clientX-pos.x,y:e.clientY-pos.y};function move(e){if(dragging.current)setPos({x:e.clientX-dragOffset.current.x,y:e.clientY-dragOffset.current.y})}function up(){dragging.current=false;window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up)}window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);e.preventDefault()}
  function startResize(e){resizing.current=true;resizeStart.current={x:e.clientX,y:e.clientY,w:size.w,h:size.h};function move(e){if(resizing.current)setSize({w:Math.max(280,resizeStart.current.w+(e.clientX-resizeStart.current.x)),h:Math.max(300,resizeStart.current.h+(e.clientY-resizeStart.current.y))})}function up(){resizing.current=false;window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up)}window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);e.preventDefault();e.stopPropagation()}
  async function sendMessage(){if(!input.trim()||loadingChat)return;var text=input.trim();setInput('');setMessages(function(prev){return prev.concat([{role:'user',text:text}])});setLoadingChat(true);try{var res=await fetch(BACKEND_URL+'/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-license-key':licenseKey},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1024,messages:[{role:'user',content:text}]})});var data=await res.json();setMessages(function(prev){return prev.concat([{role:'ai',text:data.content&&data.content[0]?data.content[0].text:'Sem resposta.'}])})}catch(e){setMessages(function(prev){return prev.concat([{role:'ai',text:'Erro: '+e.message}])})}finally{setLoadingChat(false)}}
  if(!visible)return <button onClick={function(){setVisible(true)}} style={{position:'fixed',bottom:'24px',right:'24px',zIndex:9999,width:'54px',height:'54px',borderRadius:'50%',background:'var(--accent)',border:'none',cursor:'pointer',fontSize:'1.5rem',boxShadow:'0 4px 24px rgba(74,222,128,0.45)',display:'flex',alignItems:'center',justifyContent:'center'}} title="Abrir Claude">⬡</button>
  return(
    <div style={{position:'fixed',zIndex:9999,left:pos.x+'px',top:pos.y+'px',width:size.w+'px',height:size.h+'px',background:'#0d1117',border:'1px solid var(--border)',borderRadius:'12px',display:'flex',flexDirection:'column',boxShadow:'0 8px 40px rgba(0,0,0,0.7)',overflow:'hidden'}}>
      <div onMouseDown={startDrag} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'#161b22',cursor:'grab',borderBottom:'1px solid var(--border)',flexShrink:0,userSelect:'none'}}>
        <span style={{fontFamily:'var(--font-mono)',fontSize:'0.82rem',color:'var(--accent)',fontWeight:700}}>⬡ Claude - Assistente</span>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <span style={{fontSize:'0.65rem',color:'#4ade80',background:'rgba(74,222,128,0.1)',padding:'2px 8px',borderRadius:'99px',border:'1px solid rgba(74,222,128,0.3)'}}>{loadingChat?'Pensando...':'Pronto'}</span>
          <button onClick={function(){setVisible(false)}} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:'1rem'}}>✕</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:'8px'}}>
        {messages.map(function(m,i){return(<div key={i} style={{fontSize:'0.78rem',lineHeight:1.6,padding:'8px 12px',borderRadius:'8px',background:m.role==='ai'?'rgba(74,222,128,0.07)':'rgba(255,255,255,0.04)',color:m.role==='ai'?'#a3e8b8':'var(--text)',border:m.role==='ai'?'1px solid rgba(74,222,128,0.15)':'1px solid rgba(255,255,255,0.06)',alignSelf:m.role==='ai'?'flex-start':'flex-end',maxWidth:'92%',fontFamily:'var(--font-ui)'}}>{m.role==='ai'&&<span style={{color:'var(--accent)',fontWeight:700,marginRight:'6px'}}>⬡</span>}{m.text}</div>)})}
        <div ref={endRef}/>
      </div>
      <div style={{padding:'10px',borderTop:'1px solid var(--border)',flexShrink:0,display:'flex',flexDirection:'column',gap:'8px'}}>
        {messages.length<=1&&(
          <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
            {['Como usar inline styles?','Explique o código','Dicas de UI/UX','Me ajude com esse erro','O que e React?'].map(function(s){
              return(<button key={s} onClick={function(){setInput(s)}} style={{background:'rgba(74,222,128,0.06)',border:'1px solid rgba(74,222,128,0.18)',borderRadius:'99px',color:'var(--muted)',fontSize:'0.67rem',padding:'3px 9px',cursor:'pointer',fontFamily:'var(--font-ui)',transition:'all 0.15s',whiteSpace:'nowrap'}} onMouseEnter={function(e){e.currentTarget.style.background='rgba(74,222,128,0.14)';e.currentTarget.style.color='var(--accent)'}} onMouseLeave={function(e){e.currentTarget.style.background='rgba(74,222,128,0.06)';e.currentTarget.style.color='var(--muted)'}}>{s}</button>)
            })}
          </div>
        )}
        <textarea value={input} onChange={function(e){setInput(e.target.value)}} onKeyDown={function(e){if((e.ctrlKey||e.metaKey)&&e.key==='Enter')sendMessage()}} disabled={loadingChat} placeholder="Pergunte qualquer coisa... (Ctrl+Enter)" rows={3} style={{background:'#161b22',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text)',fontFamily:'var(--font-ui)',fontSize:'0.82rem',padding:'8px 10px',resize:'none',outline:'none',lineHeight:1.5,width:'100%',boxSizing:'border-box'}}/>
        <button onClick={sendMessage} disabled={loadingChat} style={{background:loadingChat?'rgba(74,222,128,0.3)':'var(--accent)',color:'#000',border:'none',borderRadius:'8px',padding:'8px',fontWeight:700,fontSize:'0.82rem',fontFamily:'var(--font-ui)',cursor:loadingChat?'not-allowed':'pointer',width:'100%'}}>{loadingChat?'◌ Pensando...':'▶ Enviar'}</button>
      </div>
      <div onMouseDown={startResize} style={{position:'absolute',bottom:0,right:0,width:'18px',height:'18px',cursor:'nwse-resize'}}/>
    </div>
  )
}

// ── HELPERS ───────────────────────────────────────────────────────────
function buildSystemPrompt(components){
  var base = 'You are an expert React component engineer. Your output is ALWAYS raw JSX - no markdown, no explanation, no preamble, no code fences.\n\n' +
    'OUTPUT FORMAT:\n' +
    'Start your response with exactly: export default function\n' +
    'End your response with exactly: }\n' +
    'Nothing before. Nothing after.\n\n' +
    'ABSOLUTE PROHIBITIONS - any violation breaks the app:\n' +
    '- ZERO backtick characters anywhere - not in strings, not in comments, not anywhere\n' +
    '- ZERO template literals - never use ${} syntax\n' +
    '- ZERO import statements of any kind\n' +
    '- ZERO className prop\n' +
    '- ZERO Tailwind CSS classes\n' +
    '- ZERO multi-line string values\n' +
    '- ZERO async/await inside the component\n\n' +
    'STRING RULES - the only valid patterns:\n' +
    '- Single quotes: \'hello world\'\n' +
    '- Double quotes: "hello world"\n' +
    '- Concatenation with +: \'hello \' + name + \'!\'\n' +
    '- NEVER use backtick for any reason whatsoever\n\n' +
    'STYLE RULES:\n' +
    '- Every visual element MUST use style={{}} prop with plain JS objects\n' +
    '- Colors as hex strings: \'#1a1a2e\'\n' +
    '- Sizes as strings: \'16px\', \'1.5rem\', \'100%\'\n\n' +
    'STATE RULES:\n' +
    '- useState is available as a global - use it directly, do NOT import\n' +
    '- useEffect, useRef, useCallback, useMemo are also available as globals\n' +
    '- Do NOT write any import statement\n\n' +
    'COMPLETENESS:\n' +
    '- Code must be 100% syntactically valid and renderable\n' +
    '- Never truncate - always deliver the complete component\n' +
    '- Every opened tag must be closed. Every opened brace must be closed\n\n' +
    'LANGUAGE: All text content, labels, buttons, placeholders and UI copy must be in Brazilian Portuguese (pt-BR).\n' +
    'VALID EXAMPLE:\n' +
    'export default function MyComponent() {\n' +
    '  var s = useState(0)\n' +
    '  var count = s[0]\n' +
    '  var setCount = s[1]\n' +
    '  return (\n' +
    '    <div style={{ background: \'#111\', color: \'#fff\', padding: \'24px\' }}>\n' +
    '      <h1 style={{ fontSize: \'2rem\' }}>Hello</h1>\n' +
    '    </div>\n' +
    '  )\n' +
    '}'
  if(components.length===0) return base
  var ctx = components.map(function(c,i){
    // Inclui apenas nome e primeiras 800 chars para nao estourar o limite
    var snippet = c.code.length > 800 ? c.code.slice(0,800) + '\n// ...' : c.code
    return '--- Existing Component ' + (i+1) + ': ' + c.name + ' ---\n' + snippet
  }).join('\n\n')
  return base + '\n\nMATCH THE VISUAL STYLE OF THESE EXISTING COMPONENTS:\n' + ctx
}
async function callAPI(prompt,components,licenseKey,onTokens){
  var safePrompt = sanitizeStr(prompt)
  var res=await fetch(BACKEND_URL+'/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-license-key':licenseKey},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:4096,system:buildSystemPrompt(components),messages:[{role:'user',content:safePrompt}]})})
  if(!res.ok){var err=await res.json().catch(function(){return{}});throw new Error(err.error||('HTTP '+res.status))}
  var data=await res.json()
  if(data.usage&&onTokens){
    var toks=(data.usage.input_tokens||0)+(data.usage.output_tokens||0)
    onTokens(toks)
  }
  return data.content&&data.content[0]?data.content[0].text:''
}
function buildAppCode(components){
  var compDefs = components.map(function(c,i){
    var fn = 'Comp' + i
    var code = c.code
    // Renomear a funcao principal
    code = code.replace(/export\s+default\s+function\s+\w+\s*\(/, 'function ' + fn + '(')
    code = code.replace(/export\s+default\s+function\s*\(/, 'function ' + fn + '(')
    code = code.replace(/export\s+default\s+/, 'var ' + fn + ' = ')
    return code
  })
  var combined = compDefs.join('\n\n')
  var appFn = '\n\nexport default function App(){\n' +
    '  return (\n' +
    '    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>\n      ' +
    components.map(function(_,i){ return '<Comp' + i + ' />' }).join('\n      ') +
    '\n    </div>\n  )\n}'
  return combined + appFn
}
function loadProjects(){try{return JSON.parse(localStorage.getItem('zp-projects')||'[]')}catch(e){return[]}}
function saveProjects(list){localStorage.setItem('zp-projects',JSON.stringify(list))}
function loadLicense(){return localStorage.getItem('zp-license')||''}
function saveLicense(k){localStorage.setItem('zp-license',k)}
function getUserName(){return localStorage.getItem('zp-username')||''}
function saveUserName(n){localStorage.setItem('zp-username',n)}
function getFolders(){try{return JSON.parse(localStorage.getItem('zp-folders')||'[]')}catch(e){return[]}}
function saveFolders(f){localStorage.setItem('zp-folders',JSON.stringify(f))}
async function exportZip(activeProject,components){
  var appCode=buildAppCode(components)
  var files={'index.html':'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>'+activeProject.name+'</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>','src/main.jsx':'import React from "react"\nimport ReactDOM from "react-dom/client"\nimport App from "./App.jsx"\nReactDOM.createRoot(document.getElementById("root")).render(<App />)','src/App.jsx':'import React, { useState } from "react"\n\n'+appCode,'package.json':JSON.stringify({name:activeProject.name.toLowerCase().replace(/\s+/g,'-'),version:'1.0.0',scripts:{dev:'vite',build:'vite build'},dependencies:{react:'^18.3.1','react-dom':'^18.3.1'},devDependencies:{'@vitejs/plugin-react':'^4.3.4',vite:'^6.0.0'}},null,2),'vite.config.js':'import { defineConfig } from "vite"\nimport react from "@vitejs/plugin-react"\nexport default defineConfig({ plugins: [react()] })'}
  var JSZip=(await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default
  var zip=new JSZip();Object.entries(files).forEach(function(e){zip.file(e[0],e[1])})
  var blob=await zip.generateAsync({type:'blob'});var url=URL.createObjectURL(blob)
  var a=document.createElement('a');a.href=url;a.download=activeProject.name.toLowerCase().replace(/\s+/g,'-')+'.zip';a.click();URL.revokeObjectURL(url)
}

// ── ICON BUTTON ───────────────────────────────────────────────────────
function IconBtn({icon,label,onClick,active,variant}){
  var hState=useState(false);var h=hState[0];var setH=hState[1]
  var bg=variant==='primary'?(h?'#16a34a':'var(--accent)'):variant==='blue'?(h?'#1e40af':'#1d4ed8'):'transparent'
  var color=variant==='primary'||variant==='blue'?'#000':(active?'var(--accent)':(h?'var(--text)':'var(--muted)'))
  var border=variant==='primary'||variant==='blue'?'none':(active?'1px solid rgba(74,222,128,0.35)':'1px solid '+(h?'var(--border)':'transparent'))
  return(
    <button onClick={onClick} title={label} onMouseEnter={function(){setH(true)}} onMouseLeave={function(){setH(false)}}
      style={{background:bg,border:border,borderRadius:'7px',color:color,cursor:'pointer',padding:'5px 10px',fontSize:'0.82rem',display:'flex',alignItems:'center',gap:'5px',fontFamily:'var(--font-ui)',fontWeight:active||variant?600:400,transition:'all 0.15s',whiteSpace:'nowrap'}}>
      <span>{icon}</span>
      {label&&<span style={{fontSize:'0.75rem'}}>{label}</span>}
    </button>
  )
}

// ── DEVICE WRAPPER ────────────────────────────────────────────────────
function DeviceWrapper({device,children}){
  if(device==='desktop')return <div style={{width:'100%',height:'100%',overflow:'hidden'}}>{children}</div>
  var w=device==='tablet'?'768px':'390px'
  return(
    <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',background:'#080c12',overflow:'hidden'}}>
      <div style={{fontSize:'0.63rem',color:'var(--muted)',fontFamily:'var(--font-mono)',padding:'8px 0',flexShrink:0}}>{device==='tablet'?'Tablet - 768px':'Mobile - 390px'}</div>
      <div style={{width:w,flex:1,overflow:'hidden',border:'1px solid var(--border)',borderRadius:device==='mobile'?'24px':'12px',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>{children}</div>
      <div style={{height:'12px',flexShrink:0}}/>
    </div>
  )
}

// ── DRAGGABLE COMPONENT ITEM (item 9) ─────────────────────────────────
function DraggableCompItem({comp,index,isActive,onSelect,onEdit,onDelete,onReorder,total,onEditModal}){
  var dragOver=useRef(false)
  var hState=useState(false);var h=hState[0];var setH=hState[1]
  return(
    <div
      draggable
      onDragStart={function(e){e.dataTransfer.setData('text/plain',String(index));e.dataTransfer.effectAllowed='move'}}
      onDragOver={function(e){e.preventDefault();e.dataTransfer.dropEffect='move';dragOver.current=true}}
      onDragLeave={function(){dragOver.current=false}}
      onDrop={function(e){e.preventDefault();var from=parseInt(e.dataTransfer.getData('text/plain'));onReorder(from,index);dragOver.current=false}}
      onClick={function(){onSelect(comp)}}
      onMouseEnter={function(){setH(true)}} onMouseLeave={function(){setH(false)}}
      style={{background:isActive?'rgba(74,222,128,0.08)':h?'rgba(255,255,255,0.03)':'transparent',border:isActive?'1px solid rgba(74,222,128,0.25)':'1px solid transparent',borderRadius:'7px',padding:'6px 8px',cursor:'grab',display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px',transition:'background 0.1s,border 0.1s',userSelect:'none'}}>
      <span style={{color:'var(--muted)',fontSize:'0.7rem',flexShrink:0,cursor:'grab',opacity:0.5}}>⠿</span>
      <span style={{fontSize:'0.73rem',color:isActive?'var(--accent)':'var(--text)',fontFamily:'var(--font-mono)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>⬡ {comp.name.slice(0,20)}</span>
      <div style={{display:'flex',gap:'2px',flexShrink:0,opacity:h||isActive?1:0,transition:'opacity 0.15s'}}>
        <button onClick={function(e){e.stopPropagation();onEditModal(comp)}} style={{background:'none',border:'none',color:'var(--accent)',cursor:'pointer',fontSize:'0.72rem',padding:'1px 3px'}} title="Editar">✎</button>
        <button onClick={function(e){e.stopPropagation();onDelete(comp.id)}} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:'0.68rem',padding:'1px 3px',transition:'color 0.15s'}} onMouseEnter={function(e){e.currentTarget.style.color='var(--error)'}} onMouseLeave={function(e){e.currentTarget.style.color='var(--muted)'}} title="Remover">✕</button>
      </div>
    </div>
  )
}

// ── USER MENU (items 18-25) ───────────────────────────────────────────
function UserMenu({username,onRename,onClose,licenseKey,onOpenRenameUser}){
  var usageState=useState(null);var usage=usageState[0];var setUsage=usageState[1]
  useEffect(function(){
    if(!licenseKey)return
    fetch(BACKEND_URL+'/license/status',{headers:{'x-license-key':licenseKey}})
      .then(function(r){return r.json()})
      .then(function(d){if(d.valid)setUsage(d)})
      .catch(function(){})
  },[licenseKey])
  var percent=usage?Math.min(100,usage.percent_used||0):0
  var menuItems=[
    {icon:'👤',label:'Perfil público',action:function(){alert('Em breve: página de perfil público')}},
    {icon:'⚙️',label:'Configuracões',action:function(){alert('Em breve: configuracões da conta')}},
    {icon:'🎨',label:'Aparência',action:function(){alert('Em breve: temas claro/escuro')}},
    {icon:'✏️',label:'Renomear conta',action:function(){onOpenRenameUser()}},
    null,
    {icon:'🚪',label:'Sair',action:function(){if(window.confirm('Sair e remover licenca?')){localStorage.removeItem('zp-license');localStorage.removeItem('zp-username');window.location.reload()}},danger:true},
  ]
  return(
    <div style={{position:'absolute',bottom:'56px',left:'8px',width:'220px',background:'#161b22',border:'1px solid var(--border)',borderRadius:'12px',boxShadow:'0 8px 32px rgba(0,0,0,0.6)',zIndex:1000,overflow:'hidden'}}>
      {/* Header com creditos */}
      <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
          <div>
            <p style={{fontSize:'0.82rem',fontWeight:700,color:'var(--text)',margin:0}}>{username}</p>
            <p style={{fontSize:'0.65rem',color:'var(--muted)',fontFamily:'var(--font-mono)',marginTop:'1px'}}>Plano Pro</p>
          </div>
          <span style={{fontSize:'0.6rem',background:'rgba(74,222,128,0.15)',color:'var(--accent)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:'99px',padding:'3px 8px',fontFamily:'var(--font-mono)',fontWeight:700}}>PRO</span>
        </div>
        {/* Barra de creditos/tokens */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
            <span style={{fontSize:'0.63rem',color:'var(--muted)',fontFamily:'var(--font-mono)'}}>Tokens utilizados</span>
            <span style={{fontSize:'0.63rem',color:'var(--muted)',fontFamily:'var(--font-mono)'}}>{usage?percent+'%':'-'}</span>
          </div>
          <div style={{height:'4px',background:'var(--border)',borderRadius:'99px',overflow:'hidden'}}>
            <div style={{height:'100%',width:percent+'%',background:percent>80?'var(--error)':percent>60?'#f59e0b':'var(--accent)',borderRadius:'99px',transition:'width 0.5s'}}/>
          </div>
          {usage&&<p style={{fontSize:'0.6rem',color:'var(--muted)',fontFamily:'var(--font-mono)',marginTop:'4px'}}>{(usage.tokens_used||0).toLocaleString()} / {(usage.tokens_limit||1000000).toLocaleString()}</p>}
        </div>
      </div>
      {/* Itens do menu */}
      <div style={{padding:'6px'}}>
        {menuItems.map(function(item,i){
          if(!item)return <div key={i} style={{height:'1px',background:'var(--border)',margin:'4px 0'}}/>
          return(
            <button key={i} onClick={function(){item.action();onClose()}}
              style={{display:'flex',alignItems:'center',gap:'10px',width:'100%',background:'transparent',border:'none',borderRadius:'7px',padding:'8px 10px',cursor:'pointer',textAlign:'left',transition:'background 0.12s'}}
              onMouseEnter={function(e){e.currentTarget.style.background=item.danger?'rgba(248,113,113,0.1)':'rgba(255,255,255,0.05)'}}
              onMouseLeave={function(e){e.currentTarget.style.background='transparent'}}>
              <span style={{fontSize:'0.82rem',flexShrink:0}}>{item.icon}</span>
              <span style={{fontSize:'0.8rem',color:item.danger?'var(--error)':'var(--text)',fontFamily:'var(--font-ui)'}}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── TEMPLATE PREVIEW MODAL ────────────────────────────────────────────
function TemplatePreviewModal({template, onUse, onClose, onPrev, onNext, currentIndex, total}){
  // usa CodePreview diretamente

  return(
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:9998,
        background:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        animation:'fadeIn 0.2s ease',
        padding:'24px'
      }}
    >
      <div
        onClick={function(e){e.stopPropagation()}}
        style={{
          width:'100%', maxWidth:'1000px', height:'85vh',
          background:'#0e0e12',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:'20px', overflow:'hidden',
          display:'flex', flexDirection:'column',
          boxShadow:'0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
          animation:'fadeInScale 0.25s cubic-bezier(0.16,1,0.3,1)'
        }}
      >
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 20px',
          borderBottom:'1px solid rgba(255,255,255,0.07)',
          background:'rgba(255,255,255,0.02)',
          flexShrink:0
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{
              width:'36px', height:'36px', borderRadius:'10px',
              background:template.color+'22', border:'1px solid '+template.color+'44',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'1.1rem'
            }}>{template.icon}</div>
            <div>
              <p style={{color:'#fafafa', fontWeight:700, fontSize:'0.95rem', margin:0, fontFamily:'var(--font-ui)'}}>{template.name}</p>
              <p style={{color:'var(--muted)', fontSize:'0.75rem', margin:0, fontFamily:'var(--font-ui)'}}>{template.desc}</p>
            </div>
            <div style={{
              background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.2)',
              borderRadius:'99px', padding:'3px 10px',
              fontSize:'0.65rem', color:'#4ade80', fontFamily:'var(--font-mono)',
              fontWeight:600
            }}>GRÁTIS — SEM API</div>
          </div>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
              {/* Navegação entre templates */}
              <button onClick={onPrev} style={{
                background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',
                color:'#fafafa',borderRadius:'8px',padding:'7px 12px',
                fontSize:'0.9rem',cursor:'pointer',transition:'all 0.15s'
              }} onMouseEnter={function(e){e.currentTarget.style.background='rgba(255,255,255,0.1)'}}
                 onMouseLeave={function(e){e.currentTarget.style.background='rgba(255,255,255,0.06)'}}>
                {'‹'}
              </button>
              <span style={{color:'var(--muted)',fontSize:'0.72rem',fontFamily:'var(--font-mono)',minWidth:'36px',textAlign:'center'}}>
                {(currentIndex+1)+'/'+total}
              </span>
              <button onClick={onNext} style={{
                background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',
                color:'#fafafa',borderRadius:'8px',padding:'7px 12px',
                fontSize:'0.9rem',cursor:'pointer',transition:'all 0.15s'
              }} onMouseEnter={function(e){e.currentTarget.style.background='rgba(255,255,255,0.1)'}}
                 onMouseLeave={function(e){e.currentTarget.style.background='rgba(255,255,255,0.06)'}}>
                {'›'}
              </button>
            </div>
            <button
              onClick={onClose}
              style={{
                background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                color:'var(--muted)', borderRadius:'8px', padding:'7px 14px',
                fontSize:'0.78rem', cursor:'pointer', fontFamily:'var(--font-ui)'
              }}
            >✕ Fechar</button>
            <button
              onClick={function(){ onUse(template) }}
              style={{
                background:'linear-gradient(135deg, #4ade80, #22d3ee)',
                border:'none', color:'#000',
                borderRadius:'8px', padding:'8px 20px',
                fontSize:'0.82rem', fontWeight:700, cursor:'pointer',
                fontFamily:'var(--font-ui)',
                boxShadow:'0 0 24px rgba(74,222,128,0.4)'
              }}
            >Usar este template →</button>
          </div>
        </div>

        {/* Preview usando CodePreview que já funciona */}
        <div style={{flex:1, overflow:'hidden'}}>
          <CodePreview
            code={template.code}
            loading={false}
            licenseKey={null}
            onCodeFixed={function(){}}
          />
        </div>
      </div>
    </div>
  )
}


// ── SKELETON CARD ─────────────────────────────────────────────────────
function SkeletonCard(){
  return(
    <div className='skeleton-card animate-in' style={{minHeight:'240px'}}>
      <div className='skeleton' style={{height:'160px',borderRadius:'0'}}/>
      <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:'8px'}}>
        <div className='skeleton' style={{height:'14px',width:'60%'}}/>
        <div className='skeleton' style={{height:'11px',width:'40%'}}/>
        <div style={{display:'flex',gap:'6px',marginTop:'4px'}}>
          <div className='skeleton' style={{height:'20px',width:'48px',borderRadius:'99px'}}/>
          <div className='skeleton' style={{height:'20px',width:'36px',borderRadius:'99px'}}/>
        </div>
      </div>
    </div>
  )
}


// ── PROJECT CARD ──────────────────────────────────────────────────────
function ProjectCard({project,onOpen,onDelete,onToggleStar,onRename,onMoveFolder,folders,viewMode}){
  var thumbState=useState(project.thumbnail||null);var thumb=thumbState[0];var setThumb=thumbState[1]
  var loadingState=useState(false);var loadingThumb=loadingState[0];var setLoadingThumb=loadingState[1]
  var menuState=useState(false);var showMenu=menuState[0];var setShowMenu=menuState[1]
  useEffect(function(){
    if(project.thumbnail){setThumb(project.thumbnail);return}
    if(!project.components||project.components.length===0)return
    var last=project.components[project.components.length-1]
    setLoadingThumb(true)
    captureThumbnail(last.code,function(data){setLoadingThumb(false);if(data)setThumb(data)})
  },[project.id])

  function ContextMenu(){
    var items=[
      {icon:'✏️',label:'Renomear',action:function(){onRename(project.id,'__OPEN_MODAL__',project.name)}},
      {icon:project.starred?'★':'☆',label:project.starred?'Remover estrela':'Favoritar',action:function(){onToggleStar(project.id)}},
      {icon:'📁',label:'Mover para pasta',action:function(){onMoveFolder(project.id,'__OPEN_MODAL__',folders)}},
      {icon:'🔀',label:'Remixar projeto',action:function(){onOpen(project,'__REMIX__')}},
      {icon:'🌐',label:project.published?'Despublicar':'Publicar no perfil',action:function(){onToggleStar(project.id)}},
      null,
      {icon:'🗑',label:'Excluir',action:function(){onDelete(project.id)},danger:true},
    ]
    return(
      <div style={{position:'absolute',top:'40px',right:'8px',width:'200px',background:'#161b22',border:'1px solid var(--border)',borderRadius:'10px',boxShadow:'0 8px 24px rgba(0,0,0,0.6)',zIndex:100,overflow:'hidden',padding:'4px'}} onClick={function(e){e.stopPropagation()}}>
        {items.map(function(item,i){
          if(!item)return <div key={i} style={{height:'1px',background:'var(--border)',margin:'3px 0'}}/>
          return(
            <button key={i} onClick={function(e){e.stopPropagation();item.action();setShowMenu(false)}}
              style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',background:'transparent',border:'none',borderRadius:'6px',padding:'7px 10px',cursor:'pointer',textAlign:'left'}}
              onMouseEnter={function(e){e.currentTarget.style.background=item.danger?'rgba(248,113,113,0.1)':'rgba(255,255,255,0.06)'}}
              onMouseLeave={function(e){e.currentTarget.style.background='transparent'}}>
              <span style={{fontSize:'0.8rem',flexShrink:0}}>{item.icon}</span>
              <span style={{fontSize:'0.78rem',color:item.danger?'var(--error)':'var(--text)',fontFamily:'var(--font-ui)'}}>{item.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if(viewMode==='list') return(
    <div onClick={function(){onOpen(project)}} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'10px',cursor:'pointer',display:'flex',alignItems:'center',gap:'16px',padding:'12px 16px',transition:'border-color 0.2s,background 0.15s',position:'relative'}}
      onMouseEnter={function(e){e.currentTarget.style.borderColor='rgba(74,222,128,0.35)';e.currentTarget.style.background='rgba(74,222,128,0.02)'}}
      onMouseLeave={function(e){e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--surface)'}}>
      <div style={{width:'64px',height:'40px',borderRadius:'6px',overflow:'hidden',flexShrink:0,background:'#0d1117',border:'1px solid var(--border)'}}>
        {thumb?<img src={thumb} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:'1rem',color:'rgba(74,222,128,0.2)'}}>⬡</span></div>}
      </div>
      <div style={{flex:1,overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <p style={{fontWeight:600,fontSize:'0.88rem',color:'var(--text)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{project.name}</p>
          {project.published&&<span style={{fontSize:'0.62rem',background:'rgba(74,222,128,0.12)',color:'var(--accent)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:'99px',padding:'1px 7px',fontFamily:'var(--font-mono)',flexShrink:0}}>Publicado</span>}
          {project.folder&&<span style={{fontSize:'0.62rem',background:'rgba(255,255,255,0.06)',color:'var(--muted)',borderRadius:'99px',padding:'1px 7px',fontFamily:'var(--font-mono)',flexShrink:0}}>📁 {project.folder}</span>}
        </div>
        <p style={{fontSize:'0.7rem',color:'var(--muted)',fontFamily:'var(--font-mono)',marginTop:'2px'}}>{(project.components||[]).length} componentes · {project.createdAt}</p>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'4px',flexShrink:0}}>
        <button onClick={function(e){e.stopPropagation();onToggleStar(project.id)}} style={{background:'none',border:'none',color:project.starred?'#fbbf24':'var(--muted)',cursor:'pointer',fontSize:'0.9rem',padding:'4px'}}>{project.starred?'★':'☆'}</button>
        <button onClick={function(e){e.stopPropagation();setShowMenu(!showMenu)}} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:'1rem',padding:'4px',borderRadius:'5px'}} onMouseEnter={function(e){e.currentTarget.style.background='var(--border)'}} onMouseLeave={function(e){e.currentTarget.style.background='none'}}>⋯</button>
      </div>
      {showMenu&&<ContextMenu/>}
    </div>
  )

  return(
    <div onClick={function(){onOpen(project)}} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'visible',cursor:'pointer',display:'flex',flexDirection:'column',transition:'border-color 0.2s,transform 0.15s,box-shadow 0.2s',position:'relative'}}
      onMouseEnter={function(e){e.currentTarget.style.borderColor='rgba(74,222,128,0.4)';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'}}
      onMouseLeave={function(e){e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
      <div style={{height:'160px',background:'#0d1117',position:'relative',overflow:'hidden',borderRadius:'12px 12px 0 0',borderBottom:'1px solid var(--border)'}}>
        {thumb?<img src={thumb} alt={project.name} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>:loadingThumb?(
          <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'8px'}}>
            <div style={{width:'22px',height:'22px',border:'2px solid rgba(74,222,128,0.2)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
            <span style={{fontSize:'0.63rem',color:'var(--muted)',fontFamily:'var(--font-mono)'}}>Gerando preview...</span>
          </div>
        ):(
          <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'10px'}}>
            <span style={{fontSize:'2.2rem',color:'rgba(74,222,128,0.15)'}}>⬡</span>
            <span style={{fontSize:'0.68rem',color:'var(--muted)',fontFamily:'var(--font-mono)'}}>projeto vazio</span>
          </div>
        )}
        {project.published&&<div style={{position:'absolute',top:'8px',left:'8px',background:'rgba(74,222,128,0.9)',color:'#000',borderRadius:'99px',padding:'2px 9px',fontSize:'0.62rem',fontFamily:'var(--font-mono)',fontWeight:700}}>Publicado</div>}
        <button onClick={function(e){e.stopPropagation();onToggleStar(project.id)}} style={{position:'absolute',top:'8px',right:'32px',background:'rgba(0,0,0,0.5)',border:'none',borderRadius:'6px',color:project.starred?'#fbbf24':'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:'0.85rem',padding:'3px 6px',backdropFilter:'blur(4px)',transition:'color 0.15s'}} onMouseEnter={function(e){e.currentTarget.style.color='#fbbf24'}} onMouseLeave={function(e){e.currentTarget.style.color=project.starred?'#fbbf24':'rgba(255,255,255,0.5)'}}>{project.starred?'★':'☆'}</button>
        <button onClick={function(e){e.stopPropagation();setShowMenu(!showMenu)}} style={{position:'absolute',top:'8px',right:'6px',background:'rgba(0,0,0,0.5)',border:'none',borderRadius:'6px',color:'rgba(255,255,255,0.6)',cursor:'pointer',fontSize:'0.9rem',padding:'3px 6px',backdropFilter:'blur(4px)'}} onMouseEnter={function(e){e.currentTarget.style.color='#fff'}} onMouseLeave={function(e){e.currentTarget.style.color='rgba(255,255,255,0.6)'}}>⋯</button>
      </div>
      <div style={{padding:'13px 15px',display:'flex',alignItems:'center',justifyContent:'space-between',borderRadius:'0 0 12px 12px',overflow:'hidden'}}>
        <div style={{overflow:'hidden',flex:1}}>
          <p style={{fontWeight:700,fontSize:'0.88rem',color:'var(--text)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{project.name}</p>
          <p style={{fontSize:'0.68rem',color:'var(--muted)',fontFamily:'var(--font-mono)',marginTop:'3px'}}>{(project.components||[]).length} comp. · {project.createdAt}</p>
        </div>
      </div>
      {showMenu&&<ContextMenu/>}
    </div>
  )
}

// ── NAV ITEM ──────────────────────────────────────────────────────────
function NavItem({icon,label,active,onClick,count}){
  var hState=useState(false);var h=hState[0];var setH=hState[1]
  return(
    <button onClick={onClick} onMouseEnter={function(){setH(true)}} onMouseLeave={function(){setH(false)}}
      style={{display:'flex',alignItems:'center',gap:'9px',width:'100%',background:active?'rgba(74,222,128,0.1)':h?'rgba(255,255,255,0.04)':'transparent',border:'none',borderRadius:'7px',padding:'7px 10px',cursor:'pointer',textAlign:'left',transition:'background 0.12s'}}>
      <span style={{fontSize:'0.85rem',opacity:active?1:0.6,flexShrink:0}}>{icon}</span>
      <span style={{fontSize:'0.8rem',color:active?'var(--accent)':'var(--text)',fontFamily:'var(--font-ui)',fontWeight:active?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{label}</span>
      {count!==undefined&&<span style={{fontSize:'0.62rem',color:'var(--muted)',fontFamily:'var(--font-mono)',background:'var(--border)',padding:'1px 6px',borderRadius:'99px',flexShrink:0}}>{count}</span>}
    </button>
  )
}

// ── APP PRINCIPAL ─────────────────────────────────────────────────────
export default function App(){
  var licState=useState(loadLicense);var licenseKey=licState[0];var setLicenseKey=licState[1]
  var licInputState=useState('');var licInput=licInputState[0];var setLicInput=licInputState[1]
  var licErrState=useState('');var licError=licErrState[0];var setLicError=licErrState[1]
  var screenState=useState(loadLicense()?'projects':'license');var screen=screenState[0];var setScreen=screenState[1]
  var projsState=useState(loadProjects);var projects=projsState[0];var setProjects=projsState[1]
  var foldersState=useState(getFolders);var folders=foldersState[0];var setFolders=foldersState[1]
  var activeState=useState(null);var activeProject=activeState[0];var setActiveProject=activeState[1]
  var compsState=useState([]);var components=compsState[0];var setComponents=compsState[1]
  var selectedState=useState(null);var selected=selectedState[0];var setSelected=selectedState[1]
  var viewState=useState('single');var view=viewState[0];var setView=viewState[1]
  var promptState=useState('');var prompt=promptState[0];var setPrompt=promptState[1]
  var loadingState=useState(false);var loading=loadingState[0];var setLoading=loadingState[1]
  var errorState=useState('');var error=errorState[0];var setError=errorState[1]
  var filterState=useState('all');var filter=filterState[0];var setFilter=filterState[1]
  var searchState=useState('');var search=searchState[0];var setSearch=searchState[1]
  var homePromptState=useState('');var homePrompt=homePromptState[0];var setHomePrompt=homePromptState[1]
  var usernameState=useState(getUserName);var username=usernameState[0];var setUsername=usernameState[1]
  var sortState=useState('recent');var sortBy=sortState[0];var setSortBy=sortState[1]
  var viewModeState=useState('grid');var viewMode=viewModeState[0];var setViewMode=viewModeState[1]
  var visibilityState=useState('all');var visibility=visibilityState[0];var setVisibility=visibilityState[1]
  var deviceState=useState('desktop');var device=deviceState[0];var setDevice=deviceState[1]
  var previewModeState=useState(false);var previewMode=previewModeState[0];var setPreviewMode=previewModeState[1]
  var historyState=useState([]);var history=historyState[0];var setHistory=historyState[1]
  var undoStackState=useState([]);var undoStack=undoStackState[0];var setUndoStack=undoStackState[1]
  var userMenuState=useState(false);var showUserMenu=userMenuState[0];var setShowUserMenu=userMenuState[1]
  var cmdKState=useState(false);var cmdKOpen=cmdKState[0];var setCmdKOpen=cmdKState[1]
  var shortcutsState=useState(false);var showShortcuts=shortcutsState[0];var setShowShortcuts=shortcutsState[1]
  var streamingState=useState('');var streamingText=streamingState[0];var setStreamingText=streamingState[1]
  var agentStepsState=useState([]);var agentSteps=agentStepsState[0];var setAgentSteps=agentStepsState[1]
  var claudeMsgState=useState('');var claudeInitMsg=claudeMsgState[0];var setClaudeInitMsg=claudeMsgState[1]
  var claudePanelOpenState=useState(false);var claudePanelForced=claudePanelOpenState[0];var setClaudePanelForced=claudePanelOpenState[1]
  var agentCurrentState=useState(0);var agentCurrent=agentCurrentState[0];var setAgentCurrent=agentCurrentState[1]
  var agentDoneState=useState(false);var agentDone=agentDoneState[0];var setAgentDone=agentDoneState[1]
  var agentActiveState=useState(false);var agentActive=agentActiveState[0];var setAgentActive=agentActiveState[1]
  var toastHook=useToast();var toasts=toastHook.toasts;var toast=toastHook.toast
  var templatePreviewState=useState(null);var previewTemplate=templatePreviewState[0];var setPreviewTemplate=templatePreviewState[1]
  var introState=useState(function(){
    // Só mostra a intro uma vez por sessão
    return !sessionStorage.getItem('zp-intro-seen')
  });var showIntro=introState[0];var setShowIntro=introState[1]
  function dismissIntro(){
    sessionStorage.setItem('zp-intro-seen','1')
    setShowIntro(false)
  }
  var tokensState=useState(0);var totalTokens=tokensState[0];var setTotalTokens=tokensState[1]
  var sessionCostState=useState(0);var sessionCost=sessionCostState[0];var setSessionCost=sessionCostState[1]
  var creditLimitState=useState(function(){
    var saved=localStorage.getItem('zp-credit-limit')
    return saved?parseFloat(saved):5.00
  });var creditLimit=creditLimitState[0];var setCreditLimit=creditLimitState[1]
  var creditSpentState=useState(function(){
    var saved=localStorage.getItem('zp-credit-spent')
    return saved?parseFloat(saved):0
  });var creditSpent=creditSpentState[0];var setCreditSpent=creditSpentState[1]
  var showCreditSetupState=useState(false);var showCreditSetup=showCreditSetupState[0];var setShowCreditSetup=showCreditSetupState[1]
  var modalState=useState(null);var modal=modalState[0];var setModal=modalState[1]
  var showSearchState=useState(false);var showSearch=showSearchState[0];var setShowSearch=showSearchState[1]
  var activeFolderState=useState(null);var activeFolder=activeFolderState[0];var setActiveFolder=activeFolderState[1]

  useEffect(function(){saveProjects(projects)},[projects])

  // Garante que o nome seja coletado sempre que estiver vazio
  useEffect(function(){
    if(!loadLicense()) return
    var stored = getUserName()
    if(!stored || stored === 'Usuário' || stored === '') {
      setTimeout(function(){
        openModal({
          title:'Bem-vindo ao ZeroPreview! 👋',
          placeholder:'Qual e o seu nome?',
          confirmLabel:'Comecar',
          noCancel:true,
          onConfirm:function(name){
            var n=name||'Criador'
            saveUserName(n);setUsername(n);closeModal()
          }
        })
      }, 300)
    }
  }, [])
  useEffect(function(){saveFolders(folders)},[folders])

  // Atalhos globais de teclado
  useEffect(function(){
    function handleGlobalKey(e){
      var isCmd = e.ctrlKey||e.metaKey
      if(isCmd&&e.key==='k'){e.preventDefault();setCmdKOpen(function(v){return !v})}
      if(isCmd&&e.key==='/'){e.preventDefault();setShowShortcuts(function(v){return !v})}
      if(e.key==='Escape'){setCmdKOpen(false);setShowShortcuts(false)}
    }
    window.addEventListener('keydown',handleGlobalKey)
    return function(){window.removeEventListener('keydown',handleGlobalKey)}
  },[])

  function openModal(config){ setModal(config) }
  function closeModal(){ setModal(null) }

  function getHour(){var h=new Date().getHours();if(h<12)return 'Bom dia';if(h<18)return 'Boa tarde';return 'Boa noite'}

  function getFilteredProjects(){
    var list=projects.slice()
    if(filter==='starred')list=list.filter(function(p){return p.starred})
    if(activeFolder)list=list.filter(function(p){return p.folderId===activeFolder})
    if(visibility==='published')list=list.filter(function(p){return p.published})
    if(visibility==='draft')list=list.filter(function(p){return !p.published})
    if(search.trim()){var q=search.toLowerCase();list=list.filter(function(p){return p.name.toLowerCase().indexOf(q)>=0})}
    if(sortBy==='recent')list.sort(function(a,b){return(b.lastEdited||0)-(a.lastEdited||0)})
    if(sortBy==='name')list.sort(function(a,b){return a.name.localeCompare(b.name)})
    if(sortBy==='created')list.sort(function(a,b){return b.id-a.id})
    return list
  }

  function persistProject(newComps,newThumb){
    setProjects(function(prev){return prev.map(function(p){if(p.id!==activeProject.id)return p;var u=Object.assign({},p,{components:newComps,lastEdited:Date.now()});if(newThumb)u.thumbnail=newThumb;return u})})
  }

  async function handleActivate(){
    if(!licInput.trim())return;setLicError('')
    try{
      var res=await fetch(BACKEND_URL+'/license/status',{headers:{'x-license-key':licInput.trim()}})
      var data=await res.json()
      if(data.valid){
        saveLicense(licInput.trim());setLicenseKey(licInput.trim())
        var storedName=getUserName()
        if(!storedName||storedName==='Usuário'){
          setTimeout(function(){
            openModal({
              title:'Bem-vindo ao ZeroPreview! 👋',
              placeholder:'Qual e o seu nome?',
              confirmLabel:'Comecar',
              noCancel:true,
              onConfirm:function(name){var n=name||'Criador';saveUserName(n);setUsername(n);closeModal()}
            })
          },400)
        }
        setScreen('projects')
      }else{setLicError('Licenca inválida ou expirada.')}
    }catch(e){setLicError('Erro ao validar. Tente novamente.')}
  }

  function createProject(name){
    if(!name||!name.trim())return
    var proj={id:Date.now(),name:name.trim(),components:[],thumbnail:null,starred:false,published:false,folderId:activeFolder||null,createdAt:new Date().toLocaleDateString('pt-BR'),lastEdited:Date.now()}
    setProjects(function(prev){return[proj].concat(prev)});openProject(proj)
  }
  function handleNewProject(){
    openModal({
      title:'Novo projeto',
      placeholder:'Ex: Landing page para salao de beleza...',
      confirmLabel:'Criar projeto',
      onConfirm:function(name){createProject(name);closeModal()}
    })
  }
  function handleHomePromptSubmit(){if(!homePrompt.trim())return;createProject(homePrompt.trim().slice(0,40));setHomePrompt('')}

  function openProject(proj,isRemix){
    if(isRemix==='__REMIX__'){
      openModal({
        title:'Remixar "'+proj.name+'"',
        placeholder:'Nome do remix...',
        defaultValue:proj.name+' (Remix)',
        confirmLabel:'Remixar',
        onConfirm:function(name){
          var remix=Object.assign({},proj,{id:Date.now(),name:name,createdAt:new Date().toLocaleDateString('pt-BR'),lastEdited:Date.now(),starred:false,published:false})
          setProjects(function(prev){return[remix].concat(prev)})
          setActiveProject(remix);setComponents(remix.components||[])
          setSelected(null);setView('single');setScreen('editor')
          setHistory([]);setUndoStack([]);setDevice('desktop');setPreviewMode(false)
          closeModal()
        }
      })
      return
    }
    if(isRemix===true){setProjects(function(prev){return[proj].concat(prev)})}
    setActiveProject(proj);setComponents(proj.components||[])
    setSelected(null);setView('single');setScreen('editor')
    setHistory([]);setUndoStack([]);setDevice('desktop');setPreviewMode(false)
  }

  function deleteProject(id){
    openModal({
      title:'Excluir projeto?',
      confirmLabel:'Excluir',
      onConfirm:function(){setProjects(function(prev){return prev.filter(function(p){return p.id!==id})});closeModal()},
      children:<p style={{fontSize:'0.85rem',color:'#a1a1aa',marginBottom:'16px',fontFamily:'var(--font-ui)',lineHeight:1.6}}>Esta acao e permanente e nao pode ser desfeita. Todos os componentes do projeto serao perdidos.</p>
    })
  }
  function toggleStar(id){setProjects(function(prev){return prev.map(function(p){return p.id===id?Object.assign({},p,{starred:!p.starred}):p})})}
  function togglePublished(id){setProjects(function(prev){return prev.map(function(p){return p.id===id?Object.assign({},p,{published:!p.published}):p})});setActiveProject(function(prev){return prev?Object.assign({},prev,{published:!prev.published}):prev})}
  function renameProject(id,name,currentName){
    if(name==='__OPEN_MODAL__'){
      openModal({title:'Renomear projeto',placeholder:'Novo nome...',defaultValue:currentName||'',confirmLabel:'Renomear',onConfirm:function(n){setProjects(function(prev){return prev.map(function(p){return p.id===id?Object.assign({},p,{name:n}):p})});closeModal()}})
    } else {
      setProjects(function(prev){return prev.map(function(p){return p.id===id?Object.assign({},p,{name:name}):p})})
    }
  }
  function moveToFolder(projectId,folderId,foldersArg){
    if(folderId==='__OPEN_MODAL__'){
      var fl=foldersArg||folders
      if(fl.length===0){openModal({title:'Sem pastas',confirmLabel:'OK',noCancel:true,onConfirm:closeModal,children:'Crie uma pasta primeiro usando o link "Nova pasta" na sidebar.'});return}
      openModal({
        title:'Mover para pasta',
        confirmLabel:'Mover',
        onConfirm:function(name){
          var found=fl.find(function(f){return f.name===name})
          if(found){setProjects(function(prev){return prev.map(function(p){return p.id===projectId?Object.assign({},p,{folderId:found.id,folder:found.name}):p})})}
          closeModal()
        },
        children:(
          <div style={{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'16px'}}>
            {fl.map(function(f){return(
              <button key={f.id} onClick={function(){setProjects(function(prev){return prev.map(function(p){return p.id===projectId?Object.assign({},p,{folderId:f.id,folder:f.name}):p})});closeModal()}}
                style={{background:'#09090b',border:'1px solid #3f3f46',borderRadius:'8px',padding:'10px 14px',cursor:'pointer',textAlign:'left',color:'#fafafa',fontFamily:'var(--font-ui)',fontSize:'0.88rem',display:'flex',alignItems:'center',gap:'10px',transition:'border-color 0.15s'}}
                onMouseEnter={function(e){e.currentTarget.style.borderColor='#4ade80'}}
                onMouseLeave={function(e){e.currentTarget.style.borderColor='#3f3f46'}}>
                <span>📁</span><span>{f.name}</span>
              </button>
            )})}
          </div>
        )
      })
    } else {
      var folderName=folders.find(function(f){return f.id===folderId})
      setProjects(function(prev){return prev.map(function(p){return p.id===projectId?Object.assign({},p,{folderId:folderId,folder:folderName?folderName.name:''}):p})})
    }
  }
  function createFolder(){
    openModal({
      title:'Nova pasta',
      placeholder:'Nome da pasta...',
      confirmLabel:'Criar pasta',
      onConfirm:function(name){var f={id:Date.now(),name:name.trim()};setFolders(function(prev){return prev.concat([f])});closeModal()}
    })
  }
  function handleRenameUser(name){saveUserName(name);setUsername(name)}

  function handleReorder(fromIndex,toIndex){
    if(fromIndex===toIndex)return
    var newComps=components.slice()
    var item=newComps.splice(fromIndex,1)[0]
    newComps.splice(toIndex,0,item)
    setUndoStack(function(s){return s.concat([components.slice()])})
    setComponents(newComps);persistProject(newComps,null)
  }

  function handleUndo(){
    if(undoStack.length===0)return
    var prev=undoStack[undoStack.length-1]
    setUndoStack(function(s){return s.slice(0,-1)})
    setComponents(prev);persistProject(prev,null);setSelected(null)
  }

  function openClaudeWithMsg(msg){
    setClaudeInitMsg(msg)
    setClaudePanelForced(true)
    setTimeout(function(){setClaudePanelForced(false)},500)
  }

  async function runAgentMode(text){
    setAgentActive(true);setAgentSteps([]);setAgentCurrent(0);setAgentDone(false)
    setLoading(true);setStreamingText('Planejando estrutura do app...')
    setHistory(function(h){return h.concat([{role:'user',text:text,time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}])})
    try{
      var plan = await callAgentPlan(text, licenseKey)
      if(!plan||plan.length===0) throw new Error('Nao foi possivel gerar o plano')
      setAgentSteps(plan)
      setStreamingText('')
      var builtComps = []
      var t0 = Date.now()
      for(var i=0;i<plan.length;i++){
        setAgentCurrent(i)
        var step = plan[i]
        var compPrompt = 'Create the React component "'+step.name+'" for this app. '+
          step.description+'. '+
          'STRICT: No template literals. No imports. No className. Only inline styles. '+
          'Use string concatenation with + only. Start with: export default function'
        var code = await callAPI(compPrompt, builtComps, licenseKey)
        var newComp = {id:Date.now()+i*7, name:step.name, code:code}
        builtComps = builtComps.concat([newComp])
        setComponents(builtComps.slice())
        setSelected(newComp)
        setView('single')
        var snapComps = builtComps.slice()
        var isLast = (i===plan.length-1)
        if(isLast){
          captureThumbnail(code,function(thumb){
            setProjects(function(prev){return prev.map(function(p){
              if(p.id!==activeProject.id)return p
              return Object.assign({},p,{components:snapComps,lastEdited:Date.now(),thumbnail:thumb||p.thumbnail})
            })})
          })
        } else {
          setProjects(function(prev){return prev.map(function(p){
            if(p.id!==activeProject.id)return p
            return Object.assign({},p,{components:snapComps,lastEdited:Date.now()})
          })})
        }
      }
      var elapsed = ((Date.now()-t0)/1000).toFixed(1)+'s'
      setAgentDone(true)
      toast.success(plan.length+' componentes gerados em '+elapsed, elapsed)
      setHistory(function(h){return h.concat([{role:'ai',text:'App completo! '+plan.length+' comp. em '+elapsed,time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}])})
      setView('app')
      setTimeout(function(){setAgentActive(false);setAgentSteps([]);setAgentDone(false)},4000)
    }catch(e){
      setError(e.message);toast.error('Erro no agente: '+e.message.slice(0,60))
      setAgentActive(false);setAgentSteps([]);setAgentDone(false)
    }finally{
      setLoading(false);setStreamingText('')
    }
  }

  async function handleGenerate(){
    if(!prompt.trim()||loading||agentActive)return
    var text=prompt.trim();setPrompt('');setError('')
    var time=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    setHistory(function(h){return h.concat([{role:'user',text:text,time:time}])})

    // ── MODO AGENTE: detecta se e app/site completo ──
    if(detectAgentMode(text)){
      // Se já tem componentes, perguntar se quer substituir
      if(components.length > 0){
        openModal({
          title:'Construir novo app?',
          confirmLabel:'Substituir tudo',
          onConfirm:function(){
            closeModal()
            setUndoStack(function(s){return s.concat([components.slice()])})
            setComponents([]);setSelected(null)
            runAgentMode(text)
          },
          children:(
            <div>
              <p style={{fontSize:'0.87rem',color:'#a1a1aa',marginBottom:'16px',fontFamily:'var(--font-ui)',lineHeight:1.6}}>
                Este projeto já tem <strong style={{color:'#fafafa'}}>{components.length} componente{components.length!==1?'s':''}</strong>. O modo agente vai construir um app completo do zero.
              </p>
              <p style={{fontSize:'0.82rem',color:'#71717a',fontFamily:'var(--font-ui)',lineHeight:1.6}}>
                Os componentes atuais serao substituídos. Você pode desfazer depois com ↩.
              </p>
            </div>
          )
        })
        return
      }
      runAgentMode(text)
      return
    }
    // ── MODO NORMAL: componente único ──
    setLoading(true)
    var t0=Date.now()
    var streamSteps=['Analisando seu prompt...','Planejando estrutura...','Gerando código React...','Aplicando estilos...','Finalizando...']
    var stepIdx=0
    setStreamingText(streamSteps[0])
    var streamTimer=setInterval(function(){
      stepIdx=Math.min(stepIdx+1,streamSteps.length-1)
      setStreamingText(streamSteps[stepIdx])
    },1000)
    setUndoStack(function(s){return s.concat([components.slice()])})
    var genCode
    var genError
    try{
      genCode=await callAPI(text,components,licenseKey,function(t){
        var cost=t*0.000003
        setTotalTokens(function(p){return p+t})
        setSessionCost(function(p){return p+cost})
        setCreditSpent(function(p){
          var n=p+cost
          localStorage.setItem('zp-credit-spent',n.toFixed(6))
          return n
        })
      })
    }catch(e){
      genError=e
    }
    clearInterval(streamTimer)
    setStreamingText('')
    if(genError){
      setError(genError.message)
      toast.error('Erro ao gerar: '+genError.message.slice(0,60))
      setHistory(function(h){return h.concat([{role:'ai',text:'Erro: '+genError.message,time:''}])})
      setLoading(false)
      return
    }
    var elapsed=((Date.now()-t0)/1000).toFixed(1)+'s'
    var name=text.slice(0,30)+(text.length>30?'...':'')
    var newComp={id:Date.now(),name:name,code:genCode}
    var newComps=components.concat([newComp])
    setComponents(newComps);setSelected(newComp);setView('single')
    toast.success('Componente gerado em '+elapsed, elapsed)
    setHistory(function(h){return h.concat([{role:'ai',text:'"'+name+'" gerado em '+elapsed,time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}])})
    captureThumbnail(genCode,function(thumb){persistProject(newComps,thumb)})
    setLoading(false)
  }

  async function handleEdit(comp,instruction){
    setError('');setLoading(true)
    setUndoStack(function(s){return s.concat([components.slice()])})
    try{
      var code=await callAPI('Refactor this component: "'+instruction+'"\n\nCode:\n'+comp.code,components.filter(function(c){return c.id!==comp.id}),licenseKey)
      var newComps=components.map(function(c){return c.id===comp.id?Object.assign({},c,{code:code}):c})
      setComponents(newComps);setSelected(Object.assign({},comp,{code:code}))
      captureThumbnail(code,function(thumb){persistProject(newComps,thumb)})
    }catch(e){setError(e.message);toast.error('Erro ao editar: '+e.message.slice(0,60))}finally{setLoading(false)}
  }

  function handleDelete(id){
    setUndoStack(function(s){return s.concat([components.slice()])})
    var newComps=components.filter(function(c){return c.id!==id})
    setComponents(newComps);persistProject(newComps,null)
    if(selected&&selected.id===id)setSelected(null)
  }

  function handleCmdAction(actionId){
    if(actionId==='new-project') handleNewProject()
    if(actionId==='search') setShowSearch(true)
    if(actionId==='starred') {setFilter('starred');setScreen('projects')}
    if(actionId==='new-folder') createFolder()
    if(actionId==='undo') handleUndo()
    if(actionId==='preview') setPreviewMode(function(v){return !v})
    if(actionId==='desktop') setDevice('desktop')
    if(actionId==='tablet') setDevice('tablet')
    if(actionId==='mobile') setDevice('mobile')
    if(actionId==='app-view') setView(function(v){return v==='app'?'single':'app'})
    if(actionId==='export-zip'&&activeProject&&components.length>0) exportZip(activeProject,components)
    if(actionId==='deploy'&&activeProject) handleDeploy()
    if(actionId==='share') handleShare()
    if(actionId==='publish'&&activeProject) togglePublished(activeProject.id)
    if(actionId==='shortcuts') setShowShortcuts(true)
  }

  function handleShare(){
    var url='https://zeroprev.app/preview/'+activeProject.id
    navigator.clipboard.writeText(url).then(function(){alert('Link copiado!')}).catch(function(){alert('Link: '+url)})
  }

  async function handleDeploy(){
    if(components.length===0){alert('Adicione pelo menos um componente antes de fazer deploy.');return}
    var appCode=buildAppCode(components)
    var name=activeProject.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
    // Monta o projeto como JSON para o Vercel via drag-and-drop export
    // Como nao temos token Vercel do usuário, geramos o ZIP e abrimos o Vercel Import
    var files={
      'index.html':'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>'+activeProject.name+'</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>',
      'src/main.jsx':'import React from "react"\nimport ReactDOM from "react-dom/client"\nimport App from "./App.jsx"\nReactDOM.createRoot(document.getElementById("root")).render(<App />)',
      'src/App.jsx':'import React, { useState } from "react"\n\n'+appCode,
      'package.json':JSON.stringify({name:name||'meu-app',version:'1.0.0',scripts:{dev:'vite',build:'vite build',preview:'vite preview'},dependencies:{react:'^18.3.1','react-dom':'^18.3.1'},devDependencies:{'@vitejs/plugin-react':'^4.3.4',vite:'^6.0.0'}},null,2),
      'vite.config.js':'import { defineConfig } from "vite"\nimport react from "@vitejs/plugin-react"\nexport default defineConfig({ plugins: [react()] })',
      'vercel.json':'{"buildCommand":"npm run build","outputDirectory":"dist","framework":"vite"}'
    }
    var JSZip=(await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default
    var zip=new JSZip()
    Object.entries(files).forEach(function(e){zip.file(e[0],e[1])})
    var blob=await zip.generateAsync({type:'blob'})
    var url=URL.createObjectURL(blob)
    var a=document.createElement('a');a.href=url;a.download=(name||'meu-app')+'-vercel.zip';a.click()
    URL.revokeObjectURL(url)
    setTimeout(function(){window.open('https://vercel.com/new','_blank')},800)
    alert('ZIP baixado! Agora:\n1. Extraia o ZIP\n2. Na aba Vercel que abriu, clique em "Import"\n3. Arraste a pasta extraída\n4. Clique Deploy - seu app estará online em segundos!')
  }

  // ── TELA LICENÇA ──────────────────────────────────────────────────────
  function useTemplate(t){
    setPreviewTemplate(null)
    var proj={id:Date.now(),name:t.name,components:[{id:Date.now()+1,name:t.name,code:t.code}],createdAt:Date.now(),lastEdited:Date.now(),starred:false,published:false,thumbnail:null}
    setProjects(function(p){var n=p.concat([proj]);saveProjects(n);return n})
    setActiveProject(proj);setComponents(proj.components)
    setSelected(proj.components[0]);setView('single');setScreen('editor')
  }

  if(showIntro) return <IntroScreen onDone={dismissIntro}/>
  if(screen==='license')return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)'}}>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'16px',padding:'44px',width:'420px',display:'flex',flexDirection:'column',gap:'22px',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
        <div style={{textAlign:'center'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:'12px'}}><Logo size={52}/></div>
          <h1 style={{fontFamily:'var(--font-ui)',fontSize:'1.7rem',color:'var(--text)',margin:0,fontWeight:700,letterSpacing:'-0.02em'}}>Zero<span style={{color:'var(--accent)'}}>Preview</span></h1>
          <p style={{color:'var(--text-2)',fontSize:'0.9rem',marginTop:'8px',lineHeight:1.6,fontWeight:400}}>Crie apps completos com IA em minutos.</p>
        </div>
        <input type="text" placeholder="zp_xxxxxxxxx_xxxxxxxxxx" value={licInput} onChange={function(e){setLicInput(e.target.value)}} onKeyDown={function(e){if(e.key==='Enter')handleActivate()}} style={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:'0.88rem',padding:'13px 14px',outline:'none',letterSpacing:'0.08em'}}/>
        {licError&&<p style={{color:'var(--error)',fontSize:'0.82rem',textAlign:'center',margin:0}}>{licError}</p>}
        <button onClick={handleActivate} style={{background:'var(--accent)',color:'#000',border:'none',borderRadius:'8px',padding:'14px',fontWeight:700,fontSize:'0.95rem',cursor:'pointer',fontFamily:'var(--font-ui)',letterSpacing:'0.02em'}}>Ativar Licenca</button>
        <p style={{color:'var(--muted)',fontSize:'0.72rem',textAlign:'center',margin:0,fontFamily:'var(--font-mono)'}}>Nao tem uma licenca? Acesse zeroprev.app</p>
      </div>
    </div>
  )

  // ── TELA PROJETOS ─────────────────────────────────────────────────────
  if(screen==='projects'){
    var filtered=getFilteredProjects()
    return(
      <div style={{display:'flex',height:'100vh',background:'var(--bg)',overflow:'hidden'}} onClick={function(){if(showUserMenu)setShowUserMenu(false)}}>
        <style>{'@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}</style>

        {/* SIDEBAR */}
        <aside style={{width:'220px',flexShrink:0,borderRight:'1px solid var(--border)',background:'var(--surface)',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
          <div style={{padding:'18px 16px 14px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}><Logo size={22}/><span style={{fontFamily:'var(--font-ui)',fontWeight:700,fontSize:'1rem',color:'var(--text)',letterSpacing:'-0.01em'}}>Zero<span style={{color:'var(--accent)'}}>Preview</span></span></div>
          </div>
          <div style={{padding:'10px 8px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
            <NavItem icon="🏠" label="Lar" active={filter==='all'&&!search&&!activeFolder} onClick={function(){setFilter('all');setSearch('');setActiveFolder(null)}}/>
            <NavItem icon="🔍" label="Procurar" active={!!search||showSearch} onClick={function(){setShowSearch(!showSearch);if(search)setSearch('')}}/>
            <NavItem icon="📦" label="Recursos" active={false} onClick={function(){alert('Em breve: templates, componentes e integracões.')}}/>
          </div>
          <div style={{padding:'10px 8px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
            <p style={{fontSize:'0.67rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,fontFamily:'var(--font-mono)',padding:'4px 10px',marginBottom:'4px'}}>Projetos</p>
            <NavItem icon="⊞" label="Todos os projetos" active={filter==='all'&&!activeFolder} count={projects.length} onClick={function(){setFilter('all');setSearch('');setActiveFolder(null)}}/>
            <NavItem icon="★" label="Estrelados" active={filter==='starred'} count={projects.filter(function(p){return p.starred}).length} onClick={function(){setFilter('starred');setActiveFolder(null)}}/>
            <NavItem icon="👤" label="Criado por mim" active={false} onClick={function(){setFilter('all');setActiveFolder(null)}}/>
            {/* Pastas */}
            {folders.map(function(f){
              return <NavItem key={f.id} icon="📁" label={f.name} active={activeFolder===f.id} count={projects.filter(function(p){return p.folderId===f.id}).length} onClick={function(){setActiveFolder(f.id);setFilter('all')}}/>
            })}
            <button onClick={createFolder} style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',background:'transparent',border:'none',borderRadius:'7px',padding:'6px 10px',cursor:'pointer',color:'var(--muted)',fontSize:'0.75rem',fontFamily:'var(--font-ui)',transition:'background 0.12s'}} onMouseEnter={function(e){e.currentTarget.style.background='rgba(255,255,255,0.04)'}} onMouseLeave={function(e){e.currentTarget.style.background='transparent'}}>
              <span style={{opacity:0.5}}>+</span><span>Nova pasta</span>
            </button>
          </div>
          <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',padding:'10px 8px'}}>
            <p style={{fontSize:'0.67rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,fontFamily:'var(--font-mono)',padding:'4px 10px',marginBottom:'4px',flexShrink:0}}>Recentes</p>
            <div style={{flex:1,overflowY:'auto'}}>
              {projects.slice().sort(function(a,b){return(b.lastEdited||0)-(a.lastEdited||0)}).slice(0,8).map(function(p){
                return(<button key={p.id} onClick={function(){openProject(p)}} style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',background:'transparent',border:'none',borderRadius:'6px',padding:'6px 10px',cursor:'pointer',textAlign:'left',transition:'background 0.12s'}} onMouseEnter={function(e){e.currentTarget.style.background='rgba(255,255,255,0.04)'}} onMouseLeave={function(e){e.currentTarget.style.background='transparent'}}>
                  <span style={{fontSize:'0.75rem',color:'rgba(74,222,128,0.5)',flexShrink:0}}>◇</span>
                  <span style={{fontSize:'0.78rem',color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--font-ui)'}}>{p.name}</span>
                </button>)
              })}
              {projects.length===0&&<p style={{fontSize:'0.73rem',color:'var(--muted)',fontFamily:'var(--font-mono)',padding:'4px 10px',opacity:0.6}}>Nenhum projeto ainda.</p>}
            </div>
          </div>
          {/* USER BUTTON (item 18) */}
          <div style={{position:'relative'}}>
            {showUserMenu&&<UserMenu username={username||'Usuário'} onRename={handleRenameUser} onClose={function(){setShowUserMenu(false)}} licenseKey={licenseKey}/>}
            <button onClick={function(e){e.stopPropagation();setShowUserMenu(!showUserMenu)}} style={{width:'100%',padding:'12px 14px',borderTop:'1px solid var(--border)',background:'transparent',border:'none',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',transition:'background 0.12s'}} onMouseEnter={function(e){e.currentTarget.style.background='rgba(255,255,255,0.04)'}} onMouseLeave={function(e){e.currentTarget.style.background='transparent'}}>
              <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'linear-gradient(135deg,#4ade80,#22d3ee)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.8rem',fontWeight:700,color:'#000',flexShrink:0}}>{username?username.charAt(0).toUpperCase():'U'}</div>
              <div style={{overflow:'hidden',flex:1,textAlign:'left'}}>
                <p style={{fontSize:'0.8rem',color:'var(--text)',fontWeight:600,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{username||'Usuário'}</p>
                <p style={{fontSize:'0.65rem',color:'var(--muted)',fontFamily:'var(--font-mono)',margin:0}}>Pro</p>
              </div>
              <span style={{color:'var(--muted)',fontSize:'0.7rem',flexShrink:0,opacity:0.6}}>{showUserMenu?'▼':'▲'}</span>
            </button>
          </div>
        </aside>

        {/* ÁREA PRINCIPAL */}
        <main style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'12px 28px',borderBottom:'1px solid var(--border)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--surface)',gap:'12px'}}>
            <div>
              {showSearch?(
              <SearchBar value={search} onChange={setSearch} onClose={function(){setShowSearch(false)}}/>
            ):(
              <div>
                <h1 style={{fontSize:'1.05rem',fontWeight:700,color:'var(--text)',margin:0,fontFamily:'var(--font-ui)'}}>
                  {activeFolder&&folders.find(function(f){return f.id===activeFolder})?folders.find(function(f){return f.id===activeFolder}).name:filter==='starred'?'Estrelados':search?'Busca: "'+search+'"':'Projetos'}
                </h1>
                <p style={{fontSize:'0.7rem',color:'var(--muted)',fontFamily:'var(--font-mono)',marginTop:'1px'}}>{filtered.length} projeto{filtered.length!==1?'s':''}</p>
              </div>
            )}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px',flex:1,justifyContent:'center',flexWrap:'wrap'}}>
              <select value={sortBy} onChange={function(e){setSortBy(e.target.value)}} style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'7px',color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:'0.74rem',padding:'5px 10px',outline:'none',cursor:'pointer'}}>
                <option value="recent">Última edicao</option>
                <option value="created">Data de criacao</option>
                <option value="name">Nome A-Z</option>
              </select>
              <select value={visibility} onChange={function(e){setVisibility(e.target.value)}} style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'7px',color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:'0.74rem',padding:'5px 10px',outline:'none',cursor:'pointer'}}>
                <option value="all">Qualquer visibilidade</option>
                <option value="published">Publicado</option>
                <option value="draft">Rascunho</option>
              </select>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
              <div style={{display:'flex',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'7px',overflow:'hidden'}}>
                <button onClick={function(){setViewMode('grid')}} style={{background:viewMode==='grid'?'var(--border)':'transparent',border:'none',color:viewMode==='grid'?'var(--text)':'var(--muted)',padding:'5px 10px',cursor:'pointer',fontSize:'0.8rem',transition:'all 0.15s'}} title="Grade">⊞</button>
                <button onClick={function(){setViewMode('list')}} style={{background:viewMode==='list'?'var(--border)':'transparent',border:'none',color:viewMode==='list'?'var(--text)':'var(--muted)',padding:'5px 10px',cursor:'pointer',fontSize:'0.8rem',transition:'all 0.15s'}} title="Lista">☰</button>
              </div>
              <button onClick={function(){setCmdKOpen(true)}} style={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'7px',padding:'6px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:'5px',transition:'border-color 0.15s'}} title="Command Palette (⌘K)" onMouseEnter={function(e){e.currentTarget.style.borderColor='var(--accent-border)'}} onMouseLeave={function(e){e.currentTarget.style.borderColor='var(--border)'}}>
                <span style={{color:'var(--muted)',fontSize:'0.8rem'}}>⌘</span>
                <span style={{color:'var(--muted)',fontSize:'0.72rem',fontFamily:'var(--font-mono)'}}>K</span>
              </button>
              <button onClick={handleNewProject} style={{background:'var(--accent)',color:'#000',border:'none',borderRadius:'8px',padding:'7px 16px',fontWeight:700,fontSize:'0.82rem',cursor:'pointer',fontFamily:'var(--font-ui)',whiteSpace:'nowrap'}}>+ Novo</button>
            </div>
          </div>

          {filter==='all'&&!search&&!activeFolder&&projects.length>=0&&(
            <div style={{padding:projects.length===0?'0':'20px 28px 0',flexShrink:0}}>
              {projects.length===0?(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'48px 40px',gap:'32px',overflowY:'auto',maxHeight:'calc(100vh - 60px)'}}>
                  {/* Saudacao */}
                  <div style={{textAlign:'center'}}>
                    <h2 style={{fontSize:'2rem',fontWeight:700,color:'var(--text)',margin:0,lineHeight:1.2,letterSpacing:'-0.02em'}}>{getHour()}{username&&<span className='greeting-name'>, {username}</span>}<span style={{color:'var(--accent)'}}>.</span></h2>
                    <p style={{color:'var(--muted)',fontSize:'0.92rem',marginTop:'8px'}}>O que vamos construir hoje?</p>
                  </div>
                  {/* Input central */}
                  <div style={{width:'100%',maxWidth:'640px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'14px',padding:'4px',display:'flex',gap:'8px',boxShadow:'0 4px 32px rgba(0,0,0,0.25)',transition:'border-color 0.2s'}} onMouseEnter={function(e){e.currentTarget.style.borderColor='var(--accent-border)'}} onMouseLeave={function(e){e.currentTarget.style.borderColor='var(--border)'}}>
                    <input value={homePrompt} onChange={function(e){setHomePrompt(e.target.value)}} onKeyDown={function(e){if(e.key==='Enter')handleHomePromptSubmit()}} placeholder="Ex: Um CRM para salao de beleza com clientes, agenda e financeiro..." style={{flex:1,background:'transparent',border:'none',color:'var(--text)',fontFamily:'var(--font-ui)',fontSize:'0.92rem',padding:'13px 16px',outline:'none'}}/>
                    <button onClick={handleHomePromptSubmit} style={{background:'var(--accent)',color:'#000',border:'none',borderRadius:'10px',padding:'10px 20px',fontWeight:700,fontSize:'0.88rem',cursor:'pointer',fontFamily:'var(--font-ui)',flexShrink:0}}>Criar →</button>
                  </div>
                  {/* Templates */}
                  <div style={{width:'100%',maxWidth:'900px'}}>
                    <p style={{fontSize:'0.75rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,marginBottom:'16px',textAlign:'center'}}>Ou comece com um template</p>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'12px'}}>
                      {TEMPLATES.map(function(t){
                        return(
                          <div key={t.id} onClick={function(){ setPreviewTemplate(t) }}
                            style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',padding:'18px',cursor:'pointer',display:'flex',gap:'14px',alignItems:'flex-start',transition:'all 0.18s',position:'relative',overflow:'hidden'}}
                            onMouseEnter={function(e){e.currentTarget.style.borderColor=t.color;e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,0.3), 0 0 0 1px '+t.color+'22'}}
                            onMouseLeave={function(e){e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:t.color+'22',border:'1px solid '+t.color+'44',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>{t.icon}</div>
                            <div style={{flex:1}}>
                              <p style={{fontSize:'0.88rem',fontWeight:600,color:'var(--text)',margin:'0 0 3px'}}>{t.name}</p>
                              <p style={{fontSize:'0.75rem',color:'var(--muted)',lineHeight:1.4,margin:0}}>{t.desc}</p>
                            </div>
                            <span style={{fontSize:'0.6rem',color:t.color,fontFamily:'var(--font-mono)',fontWeight:700,flexShrink:0,opacity:0.7}}>PREVIEW</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ):(
                <>
                  <h2 style={{fontSize:'1.4rem',fontWeight:700,color:'var(--text)',margin:'0 0 14px',letterSpacing:'-0.02em'}}>{getHour()}{username&&<span className='greeting-name'>, {username}</span>}<span style={{color:'var(--accent)'}}>.</span></h2>
                  <div className='prompt-input-wrap' style={{width:'100%',maxWidth:'680px',borderRadius:'12px',padding:'4px',display:'flex',gap:'8px',marginBottom:'14px'}}>
                    <input value={homePrompt} onChange={function(e){setHomePrompt(e.target.value)}} onKeyDown={function(e){if(e.key==='Enter')handleHomePromptSubmit()}} placeholder="Ex: Landing page para academia com planos e depoimentos..." style={{flex:1,background:'transparent',border:'none',color:'var(--text)',fontFamily:'var(--font-ui)',fontSize:'0.87rem',padding:'10px 14px',outline:'none'}}/>
                    <button onClick={handleHomePromptSubmit} style={{background:'var(--accent)',color:'#000',border:'none',borderRadius:'8px',padding:'8px 16px',fontWeight:700,fontSize:'0.83rem',cursor:'pointer',fontFamily:'var(--font-ui)',flexShrink:0}}>Criar →</button>
                  </div>
                  {/* Templates sempre visíveis */}
                  <div style={{width:'100%',maxWidth:'680px',marginBottom:'20px'}}>
                    <p style={{fontSize:'0.7rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,marginBottom:'10px'}}>Templates rápidos</p>
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                      {TEMPLATES.map(function(t){
                        return(
                          <button key={t.id} onClick={function(){ setPreviewTemplate(t) }}
                            className='template-chip animate-in'
                            style={{borderColor:'var(--border)'}}
                            onMouseEnter={function(e){e.currentTarget.style.borderColor=t.color;e.currentTarget.style.boxShadow='0 0 20px '+t.color+'22'}}
                            onMouseLeave={function(e){e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
                            <span style={{fontSize:'0.9rem'}}>{t.icon}</span>
                            <span style={{fontSize:'0.78rem',color:'var(--text-2)',fontFamily:'var(--font-ui)',fontWeight:500}}>{t.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {!(filter==='all'&&!search&&!activeFolder&&projects.length===0)&&(
            <div style={{flex:1,overflowY:'auto',padding:'0 28px 32px'}}>
              {viewMode==='grid'?(
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'18px',paddingTop:filter==='all'&&!search&&!activeFolder?'0':'20px'}}>
                  {filter==='all'&&!search&&(
                    <div onClick={handleNewProject} className='animate-in' style={{background:'transparent',border:'2px dashed var(--border)',borderRadius:'12px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'240px',gap:'10px',transition:'all 0.2s'}} onMouseEnter={function(e){e.currentTarget.style.borderColor='rgba(74,222,128,0.4)';e.currentTarget.style.background='rgba(74,222,128,0.02)'}} onMouseLeave={function(e){e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='transparent'}}>
                      <span style={{fontSize:'1.8rem',color:'rgba(74,222,128,0.25)'}}>+</span>
                      <span style={{color:'var(--muted)',fontSize:'0.8rem',fontFamily:'var(--font-mono)'}}>Novo projeto</span>
                    </div>
                  )}
                  {filtered.map(function(p){return <ProjectCard key={p.id} project={p} onOpen={openProject} onDelete={deleteProject} onToggleStar={toggleStar} onRename={renameProject} onMoveFolder={moveToFolder} folders={folders} viewMode="grid"/>})}
                  {filtered.length===0&&<div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px',gap:'12px'}}><span className='empty-state-icon' style={{fontSize:'2.5rem',color:'rgba(74,222,128,0.2)'}}>⬡</span><p style={{color:'var(--muted)',fontFamily:'var(--font-mono)',fontSize:'0.85rem',marginTop:'4px'}}>Nenhum projeto encontrado.</p></div>}
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:'8px',paddingTop:'20px'}}>
                  {filtered.map(function(p){return <ProjectCard key={p.id} project={p} onOpen={openProject} onDelete={deleteProject} onToggleStar={toggleStar} onRename={renameProject} onMoveFolder={moveToFolder} folders={folders} viewMode="list"/>})}
                  {filtered.length===0&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px',gap:'12px'}}><span className='empty-state-icon' style={{fontSize:'2.5rem',color:'rgba(74,222,128,0.2)'}}>⬡</span><p style={{color:'var(--muted)',fontFamily:'var(--font-mono)',fontSize:'0.85rem',marginTop:'4px'}}>Nenhum projeto encontrado.</p></div>}
                </div>
              )}
            </div>
          )}
        </main>
        <ClaudePanel licenseKey={licenseKey} initMsg={claudeInitMsg} forceOpen={claudePanelForced}/>
        {previewTemplate&&(
        <TemplatePreviewModal
          template={previewTemplate}
          currentIndex={TEMPLATES.findIndex(function(t){return t.id===previewTemplate.id})}
          total={TEMPLATES.length}
          onUse={useTemplate}
          onClose={function(){setPreviewTemplate(null)}}
          onPrev={function(){
            var idx=TEMPLATES.findIndex(function(t){return t.id===previewTemplate.id})
            setPreviewTemplate(TEMPLATES[(idx-1+TEMPLATES.length)%TEMPLATES.length])
          }}
          onNext={function(){
            var idx=TEMPLATES.findIndex(function(t){return t.id===previewTemplate.id})
            setPreviewTemplate(TEMPLATES[(idx+1)%TEMPLATES.length])
          }}
        />
      )}
      {modal&&(
          <Modal title={modal.title} placeholder={modal.placeholder} defaultValue={modal.defaultValue} confirmLabel={modal.confirmLabel} onConfirm={modal.onConfirm} onCancel={modal.noCancel?function(){}:closeModal}>{modal.children}</Modal>
        )}
        <ToastContainer toasts={toasts}/>
        <CommandPalette open={cmdKOpen} onClose={function(){setCmdKOpen(false)}} onAction={handleCmdAction} screen={screen}/>
        {showShortcuts&&<ShortcutsModal onClose={function(){setShowShortcuts(false)}}/>}
      </div>
    )
  }

  // ── EDITOR ────────────────────────────────────────────────────────────
  var appCode=components.length>0?buildAppCode(components):''
  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',background:'var(--bg)'}}>
      <style>{'@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}</style>
      <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',borderBottom:'1px solid var(--border)',background:'var(--surface)',flexShrink:0,height:'52px',gap:'8px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
          <button onClick={function(){setScreen('projects')}} style={{background:'none',border:'1px solid var(--border)',color:'var(--muted)',borderRadius:'6px',padding:'5px 10px',fontSize:'0.75rem',cursor:'pointer',fontFamily:'var(--font-ui)',transition:'all 0.15s',whiteSpace:'nowrap'}} onMouseEnter={function(e){e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}} onMouseLeave={function(e){e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)'}}>← Projetos</button>
          <span style={{color:'var(--border)'}}>|</span>
          <span style={{fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--text)',fontSize:'0.85rem',maxWidth:'160px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{activeProject&&activeProject.name}</span>
          {activeProject&&activeProject.published&&<span style={{fontSize:'0.6rem',background:'rgba(74,222,128,0.12)',color:'var(--accent)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:'99px',padding:'2px 7px',fontFamily:'var(--font-mono)',flexShrink:0}}>Publicado</span>}
          <span style={{color:'var(--border)'}}>|</span>
          <button onClick={handleUndo} disabled={undoStack.length===0} title="Desfazer" style={{background:'none',border:'none',color:undoStack.length>0?'var(--text)':'var(--muted)',cursor:undoStack.length>0?'pointer':'not-allowed',padding:'4px 6px',borderRadius:'5px',fontSize:'0.9rem',opacity:undoStack.length>0?1:0.35,transition:'all 0.15s'}} onMouseEnter={function(e){if(undoStack.length>0)e.currentTarget.style.background='var(--border)'}} onMouseLeave={function(e){e.currentTarget.style.background='none'}}>↩</button>
          <button title="Refazer (em breve)" style={{background:'none',border:'none',color:'var(--muted)',cursor:'not-allowed',padding:'4px 6px',borderRadius:'5px',fontSize:'0.9rem',opacity:0.35}}>↪</button>
        </div>
        <button onClick={function(){setCmdKOpen(true)}} title="Command Palette (⌘K)" style={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'7px',padding:'5px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',transition:'border-color 0.15s'}} onMouseEnter={function(e){e.currentTarget.style.borderColor='var(--accent-border)'}} onMouseLeave={function(e){e.currentTarget.style.borderColor='var(--border)'}}>
          <span style={{color:'var(--muted)',fontSize:'0.8rem'}}>⌘</span>
          <span style={{color:'var(--muted)',fontSize:'0.75rem',fontFamily:'var(--font-mono)'}}>K</span>
        </button>
        <ApiCostBadge tokens={totalTokens} cost={sessionCost}/>
        <CreditMeter
          limit={creditLimit}
          spent={creditSpent}
          onSetup={function(){setShowCreditSetup(true)}}
        />
        {showCreditSetup&&(
          <CreditSetupModal
            limit={creditLimit}
            spent={creditSpent}
            onSave={function(newLimit, reset){
              setCreditLimit(newLimit)
              if(reset) setCreditSpent(0)
            }}
            onClose={function(){setShowCreditSetup(false)}}
          />
        )}
        <div style={{display:'flex',alignItems:'center',gap:'4px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'9px',padding:'3px'}}>
          <button onClick={function(){setPreviewMode(!previewMode)}} style={{background:previewMode?'var(--accent)':'transparent',color:previewMode?'#000':'var(--muted)',border:'none',borderRadius:'6px',padding:'5px 14px',fontSize:'0.78rem',cursor:'pointer',fontFamily:'var(--font-ui)',fontWeight:previewMode?700:400,transition:'all 0.15s',whiteSpace:'nowrap'}}>{previewMode?'✕ Fechar':'▶ Pre-visualizacao'}</button>
          <span style={{color:'var(--border)',fontSize:'0.7rem'}}>|</span>
          {[['🖥','desktop','Desktop'],['⬜','tablet','Tablet'],['📱','mobile','Mobile']].map(function(d){
            return(<button key={d[1]} onClick={function(){setDevice(d[1])}} title={d[2]} style={{background:device===d[1]?'var(--border)':'transparent',border:'none',color:device===d[1]?'var(--text)':'var(--muted)',borderRadius:'5px',padding:'4px 8px',cursor:'pointer',fontSize:'0.82rem',transition:'all 0.15s'}}>{d[0]}</button>)
          })}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
          {components.length>1&&<IconBtn icon="⊞" label={view==='app'?'Componente':'App'} active={view==='app'} onClick={function(){setView(view==='app'?'single':'app')}}/>}
          <IconBtn icon="⬡" label="Compartilhar" onClick={handleShare}/>
          {components.length>0&&<IconBtn icon="⬇" label="ZIP" onClick={function(){exportZip(activeProject,components);toast.success('ZIP gerado - verifique seus downloads!')}} variant="blue"/>}
          {components.length>0&&<IconBtn icon="🚀" label="Deploy" onClick={handleDeploy} variant="blue"/>}
          <IconBtn icon={activeProject&&activeProject.published?'◉ Publicado':'○ Publicar'} onClick={function(){if(activeProject)togglePublished(activeProject.id)}} variant={activeProject&&activeProject.published?'primary':null} active={activeProject&&activeProject.published}/>
        </div>
      </header>
      <main style={{display:'flex',flex:1,overflow:'hidden'}}>
        {!previewMode&&(
          <aside style={{width:'240px',flexShrink:0,borderRight:'1px solid var(--border)',background:'var(--surface)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {history.length>0&&(
              <div style={{borderBottom:'1px solid var(--border)',flexShrink:0,maxHeight:'160px',overflowY:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:'5px'}}>
                <p style={{fontSize:'0.63rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,fontFamily:'var(--font-mono)',marginBottom:'2px',flexShrink:0}}>Histórico</p>
                {history.map(function(h,i){return(
                  <div key={i} style={{display:'flex',gap:'6px',alignItems:'flex-start'}}>
                    <span style={{fontSize:'0.65rem',color:h.role==='ai'?'var(--accent)':'var(--muted)',flexShrink:0,marginTop:'1px'}}>{h.role==='ai'?'⬡':'->'}</span>
                    <p style={{fontSize:'0.72rem',color:h.role==='ai'?'var(--muted)':'var(--text)',fontFamily:'var(--font-ui)',margin:0,lineHeight:1.4,flex:1}}>{h.text}</p>
                    {h.time&&<span style={{fontSize:'0.6rem',color:'var(--muted)',flexShrink:0,opacity:0.6,fontFamily:'var(--font-mono)'}}>{h.time}</span>}
                  </div>
                )})}
              </div>
            )}
            <div style={{flex:1,overflowY:'auto',padding:'12px',paddingBottom:0}}>
              <p style={{fontSize:'0.67rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,fontFamily:'var(--font-mono)',marginBottom:'8px'}}>Componentes</p>
              {agentActive?(
                <AgentProgress steps={agentSteps} currentStep={agentCurrent} done={agentDone} inline={true}/>
              ):(
                <>
                  {components.length===0&&<p style={{fontSize:'0.75rem',color:'var(--muted)',fontFamily:'var(--font-mono)',lineHeight:1.7,opacity:0.7}}>Descreva um componente ou app completo abaixo.</p>}
                  {components.map(function(c,i){
                    return <DraggableCompItem key={c.id} comp={c} index={i} isActive={selected&&selected.id===c.id&&view==='single'} onSelect={function(c){setSelected(c);setView('single')}} onEdit={handleEdit} onDelete={handleDelete} onReorder={handleReorder} total={components.length} onEditModal={function(comp){openModal({title:'Editar "'+comp.name+'"',placeholder:'O que deseja alterar?',confirmLabel:'Aplicar',onConfirm:function(ins){handleEdit(comp,ins);closeModal()}})}}/>
                  })}
                  {!agentActive&&components.length>1&&<button onClick={function(){setView('app')}} style={{marginTop:'8px',width:'100%',background:view==='app'?'rgba(74,222,128,0.12)':'rgba(74,222,128,0.05)',border:'1px solid rgba(74,222,128,0.2)',color:'var(--accent)',borderRadius:'7px',padding:'7px',fontSize:'0.73rem',cursor:'pointer',fontFamily:'var(--font-ui)',fontWeight:700}}>⊞ Ver App Completo</button>}
                  {!agentActive&&error&&<p style={{fontSize:'0.72rem',color:'var(--error)',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:'6px',padding:'8px',lineHeight:1.4,marginTop:'8px'}}>⚠ {error}</p>}
                </>
              )}
            </div>
            <div style={{borderTop:'1px solid var(--border)',padding:'12px',flexShrink:0,display:'flex',flexDirection:'column',gap:'8px'}}>
              <textarea value={prompt} onChange={function(e){setPrompt(e.target.value)}} onKeyDown={function(e){if((e.ctrlKey||e.metaKey)&&e.key==='Enter')handleGenerate()}} disabled={loading} placeholder={components.length===0?'Descreva um componente ou app completo...':'Adicione, modifique ou descreva um app completo...'} rows={3} style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text)',fontFamily:'var(--font-ui)',fontSize:'0.8rem',padding:'8px 10px',resize:'none',outline:'none',lineHeight:1.5,width:'100%',boxSizing:'border-box'}}/>
              <button onClick={handleGenerate} disabled={loading} className={loading?'':'btn-gerar'} style={{background:loading?'rgba(74,222,128,0.15)':'',color:loading?'var(--accent)':'#000',border:loading?'1px solid rgba(74,222,128,0.2)':'none',borderRadius:'8px',padding:'9px',fontWeight:700,fontSize:'0.82rem',fontFamily:'var(--font-ui)',cursor:loading?'not-allowed':'pointer',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                {loading?(
                  <span style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'0.78rem'}}>
                    <span style={{width:'10px',height:'10px',border:'2px solid rgba(74,222,128,0.3)',borderTopColor:'var(--accent)',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite',flexShrink:0}}/>
                    <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'160px'}}>
                      {agentActive?'Construindo app...':(streamingText||'Gerando...')}
                    </span>
                  </span>
                ):<span>▶ {detectAgentMode?'Gerar':'Gerar'} <kbd style={{background:'rgba(0,0,0,0.2)',borderRadius:'4px',padding:'1px 5px',fontSize:'0.68rem',fontFamily:'var(--font-mono)'}}>⌘↵</kbd></span>}
              </button>
            </div>
          </aside>
        )}
        <section style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <DeviceWrapper device={device}>
            {view==='app'?<CodePreview code={appCode} loading={false} licenseKey={licenseKey} componentName="App Completo" onOpenClaude={openClaudeWithMsg} onCodeFixed={function(){}}/>:<CodePreview
              code={selected?selected.code:''}
              loading={loading&&!selected}
              licenseKey={licenseKey}
              componentName={selected?selected.name:''}
              originalPrompt={history.length>0?history[history.length-1].text:''}
              onOpenClaude={openClaudeWithMsg}
              onCodeFixed={function(fixed){
                if(!selected)return
                var newComps=components.map(function(c){return c.id===selected.id?Object.assign({},c,{code:fixed}):c})
                setComponents(newComps)
                setSelected(Object.assign({},selected,{code:fixed}))
                persistProject(newComps,null)
              }}
            />}
          </DeviceWrapper>
        </section>
      </main>
      <ClaudePanel licenseKey={licenseKey} initMsg={claudeInitMsg} forceOpen={claudePanelForced}/>
      {modal&&(
        <Modal title={modal.title} placeholder={modal.placeholder} defaultValue={modal.defaultValue} confirmLabel={modal.confirmLabel} onConfirm={modal.onConfirm} onCancel={modal.noCancel?function(){}:closeModal}>{modal.children}</Modal>
      )}
      <ToastContainer toasts={toasts}/>
      <CommandPalette open={cmdKOpen} onClose={function(){setCmdKOpen(false)}} onAction={handleCmdAction} screen={screen}/>
      {showShortcuts&&<ShortcutsModal onClose={function(){setShowShortcuts(false)}}/>}
    </div>
  )
}
