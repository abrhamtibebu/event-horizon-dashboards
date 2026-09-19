import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { venueApi, type Venue } from '@/lib/api/venues'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { format } from 'date-fns'

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [detail, setDetail] = useState<Venue | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = () =>
    venueApi
      .adminList({ search, status, per_page: 50 })
      .then((res) => setVenues(res.data.data || res.data))
      .finally(() => setLoading(false))

  useEffect(() => {
    setLoading(true)
    load()
  }, [status])

  const act = async (venue: Venue, action: 'activate' | 'suspend' | 'verify') => {
    try {
      if (action === 'activate') await venueApi.adminActivate(venue.id)
      if (action === 'suspend') await venueApi.adminSuspend(venue.id)
      if (action === 'verify') await venueApi.adminVerify(venue.id)
      toast.success('Updated')
      load()
      if (detail?.id === venue.id) openDetail(venue.id)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Action failed')
    }
  }

  const openDetail = async (id: number) => {
    setDetailLoading(true)
    try {
      const res = await venueApi.adminShow(id)
      setDetail(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not load venue')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Venues</h1>
      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search venues"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setLoading(true)
            load()
          }}
        >
          Search
        </Button>
      </div>
      {loading ? (
        <Spinner text="Loading venues..." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Listed</TableHead>
              <TableHead>Spaces</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {venues.map((v) => (
              <TableRow key={v.id} className="cursor-pointer" onClick={() => openDetail(v.id)}>
                <TableCell className="font-medium">
                  {v.name} {v.verified && <Badge variant="secondary">Verified</Badge>}
                </TableCell>
                <TableCell>{v.city || '—'}</TableCell>
                <TableCell>
                  <Badge variant={v.status === 'active' ? 'default' : 'destructive'}>{v.status}</Badge>
                </TableCell>
                <TableCell>{v.is_listed === false ? 'Hidden' : 'Yes'}</TableCell>
                <TableCell>{v.spaces_count ?? v.spaces?.length ?? '—'}</TableCell>
                <TableCell>{v.created_at ? format(new Date(v.created_at), 'MMM d, yyyy') : '—'}</TableCell>
                <TableCell className="space-x-1 text-right" onClick={(e) => e.stopPropagation()}>
                  {v.status !== 'active' && (
                    <Button size="sm" onClick={() => act(v, 'activate')}>
                      Activate
                    </Button>
                  )}
                  {v.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => act(v, 'suspend')}>
                      Suspend
                    </Button>
                  )}
                  {!v.verified && (
                    <Button size="sm" variant="ghost" onClick={() => act(v, 'verify')}>
                      Verify
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!detail || detailLoading} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.name || 'Venue detail'}</DialogTitle>
          </DialogHeader>
          {detailLoading || !detail ? (
            <Spinner text="Loading..." />
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Email:</span> {detail.email || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Phone:</span> {detail.phone || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">City:</span> {detail.city || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Address:</span> {detail.formatted_address || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span> {detail.status} ·{' '}
                {detail.is_listed === false ? 'Unlisted' : 'Listed'} ·{' '}
                {detail.verified ? 'Verified' : 'Unverified'}
              </p>
              <div>
                <p className="mb-1 font-medium">Spaces ({detail.spaces?.length || 0})</p>
                <ul className="list-inside list-disc text-muted-foreground">
                  {(detail.spaces || []).map((s) => (
                    <li key={s.id}>{s.name}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-medium">Users ({detail.users?.length || 0})</p>
                <ul className="list-inside list-disc text-muted-foreground">
                  {(detail.users || []).map((u) => (
                    <li key={u.id}>
                      {u.name || u.email} · {u.role}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
