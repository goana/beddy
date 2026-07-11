import type { Motif } from '../data/motifs'
import type { Cell, Stitch } from './pattern'

export interface MotifResult {
  cells: Cell[]
  width: number
  height: number
  stitch: Stitch
  name: string
}

/** Convierte un motivo (rejilla de caracteres + leyenda) en celdas del patrón. */
export function motifToCells(m: Motif): MotifResult {
  const height = m.rows.length
  const width = m.rows[0]?.length ?? 0
  const cells: Cell[] = new Array(width * height).fill(null)
  for (let r = 0; r < height; r++) {
    const row = m.rows[r]
    for (let c = 0; c < width; c++) {
      const ch = row[c]
      cells[r * width + c] = ch === '.' ? m.background : m.legend[ch] ?? m.background
    }
  }
  return { cells, width, height, stitch: m.stitch, name: m.name }
}
