import { useState, useRef } from 'react'

export default function PromptInput({ onSubmit, loading, placeholder, compact }) {
  const [value, setValue] = useState('')
  const [image, setImage] = useState(null)
  const textareaRef = useRef(null)
  const fileRef = useRef(null)

  function handleSubmit() {
    const trimmed = value.trim()
    if ((!trimmed && !image) || loading) return
    onSubmit(trimmed, image)
    setValue('')
    setImage(null)
    if (textareaRef.current) textareaRef.current.style.height = '70px'
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  function handleInput(e) {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const reader = new FileReader()
        reader.onload = ev => setImage(ev.target.result)
        reader.readAsDataURL(item.getAsFile())
        return
      }
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImage(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => setImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const canSubmit = (value.trim() || image) && !loading

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'white' }}
      onDrop={handleDrop} onDragOver={e => e.preventDefault()}>

      {image && (
        <div style={{ padding: '8px 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={image} alt="ref" style={{ height: '50px', width: 'auto', borderRadius: '6px', border: '1px solid var(--border)' }} />
            <button onClick={() => setImage(null)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '.6rem', display: 'grid', placeItems: 'center' }}>✕</button>
          </div>
          <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Imagem de referencia adicionada</span>
        </div>
      )}

      <textarea
        id="zp-prompt-input"
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKey}
        onPaste={handlePaste}
        placeholder={image ? 'Descreva o que criar com base nessa imagem...' : placeholder}
        disabled={loading}
        rows={3}
        style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', padding: '10px 12px', fontSize: '.88rem', fontFamily: 'var(--font-body)', color: 'var(--text)', background: 'white', lineHeight: 1.5, minHeight: '70px', maxHeight: '140px' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderTop: '1px solid var(--border)' }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <button
          onClick={() => fileRef.current?.click()}
          title="Adicionar imagem (ou cole Ctrl+V)"
          style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: image ? 'rgba(45,107,228,.1)' : 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: '.9rem', color: image ? 'var(--accent)' : 'var(--muted)', transition: 'all .15s', flexShrink: 0 }}
        >🖼</button>
        <span style={{ fontSize: '.68rem', color: 'var(--muted)', flex: 1, fontFamily: 'var(--font-mono)' }}>
          {image ? '✓ imagem pronta' : 'Cole Ctrl+V ou clique 🖼'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', background: canSubmit ? 'var(--accent)' : 'var(--border)', color: canSubmit ? 'white' : 'var(--muted)', fontSize: '.82rem', fontWeight: 700, fontFamily: 'var(--font-head)', transition: 'all .15s', flexShrink: 0 }}
        >
          {loading ? <><span className="spinner" style={{ width: '13px', height: '13px', borderWidth: '2px' }} />Gerando...</> : <>▶ Gerar</>}
        </button>
      </div>
    </div>
  )
}
