export type Stitch = 'loom' | 'peyote'

// Una celda guarda el código Delica (p.ej. "DB-010") o null si está vacía.
export type Cell = string | null

export interface Pattern {
  id: string
  name: string
  stitch: Stitch
  width: number // nº de cuentas a lo ancho (columnas)
  height: number // nº de filas (largo de la pulsera)
  cells: Cell[] // longitud = width * height, orden fila por fila
  createdAt: number
  updatedAt: number
}

export const MIN_SIZE = 1
export const MAX_WIDTH = 60
export const MAX_HEIGHT = 400

export function idx(pattern: Pick<Pattern, 'width'>, row: number, col: number): number {
  return row * pattern.width + col
}

export function makeId(seed: number): string {
  return 'p' + seed.toString(36) + Math.floor(seed / 7).toString(36)
}

export function createPattern(opts: {
  name?: string
  stitch?: Stitch
  width?: number
  height?: number
  now: number
}): Pattern {
  const width = clamp(opts.width ?? 10, MIN_SIZE, MAX_WIDTH)
  const height = clamp(opts.height ?? 40, MIN_SIZE, MAX_HEIGHT)
  return {
    id: makeId(opts.now),
    name: opts.name ?? 'Pulsera sin título',
    stitch: opts.stitch ?? 'loom',
    width,
    height,
    cells: new Array(width * height).fill(null),
    createdAt: opts.now,
    updatedAt: opts.now,
  }
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** Redimensiona conservando las celdas que caben en la esquina superior izquierda. */
export function resizePattern(p: Pattern, width: number, height: number): Cell[] {
  const w = clamp(width, MIN_SIZE, MAX_WIDTH)
  const h = clamp(height, MIN_SIZE, MAX_HEIGHT)
  const next: Cell[] = new Array(w * h).fill(null)
  for (let row = 0; row < Math.min(h, p.height); row++) {
    for (let col = 0; col < Math.min(w, p.width); col++) {
      next[row * w + col] = p.cells[row * p.width + col]
    }
  }
  return next
}

// --- Geometría de dibujo ------------------------------------------------

export interface BeadRect { x: number; y: number; w: number; h: number }

// Proporciones de una Delica 11/0 (aprox.). En telar la cuenta va tumbada
// (más ancha que alta); en peyote va de pie (más alta que ancha).
export const LOOM_BEAD = { w: 1.0, h: 0.82 }
export const PEYOTE_BEAD = { w: 0.82, h: 1.0 }

export function beadUnit(stitch: Stitch) {
  return stitch === 'loom' ? LOOM_BEAD : PEYOTE_BEAD
}

/** Rectángulo de una cuenta en unidades de rejilla (multiplica luego por el tamaño de celda). */
export function beadRect(stitch: Stitch, row: number, col: number): BeadRect {
  const u = beadUnit(stitch)
  if (stitch === 'loom') {
    return { x: col * u.w, y: row * u.h, w: u.w, h: u.h }
  }
  // Peyote: las columnas impares se desplazan media cuenta hacia abajo.
  const offset = col % 2 === 1 ? u.h / 2 : 0
  return { x: col * u.w, y: row * u.h + offset, w: u.w, h: u.h }
}

/** Dimensiones totales del lienzo (en unidades de rejilla) para un patrón. */
export function patternExtent(stitch: Stitch, width: number, height: number): { w: number; h: number } {
  const u = beadUnit(stitch)
  const extraCol = stitch === 'peyote' && width > 1 ? u.h / 2 : 0
  return { w: width * u.w, h: height * u.h + extraCol }
}
