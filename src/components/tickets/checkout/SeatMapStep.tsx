import { useMemo } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  PublicSeat,
  PublicSeatingMap,
  PublicSeatingSection,
} from '@/lib/api/publicSeating';
import { SeatingStage, type SeatRender } from '@/features/seating/render';
import { useCanvasViewport } from '@/features/seating/useCanvasViewport';
import { fromPublicMap, type LayoutElement, type LayoutSeat } from '@/features/seating/types';

interface SeatMapStepProps {
  map: PublicSeatingMap;
  /** Total seats the cart calls for. */
  requiredCount: number;
  /** Seats still to place per ticket type, keyed by ticket type id. */
  tierQuota: Record<number, number>;
  /** Used for sections with no ticket type when the event only sells one. */
  fallbackTicketTypeId?: number | null;
  selectedSeatIds: number[];
  onChange: (seatIds: number[], labels: string[]) => void;
  /** Quantity chosen per standing area, keyed by section id. */
  standingQty?: Record<number, number>;
  onStandingChange?: (next: Record<number, number>) => void;
  onBestAvailable?: (sectionId?: number) => Promise<void>;
  isBestAvailableLoading?: boolean;
  className?: string;
}

const SEAT_W = 18;
const SEAT_H = 20;
const COL_PITCH = 23;
const ROW_PITCH = 26;
const ROW_LABEL_W = 26;
const CURVE = 5;
const STAGE_H = 46;

const NEUTRAL_AVAILABLE = '#cbd5e1';
/** Used when the organizer never picked a colour for a tier. */
const TIER_PALETTE = [
  '#6366f1',
  '#0ea5e9',
  '#f97316',
  '#10b981',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#f43f5e',
];
const TAKEN = '#41505a';
const SELECTED = '#eab308';
const SELECTED_EDGE = '#ca8a04';

type SeatVisual = 'available' | 'taken' | 'selected';

interface PlacedSeat {
  seat: PublicSeat;
  section: PublicSeatingSection;
  col: number;
  visual: SeatVisual;
  selectable: boolean;
  /** Seat belongs to a tier the buyer did not choose. */
  otherTier: boolean;
}

interface PlacedRow {
  label: string;
  seats: PlacedSeat[];
}

function rowsOf(section: PublicSeatingSection): Array<{ row: string; seats: PublicSeat[] }> {
  if (section.rows?.length) return section.rows;
  const grouped = new Map<string, PublicSeat[]>();
  for (const seat of section.seats ?? []) {
    const key = seat.row_label ?? '';
    const bucket = grouped.get(key);
    if (bucket) bucket.push(seat);
    else grouped.set(key, [seat]);
  }
  return [...grouped.entries()].map(([row, seats]) => ({ row, seats }));
}

/**
 * Colour is per ticket type, not per section, so two blocks selling the same tier
 * read as one tier. Falls back to a stable palette slot when unset by the organizer.
 */
function buildAccents(sections: PublicSeatingSection[]): Map<number, string> {
  const byTier = new Map<string, string>();
  const bySection = new Map<number, string>();
  let next = 0;

  // Sections default to one shared colour server-side; that is indistinguishable from
  // "never chosen", so only honour explicit colours once they actually differ.
  const distinct = new Set(sections.map((s) => s.color).filter(Boolean));
  const useExplicit = distinct.size > 1;

  for (const section of sections) {
    const tier = section.ticket_type_id != null ? `t${section.ticket_type_id}` : `s${section.id}`;
    if (useExplicit && section.color) {
      bySection.set(section.id, section.color);
      if (!byTier.has(tier)) byTier.set(tier, section.color);
      continue;
    }
    let color = byTier.get(tier);
    if (!color) {
      color = TIER_PALETTE[next % TIER_PALETTE.length];
      next += 1;
      byTier.set(tier, color);
    }
    bySection.set(section.id, color);
  }

  return bySection;
}

