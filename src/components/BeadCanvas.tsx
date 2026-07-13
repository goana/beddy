import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { canvasSize, drawGuides, drawPattern, drawTracker, hitTest } from '../lib/render'

interface Props {
  cellPx: number
  light: boolean
  showGuides: boolean
  tracking: boolean
  currentRow: number
  onZoom: (next: number) => void
}

const GRID_PAD = 2

export default function BeadCanvas({ cellPx, light, showGuides, tracking, currentRow, onZoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pattern = useStore((s) => s.pattern)
  const rev = useStore((s) => s.rev)
  const tool = useStore((s) => s.tool)
  const beginStroke = useStore((s) => s.beginStroke)
  const applyAt = useStore((s) => s.applyAt)

  const [hover, setHover] = useState<{ row: number; col: number } | null>(null)

  // Márgenes: cuando hay guías, dejamos sitio a la izquierda/arriba para los números
  const offX = showGuides ? String(pattern.height).length * 7 + 13 : Math.round(cellPx * 0.6)
  const offY = showGuides ? 18 : Math.round(cellPx * 0.6)
  const padR = showGuides ? 8 : offX
  const padB = showGuides ? 8 : offY

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinch = useRef<{ dist: number; zoom: number } | null>(null)
  const drawing = useRef(false)
  const pendingTap = useRef<{ row: number; col: number } | null>(null)

  const mutates = tool === 'paint' || tool === 'erase' || tool === 'fill'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const gs = canvasSize(pattern, cellPx, GRID_PAD)
    const W = offX + gs.width + padR
    const H = offY + gs.height + padB
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.save()
    ctx.translate(offX, offY)
    drawPattern(ctx, pattern, { cellPx, pad: GRID_PAD, hover, light })
    if (tracking) drawTracker(ctx, pattern, { cellPx, gridPad: GRID_PAD, currentRow, light })
    ctx.restore()
    if (showGuides) drawGuides(ctx, pattern, { cellPx, offX, offY, gridPad: GRID_PAD, light })
  }, [pattern, rev, cellPx, offX, offY, padR, padB, hover, light, showGuides, tracking, currentRow])

  function toCell(e: React.PointerEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return hitTest(pattern, e.clientX - rect.left - offX, e.clientY - rect.top - offY, cellPx, GRID_PAD)
  }

  function dist() {
    const [a, b] = [...pointers.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function onPointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    e.currentTarget.setPointerCapture(e.pointerId)

    if (pointers.current.size === 2) {
      drawing.current = false
      pendingTap.current = null
      pinch.current = { dist: dist(), zoom: cellPx }
      return
    }
    if (pointers.current.size > 2) return

    const cell = toCell(e)
    if (e.pointerType === 'touch') {
      pendingTap.current = cell
      return
    }
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

    if (pinch.current && pointers.current.size >= 2) {
      const ratio = dist() / pinch.current.dist
      onZoom(Math.round(pinch.current.zoom * ratio))
      return
    }

    const cell = toCell(e)
    if (e.pointerType === 'touch' && pendingTap.current !== null && !drawing.current) {
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
