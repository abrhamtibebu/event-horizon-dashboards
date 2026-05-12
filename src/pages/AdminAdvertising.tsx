import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Sparkles,
  ImageIcon,
  Link2,
  ChevronDown,
  LayoutTemplate,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  fetchAdSlots,
  fetchAdCreatives,
  fetchSponsoredPlacements,
  createAdSlot,
  updateAdSlot,
  deleteAdSlot,
  createAdCreative,
  updateAdCreativeJson,
  updateAdCreativeMultipart,
  deleteAdCreative,
  createSponsoredPlacement,
  updateSponsoredPlacement,
  deleteSponsoredPlacement,
  fetchAdMetricsSummary,
  fetchAdvertisingPresetCatalog,
  syncAdSlotPresets,
  type AdSlot,
  type AdCreative,
  type SponsoredPlacementRow,
} from '@/lib/api/ads'
import { groupIndex, slotUiGroup } from '@/lib/adSlotUi'
import {
  AD_IMAGE_ACCEPT,
  CANONICAL_AD_SIZES,
  formatSizeLine,
  validateAdImageFileForSlot,
  validateAdImageUrlForSlot,
} from '@/lib/adCreativeSpec'

function normalizeClickUrl(input: string): string {
  const t = input.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

function normalizeImageUrl(input: string): string {
  const t = input.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

function advertisingApiError(e: unknown): string {
  const err = e as {
    response?: {
      data?: { error?: string; message?: string; errors?: Record<string, string[] | string> }
    }
  }
  const d = err.response?.data
  if (!d) return 'Request failed'
  if (typeof d.error === 'string' && d.error) return d.error
  if (typeof d.message === 'string' && d.message) return d.message
  if (d.errors && typeof d.errors === 'object') {
    for (const v of Object.values(d.errors)) {
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
      if (typeof v === 'string') return v
    }
  }
  return 'Save failed'
}

export default function AdminAdvertisingPage() {
  const [slots, setSlots] = useState<AdSlot[]>([])
  const [creatives, setCreatives] = useState<AdCreative[]>([])
  const [placements, setPlacements] = useState<SponsoredPlacementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [slotDialog, setSlotDialog] = useState(false)
  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null)
  const [newSlot, setNewSlot] = useState({ key: '', label: '', width_hint: '', height_hint: '' })
  const [creativeDialog, setCreativeDialog] = useState(false)
  const [editingCreative, setEditingCreative] = useState<AdCreative | null>(null)
  const [creativeForm, setCreativeForm] = useState({
    ad_slot_id: '',
    target_url: '',
    external_image_url: '',
    alt_text: '',
    start_at: '',
    end_at: '',
    priority: '0',
    active: true,
  })
  const [creativeFile, setCreativeFile] = useState<File | null>(null)
  const [placementDialog, setPlacementDialog] = useState(false)
  const [editingPlacement, setEditingPlacement] = useState<SponsoredPlacementRow | null>(null)
  const [placementForm, setPlacementForm] = useState({
    placement_key: 'home_carousel',
    event_id: '',
    start_at: '',
    end_at: '',
    sort_order: '0',
    active: true,
  })
  const [metricsFrom, setMetricsFrom] = useState(format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd'))
  const [metricsTo, setMetricsTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof fetchAdMetricsSummary>> | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [catalog, setCatalog] = useState<Awaited<
    ReturnType<typeof fetchAdvertisingPresetCatalog>
  > | null>(null)
  const [syncingPresets, setSyncingPresets] = useState(false)

  const [easyDialogOpen, setEasyDialogOpen] = useState(false)
  const [easySlotId, setEasySlotId] = useState('')
  const [easyImageUrl, setEasyImageUrl] = useState('')
  const [easyTargetUrl, setEasyTargetUrl] = useState('https://')
  const [easyAlt, setEasyAlt] = useState('')
  const [easyFile, setEasyFile] = useState<File | null>(null)
  const [easySaving, setEasySaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cat, s, c, p] = await Promise.all([
        fetchAdvertisingPresetCatalog().catch(() => null),
        fetchAdSlots(),
        fetchAdCreatives({ page: 1 }).then((r) => r.items),
        fetchSponsoredPlacements({ page: 1 }).then((r) => r.items),
      ])
      if (cat) setCatalog(cat)
      setSlots(s)
      setCreatives(c)
      setPlacements(p)
    } catch (e: unknown) {
      toast.error('Failed to load advertising data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openNewCreative = () => {
    setEditingCreative(null)
    setCreativeForm({
      ad_slot_id: slots[0]?.id ? String(slots[0].id) : '',
      target_url: 'https://',
      external_image_url: '',
      alt_text: '',
      start_at: '',
      end_at: '',
      priority: '0',
      active: true,
    })
    setCreativeFile(null)
    setCreativeDialog(true)
  }

  const openEditCreative = (c: AdCreative) => {
    setEditingCreative(c)
    setCreativeForm({
      ad_slot_id: String(c.ad_slot_id),
      target_url: c.target_url,
      external_image_url: c.external_image_url || '',
      alt_text: c.alt_text || '',
      start_at: c.start_at ? c.start_at.slice(0, 16) : '',
      end_at: c.end_at ? c.end_at.slice(0, 16) : '',
      priority: String(c.priority),
      active: c.active,
    })
    setCreativeFile(null)
    setCreativeDialog(true)
  }

  const saveCreative = async () => {
    const selectedSlot = slots.find((s) => String(s.id) === creativeForm.ad_slot_id)
    const sw = selectedSlot?.width_hint ?? null
    const sh = selectedSlot?.height_hint ?? null

    if (creativeFile) {
      const v = await validateAdImageFileForSlot(creativeFile, sw, sh)
      if (!v.ok) {
        toast.error(v.error)
        return
      }
    } else if (creativeForm.external_image_url.trim()) {
      const urlChanged =
        !editingCreative ||
        creativeForm.external_image_url.trim() !== (editingCreative.external_image_url || '').trim()
      if (urlChanged || !editingCreative) {
        const v = await validateAdImageUrlForSlot(creativeForm.external_image_url, sw, sh)
        if (!v.ok) {
          toast.error(v.error)
          return
        }
      }
    } else if (!editingCreative) {
      toast.error('Upload a JPEG, PNG, or GIF file, or provide an image URL with exact slot dimensions.')
      return
    }

    try {
      if (editingCreative) {
        if (creativeFile) {
          const fd = new FormData()
          fd.append('ad_slot_id', creativeForm.ad_slot_id)
          fd.append('target_url', creativeForm.target_url)
          if (creativeForm.external_image_url) fd.append('external_image_url', creativeForm.external_image_url)
          if (creativeForm.alt_text) fd.append('alt_text', creativeForm.alt_text)
          if (creativeForm.start_at) fd.append('start_at', creativeForm.start_at)
          if (creativeForm.end_at) fd.append('end_at', creativeForm.end_at)
          fd.append('priority', creativeForm.priority)
          fd.append('active', creativeForm.active ? '1' : '0')
          fd.append('image', creativeFile)
          await updateAdCreativeMultipart(editingCreative.id, fd)
        } else {
          await updateAdCreativeJson(editingCreative.id, {
            ad_slot_id: Number(creativeForm.ad_slot_id),
            target_url: creativeForm.target_url,
            external_image_url: creativeForm.external_image_url || null,
            alt_text: creativeForm.alt_text || null,
            start_at: creativeForm.start_at || null,
            end_at: creativeForm.end_at || null,
            priority: Number(creativeForm.priority),
            active: creativeForm.active,
          })
        }
        toast.success('Creative updated')
      } else {
        const fd = new FormData()
        fd.append('ad_slot_id', creativeForm.ad_slot_id)
        fd.append('target_url', creativeForm.target_url)
        if (creativeForm.external_image_url) fd.append('external_image_url', creativeForm.external_image_url)
        if (creativeForm.alt_text) fd.append('alt_text', creativeForm.alt_text)
        if (creativeForm.start_at) fd.append('start_at', creativeForm.start_at)
        if (creativeForm.end_at) fd.append('end_at', creativeForm.end_at)
        fd.append('priority', creativeForm.priority)
        fd.append('active', creativeForm.active ? '1' : '0')
        if (creativeFile) fd.append('image', creativeFile)
        await createAdCreative(fd)
        toast.success('Creative created')
      }
      setCreativeDialog(false)
      load()
    } catch (e: unknown) {
      toast.error(advertisingApiError(e))
    }
  }

  const defaultSponsoredKey =
    catalog?.sponsored_placements[0]?.key ?? 'home_carousel'

  const openNewPlacement = () => {
    setEditingPlacement(null)
    setPlacementForm({
      placement_key: defaultSponsoredKey,
      event_id: '',
      start_at: '',
      end_at: '',
      sort_order: '0',
      active: true,
    })
    setPlacementDialog(true)
  }

  const handleSyncPresets = async () => {
    setSyncingPresets(true)
    try {
      const res = await syncAdSlotPresets()
      toast.success(
        res.new_slots_created
          ? `Added ${res.new_slots_created} new slot(s). Total: ${res.total_slots}.`
          : `All ${res.total_slots} preset slots are already in the database.`,
      )
      await load()
    } catch {
      toast.error('Could not sync preset slots')
    } finally {
      setSyncingPresets(false)
    }
  }

  const openEasyCreative = (slotId: string) => {
    setEasySlotId(slotId)
    setEasyImageUrl('')
    setEasyTargetUrl('https://')
    setEasyAlt('')
    setEasyFile(null)
    setEasyDialogOpen(true)
  }

  const saveEasyCreative = async () => {
    const target = normalizeClickUrl(easyTargetUrl)
    if (!target) {
      toast.error('Add a click-through URL (where people go when they tap the ad).')
      return
    }
    const imgUrl = normalizeImageUrl(easyImageUrl)
    if (!imgUrl && !easyFile) {
      toast.error('Paste a banner image URL or upload an image file.')
      return
    }
    const easySlot = slots.find((s) => String(s.id) === easySlotId)
    const sw = easySlot?.width_hint ?? null
    const sh = easySlot?.height_hint ?? null
    if (easyFile) {
      const v = await validateAdImageFileForSlot(easyFile, sw, sh)
      if (!v.ok) {
        toast.error(v.error)
        return
      }
    } else if (imgUrl) {
      const v = await validateAdImageUrlForSlot(imgUrl, sw, sh)
      if (!v.ok) {
        toast.error(v.error)
        return
      }
    }
    setEasySaving(true)
    try {
      const fd = new FormData()
      fd.append('ad_slot_id', easySlotId)
      fd.append('target_url', target)
      if (imgUrl) fd.append('external_image_url', imgUrl)
      if (easyAlt.trim()) fd.append('alt_text', easyAlt.trim())
      fd.append('priority', '0')
      fd.append('active', '1')
      if (easyFile) fd.append('image', easyFile)
      await createAdCreative(fd)
      toast.success('Banner published on Evella')
      setEasyDialogOpen(false)
      load()
    } catch (e: unknown) {
      toast.error(advertisingApiError(e))
    } finally {
      setEasySaving(false)
    }
  }

  const savePlacement = async () => {
    try {
      const body = {
        placement_key: placementForm.placement_key,
        event_id: Number(placementForm.event_id),
        start_at: placementForm.start_at || null,
        end_at: placementForm.end_at || null,
        sort_order: Number(placementForm.sort_order),
        active: placementForm.active,
      }
      if (editingPlacement) {
        await updateSponsoredPlacement(editingPlacement.id, body)
        toast.success('Placement updated')
      } else {
        await createSponsoredPlacement(body)
        toast.success('Placement created')
      }
      setPlacementDialog(false)
      load()
    } catch (e: unknown) {
      toast.error(advertisingApiError(e))
    }
  }

  const loadMetrics = async () => {
    setMetricsLoading(true)
    try {
      const m = await fetchAdMetricsSummary(metricsFrom, metricsTo)
      setMetrics(m)
    } catch {
      toast.error('Failed to load metrics')
    } finally {
      setMetricsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" text="Loading advertising…" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container max-w-6xl py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Megaphone className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Advertising</h1>
            <p className="text-muted-foreground">Display slots and sponsored events on Evella.et</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSyncPresets}
            disabled={syncingPresets}
          >
            {syncingPresets ? (
              <Spinner size="sm" />
            ) : (
              <LayoutTemplate className="mr-2 h-4 w-4" />
            )}
            Sync preset ad spots
          </Button>
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="creatives">
        <TabsList className="mb-6 flex flex-wrap">
          <TabsTrigger value="creatives">Display creatives</TabsTrigger>
          <TabsTrigger value="placements">Sponsored placements</TabsTrigger>
          <TabsTrigger value="slots">Ad slots</TabsTrigger>
          <TabsTrigger value="metrics">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="creatives" className="space-y-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Quick banner (3 steps)
              </CardTitle>
              <CardDescription>
                Pick a spot on Evella → upload a JPEG, PNG, or GIF (or paste an image URL) with{' '}
                <strong>exact pixel dimensions</strong> for that slot — one of 300×250, 336×280, 728×90, 970×90, 300×600, or
                320×100. SWF/Flash is not supported. No schedule required — the ad runs until you replace it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                New here? Click <strong>Sync preset ad spots</strong> above so every page location exists in your
                database, then choose a card below.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...slots]
                  .filter((s) => s.active)
                  .sort(
                    (a, b) =>
                      groupIndex(a.key) - groupIndex(b.key) || a.key.localeCompare(b.key),
                  )
                  .map((s) => {
                    const preset = catalog?.display_slots.find((p) => p.key === s.key)
                    const wh = preset?.width_hint ?? s.width_hint
                    const hh = preset?.height_hint ?? s.height_hint
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => openEasyCreative(String(s.id))}
                        className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md"
                      >
                        <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-primary mb-1">
                          {slotUiGroup(s.key)}
                        </div>
                        <div className="font-semibold leading-snug">{s.label}</div>
                        <div className="mt-1 font-mono text-[0.7rem] text-muted-foreground">{s.key}</div>
                        {wh != null && hh != null ? (
                          <div className="mt-2 text-xs font-medium text-foreground">{formatSizeLine(wh, hh)}</div>
                        ) : null}
                      </button>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">All creatives</h3>
            <Button variant="outline" size="sm" onClick={openNewCreative} disabled={!slots.length}>
              <Plus className="mr-2 h-4 w-4" />
              Advanced editor
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creatives.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.id}</TableCell>
                  <TableCell>{c.slot?.key ?? c.ad_slot_id}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{c.target_url}</TableCell>
                  <TableCell>{c.priority}</TableCell>
                  <TableCell>{c.active ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditCreative(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (!confirm('Delete this creative?')) return
                        try {
                          await deleteAdCreative(c.id)
                          toast.success('Deleted')
                          load()
                        } catch {
                          toast.error('Delete failed')
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="placements" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewPlacement}>
              <Plus className="mr-2 h-4 w-4" />
              New placement
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placements.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.placement_key}</TableCell>
                  <TableCell>
                    #{p.event_id} {p.event?.name ? `— ${p.event.name}` : ''}
                  </TableCell>
                  <TableCell>{p.sort_order}</TableCell>
                  <TableCell>{p.active ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingPlacement(p)
                        setPlacementForm({
                          placement_key: p.placement_key,
                          event_id: String(p.event_id),
                          start_at: p.start_at ? p.start_at.slice(0, 16) : '',
                          end_at: p.end_at ? p.end_at.slice(0, 16) : '',
                          sort_order: String(p.sort_order),
                          active: p.active,
                        })
                        setPlacementDialog(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (!confirm('Delete placement?')) return
                        try {
                          await deleteSponsoredPlacement(p.id)
                          toast.success('Deleted')
                          load()
                        } catch {
                          toast.error('Delete failed')
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="slots" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Preset locations are maintained in code and added with <strong>Sync preset ad spots</strong>. Edit a row
            to change its label or IAB size; the key stays fixed. Use &quot;New slot&quot; for custom inventory.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={handleSyncPresets} disabled={syncingPresets}>
              {syncingPresets ? <Spinner size="sm" /> : <LayoutTemplate className="mr-2 h-4 w-4" />}
              Sync presets
            </Button>
            <Button
              onClick={() => {
                setEditingSlot(null)
                setNewSlot({ key: '', label: '', width_hint: '', height_hint: '' })
                setSlotDialog(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New slot
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Size hint</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.key}</TableCell>
                  <TableCell>{s.label}</TableCell>
                  <TableCell>
                    {s.width_hint ?? '—'} × {s.height_hint ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={s.active}
                      onCheckedChange={async (v) => {
                        try {
                          await updateAdSlot(s.id, { active: v })
                          load()
                        } catch {
                          toast.error('Update failed')
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingSlot(s)
                        setNewSlot({
                          key: s.key,
                          label: s.label,
                          width_hint: s.width_hint != null ? String(s.width_hint) : '',
                          height_hint: s.height_hint != null ? String(s.height_hint) : '',
                        })
                        setSlotDialog(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (!confirm('Delete slot? Must have no creatives.')) return
                        try {
                          await deleteAdSlot(s.id)
                          toast.success('Deleted')
                          load()
                        } catch {
                          toast.error('Delete failed (remove creatives first)')
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label>From</Label>
              <Input type="date" value={metricsFrom} onChange={(e) => setMetricsFrom(e.target.value)} />
            </div>
            <div>
              <Label>To</Label>
              <Input type="date" value={metricsTo} onChange={(e) => setMetricsTo(e.target.value)} />
            </div>
            <Button onClick={loadMetrics} disabled={metricsLoading}>
              {metricsLoading ? <Spinner size="sm" /> : 'Load'}
            </Button>
          </div>
          {metrics && (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">Impressions by day</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placement</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.impressions_by_day.map((row, i) => (
                      <TableRow key={`i-${i}`}>
                        <TableCell>{row.placement_key}</TableCell>
                        <TableCell>{row.day}</TableCell>
                        <TableCell>{row.c}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Clicks by day</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placement</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.clicks_by_day.map((row, i) => (
                      <TableRow key={`c-${i}`}>
                        <TableCell>{row.placement_key}</TableCell>
                        <TableCell>{row.day}</TableCell>
                        <TableCell>{row.c}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={slotDialog}
        onOpenChange={(open) => {
          setSlotDialog(open)
          if (!open) setEditingSlot(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSlot ? 'Edit ad slot' : 'New ad slot'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Key (slug)</Label>
              <Input
                value={newSlot.key}
                onChange={(e) => setNewSlot({ ...newSlot, key: e.target.value })}
                placeholder="e.g. home_inline_2"
                disabled={!!editingSlot}
                className={editingSlot ? 'opacity-80' : undefined}
              />
              {editingSlot ? (
                <p className="mt-1 text-xs text-muted-foreground">The key is fixed so existing creatives and Evella stay in sync.</p>
              ) : null}
            </div>
            <div>
              <Label>Label</Label>
              <Input value={newSlot.label} onChange={(e) => setNewSlot({ ...newSlot, label: e.target.value })} />
            </div>
            <div>
              <Label>Standard IAB size (required)</Label>
              <Select
                value={
                  newSlot.width_hint && newSlot.height_hint
                    ? `${newSlot.width_hint}x${newSlot.height_hint}`
                    : ''
                }
                onValueChange={(v) => {
                  const [w, h] = v.split('x').map(Number)
                  setNewSlot({
                    ...newSlot,
                    width_hint: String(w),
                    height_hint: String(h),
                  })
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choose width × height" />
                </SelectTrigger>
                <SelectContent>
                  {CANONICAL_AD_SIZES.map((s) => (
                    <SelectItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>
                      {s.width}×{s.height} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingSlot ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  If you change size, existing creatives must match the new pixels or uploads will fail until you replace them.
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSlotDialog(false)
                setEditingSlot(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!newSlot.label.trim()) {
                  toast.error('Enter a label for the slot.')
                  return
                }
                if (!newSlot.width_hint || !newSlot.height_hint) {
                  toast.error('Choose a standard IAB size for the slot.')
                  return
                }
                try {
                  if (editingSlot) {
                    await updateAdSlot(editingSlot.id, {
                      label: newSlot.label.trim(),
                      width_hint: Number(newSlot.width_hint),
                      height_hint: Number(newSlot.height_hint),
                    })
                    toast.success('Slot updated')
                  } else {
                    if (!newSlot.key.trim()) {
                      toast.error('Enter a unique key (slug) for the slot.')
                      return
                    }
                    await createAdSlot({
                      key: newSlot.key.trim(),
                      label: newSlot.label.trim(),
                      width_hint: Number(newSlot.width_hint),
                      height_hint: Number(newSlot.height_hint),
                    })
                    toast.success('Slot created')
                  }
                  setSlotDialog(false)
                  setEditingSlot(null)
                  load()
                } catch (e) {
                  toast.error(advertisingApiError(e))
                }
              }}
            >
              {editingSlot ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={creativeDialog} onOpenChange={setCreativeDialog}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingCreative ? 'Edit creative' : 'New creative'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label>Slot</Label>
              <Select value={creativeForm.ad_slot_id} onValueChange={(v) => setCreativeForm({ ...creativeForm, ad_slot_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select slot" />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.key} — {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target URL</Label>
              <Input value={creativeForm.target_url} onChange={(e) => setCreativeForm({ ...creativeForm, target_url: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground rounded-md border border-border/80 bg-muted/30 px-3 py-2">
              {formatSizeLine(
                slots.find((s) => String(s.id) === creativeForm.ad_slot_id)?.width_hint ?? null,
                slots.find((s) => String(s.id) === creativeForm.ad_slot_id)?.height_hint ?? null,
              )}
              . Files: JPEG, PNG, or GIF only (exact pixels).
            </p>
            <div>
              <Label>External image URL (optional if uploading file)</Label>
              <Input
                value={creativeForm.external_image_url}
                onChange={(e) => setCreativeForm({ ...creativeForm, external_image_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Image file</Label>
              <Input
                type="file"
                accept={AD_IMAGE_ACCEPT}
                onChange={(e) => setCreativeFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <Label>Alt text</Label>
              <Input value={creativeForm.alt_text} onChange={(e) => setCreativeForm({ ...creativeForm, alt_text: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start</Label>
                <Input type="datetime-local" value={creativeForm.start_at} onChange={(e) => setCreativeForm({ ...creativeForm, start_at: e.target.value })} />
              </div>
              <div>
                <Label>End</Label>
                <Input type="datetime-local" value={creativeForm.end_at} onChange={(e) => setCreativeForm({ ...creativeForm, end_at: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Priority</Label>
              <Input type="number" value={creativeForm.priority} onChange={(e) => setCreativeForm({ ...creativeForm, priority: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={creativeForm.active} onCheckedChange={(v) => setCreativeForm({ ...creativeForm, active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreativeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveCreative}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={easyDialogOpen} onOpenChange={setEasyDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              New banner
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <p className="text-sm text-muted-foreground">
              Slot:{' '}
              <span className="font-medium text-foreground">
                {slots.find((s) => String(s.id) === easySlotId)?.label ?? '—'}
              </span>
            </p>
            <p className="text-xs font-medium text-foreground rounded-md border border-primary/25 bg-primary/5 px-3 py-2">
              {formatSizeLine(
                slots.find((s) => String(s.id) === easySlotId)?.width_hint ?? null,
                slots.find((s) => String(s.id) === easySlotId)?.height_hint ?? null,
              )}
              . Use JPEG, PNG, or GIF — dimensions must match exactly.
            </p>
            <div>
              <Label className="flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" /> When someone taps the ad, open
              </Label>
              <Input
                className="mt-1.5"
                placeholder="https://yoursite.com/promo"
                value={easyTargetUrl}
                onChange={(e) => setEasyTargetUrl(e.target.value)}
              />
            </div>
            <div>
              <Label>Banner image URL</Label>
              <Input
                className="mt-1.5"
                placeholder="https://…/banner.jpg"
                value={easyImageUrl}
                onChange={(e) => setEasyImageUrl(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">Or upload a file below (URL is ignored if you upload).</p>
            </div>
            <div>
              <Label>Upload image instead</Label>
              <Input
                className="mt-1.5"
                type="file"
                accept={AD_IMAGE_ACCEPT}
                onChange={(e) => setEasyFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="gap-1 px-0 text-muted-foreground">
                  <ChevronDown className="h-4 w-4" />
                  Optional: alt text for accessibility
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <Input
                  placeholder="Short description of the ad"
                  value={easyAlt}
                  onChange={(e) => setEasyAlt(e.target.value)}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEasyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEasyCreative} disabled={easySaving}>
              {easySaving ? <Spinner size="sm" /> : 'Publish banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={placementDialog} onOpenChange={setPlacementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlacement ? 'Edit placement' : 'New sponsored placement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Preset placement</Label>
              <Select
                value={placementForm.placement_key}
                onValueChange={(v) => setPlacementForm({ ...placementForm, placement_key: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choose where the event is boosted…" />
                </SelectTrigger>
                <SelectContent>
                  {(catalog?.sponsored_placements ?? [{ key: 'home_carousel', label: 'Home — featured carousel' }]).map(
                    (p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.label}
                      </SelectItem>
                    ),
                  )}
                  {!(
                    catalog?.sponsored_placements ?? [{ key: 'home_carousel', label: '' }]
                  ).some((p) => p.key === placementForm.placement_key) &&
                  placementForm.placement_key.trim() ? (
                    <SelectItem value={placementForm.placement_key}>
                      {placementForm.placement_key} (custom)
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                {catalog?.sponsored_placements.find((p) => p.key === placementForm.placement_key)?.description ??
                  'Boosts events in the Evella home featured section when set to home_carousel.'}
              </p>
            </div>
            <div>
              <Label>Placement key (edit if needed)</Label>
              <Input
                value={placementForm.placement_key}
                onChange={(e) => setPlacementForm({ ...placementForm, placement_key: e.target.value })}
                placeholder="home_carousel"
              />
            </div>
            <div>
              <Label>Event ID</Label>
              <Input
                type="number"
                value={placementForm.event_id}
                onChange={(e) => setPlacementForm({ ...placementForm, event_id: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start</Label>
                <Input type="datetime-local" value={placementForm.start_at} onChange={(e) => setPlacementForm({ ...placementForm, start_at: e.target.value })} />
              </div>
              <div>
                <Label>End</Label>
                <Input type="datetime-local" value={placementForm.end_at} onChange={(e) => setPlacementForm({ ...placementForm, end_at: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Sort order</Label>
              <Input type="number" value={placementForm.sort_order} onChange={(e) => setPlacementForm({ ...placementForm, sort_order: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={placementForm.active} onCheckedChange={(v) => setPlacementForm({ ...placementForm, active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlacementDialog(false)}>
              Cancel
            </Button>
            <Button onClick={savePlacement}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
