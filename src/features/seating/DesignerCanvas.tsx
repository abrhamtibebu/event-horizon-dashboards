import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { LayoutChart, LayoutElement, LayoutSeat } from './types'
import type { DesignerState } from './useSeatingDesigner'
import { useCanvasViewport } from './useCanvasViewport'
import { SeatingStage, type SeatRender } from './render'
import { boxFromPoints, boxesIntersect, chartBounds, seatToChart, type Box } from './render/geometry'

type DragMode = 'element' | 'seat' | 'decoration' | 'marquee' | 'rotate' | 'resize'

interface Drag {
  mode: DragMode
  start: { x: number; y: number }
  current: { x: number; y: number }
  appliedX: number
  appliedY: number
  additive: boolean
  elementId?: number
}

interface DesignerCanvasProps {
  state: DesignerState
  chart: LayoutChart
  snapValue: (value: number) => number
  onSelectElements: (ids: number[], additive?: boolean) => void
  onSelectSeats: (ids: number[], additive?: boolean) => void
  onClearSelection: () => void
  onMoveElements: (ids: number[], dx: number, dy: number, commit?: boolean) => void
  onMoveSeats: (ids: number[], dx: number, dy: number, commit?: boolean) => void
  onSelectDecorations: (ids: number[], additive?: boolean) => void
  onMoveDecorations: (ids: number[], dx: number, dy: number, commit?: boolean) => void
  onRotateElement: (id: number, rotation: number) => void
  onResizeElement: (id: number, size: { width?: number; height?: number; radius?: number }) => void
  onUndo: () => void
  onRedo: () => void
  className?: string
}

/**
 * Interaction layer over the shared stage: marquee select, group drag of any
 * selection, rotate/resize handles, snapping, and arrow-key nudges.
 */
