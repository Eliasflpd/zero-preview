import { useState, useRef } from 'react'

export default function PromptInput({ onSubmit, loading, placeholder, compact }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = compact ? '70px' : '80px'
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleInput(e) {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, compact ? 120 : 160) + 'px'
  }

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', background: 'white' }}>
        <textarea
          id="zp-prompt-input"
          ref={textareaRef}
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '10px', border: 'none', cursor: loading || !value.trim() ? 'not-allowed' : 'pointer',
            background: loading || !value.trim() ? 'var(--border)' : 'var(--accent)',
            color: loading || !value.trim() ? 'var(--muted)' : 'white',
            fontSize: '.82rem', fontWeight: 700, fontFamily: 'var(--font-head)',
            transition: 'all .15s', letterSpacing: '.02em',
          }}
        >
          {loading
            ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />Gerando...</>
            : <>▶ Gerar</>
          }
        </button>
      </div>
    )
  }

  // modo normal (fallback — mantido caso usado em outro lugar)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderTop: '1px solid var(--border)' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKey}
        placeholder={placeholder}
        disabled={loading}
        rows={3}
        style={{
          width: '100%', resize: 'none', border: 'none', outline: 'none',
          padding: '14px 18px', fontSize: '.9rem', fontFamily: 'var(--font-body)',
          color: 'var(--text)', background: 'white', lineHeight: 1.6,
          minHeight: '80px', maxHeight: '160px',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 12px', borderTop: '1px solid var(--border)', gap: '8px' }}>
        <span style={{ fontSize: '.72rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Enter para gerar</span>
        <button
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '8px 20px', borderRadius: '7px', border: 'none',
            cursor: loading || !value.trim() ? 'not-allowed' : 'pointer',
            background: loading || !value.trim() ? 'var(--border)' : 'var(--accent)',
            color: loading || !value.trim() ? 'var(--muted)' : 'white',
            fontSize: '.82rem', fontWeight: 700, fontFamily: 'var(--font-head)',
            transition: 'all .15s',
          }}
        >
          {loading
            ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />Gerando...</>
            : <>▶ Gerar</>
          }
        </button>
      </div>
    </div>
  )
}
