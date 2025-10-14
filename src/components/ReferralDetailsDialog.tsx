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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Copy,
  ExternalLink,
  QrCode,
  Share2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  BarChart3,
  Activity,
} from 'lucide-react';
import { vendorReferralApi, VendorReferral, VendorReferralActivity } from '@/lib/vendorReferralApi';

interface ReferralDetailsDialogProps {
  referral: VendorReferral | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReferralDetailsDialog({ referral, open, onOpenChange }: ReferralDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: referralDetails, isLoading } = useQuery({
    queryKey: ['referral-details', referral?.id],
    queryFn: () => vendorReferralApi.getReferral(referral!.id),
    enabled: !!referral && open,
    retry: 1,
    staleTime: 30000,
  });

  const handleCopyReferralLink = async () => {
    if (referralDetails) {
      try {
        await vendorReferralApi.copyToClipboard(referralDetails.referral_link);
        // You could add a toast notification here
      } catch (error) {
        console.error('Failed to copy referral link:', error);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCommission = (referral: VendorReferral) => {
    return vendorReferralApi.formatCommission(
      referral.commission_type === 'percentage' ? referral.commission_rate : (referral.commission_amount || 0),
      referral.commission_type
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'link_click':
        return <ExternalLink className="h-4 w-4 text-blue-600" />;
      case 'registration':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'ticket_purchase':
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      case 'event_attendance':
        return <CheckCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'link_click':
        return 'Link Click';
      case 'registration':
        return 'Registration';
      case 'ticket_purchase':
        return 'Ticket Purchase';
      case 'event_attendance':
        return 'Event Attendance';
      default:
        return type;
    }
  };

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Referral Details</DialogTitle>
            <DialogDescription>
              Detailed information about the referral campaign
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading referral details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!referralDetails) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-6 w-6" />
            <span>Referral Campaign Details</span>
          </DialogTitle>
          <DialogDescription>
            Detailed information and analytics for this referral campaign
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Campaign Information */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Campaign Name</label>
                    <p className="text-lg font-semibold">
                      {referralDetails.campaign_name || 'Unnamed Campaign'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Referral Code</label>
                    <p className="text-lg font-mono font-semibold">{referralDetails.referral_code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vendor</label>
                    <p className="text-lg">{referralDetails.vendor?.name || 'Unknown Vendor'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Event</label>
                    <p className="text-lg">{referralDetails.event?.name || 'Unknown Event'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Commission</label>
                    <p className="text-lg font-semibold">{formatCommission(referralDetails)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(referralDetails.status)}</div>
                  </div>
                </div>

                {referralDetails.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-sm text-gray-700 mt-1">{referralDetails.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-sm">
                      {new Date(referralDetails.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expires</label>
                    <p className="text-sm">
                      {referralDetails.expires_at 
                        ? new Date(referralDetails.expires_at).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Max Uses</label>
                    <p className="text-sm">
                      {referralDetails.max_uses || 'Unlimited'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral Link */}
            <Card>
              <CardHeader>
                <CardTitle>Referral Link</CardTitle>
                <CardDescription>
                  Share this link with potential guests to track referrals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-mono break-all">{referralDetails.referral_link}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyReferralLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(referralDetails.referral_link, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{referralDetails.total_clicks || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Registrations</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{referralDetails.total_registrations || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Purchases</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{referralDetails.total_purchases || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(referralDetails.conversion_rate || 0).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Commission Information */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Commission Type</label>
                    <p className="text-lg capitalize">{referralDetails.commission_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Commission Rate</label>
                    <p className="text-lg font-semibold">{formatCommission(referralDetails)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Commission Earned</label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(referralDetails.total_commission_earned || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Uses</label>
                    <p className="text-lg">
                      {referralDetails.current_uses} / {referralDetails.max_uses || '∞'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>
                  Track all activities related to this referral campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralDetails.activities && referralDetails.activities.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Guest/Attendee</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>UTM Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referralDetails.activities.map((activity: VendorReferralActivity) => (
                        <TableRow key={activity.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getActivityTypeIcon(activity.activity_type)}
                              <span>{getActivityTypeLabel(activity.activity_type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(activity.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {activity.guest_id ? `Guest #${activity.guest_id}` : 
                             activity.attendee_id ? `Attendee #${activity.attendee_id}` : 
                             'Anonymous'}
                          </TableCell>
                          <TableCell>
                            {activity.commission_earned > 0 ? formatCurrency(activity.commission_earned) : '-'}
                          </TableCell>
                          <TableCell>
                            {getCommissionStatusBadge(activity.commission_status)}
                          </TableCell>
                          <TableCell>
                            {activity.utm_source || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Yet</h3>
                    <p className="text-gray-600">No activities have been tracked for this referral campaign.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


