import { delicaByCode, hexToRgb } from './color'
import { beadRect, beadUnit, patternExtent, type Pattern } from './pattern'

export interface RenderOpts {
  cellPx: number
  pad: number
  hover?: { row: number; col: number } | null
  background?: string
  light?: boolean // tema claro para las cuentas vacías
}

interface EmptyStyle { top: string; bottom: string; stroke: string; hover: string }
const EMPTY_DARK: EmptyStyle = { top: '#333a4f', bottom: '#2a3042', stroke: 'rgba(255,255,255,0.14)', hover: 'rgba(255,255,255,0.9)' }
const EMPTY_LIGHT: EmptyStyle = { top: '#eef0f6', bottom: '#dcdfe9', stroke: 'rgba(20,24,40,0.16)', hover: 'rgba(20,24,40,0.75)' }

export function canvasSize(p: Pattern, cellPx: number, pad: number) {
  const extent = patternExtent(p.stitch, p.width, p.height)
  return {
    width: Math.ceil(extent.w * cellPx) + pad * 2,
    height: Math.ceil(extent.h * cellPx) + pad * 2,
  }
}

export function drawPattern(ctx: CanvasRenderingContext2D, p: Pattern, opts: RenderOpts) {
  const { cellPx, pad } = opts
  const size = canvasSize(p, cellPx, pad)
  if (opts.background) {
    ctx.fillStyle = opts.background
    ctx.fillRect(0, 0, size.width, size.height)
  } else {
    ctx.clearRect(0, 0, size.width, size.height)
  }

  const empty = opts.light ? EMPTY_LIGHT : EMPTY_DARK
  for (let row = 0; row < p.height; row++) {
    for (let col = 0; col < p.width; col++) {
      const code = p.cells[row * p.width + col]
      const r = beadRect(p.stitch, row, col)
      const x = pad + r.x * cellPx
      const y = pad + r.y * cellPx
      const w = r.w * cellPx
      const h = r.h * cellPx
      const isHover = opts.hover && opts.hover.row === row && opts.hover.col === col
      drawBead(ctx, x, y, w, h, code, !!isHover, empty)
    }
  }
}

function drawBead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  code: string | null,
  hover: boolean,
  empty: EmptyStyle,
) {
  const gap = Math.max(1, Math.min(w, h) * 0.07)
  const radius = Math.min(w, h) * 0.3
  const bx = x + gap
  const by = y + gap
  const bw = w - gap * 2
  const bh = h - gap * 2
  roundRect(ctx, bx, by, bw, bh, radius)

  if (!code) {
    const eg = ctx.createLinearGradient(bx, by, bx, by + bh)
    eg.addColorStop(0, empty.top)
    eg.addColorStop(1, empty.bottom)
    ctx.fillStyle = eg
    ctx.fill()
    ctx.lineWidth = 1.25
    ctx.strokeStyle = empty.stroke
    ctx.stroke()
  } else {
    const hex = delicaByCode(code)?.hex ?? empty.bottom
    const { r: cr, g: cg, b: cb } = hexToRgb(hex)
    const grad = ctx.createLinearGradient(bx, by, bx, by + bh)
    grad.addColorStop(0, rgb(cr + 34, cg + 34, cb + 34))
    grad.addColorStop(0.45, hex)
    grad.addColorStop(1, rgb(cr - 30, cg - 30, cb - 30))
    ctx.fillStyle = grad
    ctx.fill()
    // brillo especular
    ctx.save()
    roundRect(ctx, bx, by, bw, bh, radius)
    ctx.clip()
    const gl = ctx.createLinearGradient(bx, by, bx, by + bh * 0.5)
    gl.addColorStop(0, 'rgba(255,255,255,0.28)')
    gl.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gl
    ctx.fillRect(bx, by, bw, bh * 0.5)
    ctx.restore()
  }

  if (hover) {
    roundRect(ctx, bx, by, bw, bh, radius)
    ctx.lineWidth = 2
    ctx.strokeStyle = empty.hover
    ctx.stroke()
  }
}

