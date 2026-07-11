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
