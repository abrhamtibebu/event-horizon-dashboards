import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Share2,
  QrCode,
  RefreshCw,
  Database,
} from 'lucide-react';
import { vendorReferralApi, VendorReferral, CreateReferralRequest } from '@/lib/vendorReferralApi';
import { CreateReferralDialog } from './CreateReferralDialog';
import { ReferralAnalytics } from './ReferralAnalytics';
import { ReferralDetailsDialog } from './ReferralDetailsDialog';

interface VendorReferralManagementProps {
  className?: string;
  vendorId?: number;
  vendorName?: string;
}

export function VendorReferralManagement({ className, vendorId, vendorName }: VendorReferralManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [vendorFilter, setVendorFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [selectedReferral, setSelectedReferral] = useState<VendorReferral | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch referrals from vendor_referrals table
  const { data: referralsData, isLoading, error, refetch } = useQuery({
    queryKey: ['vendor-referrals', vendorId, { search: searchTerm, status: statusFilter, vendor: vendorFilter || vendorId, event: eventFilter }],
    queryFn: async () => {
      const params = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        vendor_id: vendorId || (vendorFilter ? parseInt(vendorFilter) : undefined),
        event_id: eventFilter ? parseInt(eventFilter) : undefined,
      };
      console.log('VendorReferralManagement - Fetching from vendor_referrals table with params:', params);
      
      try {
        const result = await vendorReferralApi.getReferrals(params);
        console.log('VendorReferralManagement - API Response:', result);
        return result;
      } catch (error) {
        console.error('VendorReferralManagement - API Error:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 30000,
    enabled: !!vendorId, // Only run query when vendorId is available
    refetchOnWindowFocus: false,
  });

  // Delete referral mutation
  const deleteReferralMutation = useMutation({
    mutationFn: (id: number) => vendorReferralApi.deleteReferral(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-referrals'] });
      toast({
        title: "Campaign Deleted",
        description: "The referral campaign has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete campaign",
        variant: "destructive",
      });
    },
  });

  // Debug: Log the actual data structure
  console.log('VendorReferralManagement - Fetching from vendor_referrals table');
  console.log('VendorReferralManagement - referralsData:', referralsData);
  console.log('VendorReferralManagement - Query params:', {
    search: searchTerm,
    status: statusFilter,
    vendor_id: vendorId,
    event_id: eventFilter
  });
  console.log('VendorReferralManagement - vendorId prop:', vendorId);
  console.log('VendorReferralManagement - vendorName prop:', vendorName);
  console.log('VendorReferralManagement - isLoading:', isLoading);
  console.log('VendorReferralManagement - error:', error);
  
  const referrals = Array.isArray(referralsData?.data) ? referralsData.data : [];
  console.log('VendorReferralManagement - processed referrals:', referrals);
  console.log('VendorReferralManagement - referrals length:', referrals.length);
  console.log('VendorReferralManagement - referralsData structure:', {
    hasData: !!referralsData,
    dataType: typeof referralsData,
    dataKeys: referralsData ? Object.keys(referralsData) : 'no data',
    dataData: referralsData?.data,
    dataDataType: typeof referralsData?.data,
    isDataArray: Array.isArray(referralsData?.data)
  });

  const handleDeleteReferral = (referral: VendorReferral) => {
    deleteReferralMutation.mutate(referral.id);
  };

  const handleCopyReferralLink = async (referral: VendorReferral) => {
    try {
      await vendorReferralApi.copyToClipboard(referral.referral_link);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy referral link:', error);
    }
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

  const formatCommission = (referral: VendorReferral) => {
    return vendorReferralApi.formatCommission(
      referral.commission_type === 'percentage' ? referral.commission_rate : (referral.commission_amount || 0),
      referral.commission_type
    );
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading referral campaigns from database...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-4">Failed to load referral campaigns</p>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Referrals</h1>
          <p className="text-gray-600 mt-1">Manage vendor referral campaigns and track performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['vendor-referrals'] });
              queryClient.refetchQueries({ queryKey: ['vendor-referrals', vendorId] });
            }}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(true)}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Referral</span>
          </Button>
        </div>
      </div>

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
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search referrals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                placeholder="Vendor ID"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="event">Event</Label>
              <Input
                id="event"
                placeholder="Event ID"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Database Records:</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{referrals.length}</div>
                  <div className="text-xs text-gray-500">Total Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {referrals.filter(r => r.status === 'active').length}
                  </div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {referrals.filter(r => r.status === 'inactive').length}
                  </div>
                  <div className="text-xs text-gray-500">Inactive</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {referrals.filter(r => r.status === 'expired').length}
                  </div>
                  <div className="text-xs text-gray-500">Expired</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Campaigns</CardTitle>
          <CardDescription>
            Manage and track your vendor referral campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!vendorId ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vendor Selected</h3>
              <p className="text-gray-600 mb-4">Please select a vendor to view their referral campaigns.</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading active campaigns...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Campaigns</h3>
              <p className="text-gray-600 mb-4">There was an error loading the referral campaigns. Please try again.</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8">
              <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {statusFilter === 'active' 
                  ? 'No Active Campaigns Found' 
                  : statusFilter === 'all'
                  ? 'No Referral Campaigns Found'
                  : `No ${statusFilter} Campaigns Found`
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {statusFilter === 'active' 
                  ? 'This vendor has no active referral campaigns. Create one to start tracking performance.' 
                  : 'Create your first referral campaign to start tracking vendor performance.'
                }
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Details</TableHead>
                  <TableHead>Vendor Info</TableHead>
                  <TableHead>Event Details</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status & Usage</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(referrals) && referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{referral.campaign_name || 'Unnamed Campaign'}</div>
                        <div className="text-sm text-gray-500 font-mono">{referral.referral_code}</div>
                        {referral.description && (
                          <div className="text-xs text-gray-400 mt-1">{referral.description}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          Created: {new Date(referral.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{referral.vendor?.name || 'Unknown Vendor'}</div>
                        <div className="text-sm text-gray-500">{referral.vendor?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{referral.event?.name || 'Unknown Event'}</div>
                        <div className="text-sm text-gray-500">
                          {referral.event?.start_date ? new Date(referral.event.start_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCommission(referral)}</div>
                      <div className="text-sm text-gray-500">
                        {referral.commission_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {getStatusBadge(referral.status)}
                        <div className="text-xs text-gray-500">
                          Uses: {referral.current_uses || 0}
                          {referral.max_uses && ` / ${referral.max_uses}`}
                        </div>
                        {referral.expires_at && (
                          <div className="text-xs text-gray-500">
                            Expires: {new Date(referral.expires_at).toLocaleDateString()}
                          </div>
                        )}
                        {referral.is_expired && (
                          <div className="text-xs text-red-600">Expired</div>
                        )}
                        {!referral.can_be_used && !referral.is_expired && (
                          <div className="text-xs text-orange-600">Max uses reached</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <TrendingUp className="h-3 w-3" />
                          <span>{referral.conversion_rate?.toFixed(1) || 0}% conversion</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Users className="h-3 w-3" />
                          <span>{referral.total_clicks || 0} clicks</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <DollarSign className="h-3 w-3" />
                          <span>{referral.total_commission_earned?.toFixed(2) || 0} ETB</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReferral(referral);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyReferralLink(referral)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(referral.referral_link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Referral Campaign</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this referral campaign? This action cannot be undone.
                                {referral.total_clicks && referral.total_clicks > 0 && (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 inline mr-1" />
                                    <span className="text-yellow-800 text-sm">
                                      This referral has {referral.total_clicks} clicks and cannot be deleted.
                                    </span>
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReferral(referral)}
                                disabled={referral.total_clicks && referral.total_clicks > 0}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!Array.isArray(referrals) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">
                        <p>Unable to load referrals data</p>
                        <p className="text-sm">Please check the console for more details</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {Array.isArray(referrals) && referrals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">
                        <p>
                          {statusFilter === 'active' 
                            ? 'No active referral campaigns found' 
                            : statusFilter === 'all'
                            ? 'No referral campaigns found'
                            : `No ${statusFilter} referral campaigns found`
                          }
                        </p>
                        <p className="text-sm">
                          {statusFilter === 'active' 
                            ? 'Create your first campaign to get started' 
                            : 'Try changing the status filter or create a new campaign'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateReferralDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          // Invalidate all vendor-referral queries to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ['vendor-referrals'] });
          // Also refetch the current query immediately
          queryClient.refetchQueries({ queryKey: ['vendor-referrals', vendorId] });
          
          // Show a toast to confirm the list has been updated
          toast({
            title: "Campaign Added to List",
            description: "The new campaign has been added to your referral campaigns list.",
            variant: "default",
          });
        }}
        vendorId={vendorId}
        vendorName={vendorName}
      />

      <ReferralDetailsDialog
        referral={selectedReferral}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />

      <ReferralAnalytics
        open={showAnalytics}
        onOpenChange={setShowAnalytics}
      />
    </div>
  );
}