export function DesignerCanvas({
  state,
  chart,
  snapValue,
  onSelectElements,
  onSelectSeats,
  onClearSelection,
  onMoveElements,
  onMoveSeats,
  onSelectDecorations,
  onMoveDecorations,
  onRotateElement,
  onResizeElement,
  onUndo,
  onRedo,
  className,
}: DesignerCanvasProps) {
  const viewport = useCanvasViewport({ chartWidth: chart.width, chartHeight: chart.height })
  const [drag, setDrag] = useState<Drag | null>(null)
  const dragRef = useRef<Drag | null>(null)
  dragRef.current = drag

  const selectedElementIds = state.selectedElementIds
  const selectedSeatIds = state.selectedSeatIds
  const singleSelected =
    selectedElementIds.length === 1
      ? chart.elements.find((element) => element.id === selectedElementIds[0]) ?? null
      : null

  const beginDrag = (mode: DragMode, point: { x: number; y: number }, extra?: Partial<Drag>) => {
    setDrag({
      mode,
      start: point,
      current: point,
      appliedX: 0,
      appliedY: 0,
      additive: false,
      ...extra,
    })
  }

  const handleElementPointerDown = (element: LayoutElement, event: React.PointerEvent) => {
    if (viewport.spaceHeld || event.button !== 0) return
    event.stopPropagation()
    const additive = event.shiftKey || event.metaKey || event.ctrlKey
    if (!selectedElementIds.includes(element.id)) {
      onSelectElements([element.id], additive)
    }
    const point = viewport.toChart(event.clientX, event.clientY)
    // A zero-delta commit records the pre-drag position for undo.
    onMoveElements(
      additive || selectedElementIds.includes(element.id) ? selectedElementIds : [element.id],
      0,
      0,
      true,
    )
    beginDrag('element', point)
  }

  const handleSeatPointerDown = (
    element: LayoutElement,
    seat: LayoutSeat,
    event: React.PointerEvent,
  ) => {
    if (viewport.spaceHeld || event.button !== 0) return
    event.stopPropagation()
    const additive = event.shiftKey || event.metaKey || event.ctrlKey
    if (!selectedSeatIds.includes(seat.id)) {
      onSelectSeats(additive ? [seat.id] : [seat.id], additive)
    }
    const point = viewport.toChart(event.clientX, event.clientY)
    onMoveSeats(selectedSeatIds.includes(seat.id) ? selectedSeatIds : [seat.id], 0, 0, true)
    beginDrag('seat', point)
  }

  const handleDecorationPointerDown = (
    decoration: { id: number },
    event: React.PointerEvent,
  ) => {
    if (viewport.spaceHeld || event.button !== 0) return
    event.stopPropagation()
    const additive = event.shiftKey || event.metaKey || event.ctrlKey
    const ids = state.selectedDecorationIds.includes(decoration.id)
      ? state.selectedDecorationIds
      : [decoration.id]
    if (!state.selectedDecorationIds.includes(decoration.id)) {
      onSelectDecorations([decoration.id], additive)
    }
    onMoveDecorations(ids, 0, 0, true)
    beginDrag('decoration', viewport.toChart(event.clientX, event.clientY))
  }

  const handleBackgroundPointerDown = (event: React.PointerEvent) => {
    if (viewport.spaceHeld) return
    const point = viewport.toChart(event.clientX, event.clientY)
    beginDrag('marquee', point, { additive: event.shiftKey })
  }

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      const active = dragRef.current
      if (!active) return
      const point = viewport.toChart(event.clientX, event.clientY)

      if (active.mode === 'marquee') {
        setDrag({ ...active, current: point })
        return
      }

      if (active.mode === 'rotate' && active.elementId != null) {
        const element = chart.elements.find((e) => e.id === active.elementId)
        if (!element) return
        const angle =
          (Math.atan2(point.y - element.y, point.x - element.x) * 180) / Math.PI + 90
        onRotateElement(element.id, Math.round(angle))
        return
      }

      if (active.mode === 'resize' && active.elementId != null) {
        const element = chart.elements.find((e) => e.id === active.elementId)
        if (!element) return
        if (element.type === 'table') {
          const radius = Math.max(
            20,
            snapValue(Math.hypot(point.x - element.x, point.y - element.y)),
          )
          onResizeElement(element.id, { radius })
        } else {
          onResizeElement(element.id, {
            width: Math.max(40, snapValue(point.x - element.x)),
            height: Math.max(40, snapValue(point.y - element.y)),
          })
        }
        return
      }

      // Snap the total delta, then apply only what has not been applied yet, so
      // repeated moves cannot accumulate rounding drift.
      const totalX = snapValue(point.x - active.start.x)
      const totalY = snapValue(point.y - active.start.y)
      const dx = totalX - active.appliedX
      const dy = totalY - active.appliedY
      if (dx === 0 && dy === 0) return

      if (active.mode === 'element') onMoveElements(selectedElementIds, dx, dy)
      else if (active.mode === 'decoration')
        onMoveDecorations(state.selectedDecorationIds, dx, dy)
      else onMoveSeats(selectedSeatIds, dx, dy)

      setDrag({ ...active, current: point, appliedX: totalX, appliedY: totalY })
    },
    [
      chart.elements,
      onMoveDecorations,
      onMoveElements,
      onMoveSeats,
      onResizeElement,
      onRotateElement,
      selectedElementIds,
      selectedSeatIds,
      state.selectedDecorationIds,
      snapValue,
      viewport,
    ],
  )

  const handlePointerUp = useCallback(() => {
    const active = dragRef.current
    if (!active) return

    if (active.mode === 'marquee') {
      const box = boxFromPoints(active.start, active.current)
      if (box.width > 4 || box.height > 4) {
        selectWithin(box, chart, active.additive, onSelectElements, onSelectSeats)
      } else if (!active.additive) {
        onClearSelection()
      }
    }

    setDrag(null)
  }, [chart, onClearSelection, onSelectElements, onSelectSeats])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return

      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) onRedo()
        else onUndo()
        return
      }

      const step = event.shiftKey ? 10 : 1
      const deltas: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }
      const delta = deltas[event.key]
      if (!delta) return
      const decorationIds = state.selectedDecorationIds
      if (
        selectedSeatIds.length === 0 &&
        selectedElementIds.length === 0 &&
        decorationIds.length === 0
      ) {
        return
      }

      event.preventDefault()
      if (selectedSeatIds.length > 0) onMoveSeats(selectedSeatIds, delta[0], delta[1], true)
      else if (decorationIds.length > 0)
        onMoveDecorations(decorationIds, delta[0], delta[1], true)
      else onMoveElements(selectedElementIds, delta[0], delta[1], true)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    onMoveDecorations,
    onMoveElements,
    onMoveSeats,
    onRedo,
    onUndo,
    selectedElementIds,
    selectedSeatIds,
    state.selectedDecorationIds,
  ])

  const seatRender = useCallback(
    (element: LayoutElement, seat: LayoutSeat): SeatRender => ({
      visual:
        seat.status === 'blocked'
          ? 'taken'
          : selectedSeatIds.includes(seat.id)
            ? 'selected'
            : 'available',
      accent: element.color,
      selectable: true,
      outlined: selectedSeatIds.includes(seat.id),
      title: `${seat.label} · ${element.name}${seat.status === 'blocked' ? ' · blocked' : ''}`,
    }),
    [selectedSeatIds],
  )

  const marqueeBox =
    drag?.mode === 'marquee' ? boxFromPoints(drag.start, drag.current) : null

  return (
    <div
      className={cn('relative', className)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <SeatingStage
        chart={chart}
        viewport={viewport}
        seatRender={seatRender}
        selectedElementIds={selectedElementIds}
        selectedDecorationIds={state.selectedDecorationIds}
        interactiveElements
        showGrid={state.showGrid}
        onSeatPointerDown={handleSeatPointerDown}
        onElementPointerDown={handleElementPointerDown}
        onDecorationPointerDown={handleDecorationPointerDown}
        onBackgroundPointerDown={handleBackgroundPointerDown}
        svgClassName="max-h-[70vh]"
        overlay={
          <>
            {marqueeBox && (
              <rect
                x={marqueeBox.x}
                y={marqueeBox.y}
                width={marqueeBox.width}
                height={marqueeBox.height}
                className="fill-primary/10 stroke-primary"
                strokeWidth={1}
                strokeDasharray="4 3"
                pointerEvents="none"
              />
            )}

            {singleSelected && (
              <SelectionHandles
                element={singleSelected}
                onRotateStart={(event) => {
                  event.stopPropagation()
                  beginDrag('rotate', viewport.toChart(event.clientX, event.clientY), {
                    elementId: singleSelected.id,
                  })
                }}
                onResizeStart={(event) => {
                  event.stopPropagation()
                  beginDrag('resize', viewport.toChart(event.clientX, event.clientY), {
                    elementId: singleSelected.id,
                  })
                }}
              />
            )}
          </>
        }
      />

      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur">
        {Math.round(viewport.viewport.scale * 100)}% · scroll to zoom, space or middle-drag to pan
      </div>

      <div className="absolute bottom-2 right-2 flex gap-1">
        <ViewportButton label="Zoom out" onClick={viewport.zoomOut}>
          −
        </ViewportButton>
        <ViewportButton label="Reset zoom" onClick={viewport.fit}>
          ⤢
        </ViewportButton>
        <ViewportButton label="Zoom in" onClick={viewport.zoomIn}>
          +
        </ViewportButton>
      </div>
    </div>
  )
}

function ViewportButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/90 text-sm text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
    >
      {children}
    </button>
  )
}

function SelectionHandles({
  element,
  onRotateStart,
  onResizeStart,
}: {
  element: LayoutElement
  onRotateStart: (event: React.PointerEvent) => void
  onResizeStart: (event: React.PointerEvent) => void
}) {
  const bounds = chartBounds(element)
  const canResize = element.type !== 'seating_group'

  return (
    <g>
      <rect
        x={bounds.x - 4}
        y={bounds.y - 4}
        width={bounds.width + 8}
        height={bounds.height + 8}
        fill="none"
        className="stroke-primary"
        strokeWidth={1.5}
        strokeDasharray="5 3"
        pointerEvents="none"
      />
      <line
        x1={bounds.x + bounds.width / 2}
        y1={bounds.y - 4}
        x2={bounds.x + bounds.width / 2}
        y2={bounds.y - 24}
        className="stroke-primary"
        strokeWidth={1.5}
        pointerEvents="none"
      />
      <circle
        cx={bounds.x + bounds.width / 2}
        cy={bounds.y - 28}
        r={6}
        className="cursor-grab fill-background stroke-primary"
        strokeWidth={2}
        onPointerDown={onRotateStart}
      >
        <title>Rotate</title>
      </circle>
      {canResize && (
        <rect
          x={bounds.x + bounds.width - 1}
          y={bounds.y + bounds.height - 1}
          width={10}
          height={10}
          rx={2}
          className="cursor-nwse-resize fill-background stroke-primary"
          strokeWidth={2}
          onPointerDown={onResizeStart}
        >
          <title>Resize</title>
        </rect>
      )}
    </g>
  )
}

function selectWithin(
  box: Box,
  chart: LayoutChart,
  additive: boolean,
  onSelectElements: (ids: number[], additive?: boolean) => void,
  onSelectSeats: (ids: number[], additive?: boolean) => void,
) {
  const seatIds: number[] = []
  for (const element of chart.elements) {
    for (const seat of element.seats) {
      const point = seatToChart(element, seat)
      if (
        point.x >= box.x &&
        point.x <= box.x + box.width &&
        point.y >= box.y &&
        point.y <= box.y + box.height
      ) {
        seatIds.push(seat.id)
      }
    }
  }

  // Seats win when the marquee catches any, so fine selections stay precise.
  if (seatIds.length > 0) {
    onSelectSeats(seatIds, additive)
    return
  }

  const elementIds = chart.elements
    .filter((element) => boxesIntersect(box, chartBounds(element)))
    .map((element) => element.id)
  onSelectElements(elementIds, additive)
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  )
}
