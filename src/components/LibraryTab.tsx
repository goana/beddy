import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { deletePattern, getPattern, listPatterns, savePattern, type SavedMeta } from '../lib/storage'

export default function LibraryTab({ notify }: { notify: (m: string) => void }) {
  const pattern = useStore((s) => s.pattern)
  const loadPattern = useStore((s) => s.loadPattern)
  const [items, setItems] = useState<SavedMeta[]>([])

  function refresh() {
    setItems(listPatterns())
  }
  useEffect(refresh, [])

  function save() {
    savePattern({ ...pattern, updatedAt: Date.now() })
    refresh()
    notify('Guardado en tu biblioteca 💾')
  }

  function open(id: string) {
    const p = getPattern(id)
    if (p) { loadPattern(p); notify(`Abierto: ${p.name}`) }
  }

  function remove(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    deletePattern(id)
    refresh()
  }

  return (
    <div>
      <button className="btn primary" style={{ width: '100%', marginBottom: 16 }} onClick={save}>
        💾 Guardar patrón actual
      </button>

      <div className="section-title">Tus patrones ({items.length})</div>
      {items.length === 0 ? (
        <div className="empty"><span className="big">📁</span>Todavía no has guardado ningún patrón.</div>
      ) : (
        items.map((it) => (
          <div key={it.id} className="lib-item" onClick={() => open(it.id)}>
            <div className="thumb" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="li-name">{it.name}</div>
              <div className="li-meta">{it.stitch === 'loom' ? 'Telar' : 'Peyote'} · {it.width}×{it.height}</div>
            </div>
            <button className="del" onClick={(e) => remove(e, it.id)} title="Eliminar">🗑</button>
          </div>
        ))
      )}
    </div>
  )
}
