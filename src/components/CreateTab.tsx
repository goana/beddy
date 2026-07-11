import { useEffect, useMemo, useRef, useState } from 'react'
import { MOTIFS, type Motif } from '../data/motifs'
import { motifToCells } from '../lib/motif'
import { drawPattern, canvasSize } from '../lib/render'
import type { Pattern } from '../lib/pattern'
import { useStore } from '../store'

export default function CreateTab({ onDone }: { onDone: (msg: string) => void }) {
  const setCells = useStore((s) => s.setCells)
  const setName = useStore((s) => s.setName)
  const [q, setQ] = useState('')

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return MOTIFS
    return MOTIFS.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.keywords.some((k) => k.includes(query) || query.includes(k)),
    )
  }, [q])

  function load(m: Motif) {
    const r = motifToCells(m)
    setCells(r.cells, r.width, r.height, r.stitch)
    setName(r.name)
    onDone(`Motivo cargado: ${m.name}`)
  }

  return (
    <div>
      <div className="section-title">Crear desde un motivo</div>
      <input
        className="search"
        placeholder="Escribe: gato siamés, corazón, estrella…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {results.length === 0 ? (
        <div className="empty">
          <span className="big">🔍</span>
          No hay ningún motivo para «{q}».<br />Prueba: gato, corazón, rombo, estrella, mariposa.
        </div>
      ) : (
        <div className="motif-grid">
          {results.map((m) => (
            <button key={m.id} className="motif-card" onClick={() => load(m)} title={`Cargar «${m.name}»`}>
              <MotifThumb motif={m} />
              <span className="motif-name">{m.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="hint-note">
        Los motivos están dibujados a mano para cuentas, así que se ven limpios y reconocibles. Al cargar uno reemplaza el lienzo; luego puedes editarlo, cambiar colores o ampliarlo. ¿Echas en falta alguno? Se pueden ir añadiendo.
      </div>
    </div>
  )
}

function MotifThumb({ motif }: { motif: Motif }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const r = motifToCells(motif)
    const p = { stitch: r.stitch, width: r.width, height: r.height, cells: r.cells } as Pattern
    const cellPx = Math.max(3, Math.floor(120 / Math.max(r.width, r.height)))
    const pad = 4
    const size = canvasSize(p, cellPx, pad)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size.width * dpr
    canvas.height = size.height * dpr
    canvas.style.width = size.width + 'px'
    canvas.style.height = size.height + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const light = document.documentElement.getAttribute('data-theme') === 'light'
    drawPattern(ctx, p, { cellPx, pad, background: light ? '#ffffff' : '#0d0f16', light })
  }, [motif])

  return <canvas ref={ref} className="motif-thumb" />
}