/**
 * Tier colours for surfaces outside the map (ticket cards), so a tier looks the
 * same everywhere. Returns nothing for single-tier charts, which stay neutral.
 */
export function tierColorsByTicketType(
  sections: PublicSeatingSection[],
): Map<number, string> {
  const out = new Map<number, string>();
  const tierKeys = new Set(
    sections.map((s) => (s.ticket_type_id != null ? `t${s.ticket_type_id}` : `s${s.id}`)),
  );
  if (tierKeys.size < 2) return out;

  const accents = buildAccents(sections);
  for (const section of sections) {
    if (section.ticket_type_id == null) continue;
    const color = accents.get(section.id);
    if (color) out.set(section.ticket_type_id, color);
  }
  return out;
}

interface Tier {
  key: string;
  ticketTypeId: number | null;
  name: string;
  color: string;
  wanted: number;
  chosen: number;
}

function buildTiers(
  sections: PublicSeatingSection[],
  accents: Map<number, string>,
  tierQuota: Record<number, number>,
  chosenByTier: Map<number, number>,
  fallbackTicketTypeId: number | null | undefined,
): Tier[] {
  const out = new Map<string, Tier>();
  for (const section of sections) {
    const typeId = section.ticket_type_id ?? fallbackTicketTypeId ?? null;
    const key = typeId != null ? `t${typeId}` : `s${section.id}`;
    if (out.has(key)) continue;
    out.set(key, {
      key,
      ticketTypeId: typeId,
      name: section.ticket_type_name ?? section.name,
      color: accents.get(section.id) ?? NEUTRAL_AVAILABLE,
      wanted: typeId != null ? tierQuota[typeId] ?? 0 : 0,
      chosen: typeId != null ? chosenByTier.get(typeId) ?? 0 : 0,
    });
  }
  return [...out.values()];
}

/**
 * Every section lands on one shared chart. Sections that use distinct row letters
 * (VIP rows A–C, stalls D–J) share a column grid keyed by seat number so the rows
 * line up; sections that reuse the same row letters (left/right blocks) are given
 * their own column band separated by an aisle.
 */
function buildChart(
  sections: PublicSeatingSection[],
  selected: Set<number>,
  tierQuota: Record<number, number>,
  fallbackTicketTypeId: number | null | undefined,
) {
  const perSection = sections.map((section) => {
    const rows = rowsOf(section);
    const seats = rows.flatMap((r) => r.seats);
    return {
      section,
      rows,
      min: seats.reduce((m, s) => Math.min(m, s.seat_number), Number.POSITIVE_INFINITY),
      max: seats.reduce((m, s) => Math.max(m, s.seat_number), Number.NEGATIVE_INFINITY),
      rowLabels: new Set(rows.map((r) => r.row)),
    };
  });

  const seen = new Set<string>();
  let sharesRowLabels = false;
  for (const entry of perSection) {
    for (const label of entry.rowLabels) {
      if (seen.has(label)) sharesRowLabels = true;
      seen.add(label);
    }
  }

  const globalMin = perSection.reduce((m, e) => Math.min(m, e.min), Number.POSITIVE_INFINITY);
  const offsets = new Map<number, number>();
  let running = 0;
  for (const entry of perSection) {
    if (sharesRowLabels) {
      offsets.set(entry.section.id, running - entry.min);
      running += entry.max - entry.min + 2; // +1 column of aisle between blocks
    } else {
      offsets.set(entry.section.id, -globalMin);
    }
  }

  const byRow = new Map<string, PlacedSeat[]>();
  let maxCol = 0;

  // Count what is already placed per tier so a full tier stops accepting seats.
  const chosenByTier = new Map<number, number>();
  for (const { section, rows } of perSection) {
    const typeId = section.ticket_type_id ?? fallbackTicketTypeId ?? null;
    if (typeId == null) continue;
    for (const { seats } of rows) {
      for (const seat of seats) {
        if (selected.has(seat.id)) {
          chosenByTier.set(typeId, (chosenByTier.get(typeId) ?? 0) + 1);
        }
      }
    }
  }

  for (const { section, rows } of perSection) {
    const offset = offsets.get(section.id) ?? 0;
    const typeId = section.ticket_type_id ?? fallbackTicketTypeId ?? null;
    const wanted = typeId != null ? tierQuota[typeId] ?? 0 : 0;
    const typeAllowed = wanted > 0;
    const tierFull = wanted > 0 && (chosenByTier.get(typeId as number) ?? 0) >= wanted;

    for (const { row, seats } of rows) {
      const bucket = byRow.get(row) ?? [];
      for (const seat of seats) {
        const isSelected = selected.has(seat.id);
        const open = seat.status === 'available';
        const col = seat.seat_number + offset;
        maxCol = Math.max(maxCol, col);
        bucket.push({
          seat,
          section,
          col,
          visual: isSelected ? 'selected' : open ? 'available' : 'taken',
          selectable: isSelected || (open && typeAllowed && !tierFull),
          otherTier: !typeAllowed,
        });
      }
      byRow.set(row, bucket);
    }
  }

  const placedRows: PlacedRow[] = [...byRow.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([label, seats]) => ({
      label,
      seats: seats.sort((a, b) => a.col - b.col),
    }));

  const cols = maxCol + 1;

  return {
    rows: placedRows,
    cols,
    chosenByTier,
    width: ROW_LABEL_W * 2 + Math.max(cols, 1) * COL_PITCH,
    height: STAGE_H + placedRows.length * ROW_PITCH + 12,
  };
}

