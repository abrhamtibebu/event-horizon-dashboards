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
  Progress,
} from '@/components/ui/progress';
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
  Target,
  Zap,
  Award,
  Activity,
  Globe,
  Smartphone,
  Mail,
  MessageSquare,
  Link2,
  Download,
  Upload,
  Settings,
  MoreHorizontal,
  Star,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Hash,
  MousePointer,
  Grid,
  Table as TableIcon,
} from 'lucide-react';
import { vendorReferralApi, VendorReferral, CreateReferralRequest } from '@/lib/vendorReferralApi';
import { CreateReferralCampaignDialog } from './CreateReferralCampaignDialog';
import { ReferralAnalytics } from './ReferralAnalytics';
import { ReferralDetailsDialog } from './ReferralDetailsDialog';

interface VendorReferralCampaignsProps {
  className?: string;
  vendorId?: number;
  vendorName?: string;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalClicks: number;
  totalConversions: number;
  totalCommission: number;
  averageConversionRate: number;
  topPerformingCampaign: string;
  recentActivity: number;
}

export function VendorReferralCampaigns({ className, vendorId, vendorName }: VendorReferralCampaignsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [selectedReferral, setSelectedReferral] = useState<VendorReferral | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch referrals with enhanced filtering
  const { data: referralsData, isLoading, error, refetch } = useQuery({
    queryKey: ['vendor-referrals', vendorId, { 
      search: searchTerm, 
      status: statusFilter, 
      vendor: vendorId, 
      event: eventFilter,
      campaign: campaignFilter 
    }],
    queryFn: () => {
      const params = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        vendor_id: vendorId || undefined,
        event_id: eventFilter && eventFilter !== 'all' ? parseInt(eventFilter) : undefined,
      };
      
      
      return vendorReferralApi.getReferrals(params);
    },
    retry: 1,
    staleTime: 30000,
    enabled: !!vendorId,
  });




  // Fetch analytics data
  const { data: analyticsData } = useQuery({
    queryKey: ['vendor-referral-analytics', vendorId],
    queryFn: () => vendorReferralApi.getAnalytics({ vendor_id: vendorId }),
    enabled: !!vendorId,
    staleTime: 60000, // 1 minute
    retry: 1,
  });

  // Delete referral mutation
  const deleteReferralMutation = useMutation({
    mutationFn: (id: number) => vendorReferralApi.deleteReferral(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-referral-analytics'] });
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

  // Calculate campaign statistics with proper loading state handling
  const calculateCampaignStats = (): CampaignStats => {
    // Return default stats if data is still loading or undefined
    if (isLoading || !referralsData) {
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalCommission: 0,
        averageConversionRate: 0,
        topPerformingCampaign: 'Loading...',
        recentActivity: 0,
      };
    }

    // Handle paginated response structure: { data: { data: [...] } }
    let referrals: any[] = [];
    const data = (referralsData as any)?.data;
    if (data) {
      if (Array.isArray(data)) {
        // Direct array
        referrals = data;
      } else if (data.data && Array.isArray(data.data)) {
        // Paginated response
        referrals = data.data;
      }
    }
   
    const totalCampaigns = referrals.length;
    const activeCampaigns = referrals.filter(r => r.status === 'active').length;
    const totalClicks = referrals.reduce((sum, r) => sum + (r.total_clicks || 0), 0);
    const totalConversions = referrals.reduce((sum, r) => sum + (r.total_registrations || 0), 0);
    const totalCommission = referrals.reduce((sum, r) => sum + (r.total_commission_earned || 0), 0);
    const averageConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    
    const topPerforming = referrals.length > 0 ? referrals.reduce((top, current) => {
      const currentRate = current.conversion_rate || 0;
      const topRate = top.conversion_rate || 0;
      return currentRate > topRate ? current : top;
    }, referrals[0]) : null;

    return {
      totalCampaigns,
      activeCampaigns,
      totalClicks,
      totalConversions,
      totalCommission,
      averageConversionRate,
      topPerformingCampaign: topPerforming?.campaign_name || 'No campaigns',
      recentActivity: referrals.filter(r => {
        const createdDate = new Date(r.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdDate > weekAgo;
      }).length,
    };
  };

  const campaignStats = calculateCampaignStats();

  // Get referrals array with proper loading state handling
  const referrals = React.useMemo(() => {
    if (isLoading || !referralsData) {
      return [];
    }
    
    // Handle paginated response structure: { data: { data: [...] } }
    let result: any[] = [];
    const data = (referralsData as any)?.data;
    if (data) {
      if (Array.isArray(data)) {
        // Direct array
        result = data;
      } else if (data.data && Array.isArray(data.data)) {
        // Paginated response
        result = data.data;
      }
    }
    
    return result;
  }, [referralsData, isLoading]);

  // Get unique campaigns for filter
  const uniqueCampaigns = React.useMemo(() => {
    return Array.from(
      new Set(referrals.map(r => r.campaign_name).filter(name => name && name.trim() !== ''))
    );
  }, [referrals]);

  // Get unique events for filter
  const uniqueEvents = React.useMemo(() => {
    return Array.from(
      new Set(referrals.map(r => r.event?.name).filter(name => name && name.trim() !== ''))
    );
  }, [referrals]);

  // Apply client-side filtering for campaign filter with loading state handling
  const filteredReferrals = React.useMemo(() => {
    if (isLoading || !referralsData) {
      return [];
    }
    
    let filtered = referrals.filter(referral => {
      // Campaign filter
      if (campaignFilter && campaignFilter !== 'all') {
        if (referral.campaign_name !== campaignFilter) {
          return false;
        }
      }
      
      // Status filter (this should be handled by the API, but let's double-check)
      if (statusFilter && statusFilter !== 'all') {
        if (referral.status !== statusFilter) {
          return false;
        }
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          referral.campaign_name?.toLowerCase().includes(searchLower) ||
          referral.referral_code?.toLowerCase().includes(searchLower) ||
          referral.event?.name?.toLowerCase().includes(searchLower) ||
          referral.description?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) {
          return false;
        }
      }
      
      return true;
    });
    
    return filtered;
  }, [referrals, campaignFilter, statusFilter, searchTerm, isLoading, referralsData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await vendorReferralApi.copyToClipboard(text);
      toast({
        title: "Copied to Clipboard",
        description: `${label} has been copied to your clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReferral = (id: number, campaignName: string) => {
    deleteReferralMutation.mutate(id);
  };

  // Handle loading and error states after all hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading campaigns...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">Failed to load campaigns</p>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Enhanced Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              Referral Campaigns
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and track vendor referral campaigns for {vendorName || 'this vendor'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
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
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-4 w-4" />
              <span>Create Campaign</span>
            </Button>
          </div>
        </div>

        {/* Campaign Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      campaignStats.totalCampaigns
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-600 font-medium">
                  {isLoading ? '...' : `${campaignStats.activeCampaigns} active`}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      campaignStats.totalClicks.toLocaleString()
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-gray-600">
                  {isLoading ? '...' : `${campaignStats.totalConversions} conversions`}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      `${campaignStats.averageConversionRate.toFixed(1)}%`
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-gray-600">Average across campaigns</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Commission</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      new Intl.NumberFormat('en-ET', {
                        style: 'currency',
                        currency: 'ETB',
                        minimumFractionDigits: 0,
                      }).format(campaignStats.totalCommission)
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-gray-600">Earned this period</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Campaign Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Campaigns</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name, code, or event..."
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
                  <SelectValue placeholder="Filter by status" />
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
              <Label htmlFor="campaign">Campaign</Label>
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {uniqueCampaigns.map((campaign) => (
                    <SelectItem key={campaign} value={campaign}>
                      {campaign}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="event">Event</Label>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {uniqueEvents.map((event) => (
                    <SelectItem key={event} value={event}>
                      {event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4 mr-2" />
            Grid View
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <TableIcon className="w-4 h-4 mr-2" />
            Table View
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredReferrals.length} campaign{filteredReferrals.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Campaign Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReferrals.map((referral) => (
            <Card key={referral.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {referral.campaign_name || 'Unnamed Campaign'}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {referral.event?.name || 'No event assigned'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(referral.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReferral(referral);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Campaign Code */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Referral Code</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{referral.referral_code}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(referral.referral_code, 'Referral code')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{referral.total_clicks || 0}</div>
                    <div className="text-xs text-blue-600 font-medium">Clicks</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{referral.total_registrations || 0}</div>
                    <div className="text-xs text-green-600 font-medium">Conversions</div>
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Conversion Rate</span>
                    <span className="font-semibold text-gray-900">
                      {referral.conversion_rate ? `${referral.conversion_rate.toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                  <Progress 
                    value={referral.conversion_rate || 0} 
                    className="h-2"
                  />
                </div>

                {/* Commission Info */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Commission</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCommission(referral)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Earned</p>
                    <p className="text-sm font-semibold text-green-600">
                      {new Intl.NumberFormat('en-ET', {
                        style: 'currency',
                        currency: 'ETB',
                        minimumFractionDigits: 0,
                      }).format(referral.total_commission_earned || 0)}
                    </p>
                  </div>
                </div>

                {/* Usage Progress */}
                {referral.max_uses && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Usage</span>
                      <span className="font-semibold text-gray-900">
                        {referral.current_uses} / {referral.max_uses}
                      </span>
                    </div>
                    <Progress 
                      value={(referral.current_uses / referral.max_uses) * 100} 
                      className="h-2"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyToClipboard(referral.referral_link, 'Referral link')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(referral.referral_link, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the campaign "{referral.campaign_name}"? 
                          This action cannot be undone and will remove all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteReferral(referral.id, referral.campaign_name || '')}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Campaign
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Earned</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReferrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {referral.campaign_name || 'Unnamed Campaign'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {referral.description || 'No description'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {referral.event?.name || 'No event'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {referral.event?.start_date ? 
                        new Date(referral.event.start_date).toLocaleDateString() : 
                        'No date'
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {referral.referral_code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(referral.referral_code, 'Referral code')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(referral.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Clicks:</span>
                        <span className="font-semibold">{referral.total_clicks || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Conversions:</span>
                        <span className="font-semibold">{referral.total_registrations || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Rate:</span>
                        <span className="font-semibold">
                          {referral.conversion_rate ? `${referral.conversion_rate.toFixed(1)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-gray-900">
                      {formatCommission(referral)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {referral.commission_type === 'percentage' ? 'Percentage' : 'Fixed'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-green-600">
                      {new Intl.NumberFormat('en-ET', {
                        style: 'currency',
                        currency: 'ETB',
                        minimumFractionDigits: 0,
                      }).format(referral.total_commission_earned || 0)}
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
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(referral.referral_link, 'Referral link')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(referral.referral_link, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Empty State */}
      {filteredReferrals.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Campaigns Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || campaignFilter || eventFilter
                ? 'No campaigns match your current filters. Try adjusting your search criteria.'
                : 'Get started by creating your first referral campaign for this vendor.'
              }
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateReferralCampaignDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        vendorId={vendorId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['vendor-referrals'] });
          queryClient.invalidateQueries({ queryKey: ['vendor-referral-analytics'] });
        }}
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
