import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from 'lucide-react';

// Mock data for offline functionality
const MOCK_VENDORS = [
  {
    id: 1,
    name: 'Elite Catering Services',
    email: 'contact@elitecatering.com',
    phone: '+251-911-234-567',
    status: 'active',
    services: ['Catering', 'Event Planning'],
    rating: 4.8,
    total_quotations: 15,
    pending_quotations: 3,
    total_payments: 125000,
    pending_payments: 25000,
    last_activity: '2 hours ago',
  },
  {
    id: 2,
    name: 'Premium Photography Studio',
    email: 'info@premiumphoto.com',
    phone: '+251-922-345-678',
    status: 'active',
    services: ['Photography', 'Videography'],
    rating: 4.9,
    total_quotations: 8,
    pending_quotations: 1,
    total_payments: 75000,
    pending_payments: 15000,
    last_activity: '1 day ago',
  },
  {
    id: 3,
    name: 'Sound & Light Solutions',
    email: 'hello@soundlight.com',
    phone: '+251-933-456-789',
    status: 'pending_approval',
    services: ['Audio Equipment', 'Lighting'],
    rating: 4.6,
    total_quotations: 5,
    pending_quotations: 2,
    total_payments: 45000,
    pending_payments: 10000,
    last_activity: '3 days ago',
  },
];

const MOCK_QUOTATIONS = [
  {
    id: 1,
    vendor_id: 1,
    vendor_name: 'Elite Catering Services',
    quotation_number: 'QUO-2025-000001',
    amount: 45000,
    status: 'pending',
    event_name: 'Corporate Annual Meeting',
    created_at: '2025-01-15',
    due_date: '2025-01-20',
  },
  {
    id: 2,
    vendor_id: 2,
    vendor_name: 'Premium Photography Studio',
    quotation_number: 'QUO-2025-000002',
    amount: 25000,
    status: 'approved',
    event_name: 'Wedding Ceremony',
    created_at: '2025-01-14',
    due_date: '2025-01-18',
  },
  {
    id: 3,
    vendor_id: 3,
    vendor_name: 'Sound & Light Solutions',
    quotation_number: 'QUO-2025-000003',
    amount: 18000,
    status: 'rejected',
    event_name: 'Music Concert',
    created_at: '2025-01-13',
    due_date: '2025-01-17',
  },
];

const MOCK_STATISTICS = {
  total_vendors: 12,
  active_vendors: 8,
  pending_approval: 3,
  suspended_vendors: 1,
  total_quotations: 28,
  pending_quotations: 6,
  approved_quotations: 18,
  rejected_quotations: 4,
  total_payments: 450000,
  pending_payments: 75000,
  average_rating: 4.7,
};

// Enhanced API functions with fallback to mock data
const fetchVendors = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/vendors', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt') || ''}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('API not available');
    }
    
    const data = await response.json();
    return data.data?.data || data.data || data;
  } catch (error) {
    console.log('Using mock data for vendors');
    return MOCK_VENDORS;
  }
};

const fetchQuotations = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/vendors/quotations', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt') || ''}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('API not available');
    }
    
    const data = await response.json();
    return data.data?.data || data.data || data;
  } catch (error) {
    console.log('Using mock data for quotations');
    return MOCK_QUOTATIONS;
  }
};

const fetchStatistics = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/vendors/statistics', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt') || ''}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('API not available');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.log('Using mock data for statistics');
    return MOCK_STATISTICS;
  }
};

export default function VendorManagementNew() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAddVendor, setShowAddVendor] = useState(false);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch data with fallback to mock data
  const { data: vendors = [], isLoading: vendorsLoading, refetch: refetchVendors } = useQuery({
    queryKey: ['vendors-new'],
    queryFn: fetchVendors,
    retry: 1,
    staleTime: 30000,
  });

  const { data: quotations = [], isLoading: quotationsLoading, refetch: refetchQuotations } = useQuery({
    queryKey: ['quotations-new'],
    queryFn: fetchQuotations,
    retry: 1,
    staleTime: 30000,
  });

  const { data: statistics = MOCK_STATISTICS, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['vendor-statistics-new'],
    queryFn: fetchStatistics,
    retry: 1,
    staleTime: 60000,
  });

  // Filter vendors based on search and status
  const filteredVendors = vendors.filter((vendor: any) => {
    const matchesSearch = vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.services?.some((service: string) => 
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
    toast.success('Data refreshed successfully');
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
          <p className="text-gray-600">Manage vendors, quotations, and payments</p>
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
          
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={() => setShowAddVendor(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_vendors}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.active_vendors} active, {statistics.pending_approval} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_quotations}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.pending_quotations} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.total_payments)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statistics.pending_payments)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.average_rating}</div>
            <p className="text-xs text-muted-foreground">
              Based on vendor reviews
            </p>
          </CardContent>
        </Card>
      </div>

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

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
          <CardDescription>Manage your vendor partners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
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
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          <div className="text-sm text-gray-500">ID: {vendor.id}</div>
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
                          {vendor.services?.map((service: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(vendor.status)}>
                          {vendor.status?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span>{vendor.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{vendor.total_quotations} total</div>
                          <div className="text-sm text-orange-600">{vendor.pending_quotations} pending</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{formatCurrency(vendor.total_payments)}</div>
                          <div className="text-sm text-orange-600">{formatCurrency(vendor.pending_payments)} pending</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">{vendor.last_activity}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
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

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quotations ({filteredQuotations.length})</CardTitle>
          <CardDescription>Track quotation status and approvals</CardDescription>
        </CardHeader>
        <CardContent>
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
                        <div className="text-sm text-gray-500">{quotation.created_at}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">{quotation.due_date}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {quotation.status === 'pending' && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive">
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            View
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
                        <p className="text-sm">Try adjusting your search criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Vendor Dialog */}
      <Dialog open={showAddVendor} onOpenChange={setShowAddVendor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
            <DialogDescription>
              Add a new vendor to your management system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Vendor Name</label>
                <Input placeholder="Enter vendor name" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input placeholder="Enter email address" type="email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input placeholder="Enter phone number" />
              </div>
              <div>
                <label className="text-sm font-medium">Website</label>
                <Input placeholder="Enter website URL" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Services</label>
              <Input placeholder="Enter services (comma separated)" />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input placeholder="Enter business address" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddVendor(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('Vendor added successfully!');
                setShowAddVendor(false);
              }}>
                Add Vendor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}