interface AuthoredSeat extends PlacedSeat {
  x: number;
  y: number;
  rotation: number;
}

/**
 * Charts drawn on uploaded venue artwork are rendered at their authored
 * coordinates so the map matches the artwork one-to-one.
 */
function buildAuthored(
  sections: PublicSeatingSection[],
  selected: Set<number>,
  tierQuota: Record<number, number>,
  fallbackTicketTypeId: number | null | undefined,
) {
  const chosenByTier = new Map<number, number>();
  const seatsOf = (section: PublicSeatingSection) =>
    section.seats ?? rowsOf(section).flatMap((r) => r.seats);

  for (const section of sections) {
    const typeId = section.ticket_type_id ?? fallbackTicketTypeId ?? null;
    if (typeId == null) continue;
    for (const seat of seatsOf(section)) {
      if (selected.has(seat.id)) {
        chosenByTier.set(typeId, (chosenByTier.get(typeId) ?? 0) + 1);
      }
    }
  }

  const placed: AuthoredSeat[] = [];
  let positioned = 0;
  let total = 0;

  for (const section of sections) {
    const typeId = section.ticket_type_id ?? fallbackTicketTypeId ?? null;
    const wanted = typeId != null ? tierQuota[typeId] ?? 0 : 0;
    const typeAllowed = wanted > 0;
    const tierFull = wanted > 0 && (chosenByTier.get(typeId as number) ?? 0) >= wanted;

    for (const seat of seatsOf(section)) {
      total += 1;
      if (seat.x == null || seat.y == null) continue;
      positioned += 1;
      const isSelected = selected.has(seat.id);
      const open = seat.status === 'available';
      placed.push({
        seat,
        section,
        col: seat.seat_number,
        x: seat.x,
        y: seat.y,
        rotation: seat.rotation ?? 0,
        visual: isSelected ? 'selected' : open ? 'available' : 'taken',
        selectable: isSelected || (open && typeAllowed && !tierFull),
        otherTier: !typeAllowed,
      });
    }
  }

  // A chart with no seats at all (standing only) is still authored geometry.
  return { seats: placed, chosenByTier, complete: positioned === total };
}

/** Rows wrap the stage: seats toward the aisles sit slightly closer to it. */
function curveOffset(col: number, cols: number): number {
  if (cols <= 1) return 0;
  const t = (col - (cols - 1) / 2) / ((cols - 1) / 2);
  return -CURVE * t * t;
}

