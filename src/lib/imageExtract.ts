import { nearestDelica, nearestDelicaLab, rgbToLab, type Lab } from './color'
import { beadUnit, clamp, MAX_HEIGHT, type Cell, type Stitch } from './pattern'

/** Carga un File como HTMLImageElement. */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

/**
 * Sugiere una altura (nº de filas) para que las proporciones físicas del
 * patrón coincidan con las de la imagen, dado un ancho en cuentas.
 */
export function suggestHeight(img: HTMLImageElement, width: number, stitch: Stitch): number {
  const u = beadUnit(stitch)
  const aspect = img.naturalWidth / img.naturalHeight
  // patternAspect = (width * u.w) / (height * u.h) debe igualar aspect
  const height = Math.round((width * u.w) / (u.h * aspect))
  return clamp(height, 1, MAX_HEIGHT)
}

export interface ExtractOptions {
  /** Deja vacías (null) las zonas transparentes de la imagen. */
  keepTransparent?: boolean
  /** Contraste 0.5–2 aplicado antes del muestreo. 1 = sin cambios. */
  contrast?: number
  /** Saturación 0–2 aplicada antes del muestreo. 1 = sin cambios. */
  saturation?: number
  /** Brillo 0.5–1.5. 1 = sin cambios. */
  brightness?: number
  /** Auto-niveles + iluminación adaptativa de sombras (recomendado). */
  autoLevels?: boolean
  /** Fuerza de la iluminación 0–1 (0 = solo estira niveles; 1 = ilumina mucho). */
  lightBoost?: number
  /** Nº máximo de colores del patrón (cuantización). Sin definir = sin límite. */
  maxColors?: number
  /** Modo ilustración: aplana colores y añade contornos oscuros (aspecto de dibujo). */
  illustration?: boolean
  /** Fuerza del contorno 0–1 en modo ilustración (cuántos bordes se marcan). */
  outline?: number
}

const OUTLINE_CODE = 'DB-10' // negro para los contornos

/**
 * Convierte una imagen en celdas de patrón (width x height), mapeando cada
 * celda al color Delica más cercano. La reducción de tamaño la hace el
 * navegador promediando píxeles (imageSmoothing activado).
 */
export function extractCells(
  img: HTMLImageElement,
  width: number,
  height: number,
  opts: ExtractOptions = {},
): Cell[] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.filter = buildFilter(opts)
  ctx.drawImage(img, 0, 0, width, height)

  const data = ctx.getImageData(0, 0, width, height).data

  // Mejora automática: auto-niveles + iluminación de sombras + saturación.
  if (opts.autoLevels !== false) {
    enhance(data, opts.lightBoost ?? 0.5)
  }

  // Bordes para el modo ilustración (se calculan sobre la imagen ya realzada)
  const edges = opts.illustration ? sobel(data, width, height) : null

  // Con límite de colores -> cuantización k-means; sin límite -> Delica más cercano por celda.
  let cells: Cell[]
  if (opts.maxColors && opts.maxColors >= 2) {
    cells = quantizeToDelica(data, width, height, opts.maxColors, !!opts.keepTransparent)
  } else {
    cells = new Array(width * height).fill(null)
    for (let i = 0; i < width * height; i++) {
      const o = i * 4
      if (opts.keepTransparent && data[o + 3] < 128) continue
      cells[i] = nearestDelica({ r: data[o], g: data[o + 1], b: data[o + 2] }).code
    }
  }

  // Contornos: marca en negro las celdas con borde fuerte.
  if (edges) {
    const strength = opts.outline ?? 0.55
    const thr = edgeThreshold(edges, strength)
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] !== null && edges[i] >= thr) cells[i] = OUTLINE_CODE
    }
  }
  return cells
}

/** Magnitud de gradiente (Sobel) sobre la luminancia. Devuelve un valor por celda. */
function sobel(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const lum = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const o = i * 4
    lum[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]
  }
  const mag = new Float32Array(w * h)
  const at = (x: number, y: number) => lum[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx =
        -at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1) +
        at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)
      const gy =
        -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) +
        at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)
      mag[y * w + x] = Math.sqrt(gx * gx + gy * gy)
    }
  }
  return mag
}

/** Umbral por percentil: `strength` alto = más celdas se convierten en contorno. */
function edgeThreshold(mag: Float32Array, strength: number): number {
  const fraction = 0.03 + strength * 0.32 // 3%–35% de las celdas
  const sorted = Array.from(mag).sort((a, b) => a - b)
  const idx = Math.floor((1 - fraction) * (sorted.length - 1))
  return Math.max(24, sorted[idx]) // evita marcar ruido en imágenes planas
}

/**
 * Reduce la imagen a como mucho `k` colores agrupando en espacio Lab (k-means)
 * y convirtiendo cada grupo a un único color Delica. Resultado determinista.
 */
function quantizeToDelica(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  k: number,
  keepTransparent: boolean,
): Cell[] {
  const cells: Cell[] = new Array(width * height).fill(null)
  const cellIndex: number[] = []
  const points: Lab[] = []
  for (let i = 0; i < width * height; i++) {
    const o = i * 4
    if (keepTransparent && data[o + 3] < 128) continue
    points.push(rgbToLab({ r: data[o], g: data[o + 1], b: data[o + 2] }))
    cellIndex.push(i)
  }
  if (points.length === 0) return cells

  const { centroids, assign } = kmeans(points, k)
  const codes = centroids.map((c) => nearestDelicaLab(c).code)
  for (let j = 0; j < cellIndex.length; j++) {
    cells[cellIndex[j]] = codes[assign[j]]
  }
  return cells
}

