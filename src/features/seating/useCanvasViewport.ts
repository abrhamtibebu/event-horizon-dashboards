import { useCallback, useEffect, useRef, useState } from 'react'

export const MIN_SCALE = 0.2
export const MAX_SCALE = 5

export interface Viewport {
  scale: number
  /** Translation in chart units, applied before scaling. */
  offsetX: number
  offsetY: number
}

export interface CanvasViewport {
  viewport: Viewport
  containerRef: React.RefObject<HTMLDivElement>
  svgRef: React.RefObject<SVGSVGElement>
  isPanning: boolean
  /** Screen point to chart coordinates, valid at any zoom or pan. */
  toChart: (clientX: number, clientY: number) => { x: number; y: number }
  zoomBy: (factor: number, anchor?: { x: number; y: number }) => void
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fit: () => void
  /** Bind to the scroll container to enable wheel zoom and drag panning. */
  bind: {
    onWheel: (event: React.WheelEvent) => void
    onPointerDown: (event: React.PointerEvent) => void
    onPointerMove: (event: React.PointerEvent) => void
    onPointerUp: (event: React.PointerEvent) => void
  }
  /** True while the space bar is held, so callers can show a grab cursor. */
  spaceHeld: boolean
}

interface Options {
  chartWidth: number
  chartHeight: number
  /** Panning with a plain left-drag; the designer reserves that for selection. */
  panOnPlainDrag?: boolean
}

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

/**
 * viewBox-driven zoom and pan shared by the designer and the buyer map. Keeping
 * this out of the SVG lets both surfaces render identical markup.
 */
export function useCanvasViewport({
  chartWidth,
  chartHeight,
  panOnPlainDrag = false,
}: Options): CanvasViewport {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewport, setViewport] = useState<Viewport>({ scale: 1, offsetX: 0, offsetY: 0 })
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTypingTarget(e.target)) {
        e.preventDefault()
        setSpaceHeld(true)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const toChart = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const point = svg.createSVGPoint()
    point.x = clientX
    point.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const mapped = point.matrixTransform(ctm.inverse())
    return { x: mapped.x, y: mapped.y }
  }, [])

  /**
   * Content is rendered as `scale(s) translate(o)`, so a chart point c lands at
   * s * (c + o). Panning is clamped so the chart cannot be dragged out of sight.
   */
  const clampOffset = useCallback(
    (value: number, extent: number, scale: number) => {
      const pad = 40
      const min = extent / scale - extent - pad
      return Math.min(pad, Math.max(min, value))
    },
    [],
  )

  const zoomBy = useCallback(
    (factor: number, anchor?: { x: number; y: number }) => {
      setViewport((prev) => {
        const scale = clampScale(prev.scale * factor)
        if (scale === prev.scale) return prev
        const ratio = scale / prev.scale
        const anchored = anchor ?? { x: chartWidth / 2, y: chartHeight / 2 }

        // Solving s*(c+o) = s'*(c+o') keeps the anchor pinned under the cursor.
        return {
          scale,
          offsetX: clampOffset((anchored.x + prev.offsetX) / ratio - anchored.x, chartWidth, scale),
          offsetY: clampOffset(
            (anchored.y + prev.offsetY) / ratio - anchored.y,
            chartHeight,
            scale,
          ),
        }
      })
    },
    [chartWidth, chartHeight, clampOffset],
  )

  const reset = useCallback(() => setViewport({ scale: 1, offsetX: 0, offsetY: 0 }), [])

  /** The viewBox already frames the whole chart, so fitting is a reset to 1x. */
  const fit = reset

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey && Math.abs(event.deltaY) < 2) return
      event.preventDefault()
      const anchor = toChart(event.clientX, event.clientY)
      zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12, anchor)
    },
    [toChart, zoomBy],
  )

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      const middle = event.button === 1
      const plain = panOnPlainDrag && event.button === 0
      if (!middle && !plain && !(spaceHeld && event.button === 0)) return
      event.preventDefault()
      setIsPanning(true)
      panStart.current = {
        x: event.clientX,
        y: event.clientY,
        offsetX: viewport.offsetX,
        offsetY: viewport.offsetY,
      }
      ;(event.currentTarget as Element).setPointerCapture?.(event.pointerId)
    },
    [panOnPlainDrag, spaceHeld, viewport.offsetX, viewport.offsetY],
  )

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const start = panStart.current
      if (!start) return
      const svg = svgRef.current
      // Pointer deltas are in screen pixels; convert them to chart units.
      const pxPerUnit = (svg?.getBoundingClientRect().width ?? chartWidth) / chartWidth
      const dx = (event.clientX - start.x) / (pxPerUnit * viewport.scale)
      const dy = (event.clientY - start.y) / (pxPerUnit * viewport.scale)
      setViewport((prev) => ({
        ...prev,
        offsetX: clampOffset(start.offsetX + dx, chartWidth, prev.scale),
        offsetY: clampOffset(start.offsetY + dy, chartHeight, prev.scale),
      }))
    },
    [viewport.scale, chartWidth, chartHeight, clampOffset],
  )

  const onPointerUp = useCallback((event: React.PointerEvent) => {
    panStart.current = null
    setIsPanning(false)
    try {
      ;(event.currentTarget as Element).releasePointerCapture?.(event.pointerId)
    } catch {
      /* pointer already released */
    }
  }, [])

  return {
    viewport,
    containerRef,
    svgRef,
    isPanning,
    toChart,
    zoomBy,
    zoomIn: () => zoomBy(1.2),
    zoomOut: () => zoomBy(1 / 1.2),
    reset,
    fit,
    bind: { onWheel, onPointerDown, onPointerMove, onPointerUp },
    spaceHeld,
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  )
}
