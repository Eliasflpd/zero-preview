import { useState, useCallback, useEffect, useRef } from 'react'
import Logo from './Logo'
import PromptInput from './components/PromptInput'
import CodePreview from './components/CodePreview'

// ─── SYSTEM PROMPTS ───────────────────────────────────────────────────────────
const SYSTEM_LANDING = `Voce e um designer e desenvolvedor especialista em landing pages de alta conversao.
Gere um arquivo HTML COMPLETO e LINDO para a landing page descrita.
Regras obrigatorias:
- HTML completo com <!DOCTYPE html>, <head> e <body>
- Google Fonts via <link> — use Syne + DM Sans ou Inter
- CSS inline no <head> com variaveis CSS — SEM frameworks externos
- Design PROFISSIONAL e MODERNO: cores coesas, tipografia forte, espacamento generoso
- Secoes: Hero com headline forte + CTA, Beneficios (3+ cards), Depoimentos ou Prova social, Preco ou CTA final
- Gradientes, sombras, bordas arredondadas — visual rico
- Responsivo com media queries
- Animacoes de entrada suaves com @keyframes (fade-up nos elementos ao carregar)
- Paleta coerente com o nicho descrito (ex: saude = verde/branco, tech = azul escuro, etc)
- Botoes com hover effects
- RETORNE SOMENTE O HTML COMPLETO. Sem markdown, sem backticks, sem explicacoes.`

const SYSTEM_SITE = `Voce e um designer e desenvolvedor especialista em sites institucionais.
Gere um arquivo HTML COMPLETO e LINDO para o site descrito.
Regras obrigatorias:
- HTML completo com <!DOCTYPE html>, <head> e <body>
- Google Fonts via <link> — use Syne + Inter ou DM Sans
- CSS inline no <head> com variaveis CSS — SEM frameworks externos
- Design PROFISSIONAL e MODERNO
- Secoes: Navbar fixa com logo + links, Hero impactante, Sobre, Servicos/Produtos com cards, Galeria ou Portfolio, Contato com formulario, Footer
- Paleta de cores coerente com o nicho
- Responsivo com media queries
- Animacoes suaves de entrada
- Efeitos hover nos links e botoes
- RETORNE SOMENTE O HTML COMPLETO. Sem markdown, sem backticks, sem explicacoes.`

const SYSTEM_DASHBOARD = `Voce e um designer e desenvolvedor especialista em dashboards e interfaces de gestao.
Gere um arquivo HTML COMPLETO e LINDO para o dashboard descrito.
Regras obrigatorias:
- HTML completo com <!DOCTYPE html>, <head> e <body>
- Google Fonts via <link> — use Inter ou DM Sans
- CSS inline no <head> — SEM frameworks externos
- Design escuro e profissional estilo SaaS moderno
- Sidebar de navegacao lateral com icones (usando caracteres unicode) e labels
- Header com titulo, busca e avatar
- Cards de KPIs no topo com numeros grandes e variacao percentual colorida
- Grafico de barras simulado com divs e dados realistas
- Tabela com dados, badges de status coloridos
- Responsive
- RETORNE SOMENTE O HTML COMPLETO. Sem markdown, sem backticks, sem explicacoes.`

const SYSTEM_COMPONENT = `Voce e um designer e desenvolvedor especialista em componentes web modernos.
Gere um arquivo HTML COMPLETO com um componente LINDO e interativo.
Regras obrigatorias:
- HTML completo com <!DOCTYPE html>, <head> e <body>
- Google Fonts via <link>
- CSS inline no <head> — SEM frameworks externos
- O componente deve ter interatividade real (JavaScript vanilla)
- Design moderno, limpo e profissional
- Centralizado na tela com padding generoso
- Animacoes e transicoes CSS suaves
- RETORNE SOMENTE O HTML COMPLETO. Sem markdown, sem backticks, sem explicacoes.`

