import { useEffect, useState } from 'react'
import { Copy, KeyRound, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  OnsiteAccessCode,
  createEventAccessCode,
  deleteEventAccessCode,
  listEventAccessCodes,
} from '@/lib/api/onsite'

interface EventAccessCodesDialogProps {
  eventId: number
}

export function EventAccessCodesDialog({ eventId }: EventAccessCodesDialogProps) {
  const [open, setOpen] = useState(false)
  const [codes, setCodes] = useState<OnsiteAccessCode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [label, setLabel] = useState('Onsite Registration')
  const [expiresAt, setExpiresAt] = useState('')
  const [latestCode, setLatestCode] = useState<{ plainCode: string; regUrl: string } | null>(null)

  useEffect(() => {
    if (!open) return
    void loadCodes()
  }, [open])

  const loadCodes = async () => {
    setIsLoading(true)
    try {
      const res = await listEventAccessCodes(eventId)
      setCodes(res.data)
    } catch {
      toast.error('Could not load Access IDs')
    } finally {
      setIsLoading(false)
    }
  }

  const createCode = async () => {
    setIsCreating(true)
    try {
      const res = await createEventAccessCode(eventId, {
        label,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        can_register: true,
        can_check_in: true,
        can_print: true,
      })
      setLatestCode({
        plainCode: res.data.plain_code,
        regUrl: `${window.location.origin}/reg/${encodeURIComponent(res.data.plain_code)}`,
      })
      setCodes((current) => [res.data.access_code, ...current])
      toast.success('Access ID generated')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not generate Access ID')
    } finally {
      setIsCreating(false)
    }
  }

  const revokeCode = async (code: OnsiteAccessCode) => {
    try {
      await deleteEventAccessCode(eventId, code.id)
      setCodes((current) => current.filter((item) => item.id !== code.id))
      toast.success('Access ID disabled')
    } catch {
      toast.error('Could not disable Access ID')
    }
  }

  const copy = async (text: string, message = 'Copied') => {
    await navigator.clipboard.writeText(text)
    toast.success(message)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-background border-border text-foreground font-semibold rounded-lg sm:rounded-xl h-9 sm:h-10 px-3 sm:px-5 hover:bg-muted transition-all text-xs sm:text-sm">
          <KeyRound className="w-3.5 h-3.5 sm:mr-2 text-primary" />
          <span className="hidden sm:inline">Onsite Access</span>
          <span className="sm:hidden">Access</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Onsite Registration Access IDs
          </DialogTitle>
          <DialogDescription>
            Generate 8-character event-specific Access IDs for onsite registration, check-in, and badge printing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-[1fr_220px_auto]">
          <div className="space-y-2">
            <Label>Station Label</Label>
            <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Main Registration" />
          </div>
          <div className="space-y-2">
            <Label>Expires At</Label>
            <Input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={createCode} disabled={isCreating} className="w-full gap-2">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Generate
            </Button>
          </div>
        </div>

        {latestCode ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-primary">New Access ID. Copy it now; it will not be shown again.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input value={latestCode.plainCode} readOnly className="font-mono" />
              <Button variant="outline" onClick={() => void copy(latestCode.plainCode, 'Access ID copied')}>
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </Button>
              <Input value={latestCode.regUrl} readOnly className="font-mono sm:col-span-1" />
              <Button variant="outline" onClick={() => void copy(latestCode.regUrl, 'Registration link copied')}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Active Access IDs</h3>
            <Button variant="ghost" size="sm" onClick={() => void loadCodes()} disabled={isLoading}>
              Refresh
            </Button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center rounded-xl border border-border p-8 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Access IDs...
            </div>
          ) : codes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No onsite Access IDs have been generated for this event yet.
            </div>
          ) : (
            <div className="divide-y rounded-xl border border-border">
              {codes.map((code) => (
                <div key={code.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{code.label || 'Onsite Registration'}</p>
                      <Badge variant={code.enabled ? 'default' : 'secondary'}>
                        {code.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                      {code.expires_at ? <Badge variant="outline">Expires {new Date(code.expires_at).toLocaleString()}</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Prefix {code.code_prefix} · Used {code.usage_count} time{code.usage_count === 1 ? '' : 's'}
                      {code.last_used_at ? ` · Last used ${new Date(code.last_used_at).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => void revokeCode(code)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Disable
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
