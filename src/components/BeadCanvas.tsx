import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { canvasSize, drawPattern, hitTest } from '../lib/render'

interface Props {
  cellPx: number
  light: boolean
}

export default function BeadCanvas({ cellPx, light }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pattern = useStore((s) => s.pattern)
  const rev = useStore((s) => s.rev)
  const tool = useStore((s) => s.tool)
  const beginStroke = useStore((s) => s.beginStroke)
  const applyAt = useStore((s) => s.applyAt)

  const [hover, setHover] = useState<{ row: number; col: number } | null>(null)
  const drawing = useRef(false)
  const pad = Math.round(cellPx * 0.7)

  // Redibuja cuando cambia el patrón, el zoom o el hover
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const size = canvasSize(pattern, cellPx, pad)
    canvas.width = size.width * dpr
    canvas.height = size.height * dpr
    canvas.style.width = size.width + 'px'
    canvas.style.height = size.height + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawPattern(ctx, pattern, { cellPx, pad, hover, light })
  }, [pattern, rev, cellPx, pad, hover, light])

  function toCell(e: React.PointerEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    return hitTest(pattern, px, py, cellPx, pad)
  }

  function onPointerDown(e: React.PointerEvent) {
    const cell = toCell(e)
    if (!cell) return
    e.currentTarget.setPointerCapture(e.pointerId)
    // fill/eyedropper: una sola acción, sin arrastre
    if (tool === 'paint' || tool === 'erase') {
      drawing.current = true
      beginStroke()
    }
    applyAt(cell.row, cell.col)
  }

  function onPointerMove(e: React.PointerEvent) {
    const cell = toCell(e)
    setHover(cell)
    if (drawing.current && cell) applyAt(cell.row, cell.col)
  }

  function onPointerUp() {
    drawing.current = false
  }

  return (
    <canvas
      ref={canvasRef}
      className="bead-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        setHover(null)
        drawing.current = false
      }}
    />
  )
}