function SeatGlyph({
  x = 0,
  y = 0,
  rotation = 0,
  visual,
  accent,
  selectable = false,
  dimmed = false,
  title,
  onClick,
}: {
  x?: number;
  y?: number;
  rotation?: number;
  visual: SeatVisual;
  accent: string;
  selectable?: boolean;
  dimmed?: boolean;
  title?: string;
  onClick?: () => void;
}) {
  const fill = visual === 'selected' ? SELECTED : visual === 'taken' ? TAKEN : accent;
  const stroke = visual === 'selected' ? SELECTED_EDGE : visual === 'taken' ? TAKEN : accent;
  // Available seats read as an outline tinted by their ticket type.
  const fillOpacity = visual === 'available' ? 0.22 : 1;

  return (
    <g
      transform={
        rotation
          ? `translate(${x}, ${y}) rotate(${rotation}, ${SEAT_W / 2}, ${SEAT_H / 2})`
          : `translate(${x}, ${y})`
      }
      opacity={dimmed ? 0.35 : 1}
      className={cn(selectable ? 'cursor-pointer hover:opacity-80' : onClick && 'cursor-not-allowed')}
      onClick={selectable ? onClick : undefined}
    >
      {title && <title>{title}</title>}
      <rect
        x={2}
        y={0}
        width={SEAT_W - 4}
        height={12}
        rx={3.5}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={1.2}
      />
      <rect
        x={0}
        y={12.5}
        width={SEAT_W}
        height={7}
        rx={2.5}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={1.2}
      />
    </g>
  );
}

function LegendGlyph({ visual, accent }: { visual: SeatVisual; accent: string }) {
  return (
    <svg width={16} height={18} viewBox={`0 0 ${SEAT_W} ${SEAT_H}`} aria-hidden>
      <SeatGlyph visual={visual} accent={accent} />
    </svg>
  );
}

