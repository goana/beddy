import { useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { MAX_HEIGHT, MAX_WIDTH } from './lib/pattern'
import { exportPNG, exportBeadListCSV } from './lib/exportImage'
import { exportJSON, importJSON } from './lib/storage'
import BeadCanvas from './components/BeadCanvas'
import Rail from './components/Rail'
import ColorsTab from './components/ColorsTab'
import CreateTab from './components/CreateTab'
import ImageTab from './components/ImageTab'
import MaterialsTab from './components/MaterialsTab'
import LibraryTab from './components/LibraryTab'

type Tab = 'colors' | 'create' | 'image' | 'materials' | 'library'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'colors', label: 'Colores', icon: '🎨' },
  { id: 'create', label: 'Crear', icon: '🧩' },
  { id: 'image', label: 'Imagen', icon: '🖼️' },
  { id: 'materials', label: 'Materiales', icon: '🧵' },
  { id: 'library', label: 'Guardados', icon: '📁' },
]

export default function App() {
  const pattern = useStore((s) => s.pattern)
  const setName = useStore((s) => s.setName)
  const setStitch = useStore((s) => s.setStitch)
  const setSize = useStore((s) => s.setSize)
  const newPattern = useStore((s) => s.newPattern)
  const loadPattern = useStore((s) => s.loadPattern)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const setTool = useStore((s) => s.setTool)
  const canUndo = useStore((s) => s.past.length > 0)
  const canRedo = useStore((s) => s.future.length > 0)

  const [tab, setTab] = useState<Tab>('colors')
  const [zoom, setZoom] = useState(24)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('beddy.theme') as 'dark' | 'light') || 'dark')
  const [toast, setToast] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<number>()
  const canvasAreaRef = useRef<HTMLDivElement>(null)

  const ZOOM_MIN = 8
  const ZOOM_MAX = 80

  // Zoom con trackpad (pinch) o Cmd/Ctrl + rueda; scroll normal desplaza el lienzo
  useEffect(() => {
    const el = canvasAreaRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      if (!(e.ctrlKey || e.metaKey)) return // pinch en trackpad envía ctrlKey
      e.preventDefault()
      setZoom((z) => {
        const next = z * Math.exp(-e.deltaY * 0.01)
        return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(next)))
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  function notify(msg: string) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }

  // Tema claro / oscuro
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('beddy.theme', theme)
  }, [theme])

  // Atajos de teclado
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        e.shiftKey ? redo() : undo()
        return
      }
      switch (e.key.toLowerCase()) {
        case 'b': setTool('paint'); break
        case 'e': setTool('erase'); break
        case 'g': setTool('fill'); break
        case 'i': setTool('eyedropper'); break
        case '+': case '=': setZoom((z) => Math.min(80, z + 4)); break
        case '-': setZoom((z) => Math.max(8, z - 4)); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, setTool])

  async function onImport(file: File) {
    try {
      const p = await importJSON(file)
      loadPattern(p)
      notify(`Importado: ${p.name}`)
    } catch {
      notify('No se pudo importar el archivo')
    }
  }

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <span className="logo">💠</span>
          beddy
          <span className="tag">Miyuki</span>
        </div>

        <input className="name-input" value={pattern.name} onChange={(e) => setName(e.target.value)} spellCheck={false} />

        <div className="seg" title="Técnica de tejido">
          <button className={pattern.stitch === 'loom' ? 'active' : ''} onClick={() => setStitch('loom')}>Telar</button>
          <button className={pattern.stitch === 'peyote' ? 'active' : ''} onClick={() => setStitch('peyote')}>Peyote</button>
        </div>

        <div className="size-row" title="Tamaño en cuentas">
          <input
            className="num-input"
            type="number"
            min={1}
            max={MAX_WIDTH}
            value={pattern.width}
            onChange={(e) => setSize(+e.target.value, pattern.height)}
          />
          <span className="x">×</span>
          <input
            className="num-input"
            type="number"
            min={1}
            max={MAX_HEIGHT}
            value={pattern.height}
            onChange={(e) => setSize(pattern.width, +e.target.value)}
          />
        </div>

        <div className="spacer" />

        <button
          className="icon-btn"
          title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="icon-btn" title="Deshacer (⌘Z)" disabled={!canUndo} onClick={undo}>↩</button>
        <button className="icon-btn" title="Rehacer (⇧⌘Z)" disabled={!canRedo} onClick={redo}>↪</button>

        <div className="menu-wrap">
          <button className="btn" onClick={() => setMenuOpen((o) => !o)}>Archivo ▾</button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setMenuOpen(false)} />
              <div className="menu">
                <button onClick={() => { newPattern(pattern.stitch); setMenuOpen(false); notify('Nuevo patrón') }}>🆕 Nuevo patrón</button>
                <div className="sep" />
                <button onClick={() => { exportPNG(pattern); setMenuOpen(false) }}>🖼️ Exportar PNG</button>
                <button onClick={() => { exportBeadListCSV(pattern); setMenuOpen(false) }}>📄 Lista de materiales (CSV)</button>
                <button onClick={() => { exportJSON(pattern); setMenuOpen(false) }}>💾 Exportar proyecto (.json)</button>
                <div className="sep" />
                <button onClick={() => { importRef.current?.click(); setMenuOpen(false) }}>📂 Importar proyecto…</button>
              </div>
            </>
          )}
        </div>
        <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f) }} />
      </header>

      {/* LEFT RAIL */}
      <Rail />

      {/* CANVAS */}
      <main className="canvas-area" ref={canvasAreaRef}>
        <div className="canvas-wrap">
          <BeadCanvas cellPx={zoom} light={theme === 'light'} />
        </div>

        <div className="zoombar">
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - 4))}>−</button>
          <span>{Math.round((zoom / 24) * 100)}%</span>
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + 4))}>+</button>
        </div>
        <div className="readout">{pattern.width} × {pattern.height} cuentas · {pattern.stitch === 'loom' ? 'Telar' : 'Peyote'}</div>
      </main>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              <span className="ico">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <div className="tab-body">
          {tab === 'colors' && <ColorsTab />}
          {tab === 'create' && <CreateTab onDone={notify} />}
          {tab === 'image' && <ImageTab onDone={notify} />}
          {tab === 'materials' && <MaterialsTab />}
          {tab === 'library' && <LibraryTab notify={notify} />}
        </div>
      </aside>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
