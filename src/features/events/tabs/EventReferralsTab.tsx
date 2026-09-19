import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  Download,
  Filter,
  Link2,
  MousePointer,
  Percent,
  Plus,
  Share2,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import api, { getEventUshers } from '@/lib/api'
import {
  vendorReferralApi,
  type VendorReferral,
  type ReferrerType,
} from '@/lib/vendorReferralApi'
import { useGenerateInvitation, useInvitations } from '@/lib/api/invitations'
import {
  buildShareTicketLink,
  copyText,
} from '../lib/referralLinks'
import { extractReferralSuffix } from '@/lib/referralCode'
import {
  REFERRER_TYPES,
  getPartnerDisplayName,
  getReferrerTypeLabel,
} from '../lib/referrerTypes'

interface EventReferralsTabProps {
  eventId: number
  eventUuid: string
  eventName: string
}

interface VendorOption {
  id: number
  name: string
}

interface UsherOption {
  id: number
  name: string
  phone?: string
}

const emptyPartnerForm = () => ({
  referrer_type: 'food_vendor' as ReferrerType,
  partner_name: '',
  partner_phone: '',
  vendor_id: '',
  usher_id: '',
  link_vendor: false,
  campaign_name: '',
  commission_rate: '10',
  commission_type: 'percentage' as 'percentage' | 'fixed',
  discount_type: 'none' as 'none' | 'percentage' | 'fixed',
  discount_value: '',
  max_discount_amount: '',
})

function unwrapReferrals(data: unknown): VendorReferral[] {
  const payload = data as { data?: unknown }
  if (!payload?.data) return []
  if (Array.isArray(payload.data)) return payload.data as VendorReferral[]
  const nested = payload.data as { data?: VendorReferral[] }
  return Array.isArray(nested.data) ? nested.data : []
}

