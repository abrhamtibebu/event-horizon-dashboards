import type { ReactNode } from 'react'
import { cn, getImageUrl } from '@/lib/utils'
import type { LayoutChart, LayoutDecoration, LayoutElement, LayoutSeat } from '../types'
import type { CanvasViewport } from '../useCanvasViewport'
import { DecorationShape } from './DecorationShape'
import { ElementShape } from './ElementShape'
import { NEUTRAL_AVAILABLE, SeatGlyph, type SeatVisual } from './SeatGlyph'

export interface SeatRender {
  visual: SeatVisual
  accent: string
  selectable?: boolean
  dimmed?: boolean
  outlined?: boolean
  title?: string
}

interface SeatingStageProps {
  chart: LayoutChart
  viewport: CanvasViewport
  /** How each seat should look; drives both designer and buyer states. */
  seatRender: (element: LayoutElement, seat: LayoutSeat) => SeatRender
  elementAccent?: (element: LayoutElement) => string
  selectedElementIds?: number[]
  interactiveElements?: boolean
  showElementShapes?: boolean
  showLabels?: boolean
  showGrid?: boolean
  onSeatClick?: (element: LayoutElement, seat: LayoutSeat, event: React.MouseEvent) => void
  onSeatPointerDown?: (
    element: LayoutElement,
    seat: LayoutSeat,
    event: React.PointerEvent,
  ) => void
  onElementClick?: (element: LayoutElement, event: React.MouseEvent) => void
  onElementPointerDown?: (element: LayoutElement, event: React.PointerEvent) => void
  selectedDecorationIds?: number[]
  onDecorationPointerDown?: (
    decoration: LayoutDecoration,
    event: React.PointerEvent,
  ) => void
  onBackgroundPointerDown?: (event: React.PointerEvent) => void
  /** Extra chart-space markup drawn above everything (handles, marquee). */
  overlay?: ReactNode
  className?: string
  svgClassName?: string
}

/**
 * The single seating renderer. The organizer designer and the buyer checkout map
 * both mount this, which is what makes "what you build is what buyers see" true
 * by construction rather than by convention.
 */
export function SeatingStage({
  chart,
  viewport,
  seatRender,
  elementAccent,
  selectedElementIds = [],
  interactiveElements = false,
  showElementShapes = true,
  showLabels = true,
  showGrid = false,
  onSeatClick,
  onSeatPointerDown,
  onElementClick,
  onElementPointerDown,
  selectedDecorationIds = [],
  onDecorationPointerDown,
  onBackgroundPointerDown,
  overlay,
  className,
  svgClassName,
}: SeatingStageProps) {
  const { scale, offsetX, offsetY } = viewport.viewport
  const selected = new Set(selectedElementIds)
  const ordered = [...chart.elements].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div
      ref={viewport.containerRef}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-muted/20',
        viewport.isPanning ? 'cursor-grabbing' : viewport.spaceHeld && 'cursor-grab',
        className,
      )}
      onWheel={viewport.bind.onWheel}
      onPointerDown={(event) => {
        viewport.bind.onPointerDown(event)
        if (!viewport.spaceHeld && event.button === 0) onBackgroundPointerDown?.(event)
      }}
      onPointerMove={viewport.bind.onPointerMove}
      onPointerUp={viewport.bind.onPointerUp}
      onPointerLeave={viewport.bind.onPointerUp}
    >
      <svg
        ref={viewport.svgRef}
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        className={cn('block h-auto w-full touch-none select-none', svgClassName)}
      >
        <defs>
          <pattern
            id="seating-grid"
            width={chart.gridSize}
            height={chart.gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${chart.gridSize} 0 L 0 0 0 ${chart.gridSize}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-border"
            />
          </pattern>
        </defs>

        <g transform={`scale(${scale}) translate(${offsetX}, ${offsetY})`}>
          {chart.backgroundUrl && (
            <image
              href={getImageUrl(chart.backgroundUrl)}
              x={0}
              y={0}
              width={chart.width}
              height={chart.height}
              preserveAspectRatio="xMidYMid meet"
            />
          )}

          {showGrid && (
            <rect
              x={0}
              y={0}
              width={chart.width}
              height={chart.height}
              fill="url(#seating-grid)"
              pointerEvents="none"
            />
          )}

          {[...chart.decorations].sort((a, b) => a.zIndex - b.zIndex).map((decoration) => (
            <DecorationShape
              key={`deco-${decoration.id}`}
              decoration={decoration}
              selected={selectedDecorationIds.includes(decoration.id)}
              interactive={Boolean(onDecorationPointerDown)}
              onPointerDown={
                onDecorationPointerDown
                  ? (event) => onDecorationPointerDown(decoration, event)
                  : undefined
              }
            />
          ))}

          {ordered.map((element) => {
            const accent = elementAccent?.(element) ?? element.color ?? NEUTRAL_AVAILABLE
            return (
              <g
                key={element.id}
                transform={
                  element.rotation
                    ? `translate(${element.x}, ${element.y}) rotate(${element.rotation})`
                    : `translate(${element.x}, ${element.y})`
                }
              >
                {showElementShapes && (
                  <ElementShape
                    element={element}
                    accent={accent}
                    selected={selected.has(element.id)}
                    interactive={interactiveElements}
                    showLabel={showLabels}
                    onPointerDown={
                      onElementPointerDown
                        ? (event) => onElementPointerDown(element, event)
                        : undefined
                    }
                    onClick={onElementClick ? (event) => onElementClick(element, event) : undefined}
                  />
                )}

                {element.seats.map((seat) => {
                  const render = seatRender(element, seat)
                  return (
                    <SeatGlyph
                      key={seat.id}
                      cx={seat.x}
                      cy={seat.y}
                      rotation={seat.rotation}
                      visual={render.visual}
                      accent={render.accent}
                      selectable={render.selectable}
                      dimmed={render.dimmed}
                      outlined={render.outlined}
                      title={render.title}
                      onClick={
                        onSeatClick ? (event) => onSeatClick(element, seat, event) : undefined
                      }
                      onPointerDown={
                        onSeatPointerDown
                          ? (event) => onSeatPointerDown(element, seat, event)
                          : undefined
                      }
                    />
                  )
                })}
              </g>
            )
          })}

          {overlay}
        </g>
      </svg>
    </div>
  )
}
