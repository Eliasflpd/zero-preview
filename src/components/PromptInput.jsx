import { useState } from 'react'

export default function PromptInput({ onGenerate, loading, placeholder }) {
  const [text, setText] = useState('')

  function handleSubmit() {
    if (!text.trim() || loading) return
    onGenerate(text.trim())
    setText('')
  }

  function handleKey(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit()
  }

  return (
    <div style={styles.wrap}>
      <textarea
        style={styles.textarea}
        placeholder={placeholder || 'Descreva o componente... (Ctrl+Enter para gerar)'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        disabled={loading}
        rows={4}
      />
      <button
        style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? '◌ Gerando...' : '▶ Gerar'}
      </button>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderTop: '1px solid var(--border)',
    paddingTop: '12px',
    flexShrink: 0,
  },
  textarea: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.88rem',
    padding: '10px 12px',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.6,
  },
  btn: {
    background: 'var(--accent)',
    color: '#000',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '10px 0',
    fontWeight: 700,
    fontSize: '0.88rem',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    letterSpacing: '0.04em',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
}