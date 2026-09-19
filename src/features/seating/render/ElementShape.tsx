import type { LayoutElement } from '../types'
import { localBounds } from './geometry'

interface ElementShapeProps {
  element: LayoutElement
  accent: string
  selected?: boolean
  /** Designer shows a grab surface; the buyer map only needs the visual. */
  interactive?: boolean
  showLabel?: boolean
  onPointerDown?: (event: React.PointerEvent) => void
  onClick?: (event: React.MouseEvent) => void
}

const PAD = 12

/**
 * The backdrop for a floor-plan element, drawn in the element's own coordinate
 * space. Seating groups get a soft plate, tables a solid top, standing areas a
 * dashed outline with their capacity.
 */
export function ElementShape({
  element,
  accent,
  selected = false,
  interactive = false,
  showLabel = true,
  onPointerDown,
  onClick,
}: ElementShapeProps) {
  const bounds = localBounds(element)
  const common = {
    onPointerDown,
    onClick,
    className: interactive ? 'cursor-move' : undefined,
  }

  if (element.type === 'table') {
    const radius = element.config.radius ?? 46
    const top = radius * 0.62
    return (
      <g>
        {element.config.shape === 'square' ? (
          <rect
            x={-top}
            y={-top}
            width={top * 2}
            height={top * 2}
            rx={8}
            fill={accent}
            fillOpacity={0.25}
            stroke={accent}
            strokeWidth={selected ? 2.5 : 1.5}
            {...common}
          />
        ) : (
          <circle
            r={top}
            fill={accent}
            fillOpacity={0.25}
            stroke={accent}
            strokeWidth={selected ? 2.5 : 1.5}
            {...common}
          />
        )}
        {showLabel && (
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none fill-foreground text-[11px] font-semibold"
          >
            {element.name}
          </text>
        )}
      </g>
    )
  }

  if (element.type === 'standing') {
    const width = element.width ?? bounds.width
    const height = element.height ?? bounds.height
    return (
      <g>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={10}
          fill={accent}
          fillOpacity={0.16}
          stroke={accent}
          strokeWidth={selected ? 2.5 : 1.5}
          strokeDasharray="8 5"
          {...common}
        />
        {showLabel && (
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            className="pointer-events-none fill-foreground text-[12px] font-semibold"
          >
            {element.name}
            {element.capacity ? (
              <tspan className="fill-muted-foreground text-[10px] font-normal">
                {' '}
                · {element.capacity} spots
              </tspan>
            ) : null}
          </text>
        )}
      </g>
    )
  }

  // Charts authored with the older outline tool carry an explicit path.
  if (element.path) {
    return (
      <g>
        <path
          d={element.path}
          fill={accent}
          fillOpacity={selected ? 0.16 : 0.08}
          stroke={accent}
          strokeOpacity={selected ? 0.9 : 0.5}
          strokeWidth={selected ? 2 : 1.5}
          {...common}
        />
        {showLabel && (
          <text
            x={bounds.x + bounds.width / 2}
            y={bounds.y - PAD - 6}
            textAnchor="middle"
            className="pointer-events-none fill-muted-foreground text-[11px] font-semibold"
          >
            {element.name}
          </text>
        )}
      </g>
    )
  }

  return (
    <g>
      <rect
        x={bounds.x - PAD}
        y={bounds.y - PAD}
        width={bounds.width + PAD * 2}
        height={bounds.height + PAD * 2}
        rx={10}
        fill={accent}
        fillOpacity={selected ? 0.12 : 0.06}
        stroke={accent}
        strokeOpacity={selected ? 0.9 : 0.35}
        strokeWidth={selected ? 2 : 1}
        {...common}
      />
      {showLabel && (
        <text
          x={bounds.x + bounds.width / 2}
          y={bounds.y - PAD - 6}
          textAnchor="middle"
          className="pointer-events-none fill-muted-foreground text-[11px] font-semibold"
        >
          {element.name}
        </text>
      )}
    </g>
  )
}