function rgb(r: number, g: number, b: number) {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return `rgb(${c(r)},${c(g)},${c(b)})`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/**
 * Dibuja los números de fila/columna y guías de rejilla alrededor del patrón.
 * El contexto ya debe estar escalado (dpr) y sin trasladar; se usan offX/offY
 * como márgenes izquierdo/superior donde caben los números.
 */
export function drawGuides(
  ctx: CanvasRenderingContext2D,
  p: Pattern,
  opts: { cellPx: number; offX: number; offY: number; gridPad: number; light: boolean },
) {
  const { cellPx, offX, offY, gridPad, light } = opts
  const u = beadUnit(p.stitch)
  const dim = light ? '#5a6074' : '#9aa0b4'
  const line = light ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.09)'
  const line5 = light ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.22)'
  const ex = patternExtent(p.stitch, p.width, p.height)
  const x0 = offX + gridPad
  const y0 = offY + gridPad
  const gW = ex.w * cellPx
  const gH = ex.h * cellPx

  // Guías cada 5 (solo telar; en peyote las filas van escalonadas)
  if (p.stitch === 'loom') {
    ctx.lineWidth = 1
    for (let c = 0; c <= p.width; c++) {
      if (c % 5 !== 0) continue
      const x = Math.round(x0 + c * u.w * cellPx) + 0.5
      ctx.strokeStyle = c % 10 === 0 ? line5 : line
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + gH); ctx.stroke()
    }
    for (let r = 0; r <= p.height; r++) {
      if (r % 5 !== 0) continue
      const y = Math.round(y0 + r * u.h * cellPx) + 0.5
      ctx.strokeStyle = r % 10 === 0 ? line5 : line
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + gW, y); ctx.stroke()
    }
  }

  // Números
  ctx.fillStyle = dim
  const fs = Math.max(8, Math.min(12, Math.round(cellPx * 0.44)))
  ctx.font = `600 ${fs}px system-ui, -apple-system, sans-serif`
  const colStep = p.width <= 15 ? 1 : p.width <= 40 ? 5 : 10
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
  for (let c = 0; c < p.width; c++) {
    if (c !== 0 && c !== p.width - 1 && (c + 1) % colStep !== 0) continue
    ctx.fillText(String(c + 1), x0 + (c + 0.5) * u.w * cellPx, offY - 3)
  }
  const rowStep = p.height <= 15 ? 1 : p.height <= 40 ? 5 : 10
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
  for (let r = 0; r < p.height; r++) {
    if (r !== 0 && r !== p.height - 1 && (r + 1) % rowStep !== 0) continue
    ctx.fillText(String(r + 1), offX - 4, y0 + (r + 0.5) * u.h * cellPx)
  }
}

/**
 * Seguimiento de tejido: atenúa las filas ya hechas (0..currentRow-1) y
 * resalta la fila actual. Se dibuja en coordenadas de rejilla (dentro del
 * translate del patrón), después de las cuentas.
 */
export function drawTracker(
  ctx: CanvasRenderingContext2D,
  p: Pattern,
  opts: { cellPx: number; gridPad: number; currentRow: number; light: boolean },
) {
  const { cellPx, gridPad, currentRow, light } = opts
  const u = beadUnit(p.stitch)
  const rowH = u.h * cellPx
  const w = patternExtent(p.stitch, p.width, p.height).w * cellPx
  const clamped = Math.max(0, Math.min(currentRow, p.height - 1))

  // Filas hechas: velo del color del fondo (parecen "tachadas"/apagadas)
  if (clamped > 0) {
    ctx.fillStyle = light ? 'rgba(247,248,252,0.68)' : 'rgba(13,15,22,0.66)'
    ctx.fillRect(gridPad, gridPad, w, clamped * rowH)
  }

  // Fila actual: banda y borde de acento
  const y = gridPad + clamped * rowH
  ctx.fillStyle = 'rgba(124,92,255,0.18)'
  ctx.fillRect(gridPad, y, w, rowH)
  ctx.lineWidth = 2.5
  ctx.strokeStyle = '#7c5cff'
  ctx.strokeRect(gridPad + 1.25, y + 1.25, w - 2.5, rowH - 2.5)
}

/** Convierte coordenadas de píxel del canvas a (row, col) de la rejilla, o null. */
export function hitTest(
  p: Pattern,
  px: number,
  py: number,
  cellPx: number,
  pad: number,
): { row: number; col: number } | null {
  const u = beadUnit(p.stitch)
  const lx = px - pad
  const ly = py - pad
  if (lx < 0 || ly < 0) return null
  const col = Math.floor(lx / (u.w * cellPx))
  if (col < 0 || col >= p.width) return null
  const offset = p.stitch === 'peyote' && col % 2 === 1 ? (u.h / 2) * cellPx : 0
  const row = Math.floor((ly - offset) / (u.h * cellPx))
  if (row < 0 || row >= p.height) return null
  return { row, col }
}
