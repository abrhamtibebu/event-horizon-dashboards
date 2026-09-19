import {
  Armchair,
  ChevronDown,
  ChevronUp,
  CircleDot,
  MapPin,
  Trash2,
  Type,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LayoutDecoration, LayoutElement, SeatingElementType } from './types'

const ICONS: Record<SeatingElementType, typeof Armchair> = {
  seating_group: Armchair,
  table: CircleDot,
  standing: Users,
}

interface ElementsPanelProps {
  elements: LayoutElement[]
  selectedIds: number[]
  onSelect: (id: number, additive: boolean) => void
  onChangeZ: (id: number, direction: 1 | -1) => void
  onDelete: (element: LayoutElement) => void
  deletingId?: number | null
  decorations?: LayoutDecoration[]
  selectedDecorationIds?: number[]
  onSelectDecoration?: (id: number, additive: boolean) => void
  onDeleteDecoration?: (decoration: LayoutDecoration) => void
}

export function ElementsPanel({
  elements,
  selectedIds,
  onSelect,
  onChangeZ,
  onDelete,
  deletingId,
  decorations = [],
  selectedDecorationIds = [],
  onSelectDecoration,
  onDeleteDecoration,
}: ElementsPanelProps) {
  if (elements.length === 0 && decorations.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
        Nothing on the floor plan yet. Add a seating group, table or standing area.
      </p>
    )
  }

  // Top of the stack first, matching how the layers read on the canvas.
  const ordered = [...elements].sort((a, b) => b.zIndex - a.zIndex)

  return (
    <>
    <ul className="space-y-1">
      {ordered.map((element) => {
        const Icon = ICONS[element.type] ?? Armchair
        const selected = selectedIds.includes(element.id)

        return (
          <li key={element.id}>
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors',
                selected ? 'border-primary/60 bg-primary/5' : 'border-transparent hover:bg-muted/50',
              )}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={(event) => onSelect(element.id, event.shiftKey)}
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: element.color }}
                />
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{element.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {element.type === 'standing'
                      ? `${element.capacity ?? 0} spots`
                      : `${element.seats.length} seats`}
                    {element.ticketTypeName ? ` · ${element.ticketTypeName}` : ' · no ticket type'}
                  </span>
                </span>
              </button>

              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  aria-label="Bring forward"
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => onChangeZ(element.id, 1)}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Send backward"
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => onChangeZ(element.id, -1)}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive"
                  aria-label={`Delete ${element.name}`}
                  disabled={deletingId === element.id}
                  onClick={() => onDelete(element)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>

    {decorations.length > 0 && (
      <ul className="mt-2 space-y-1 border-t border-border/60 pt-2">
        {decorations.map((decoration) => {
          const Icon = decoration.type === 'text' ? Type : MapPin
          const selected = selectedDecorationIds.includes(decoration.id)

          return (
            <li key={`deco-${decoration.id}`}>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors',
                  selected
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-transparent hover:bg-muted/50',
                )}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={(event) => onSelectDecoration?.(decoration.id, event.shiftKey)}
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: decoration.color }}
                  />
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">
                      {decoration.label || (decoration.type === 'text' ? 'Text' : 'Marker')}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {decoration.type === 'text' ? 'Label' : 'Point of interest'}
                    </span>
                  </span>
                </button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive"
                  aria-label="Delete element"
                  onClick={() => onDeleteDecoration?.(decoration)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    )}
    </>
  )
}