// ─── MODOS ────────────────────────────────────────────────────────────────────
const MODES = [
  {
    id: 'landing', label: 'Criar sua Landing Page', icon: '🚀',
    color: '#FFD050', colorBg: 'rgba(255,208,80,.12)',
    description: 'Pagina de vendas completa', system: SYSTEM_LANDING,
    examples: [
      'Landing page para academia de musculacao com planos e depoimentos',
      'Pagina de vendas para curso online de marketing digital com contador regressivo',
      'Landing page para clinica estetica com servicos, fotos e agendamento',
    ],
  },
  {
    id: 'site', label: 'Criar seu Site', icon: '🌐',
    color: '#4A8FF0', colorBg: 'rgba(74,143,240,.12)',
    description: 'Site institucional multipagina', system: SYSTEM_SITE,
    examples: [
      'Site para barbearia moderna com servicos, galeria e agendamento',
      'Site institucional para escritorio de advocacia premium',
      'Site para restaurante com cardapio, fotos e reservas online',
    ],
  },
  {
    id: 'dashboard', label: 'Criar seu Dashboard', icon: '📊',
    color: '#22D3A0', colorBg: 'rgba(34,211,160,.1)',
    description: 'Painel de gestao com metricas', system: SYSTEM_DASHBOARD,
    examples: [
      'Dashboard de vendas com KPIs, grafico mensal e tabela de pedidos recentes',
      'Painel financeiro com receita, despesas e fluxo de caixa do mes',
      'Dashboard de RH com headcount, faltas, contratacoes e produtividade',
    ],
  },
  {
    id: 'component', label: 'Criar seu App', icon: '⚡',
    color: '#A855F7', colorBg: 'rgba(168,85,247,.1)',
    description: 'Componente web interativo', system: SYSTEM_COMPONENT,
    examples: [
      'Card de produto com imagem, preco, rating e botao adicionar ao carrinho',
      'Modal de confirmacao moderno com animacao de entrada e saida',
      'Formulario de login com validacao visual e efeitos de foco',
    ],
  },
  {
    id: 'image', label: 'Imagem com IA', icon: '🎨',
    color: '#FF8C42', colorBg: 'rgba(255,140,66,.1)',
    badge: 'em breve', description: 'Banners e artes com IA',
    system: null, examples: [],
  },
  {
    id: 'video', label: 'Video com IA', icon: '🎬',
    color: '#FF6BFF', colorBg: 'rgba(255,107,255,.1)',
    badge: 'em breve', description: 'Videos e anuncios com IA',
    system: null, examples: [],
  },
]

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const PROJ_KEY = 'zp_projects_v4'
const USER_KEY = 'zp_user'
const GEMINI_KEY = 'zp_gemini_key'

const loadProjects = () => { try { return JSON.parse(localStorage.getItem(PROJ_KEY)) || [] } catch { return [] } }
const saveProjects = (p) => { try { localStorage.setItem(PROJ_KEY, JSON.stringify(p)) } catch {} }
const loadUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY)) || null } catch { return null } }
const saveUser = (u) => { try { localStorage.setItem(USER_KEY, JSON.stringify(u)) } catch {} }
const loadGeminiKey = () => { try { return localStorage.getItem(GEMINI_KEY) || '' } catch { return '' } }
const saveGeminiKey = (k) => { try { localStorage.setItem(GEMINI_KEY, k) } catch {} }

// ─── API CALLS ────────────────────────────────────────────────────────────────
// BUG 3 FIX: Claude vai pelo backend Railway (evita CORS)
const BACKEND = 'https://zero-backend-production.up.railway.app'

async function callGemini(system, prompt, key) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60_000)
  let lastError
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 65536, temperature: 0.7 },
          }),
        }
      )
      const data = await res.json()
      if (data.error) {
        const msg = data.error.message || 'Erro desconhecido'
        if ((data.error.code === 429 || data.error.code === 503) && attempt === 0) {
          lastError = new Error(msg)
          await new Promise(r => setTimeout(r, 2000))
          continue
        }
        if (msg.toLowerCase().includes('api key not valid')) {
          throw new Error('Chave Gemini invalida. Verifique em aistudio.google.com/apikey')
        }
        throw new Error(msg)
      }
      const finishReason = data.candidates?.[0]?.finishReason
      if (finishReason && finishReason !== 'STOP') {
        console.warn(`[Gemini] finishReason: ${finishReason}`)
      }
      clearTimeout(timeoutId)
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } catch (err) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') throw new Error('Tempo limite excedido (60s). Tente um prompt menor.')
      if (attempt === 1 || !lastError) throw err
    }
  }
  throw lastError
}

