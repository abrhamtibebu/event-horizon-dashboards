import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from '@/components/ui/ModernToast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Plus,
  Search,
  Settings,
  Star,
  TrendingUp,
  Users,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Eye,
  Edit,
  Trash2,
  User,
  UserCheck,
  UserX,
  Info,
  MoreHorizontal,
  BarChart3,
} from 'lucide-react';
import vendorApi from '@/lib/vendorApi';
import { taskApi, Task } from '@/lib/taskApi';
import AddVendorModalEnhanced from '@/components/AddVendorModalEnhanced';
import VendorManagementModal from '@/components/VendorManagementModal';
import { VendorAnalytics } from '@/components/VendorAnalytics';
import { autoSetupTestAuth } from '@/lib/authHelper';
import { DeleteConfirmationDialog, HardDeleteConfirmationDialog, StatusChangeConfirmationDialog } from '@/components/ui/ConfirmationDialog';

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

export default function VendorManagementRevamped() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showVendorManagement, setShowVendorManagement] = useState(false);
  
  // Confirmation dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false);
  const [showStatusChangeConfirm, setShowStatusChangeConfirm] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<any>(null);
  const [vendorToHardDelete, setVendorToHardDelete] = useState<any>(null);
  const [statusChangeData, setStatusChangeData] = useState<{
    vendor: any;
    currentStatus: string;
    newStatus: string;
  } | null>(null);
  
  // Get user role from localStorage or default to organizer for demo
  const [userRole] = useState(() => {
    const role = localStorage.getItem('user_role') || 'organizer';
    return role;
  });

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);

  const queryClient = useQueryClient();

  // Check online status and clear cache on mount
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clear vendor cache on mount to ensure fresh data
    vendorApi.clearVendorCache();
    
    // Auto-setup test authentication if needed
    autoSetupTestAuth();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load tasks on component mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const result = await taskApi.getTasks();
        // Ensure we have an array of tasks
        const tasksData = Array.isArray(result.data) ? result.data : [];
        setTasks(tasksData);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setTasks([]);
      }
    };

    loadTasks();
  }, []);

  // Fetch data using the new API service
  const { data: vendors = [], isLoading: vendorsLoading, refetch: refetchVendors } = useQuery({
    queryKey: ['vendors-revamped'],
    queryFn: () => vendorApi.getVendors(),
    retry: 1,
    staleTime: 30000,
  });

  const { data: quotations = [], isLoading: quotationsLoading, refetch: refetchQuotations } = useQuery({
    queryKey: ['quotations-revamped'],
    queryFn: () => vendorApi.getQuotations(),
    retry: 1,
    staleTime: 30000,
  });


  const { data: statistics = {}, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['vendor-statistics-revamped'],
    queryFn: () => vendorApi.getStatistics(),
    retry: 1,
    staleTime: 60000,
  });

  // Mutations
  const approveQuotationMutation = useMutation({
    mutationFn: (id: number) => vendorApi.approveQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations-revamped'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics-revamped'] });
      toast.success('Quotation approved successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to approve quotation: ${error.message}`);
    },
  });

  const rejectQuotationMutation = useMutation({
    mutationFn: (id: number) => vendorApi.rejectQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations-revamped'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics-revamped'] });
      toast.success('Quotation rejected successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to reject quotation: ${error.message}`);
    },
  });

  const bulkActivateMutation = useMutation({
    mutationFn: (vendorIds: number[]) => vendorApi.bulkOperations('activate', vendorIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics-revamped'] });
      setSelectedVendors([]);
      setShowBulkActions(false);
      toast.success('Vendors activated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to activate vendors: ${error.message}`);
    },
  });

  const bulkDeactivateMutation = useMutation({
    mutationFn: (vendorIds: number[]) => vendorApi.bulkOperations('deactivate', vendorIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics-revamped'] });
      setSelectedVendors([]);
      setShowBulkActions(false);
      toast.success('Vendors deactivated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to deactivate vendors: ${error.message}`);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (vendorIds: number[]) => vendorApi.bulkOperations('delete', vendorIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics-revamped'] });
      setSelectedVendors([]);
      setShowBulkActions(false);
      showSuccessToast('Vendors Deleted', 'Selected vendors have been successfully deleted.');
    },
    onError: (error: any) => {
      console.error('Failed to delete vendors:', error);
      
      if (error?.response?.data?.constraints) {
        const constraints = error.response.data.constraints;
        const constraintMessages = [];
        
        if (constraints.active_quotations > 0) {
          constraintMessages.push(`${constraints.active_quotations} pending quotation(s)`);
        }
        if (constraints.active_payments > 0) {
          constraintMessages.push(`${constraints.active_payments} pending payment(s)`);
        }
        if (constraints.active_deliveries > 0) {
          constraintMessages.push(`${constraints.active_deliveries} pending delivery(ies)`);
        }
        
        showErrorToast(
          'Cannot Delete Vendors',
          `Please resolve: ${constraintMessages.join(', ')}`
        );
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete vendors';
        showErrorToast('Delete Failed', errorMessage);
      }
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (vendorId: number) => vendorApi.hardDeleteVendor(vendorId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics-revamped'] });
      queryClient.invalidateQueries({ queryKey: ['quotations-revamped'] });
      
      // Show detailed success message with deleted records info
      if (data.deleted_records) {
        const deletedInfo = [];
        if (data.deleted_records.quotations > 0) deletedInfo.push(`${data.deleted_records.quotations} quotation(s)`);
        if (data.deleted_records.payments > 0) deletedInfo.push(`${data.deleted_records.payments} payment(s)`);
        if (data.deleted_records.deliveries > 0) deletedInfo.push(`${data.deleted_records.deliveries} delivery(ies)`);
        if (data.deleted_records.ratings > 0) deletedInfo.push(`${data.deleted_records.ratings} rating(s)`);
        
        const deletedText = deletedInfo.length > 0 ? ` and ${deletedInfo.join(', ')}` : '';
        toast.success(`Vendor permanently deleted${deletedText}!`);
      } else {
        toast.success('Vendor permanently deleted!');
      }
    },
    onError: (error: any) => {
      console.error('Failed to hard delete vendor:', error);
      toast.error(`Failed to hard delete vendor: ${error.message}`);
    },
  });

  // Filter vendors based on search and status
  const filteredVendors = vendors.filter((vendor: any) => {
    const services = parseServicesProvided(vendor.services_provided);
    
    const matchesSearch = vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         services.some((service: string) => 
                           service.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter quotations
  const filteredQuotations = quotations.filter((quotation: any) => {
    return quotation.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           quotation.quotation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           quotation.event_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuotationStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  const handleRefresh = () => {
    refetchVendors();
    refetchQuotations();
    refetchStats();
    vendorApi.clearCache();
    toast.success('Data refreshed successfully');
  };

  // Helper function to create complete vendor update data
  const createVendorUpdateData = (vendor: any, newStatus: string) => {
    return {
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website || '',
      address: vendor.address || '',
      services_provided: parseServicesProvided(vendor.services_provided),
      tax_id: vendor.tax_id || '',
      business_license: vendor.business_license || '',
      payment_terms: vendor.payment_terms || '',
      contact_person: vendor.contact_person || '',
      contact_phone: vendor.contact_phone || '',
      contact_email: vendor.contact_email || '',
      notes: vendor.notes || '',
      status: newStatus,
    };
  };

  // Helper function to check if vendor can be deleted
  const canDeleteVendor = (vendor: any) => {
    const activeQuotations = vendor.pending_quotations || 0;
    const activePayments = vendor.pending_payments || 0;
    const activeDeliveries = vendor.pending_deliveries || 0;
    
    return activeQuotations === 0 && activePayments === 0 && activeDeliveries === 0;
  };

  const handleSelectVendor = (vendorId: number) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSelectAll = () => {
    if (selectedVendors.length === filteredVendors.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(filteredVendors.map((v: any) => v.id));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedVendors.length === 0) {
      toast.error('Please select vendors first');
      return;
    }

    switch (action) {
      case 'activate':
        bulkActivateMutation.mutate(selectedVendors);
        break;
      case 'deactivate':
        bulkDeactivateMutation.mutate(selectedVendors);
        break;
      case 'approve':
        bulkActivateMutation.mutate(selectedVendors);
        break;
      case 'suspend':
        bulkDeactivateMutation.mutate(selectedVendors);
        break;
      case 'delete':
        setVendorToDelete({ 
          name: `${selectedVendors.length} vendors`, 
          ids: selectedVendors,
          isBulk: true 
        });
        setShowDeleteConfirm(true);
        break;
    }
  };

  // Confirmation dialog handlers
  const handleDeleteConfirm = async () => {
    if (!vendorToDelete) return;

    try {
      if (vendorToDelete.isBulk) {
        await bulkDeleteMutation.mutateAsync(vendorToDelete.ids);
      } else {
        await vendorApi.deleteVendor(vendorToDelete.id);
        queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
        toast.success('Vendor deleted successfully');
      }
    } catch (error: any) {
      console.error('Failed to delete vendor:', error);
      
      if (error?.response?.data?.constraints) {
        const constraints = error.response.data.constraints;
        const constraintMessages = [];
        
        if (constraints.active_quotations > 0) {
          constraintMessages.push(`${constraints.active_quotations} pending quotation(s)`);
        }
        if (constraints.active_payments > 0) {
          constraintMessages.push(`${constraints.active_payments} pending payment(s)`);
        }
        if (constraints.active_deliveries > 0) {
          constraintMessages.push(`${constraints.active_deliveries} pending delivery(ies)`);
        }
        
        toast.error(
          `Cannot delete vendor. Please resolve: ${constraintMessages.join(', ')}`
        );
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete vendor';
        toast.error(errorMessage);
      }
    } finally {
      setShowDeleteConfirm(false);
      setVendorToDelete(null);
    }
  };

  const handleHardDeleteConfirm = async () => {
    if (!vendorToHardDelete) return;

    try {
      await hardDeleteMutation.mutateAsync(vendorToHardDelete.id);
      queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
      showSuccessToast('Vendor Hard Deleted', 'Vendor and all associated data have been permanently removed.');
    } catch (error: any) {
      console.error('Failed to hard delete vendor:', error);
      showErrorToast('Hard Delete Failed', `Failed to hard delete vendor: ${error.message}`);
    } finally {
      setShowHardDeleteConfirm(false);
      setVendorToHardDelete(null);
    }
  };

  const handleStatusChangeConfirm = async () => {
    if (!statusChangeData) return;

    try {
      await vendorApi.updateVendor(statusChangeData.vendor.id, { 
        status: statusChangeData.newStatus 
      });
      queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
      toast.success(`Vendor status changed to ${statusChangeData.newStatus}`);
    } catch (error: any) {
      console.error('Failed to update vendor status:', error);
      toast.error('Failed to update vendor status');
    } finally {
      setShowStatusChangeConfirm(false);
      setStatusChangeData(null);
    }
  };

  if (vendorsLoading || quotationsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Vendor Management</h2>
          <p className="text-gray-600">Please wait while we load your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendor Management</h1>
          <p className="text-gray-600">
            Manage vendors, quotations, and payments
            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              userRole === 'organizer' 
                ? 'bg-blue-100 text-blue-800' 
                : userRole === 'admin' 
                ? 'bg-green-100 text-green-800'
                : 'bg-purple-100 text-purple-800'
            }`}>
              <User className="h-3 w-3 mr-1" />
              {userRole === 'organizer' ? 'Organizer View' : 
               userRole === 'admin' ? 'Admin View' : 
               'Super Admin View'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Online Status Indicator */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-sm">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-orange-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm">Offline Mode</span>
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={vendorsLoading || quotationsLoading || statsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(vendorsLoading || quotationsLoading || statsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </Button>
          <Button onClick={() => setShowAddVendor(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Info className="h-4 w-4" />
          <span>
            {userRole === 'organizer' 
              ? 'Statistics show data for your vendors only' 
              : 'Statistics show data for all vendors'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_vendors || vendors.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.active_vendors || vendors.filter((v: any) => v.status === 'active').length || 0} active, {statistics.pending_approval || vendors.filter((v: any) => v.status === 'pending_approval').length || 0} pending
              {!isOnline && (
                <span className="ml-2 inline-flex items-center text-orange-600">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_quotations || quotations.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.pending_quotations || quotations.filter((q: any) => q.status === 'pending').length || 0} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.total_payments || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statistics.pending_payments || 0)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.average_rating || 0}</div>
            <p className="text-xs text-muted-foreground">
              Based on vendor reviews
            </p>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Tasks Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tasks Overview
          </CardTitle>
          <CardDescription>
            Track and manage tasks for your vendors and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Array.isArray(tasks) ? tasks.filter(t => t.status === 'pending').length : 0}
              </div>
              <div className="text-sm text-blue-600">Pending Tasks</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {Array.isArray(tasks) ? tasks.filter(t => t.status === 'in_progress').length : 0}
              </div>
              <div className="text-sm text-yellow-600">In Progress</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Array.isArray(tasks) ? tasks.filter(t => t.status === 'completed').length : 0}
              </div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {Array.isArray(tasks) ? tasks.filter(t => t.status === 'cancelled').length : 0}
              </div>
              <div className="text-sm text-red-600">Cancelled</div>
            </div>
          </div>
          
          {Array.isArray(tasks) && tasks.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3">Recent Tasks</h4>
              <div className="space-y-2">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-gray-500">
                          {task.vendor?.name} • {task.type}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics and Reports Section */}
      {showAnalytics && (
        <VendorAnalytics />
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search vendors, services, or quotations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedVendors.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedVendors.length} vendor(s) selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                  disabled={bulkActivateMutation.isPending}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={bulkDeactivateMutation.isPending}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('approve')}
                  disabled={bulkActivateMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('suspend')}
                  disabled={bulkDeactivateMutation.isPending}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Suspend
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedVendors([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
          <CardDescription>
            {userRole === 'organizer' 
              ? 'Manage your vendor partners - showing only vendors you\'ve created' 
              : 'Manage all vendor partners in the system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedVendors.length === filteredVendors.length && filteredVendors.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Quotations</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.length > 0 ? (
                  filteredVendors.map((vendor: any) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedVendors.includes(vendor.id)}
                          onChange={() => handleSelectVendor(vendor.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          <div className="text-sm text-gray-500">ID: {vendor.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">{vendor.organizer?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">Organizer</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{vendor.email}</div>
                          <div className="text-sm text-gray-500">{vendor.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {parseServicesProvided(vendor.services_provided).map((service: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={vendor.status} 
                          onValueChange={async (newStatus) => {
                            try {
                              const updateData = createVendorUpdateData(vendor, newStatus);
                              await vendorApi.updateVendor(vendor.id, updateData);
                              queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
                              toast.success(`Vendor status changed to ${newStatus.replace('_', ' ')}`);
                            } catch (error: any) {
                              console.error('Failed to update vendor status:', error);
                              const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update vendor status';
                              toast.error(errorMessage);
                            }
                          }}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending_approval">Pending</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span>{vendor.average_rating || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{vendor.total_quotations || 0} total</div>
                          <div className="text-sm text-orange-600">{vendor.pending_quotations || 0} pending</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{formatCurrency(vendor.total_payments || 0)}</div>
                          <div className="text-sm text-orange-600">{formatCurrency(vendor.pending_payments || 0)} pending</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">{vendor.last_activity}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setShowVendorManagement(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedVendor(vendor);
                                  setShowVendorManagement(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Manage Vendor
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    const updateData = createVendorUpdateData(vendor, 'active');
                                    await vendorApi.updateVendor(vendor.id, updateData);
                                    queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
                                    toast.success('Vendor activated');
                                  } catch (error: any) {
                                    console.error('Failed to activate vendor:', error);
                                    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to activate vendor';
                                    toast.error(errorMessage);
                                  }
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    const updateData = createVendorUpdateData(vendor, 'suspended');
                                    await vendorApi.updateVendor(vendor.id, updateData);
                                    queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
                                    toast.success('Vendor suspended');
                                  } catch (error: any) {
                                    console.error('Failed to suspend vendor:', error);
                                    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to suspend vendor';
                                    toast.error(errorMessage);
                                  }
                                }}
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  if (!canDeleteVendor(vendor)) {
                                    const activeQuotations = vendor.pending_quotations || 0;
                                    const activePayments = vendor.pending_payments || 0;
                                    const activeDeliveries = vendor.pending_deliveries || 0;
                                    const constraintMessages = [];
                                    
                                    if (activeQuotations > 0) {
                                      constraintMessages.push(`${activeQuotations} pending quotation(s)`);
                                    }
                                    if (activePayments > 0) {
                                      constraintMessages.push(`${activePayments} pending payment(s)`);
                                    }
                                    if (activeDeliveries > 0) {
                                      constraintMessages.push(`${activeDeliveries} pending delivery(ies)`);
                                    }
                                    
                                    toast.error(
                                      `Cannot delete vendor. Please resolve: ${constraintMessages.join(', ')}`
                                    );
                                    return;
                                  }

                                  setVendorToDelete(vendor);
                                  setShowDeleteConfirm(true);
                                }}
                                className={canDeleteVendor(vendor) ? "text-red-600" : "text-gray-400 cursor-not-allowed"}
                                disabled={!canDeleteVendor(vendor)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {canDeleteVendor(vendor) ? "Delete" : "Delete (Has Active Items)"}
                              </DropdownMenuItem>
                              
                              {/* Hard Delete Option - Superadmin, Admin, and Organizer */}
                              {(userRole === 'superadmin' || userRole === 'admin' || userRole === 'organizer') && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const activeQuotations = vendor.pending_quotations || 0;
                                    const activePayments = vendor.pending_payments || 0;
                                    const activeDeliveries = vendor.pending_deliveries || 0;
                                    
                                    let warningMessage = `Are you sure you want to PERMANENTLY DELETE ${vendor.name}?`;
                                    if (activeQuotations > 0 || activePayments > 0 || activeDeliveries > 0) {
                                      warningMessage += `\n\nThis will also permanently delete:`;
                                      if (activeQuotations > 0) warningMessage += `\n• ${activeQuotations} quotation(s)`;
                                      if (activePayments > 0) warningMessage += `\n• ${activePayments} payment(s)`;
                                      if (activeDeliveries > 0) warningMessage += `\n• ${activeDeliveries} delivery(ies)`;
                                      warningMessage += `\n\nThis action cannot be undone!`;
                                    }
                                    
                                    if (confirm(warningMessage)) {
                                      hardDeleteMutation.mutate(vendor.id);
                                    }
                                  }}
                                  className="text-red-800 bg-red-50 hover:bg-red-100"
                                  disabled={hardDeleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {hardDeleteMutation.isPending ? "Hard Deleting..." : 
                                   userRole === 'organizer' ? "Hard Delete (Organizer)" :
                                   userRole === 'admin' ? "Hard Delete (Admin)" :
                                   "Hard Delete (Superadmin)"}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <p>No vendors found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quotations Table */}      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Recent Quotations ({filteredQuotations.length})
                {quotationsLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </CardTitle>
              <CardDescription>
                {userRole === 'organizer' 
                  ? 'Track quotation status and approvals for your vendors' 
                  : 'Track quotation status and approvals for all vendors'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchQuotations()}
              disabled={quotationsLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${quotationsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {quotationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading quotations...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.length > 0 ? (
                    filteredQuotations.map((quotation: any) => (
                      <TableRow key={quotation.id}>
                        <TableCell>
                          <div className="font-medium">{quotation.quotation_number}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{quotation.vendor_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{quotation.event_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(quotation.amount)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getQuotationStatusColor(quotation.status)}>
                            {quotation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(quotation.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(quotation.due_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {quotation.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => approveQuotationMutation.mutate(quotation.id)}
                                  disabled={approveQuotationMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => rejectQuotationMutation.mutate(quotation.id)}
                                  disabled={rejectQuotationMutation.isPending}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-gray-500">
                          <FileText className="h-8 w-8 mx-auto mb-2" />
                          <p>No quotations found</p>
                          <p className="text-sm">
                            {quotations.length === 0 
                              ? 'No quotations have been created yet' 
                              : 'Try adjusting your search criteria'
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Add Vendor Modal */}
      <AddVendorModalEnhanced 
        open={showAddVendor} 
        onOpenChange={setShowAddVendor}
        onVendorCreated={() => {
          // Clear cache and refresh all vendor-related queries
          vendorApi.clearCache();
          queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
          queryClient.invalidateQueries({ queryKey: ['vendor-statistics-revamped'] });
          queryClient.invalidateQueries({ queryKey: ['quotations-revamped'] });
          // The success toast is already shown in the modal, so we don't need to show it again
        }}
      />

      {/* Vendor Management Modal */}
      <VendorManagementModal
        open={showVendorManagement}
        onOpenChange={setShowVendorManagement}
        vendor={selectedVendor}
        onVendorUpdated={() => {
          // Refresh vendor data when vendor is updated
          queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
          queryClient.invalidateQueries({ queryKey: ['vendor-statistics-revamped'] });
          queryClient.invalidateQueries({ queryKey: ['quotations-revamped'] });
        }}
      />

      {/* Confirmation Dialogs */}
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setVendorToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={vendorToDelete?.name || ''}
        itemType={vendorToDelete?.isBulk ? 'vendors' : 'vendor'}
        isLoading={bulkDeleteMutation.isPending}
      />

      <HardDeleteConfirmationDialog
        isOpen={showHardDeleteConfirm}
        onClose={() => {
          setShowHardDeleteConfirm(false);
          setVendorToHardDelete(null);
        }}
        onConfirm={handleHardDeleteConfirm}
        itemName={vendorToHardDelete?.name || ''}
        itemType="vendor"
        constraints={vendorToHardDelete?.constraints}
        isLoading={hardDeleteMutation.isPending}
      />

      <StatusChangeConfirmationDialog
        isOpen={showStatusChangeConfirm}
        onClose={() => {
          setShowStatusChangeConfirm(false);
          setStatusChangeData(null);
        }}
        onConfirm={handleStatusChangeConfirm}
        itemName={statusChangeData?.vendor?.name || ''}
        currentStatus={statusChangeData?.currentStatus || ''}
        newStatus={statusChangeData?.newStatus || ''}
        isLoading={false}
      />
    </div>
  );
}
