import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { deletePattern, getPattern, importJSON, listPatterns, savePattern, type SavedMeta } from '../lib/storage'
import { canvasSize, drawPattern } from '../lib/render'
import { exportPNG } from '../lib/exportImage'
import type { Pattern } from '../lib/pattern'

export default function LibraryTab({ notify }: { notify: (m: string) => void }) {
  const pattern = useStore((s) => s.pattern)
  const loadPattern = useStore((s) => s.loadPattern)
  const setName = useStore((s) => s.setName)
  const [items, setItems] = useState<SavedMeta[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  function refresh() {
    setItems(listPatterns())
  }
  useEffect(refresh, [])

  function save() {
    try {
      const existed = !!getPattern(pattern.id)
      savePattern({ ...pattern, updatedAt: Date.now() })
      refresh()
      notify(existed ? 'Patrón actualizado 💾' : 'Guardado en tu biblioteca 💾')
    } catch {
      notify('No se pudo guardar (almacenamiento lleno)')
    }
  }

  function open(id: string) {
    if (editingId) return
    const p = getPattern(id)
    if (p) { loadPattern(p); notify(`Editando: ${p.name}`) }
  }

  function startRename(e: React.MouseEvent, it: SavedMeta) {
    e.stopPropagation()
    setEditingId(it.id)
    setDraft(it.name)
  }

  function commitRename() {
    if (!editingId) return
    const p = getPattern(editingId)
    const name = draft.trim()
    if (p && name) {
      savePattern({ ...p, name, updatedAt: Date.now() })
      if (editingId === pattern.id) setName(name) // actualiza también el abierto
      notify('Nombre actualizado ✏️')
    }
    setEditingId(null)
    refresh()
  }

  function downloadPNG(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const p = getPattern(id)
    if (p) { exportPNG(p); notify('Descargando PNG 🖼️') }
  }

  function remove(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm('¿Eliminar este patrón guardado?')) return
    deletePattern(id)
    refresh()
  }

  async function onImportFile(file: File) {
    try {
      const p = await importJSON(file)
      savePattern(p)
      loadPattern(p)
      refresh()
      notify(`Importado: ${p.name}`)
    } catch {
      notify('No se pudo importar el archivo')
    }
  }

  return (
    <div>
      <button className="btn primary" style={{ width: '100%', marginBottom: 8 }} onClick={save}>
        💾 Guardar patrón actual
      </button>
      <button className="btn" style={{ width: '100%', marginBottom: 16 }} onClick={() => importRef.current?.click()}>
        📂 Importar patrón (.json)
      </button>
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = '' }}
      />

      <div className="section-title">Tus patrones ({items.length})</div>
      {items.length === 0 ? (
        <div className="empty"><span className="big">📁</span>Todavía no has guardado ningún patrón.<br />Guarda el actual y aquí podrás abrirlo y editarlo cuando quieras.</div>
      ) : (
        items.map((it) => (
          <div key={it.id} className="lib-item" onClick={() => open(it.id)}>
            <LibThumb id={it.id} />
            <div className="li-info">
              {editingId === it.id ? (
                <input
                  className="li-rename"
                  autoFocus
                  value={draft}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
              ) : (
                <div className="li-name">{it.name}</div>
              )}
              <div className="li-meta">{it.stitch === 'loom' ? 'Telar' : 'Peyote'} · {it.width}×{it.height} · toca para editar</div>
            </div>
            <div className="lib-actions">
              <button className="lib-act" onClick={(e) => downloadPNG(e, it.id)} title="Descargar PNG">🖼️</button>
              <button className="lib-act" onClick={(e) => startRename(e, it)} title="Renombrar">✏️</button>
              <button className="lib-act del" onClick={(e) => remove(e, it.id)} title="Eliminar">🗑</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function LibThumb({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const p = getPattern(id)
    if (!canvas || !p) return
    const cellPx = Math.max(2, Math.floor(46 / Math.max(p.width, p.height)))
    const pad = 3
    const size = canvasSize(p as Pattern, cellPx, pad)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size.width * dpr
    canvas.height = size.height * dpr
    canvas.style.width = size.width + 'px'
    canvas.style.height = size.height + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const light = document.documentElement.getAttribute('data-theme') === 'light'
    drawPattern(ctx, p as Pattern, { cellPx, pad, background: light ? '#ffffff' : '#0d0f16', light })
  }, [id])
  return (
    <div className="lib-thumb">
      <canvas ref={ref} />
    </div>
  )
}
