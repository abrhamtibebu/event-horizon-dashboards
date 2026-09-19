import {
  Armchair,
  Check,
  CircleDot,
  Grid3x3,
  Loader2,
  MapPin,
  Magnet,
  Redo2,
  Type,
  Undo2,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DecorationType, SeatingElementType } from './types'

interface DesignerToolbarProps {
  canUndo: boolean
  canRedo: boolean
  snapEnabled: boolean
  showGrid: boolean
  saving: boolean
  isCreating: boolean
  onInsert: (type: SeatingElementType) => void
  onInsertDecoration: (type: DecorationType) => void
  onUndo: () => void
  onRedo: () => void
  onToggleSnap: () => void
  onToggleGrid: () => void
}

export function DesignerToolbar({
  canUndo,
  canRedo,
  snapEnabled,
  showGrid,
  saving,
  isCreating,
  onInsert,
  onInsertDecoration,
  onUndo,
  onRedo,
  onToggleSnap,
  onToggleGrid,
}: DesignerToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/50 p-2">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isCreating}
          onClick={() => onInsert('seating_group')}
        >
          <Armchair className="mr-1.5 h-4 w-4" />
          Seating group
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isCreating}
          onClick={() => onInsert('table')}
        >
          <CircleDot className="mr-1.5 h-4 w-4" />
          Table
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isCreating}
          onClick={() => onInsert('standing')}
        >
          <Users className="mr-1.5 h-4 w-4" />
          Standing area
        </Button>
      </div>

      <span className="mx-1 h-6 w-px bg-border" />

      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isCreating}
          onClick={() => onInsertDecoration('poi')}
          title="Mark an entrance, exit, restroom or bar"
        >
          <MapPin className="mr-1.5 h-4 w-4" />
          Point of interest
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isCreating}
          onClick={() => onInsertDecoration('text')}
          title="Label an aisle or add a note"
        >
          <Type className="mr-1.5 h-4 w-4" />
          Text
        </Button>
      </div>

      <span className="mx-1 h-6 w-px bg-border" />

      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <span className="mx-1 h-6 w-px bg-border" />

      <Button
        type="button"
        size="sm"
        variant={snapEnabled ? 'secondary' : 'ghost'}
        onClick={onToggleSnap}
        title="Snap to grid"
      >
        <Magnet className="mr-1.5 h-4 w-4" />
        Snap
      </Button>
      <Button
        type="button"
        size="sm"
        variant={showGrid ? 'secondary' : 'ghost'}
        onClick={onToggleGrid}
        title="Show grid"
      >
        <Grid3x3 className="mr-1.5 h-4 w-4" />
        Grid
      </Button>

      <span
        className={cn(
          'ml-auto flex items-center gap-1.5 text-xs',
          saving ? 'text-muted-foreground' : 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {saving ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Check className="h-3.5 w-3.5" />
            All changes saved
          </>
        )}
      </span>
    </div>
  )
}
