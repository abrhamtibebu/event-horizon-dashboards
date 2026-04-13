import api from '@/lib/api'

export interface AdSlot {
  id: number
  key: string
  label: string
  width_hint: number | null
  height_hint: number | null
  active: boolean
}

export interface AdCreative {
  id: number
  ad_slot_id: number
  image_path: string | null
  external_image_url: string | null
  target_url: string
  alt_text: string | null
  start_at: string | null
  end_at: string | null
  priority: number
  active: boolean
  slot?: AdSlot
}

export interface SponsoredPlacementRow {
  id: number
  placement_key: string
  event_id: number
  start_at: string | null
  end_at: string | null
  sort_order: number
  active: boolean
  event?: { id: number; uuid: string; name: string; visibility: string; status: string }
}

export async function fetchAdSlots(): Promise<AdSlot[]> {
  const { data } = await api.get<{ data: AdSlot[] }>('/admin/advertising/slots')
  return data.data
}

export interface DisplaySlotPreset {
  key: string
  label: string
  width_hint: number | null
  height_hint: number | null
}

export interface SponsoredPlacementPreset {
  key: string
  label: string
  description: string
}

export interface AdCreativeRulesPayload {
  formats_note: string
  allowed_extensions: string[]
  canonical_sizes: { width: number; height: number; name: string }[]
}

export async function fetchAdvertisingPresetCatalog(): Promise<{
  display_slots: DisplaySlotPreset[]
  sponsored_placements: SponsoredPlacementPreset[]
  ad_creative_rules?: AdCreativeRulesPayload
}> {
  const { data } = await api.get<{
    display_slots: DisplaySlotPreset[]
    sponsored_placements: SponsoredPlacementPreset[]
    ad_creative_rules?: AdCreativeRulesPayload
  }>('/admin/advertising/preset-catalog')
  return data
}

export async function syncAdSlotPresets(): Promise<{
  message: string
  new_slots_created: number
  total_slots: number
}> {
  const { data } = await api.post('/admin/advertising/slots/sync-presets')
  return data
}

export async function createAdSlot(body: {
  key: string
  label: string
  width_hint: number
  height_hint: number
  active?: boolean
}): Promise<AdSlot> {
  const { data } = await api.post('/admin/advertising/slots', body)
  return data
}

export async function updateAdSlot(
  id: number,
  body: Partial<Pick<AdSlot, 'label' | 'width_hint' | 'height_hint' | 'active'>>,
): Promise<AdSlot> {
  const { data } = await api.put(`/admin/advertising/slots/${id}`, body)
  return data
}

export async function deleteAdSlot(id: number): Promise<void> {
  await api.delete(`/admin/advertising/slots/${id}`)
}

export async function fetchAdCreatives(params?: {
  ad_slot_id?: number
  page?: number
}): Promise<{ items: AdCreative[]; meta: Record<string, unknown> }> {
  const { data } = await api.get('/admin/advertising/creatives', { params })
  const paginator = data.data
  return {
    items: paginator.data ?? [],
    meta: paginator,
  }
}

export async function createAdCreative(payload: FormData): Promise<AdCreative> {
  const { data } = await api.post('/admin/advertising/creatives', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function updateAdCreativeJson(
  id: number,
  body: Record<string, unknown>,
): Promise<AdCreative> {
  const { data } = await api.put(`/admin/advertising/creatives/${id}`, body)
  return data
}

export async function updateAdCreativeMultipart(
  id: number,
  payload: FormData,
): Promise<AdCreative> {
  const { data } = await api.put(`/admin/advertising/creatives/${id}`, payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deleteAdCreative(id: number): Promise<void> {
  await api.delete(`/admin/advertising/creatives/${id}`)
}

export async function fetchSponsoredPlacements(params?: {
  placement_key?: string
  page?: number
}): Promise<{ items: SponsoredPlacementRow[]; meta: Record<string, unknown> }> {
  const { data } = await api.get('/admin/advertising/placements', { params })
  const paginator = data.data
  return {
    items: paginator.data ?? [],
    meta: paginator,
  }
}

export async function createSponsoredPlacement(body: {
  placement_key: string
  event_id: number
  start_at?: string | null
  end_at?: string | null
  sort_order?: number
  active?: boolean
}): Promise<SponsoredPlacementRow> {
  const { data } = await api.post('/admin/advertising/placements', body)
  return data
}

export async function updateSponsoredPlacement(
  id: number,
  body: Partial<{
    placement_key: string
    event_id: number
    start_at: string | null
    end_at: string | null
    sort_order: number
    active: boolean
  }>,
): Promise<SponsoredPlacementRow> {
  const { data } = await api.put(`/admin/advertising/placements/${id}`, body)
  return data
}

export async function deleteSponsoredPlacement(id: number): Promise<void> {
  await api.delete(`/admin/advertising/placements/${id}`)
}

export async function fetchAdMetricsSummary(from: string, to: string) {
  const { data } = await api.get('/admin/advertising/metrics/summary', {
    params: { from, to },
  })
  return data as {
    from: string
    to: string
    impressions_by_day: { placement_key: string; day: string; c: number }[]
    clicks_by_day: { placement_key: string; day: string; c: number }[]
  }
}
