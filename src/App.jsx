import { useState, useCallback } from 'react'
import Logo from './Logo'
import PromptInput from './components/PromptInput'
import CodePreview from './components/CodePreview'

// ─── MODOS ───────────────────────────────────────────────────────────────────
const MODES = [
  {
    id: 'landing',
    label: 'Landing Page',
    icon: '🚀',
    color: '#5E6BFF',
    colorBg: 'rgba(94,107,255,.1)',
    description: 'Pagina de vendas completa',
    examples: [
      'Landing page para academia de musculacao com planos e depoimentos',
      'Pagina de vendas para curso online de marketing digital',
      'Landing page para clinica odontologica com servicos e agendamento',
    ],
    system: `Voce e um especialista em criacao de landing pages de alta conversao.
Gere um componente React COMPLETO (export default function) com:
- Hero section com titulo forte, subtitulo e botao CTA
- Secao de beneficios com pelo menos 3 cards
- Depoimentos ou prova social
- Secao de precos com planos
- CTA final com urgencia
- Design moderno, responsivo, com inline styles apenas
- Cores e estilo adequados ao nicho descrito
- Sem imports externos — apenas React + hooks
RETORNE APENAS O CODIGO JSX. Sem markdown, sem backticks, sem explicacoes.`,
  },
  {
    id: 'site',
    label: 'Site Completo',
    icon: '🌐',
    color: '#00C8FF',
    colorBg: 'rgba(0,200,255,.1)',
    description: 'Site institucional multipagina',
    examples: [
      'Site para barbearia moderna com servicos, galeria e agendamento',
      'Site institucional para escritorio de advocacia',
      'Site para restaurante com cardapio, fotos e reservas online',
    ],
    system: `Voce e um especialista em criacao de sites completos.
Gere um componente React COMPLETO (export default function) com:
- Navbar fixa com logo, links de navegacao e botao CTA
- Hero section impactante
- Secao Sobre com historia e diferenciais
- Secao de Servicos ou Produtos com cards
- Galeria ou portfolio visual
- Formulario de contato funcional (com useState)
- Footer completo com links, endereco e redes sociais
- Design responsivo com inline styles
- Sem imports externos — apenas React + hooks
RETORNE APENAS O CODIGO JSX. Sem markdown, sem backticks, sem explicacoes.`,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    color: '#22D3A0',
    colorBg: 'rgba(34,211,160,.1)',
    description: 'Painel de gestao com metricas',
    examples: [
      'Dashboard de vendas com KPIs, grafico mensal e tabela de pedidos',
      'Painel de RH com headcount, faltas e produtividade',
      'Dashboard financeiro com receita, despesas e fluxo de caixa',
    ],
    system: `Voce e um especialista em criacao de dashboards administrativos.
Gere um componente React COMPLETO (export default function) com:
- Sidebar de navegacao lateral com icones e labels
- Header com titulo, busca e avatar do usuario
- Cards de KPIs no topo (4 metricas principais com valores e variacao %)
- Grafico de barras ou linhas simulado com divs e dados mock realistas
- Tabela de dados com status coloridos e acoes
- Design escuro e profissional, moderno
- Sem imports externos — apenas React + hooks
RETORNE APENAS O CODIGO JSX. Sem markdown, sem backticks, sem explicacoes.`,
  },
  {
    id: 'component',
    label: 'Componente',
    icon: '⚡',
    color: '#A855F7',
    colorBg: 'rgba(168,85,247,.1)',
    description: 'Componente React reutilizavel',
    examples: [
      'Card de produto com imagem, nome, preco e botao adicionar ao carrinho',
      'Modal de confirmacao de exclusao com animacao',
      'Formulario de login moderno com validacao e feedback visual',
    ],
    system: `Voce e um especialista em criacao de componentes React modernos.
Gere um componente React funcional (export default function) com:
- Interatividade via useState quando necessario
- Design moderno, limpo e profissional com inline styles
- Animacoes suaves via CSS transitions
- Responsivo e acessivel
- Sem imports externos — apenas React + hooks
RETORNE APENAS O CODIGO JSX. Sem markdown, sem backticks, sem explicacoes.`,
  },
  {
    id: 'image',
    label: 'Imagem com IA',
    icon: '🎨',
    color: '#FF8C42',
    colorBg: 'rgba(255,140,66,.1)',
    badge: 'em breve',
    description: 'Banners e artes geradas por IA',
    examples: [],
    system: null,
  },
  {
    id: 'video',
    label: 'Video com IA',
    icon: '🎬',
    color: '#FF6BFF',
    colorBg: 'rgba(255,107,255,.1)',
    badge: 'em breve',
    description: 'Videos e anuncios com IA',
    examples: [],
    system: null,
  },
]

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const KEY = 'zp_projects_v3'
const loadProjects = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
const saveProjects = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch {} }