export function EventReferralsTab({ eventId, eventUuid, eventName }: EventReferralsTabProps) {
  const queryClient = useQueryClient()
  const [showPartnerDialog, setShowPartnerDialog] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [partnerForm, setPartnerForm] = useState(emptyPartnerForm)
  const [inviteForm, setInviteForm] = useState({
    discount_type: 'none' as 'none' | 'percentage' | 'fixed',
    discount_value: '',
    max_discount_amount: '',
  })

  const { data: referralsData, isLoading: referralsLoading } = useQuery({
    queryKey: ['vendor-referrals', eventId, typeFilter],
    queryFn: () =>
      vendorReferralApi.getReferrals({
        event_id: eventId,
        status: 'all',
        ...(typeFilter !== 'all' ? { referrer_type: typeFilter } : {}),
      }),
    enabled: !!eventId,
  })

  const { data: analytics } = useQuery({
    queryKey: ['vendor-referral-analytics', eventId],
    queryFn: () => vendorReferralApi.getAnalytics({ event_id: eventId }),
    enabled: !!eventId,
  })

  const { data: vendors = [] } = useQuery<VendorOption[]>({
    queryKey: ['vendors-list-referrals'],
    queryFn: async () => {
      const res = await api.get('/vendors', { params: { per_page: 200 } })
      const rows = res.data?.data?.data ?? res.data?.data ?? res.data ?? []
      return Array.isArray(rows) ? rows.map((v: { id: number; name: string }) => ({ id: v.id, name: v.name })) : []
    },
  })

  const { data: eventUshers = [] } = useQuery<UsherOption[]>({
    queryKey: ['event-ushers-referrals', eventId],
    queryFn: async () => {
      const res = await getEventUshers(eventId)
      const rows = res.data?.data ?? res.data ?? []
      if (!Array.isArray(rows)) return []
      return rows.map((usher: { id: number; name: string; phone?: string }) => ({
        id: usher.id,
        name: usher.name,
        phone: usher.phone,
      }))
    },
    enabled: !!eventId,
  })

  const { data: invitations = [], isLoading: invitationsLoading } = useInvitations(eventId)
  const generateInvitation = useGenerateInvitation()

  const referrals = useMemo(() => unwrapReferrals(referralsData), [referralsData])

  const stats = useMemo(() => {
    const totalClicks = referrals.reduce((sum, r) => sum + (r.total_clicks ?? 0), 0)
    const totalPurchases = referrals.reduce((sum, r) => sum + (r.total_purchases ?? 0), 0)
    const totalCommission = referrals.reduce((sum, r) => sum + (r.total_commission_earned ?? 0), 0)
    return {
      campaigns: referrals.length,
      clicks: analytics?.total_clicks ?? totalClicks,
      purchases: analytics?.total_purchases ?? totalPurchases,
      commission: analytics?.total_commission_earned ?? totalCommission,
    }
  }, [referrals, analytics])

  const createReferralMutation = useMutation({
    mutationFn: () => {
      const name =
        partnerForm.partner_name.trim() ||
        (partnerForm.link_vendor && partnerForm.vendor_id
          ? vendors.find((v) => String(v.id) === partnerForm.vendor_id)?.name
          : '') ||
        ''

      return vendorReferralApi.createReferral({
        event_id: eventId,
        referrer_type: partnerForm.referrer_type,
        partner_name: name || undefined,
        partner_phone: partnerForm.partner_phone.trim() || undefined,
        vendor_id: partnerForm.link_vendor && partnerForm.vendor_id ? Number(partnerForm.vendor_id) : undefined,
        usher_id:
          partnerForm.referrer_type === 'usher' && partnerForm.usher_id
            ? Number(partnerForm.usher_id)
            : undefined,
        campaign_name: partnerForm.campaign_name || `${getReferrerTypeLabel(partnerForm.referrer_type)} · ${eventName}`,
        commission_rate: Number(partnerForm.commission_rate) || 0,
        commission_type: partnerForm.commission_type,
        discount_type: partnerForm.discount_type,
        discount_value: partnerForm.discount_value ? Number(partnerForm.discount_value) : 0,
        max_discount_amount: partnerForm.max_discount_amount
          ? Number(partnerForm.max_discount_amount)
          : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-referrals', eventId] })
      queryClient.invalidateQueries({ queryKey: ['vendor-referral-analytics', eventId] })
      setShowPartnerDialog(false)
      setPartnerForm(emptyPartnerForm())
      toast.success('Partner referral link created')
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message || 'Failed to create referral link')
    },
  })

  const handleCopyShareLink = async (code: string, type: 'ref' | 'inv') => {
    const link = buildShareTicketLink(eventUuid, code, type, eventId)
    await copyText(link)
    toast.success('Ticket link copied')
  }

  const handleExportPerformance = async () => {
    try {
      await vendorReferralApi.exportPerformance(eventId)
      toast.success('Referral performance exported')
    } catch {
      toast.error('Failed to export referral performance')
    }
  }

  const handleGenerateInvitation = async () => {
    try {
      const result = await generateInvitation.mutateAsync({
        eventId,
        type: 'generic',
        discountType: inviteForm.discount_type,
        discountValue: inviteForm.discount_value ? Number(inviteForm.discount_value) : 0,
        maxDiscountAmount: inviteForm.max_discount_amount
          ? Number(inviteForm.max_discount_amount)
          : undefined,
      })
      const code = result.invitation_code
      if (code) await handleCopyShareLink(code, 'inv')
      toast.success('Invitation code created')
    } catch {
      toast.error('Failed to create invitation code')
    }
  }

  const canCreatePartner =
    partnerForm.referrer_type &&
    (partnerForm.referrer_type === 'usher'
      ? Boolean(partnerForm.usher_id)
      : partnerForm.referrer_type === 'sales_agent'
      ? Boolean(partnerForm.partner_name.trim() && partnerForm.partner_phone.trim())
      : partnerForm.link_vendor
        ? Boolean(partnerForm.vendor_id)
        : Boolean(partnerForm.partner_name.trim()))

  if (referralsLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner size="lg" variant="primary" text="Loading referrals..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Referrals</h2>
          <p className="text-sm text-muted-foreground">
            Create trackable ticket links for sales agents, ushers, shops, food & souvenir booths, sponsors, and other event partners.
          </p>
        </div>
        <Button variant="outline" onClick={handleExportPerformance}>
          <Download className="mr-2 h-4 w-4" />
          Export performance
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partner links</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Share2 className="h-5 w-5 text-primary" />
            {stats.campaigns}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clicks</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <MousePointer className="h-5 w-5 text-primary" />
            {stats.clicks}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket purchases</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Ticket className="h-5 w-5 text-primary" />
            {stats.purchases}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission earned</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="h-5 w-5 text-primary" />
            ETB {stats.commission.toLocaleString()}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="partner-referrals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partner-referrals">Partner referrals</TabsTrigger>
          <TabsTrigger value="invitations">Invitation codes</TabsTrigger>
        </TabsList>

        <TabsContent value="partner-referrals" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All partner types</SelectItem>
                  {REFERRER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowPartnerDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New partner link
            </Button>
          </div>

          {referrals.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No partner referral links yet. Add a sales agent, shop, or booth vendor to start tracking ticket sales.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <Card key={referral.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{getPartnerDisplayName(referral)}</p>
                        <Badge variant="secondary">{getReferrerTypeLabel(referral.referrer_type)}</Badge>
                        <Badge variant={referral.status === 'active' ? 'default' : 'outline'}>
                          {referral.status}
                        </Badge>
                        {referral.discount_type && referral.discount_type !== 'none' && (
                          <Badge variant="outline">
                            <Percent className="mr-1 h-3 w-3" />
                            Buyer {referral.discount_type === 'percentage'
                              ? `${referral.discount_value}% off`
                              : `ETB ${referral.discount_value} off`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        REF-{extractReferralSuffix(referral.referral_code)}
                      </p>
                      {referral.partner_phone && (
                        <p className="text-xs text-muted-foreground">Mobile: {referral.partner_phone}</p>
                      )}
                      <p className="truncate text-xs text-muted-foreground" title={buildShareTicketLink(eventUuid, referral.referral_code, 'ref', eventId)}>
                        {buildShareTicketLink(eventUuid, referral.referral_code, 'ref', eventId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {referral.total_clicks ?? 0} clicks · {referral.total_purchases ?? 0} purchases · ETB{' '}
                        {(referral.total_commission_earned ?? 0).toLocaleString()} commission
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyShareLink(referral.referral_code, 'ref')}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy link
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create invitation code</CardTitle>
              <p className="text-sm text-muted-foreground">
                For individual promoters, agents, or guests — buyers enter the code at checkout.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Buyer discount type</Label>
                <Select
                  value={inviteForm.discount_type}
                  onValueChange={(v) =>
                    setInviteForm((f) => ({ ...f, discount_type: v as typeof f.discount_type }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (attribution only)</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {inviteForm.discount_type !== 'none' && (
                <>
                  <div className="space-y-2">
                    <Label>Discount value</Label>
                    <Input
                      type="number"
                      min={0}
                      value={inviteForm.discount_value}
                      onChange={(e) => setInviteForm((f) => ({ ...f, discount_value: e.target.value }))}
                      placeholder={inviteForm.discount_type === 'percentage' ? '10' : '50'}
                    />
                  </div>
                  {inviteForm.discount_type === 'percentage' && (
                    <div className="space-y-2">
                      <Label>Max discount (optional)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={inviteForm.max_discount_amount}
                        onChange={(e) =>
                          setInviteForm((f) => ({ ...f, max_discount_amount: e.target.value }))
                        }
                      />
                    </div>
                  )}
                </>
              )}
              <div className="flex items-end">
                <Button
                  onClick={handleGenerateInvitation}
                  disabled={generateInvitation.isPending}
                  className="w-full"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Generate & copy link
                </Button>
              </div>
            </CardContent>
          </Card>

          {invitationsLoading ? (
            <Spinner text="Loading invitations..." />
          ) : invitations.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No invitation codes yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-semibold">{invitation.invitation_code}</p>
                        <Badge variant="outline">{invitation.status}</Badge>
                        <Badge variant="outline">Individual / agent</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <Users className="mr-1 inline h-3 w-3" />
                        {invitation.registrations_count ?? 0} uses
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyShareLink(invitation.invitation_code, 'inv')}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy link
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showPartnerDialog} onOpenChange={setShowPartnerDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create partner referral link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Partner type</Label>
              <Select
                value={partnerForm.referrer_type}
                onValueChange={(v) =>
                  setPartnerForm((f) => ({
                    ...f,
                    referrer_type: v as ReferrerType,
                    link_vendor: v === 'usher' ? false : f.link_vendor,
                    usher_id: v === 'usher' ? f.usher_id : '',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFERRER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {partnerForm.referrer_type === 'usher' ? (
              <div className="space-y-2">
                <Label>Assigned usher</Label>
                <Select
                  value={partnerForm.usher_id}
                  onValueChange={(v) => {
                    const usher = eventUshers.find((item) => String(item.id) === v)
                    setPartnerForm((f) => ({
                      ...f,
                      usher_id: v,
                      partner_name: usher?.name || f.partner_name,
                      partner_phone: usher?.phone || f.partner_phone,
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={eventUshers.length ? 'Select usher' : 'No ushers assigned yet'} />
                  </SelectTrigger>
                  <SelectContent>
                    {eventUshers.map((usher) => (
                      <SelectItem key={usher.id} value={String(usher.id)}>
                        {usher.name}
                        {usher.phone ? ` · ${usher.phone}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The usher can share their link and see ticket sales and commission in their dashboard.
                </p>
              </div>
            ) : (
              <>
            <div className="flex items-center gap-2">
              <input
                id="link-vendor"
                type="checkbox"
                checked={partnerForm.link_vendor}
                onChange={(e) =>
                  setPartnerForm((f) => ({
                    ...f,
                    link_vendor: e.target.checked,
                    vendor_id: e.target.checked ? f.vendor_id : '',
                  }))
                }
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="link-vendor" className="font-normal">
                Link to existing vendor directory record (optional)
              </Label>
            </div>

            {partnerForm.link_vendor ? (
              <div className="space-y-2">
                <Label>Vendor directory</Label>
                <Select
                  value={partnerForm.vendor_id}
                  onValueChange={(v) => setPartnerForm((f) => ({ ...f, vendor_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={String(vendor.id)}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Partner name</Label>
                <Input
                  value={partnerForm.partner_name}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, partner_name: e.target.value }))}
                  placeholder="e.g. Abebe Souvenirs, Gate 3 Food Court"
                />
              </div>
            )}
              </>
            )}

            {partnerForm.referrer_type === 'sales_agent' && (
              <div className="space-y-2">
                <Label>Sales agent mobile</Label>
                <Input
                  type="tel"
                  value={partnerForm.partner_phone}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, partner_phone: e.target.value }))}
                  placeholder="0911223344"
                />
                <p className="text-xs text-muted-foreground">
                  Buyers can enter this number at checkout instead of the referral code.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Campaign label (optional)</Label>
              <Input
                value={partnerForm.campaign_name}
                onChange={(e) => setPartnerForm((f) => ({ ...f, campaign_name: e.target.value }))}
                placeholder="Weekend booth promo"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Commission rate (%)</Label>
                <Input
                  type="number"
                  value={partnerForm.commission_rate}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, commission_rate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Buyer discount</Label>
                <Select
                  value={partnerForm.discount_type}
                  onValueChange={(v) =>
                    setPartnerForm((f) => ({ ...f, discount_type: v as typeof f.discount_type }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {partnerForm.discount_type !== 'none' && (
              <div className="space-y-2">
                <Label>Discount value</Label>
                <Input
                  type="number"
                  min={0}
                  value={partnerForm.discount_value}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, discount_value: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartnerDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createReferralMutation.mutate()}
              disabled={!canCreatePartner || createReferralMutation.isPending}
            >
              Create link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
