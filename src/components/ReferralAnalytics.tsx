import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Calendar,
  Filter,
  Download,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { vendorReferralApi, ReferralAnalytics } from '@/lib/vendorReferralApi';

interface ReferralAnalyticsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReferralAnalytics({ open, onOpenChange }: ReferralAnalyticsProps) {
  const [vendorFilter, setVendorFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['referral-analytics', { vendor: vendorFilter, event: eventFilter, dateFrom, dateTo }],
    queryFn: () => vendorReferralApi.getAnalytics({
      vendor_id: vendorFilter ? parseInt(vendorFilter) : undefined,
      event_id: eventFilter ? parseInt(eventFilter) : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    enabled: open,
    retry: 1,
    staleTime: 30000,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Referral Analytics</DialogTitle>
            <DialogDescription>
              Comprehensive analytics and insights for vendor referral campaigns
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Referral Analytics</DialogTitle>
            <DialogDescription>
              Comprehensive analytics and insights for vendor referral campaigns
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Analytics</h3>
            <p className="text-gray-600 mb-4">There was an error loading the analytics data. Please try again.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <span>Referral Analytics</span>
          </DialogTitle>
          <DialogDescription>
            Comprehensive analytics and insights for vendor referral campaigns
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="vendor-filter">Vendor ID</Label>
                <Input
                  id="vendor-filter"
                  placeholder="Vendor ID"
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="event-filter">Event ID</Label>
                <Input
                  id="event-filter"
                  placeholder="Event ID"
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_referrals}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.active_referrals} active, {analytics.expired_referrals} expired
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_clicks}</div>
              <p className="text-xs text-muted-foreground">
                Across all referral campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_registrations}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.total_purchases} purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.total_commission_earned)}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(analytics.average_conversion_rate)} avg conversion
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Referrals */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Referrals</CardTitle>
            <CardDescription>
              Referrals with the highest conversion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.top_performing_referrals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                <p className="text-gray-600">No referral campaigns found with the current filters.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Registrations</TableHead>
                    <TableHead>Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.top_performing_referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{referral.campaign_name || 'Unnamed Campaign'}</div>
                          <div className="text-sm text-gray-500">{referral.referral_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{referral.vendor?.name || 'Unknown Vendor'}</TableCell>
                      <TableCell>{referral.event?.name || 'Unknown Event'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{formatPercentage(referral.conversion_rate || 0)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{referral.total_clicks || 0}</TableCell>
                      <TableCell>{referral.total_registrations || 0}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(referral.total_commission_earned || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Referrals by Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Referrals by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.referrals_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referrals by Vendor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.referrals_by_vendor).slice(0, 5).map(([vendor, count]) => (
                  <div key={vendor} className="flex items-center justify-between">
                    <span className="truncate">{vendor}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(analytics.referrals_by_vendor).length > 5 && (
                  <div className="text-sm text-gray-500 text-center pt-2">
                    +{Object.keys(analytics.referrals_by_vendor).length - 5} more vendors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


