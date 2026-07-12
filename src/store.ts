import { create } from 'zustand'
import {
  createPattern,
  resizePattern,
  clamp,
  makeId,
  MIN_SIZE,
  MAX_WIDTH,
  MAX_HEIGHT,
  type Cell,
  type Pattern,
  type Stitch,
} from './lib/pattern'

export type Tool = 'paint' | 'erase' | 'fill' | 'eyedropper'

let idSeq = 0 // asegura ids únicos aunque se generen muy seguidos

interface Snapshot {
  cells: Cell[]
  width: number
  height: number
  stitch: Stitch
}

interface AppState {
  pattern: Pattern
  color: string // código Delica seleccionado
  tool: Tool
  rev: number // se incrementa en cada cambio de celdas (para redibujar el canvas)
  recentColors: string[]
  past: Snapshot[]
  future: Snapshot[]

  setColor: (code: string) => void
  setTool: (tool: Tool) => void
  setName: (name: string) => void
  setStitch: (stitch: Stitch) => void
  setSize: (width: number, height: number) => void

  beginStroke: () => void // guarda un punto de deshacer antes de pintar
  applyAt: (row: number, col: number) => void // aplica la herramienta actual
  fillAt: (row: number, col: number) => void
  pickAt: (row: number, col: number) => void

  setCells: (cells: Cell[], width: number, height: number, stitch?: Stitch) => void
  newPattern: (stitch: Stitch) => void
  loadPattern: (p: Pattern) => void
  clearAll: () => void

  undo: () => void
  redo: () => void
}

const now = () => performance.now() + 1_700_000_000_000

function snapshot(p: Pattern): Snapshot {
  return { cells: p.cells.slice(), width: p.width, height: p.height, stitch: p.stitch }
}

function pushRecent(list: string[], code: string): string[] {
  const next = [code, ...list.filter((c) => c !== code)]
  return next.slice(0, 12)
}

export const useStore = create<AppState>((set, get) => ({
  pattern: createPattern({ now: now(), stitch: 'loom', width: 10, height: 40 }),
  color: 'DB-726',
  tool: 'paint',
  rev: 0,
  recentColors: ['DB-726', 'DB-10', 'DB-200'],
  past: [],
  future: [],

  setColor: (code) =>
    set((s) => ({ color: code, recentColors: pushRecent(s.recentColors, code) })),
  setTool: (tool) => set({ tool }),
  setName: (name) => set((s) => ({ pattern: { ...s.pattern, name, updatedAt: now() } })),

  setStitch: (stitch) =>
    set((s) => ({
      past: [...s.past, snapshot(s.pattern)],
      future: [],
      pattern: { ...s.pattern, stitch, updatedAt: now() },
      rev: s.rev + 1,
    })),

  setSize: (width, height) =>
    set((s) => {
      const w = clamp(Math.round(width), MIN_SIZE, MAX_WIDTH)
      const h = clamp(Math.round(height), MIN_SIZE, MAX_HEIGHT)
      if (w === s.pattern.width && h === s.pattern.height) return s
      const cells = resizePattern(s.pattern, w, h)
      return {
        past: [...s.past, snapshot(s.pattern)],
        future: [],
        pattern: { ...s.pattern, width: w, height: h, cells, updatedAt: now() },
        rev: s.rev + 1,
      }
    }),

  beginStroke: () =>
    set((s) => ({ past: [...s.past, snapshot(s.pattern)].slice(-60), future: [] })),

  applyAt: (row, col) => {
    const s = get()
    const p = s.pattern
    if (row < 0 || col < 0 || row >= p.height || col >= p.width) return
    const i = row * p.width + col
    const value = s.tool === 'erase' ? null : s.color
    if (s.tool === 'eyedropper') {
      s.pickAt(row, col)
      return
    }
    if (s.tool === 'fill') {
      s.fillAt(row, col)
      return
    }
    if (p.cells[i] === value) return
    p.cells[i] = value // mutación in situ por rendimiento durante el trazo
    p.updatedAt = now()
    set({ rev: s.rev + 1 })
  },

  fillAt: (row, col) => {
    const s = get()
    const p = s.pattern
    if (row < 0 || col < 0 || row >= p.height || col >= p.width) return
    const target = p.cells[row * p.width + col]
    const replacement = s.tool === 'erase' ? null : s.color
    if (target === replacement) return
    // Flood fill 4-conexo
    const stack: [number, number][] = [[row, col]]
    while (stack.length) {
      const [r, c] = stack.pop()!
      if (r < 0 || c < 0 || r >= p.height || c >= p.width) continue
      const i = r * p.width + c
      if (p.cells[i] !== target) continue
      p.cells[i] = replacement
      stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1])
    }
    p.updatedAt = now()
    set({ rev: s.rev + 1 })
  },

  pickAt: (row, col) => {
    const s = get()
    const p = s.pattern
    const code = p.cells[row * p.width + col]
    if (code) set({ color: code, tool: 'paint', recentColors: pushRecent(s.recentColors, code) })
  },

  setCells: (cells, width, height, stitch) =>
    set((s) => ({
      past: [...s.past, snapshot(s.pattern)],
      future: [],
      // Reemplazar el lienzo (imagen/motivo) = diseño nuevo -> id nuevo,
      // para que al guardar sea una entrada distinta y no sobrescriba.
      pattern: {
        ...s.pattern,
        id: makeId(now() + ++idSeq),
        width,
        height,
        stitch: stitch ?? s.pattern.stitch,
        cells,
        updatedAt: now(),
      },
      rev: s.rev + 1,
    })),

  newPattern: (stitch) =>
    set((s) => ({
      pattern: createPattern({ now: now(), stitch }),
      past: [...s.past, snapshot(s.pattern)],
      future: [],
      rev: s.rev + 1,
    })),

  loadPattern: (p) => set({ pattern: p, past: [], future: [], rev: get().rev + 1 }),

  clearAll: () =>
    set((s) => {
      const cells = new Array(s.pattern.width * s.pattern.height).fill(null)
      return {
        past: [...s.past, snapshot(s.pattern)],
        future: [],
        pattern: { ...s.pattern, cells, updatedAt: now() },
        rev: s.rev + 1,
      }
    }),

  undo: () =>
    set((s) => {
      const prev = s.past[s.past.length - 1]
      if (!prev) return s
      return {
        past: s.past.slice(0, -1),
        future: [snapshot(s.pattern), ...s.future].slice(0, 60),
        pattern: {
          ...s.pattern,
          cells: prev.cells,
          width: prev.width,
          height: prev.height,
          stitch: prev.stitch,
          updatedAt: now(),
        },
        rev: s.rev + 1,
      }
    }),

  redo: () =>
    set((s) => {
      const next = s.future[0]
      if (!next) return s
      return {
        past: [...s.past, snapshot(s.pattern)],
        future: s.future.slice(1),
        pattern: {
          ...s.pattern,
          cells: next.cells,
          width: next.width,
          height: next.height,
          stitch: next.stitch,
          updatedAt: now(),
        },
        rev: s.rev + 1,
      }
    }),
}))
