import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  FileText, 
  CreditCard, 
  Truck, 
  Star, 
  BarChart3, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Edit,
  Eye,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Trash2,
  FileSpreadsheet,
  Filter as FilterIcon,
  X,
  UserCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getVendors,
  getVendorQuotations,
  getVendorStatistics,
  approveVendorQuotation,
  rejectVendorQuotation,
  bulkActivateVendors,
  bulkDeactivateVendors,
  bulkDeleteVendors,
  exportVendorReport,
  updateVendor,
  activateVendor,
  deactivateVendor
} from '@/lib/api';
import AddVendorModal from '@/components/AddVendorModal';
import { useAuth } from '@/hooks/use-auth';

// Utility function to handle services_provided as either array or JSON string
const parseServicesProvided = (services: any): string[] => {
  if (typeof services === 'string') {
    try {
      const parsed = JSON.parse(services);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return Array.isArray(services) ? services : [];
};

// Types
interface Vendor {
  id: number;
  name: string;
  email: string;
  phone: string;
  services_provided: string[];
  status: 'active' | 'inactive' | 'pending_approval' | 'suspended';
  average_rating: number;
  total_ratings: number;
  total_quotations: number;
  approved_quotations: number;
  pending_quotations: number;
  total_payments: number;
  pending_payments: number;
  completed_deliveries: number;
  pending_deliveries: number;
  created_at: string;
  updated_at: string;
  recent_activity?: string;
}

interface Quotation {
  id: number;
  quotation_number: string;
  vendor: { id: number; name: string };
  event: { id: number; title: string };
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  submission_date: string;
  description: string;
}

export default function VendorManagement() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('vendors');
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Check if user has permission
  const allowedRoles = ['superadmin', 'admin', 'organizer', 'organizer_admin'];
  const hasPermission = user && allowedRoles.includes(user.role);

  // API Queries
  const { data: vendorsResponse, isLoading: vendorsLoading, error: vendorsError } = useQuery({
    queryKey: ['vendors', searchTerm],
    queryFn: () => getVendors({ search: searchTerm }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Vendors query error:', error);
    }
  });

  const { data: quotationsResponse, isLoading: quotationsLoading, error: quotationsError } = useQuery({
    queryKey: ['vendor-quotations', searchTerm],
    queryFn: () => getVendorQuotations({ search: searchTerm }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Quotations query error:', error);
    }
  });

  const { data: vendorStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['vendor-statistics'],
    queryFn: getVendorStatistics,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Statistics query error:', error);
    }
  });

  // Extract data with proper pagination handling and fallbacks
  const vendors = Array.isArray(vendorsResponse?.data?.data) ? vendorsResponse.data.data : 
                 Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : 
                 Array.isArray(vendorsResponse) ? vendorsResponse : [];
  
  const quotations = Array.isArray(quotationsResponse?.data?.data) ? quotationsResponse.data.data : 
                    Array.isArray(quotationsResponse?.data) ? quotationsResponse.data : 
                    Array.isArray(quotationsResponse) ? quotationsResponse : [];
  
  // Pagination metadata
  const vendorsPagination = vendorsResponse?.data?.meta || null;
  const quotationsPagination = quotationsResponse?.data?.meta || null;

  // Mutations
  const approveQuotationMutation = useMutation({
    mutationFn: approveVendorQuotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-quotations'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics'] });
      toast.success('Quotation approved successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to approve quotation';
      toast.error(`Error: ${errorMessage}`);
      console.error('Approve quotation error:', error);
    },
  });

  const rejectQuotationMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectVendorQuotation(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-quotations'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics'] });
      toast.success('Quotation rejected successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to reject quotation';
      toast.error(`Error: ${errorMessage}`);
      console.error('Reject quotation error:', error);
    },
  });

  // Bulk Operations Mutations
  const bulkActivateMutation = useMutation({
    mutationFn: bulkActivateVendors,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics'] });
      setSelectedVendors([]);
      toast.success('Selected vendors activated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to activate vendors';
      toast.error(`Error: ${errorMessage}`);
    },
  });

  const bulkDeactivateMutation = useMutation({
    mutationFn: bulkDeactivateVendors,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics'] });
      setSelectedVendors([]);
      toast.success('Selected vendors deactivated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to deactivate vendors';
      toast.error(`Error: ${errorMessage}`);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteVendors,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics'] });
      setSelectedVendors([]);
      toast.success('Selected vendors deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to delete vendors';
      toast.error(`Error: ${errorMessage}`);
    },
  });

  // Status Transition Mutations
  const updateVendorStatusMutation = useMutation({
    mutationFn: ({ vendorId, status }: { vendorId: number; status: string }) => 
      updateVendor(vendorId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics'] });
      toast.success('Vendor status updated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to update vendor status';
      toast.error(`Error: ${errorMessage}`);
    },
  });

  const activateVendorMutation = useMutation({
    mutationFn: activateVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics'] });
      toast.success('Vendor activated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to activate vendor';
      toast.error(`Error: ${errorMessage}`);
    },
  });

  const deactivateVendorMutation = useMutation({
    mutationFn: deactivateVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics'] });
      toast.success('Vendor deactivated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to deactivate vendor';
      toast.error(`Error: ${errorMessage}`);
    },
  });

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVendors(vendors.map(v => v.id));
    } else {
      setSelectedVendors([]);
    }
  };

  const handleSelectVendor = (vendorId: number, checked: boolean) => {
    if (checked) {
      setSelectedVendors(prev => [...prev, vendorId]);
    } else {
      setSelectedVendors(prev => prev.filter(id => id !== vendorId));
    }
  };

  // Bulk operation handlers
  const handleBulkActivate = () => {
    if (selectedVendors.length === 0) return;
    bulkActivateMutation.mutate(selectedVendors);
  };

  const handleBulkDeactivate = () => {
    if (selectedVendors.length === 0) return;
    bulkDeactivateMutation.mutate(selectedVendors);
  };

  const handleBulkDelete = () => {
    if (selectedVendors.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedVendors.length} vendor(s)? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedVendors);
    }
  };

  const handleExportVendors = async () => {
    try {
      const response = await exportVendorReport();
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vendors-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Vendor report exported successfully');
    } catch (error: any) {
      toast.error('Failed to export vendor report');
      console.error('Export error:', error);
    }
  };

  // Status transition handlers
  const handleStatusChange = (vendorId: number, newStatus: string) => {
    const statusTransitions = {
      'pending_approval': ['active', 'suspended'],
      'active': ['inactive', 'suspended'],
      'inactive': ['active', 'suspended'],
      'suspended': ['active', 'inactive']
    };

    const currentVendor = vendors.find(v => v.id === vendorId);
    if (!currentVendor) return;

    const allowedTransitions = statusTransitions[currentVendor.status as keyof typeof statusTransitions] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      toast.error(`Cannot change status from ${currentVendor.status} to ${newStatus}`);
      return;
    }

    updateVendorStatusMutation.mutate({ vendorId, status: newStatus });
  };

  const handleQuickActivate = (vendorId: number) => {
    activateVendorMutation.mutate(vendorId);
  };

  const handleQuickDeactivate = (vendorId: number) => {
    deactivateVendorMutation.mutate(vendorId);
  };

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending_approval':
        return <Clock className="h-4 w-4" />;
      case 'suspended':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Check if user has permission
  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access Vendor Management.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (vendorsLoading || quotationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load the vendor data.</p>
        </div>
      </div>
    );
  }

  // Show error state if there are critical API errors
  if (vendorsError || quotationsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">
            {vendorsError ? 'Failed to load vendors' : 'Failed to load quotations'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // StatCard component
  const StatCard = ({ title, value, icon: Icon, description, trend, color = "blue" }: any) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <div className={`flex items-center text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive vendor management system for events
            {user && (
              <span className="block text-sm text-blue-600 mt-1">
                Welcome, {user.name} ({user.role})
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <FilterIcon className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={() => setIsAddVendorModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={searchTerm} onValueChange={setSearchTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => setShowFilters(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Vendors"
          value={vendorStats?.data?.total_vendors || 0}
          icon={Users}
          description="Active vendors in system"
          trend={5.2}
        />
        <StatCard
          title="Active Vendors"
          value={vendorStats?.data?.active_vendors || 0}
          icon={UserCheck}
          description="Currently active"
          color="green"
        />
        <StatCard
          title="Pending Approval"
          value={vendorStats?.data?.pending_approval || 0}
          icon={Clock}
          description="Awaiting review"
          color="yellow"
        />
        <StatCard
          title="Average Rating"
          value={(vendorStats?.data?.average_rating || 0).toFixed(1)}
          icon={Star}
          description="Overall vendor quality"
          color="purple"
        />
      </div>

      {/* Bulk Operations Bar */}
      {selectedVendors.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedVendors.length} vendor(s) selected
                </span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleBulkActivate}
                  disabled={bulkActivateMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {bulkActivateMutation.isPending ? 'Activating...' : 'Activate'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleBulkDeactivate}
                  disabled={bulkDeactivateMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {bulkDeactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleExportVendors}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="vendors">
            <Users className="h-4 w-4 mr-2" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="quotations">
            <FileText className="h-4 w-4 mr-2" />
            Quotations
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="deliveries">
            <Truck className="h-4 w-4 mr-2" />
            Deliveries
          </TabsTrigger>
          <TabsTrigger value="ratings">
            <Star className="h-4 w-4 mr-2" />
            Ratings
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Directory</CardTitle>
              <CardDescription>
                Manage and monitor all vendors in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendorsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : vendorsError ? (
                <div className="text-center py-8 text-red-600">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>Error loading vendors: {vendorsError.message}</p>
                </div>
              ) : vendors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <p>No vendors found</p>
                  <Button onClick={() => setIsAddVendorModalOpen(true)} className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Vendor
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedVendors.length === vendors.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors && vendors.length > 0 ? vendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedVendors.includes(vendor.id)}
                            onCheckedChange={(checked) => handleSelectVendor(vendor.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{vendor.name}</div>
                            <div className="text-sm text-gray-500">{vendor.email}</div>
                            <div className="text-sm text-gray-500">{vendor.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              const services = parseServicesProvided(vendor.services_provided);
                              return (
                                <>
                                  {services.slice(0, 2).map((service) => (
                                    <Badge key={service} variant="secondary" className="text-xs">
                                      {service}
                                    </Badge>
                                  ))}
                                  {services.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{services.length - 2} more
                                    </Badge>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(vendor.status)} flex items-center gap-1`}>
                            {getStatusIcon(vendor.status)}
                            {vendor.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{vendor.average_rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-500">({vendor.total_ratings})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {vendor.recent_activity || 'Recently updated'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {vendor.status === 'pending_approval' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleQuickActivate(vendor.id)}
                                disabled={activateVendorMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {vendor.status === 'active' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleQuickDeactivate(vendor.id)}
                                disabled={deactivateVendorMutation.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-gray-500">
                            <Users className="h-8 w-8 mx-auto mb-2" />
                            <p>No vendors found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
              
              {/* Pagination Controls */}
              {vendorsPagination && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-700">
                    Showing {vendorsPagination.from || 0} to {vendorsPagination.to || 0} of {vendorsPagination.total || 0} results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!vendorsPagination.prev_page_url}
                      onClick={() => {
                        // TODO: Implement pagination navigation
                        console.log('Previous page');
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!vendorsPagination.next_page_url}
                      onClick={() => {
                        // TODO: Implement pagination navigation
                        console.log('Next page');
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotations Tab */}
        <TabsContent value="quotations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Quotations</CardTitle>
              <CardDescription>
                Review and manage vendor quotations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quotationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : quotationsError ? (
                <div className="text-center py-8 text-red-600">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>Error loading quotations: {quotationsError.message}</p>
                </div>
              ) : quotations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>No quotations found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quotation #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations && quotations.length > 0 ? quotations.map((quotation) => (
                      <TableRow key={quotation.id}>
                        <TableCell className="font-medium">{quotation.quotation_number}</TableCell>
                        <TableCell>{quotation.vendor.name}</TableCell>
                        <TableCell>{quotation.event.title}</TableCell>
                        <TableCell className="font-medium">${quotation.amount}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(quotation.status)}`}>
                            {quotation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(quotation.submission_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {quotation.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => approveQuotationMutation.mutate(quotation.id)}
                                  disabled={approveQuotationMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectQuotationMutation.mutate({ id: quotation.id, reason: 'Rejected by admin' })}
                                  disabled={rejectQuotationMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-gray-500">
                            <FileText className="h-8 w-8 mx-auto mb-2" />
                            <p>No quotations found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs with placeholder content */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>Track and manage vendor payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4" />
                <p>Payment management coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Tracking</CardTitle>
              <CardDescription>Monitor vendor service deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-4" />
                <p>Delivery tracking coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Ratings & Reviews</CardTitle>
              <CardDescription>View and manage vendor performance ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-4" />
                <p>Rating system coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>Generate comprehensive vendor reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-32 flex-col space-y-2">
                  <FileSpreadsheet className="h-8 w-8" />
                  <span>Export Vendor Report</span>
                </Button>
                <Button variant="outline" className="h-32 flex-col space-y-2">
                  <BarChart3 className="h-8 w-8" />
                  <span>Performance Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Vendor Modal */}
      <AddVendorModal
        isOpen={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
      />
    </div>
  );
}
