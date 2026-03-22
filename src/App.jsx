import { useState, useCallback } from 'react'
import Logo from './Logo'
import PromptInput from './components/PromptInput'
import CodePreview from './components/CodePreview'

const MODES = [
  {
    id: 'landing',
    label: 'Landing Page',
    icon: '🚀',
    badge: null,
    description: 'Pagina de vendas completa',
    system: `Voce e um especialista em criacao de landing pages de alta conversao.
Quando o usuario descrever uma landing page, gere um componente React COMPLETO e UNICO (export default function) com:
- Hero section com titulo forte, subtitulo e CTA
- Secao de beneficios/features (minimo 3)
- Secao de depoimentos ou prova social
- Secao de precos (se aplicavel)
- CTA final forte
- Design profissional com inline styles (dark ou light conforme o nicho)
- Responsivo (use flexbox/grid via inline styles)
- Sem imports externos. Apenas React + hooks.
Retorne SOMENTE o codigo JSX, sem explicacoes, sem markdown, sem backticks.`,
  },
  {
    id: 'site',
    label: 'Site Completo',
    icon: '🌐',
    badge: null,
    description: 'Site institucional com navegacao',
    system: `Voce e um especialista em criacao de sites completos.
Quando o usuario descrever um site, gere um componente React COMPLETO com:
- Navbar com logo e links de navegacao
- Hero section
- Secao Sobre
- Secao de Servicos/Produtos
- Secao de Contato com formulario
- Footer com links e informacoes
- Design profissional com inline styles
- Responsivo
- Sem imports externos. Apenas React + hooks.
Retorne SOMENTE o codigo JSX, sem explicacoes, sem markdown, sem backticks.`,
  },
  {
    id: 'component',
    label: 'Componente',
    icon: '⚡',
    badge: null,
    description: 'Componente React reutilizavel',
    system: `Voce e um especialista em criacao de componentes React.
Gere um componente React funcional, moderno e reutilizavel.
- Use apenas inline styles (sem CSS externo, sem Tailwind, sem styled-components)
- Inclua estado (useState) quando necessario
- Seja criativo e profissional no design
- O componente deve ser export default function
- Sem imports externos. Apenas React + hooks.
Retorne SOMENTE o codigo JSX puro, sem explicacoes, sem markdown, sem backticks.`,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    badge: null,
    description: 'Painel com graficos e dados',
    system: `Voce e um especialista em criacao de dashboards e interfaces de dados.
Quando o usuario descrever um dashboard, gere um componente React COMPLETO com:
- Header com titulo e acoes
- Cards de metricas/KPIs no topo
- Graficos simulados com dados mock (barras ou linhas com divs/spans)
- Tabela de dados se aplicavel
- Sidebar ou navegacao lateral se necessario
- Design escuro e profissional com inline styles
- Sem imports externos. Apenas React + hooks.
Retorne SOMENTE o codigo JSX, sem explicacoes, sem markdown, sem backticks.`,
  },
  {
    id: 'image',
    label: 'Imagem com IA',
    icon: '🎨',
    badge: 'em breve',
    description: 'Banners e artes com IA',
    system: null,
  },
  {
    id: 'video',
    label: 'Video com IA',
    icon: '🎬',
    badge: 'em breve',
    description: 'Videos e anuncios com IA',
    system: null,
  },
]

const PROJECTS_KEY = 'zero_projects_v2'

function loadProjects() {
  try { return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [] } catch { return [] }
}
function saveProjects(p) {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(p)) } catch {}
}

