import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { canvasSize, drawPattern, hitTest } from '../lib/render'

interface Props {
  cellPx: number
  light: boolean
  onZoom: (next: number) => void
}

export default function BeadCanvas({ cellPx, light, onZoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pattern = useStore((s) => s.pattern)
  const rev = useStore((s) => s.rev)
  const tool = useStore((s) => s.tool)
  const beginStroke = useStore((s) => s.beginStroke)
  const applyAt = useStore((s) => s.applyAt)

  const [hover, setHover] = useState<{ row: number; col: number } | null>(null)
  const pad = Math.round(cellPx * 0.7)

  // Estado de punteros para distinguir pintar (1 dedo) de zoom (2 dedos)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinch = useRef<{ dist: number; zoom: number } | null>(null)
  const drawing = useRef(false)
  const pendingTap = useRef<{ row: number; col: number } | null>(null)

  const mutates = tool === 'paint' || tool === 'erase' || tool === 'fill'

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
    return hitTest(pattern, e.clientX - rect.left, e.clientY - rect.top, cellPx, pad)
  }

  function dist() {
    const [a, b] = [...pointers.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function onPointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    e.currentTarget.setPointerCapture(e.pointerId)

    // Segundo dedo -> empieza el zoom, cancela cualquier trazo
    if (pointers.current.size === 2) {
      drawing.current = false
      pendingTap.current = null
      pinch.current = { dist: dist(), zoom: cellPx }
      return
    }
    if (pointers.current.size > 2) return

    const cell = toCell(e)
    if (e.pointerType === 'touch') {
      // Puede ser toque, arrastre o inicio de pellizco: esperamos al move/up
      pendingTap.current = cell
      return
    }
    // Ratón / lápiz: acción inmediata
    if (mutates) drawing.current = true
    if (cell) {
      if (mutates) beginStroke()
      applyAt(cell.row, cell.col)
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }
    setHover(toCell(e))

    // Zoom con dos dedos
    if (pinch.current && pointers.current.size >= 2) {
      const ratio = dist() / pinch.current.dist
      onZoom(Math.round(pinch.current.zoom * ratio))
      return
    }

    const cell = toCell(e)
    if (e.pointerType === 'touch' && pendingTap.current !== null && !drawing.current) {
      // Se mueve el dedo -> era un trazo, no un toque
      if (mutates) {
        drawing.current = true
        beginStroke()
        if (cell) applyAt(cell.row, cell.col)
      }
      pendingTap.current = null
    } else if (drawing.current && cell) {
      applyAt(cell.row, cell.col)
    }
  }

  function endPointer(e: React.PointerEvent) {
    // Toque simple (sin arrastre ni pellizco) -> pinta/actúa una vez
    if (e.pointerType === 'touch' && pendingTap.current && !pinch.current && !drawing.current) {
      const cell = pendingTap.current
      if (mutates) beginStroke()
      applyAt(cell.row, cell.col)
    }
    pointers.current.delete(e.pointerId)
    pendingTap.current = null
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) drawing.current = false
  }

  return (
    <canvas
      ref={canvasRef}
      className="bead-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={(e) => {
        setHover(null)
        if (e.pointerType !== 'touch') {
          drawing.current = false
          pointers.current.delete(e.pointerId)
        }
      }}
    />
  )
}
