import { useStore, type Tool } from '../store'

const TOOLS: { id: Tool; icon: string; label: string; key: string }[] = [
  { id: 'paint', icon: '✏️', label: 'Pincel', key: 'B' },
  { id: 'erase', icon: '🧽', label: 'Borrador', key: 'E' },
  { id: 'fill', icon: '🪣', label: 'Rellenar área', key: 'G' },
  { id: 'eyedropper', icon: '💧', label: 'Cuentagotas', key: 'I' },
]

export default function Rail() {
  const tool = useStore((s) => s.tool)
  const setTool = useStore((s) => s.setTool)
  const clearAll = useStore((s) => s.clearAll)

  return (
    <div className="rail">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          className={`tool ${tool === t.id ? 'active' : ''}`}
          title={`${t.label} (${t.key})`}
          onClick={() => setTool(t.id)}
        >
          {t.icon}
          <span className="kbd">{t.key}</span>
        </button>
      ))}
      <div className="divider" />
      <button className="tool" title="Vaciar lienzo" onClick={() => { if (confirm('¿Vaciar todo el lienzo?')) clearAll() }}>
        🗑️
      </button>
    </div>
  )
}