// ─── ESTILOS BASE ─────────────────────────────────────────────────────────────
const S = {
  // layout
  root: { display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)', overflow: 'hidden' },
  // sidebar
  sidebar: { width: '232px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg2)', borderRight: '1px solid var(--border)', overflow: 'hidden' },
  sideHead: { padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' },
  logoArea: { flex: 1, minWidth: 0 },
  newBtn: { width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: '1rem', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all .15s' },
  searchBox: { padding: '8px 12px', borderBottom: '1px solid var(--border)' },
  searchInput: { width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '.8rem', fontFamily: 'var(--font-body)', outline: 'none' },
  projList: { flex: 1, overflowY: 'auto', padding: '6px' },
  projEmpty: { padding: '24px 12px', textAlign: 'center', color: 'var(--muted)', fontSize: '.8rem', lineHeight: 1.7 },
  projItem: { padding: '9px 10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '1px', transition: 'all .15s', display: 'flex', alignItems: 'flex-start', gap: '8px' },
  projItemActive: { background: 'rgba(94,107,255,.12)' },
  projItemHover: { background: 'var(--bg3)' },
  projIcon: { width: '28px', height: '28px', borderRadius: '6px', display: 'grid', placeItems: 'center', fontSize: '.9rem', flexShrink: 0, marginTop: '1px' },
  projInfo: { flex: 1, minWidth: 0 },
  projName: { fontSize: '.82rem', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 },
  projMeta: { fontSize: '.7rem', color: 'var(--muted)', marginTop: '2px' },
  sideFooter: { borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' },
  usageBar: { height: '3px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' },
  usageFill: { height: '100%', width: '30%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: '2px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'grid', placeItems: 'center', fontSize: '.7rem', fontWeight: 700, color: 'white', flexShrink: 0 },
  userName: { fontSize: '.82rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 },
  userPlan: { fontSize: '.68rem', color: 'var(--muted)' },
  // main
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar: { height: '48px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', background: 'var(--bg2)', flexShrink: 0 },
  topTitle: { fontSize: '.85rem', fontWeight: 500, flex: 1, color: 'var(--text2)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  topBtn: { padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted)', fontSize: '.75rem', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all .15s', whiteSpace: 'nowrap' },
  topBtnPrimary: { background: 'var(--accent)', border: '1px solid var(--accent)', color: 'white' },
  modeBar: { padding: '0 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', flexShrink: 0, background: 'var(--bg2)', height: '44px' },
  modeBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', border: '1px solid transparent', background: 'transparent', color: 'var(--muted)', fontSize: '.78rem', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', transition: 'all .15s', flexShrink: 0 },
  modeBtnActive: { background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)' },
  modeBadge: { fontSize: '.6rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,140,66,.15)', color: 'var(--orange)', border: '1px solid rgba(255,140,66,.2)' },
  // content
  content: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  previewArea: { flex: 1, overflow: 'hidden', position: 'relative' },
  inputArea: { borderTop: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0 },
  // welcome
  welcome: { height: '100%', overflowY: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  welcomeHead: { display: 'flex', flexDirection: 'column', gap: '8px' },
  welcomeTitle: { fontFamily: 'var(--font-head)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-.025em', lineHeight: 1.2 },
  welcomeSub: { fontSize: '.95rem', color: 'var(--muted)', fontWeight: 300, lineHeight: 1.6 },
  statsRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  statCard: { flex: '1 1 140px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' },
  statNum: { fontFamily: 'var(--font-head)', fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg,var(--text),var(--muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 },
  statLabel: { fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: '4px' },
  exSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  exLabel: { fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '8px' },
  exGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' },
  exCard: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: '8px' },
  exCardTop: { display: 'flex', alignItems: 'center', gap: '8px' },
  exCardIcon: { width: '28px', height: '28px', borderRadius: '6px', display: 'grid', placeItems: 'center', fontSize: '.85rem', flexShrink: 0 },
  exCardMode: { fontSize: '.72rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' },
  exCardText: { fontSize: '.84rem', color: 'var(--text2)', lineHeight: 1.5, fontWeight: 300 },
  exArrow: { fontSize: '.8rem', color: 'var(--muted)', alignSelf: 'flex-end', marginTop: 'auto' },
  // coming soon
  comingSoon: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '48px' },
  csIconWrap: { width: '80px', height: '80px', borderRadius: '20px', display: 'grid', placeItems: 'center', fontSize: '2.4rem' },
  csTitle: { fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' },
  csSub: { fontSize: '.9rem', color: 'var(--muted)', textAlign: 'center', maxWidth: '340px', lineHeight: 1.6, fontWeight: 300 },
  csBadge: { padding: '6px 16px', borderRadius: '999px', border: '1px solid var(--border2)', fontSize: '.78rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' },
  csFeats: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '380px' },
  csFeat: { padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg3)', fontSize: '.78rem', color: 'var(--text2)' },
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function App() {
  const [projects, setProjects] = useState(loadProjects)
  const [activeId, setActiveId] = useState(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('landing')
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(null)

  const activeMode = MODES.find(m => m.id === mode)
  const activeProject = projects.find(p => p.id === activeId)
  const filteredProjects = search.trim()
    ? projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects

  // ── criar novo projeto ──────────────────────────────────────────────────────
  function newProject(initialMode = 'landing') {
    const id = Date.now().toString()
    const d = new Date()
    const proj = {
      id,
      name: 'Novo projeto',
      code: '',
      mode: initialMode,
      created: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    }
    const updated = [proj, ...projects]
    setProjects(updated)
    saveProjects(updated)
    setActiveId(id)
    setCode('')
    setMode(initialMode)
  }

  // ── selecionar projeto ──────────────────────────────────────────────────────
  function selectProject(proj) {
    setActiveId(proj.id)
    setCode(proj.code || '')
    setMode(proj.mode || 'landing')
  }

  // ── gerar via IA ────────────────────────────────────────────────────────────
  const generate = useCallback(async (prompt) => {
    if (!activeMode?.system) return
    // cria projeto se nao existe
    let currentId = activeId
    if (!currentId) {
      const id = Date.now().toString()
      const d = new Date()
      const proj = {
        id,
        name: prompt.length > 44 ? prompt.slice(0, 44) + '...' : prompt,
        code: '',
        mode,
        created: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      }
      const updated = [proj, ...projects]
      setProjects(updated)
      saveProjects(updated)
      setActiveId(id)
      currentId = id
    }
    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: activeMode.system,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const raw = data.content?.[0]?.text || ''
      const clean = raw.replace(/```(?:jsx?|tsx?|html?)?\n?/gi, '').replace(/```/g, '').trim()
      setCode(clean)
      setProjects(prev => {
        const updated = prev.map(p =>
          p.id === currentId
            ? { ...p, code: clean, name: prompt.length > 44 ? prompt.slice(0, 44) + '...' : prompt, mode }
            : p
        )
        saveProjects(updated)
        return updated
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeMode, activeId, projects, mode])

  // ── exemplo clicado ─────────────────────────────────────────────────────────
  function clickExample(example, exMode) {
    setMode(exMode)
    if (!activeId) newProject(exMode)
    else setMode(exMode)
    setTimeout(() => generate(example), 50)
  }

  // ── copiar codigo ───────────────────────────────────────────────────────────
  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── placeholder por modo ────────────────────────────────────────────────────
  const placeholders = {
    landing:   'Descreva sua landing page: nicho, publico, objetivo...',
    site:      'Descreva o site: tipo de negocio, paginas, estilo...',
    dashboard: 'Descreva o dashboard: area, metricas, dados...',
    component: 'Descreva o componente: funcao, interacoes, design...',
  }

  // ── render welcome (tela inicial) ───────────────────────────────────────────
  function renderWelcome() {
    return (
      <div style={S.welcome} className="animate-in">
        <div style={S.welcomeHead}>
          <div style={S.welcomeTitle}>
            Bom dia, Elias 👋
          </div>
          <div style={S.welcomeSub}>
            O que vamos criar hoje? Escolha um exemplo abaixo ou descreva no campo de prompt.
          </div>
        </div>

        <div style={S.statsRow}>
          {[
            { num: projects.length || '0', label: 'Projetos criados' },
            { num: '4', label: 'Modos ativos' },
            { num: '5s', label: 'Tempo de geracao' },
            { num: 'Pro', label: 'Seu plano' },
          ].map((s, i) => (
            <div key={i} style={S.statCard}>
              <div style={S.statNum}>{s.num}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={S.exSection}>
          <div style={S.exLabel}>
            <span>✦</span> exemplos para comecar
          </div>
          <div style={S.exGrid}>
            {MODES.filter(m => !m.badge).flatMap(m =>
              m.examples.slice(0, 2).map((ex, i) => (
                <div
                  key={`${m.id}-${i}`}
                  style={{
                    ...S.exCard,
                    borderColor: hovered === `${m.id}-${i}` ? m.color : 'var(--border)',
                    background: hovered === `${m.id}-${i}` ? `${m.colorBg}` : 'var(--bg3)',
                    transform: hovered === `${m.id}-${i}` ? 'translateY(-2px)' : 'none',
                    boxShadow: hovered === `${m.id}-${i}` ? `0 8px 24px rgba(0,0,0,.3)` : 'none',
                  }}
                  onMouseEnter={() => setHovered(`${m.id}-${i}`)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => clickExample(ex, m.id)}
                >
                  <div style={S.exCardTop}>
                    <div style={{ ...S.exCardIcon, background: m.colorBg }}>{m.icon}</div>
                    <span style={S.exCardMode}>{m.label}</span>
                  </div>
                  <div style={S.exCardText}>{ex}</div>
                  <div style={S.exArrow}>→</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── render coming soon ──────────────────────────────────────────────────────
  function renderComingSoon(m) {
    const feats = {
      image: ['Banners para sites', 'Capas de redes sociais', 'Thumbnails de video', 'Ilustracoes vetoriais'],
      video: ['Videos de apresentacao', 'Anuncios animados', 'Reels e Shorts', 'Vinhetas e intros'],
    }
    return (
      <div style={S.comingSoon}>
        <div style={{ ...S.csIconWrap, background: m.colorBg, border: `1px solid ${m.color}22` }}>
          {m.icon}
        </div>
        <div style={S.csTitle}>{m.label}</div>
        <div style={S.csSub}>
          Estamos construindo esse modo. Em breve disponivel para todos os planos Pro e Business.
        </div>
        <div style={S.csBadge}>em breve</div>
        <div style={S.csFeats}>
          {(feats[m.id] || []).map((f, i) => (
            <div key={i} style={S.csFeat}>{f}</div>
          ))}
        </div>
      </div>
    )
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <div style={S.sidebar}>

        {/* logo + novo */}
        <div style={S.sideHead}>
          <div style={S.logoArea}><Logo /></div>
          <button
            style={S.newBtn}
            onClick={() => { setActiveId(null); setCode(''); newProject(mode) }}
            title="Novo projeto"
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text2)' }}
          >
            +
          </button>
        </div>

        {/* busca */}
        <div style={S.searchBox}>
          <input
            style={S.searchInput}
            placeholder="Buscar projeto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* lista de projetos */}
        <div style={S.projList}>
          {filteredProjects.length === 0 && (
            <div style={S.projEmpty}>
              {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda.\nClique em + para criar.'}
            </div>
          )}
          {filteredProjects.map(proj => {
            const pm = MODES.find(m => m.id === (proj.mode || 'component')) || MODES[0]
            const isActive = proj.id === activeId
            return (
              <div
                key={proj.id}
                style={{
                  ...S.projItem,
                  ...(isActive ? S.projItemActive : {}),
                  background: isActive ? 'rgba(94,107,255,.1)' : hovered === proj.id ? 'var(--bg3)' : 'transparent',
                }}
                onClick={() => selectProject(proj)}
                onMouseEnter={() => setHovered(proj.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div style={{ ...S.projIcon, background: pm.colorBg }}>{pm.icon}</div>
                <div style={S.projInfo}>
                  <div style={{ ...S.projName, color: isActive ? 'var(--text)' : 'var(--text2)' }}>
                    {proj.name || 'Sem titulo'}
                  </div>
                  <div style={S.projMeta}>{pm.label} · {proj.created}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* rodape */}
        <div style={S.sideFooter}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--muted)', marginBottom: '5px' }}>
              <span>Uso do plano</span>
              <span style={{ color: 'var(--text2)' }}>3 / ilimitado</span>
            </div>
            <div style={S.usageBar}><div style={S.usageFill}></div></div>
          </div>
          <div style={S.userRow}>
            <div style={S.avatar}>E</div>
            <div style={{ minWidth: 0 }}>
              <div style={S.userName}>Elias</div>
              <div style={S.userPlan}>Pro · ilimitado</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <div style={S.main}>

        {/* topbar */}
        <div style={S.topbar}>
          <div style={S.topTitle}>
            {activeProject ? activeProject.name : 'Zero Preview'}
          </div>
          {activeProject && (
            <>
              <button
                style={{ ...S.topBtn, color: copied ? 'var(--green)' : 'var(--muted)' }}
                onClick={copyCode}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = copied ? 'var(--green)' : 'var(--muted)' }}
              >
                {copied ? '✓ Copiado' : 'Copiar codigo'}
              </button>
              <button
                style={{ ...S.topBtn, ...S.topBtnPrimary }}
                onClick={() => { setActiveId(null); setCode('') }}
                onMouseEnter={e => e.currentTarget.style.background = '#6F7BFF'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
              >
                + Novo
              </button>
            </>
          )}
          {!activeProject && (
            <button
              style={{ ...S.topBtn, ...S.topBtnPrimary }}
              onClick={() => newProject(mode)}
              onMouseEnter={e => e.currentTarget.style.background = '#6F7BFF'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            >
              + Novo projeto
            </button>
          )}
        </div>

        {/* barra de modos */}
        <div style={S.modeBar}>
          {MODES.map(m => (
            <button
              key={m.id}
              style={{
                ...S.modeBtn,
                ...(mode === m.id ? { ...S.modeBtnActive, color: m.color } : {}),
                opacity: m.badge ? .5 : 1,
                cursor: m.badge ? 'not-allowed' : 'pointer',
              }}
              onClick={() => !m.badge && setMode(m.id)}
              title={m.description}
            >
              {m.icon} {m.label}
              {m.badge && <span style={S.modeBadge}>{m.badge}</span>}
            </button>
          ))}
        </div>

        {/* area principal */}
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
              <PromptInput
                onSubmit={generate}
                loading={loading}
                placeholder={placeholders[mode] || 'Descreva o que quer criar...'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
