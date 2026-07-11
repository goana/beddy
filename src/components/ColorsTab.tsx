import { useMemo, useState } from 'react'
import { DELICA_COLORS } from '../data/delica'
import { delicaByCode } from '../lib/color'
import { useStore } from '../store'

export default function ColorsTab() {
  const color = useStore((s) => s.color)
  const setColor = useStore((s) => s.setColor)
  const recent = useStore((s) => s.recentColors)
  const [q, setQ] = useState('')

  const selected = delicaByCode(color)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return DELICA_COLORS
    return DELICA_COLORS.filter(
      (c) => c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query),
    )
  }, [q])

  return (
    <div className="colors-tab">
      {selected && (
        <div className="selected-card">
          <div className="chip" style={{ background: selected.hex }} />
          <div className="meta">
            <div className="code">{selected.code}</div>
            <div className="cname">{selected.name}</div>
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <>
          <div className="section-title">Recientes</div>
          <div className="recent-row">
            {recent.map((code) => {
              const c = delicaByCode(code)
              if (!c) return null
              return (
                <button
                  key={code}
                  className={`swatch small ${code === color ? 'active' : ''}`}
                  style={{ background: c.hex }}
                  title={`${c.code} · ${c.name}`}
                  onClick={() => setColor(code)}
                />
              )
            })}
          </div>
        </>
      )}

      <div className="section-title">Paleta Delica ({filtered.length})</div>
      <input
        className="search"
        placeholder="Buscar por código o nombre…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="palette">
        {filtered.map((c) => (
          <button
            key={c.code}
            className={`swatch ${c.code === color ? 'active' : ''}`}
            style={{ background: c.hex }}
            title={`${c.code} · ${c.name}`}
            onClick={() => setColor(c.code)}
          />
        ))}
      </div>
    </div>
  )
}
