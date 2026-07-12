import { delicaByCode } from './color'
import { canvasSize, drawPattern } from './render'
import { beadRect, beadUnit, type Pattern } from './pattern'
import { download, slug } from './storage'

interface Theme { bg: string; fg: string; dim: string; line: string; panel: string }

function theme(): Theme {
  const light = document.documentElement.getAttribute('data-theme') === 'light'
  return light
    ? { bg: '#ffffff', fg: '#191c28', dim: '#6b7185', line: 'rgba(0,0,0,0.14)', panel: '#f3f4fa' }
    : { bg: '#0d0f16', fg: '#eef0f7', dim: '#9aa0b4', line: 'rgba(255,255,255,0.14)', panel: '#171a26' }
}

/**
 * Renderiza el patrón como gráfico de tejido: rejilla con números de fila y
 * columna + leyenda de colores (código, nombre y nº de cuentas).
 */
function renderChart(p: Pattern, cellPx: number): HTMLCanvasElement {
  const t = theme()
  const light = t.bg === '#ffffff'
  const u = beadUnit(p.stitch)

  // Rejilla de cuentas en un canvas propio (fondo transparente)
  const gridPad = 2
  const gs = canvasSize(p, cellPx, gridPad)
  const grid = document.createElement('canvas')
  grid.width = gs.width
  grid.height = gs.height
  drawPattern(grid.getContext('2d')!, p, { cellPx, pad: gridPad, light })

  // Leyenda: colores usados y su recuento
  const counts = new Map<string, number>()
  for (const c of p.cells) if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
  const legend = [...counts.entries()]
    .map(([code, n]) => ({ code, n, color: delicaByCode(code) }))
    .sort((a, b) => b.n - a.n)
  const total = legend.reduce((s, l) => s + l.n, 0)

  const marginL = 54 // números de fila
  const marginT = 66 // título + números de columna
  const gap = 30
  const rowH = 30
  const legendW = legend.length ? 268 : 0
  const legendH = legend.length ? 40 + legend.length * rowH : 0

  const W = marginL + gs.width + (legendW ? gap + legendW : 0) + 26
  const H = Math.max(marginT + gs.height, marginT + legendH) + 28

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = t.bg
  ctx.fillRect(0, 0, W, H)

  // Título
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = t.fg
  ctx.font = '600 20px system-ui, -apple-system, sans-serif'
  ctx.fillText(p.name || 'Patrón', marginL, 30)
  ctx.fillStyle = t.dim
  ctx.font = '400 12px system-ui, -apple-system, sans-serif'
  ctx.fillText(
    `${p.stitch === 'loom' ? 'Telar' : 'Peyote'} · ${p.width}×${p.height} · ${total} cuentas · ${legend.length} colores`,
    marginL,
    49,
  )

  // Rejilla
  const gx = marginL
  const gy = marginT
  ctx.drawImage(grid, gx, gy)

  // Números de columna (arriba)
  ctx.fillStyle = t.dim
  ctx.font = '500 11px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  const colStep = p.width > 30 ? 5 : p.width > 15 ? 2 : 1
  for (let c = 0; c < p.width; c++) {
    if (c !== 0 && c !== p.width - 1 && (c + 1) % colStep !== 0) continue
    const cx = gx + gridPad + (beadRect(p.stitch, 0, c).x + u.w / 2) * cellPx
    ctx.fillText(String(c + 1), cx, gy - 5)
  }

  // Números de fila (izquierda)
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  const rowStep = p.height > 60 ? 5 : p.height > 30 ? 2 : 1
  for (let r = 0; r < p.height; r++) {
    if (r !== 0 && r !== p.height - 1 && (r + 1) % rowStep !== 0) continue
    const cy = gy + gridPad + (beadRect(p.stitch, r, 0).y + u.h / 2) * cellPx
    ctx.fillText(String(r + 1), gx - 7, cy)
  }

  // Leyenda de colores
  if (legend.length) {
    const lx = gx + gs.width + gap
    let ly = gy + 6
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = t.fg
    ctx.font = '600 14px system-ui, -apple-system, sans-serif'
    ctx.fillText('Lista de colores', lx, ly)
    ly += 30
    for (const item of legend) {
      const sw = 20
      roundRect(ctx, lx, ly - sw / 2, sw, sw, 5)
      ctx.fillStyle = item.color?.hex ?? '#888888'
      ctx.fill()
      ctx.lineWidth = 1
      ctx.strokeStyle = t.line
      ctx.stroke()
      ctx.fillStyle = t.fg
      ctx.font = '600 12px system-ui, -apple-system, sans-serif'
      ctx.fillText(item.code, lx + sw + 10, ly - 5)
      ctx.fillStyle = t.dim
      ctx.font = '400 11px system-ui, -apple-system, sans-serif'
      ctx.fillText(`${truncate(item.color?.name ?? '', 22)} · ×${item.n}`, lx + sw + 10, ly + 8)
      ly += rowH
    }
  }

  return canvas
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

export function exportPNG(p: Pattern, cellPx = 26): void {
  const canvas = renderChart(p, cellPx)
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