export function SeatMapStep({
  map,
  requiredCount,
  tierQuota,
  fallbackTicketTypeId,
  selectedSeatIds,
  onChange,
  standingQty = {},
  onStandingChange,
  onBestAvailable,
  isBestAvailableLoading = false,
  className,
}: SeatMapStepProps) {
  const selected = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);
  const chart = map.chart;
  const sections = chart?.sections ?? [];

  const placed = useMemo(
    () => buildChart(sections, selected, tierQuota, fallbackTicketTypeId),
    [sections, selected, tierQuota, fallbackTicketTypeId],
  );
  const authored = useMemo(
    () => buildAuthored(sections, selected, tierQuota, fallbackTicketTypeId),
    [sections, selected, tierQuota, fallbackTicketTypeId],
  );
  // Only the authored layout can be trusted once every seat carries a position;
  // older charts fall back to the synthesized auditorium grid below.
  const useArtwork = authored.complete;
  const layout = useMemo(() => fromPublicMap(map), [map]);
  const authoredById = useMemo(() => {
    const out = new Map<number, (typeof authored.seats)[number]>();
    for (const entry of authored.seats) out.set(entry.seat.id, entry);
    return out;
  }, [authored.seats]);
  const viewport = useCanvasViewport({
    chartWidth: layout?.width ?? 1000,
    chartHeight: layout?.height ?? 800,
    panOnPlainDrag: true,
  });

  const accents = useMemo(() => buildAccents(sections), [sections]);
  const seatsByTier = useArtwork ? authored.chosenByTier : placed.chosenByTier;
  // Standing quantities fill the same per-tier quota as seats.
  const chosenByTier = useMemo(() => {
    const out = new Map(seatsByTier);
    for (const section of sections) {
      if (section.type !== 'standing') continue;
      const typeId = section.ticket_type_id ?? fallbackTicketTypeId ?? null;
      const quantity = standingQty[section.id] ?? 0;
      if (typeId == null || quantity < 1) continue;
      out.set(typeId, (out.get(typeId) ?? 0) + quantity);
    }
    return out;
  }, [seatsByTier, sections, standingQty, fallbackTicketTypeId]);
  const tiers = useMemo(
    () => buildTiers(sections, accents, tierQuota, chosenByTier, fallbackTicketTypeId),
    [sections, accents, tierQuota, chosenByTier, fallbackTicketTypeId],
  );

  const labelById = useMemo(() => {
    const out = new Map<number, string>();
    for (const section of sections) {
      for (const seat of section.seats ?? rowsOf(section).flatMap((r) => r.seats)) {
        out.set(seat.id, seat.label);
      }
    }
    return out;
  }, [sections]);

  if (!chart) {
    return (
      <p className="text-sm text-muted-foreground">
        Seat map is not published for this event yet.
      </p>
    );
  }

  const { rows, cols, width, height } = placed;
  const selectedLabels = selectedSeatIds.map((id) => labelById.get(id) ?? String(id));
  const multiTier = tiers.length > 1;
  const wantedTiers = tiers.filter((t) => t.wanted > 0);
  const accentForId = (sectionId: number) =>
    multiTier ? accents.get(sectionId) ?? NEUTRAL_AVAILABLE : NEUTRAL_AVAILABLE;
  const accentFor = (section: PublicSeatingSection) => accentForId(section.id);

  const toggleSeatId = (seatId: number) => {
    const isSelected = selected.has(seatId);
    if (!isSelected && selectedSeatIds.length >= requiredCount) return;
    const nextIds = isSelected
      ? selectedSeatIds.filter((id) => id !== seatId)
      : [...selectedSeatIds, seatId];
    onChange(
      nextIds,
      nextIds.map((id) => labelById.get(id) ?? String(id)),
    );
  };

  const toggle = (entry: PlacedSeat) => toggleSeatId(entry.seat.id);

  const standingSections = sections.filter((section) => section.type === 'standing');
  const setStanding = (sectionId: number, quantity: number) => {
    if (!onStandingChange) return;
    const next = { ...standingQty };
    if (quantity <= 0) delete next[sectionId];
    else next[sectionId] = quantity;
    onStandingChange(next);
  };

  /** Buyer seat states come from the same pass that counts tier quotas. */
  const seatRender = (element: LayoutElement, seat: LayoutSeat): SeatRender => {
    const info = authoredById.get(seat.id);
    const accent = accentForId(element.id);
    if (!info) {
      return { visual: 'taken', accent, title: `${seat.label} · unavailable` };
    }
    return {
      visual: info.visual,
      accent,
      selectable: info.selectable,
      dimmed: info.otherTier,
      title: info.otherTier
        ? `${seat.label} · ${element.name} · not in your order`
        : `${seat.label} · ${element.name} · ${info.seat.status}`,
    };
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <LegendGlyph visual="available" accent={NEUTRAL_AVAILABLE} /> Available
        </span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <LegendGlyph visual="taken" accent={TAKEN} /> Unavailable
        </span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <LegendGlyph visual="selected" accent={SELECTED} /> Selected
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {wantedTiers.map((tier) => {
          const done = tier.chosen >= tier.wanted;
          return (
            <span
              key={tier.key}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                done
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-border/60 bg-muted/40 text-muted-foreground',
              )}
            >
              <LegendGlyph visual="available" accent={tier.color} />
              <span className="font-medium">{tier.name}</span>
              <span className="tabular-nums">
                {tier.chosen}/{tier.wanted}
              </span>
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-primary">
          {selectedLabels.length > 0 ? (
            <>
              Selected seats: <span className="font-semibold">{selectedLabels.join(', ')}</span>
            </>
          ) : (
            <span className="text-muted-foreground">
              Choose {requiredCount} seat{requiredCount === 1 ? '' : 's'}
            </span>
          )}
        </p>
        {onBestAvailable && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isBestAvailableLoading}
            onClick={() => void onBestAvailable()}
          >
            {isBestAvailableLoading ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-3.5 w-3.5" />
            )}
            Best available
          </Button>
        )}
      </div>

      {useArtwork && layout ? (
        <div className="relative">
          <SeatingStage
            chart={layout}
            viewport={viewport}
            seatRender={seatRender}
            elementAccent={(element) => accentForId(element.id)}
            svgClassName="max-h-[64vh]"
            onSeatClick={(_element, seat) => {
              const info = authoredById.get(seat.id);
              if (info?.selectable) toggleSeatId(seat.id);
            }}
            onSeatPointerDown={(_element, _seat, event) => {
              // Keep a seat tap from turning into a pan gesture.
              event.stopPropagation();
            }}
          />

          <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur">
            {Math.round(viewport.viewport.scale * 100)}% · drag to pan, scroll to zoom
          </div>

          <div className="absolute bottom-2 right-2 flex gap-1">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={viewport.zoomOut}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/90 text-sm backdrop-blur"
            >
              −
            </button>
            <button
              type="button"
              aria-label="Reset zoom"
              onClick={viewport.fit}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/90 text-sm backdrop-blur"
            >
              ⤢
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={viewport.zoomIn}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/90 text-sm backdrop-blur"
            >
              +
            </button>
          </div>
        </div>
      ) : (
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto block h-auto w-full"
          style={{ minWidth: Math.min(width, 560), maxWidth: width }}
        >
          <path
            d={`M ${width * 0.34} 0 H ${width * 0.66} L ${width * 0.72} 26 H ${width * 0.28} Z`}
            fill="#e5e7eb"
          />
          <text
            x={width / 2}
            y={17}
            textAnchor="middle"
            className="fill-slate-600 text-[11px] font-semibold tracking-[0.18em]"
          >
            STAGE
          </text>

          {rows.map((row, rowIdx) => {
            const baseY = STAGE_H + rowIdx * ROW_PITCH;
            return (
              <g key={row.label || rowIdx}>
                <text
                  x={ROW_LABEL_W - 10}
                  y={baseY + 14}
                  textAnchor="end"
                  className="fill-primary text-[11px] font-medium"
                >
                  {row.label}
                </text>
                {row.seats.map((entry) => (
                  <SeatGlyph
                    key={entry.seat.id}
                    x={ROW_LABEL_W + entry.col * COL_PITCH}
                    y={baseY + curveOffset(entry.col, cols)}
                    visual={entry.visual}
                    accent={accentFor(entry.section)}
                    selectable={entry.selectable}
                    dimmed={entry.otherTier}
                    title={
                      entry.otherTier
                        ? `${entry.seat.label} · ${entry.section.name} · not in your order`
                        : `${entry.seat.label} · ${entry.section.name} · ${entry.seat.status}`
                    }
                    onClick={() => toggle(entry)}
                  />
                ))}
                <text
                  x={width - ROW_LABEL_W + 10}
                  y={baseY + 14}
                  textAnchor="start"
                  className="fill-primary text-[11px] font-medium"
                >
                  {row.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      )}

      {standingSections.length > 0 && onStandingChange && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Standing areas</p>
          {standingSections.map((section) => {
            const typeId = section.ticket_type_id ?? fallbackTicketTypeId ?? null;
            const wanted = typeId != null ? tierQuota[typeId] ?? 0 : 0;
            const chosen = typeId != null ? chosenByTier.get(typeId) ?? 0 : 0;
            const quantity = standingQty[section.id] ?? 0;
            const remainingQuota = Math.max(0, wanted - (chosen - quantity));
            const available = section.available ?? section.capacity ?? 0;
            const max = Math.min(remainingQuota, available);

            return (
              <div
                key={section.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{section.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {section.ticket_type_name ?? 'Any ticket type'} · {available} left
                    {wanted === 0 && ' · not in your order'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    aria-label={`Remove one from ${section.name}`}
                    disabled={quantity === 0}
                    onClick={() => setStanding(section.id, quantity - 1)}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    aria-label={`Add one to ${section.name}`}
                    disabled={quantity >= max}
                    onClick={() => setStanding(section.id, quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