function labD(a: Lab, b: Lab): number {
  const dL = a.L - b.L
  const da = a.a - b.a
  const db = a.b - b.b
  return dL * dL + da * da + db * db
}

// RNG determinista (mulberry32) para que "Generar" dé siempre el mismo patrón.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function kmeans(points: Lab[], k: number): { centroids: Lab[]; assign: number[] } {
  const n = points.length
  k = Math.min(k, n)
  const rng = mulberry32(0x9e3779b1)

  // Inicialización k-means++
  const centroids: Lab[] = [{ ...points[Math.floor(rng() * n)] }]
  const d2 = new Array(n).fill(Infinity)
  for (let c = 1; c < k; c++) {
    let total = 0
    for (let i = 0; i < n; i++) {
      const dd = labD(points[i], centroids[c - 1])
      if (dd < d2[i]) d2[i] = dd
      total += d2[i]
    }
    let r = rng() * total
    let idx = 0
    while (idx < n - 1 && (r -= d2[idx]) > 0) idx++
    centroids.push({ ...points[idx] })
  }

  const assign = new Array(n).fill(0)
  for (let iter = 0; iter < 16; iter++) {
    let moved = false
    for (let i = 0; i < n; i++) {
      let best = 0
      let bd = Infinity
      for (let c = 0; c < centroids.length; c++) {
        const dd = labD(points[i], centroids[c])
        if (dd < bd) { bd = dd; best = c }
      }
      if (assign[i] !== best) { assign[i] = best; moved = true }
    }
    // Recalcular centroides
    const sL = new Array(centroids.length).fill(0)
    const sA = new Array(centroids.length).fill(0)
    const sB = new Array(centroids.length).fill(0)
    const cnt = new Array(centroids.length).fill(0)
    for (let i = 0; i < n; i++) {
      const c = assign[i]
      sL[c] += points[i].L; sA[c] += points[i].a; sB[c] += points[i].b; cnt[c]++
    }
    for (let c = 0; c < centroids.length; c++) {
      if (cnt[c] > 0) centroids[c] = { L: sL[c] / cnt[c], a: sA[c] / cnt[c], b: sB[c] / cnt[c] }
    }
    if (!moved && iter > 0) break
  }
  return { centroids, assign }
}

/**
 * Realza la imagen in situ para que el patrón salga luminoso y con color:
 * 1) auto-niveles (estira el histograma entre percentiles),
 * 2) levantado adaptativo de sombras (más fuerte cuanto más oscura sea),
 * 3) refuerzo de saturación.
 */
function enhance(data: Uint8ClampedArray, lightBoost: number) {
  const n = data.length / 4
  const hist = new Array(256).fill(0)
  let count = 0
  let sum = 0
  for (let i = 0; i < n; i++) {
    const o = i * 4
    if (data[o + 3] < 8) continue
    const l = Math.round(0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2])
    hist[l]++
    sum += l
    count++
  }
  if (count === 0) return

  // Percentiles para el estirado (recorta 0.6% en cada extremo)
  const loT = count * 0.006
  const hiT = count * 0.994
  let acc = 0
  let lo = 0
  let hi = 255
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= loT) { lo = v; break } }
  acc = 0
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= hiT) { hi = v; break } }
  if (hi - lo < 8) { lo = 0; hi = 255 } // imagen ya plana: no estirar en exceso
  const scale = 255 / (hi - lo)

  // Brillo medio tras el estirado -> gamma adaptativa (solo aclara)
  const mean = sum / count
  const stretchedMean = clampByte((mean - lo) * scale)
  const target = 150 + lightBoost * 40 // objetivo de luminosidad (150–190)
  let gamma = 1
  if (stretchedMean > 4 && stretchedMean < 251) {
    gamma = Math.log(target / 255) / Math.log(stretchedMean / 255)
    gamma = Math.max(0.45, Math.min(1, gamma)) // gamma<1 aclara; nunca oscurece
  }

  // LUT: estirado + gamma
  const lut = new Uint8ClampedArray(256)
  for (let v = 0; v < 256; v++) {
    const s = clampByte((v - lo) * scale)
    lut[v] = clampByte(255 * Math.pow(s / 255, gamma))
  }

  const sat = 1.18 // refuerzo de saturación
  for (let i = 0; i < n; i++) {
    const o = i * 4
    const r = lut[data[o]]
    const g = lut[data[o + 1]]
    const b = lut[data[o + 2]]
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    data[o] = clampByte(gray + (r - gray) * sat)
    data[o + 1] = clampByte(gray + (g - gray) * sat)
    data[o + 2] = clampByte(gray + (b - gray) * sat)
  }
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

function buildFilter(opts: ExtractOptions): string {
  const parts: string[] = []
  if (opts.contrast != null && opts.contrast !== 1) parts.push(`contrast(${opts.contrast})`)
  if (opts.saturation != null && opts.saturation !== 1) parts.push(`saturate(${opts.saturation})`)
  if (opts.brightness != null && opts.brightness !== 1) parts.push(`brightness(${opts.brightness})`)
  return parts.length ? parts.join(' ') : 'none'
}
