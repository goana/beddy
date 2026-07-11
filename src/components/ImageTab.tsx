import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { extractCells, loadImage, suggestHeight } from '../lib/imageExtract'
import { MAX_WIDTH } from '../lib/pattern'

export default function ImageTab({ onDone }: { onDone: (msg: string) => void }) {
  const pattern = useStore((s) => s.pattern)
  const setCells = useStore((s) => s.setCells)
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string>()

  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [width, setWidth] = useState(pattern.width)
  const [keepAspect, setKeepAspect] = useState(true)
  const [height, setHeight] = useState(pattern.height)
  const [contrast, setContrast] = useState(1)
  const [saturation, setSaturation] = useState(1.1)
  const [autoLevels, setAutoLevels] = useState(true)
  const [lightBoost, setLightBoost] = useState(0.5)
  const [limitColors, setLimitColors] = useState(true)
  const [numColors, setNumColors] = useState(6)
  const [illustration, setIllustration] = useState(false)
  const [outline, setOutline] = useState(0.55)
  const [over, setOver] = useState(false)

  // Libera el object URL de la vista previa al desmontar
  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current) }, [])

  async function handleFile(file: File) {
    const image = await loadImage(file)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setImg(image)
    setPreview(url)
    const w = Math.min(width, MAX_WIDTH)
    setWidth(w)
    setHeight(suggestHeight(image, w, pattern.stitch))
  }

  function onWidthChange(w: number) {
    setWidth(w)
    if (keepAspect && img) setHeight(suggestHeight(img, w, pattern.stitch))
  }

  function apply() {
    if (!img) return
    const cells = extractCells(img, width, height, {
      contrast,
      saturation,
      brightness: 1,
      autoLevels,
      lightBoost,
      maxColors: limitColors ? numColors : undefined,
      illustration,
      outline,
    })
    setCells(cells, width, height)
    onDone(illustration ? 'Ilustración generada 🎨' : limitColors ? `Patrón extraído · ${numColors} colores ✨` : 'Patrón extraído de la imagen ✨')
  }

  return (
    <div>
      <div className="section-title">Imagen → patrón</div>

      {!img ? (
        <div
          className={`dropzone ${over ? 'over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setOver(false)
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }}
        >
          <div className="big">🖼️</div>
          <div>Arrastra una imagen aquí<br />o haz clic para elegir</div>
        </div>
      ) : (
        <>
          <img className="preview-img" src={preview} alt="referencia" />
          <button className="btn ghost" style={{ width: '100%', marginBottom: 16 }} onClick={() => inputRef.current?.click()}>
            Cambiar imagen
          </button>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {img && (
        <>
          <div className="field">
            <label>Estilo</label>
            <div className="seg" style={{ width: '100%' }}>
              <button style={{ flex: 1 }} className={!illustration ? 'active' : ''} onClick={() => setIllustration(false)}>📷 Foto</button>
              <button style={{ flex: 1 }} className={illustration ? 'active' : ''} onClick={() => setIllustration(true)}>🎨 Ilustración</button>
            </div>
          </div>

          {illustration && (
            <div className="field">
              <label>Contorno {outline < 0.34 ? '· fino' : outline > 0.66 ? '· marcado' : '· medio'}</label>
              <div className="range-row">
                <input type="range" min={0} max={1} step={0.05} value={outline} onChange={(e) => setOutline(+e.target.value)} />
                <span className="val">{Math.round(outline * 100)}%</span>
              </div>
            </div>
          )}

          <div className="field">
            <label>Ancho (cuentas): {width}</label>
            <div className="range-row">
              <input type="range" min={2} max={MAX_WIDTH} value={width} onChange={(e) => onWidthChange(+e.target.value)} />
              <span className="val">{width}</span>
            </div>
          </div>

          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={keepAspect}
                onChange={(e) => { setKeepAspect(e.target.checked); if (e.target.checked && img) setHeight(suggestHeight(img, width, pattern.stitch)) }}
                style={{ marginRight: 6 }}
              />
              Mantener proporción
            </label>
          </div>

          <div className="field">
            <label>Alto (filas): {height}</label>
            <div className="range-row">
              <input type="range" min={2} max={400} value={height} disabled={keepAspect} onChange={(e) => setHeight(+e.target.value)} />
              <span className="val">{height}</span>
            </div>
          </div>

          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={autoLevels}
                onChange={(e) => setAutoLevels(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Iluminar y realzar (auto)
            </label>
          </div>

          {autoLevels && (
            <div className="field">
              <label>Luz {lightBoost < 0.34 ? '· suave' : lightBoost > 0.66 ? '· intensa' : '· media'}</label>
              <div className="range-row">
                <input type="range" min={0} max={1} step={0.05} value={lightBoost} onChange={(e) => setLightBoost(+e.target.value)} />
                <span className="val">{Math.round(lightBoost * 100)}%</span>
              </div>
            </div>
          )}

          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={limitColors}
                onChange={(e) => setLimitColors(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Simplificar nº de colores
            </label>
          </div>

          {limitColors && (
            <div className="field">
              <label>Colores del patrón: {numColors}</label>
              <div className="range-row">
                <input type="range" min={2} max={16} step={1} value={numColors} onChange={(e) => setNumColors(+e.target.value)} />
                <span className="val">{numColors}</span>
              </div>
            </div>
          )}

          <div className="field">
            <label>Contraste</label>
            <div className="range-row">
              <input type="range" min={0.5} max={2} step={0.05} value={contrast} onChange={(e) => setContrast(+e.target.value)} />
              <span className="val">{contrast.toFixed(2)}</span>
            </div>
          </div>

          <div className="field">
            <label>Saturación</label>
            <div className="range-row">
              <input type="range" min={0} max={2} step={0.05} value={saturation} onChange={(e) => setSaturation(+e.target.value)} />
              <span className="val">{saturation.toFixed(2)}</span>
            </div>
          </div>

          <button className="btn primary" style={{ width: '100%' }} onClick={apply}>
            Generar patrón ({width}×{height}{limitColors ? ` · ${numColors} colores` : ''})
          </button>
          <div className="hint-note">
            El realce automático ilumina las zonas oscuras y aviva el color. «Simplificar» agrupa la imagen en el nº de colores que elijas (con k-means) y convierte cada grupo a un único Delica — ideal para que el patrón sea tejible y la lista de compra corta. Súbelo si quieres más detalle, bájalo para simplificar.
          </div>
        </>
      )}
    </div>
  )
}
