import { useMemo } from 'react'
import { delicaByCode } from '../lib/color'
import { useStore } from '../store'
import { exportBeadListCSV } from '../lib/exportImage'

export default function MaterialsTab() {
  const pattern = useStore((s) => s.pattern)
  const setColor = useStore((s) => s.setColor)

  const { rows, total } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of pattern.cells) if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
    const rows = [...counts.entries()]
      .map(([code, n]) => ({ code, n, color: delicaByCode(code) }))
      .sort((a, b) => b.n - a.n)
    const total = rows.reduce((s, r) => s + r.n, 0)
    return { rows, total }
  }, [pattern])

  const max = rows[0]?.n ?? 1

  if (rows.length === 0) {
    return (
      <div className="empty">
        <span className="big">🧵</span>
        Aún no hay cuentas.<br />Pinta el patrón o extrae uno de una imagen y aquí verás la lista de compra.
      </div>
    )
  }

  return (
    <div>
      <div className="mat-total">
        <div>
          <div className="n">{total.toLocaleString('es')}</div>
          <div className="lbl">cuentas · {rows.length} colores</div>
        </div>
        <button className="btn ghost" onClick={() => exportBeadListCSV(pattern)}>⬇ CSV</button>
      </div>

      {rows.map(({ code, n, color }) => (
        <div key={code} className="mat-row" onClick={() => setColor(code)} title="Seleccionar este color">
          <div className="chip" style={{ background: color?.hex ?? '#333' }} />
          <div className="info">
            <div className="code">{code}</div>
            <div className="nm">{color?.name ?? 'Desconocido'}</div>
            <div className="bar" style={{ width: `${Math.max(6, (n / max) * 100)}%`, background: color?.hex ?? '#555' }} />
          </div>
          <div className="count">{n}</div>
        </div>
      ))}
    </div>
  )
}
