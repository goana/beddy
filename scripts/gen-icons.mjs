// Genera los iconos PNG de la app (sin dependencias, usando zlib de Node).
// Un cuadrado con el degradado de marca + un diamante de "cuentas" claras.
import zlib from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'public')

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const C0 = hex('#7c5cff'), C1 = hex('#d946ef'), C2 = hex('#22d3ee')
const lerp = (a, b, t) => a + (b - a) * t
function grad(t) {
  if (t < 0.5) { const u = t / 0.5; return [lerp(C0[0], C1[0], u), lerp(C0[1], C1[1], u), lerp(C0[2], C1[2], u)] }
  const u = (t - 0.5) / 0.5; return [lerp(C1[0], C2[0], u), lerp(C1[1], C2[1], u), lerp(C1[2], C2[2], u)]
}

const DIAMOND = [
  [0, 0, 1, 0, 0],
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 0, 0],
]

function makeIcon(size) {
  const W = size, H = size
  const buf = Buffer.alloc(W * H * 4)
  // Fondo: degradado diagonal a sangre
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = Math.min(1, Math.max(0, (x + y) / (W + H)))
    const [r, g, b] = grad(t)
    const o = (y * W + x) * 4
    buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = 255
  }
  // Cuentas (diamante) claras
  const n = 5
  const margin = size * 0.17
  const area = size - margin * 2
  const cell = area / n
  const rr = cell * 0.32
  const light = [247, 248, 255]
  for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < n; gx++) {
    if (!DIAMOND[gy][gx]) continue
    const x0 = margin + gx * cell + cell * 0.08
    const y0 = margin + gy * cell + cell * 0.08
    const w = cell * 0.84, h = cell * 0.84
    for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.floor(x0); x < x0 + w; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue
      const dx = Math.min(x - x0, x0 + w - 1 - x)
      const dy = Math.min(y - y0, y0 + h - 1 - y)
      if (dx < rr && dy < rr && (rr - dx) ** 2 + (rr - dy) ** 2 > rr * rr) continue
      const shade = 1.06 - ((y - y0) / h) * 0.22 // brillo arriba, sombra abajo
      const o = (y * W + x) * 4
      buf[o] = Math.min(255, light[0] * shade)
      buf[o + 1] = Math.min(255, light[1] * shade)
      buf[o + 2] = Math.min(255, light[2] * shade)
    }
  }
  return { W, H, buf }
}

// ---- Codificación PNG (RGBA, 8 bits) --------------------------------------
const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
  return t
})()
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const t = Buffer.from(type)
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}
function writePNG(file, W, H, rgba) {
  const raw = Buffer.alloc((W * 4 + 1) * H)
  for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; rgba.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4) }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
  fs.writeFileSync(file, png)
  console.log('✓', path.basename(file), `${W}×${H}`, (png.length / 1024).toFixed(1) + ' KB')
}

fs.mkdirSync(OUT, { recursive: true })
for (const size of [512, 192, 180]) {
  const { W, H, buf } = makeIcon(size)
  writePNG(path.join(OUT, `icon-${size}.png`), W, H, buf)
}
