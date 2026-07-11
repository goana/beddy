import { delicaByCode } from './color'
import { canvasSize, drawPattern } from './render'
import type { Pattern } from './pattern'
import { download, slug } from './storage'

/** Dibuja el patrón en un canvas nuevo (para exportar como imagen). Respeta el tema. */
export function renderPatternToCanvas(p: Pattern, cellPx = 30): HTMLCanvasElement {
  const pad = Math.round(cellPx * 0.7)
  const size = canvasSize(p, cellPx, pad)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d')!
  const light = document.documentElement.getAttribute('data-theme') === 'light'
  drawPattern(ctx, p, { cellPx, pad, background: light ? '#ffffff' : '#0d0f16', light })
  return canvas
}

export function exportPNG(p: Pattern, cellPx = 34): void {
  const canvas = renderPatternToCanvas(p, cellPx)
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug(p.name)}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

/** Exporta la lista de materiales como CSV. */
export function exportBeadListCSV(p: Pattern): void {
  const counts = new Map<string, number>()
  for (const c of p.cells) if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
  const rows = [['Codigo', 'Nombre', 'Cuentas']]
  for (const [code, n] of [...counts].sort((a, b) => b[1] - a[1])) {
    rows.push([code, delicaByCode(code)?.name ?? '', String(n)])
  }
  const csv = rows.map((r) => r.map((f) => `"${f.replace(/"/g, '""')}"`).join(',')).join('\n')
  download(`${slug(p.name)}-materiales.csv`, csv, 'text/csv')
}