const styles = {
  app: { display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)', overflow: 'hidden' },
  sidebar: { width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' },
  sidebarTop: { padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' },
  logoWrap: { flex: 1 },
  newBtn: { width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(94,107,255,.15)', border: '1px solid rgba(94,107,255,.3)', color: '#9BA8FF', fontSize: '1.2rem', cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1 },
  projectList: { flex: 1, overflowY: 'auto', padding: '8px' },
  projectItem: { padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', fontSize: '0.82rem', color: 'var(--muted)', transition: 'all .15s', display: 'flex', flexDirection: 'column', gap: '3px' },
  projectItemActive: { background: 'rgba(94,107,255,.12)', color: 'var(--text)' },
  projectName: { fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  projectMeta: { fontSize: '0.72rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' },
  projectMode: { padding: '1px 6px', borderRadius: '3px', background: 'var(--border)', fontSize: '0.68rem' },
  sidebarFooter: { padding: '12px 16px', borderTop: '1px solid var(--border)' },
  userRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'grid', placeItems: 'center', fontSize: '.7rem', fontWeight: 700, color: 'white', flexShrink: 0 },
  userName: { fontSize: '.82rem', fontWeight: 500 },
  userPlan: { fontSize: '.7rem', color: 'var(--muted)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar: { height: '52px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', background: 'var(--surface)', flexShrink: 0 },
  topbarTitle: { fontSize: '.85rem', fontWeight: 500, flex: 1, color: 'var(--muted)' },
  modeBar: { padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', flexShrink: 0, background: 'var(--bg2)' },
  modeBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: '.78rem', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', transition: 'all .2s' },
  modeBtnActive: { borderColor: 'rgba(94,107,255,.5)', background: 'rgba(94,107,255,.12)', color: '#9BA8FF' },
  modeBtnDisabled: { opacity: .45, cursor: 'not-allowed' },
  modeBadge: { fontSize: '.62rem', padding: '1px 6px', borderRadius: '3px', background: 'rgba(255,140,66,.15)', color: '#FF8C42', border: '1px solid rgba(255,140,66,.2)' },
  content: { flex: 1, display: 'grid', gridTemplateRows: '1fr auto', overflow: 'hidden' },
  preview: { overflow: 'hidden', position: 'relative' },
  inputArea: { borderTop: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0 },
  comingSoon: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', color: 'var(--muted)', padding: '40px' },
  csBig: { fontSize: '3rem' },
  csTitle: { fontFamily: 'var(--font-head)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' },
  csSub: { fontSize: '.9rem', textAlign: 'center', maxWidth: '360px', lineHeight: 1.6 },
  csTag: { padding: '6px 16px', borderRadius: '999px', border: '1px solid var(--border2)', fontSize: '.78rem', fontFamily: 'var(--font-mono)' },
}

export default function App() {
  const [projects, setProjects] = useState(loadProjects)
  const [activeId, setActiveId] = useState(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('landing')

  const activeMode = MODES.find(m => m.id === mode)
  const activeProject = projects.find(p => p.id === activeId)

  function newProject() {
    const id = Date.now().toString()
    const proj = { id, name: 'Novo projeto', code: '', mode: 'landing', created: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit' }) }
    const updated = [proj, ...projects]
    setProjects(updated)
    saveProjects(updated)
    setActiveId(id)
    setCode('')
    setMode('landing')
  }

  function selectProject(proj) {
    setActiveId(proj.id)
    setCode(proj.code || '')
    setMode(proj.mode || 'landing')
  }

  const generate = useCallback(async (prompt) => {
    if (!activeMode || !activeMode.system) return
    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: activeMode.system,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const raw = data.content?.[0]?.text || ''
      const clean = raw.replace(/```(?:jsx?|tsx?|html?)?\n?/gi, '').replace(/```/g, '').trim()
      setCode(clean)
      if (activeId) {
        const name = prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt
        const updated = projects.map(p => p.id === activeId ? { ...p, code: clean, name, mode } : p)
        setProjects(updated)
        saveProjects(updated)
      } else {
        newProject()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeMode, activeId, projects, mode])

  const placeholders = {
    landing: 'Ex: Landing page para academia de musculacao com planos mensais e depoimentos...',
    site: 'Ex: Site para barbearia moderna com servicos, fotos e agendamento...',
    component: 'Ex: Card de produto com imagem, titulo, preco e botao de comprar...',
    dashboard: 'Ex: Dashboard de vendas com metricas de receita, clientes e grafico mensal...',
    image: '',
    video: '',
  }

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logoWrap}><Logo /></div>
          <button style={styles.newBtn} onClick={newProject} title="Novo projeto">+</button>
        </div>

        <div style={styles.projectList}>
          {projects.length === 0 && (
            <div style={{ padding: '20px 12px', fontSize: '.8rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
              Clique em + para criar seu primeiro projeto
            </div>
          )}
          {projects.map(proj => {
            const projMode = MODES.find(m => m.id === (proj.mode || 'component'))
            return (
              <div
                key={proj.id}
                style={{ ...styles.projectItem, ...(proj.id === activeId ? styles.projectItemActive : {}) }}
                onClick={() => selectProject(proj)}
              >
                <div style={styles.projectName}>{proj.name || 'Sem titulo'}</div>
                <div style={styles.projectMeta}>
                  <span style={styles.projectMode}>{projMode?.icon} {projMode?.label}</span>
                  <span>{proj.created || ''}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div style={styles.sidebarFooter}>
          <div style={styles.userRow}>
            <div style={styles.avatar}>E</div>
            <div>
              <div style={styles.userName}>ELIAS</div>
              <div style={styles.userPlan}>Pro · ilimitado</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        {/* TOPBAR */}
        <div style={styles.topbar}>
          <div style={styles.topbarTitle}>
            {activeProject ? activeProject.name : 'Zero Preview — Gerador com IA'}
          </div>
          {activeProject && (
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              style={{ padding: '5px 14px', borderRadius: '6px', background: 'var(--border)', border: 'none', color: 'var(--muted)', fontSize: '.75rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
            >
              Copiar codigo
            </button>
          )}
        </div>

        {/* MODE BAR */}
        <div style={styles.modeBar}>
          {MODES.map(m => (
            <button
              key={m.id}
              style={{
                ...styles.modeBtn,
                ...(mode === m.id ? styles.modeBtnActive : {}),
                ...(m.badge ? styles.modeBtnDisabled : {}),
              }}
              onClick={() => !m.badge && setMode(m.id)}
              title={m.description}
            >
              {m.icon} {m.label}
              {m.badge && <span style={styles.modeBadge}>{m.badge}</span>}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={styles.content}>
          <div style={styles.preview}>
            {activeMode?.badge ? (
              <div style={styles.comingSoon}>
                <span style={styles.csBig}>{activeMode.icon}</span>
                <div style={styles.csTitle}>{activeMode.label}</div>
                <p style={styles.csSub}>{activeMode.description} — estamos construindo. Em breve disponivel para todos os planos Pro.</p>
                <span style={styles.csTag}>em breve</span>
              </div>
            ) : (
              <CodePreview code={code} loading={loading} />
            )}
          </div>
          <div style={styles.inputArea}>
            {!activeMode?.badge && (
              <PromptInput
                onSubmit={generate}
                loading={loading}
                placeholder={placeholders[mode] || 'Descreva o que quer criar...'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
