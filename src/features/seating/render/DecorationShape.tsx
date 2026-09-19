import type { LayoutDecoration } from '../types'

interface DecorationShapeProps {
  decoration: LayoutDecoration
  selected?: boolean
  interactive?: boolean
  onPointerDown?: (event: React.PointerEvent) => void
  onClick?: (event: React.MouseEvent) => void
}

/** Simple glyphs so wayfinding reads at a glance without an icon font in SVG. */
const ICON_PATHS: Record<string, string> = {
  entrance: 'M -5 6 L -5 -6 L 5 -6 M 1 0 L 7 0 M 4 -3 L 7 0 L 4 3',
  exit: 'M 5 6 L 5 -6 L -5 -6 M -1 0 L -7 0 M -4 -3 L -7 0 L -4 3',
  restroom: 'M -4 -4 a 2 2 0 1 0 0.1 0 M -4 -1 L -4 6 M -6 1 L -2 1 M 4 -4 a 2 2 0 1 0 0.1 0 M 2 6 L 4 -1 L 6 6',
  food: 'M -4 -6 L -4 6 M -6 -6 L -2 -6 M 4 -6 L 4 6 M 2 -6 a 2 4 0 0 0 4 0',
  drink: 'M -4 -5 L 4 -5 L 1 1 L 1 6 M -1 6 L 3 6 M 1 1 L -1 1',
  info: 'M 0 -6 a 6 6 0 1 0 0.1 0 M 0 -3 L 0 -3 M 0 -1 L 0 4',
  stage: 'M -7 4 L -4 -4 L 4 -4 L 7 4 Z',
}

export function DecorationShape({
  decoration,
  selected = false,
  interactive = false,
  onPointerDown,
  onClick,
}: DecorationShapeProps) {
  const common = {
    onPointerDown,
    onClick,
    className: interactive ? 'cursor-move' : undefined,
  }

  if (decoration.type === 'text') {
    return (
      <g
        transform={`translate(${decoration.x}, ${decoration.y}) rotate(${decoration.rotation})`}
        {...common}
      >
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={decoration.fontSize}
          fill={decoration.color}
          className="font-medium"
        >
          {decoration.label || 'Text'}
        </text>
        {selected && (
          <rect
            x={-60}
            y={-decoration.fontSize}
            width={120}
            height={decoration.fontSize * 2}
            fill="none"
            className="stroke-primary"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}
      </g>
    )
  }

  if (decoration.type === 'shape') {
    return (
      <g
        transform={`translate(${decoration.x}, ${decoration.y}) rotate(${decoration.rotation})`}
        {...common}
      >
        <rect
          x={0}
          y={0}
          width={decoration.width ?? 120}
          height={decoration.height ?? 40}
          rx={6}
          fill={decoration.color}
          fillOpacity={0.2}
          stroke={decoration.color}
          strokeWidth={selected ? 2.5 : 1.5}
        />
        {decoration.label && (
          <text
            x={(decoration.width ?? 120) / 2}
            y={(decoration.height ?? 40) / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={decoration.fontSize}
            fill={decoration.color}
            className="pointer-events-none font-medium"
          >
            {decoration.label}
          </text>
        )}
      </g>
    )
  }

  const iconPath = decoration.icon ? ICON_PATHS[decoration.icon] : undefined

  return (
    <g
      transform={`translate(${decoration.x}, ${decoration.y}) rotate(${decoration.rotation})`}
      {...common}
    >
      <circle
        r={13}
        fill={decoration.color}
        fillOpacity={0.18}
        stroke={decoration.color}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      {iconPath && (
        <path
          d={iconPath}
          fill="none"
          stroke={decoration.color}
          strokeWidth={1.6}
          strokeLinecap="round"
          transform="scale(0.85)"
          className="pointer-events-none"
        />
      )}
      {decoration.label && (
        <text
          y={26}
          textAnchor="middle"
          fontSize={11}
          fill={decoration.color}
          className="pointer-events-none font-medium"
        >
          {decoration.label}
        </text>
      )}
    </g>
  )
}

export const DECORATION_ICONS = Object.keys(ICON_PATHS)
