import { DELICA_COLORS, type DelicaColor } from '../data/delica'

export interface RGB { r: number; g: number; b: number }
export interface Lab { L: number; a: number; b: number }

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  const n = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h
  const int = parseInt(n, 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

function srgbToLinear(c: number): number {
  const cs = c / 255
  return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
}

export function rgbToLab({ r, g, b }: RGB): Lab {
  const rl = srgbToLinear(r)
  const gl = srgbToLinear(g)
  const bl = srgbToLinear(b)
  // sRGB -> XYZ (D65)
  let x = rl * 0.4124 + gl * 0.3576 + bl * 0.1805
  let y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722
  let z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505
  // Normalizar por blanco de referencia D65
  x /= 0.95047; y /= 1.0; z /= 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const fx = f(x); const fy = f(y); const fz = f(z)
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

export function labDistance(a: Lab, b: Lab): number {
  const dL = a.L - b.L
  const da = a.a - b.a
  const db = a.b - b.b
  return dL * dL + da * da + db * db
}

// Cache de los Lab de la paleta Delica
const DELICA_LAB: { color: DelicaColor; lab: Lab }[] = DELICA_COLORS.map((color) => ({
  color,
  lab: rgbToLab(hexToRgb(color.hex)),
}))

/** Devuelve el color Delica más cercano a un color Lab dado. */
export function nearestDelicaLab(target: Lab): DelicaColor {
  let best = DELICA_LAB[0]
  let bestDist = Infinity
  for (const entry of DELICA_LAB) {
    const d = labDistance(target, entry.lab)
    if (d < bestDist) {
      bestDist = d
      best = entry
    }
  }
  return best.color
}

/** Devuelve el color Delica más cercano a un RGB dado. */
export function nearestDelica(rgb: RGB): DelicaColor {
  return nearestDelicaLab(rgbToLab(rgb))
}

/** Busca un color Delica por su código. */
export function delicaByCode(code: string): DelicaColor | undefined {
  return DELICA_COLORS.find((c) => c.code === code)
}
