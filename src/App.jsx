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
    id: 'landing', label: 'Landing Page', icon: '🚀',
    color: '#FFD050', colorBg: 'rgba(255,208,80,.12)',
    description: 'Pagina de vendas completa', system: SYSTEM_LANDING,
    examples: [
      'Landing page para academia de musculacao com planos e depoimentos',
      'Pagina de vendas para curso online de marketing digital com contador regressivo',
      'Landing page para clinica estetica com servicos, fotos e agendamento',
    ],
  },
  {
    id: 'site', label: 'Site Completo', icon: '🌐',
    color: '#4A8FF0', colorBg: 'rgba(74,143,240,.12)',
    description: 'Site institucional multipagina', system: SYSTEM_SITE,
    examples: [
      'Site para barbearia moderna com servicos, galeria e agendamento',
      'Site institucional para escritorio de advocacia premium',
      'Site para restaurante com cardapio, fotos e reservas online',
    ],
  },
  {
    id: 'dashboard', label: 'Dashboard', icon: '📊',
    color: '#22D3A0', colorBg: 'rgba(34,211,160,.1)',
    description: 'Painel de gestao com metricas', system: SYSTEM_DASHBOARD,
    examples: [
      'Dashboard de vendas com KPIs, grafico mensal e tabela de pedidos recentes',
      'Painel financeiro com receita, despesas e fluxo de caixa do mes',
      'Dashboard de RH com headcount, faltas, contratacoes e produtividade',
    ],
  },
  {
    id: 'component', label: 'Componente', icon: '⚡',
    color: '#A855F7', colorBg: 'rgba(168,85,247,.1)',
    description: 'Componente web interativo', system: SYSTEM_COMPONENT,
    examples: [
      'Card de produto com imagem, preco, rating e botao adicionar ao carrinho',
      'Modal de confirmacao moderno com animacao de entrada e saida',
      'Formulario de login com validacao visual e efeitos de foco',
    ],
  },
  {
    id: 'image', label: 'Imagem IA', icon: '🎨',
    color: '#FF8C42', colorBg: 'rgba(255,140,66,.1)',
    badge: 'em breve', description: 'Banners e artes com IA',
    system: null, examples: [],
  },
  {
    id: 'video', label: 'Video IA', icon: '🎬',
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
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8192 },
      }),
    }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
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
  sidebar: { width: '228px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg2)', borderRight: '1px solid var(--border2)', overflow: 'hidden' },
  sideHead: { padding: '14px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: '8px' },
  logoArea: { flex: 1, minWidth: 0 },
  newBtn: { width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--yellow)', fontSize: '1.2rem', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all .15s', lineHeight: 1 },
  searchWrap: { padding: '8px 10px', borderBottom: '1px solid var(--border2)' },
  searchInput: { width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '.82rem', fontFamily: 'var(--font-body)', outline: 'none' },
  projList: { flex: 1, overflowY: 'auto', padding: '6px' },
  projEmpty: { padding: '24px 12px', textAlign: 'center', color: 'var(--text2)', fontSize: '.82rem', lineHeight: 1.7 },
  projItem: { padding: '9px 10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', transition: 'all .15s', display: 'flex', alignItems: 'flex-start', gap: '8px', position: 'relative' },
  projIcon: { width: '28px', height: '28px', borderRadius: '7px', display: 'grid', placeItems: 'center', fontSize: '.9rem', flexShrink: 0, marginTop: '1px' },
  projInfo: { flex: 1, minWidth: 0 },
  projName: { fontSize: '.84rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3, color: 'var(--text)' },
  projMeta: { fontSize: '.72rem', color: 'var(--muted)', marginTop: '2px' },
  projDel: { width: '20px', height: '20px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--muted)', fontSize: '.75rem', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, opacity: 0, transition: 'all .15s' },
  sideFooter: { borderTop: '1px solid var(--border2)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' },
  usageRow: { display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--text2)', marginBottom: '5px' },
  usageBar: { height: '3px', borderRadius: '2px', background: 'var(--border2)', overflow: 'hidden' },
  usageFill: { height: '100%', width: '30%', background: 'linear-gradient(90deg,var(--accent),var(--yellow))', borderRadius: '2px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--yellow))', display: 'grid', placeItems: 'center', fontSize: '.72rem', fontWeight: 700, color: '#060F1E', flexShrink: 0 },
  userName: { fontSize: '.85rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--text)' },
  userPlan: { fontSize: '.7rem', color: 'var(--yellow)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar: { height: '48px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', background: 'var(--bg2)', flexShrink: 0 },
  topTitle: { fontSize: '.88rem', fontWeight: 600, flex: 1, color: 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  topBtn: { padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text2)', fontSize: '.78rem', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all .15s', whiteSpace: 'nowrap', fontWeight: 500 },
  modeBar: { padding: '0 12px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: '2px', overflowX: 'auto', flexShrink: 0, background: 'var(--bg2)', height: '42px' },
  modeBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '6px', border: '1px solid transparent', background: 'transparent', color: 'var(--text2)', fontSize: '.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', transition: 'all .15s', flexShrink: 0, fontWeight: 500 },
  modeBtnActive: { background: 'var(--bg3)', border: '1px solid var(--border2)' },
  modeBadge: { fontSize: '.6rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,208,80,.12)', color: 'var(--yellow)', border: '1px solid rgba(255,208,80,.35)' },
  content: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  previewArea: { flex: 1, overflow: 'hidden', position: 'relative' },
  inputArea: { borderTop: '1px solid var(--border2)', background: 'var(--bg2)', flexShrink: 0 },
  welcome: { height: '100%', overflowY: 'auto', padding: '32px 36px' },
  wHead: { marginBottom: '28px' },
  wTitle: { fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-.025em', lineHeight: 1.2, marginBottom: '8px', color: 'var(--text)' },
  wSpan: { background: 'linear-gradient(135deg,var(--accent2),var(--yellow))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  wSub: { fontSize: '.9rem', color: 'var(--text2)', fontWeight: 400, lineHeight: 1.6 },
  statsRow: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' },
  statCard: { flex: '1 1 120px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '14px' },
  statNum: { fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1, marginBottom: '4px' },
  statLabel: { fontSize: '.72rem', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.08em' },
  exLabel: { fontSize: '.74rem', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
  exGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '8px' },
  exCard: { background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '14px', cursor: 'pointer', transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: '8px' },
  exTop: { display: 'flex', alignItems: 'center', gap: '8px' },
  exIconBox: { width: '26px', height: '26px', borderRadius: '6px', display: 'grid', placeItems: 'center', fontSize: '.82rem', flexShrink: 0 },
  exMode: { fontSize: '.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text2)', fontWeight: 500 },
  exText: { fontSize: '.84rem', color: 'var(--text)', lineHeight: 1.5, fontWeight: 400 },
  exArrow: { fontSize: '.85rem', color: 'var(--text2)', alignSelf: 'flex-end' },
  cs: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px', padding: '48px' },
  csIcon: { width: '72px', height: '72px', borderRadius: '18px', display: 'grid', placeItems: 'center', fontSize: '2rem' },
  csTitle: { fontFamily: 'var(--font-head)', fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', color: 'var(--text)' },
  csSub: { fontSize: '.9rem', color: 'var(--text2)', textAlign: 'center', maxWidth: '340px', lineHeight: 1.6 },
  csBadge: { padding: '6px 18px', borderRadius: '999px', border: '1px solid rgba(255,208,80,.4)', fontSize: '.78rem', fontFamily: 'var(--font-mono)', color: 'var(--yellow)' },
  csFeats: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '360px' },
  csFeat: { padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--bg3)', fontSize: '.8rem', color: 'var(--text)', fontWeight: 500 },
  // onboarding modal
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(6,15,30,.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '20px', padding: '40px', width: '400px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 40px 80px rgba(0,0,0,.6)' },
  modalTitle: { fontFamily: 'var(--font-head)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em' },
  modalSub: { fontSize: '.9rem', color: 'var(--text2)', lineHeight: 1.6, marginTop: '-12px' },
  modalInput: { padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '1rem', fontFamily: 'var(--font-body)', outline: 'none', width: '100%' },
  modalBtn: { padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg,var(--accent),var(--yellow))', color: '#060F1E', fontFamily: 'var(--font-head)', fontSize: '1rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'opacity .15s' },
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
    return (
      <div style={S.welcome} className="animate-in">
        <div style={S.wHead}>
          <div style={S.wTitle}>
            {greeting()}, <span style={S.wSpan}>{user.name}!</span>
          </div>
          <div style={S.wSub}>Escolha um exemplo ou descreva no campo abaixo. A IA gera o resultado completo.</div>
        </div>
        <div style={S.statsRow}>
          {[
            { num: String(projects.length || 0), label: 'Projetos' },
            { num: '4', label: 'Modos ativos' },
            { num: '8k', label: 'Tokens por geracao' },
            { num: 'Pro', label: 'Plano atual' },
          ].map((s, i) => (
            <div key={i} style={S.statCard}>
              <div style={S.statNum}>{s.num}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={S.exLabel}><span>✦</span> exemplos para comecar</div>
        <div style={S.exGrid}>
          {MODES.filter(m => !m.badge).flatMap(m =>
            m.examples.slice(0, 2).map((ex, i) => {
              const k = `${m.id}-${i}`
              const isHov = hovered === k
              return (
                <div
                  key={k}
                  style={{ ...S.exCard, borderColor: isHov ? m.color : 'var(--border2)', background: isHov ? m.colorBg : 'var(--bg3)', transform: isHov ? 'translateY(-2px)' : 'none', boxShadow: isHov ? '0 8px 28px rgba(0,0,0,.35)' : 'none' }}
                  onMouseEnter={() => setHovered(k)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => clickExample(ex, m.id)}
                >
                  <div style={S.exTop}>
                    <div style={{ ...S.exIconBox, background: m.colorBg }}>{m.icon}</div>
                    <span style={{ ...S.exMode, color: isHov ? m.color : 'var(--muted)' }}>{m.label}</span>
                  </div>
                  <div style={S.exText}>{ex}</div>
                  <div style={{ ...S.exArrow, color: isHov ? m.color : 'var(--muted)' }}>→</div>
                </div>
              )
            })
          )}
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
        <div style={S.sideHead}>
          <div style={S.logoArea}><Logo /></div>
          <button style={S.newBtn} onClick={() => { setActiveId(null); activeIdRef.current = null; setCode('') }} title="Novo projeto">+</button>
        </div>

        <div style={S.searchWrap}>
          <input style={S.searchInput} placeholder="Buscar projeto..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={S.projList}>
          {filtered.length === 0 && (
            <div style={S.projEmpty}>{search ? 'Nenhum resultado' : 'Nenhum projeto ainda.\nDescreva algo e gere!'}</div>
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

        <div style={S.sideFooter}>
          <div>
            <div style={S.usageRow}><span>Uso</span><span style={{ color: 'var(--yellow)' }}>Pro · ilimitado</span></div>
            <div style={S.usageBar}><div style={S.usageFill} /></div>
          </div>
          <div style={S.userRow}>
            <div style={S.avatar}>{user.initial}</div>
            <div>
              <div style={S.userName}>{user.name}</div>
              <div style={S.userPlan}>Zero Preview Pro</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={S.main}>
        <div style={S.topbar}>
          <div style={S.topTitle}>{activeProject ? activeProject.name : 'Zero Preview'}</div>

          {/* download */}
          {code && !loading && (
            <button style={{ ...S.topBtn, color: 'var(--green)', borderColor: 'rgba(34,211,160,.3)' }} onClick={downloadHtml}>
              ↓ Download HTML
            </button>
          )}

          {/* seletor de API */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--bg3)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border2)' }}>
            {[
              { id: 'gemini', label: 'Gemini', color: '#4A8FF0', tag: 'gratis' },
              { id: 'claude', label: 'Claude', color: '#FFD050', tag: 'pago' },
            ].map(a => (
              <button
                key={a.id}
                onClick={() => { setApi(a.id); setApiError('') }}
                style={{ padding: '4px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.75rem', fontWeight: 500, transition: 'all .15s', background: api === a.id ? a.color : 'transparent', color: api === a.id ? '#060F1E' : 'var(--text2)', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                {a.label}
                <span style={{ fontSize: '.6rem', opacity: .75 }}>{a.tag}</span>
              </button>
            ))}
          </div>

          {/* chave gemini */}
          {api === 'gemini' && (
            <button
              style={{ ...S.topBtn, color: geminiKey ? 'var(--green)' : 'var(--yellow)', borderColor: geminiKey ? 'rgba(34,211,160,.3)' : 'rgba(255,208,80,.3)' }}
              onClick={() => setShowKeyInput(v => !v)}
            >
              {geminiKey ? '✓ chave ok' : '⚠ inserir chave'}
            </button>
          )}

          {activeId && (
            <button style={S.topBtn} onClick={() => { setActiveId(null); activeIdRef.current = null; setCode('') }}>+ Novo</button>
          )}
        </div>

        {/* painel chave gemini */}
        {showKeyInput && api === 'gemini' && (
          <div style={{ padding: '10px 16px', background: 'var(--bg3)', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '.78rem', color: 'var(--text2)', whiteSpace: 'nowrap' }}>Chave Gemini:</span>
            <input
              style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--bg)', color: 'var(--text)', fontSize: '.8rem', fontFamily: 'var(--font-mono)', outline: 'none' }}
              type="password"
              placeholder="Cole sua chave do aistudio.google.com"
              value={geminiKey}
              onChange={e => { setGeminiKey(e.target.value); saveGeminiKey(e.target.value) }}
            />
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ fontSize: '.75rem', color: 'var(--accent2)', whiteSpace: 'nowrap', textDecoration: 'none' }}>
              Obter chave gratis →
            </a>
            <button style={{ ...S.topBtn, color: 'var(--green)' }} onClick={() => setShowKeyInput(false)}>Salvar</button>
          </div>
        )}

        {/* erro */}
        {apiError && (
          <div style={{ padding: '8px 16px', background: 'rgba(255,100,80,.08)', borderBottom: '1px solid rgba(255,100,80,.2)', fontSize: '.8rem', color: '#FF8070', flexShrink: 0 }}>
            ⚠ {apiError}
          </div>
        )}

        <div style={S.modeBar}>
          {MODES.map(m => (
            <button
              key={m.id}
              style={{ ...S.modeBtn, ...(mode === m.id ? { ...S.modeBtnActive, color: m.color } : {}), opacity: m.badge ? .45 : 1, cursor: m.badge ? 'not-allowed' : 'pointer' }}
              onClick={() => !m.badge && setMode(m.id)}
            >
              {m.icon} {m.label}
              {m.badge && <span style={S.modeBadge}>{m.badge}</span>}
            </button>
          ))}
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
          {!activeMode?.badge && (
            <div style={S.inputArea}>
              <PromptInput onSubmit={generate} loading={loading} placeholder={placeholders[mode] || 'Descreva o que quer criar...'} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
