import api from '@/lib/api';

export type SeatStatus = 'available' | 'held' | 'sold' | 'blocked';

export interface PublicSeat {
  id: number;
  label: string;
  row_label?: string;
  seat_number: number;
  x?: number | null;
  y?: number | null;
  rotation?: number;
  status: SeatStatus;
}

export interface PublicSeatingSection {
  id: number;
  name: string;
  type?: 'seating_group' | 'standing' | 'table';
  ticket_type_id: number | null;
  ticket_type_name?: string | null;
  color?: string;
  path?: string | null;
  label_x?: number | null;
  label_y?: number | null;
  /** Element origin on the chart; seat x/y are offsets from here. */
  x?: number;
  y?: number;
  width?: number | null;
  height?: number | null;
  rotation?: number;
  z_index?: number;
  capacity?: number | null;
  /** Spots left in a standing area: capacity minus sold minus live holds. */
  available?: number | null;
  config?: {
    rows?: number;
    cols?: number;
    seat_gap?: number;
    row_gap?: number;
    curve?: number;
    shape?: 'round' | 'square';
    seat_count?: number;
    radius?: number;
  } | null;
  seats?: PublicSeat[];
  rows: Array<{ row: string; seats: PublicSeat[] }>;
}

/** Wayfinding markers and labels drawn on the map; not sellable. */
export interface PublicDecoration {
  id: number;
  type: 'poi' | 'text' | 'shape';
  label?: string | null;
  icon?: string | null;
  x: number;
  y: number;
  width?: number | null;
  height?: number | null;
  rotation?: number;
  z_index?: number;
  color?: string;
  font_size?: number;
}

export interface PublicSeatingMap {
  seating_mode: 'general_admission' | 'reserved_seating';
  chart: {
    id: number;
    name: string;
    width?: number;
    height?: number;
    background_url?: string | null;
    grid_size?: number;
    sections: PublicSeatingSection[];
    elements?: PublicDecoration[];
  } | null;
}

export async function fetchPublicSeatingMap(uuid: string): Promise<PublicSeatingMap> {
  const { data } = await api.get(`/guest/events/${uuid}/seating`);
  return data;
}

export async function reserveSeats(payload: {
  event_uuid: string;
  seat_ids: number[];
  /** Capacity-based holds for standing areas, which have no individual seats. */
  standing?: Array<{ section_id: number; quantity: number }>;
  tickets: Array<{ ticket_type_id: number; quantity: number }>;
  reservation_token?: string;
}): Promise<{ reservation_token: string; expires_at: string; seat_ids: number[] }> {
  const { data } = await api.post('/guest/tickets/reserve-seats', payload);
  return data;
}

export async function releaseSeats(reservation_token: string): Promise<void> {
  await api.post('/guest/tickets/release-seats', { reservation_token });
}

/**
 * Fire-and-forget release for page unload, where a normal request would be cancelled.
 * Falls back to a keepalive fetch when sendBeacon is unavailable.
 */
export function releaseSeatsOnUnload(reservation_token: string): void {
  const base = (api.defaults.baseURL ?? '').replace(/\/$/, '');
  const url = `${base}/guest/tickets/release-seats`;
  const body = JSON.stringify({ reservation_token });

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(url, blob)) return;
  }

  void fetch(url, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  }).catch(() => {});
}

export async function fetchBestAvailable(payload: {
  event_uuid: string;
  tickets: Array<{ ticket_type_id: number; quantity: number }>;
  section_id?: number;
}): Promise<{ seat_ids: number[]; labels: string[] }> {
  const { data } = await api.post('/guest/tickets/best-available', payload);
  return data;
}
