import { useState } from 'react'
import { Ban, RotateCw, Sparkles, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TicketType } from '@/types'
import type { LayoutDecoration, LayoutElement, LayoutSeat, TableShape } from './types'
import type { DecorationPatch, ElementPatch } from './useSeatingDesigner'
import { LABEL_SCHEME_LABELS, type LabelScheme } from './labeling'
import { DECORATION_ICONS, TIER_PALETTE } from './render'

interface PropertyPanelProps {
  element: LayoutElement | null
  selectedSeats: LayoutSeat[]
  decoration?: LayoutDecoration | null
  onPatchDecoration?: (id: number, patch: DecorationPatch) => void
  ticketTypes: TicketType[]
  onPatchElement: (id: number, patch: ElementPatch) => void
  onGenerateGrid: (element: LayoutElement, rows: number, cols: number) => void
  onRebuildTable: (element: LayoutElement) => void
  onAutoLabel: (scheme: LabelScheme, prefix: string, start: number, reverse: boolean) => void
  onRenameSeat: (seatId: number, label: string) => void
  onSetSeatStatus: (status: 'available' | 'blocked') => void
  busy?: boolean
}

export function PropertyPanel({
  element,
  selectedSeats,
  decoration,
  onPatchDecoration,
  ticketTypes,
  onPatchElement,
  onGenerateGrid,
  onRebuildTable,
  onAutoLabel,
  onRenameSeat,
  onSetSeatStatus,
  busy,
}: PropertyPanelProps) {
  if (decoration && onPatchDecoration) {
    return <DecorationProperties decoration={decoration} onPatch={onPatchDecoration} />
  }

  if (selectedSeats.length > 0) {
    return (
      <SeatProperties
        seats={selectedSeats}
        onAutoLabel={onAutoLabel}
        onRenameSeat={onRenameSeat}
        onSetSeatStatus={onSetSeatStatus}
        busy={busy}
      />
    )
  }

  if (!element) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
        Select an element on the plan to edit it, or drag a box around seats to
        relabel them.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Name</Label>
        <Input
          value={element.name}
          onChange={(e) => onPatchElement(element.id, { name: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Ticket type</Label>
        <Select
          value={element.ticketTypeId ? String(element.ticketTypeId) : 'any'}
          onValueChange={(value) =>
            onPatchElement(element.id, {
              ticketTypeId: value === 'any' ? null : Number(value),
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">No ticket type</SelectItem>
            {ticketTypes.map((type) => (
              <SelectItem key={type.id} value={String(type.id)}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!element.ticketTypeId && ticketTypes.length > 1 && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            Buyers cannot pick these seats until a ticket type is assigned.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Colour</Label>
        <div className="flex flex-wrap gap-1.5">
          {TIER_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Use ${color}`}
              onClick={() => onPatchElement(element.id, { color })}
              className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: element.color === color ? 'currentColor' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">X</Label>
          <Input
            type="number"
            value={Math.round(element.x)}
            onChange={(e) => onPatchElement(element.id, { x: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Y</Label>
          <Input
            type="number"
            value={Math.round(element.y)}
            onChange={(e) => onPatchElement(element.id, { y: Number(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs">
          <RotateCw className="h-3 w-3" /> Rotation ({Math.round(element.rotation)}°)
        </Label>
        <Input
          type="range"
          min={-180}
          max={180}
          value={element.rotation}
          onChange={(e) => onPatchElement(element.id, { rotation: Number(e.target.value) })}
        />
      </div>

      {element.type === 'seating_group' && (
        <GroupSettings element={element} onPatchElement={onPatchElement} onGenerate={onGenerateGrid} busy={busy} />
      )}

      {element.type === 'table' && (
        <TableSettings element={element} onPatchElement={onPatchElement} onRebuild={onRebuildTable} busy={busy} />
      )}

      {element.type === 'standing' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Capacity</Label>
          <Input
            type="number"
            min={0}
            value={element.capacity ?? 0}
            onChange={(e) =>
              onPatchElement(element.id, { capacity: Math.max(0, Number(e.target.value) || 0) })
            }
          />
          <p className="text-[11px] text-muted-foreground">
            Buyers choose a quantity for this area instead of individual seats.
          </p>
        </div>
      )}
    </div>
  )
}

function DecorationProperties({
  decoration,
  onPatch,
}: {
  decoration: LayoutDecoration
  onPatch: (id: number, patch: DecorationPatch) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold">
        {decoration.type === 'text' ? 'Text label' : 'Point of interest'}
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs">Label</Label>
        <Input
          value={decoration.label}
          placeholder={decoration.type === 'text' ? 'Main aisle' : 'Entrance'}
          onChange={(e) => onPatch(decoration.id, { label: e.target.value })}
        />
      </div>

      {decoration.type !== 'text' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Icon</Label>
          <Select
            value={decoration.icon ?? 'none'}
            onValueChange={(value) =>
              onPatch(decoration.id, { icon: value === 'none' ? null : value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No icon</SelectItem>
              {DECORATION_ICONS.map((icon) => (
                <SelectItem key={icon} value={icon}>
                  {icon.charAt(0).toUpperCase() + icon.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {decoration.type === 'text' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Font size ({decoration.fontSize}px)</Label>
          <Input
            type="range"
            min={8}
            max={48}
            value={decoration.fontSize}
            onChange={(e) => onPatch(decoration.id, { fontSize: Number(e.target.value) })}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Colour</Label>
        <div className="flex flex-wrap gap-1.5">
          {['#64748b', ...TIER_PALETTE].map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Use ${color}`}
              onClick={() => onPatch(decoration.id, { color })}
              className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: decoration.color === color ? 'currentColor' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs">
          <RotateCw className="h-3 w-3" /> Rotation ({Math.round(decoration.rotation)}°)
        </Label>
        <Input
          type="range"
          min={-180}
          max={180}
          value={decoration.rotation}
          onChange={(e) => onPatch(decoration.id, { rotation: Number(e.target.value) })}
        />
      </div>
    </div>
  )
}

function GroupSettings({
  element,
  onPatchElement,
  onGenerate,
  busy,
}: {
  element: LayoutElement
  onPatchElement: (id: number, patch: ElementPatch) => void
  onGenerate: (element: LayoutElement, rows: number, cols: number) => void
  busy?: boolean
}) {
  const [rows, setRows] = useState(element.config.rows ?? 5)
  const [cols, setCols] = useState(element.config.cols ?? 10)

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <p className="text-xs font-semibold">Rows and columns</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Rows</Label>
          <Input
            type="number"
            min={1}
            max={26}
            value={rows}
            onChange={(e) => setRows(Math.min(26, Math.max(1, Number(e.target.value) || 1)))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Seats per row</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={cols}
            onChange={(e) => setCols(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Seat gap</Label>
          <Input
            type="number"
            min={12}
            max={80}
            value={element.config.seat_gap ?? 24}
            onChange={(e) =>
              onPatchElement(element.id, {
                config: { ...element.config, seat_gap: Number(e.target.value) || 24 },
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Row gap</Label>
          <Input
            type="number"
            min={12}
            max={120}
            value={element.config.row_gap ?? 28}
            onChange={(e) =>
              onPatchElement(element.id, {
                config: { ...element.config, row_gap: Number(e.target.value) || 28 },
              })
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Row curve ({element.config.curve ?? 0})</Label>
        <Input
          type="range"
          min={0}
          max={40}
          value={element.config.curve ?? 0}
          onChange={(e) =>
            onPatchElement(element.id, {
              config: { ...element.config, curve: Number(e.target.value) },
            })
          }
        />
      </div>

      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={busy}
        onClick={() => onGenerate(element, rows, cols)}
      >
        {element.seats.length > 0 ? 'Rebuild seats' : 'Generate seats'}
      </Button>
      {element.seats.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Rebuilding keeps sold seats; it fails if the new layout would remove one.
        </p>
      )}
    </div>
  )
}

function TableSettings({
  element,
  onPatchElement,
  onRebuild,
  busy,
}: {
  element: LayoutElement
  onPatchElement: (id: number, patch: ElementPatch) => void
  onRebuild: (element: LayoutElement) => void
  busy?: boolean
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <p className="text-xs font-semibold">Table</p>

      <div className="space-y-1.5">
        <Label className="text-xs">Shape</Label>
        <Select
          value={element.config.shape ?? 'round'}
          onValueChange={(value) =>
            onPatchElement(element.id, {
              config: { ...element.config, shape: value as TableShape },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="round">Round</SelectItem>
            <SelectItem value="square">Square</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Seats</Label>
          <Input
            type="number"
            min={1}
            max={24}
            value={element.config.seat_count ?? 8}
            onChange={(e) =>
              onPatchElement(element.id, {
                config: {
                  ...element.config,
                  seat_count: Math.min(24, Math.max(1, Number(e.target.value) || 1)),
                },
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Radius</Label>
          <Input
            type="number"
            min={24}
            max={200}
            value={element.config.radius ?? 46}
            onChange={(e) =>
              onPatchElement(element.id, {
                config: { ...element.config, radius: Number(e.target.value) || 46 },
              })
            }
          />
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={busy}
        onClick={() => onRebuild(element)}
      >
        {element.seats.length > 0 ? 'Rebuild seats' : 'Place seats'}
      </Button>
    </div>
  )
}

function SeatProperties({
  seats,
  onAutoLabel,
  onRenameSeat,
  onSetSeatStatus,
  busy,
}: {
  seats: LayoutSeat[]
  onAutoLabel: (scheme: LabelScheme, prefix: string, start: number, reverse: boolean) => void
  onRenameSeat: (seatId: number, label: string) => void
  onSetSeatStatus: (status: 'available' | 'blocked') => void
  busy?: boolean
}) {
  const [scheme, setScheme] = useState<LabelScheme>('row_number')
  const [prefix, setPrefix] = useState('')
  const [start, setStart] = useState(1)
  const [reverse, setReverse] = useState(false)

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold">
        {seats.length} seat{seats.length === 1 ? '' : 's'} selected
      </p>

      {seats.length === 1 ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Seat label</Label>
          <Input
            value={seats[0].label}
            onChange={(e) => onRenameSeat(seats[0].id, e.target.value)}
          />
        </div>
      ) : (
        <p className="max-h-24 overflow-y-auto text-[11px] leading-relaxed text-muted-foreground">
          {seats.map((seat) => seat.label).join(', ')}
        </p>
      )}

      <div className="space-y-3 rounded-lg border border-border/60 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" /> Auto-label selection
        </p>

        <Select value={scheme} onValueChange={(value) => setScheme(value as LabelScheme)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LABEL_SCHEME_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Prefix</Label>
            <Input value={prefix} placeholder="none" onChange={(e) => setPrefix(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Start at</Label>
            <Input
              type="number"
              min={0}
              value={start}
              onChange={(e) => setStart(Number(e.target.value) || 1)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={reverse}
            onChange={(e) => setReverse(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border"
          />
          Number right to left
        </label>

        <Button
          type="button"
          size="sm"
          className="w-full"
          onClick={() => onAutoLabel(scheme, prefix, start, reverse)}
        >
          Apply labels
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={busy}
          onClick={() => onSetSeatStatus('blocked')}
        >
          <Ban className="mr-1.5 h-3.5 w-3.5" />
          Block
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={busy}
          onClick={() => onSetSeatStatus('available')}
        >
          <Unlock className="mr-1.5 h-3.5 w-3.5" />
          Unblock
        </Button>
      </div>
    </div>
  )
}