async function callClaude(system, prompt) {
  // rota pelo backend Railway para evitar CORS
  const res = await fetch(`${BACKEND}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, prompt, model: 'claude-sonnet-4-20250514', max_tokens: 8000 }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.content || ''
}

// ─── SAUDAÇÃO DINÂMICA ────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const S = {
  root: { display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)', overflow: 'hidden' },
  sidebar: { width: '256px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg2)', borderRight: '1px solid var(--border)', overflow: 'hidden' },
  sideHead: { padding: '14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' },
  logoArea: { flex: 1, minWidth: 0 },
  newBtn: { width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--border)', background: 'white', color: 'var(--accent)', fontSize: '1.15rem', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all .15s', lineHeight: 1, fontWeight: 700 },
  searchWrap: { padding: '8px 10px', borderBottom: '1px solid var(--border)' },
  searchInput: { width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'white', color: 'var(--text)', fontSize: '1.05rem', fontFamily: 'var(--font-body)', outline: 'none' },
  projList: { flex: 1, overflowY: 'auto', padding: '6px' },
  projEmpty: { padding: '24px 12px', textAlign: 'center', color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.7 },
  projItem: { padding: '9px 10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', transition: 'all .15s', display: 'flex', alignItems: 'flex-start', gap: '8px', position: 'relative' },
  projIcon: { width: '28px', height: '28px', borderRadius: '7px', display: 'grid', placeItems: 'center', fontSize: '1.05rem', flexShrink: 0, marginTop: '1px' },
  projInfo: { flex: 1, minWidth: 0 },
  projName: { fontSize: '.94rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 },
  projMeta: { fontSize: '1.05rem', color: 'var(--muted)', marginTop: '2px' },
  projDel: { width: '20px', height: '20px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--muted)', fontSize: '1.05rem', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, opacity: 0, transition: 'all .15s' },
  sideFooter: { borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' },
  usageRow: { display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', color: 'var(--muted)', marginBottom: '5px' },
  usageBar: { height: '3px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' },
  usageFill: { height: '100%', width: '30%', background: 'linear-gradient(90deg,var(--accent),var(--yellow))', borderRadius: '2px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--yellow))', display: 'grid', placeItems: 'center', fontSize: '1.05rem', fontWeight: 700, color: 'white', flexShrink: 0 },
  userName: { fontSize: '.94rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--text)' },
  userPlan: { fontSize: '1.05rem', color: 'var(--accent)', fontWeight: 600 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar: { height: '52px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '10px', background: 'var(--bg)', flexShrink: 0 },
  topTitle: { fontSize: '.98rem', fontWeight: 600, flex: 1, color: 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  topBtn: { padding: '6px 14px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text2)', fontSize: '.98rem', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all .15s', whiteSpace: 'nowrap', fontWeight: 500 },
  topBtnAccent: { background: 'var(--accent)', border: '1px solid var(--accent)', color: 'white', fontWeight: 600 },
  modeBar: { padding: '0 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '2px', overflowX: 'auto', flexShrink: 0, background: 'var(--bg)', height: '44px' },
  modeBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', border: '1px solid transparent', background: 'transparent', color: 'var(--muted)', fontSize: '1.05rem', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', transition: 'all .15s', flexShrink: 0, fontWeight: 500 },
  modeBtnActive: { background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' },
  modeBadge: { fontSize: '.6rem', padding: '1px 6px', borderRadius: '3px', background: 'rgba(255,192,0,.15)', color: '#996600', border: '1px solid rgba(255,192,0,.3)' },
  content: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  previewArea: { flex: 1, overflow: 'hidden', position: 'relative' },
  inputArea: { borderTop: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 },
  welcome: { height: '100%', overflowY: 'auto', background: 'var(--bg)' },
  cs: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px', padding: '48px', background: 'var(--bg)' },
  csIcon: { width: '72px', height: '72px', borderRadius: '18px', display: 'grid', placeItems: 'center', fontSize: '2rem' },
  csTitle: { fontFamily: 'var(--font-head)', fontSize: '1.85rem', fontWeight: 700, textAlign: 'center', color: 'var(--text)' },
  csSub: { fontSize: '1.05rem', color: 'var(--muted)', textAlign: 'center', maxWidth: '340px', lineHeight: 1.6 },
  csBadge: { padding: '6px 18px', borderRadius: '999px', border: '1px solid var(--border)', fontSize: '.98rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--bg2)' },
  csFeats: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '360px' },
  csFeat: { padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg2)', fontSize: '1.05rem', color: 'var(--text2)', fontWeight: 500 },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(6,15,30,.5)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: 'white', border: '1px solid var(--border)', borderRadius: '20px', padding: '40px', width: '380px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 40px 80px rgba(0,0,0,.12)' },
  modalTitle: { fontFamily: 'var(--font-head)', fontSize: '1.85rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em' },
  modalSub: { fontSize: '1.05rem', color: 'var(--muted)', lineHeight: 1.6, marginTop: '-12px' },
  modalInput: { padding: '12px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: '1.05rem', fontFamily: 'var(--font-body)', outline: 'none', width: '100%' },
  modalBtn: { padding: '13px', borderRadius: '10px', background: 'var(--accent)', color: 'white', fontFamily: 'var(--font-head)', fontSize: '1.05rem', fontWeight: 700, border: 'none', cursor: 'pointer' },
}


// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [projects, setProjects] = useState(loadProjects)
  const [activeId, setActiveId] = useState(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('landing')
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState(null)
  const [api, setApi] = useState('gemini')
  const [geminiKey, setGeminiKey] = useState(loadGeminiKey)
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [apiError, setApiError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [user, setUser] = useState(loadUser)
  const [nameInput, setNameInput] = useState('')

  // BUG 1 FIX: refs para valores mais recentes dentro do useCallback
  const projectsRef = useRef(projects)
  const activeIdRef = useRef(activeId)
  const modeRef = useRef(mode)
  useEffect(() => { projectsRef.current = projects }, [projects])
  useEffect(() => { activeIdRef.current = activeId }, [activeId])
  useEffect(() => { modeRef.current = mode }, [mode])

  // BUG 2 FIX: pendingPrompt para clickExample sem setTimeout frágil
  const pendingPromptRef = useRef(null)
  useEffect(() => {
    if (pendingPromptRef.current) {
      const prompt = pendingPromptRef.current
      pendingPromptRef.current = null
      generate(prompt)
    }
  }, [mode])

  const activeMode = MODES.find(m => m.id === mode)
  const activeProject = projects.find(p => p.id === activeId)
  const filtered = search.trim()
    ? projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects

  // BUG 1 FIX: createProject usa ref para não ficar stale no useCallback
  function createProject(m) {
    const id = Date.now().toString()
    const proj = {
      id, name: 'Novo projeto', code: '', mode: m,
      created: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    }
    const updated = [proj, ...projectsRef.current]
    projectsRef.current = updated
    setProjects(updated)
    saveProjects(updated)
    setActiveId(id)
    activeIdRef.current = id
    setCode('')
    setMode(m)
    modeRef.current = m
    return id
  }

  function selectProject(proj) {
    setActiveId(proj.id)
    activeIdRef.current = proj.id
    setCode(proj.code || '')
    setMode(proj.mode || 'landing')
    modeRef.current = proj.mode || 'landing'
  }

  function deleteProject(e, id) {
    e.stopPropagation()
    const updated = projectsRef.current.filter(p => p.id !== id)
    projectsRef.current = updated
    setProjects(updated)
    saveProjects(updated)
    if (activeIdRef.current === id) {
      setActiveId(null)
      activeIdRef.current = null
      setCode('')
    }
  }

  // BUG 1 + 3 FIX: generate usa refs, Claude via backend
  const generate = useCallback(async (prompt) => {
    const currentMode = MODES.find(m => m.id === modeRef.current)
    if (!currentMode?.system) return
    if (api === 'gemini' && !geminiKey.trim()) {
      setShowKeyInput(true)
      setApiError('Cole sua chave do Gemini para continuar')
      return
    }
    setApiError('')
    const currentId = activeIdRef.current || createProject(modeRef.current)
    setLoading(true)
    try {
      const raw = api === 'gemini'
        ? await callGemini(currentMode.system, prompt, geminiKey.trim())
        : await callClaude(currentMode.system, prompt)
      const clean = raw.replace(/```(?:html|css|jsx?|tsx?)?\n?/gi, '').replace(/```/g, '').trim()
      setCode(clean)
      const name = prompt.length > 48 ? prompt.slice(0, 48) + '...' : prompt
      const updated = projectsRef.current.map(p =>
        p.id === currentId ? { ...p, code: clean, name, mode: modeRef.current } : p
      )
      projectsRef.current = updated
      setProjects(updated)
      saveProjects(updated)
    } catch (e) {
      setApiError(e.message || 'Erro ao gerar. Verifique a chave da API.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [api, geminiKey])

  // BUG 2 FIX: troca modo primeiro, dispara geração quando modo confirmar
  function clickExample(ex, exMode) {
    if (modeRef.current !== exMode) {
      pendingPromptRef.current = ex
      setMode(exMode)
    } else {
      generate(ex)
    }
  }

  function downloadHtml() {
    if (!code) return
    const blob = new Blob([code], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const proj = projectsRef.current.find(p => p.id === activeIdRef.current)
    a.download = `${(proj?.name || 'projeto').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
  }

  function saveUserName() {
    if (!nameInput.trim()) return
    const u = { name: nameInput.trim(), initial: nameInput.trim()[0].toUpperCase() }
    saveUser(u)
    setUser(u)
  }

  const placeholders = {
    landing: 'Ex: Landing page para academia com planos e depoimentos...',
    site: 'Ex: Site para barbearia moderna com servicos e agendamento...',
    dashboard: 'Ex: Dashboard de vendas com KPIs e grafico mensal...',
    component: 'Ex: Card de produto com imagem, preco e botao de compra...',
  }

  // ── onboarding modal ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={S.modalBg}>
        <div style={S.modal} className="animate-in">
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>👋</div>
            <div style={S.modalTitle}>Bem-vindo ao Zero Preview</div>
            <div style={S.modalSub}>Como podemos te chamar?</div>
          </div>
          <input
            style={S.modalInput}
            placeholder="Seu nome..."
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveUserName()}
            autoFocus
          />
          <button style={S.modalBtn} onClick={saveUserName}>
            Entrar no Zero Preview →
          </button>
        </div>
      </div>
    )
  }

  // ── welcome ─────────────────────────────────────────────────────────────────
  function renderWelcome() {
    const modeColors = {
      landing:   { bg: '#FFF8E6', border: '#FFE08A', text: '#7A5000', accent: '#F59E0B' },
      site:      { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', accent: '#3B82F6' },
      dashboard: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', accent: '#10B981' },
      component: { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', accent: '#7C3AED' },
    }

    return (
      <div style={S.welcome} className="animate-in">

        {/* HERO BANNER */}
        <div style={{ background: 'linear-gradient(135deg,#060F1E 0%,#0F2040 100%)', padding: '32px 36px', marginBottom: '0', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,208,80,.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-80px', left: '20%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(45,107,228,.1)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.85rem', fontWeight: 800, color: 'white', letterSpacing: '-.03em', lineHeight: 1.2, marginBottom: '8px' }}>
                {greeting()},{' '}
                <span style={{ color: '#FFD050' }}>{user.name}!</span>
              </div>
              <div style={{ fontSize: '.98rem', color: 'rgba(255,255,255,.55)', fontWeight: 300, lineHeight: 1.5 }}>
                Escolha um modo abaixo ou descreva o que quer criar. A IA gera o resultado completo.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 800, color: '#FFD050', lineHeight: 1 }}>{projects.length}</div>
                <div style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)' }}>projetos</div>
              </div>
              <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 800, color: '#5A90F0', lineHeight: 1 }}>65k</div>
                <div style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)' }}>tokens</div>
              </div>
              <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 800, color: '#22D3A0', lineHeight: 1 }}>Pro</div>
                <div style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)' }}>plano</div>
              </div>
            </div>
          </div>
        </div>

        {/* MODO CARDS — coloridos, grandes, convidativos */}
        <div style={{ padding: '24px 36px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '1.05rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: '12px', fontWeight: 600 }}>
            Escolha o que criar
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
            {MODES.filter(m => !m.badge).map(m => {
              const c = modeColors[m.id] || modeColors.landing
              const isActive = mode === m.id
              return (
                <div
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    background: isActive ? c.bg : 'white',
                    border: `1.5px solid ${isActive ? c.border : 'var(--border)'}`,
                    borderRadius: '10px', padding: '16px 14px',
                    cursor: 'pointer', transition: 'all .18s',
                    boxShadow: isActive ? `0 4px 16px ${c.accent}22` : 'none',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bg } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'white' } }}
                >
                  <div style={{ fontSize: '1.85rem', marginBottom: '8px' }}>{m.icon}</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: '.98rem', fontWeight: 700, color: isActive ? c.text : 'var(--text)', marginBottom: '3px' }}>{m.label}</div>
                  <div style={{ fontSize: '1.05rem', color: isActive ? c.text : 'var(--muted)', opacity: .75, lineHeight: 1.4 }}>{m.description}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* EXEMPLOS como chips clicaveis */}
        <div style={{ padding: '20px 36px 28px' }}>
          <div style={{ fontSize: '1.05rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: '12px', fontWeight: 600 }}>
            Exemplos para comecar — clique para gerar
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MODES.filter(m => !m.badge && m.id === mode).flatMap(m =>
              m.examples.map((ex, i) => {
                const c = modeColors[m.id] || modeColors.landing
                const isHov = hovered === `ex-${i}`
                return (
                  <div
                    key={i}
                    onClick={() => clickExample(ex, m.id)}
                    onMouseEnter={() => setHovered(`ex-${i}`)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 16px', borderRadius: '10px',
                      border: `1.5px solid ${isHov ? c.border : 'var(--border)'}`,
                      background: isHov ? c.bg : 'white',
                      cursor: 'pointer', transition: 'all .18s',
                      boxShadow: isHov ? `0 2px 12px ${c.accent}18` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: c.bg, border: `1px solid ${c.border}`, display: 'grid', placeItems: 'center', fontSize: '1.05rem', flexShrink: 0 }}>{m.icon}</div>
                      <span style={{ fontSize: '1.05rem', color: 'var(--text)', fontWeight: 400 }}>{ex}</span>
                    </div>
                    <span style={{ fontSize: '1.05rem', color: isHov ? c.accent : 'var(--muted)', fontWeight: 600, flexShrink: 0, marginLeft: '12px' }}>
                      {isHov ? 'Gerar →' : '→'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    )
  }

  function renderComingSoon(m) {
    const feats = { image: ['Banners para sites', 'Capas redes sociais', 'Thumbnails', 'Ilustracoes'], video: ['Videos de apresentacao', 'Anuncios animados', 'Reels e Shorts', 'Vinhetas'] }
    return (
      <div style={S.cs}>
        <div style={{ ...S.csIcon, background: m.colorBg, border: `1px solid ${m.color}33` }}>{m.icon}</div>
        <div style={S.csTitle}>{m.label}</div>
        <div style={S.csSub}>Em construcao. Em breve disponivel para todos os planos Pro e Business.</div>
        <div style={S.csBadge}>em breve</div>
        <div style={S.csFeats}>{(feats[m.id] || []).map((f, i) => <div key={i} style={S.csFeat}>{f}</div>)}</div>
      </div>
    )
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>

      {/* SIDEBAR */}
      <div style={S.sidebar}>

        {/* LOGO */}
        <div style={S.sideHead}>
          <div style={S.logoArea}><Logo /></div>
          <button style={S.newBtn} onClick={() => { setActiveId(null); activeIdRef.current = null; setCode('') }} title="Novo projeto">+</button>
        </div>

        {/* MODOS — empilhados verticalmente */}
        <div style={{ padding: '10px 10px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '.98rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', padding: '0 4px', marginBottom: '6px', fontWeight: 600 }}>O que criar</div>
          {MODES.map(m => {
            const isActive = mode === m.id && !m.badge
            const modeColorMap = {
              landing:   { bg: '#FFF8E6', border: '#FFE08A', text: '#7A5000', dot: '#F59E0B' },
              site:      { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', dot: '#3B82F6' },
              dashboard: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', dot: '#10B981' },
              component: { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', dot: '#7C3AED' },
            }
            const c = modeColorMap[m.id]
            return (
              <button
                key={m.id}
                onClick={() => !m.badge && setMode(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  width: '100%', padding: '8px 10px', marginBottom: '3px',
                  borderRadius: '8px', border: isActive ? `1.5px solid ${c?.border || 'var(--border)'}` : '1.5px solid transparent',
                  background: isActive ? (c?.bg || 'var(--bg2)') : 'transparent',
                  color: isActive ? (c?.text || 'var(--text)') : 'var(--muted)',
                  fontSize: '1.05rem', fontWeight: isActive ? 600 : 500,
                  fontFamily: 'var(--font-body)', cursor: m.badge ? 'not-allowed' : 'pointer',
                  opacity: m.badge ? .45 : 1, transition: 'all .15s', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>{m.icon}</span>
                <span style={{ flex: 1, lineHeight: 1.3 }}>{m.label}</span>
                {m.badge && <span style={{ fontSize: '.58rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,192,0,.15)', color: '#996600', border: '1px solid rgba(255,192,0,.3)', whiteSpace: 'nowrap' }}>{m.badge}</span>}
                {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c?.dot || 'var(--accent)', flexShrink: 0 }} />}
              </button>
            )
          })}
          <div style={{ height: '8px' }} />
        </div>

        {/* PROJETOS */}
        <div style={{ padding: '8px 10px 4px', flexShrink: 0 }}>
          <div style={{ fontSize: '.98rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px', fontWeight: 600 }}>Projetos</div>
          <input style={S.searchInput} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={S.projList}>
          {filtered.length === 0 && (
            <div style={S.projEmpty}>{search ? 'Nenhum resultado' : 'Nenhum projeto ainda.'}</div>
          )}
          {filtered.map(proj => {
            const pm = MODES.find(m => m.id === (proj.mode || 'landing')) || MODES[0]
            const isActive = proj.id === activeId
            const isHov = hovered === proj.id
            return (
              <div
                key={proj.id}
                style={{ ...S.projItem, background: isActive ? pm.colorBg : isHov ? 'var(--bg3)' : 'transparent' }}
                onClick={() => selectProject(proj)}
                onMouseEnter={() => setHovered(proj.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div style={{ ...S.projIcon, background: pm.colorBg }}>{pm.icon}</div>
                <div style={S.projInfo}>
                  <div style={{ ...S.projName, color: isActive ? 'var(--text)' : 'var(--text2)' }}>{proj.name || 'Sem titulo'}</div>
                  <div style={S.projMeta}>{pm.label} · {proj.created}</div>
                </div>
                <button
                  style={{ ...S.projDel, opacity: isHov ? 1 : 0 }}
                  onClick={e => deleteProject(e, proj.id)}
                  title="Deletar"
                >✕</button>
              </div>
            )
          })}
        </div>

        {/* PROMPT INPUT + API NA SIDEBAR */}
        {!activeMode?.badge && (
          <div style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }}>

            {/* seletor de API — compacto */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { id: 'gemini', label: 'Gemini', tag: 'gratis' },
                  { id: 'claude', label: 'Claude', tag: 'pago' },
                ].map(a => (
                  <button
                    key={a.id}
                    onClick={() => { setApi(a.id); setApiError('') }}
                    style={{ padding: '3px 9px', borderRadius: '5px', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '1.05rem', fontWeight: 500, transition: 'all .15s', background: api === a.id ? 'var(--accent)' : 'white', color: api === a.id ? 'white' : 'var(--muted)' }}
                  >{a.label}</button>
                ))}
              </div>
              {api === 'gemini' && (
                <button
                  onClick={() => setShowKeyInput(v => !v)}
                  style={{ fontSize: '1.05rem', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', color: geminiKey ? 'var(--green)' : '#D97706', fontWeight: 600 }}
                >
                  {geminiKey ? '✓ chave ok' : '⚠ sem chave'}
                </button>
              )}
            </div>

            {/* painel chave gemini */}
            {showKeyInput && api === 'gemini' && (
              <div style={{ padding: '8px 12px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '1.05rem', color: '#92400E', fontWeight: 600 }}>Chave do Gemini (gratuita)</div>
                <input
                  type="password"
                  placeholder="Cole sua chave aqui..."
                  value={geminiKey}
                  onChange={e => { setGeminiKey(e.target.value); saveGeminiKey(e.target.value) }}
                  style={{ padding: '6px 8px', borderRadius: '5px', border: '1px solid #FDE68A', fontSize: '1.05rem', fontFamily: 'var(--font-mono)', outline: 'none', width: '100%', background: 'white' }}
                />
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ fontSize: '1.05rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Obter chave gratis →</a>
                  <button onClick={() => setShowKeyInput(false)} style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '5px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 600 }}>Ok</button>
                </div>
              </div>
            )}

            {/* erro */}
            {apiError && (
              <div style={{ padding: '7px 12px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', fontSize: '1.05rem', color: '#DC2626', fontWeight: 500 }}>
                ⚠ {apiError}
              </div>
            )}

            <PromptInput onSubmit={generate} loading={loading} placeholder={placeholders[mode] || 'Descreva o que quer criar...'} compact />
          </div>
        )}

        {/* FOOTER */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={S.avatar}>{user.initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.userName}>{user.name}</div>
            <div style={S.userPlan}>Zero Preview Pro</div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            title="Configuracoes"
            style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: '1rem', color: 'var(--muted)', transition: 'all .15s', flexShrink: 0 }}
          >⚙</button>
        </div>
      </div>

      {/* MODAL CONFIGURACOES */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={e => e.target === e.currentTarget && setShowSettings(false)}
        >
          <div style={{ background: 'white', borderRadius: '16px', width: '480px', maxWidth: '95vw', boxShadow: '0 24px 60px rgba(0,0,0,.15)', border: '1px solid var(--border)', overflow: 'hidden' }} className="animate-in">

            {/* header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>Configuracoes</div>
                <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: '2px' }}>Gerencie suas APIs e preferencias</div>
              </div>
              <button onClick={() => setShowSettings(false)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg2)', cursor: 'pointer', fontSize: '1rem', color: 'var(--muted)' }}>✕</button>
            </div>

            {/* body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* API ativa */}
              <div>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)' }}>API de geracao</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'gemini', label: 'Gemini 2.5 Flash', tag: 'Gratis · 1500/dia', color: '#2D6BE4', icon: '✦' },
                    { id: 'claude', label: 'Claude Sonnet', tag: 'Pago · ilimitado', color: '#F59E0B', icon: '◆' },
                  ].map(a => (
                    <div
                      key={a.id}
                      onClick={() => { setApi(a.id); setApiError('') }}
                      style={{
                        flex: 1, padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                        border: api === a.id ? `2px solid ${a.color}` : '2px solid var(--border)',
                        background: api === a.id ? `${a.color}10` : 'var(--bg2)',
                        transition: 'all .18s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ color: a.color, fontWeight: 700 }}>{a.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text)' }}>{a.label}</span>
                        {api === a.id && <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: a.color, flexShrink: 0 }} />}
                      </div>
                      <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{a.tag}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chave Gemini */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)' }}>Chave Gemini</div>
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ fontSize: '.75rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Obter chave gratis →</a>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    placeholder="Cole sua chave aqui: AIzaSy..."
                    value={geminiKey}
                    onChange={e => { setGeminiKey(e.target.value); saveGeminiKey(e.target.value) }}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '.85rem', fontFamily: 'var(--font-mono)', outline: 'none', background: 'var(--bg2)', color: 'var(--text)' }}
                  />
                  {geminiKey && <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', borderRadius: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: '.8rem', color: '#065F46', fontWeight: 600, whiteSpace: 'nowrap' }}>✓ Ok</div>}
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '6px' }}>Gratis em aistudio.google.com — 1500 geracoes por dia</div>
              </div>

              {/* Chave Claude (info) */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Claude Sonnet — via Backend</div>
                <div style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>O Claude roda pelo backend Railway seguro. Nenhuma chave necessaria aqui — ja configurado.</div>
              </div>

              {/* Usuario */}
              <div>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)' }}>Seu nome</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    defaultValue={user.name}
                    id="settings-name-input"
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '.88rem', fontFamily: 'var(--font-body)', outline: 'none', background: 'var(--bg2)', color: 'var(--text)' }}
                  />
                  <button
                    onClick={() => {
                      const val = document.getElementById('settings-name-input').value.trim()
                      if (val) { const u = { name: val, initial: val[0].toUpperCase() }; saveUser(u); setUser(u) }
                    }}
                    style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '.85rem', fontWeight: 600, fontFamily: 'var(--font-body)' }}
                  >Salvar</button>
                </div>
              </div>
            </div>

            {/* footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSettings(false)} style={{ padding: '9px 22px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '.88rem', fontFamily: 'var(--font-head)' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <div style={S.main}>
        <div style={S.topbar}>
          <div style={S.topTitle}>{activeProject ? activeProject.name : 'Zero Preview'}</div>

          {/* download */}
          {code && !loading && (
            <button style={{ ...S.topBtn, color: 'var(--green)' }} onClick={downloadHtml}>↓ Download HTML</button>
          )}

          {activeId && (
            <button style={S.topBtn} onClick={() => { setActiveId(null); activeIdRef.current = null; setCode('') }}>+ Novo</button>
          )}
        </div>

        <div style={S.content}>
          <div style={S.previewArea}>
            {activeMode?.badge
              ? renderComingSoon(activeMode)
              : activeId
                ? <CodePreview code={code} loading={loading} />
                : renderWelcome()
            }
          </div>

        </div>
      </div>
    </div>
  )
}
