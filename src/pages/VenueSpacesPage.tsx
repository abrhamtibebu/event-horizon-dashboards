import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutGrid, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { venueApi, type VenueSpace } from '@/lib/api/venues'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export default function VenueSpacesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const canManage = user?.role === 'venue_admin' || user?.role === 'admin' || user?.role === 'superadmin'
  const [spaces, setSpaces] = useState<VenueSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', capacity: '', hourly_rate: '' })

  useEffect(() => {
    venueApi
      .spaces()
      .then((res) => setSpaces(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'Could not load spaces'))
      .finally(() => setLoading(false))
  }, [])

  const create = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const data = new FormData()
      data.append('name', form.name.trim())
      if (form.capacity) data.append('capacity', form.capacity)
      if (form.hourly_rate) data.append('hourly_rate', form.hourly_rate)
      const res = await venueApi.createSpace(data)
      toast.success('Space added')
      navigate(`/dashboard/venue/spaces/${res.data.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not add space')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner text="Loading spaces..." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <VenuePageHeader
        icon={LayoutGrid}
        title="Spaces"
        subtitle="Halls and rooms organizers can request."
        actions={
          canManage ? (
            <Button
              className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg"
              onClick={() => {
                setForm({ name: '', capacity: '', hourly_rate: '' })
                setOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add space
            </Button>
          ) : null
        }
      />

      {spaces.length === 0 ? (
        <VenueEmptyState
          icon={LayoutGrid}
          title="No spaces yet"
          description="Add your main hall so organizers can request the right room."
          action={
            canManage ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first space
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {spaces.map((space) => {
            const cover = space.photo_urls?.[0]
            return (
              <Link
                key={space.id}
                to={`/dashboard/venue/spaces/${space.id}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative h-36 bg-gradient-to-br from-primary/15 via-muted to-background">
                  {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h2 className="text-lg font-semibold text-white drop-shadow">{space.name}</h2>
                    {space.is_default ? (
                      <Badge variant="outline" className="mt-1 border-white/40 bg-white/15 text-white">
                        Default
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 p-4 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1">
                    <Users className="h-3.5 w-3.5" />
                    {space.capacity ?? '—'} guests
                  </span>
                  {space.hourly_rate != null ? (
                    <span className="rounded-lg bg-muted px-2.5 py-1">ETB {Number(space.hourly_rate).toLocaleString()}/hr</span>
                  ) : null}
                  <span className="rounded-lg bg-muted px-2.5 py-1">
                    {(space.packages ?? []).length} package{(space.packages ?? []).length === 1 ? '' : 's'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add space</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Capacity</Label>
              <Input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Hourly rate</Label>
              <Input
                type="number"
                value={form.hourly_rate}
                onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
              />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button onClick={create} disabled={saving}>
              {saving ? 'Saving…' : 'Continue'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
