import { useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createDecoration,
  createSeatingSection,
  deleteDecoration,
  deleteSeatingSection,
  generateSectionSeats,
  generateTableSeats,
  updateSeatsStatus,
  type DecorationType,
  type OrganizerSeatingChart,
} from '@/lib/api/seating'
import type { TicketType } from '@/types'
import { DesignerCanvas } from './DesignerCanvas'
import { DesignerToolbar } from './DesignerToolbar'
import { ElementsPanel } from './ElementsPanel'
import { PropertyPanel } from './PropertyPanel'
import { autoLabel, type LabelScheme } from './labeling'
import { fromOrganizerChart, type LayoutElement, type SeatingElementType } from './types'
import {
  useSeatingDesigner,
  type DecorationPatch,
  type ElementPatch,
} from './useSeatingDesigner'
import { TIER_PALETTE } from './render'

interface SeatingDesignerProps {
  eventId: number
  chart: OrganizerSeatingChart
  ticketTypes: TicketType[]
  onChartChanged: () => void
}

const INSERT_DEFAULTS: Record<SeatingElementType, { name: string; width?: number; height?: number }> = {
  seating_group: { name: 'New block' },
  table: { name: 'Table' },
  standing: { name: 'Standing area', width: 240, height: 160 },
}

export function SeatingDesigner({
  eventId,
  chart,
  ticketTypes,
  onChartChanged,
}: SeatingDesignerProps) {
  const layout = useMemo(() => fromOrganizerChart(chart), [chart])
  const { state, dispatch, snapValue, hasPending, canUndo, canRedo } = useSeatingDesigner({
    eventId,
    chart: layout,
    onSaveError: () => toast.error('Could not save the layout — retrying on your next change'),
  })

  const selectedSeats = useMemo(() => {
    const ids = new Set(state.selectedSeatIds)
    return state.chart.elements.flatMap((element) =>
      element.seats.filter((seat) => ids.has(seat.id)),
    )
  }, [state.chart.elements, state.selectedSeatIds])

  const selectedElement =
    state.selectedElementIds.length === 1
      ? state.chart.elements.find((element) => element.id === state.selectedElementIds[0]) ?? null
      : null

  const createMutation = useMutation({
    mutationFn: async (type: SeatingElementType) => {
      const defaults = INSERT_DEFAULTS[type]
      const count = state.chart.elements.length
      return createSeatingSection(eventId, {
        name: `${defaults.name} ${count + 1}`,
        type,
        // Stagger inserts so a new element never lands exactly on the last one.
        x: 80 + (count % 4) * 60,
        y: 80 + Math.floor(count / 4) * 60,
        width: defaults.width ?? null,
        height: defaults.height ?? null,
        color: TIER_PALETTE[count % TIER_PALETTE.length],
        z_index: count,
        sort_order: count,
        capacity: type === 'standing' ? 50 : null,
        config:
          type === 'table'
            ? { shape: 'round', seat_count: 8, radius: 46 }
            : type === 'seating_group'
              ? { rows: 5, cols: 10, seat_gap: 24, row_gap: 28 }
              : {},
      })
    },
    onSuccess: () => {
      onChartChanged()
      toast.success('Element added')
    },
    onError: () => toast.error('Could not add that element'),
  })

  const deleteMutation = useMutation({
    mutationFn: (sectionId: number) => deleteSeatingSection(eventId, sectionId),
    onSuccess: (_data, sectionId) => {
      dispatch({ type: 'removeElement', id: sectionId })
      onChartChanged()
      toast.success('Element removed')
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.error ?? 'Could not remove that element'),
  })

  const generateMutation = useMutation({
    mutationFn: ({
      element,
      rows,
      cols,
    }: {
      element: LayoutElement
      rows: number
      cols: number
    }) =>
      generateSectionSeats(eventId, element.id, {
        row_start: 'A',
        row_end: String.fromCharCode(64 + Math.min(26, Math.max(1, rows))),
        seats_per_row: cols,
        origin_x: 0,
        origin_y: 0,
        seat_gap: element.config.seat_gap ?? 24,
        row_gap: element.config.row_gap ?? 28,
        curve: element.config.curve ?? 0,
        replace: true,
      }),
    onSuccess: (_data, variables) => {
      dispatch({
        type: 'patchElement',
        id: variables.element.id,
        patch: { config: { ...variables.element.config, rows: variables.rows, cols: variables.cols } },
      })
      onChartChanged()
      toast.success('Seats generated')
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.error ?? 'Could not generate seats'),
  })

  const tableMutation = useMutation({
    mutationFn: (element: LayoutElement) =>
      generateTableSeats(eventId, element.id, {
        seat_count: element.config.seat_count ?? 8,
        shape: element.config.shape ?? 'round',
        radius: element.config.radius ?? 46,
      }),
    onSuccess: () => {
      onChartChanged()
      toast.success('Table seats placed')
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.error ?? 'Could not place table seats'),
  })

  const decorationMutation = useMutation({
    mutationFn: (type: DecorationType) => {
      const count = state.chart.decorations.length
      return createDecoration(eventId, {
        type,
        label: type === 'text' ? 'Label' : 'Entrance',
        icon: type === 'poi' ? 'entrance' : null,
        x: 120 + (count % 5) * 50,
        y: 120 + Math.floor(count / 5) * 50,
        z_index: 100 + count,
      })
    },
    onSuccess: () => {
      onChartChanged()
    },
    onError: () => toast.error('Could not add that element'),
  })

  const removeDecorationMutation = useMutation({
    mutationFn: (elementId: number) => deleteDecoration(eventId, elementId),
    onSuccess: (_data, elementId) => {
      dispatch({ type: 'removeDecoration', id: elementId })
      onChartChanged()
    },
    onError: () => toast.error('Could not remove that element'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: 'available' | 'blocked' }) =>
      updateSeatsStatus(eventId, ids, status),
    onSuccess: (_data, variables) => {
      dispatch({ type: 'patchSeats', ids: variables.ids, patch: { status: variables.status } })
      onChartChanged()
    },
    onError: () => toast.error('Could not update those seats'),
  })

  const patchElement = (id: number, patch: ElementPatch) =>
    dispatch({ type: 'patchElement', id, patch })

  const patchDecoration = (id: number, patch: DecorationPatch) =>
    dispatch({ type: 'patchDecoration', id, patch })

  const selectedDecoration =
    state.selectedDecorationIds.length === 1
      ? state.chart.decorations.find((d) => d.id === state.selectedDecorationIds[0]) ?? null
      : null

  const handleAutoLabel = (
    scheme: LabelScheme,
    prefix: string,
    start: number,
    reverse: boolean,
  ) => {
    const labels = autoLabel(selectedSeats, { scheme, prefix, start, reverse })
    dispatch({ type: 'labelSeats', labels })
    toast.success(`Relabelled ${Object.keys(labels).length} seats`)
  }

  const busy =
    createMutation.isPending ||
    generateMutation.isPending ||
    tableMutation.isPending ||
    statusMutation.isPending

  return (
    <div className="space-y-3">
      <DesignerToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        snapEnabled={state.snapEnabled}
        showGrid={state.showGrid}
        saving={hasPending}
        isCreating={createMutation.isPending || decorationMutation.isPending}
        onInsert={(type) => createMutation.mutate(type)}
        onInsertDecoration={(type) => decorationMutation.mutate(type)}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        onToggleSnap={() => dispatch({ type: 'toggleSnap' })}
        onToggleGrid={() => dispatch({ type: 'toggleGrid' })}
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <DesignerCanvas
          state={state}
          chart={state.chart}
          snapValue={snapValue}
          onSelectElements={(ids, additive) => dispatch({ type: 'selectElements', ids, additive })}
          onSelectSeats={(ids, additive) => dispatch({ type: 'selectSeats', ids, additive })}
          onClearSelection={() => dispatch({ type: 'clearSelection' })}
          onMoveElements={(ids, dx, dy, commit) =>
            dispatch({ type: 'moveElements', ids, dx, dy, commit })
          }
          onMoveSeats={(ids, dx, dy, commit) =>
            dispatch({ type: 'moveSeats', ids, dx, dy, commit })
          }
          onSelectDecorations={(ids, additive) =>
            dispatch({ type: 'selectDecorations', ids, additive })
          }
          onMoveDecorations={(ids, dx, dy, commit) =>
            dispatch({ type: 'moveDecorations', ids, dx, dy, commit })
          }
          onRotateElement={(id, rotation) => patchElement(id, { rotation })}
          onResizeElement={(id, size) => {
            const element = state.chart.elements.find((e) => e.id === id)
            if (!element) return
            if (size.radius != null) {
              patchElement(id, { config: { ...element.config, radius: size.radius } })
              return
            }
            patchElement(id, { width: size.width ?? null, height: size.height ?? null })
          }}
          onUndo={() => dispatch({ type: 'undo' })}
          onRedo={() => dispatch({ type: 'redo' })}
        />

        <div className="space-y-4 rounded-xl border border-border bg-card/50 p-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Elements
            </p>
            <ElementsPanel
              elements={state.chart.elements}
              selectedIds={state.selectedElementIds}
              onSelect={(id, additive) =>
                dispatch({ type: 'selectElements', ids: [id], additive })
              }
              onChangeZ={(id, direction) => {
                const element = state.chart.elements.find((e) => e.id === id)
                if (element) patchElement(id, { zIndex: element.zIndex + direction })
              }}
              onDelete={(element) => deleteMutation.mutate(element.id)}
              deletingId={deleteMutation.isPending ? deleteMutation.variables : null}
              decorations={state.chart.decorations}
              selectedDecorationIds={state.selectedDecorationIds}
              onSelectDecoration={(id, additive) =>
                dispatch({ type: 'selectDecorations', ids: [id], additive })
              }
              onDeleteDecoration={(decoration) =>
                removeDecorationMutation.mutate(decoration.id)
              }
            />
          </div>

          <div className="space-y-2 border-t border-border/60 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Properties
            </p>
            <PropertyPanel
              element={selectedElement}
              selectedSeats={selectedSeats}
              decoration={selectedDecoration}
              onPatchDecoration={patchDecoration}
              ticketTypes={ticketTypes}
              onPatchElement={patchElement}
              onGenerateGrid={(element, rows, cols) =>
                generateMutation.mutate({ element, rows, cols })
              }
              onRebuildTable={(element) => tableMutation.mutate(element)}
              onAutoLabel={handleAutoLabel}
              onRenameSeat={(seatId, label) =>
                dispatch({ type: 'patchSeats', ids: [seatId], patch: { label } })
              }
              onSetSeatStatus={(status) =>
                statusMutation.mutate({ ids: state.selectedSeatIds, status })
              }
              busy={busy}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
