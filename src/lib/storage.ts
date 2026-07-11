import type { Pattern } from './pattern'

const KEY = 'beddy.patterns.v1'

export interface SavedMeta {
  id: string
  name: string
  updatedAt: number
  stitch: Pattern['stitch']
  width: number
  height: number
}

function readAll(): Record<string, Pattern> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, Pattern>) : {}
  } catch {
    return {}
  }
}

function writeAll(map: Record<string, Pattern>): void {
  localStorage.setItem(KEY, JSON.stringify(map))
}

export function savePattern(p: Pattern): void {
  const map = readAll()
  map[p.id] = p
  writeAll(map)
}

export function deletePattern(id: string): void {
  const map = readAll()
  delete map[id]
  writeAll(map)
}

export function getPattern(id: string): Pattern | undefined {
  return readAll()[id]
}

export function listPatterns(): SavedMeta[] {
  return Object.values(readAll())
    .map((p) => ({
      id: p.id,
      name: p.name,
      updatedAt: p.updatedAt,
      stitch: p.stitch,
      width: p.width,
      height: p.height,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function exportJSON(p: Pattern): void {
  download(`${slug(p.name)}.beddy.json`, JSON.stringify(p, null, 2), 'application/json')
}

export function importJSON(file: File): Promise<Pattern> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const p = JSON.parse(String(reader.result)) as Pattern
        if (!p.cells || !p.width || !p.height) throw new Error('Formato no válido')
        resolve(p)
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'patron'
  )
}
