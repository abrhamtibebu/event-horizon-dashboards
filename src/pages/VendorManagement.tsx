import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Users,
  FileText,
  CheckCircle,
  FileCheck,
  DollarSign,
  CheckSquare,
  ArrowRight,
  Clock,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Import stage components
import VendorList from '@/components/vendor-revamped/VendorList';
import PurchaseRequestList from '@/components/vendor-revamped/PurchaseRequestList';
import ProformaList from '@/components/vendor-revamped/ProformaList';
import PurchaseOrderList from '@/components/vendor-revamped/PurchaseOrderList';
import PaymentRequestList from '@/components/vendor-revamped/PaymentRequestList';
import PaymentHistoryList from '@/components/vendor-revamped/PaymentHistoryList';
import VendorOnboardingModal from '@/components/vendor/VendorOnboardingModal';
import CreatePurchaseRequestModal from '@/components/vendor-revamped/CreatePurchaseRequestModal';
import VendorProfileModal from '@/components/vendor-revamped/VendorProfileModal';
import {
  getVendorStatistics,
  getPRStatistics,
  getProformaStatistics,
  getPOStatistics,
  getPaymentRequestStatistics,
  getVendorPaymentRevampedStatistics,
  api
} from '@/lib/api';

interface WorkflowStage {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  permissions: string[];
  color: string;
}

export default function VendorManagement() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissionCheck();

  const [activeStage, setActiveStage] = useState('vendors');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddPROpen, setIsAddPROpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);

  const handleEditVendor = useCallback((vendor: any) => {
    setSelectedVendor(vendor);
    setIsAddVendorOpen(true);
  }, []);

  const handleCreateVendor = useCallback(() => {
    setSelectedVendor(null);
    setIsAddVendorOpen(true);
  }, []);

  const handleViewProfile = useCallback((vendor: any) => {
    setSelectedVendor(vendor);
    setIsViewProfileOpen(true);
  }, []);

  const [stageCounts, setStageCounts] = useState<Record<string, number>>({
    'vendors': 0,
    'purchase-requests': 0,
    'proforma': 0,
    'purchase-orders': 0,
    'payment-requests': 0,
    'payments': 0,
  });

  const [vendorListKey, setVendorListKey] = useState(0);
  const [countsLoading, setCountsLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Define the 6-stage workflow
  const workflowStages: WorkflowStage[] = React.useMemo(() => [
    {
      id: 'vendors',
      label: 'Vendors',
      icon: Users,
      description: 'Manage vendor directory and create new vendors',
      permissions: ['vendors.view', 'vendors.create'],
      color: 'primary',
    },
    {
      id: 'purchase-requests',
      label: 'Purchase Requests',
      icon: FileText,
      description: 'Create and approve purchase requests',
      permissions: ['pr.view', 'pr.create', 'pr.approve'],
      color: 'primary',
    },
    {
      id: 'proforma',
      label: 'Proforma Invoices',
      icon: FileCheck,
      description: 'Upload and approve proforma invoices',
      permissions: ['proforma.view', 'proforma.upload'],
      color: 'primary',
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders',
      icon: CheckCircle,
      description: 'View and send purchase orders',
      permissions: ['po.view', 'po.send'],
      color: 'primary',
    },
    {
      id: 'payment-requests',
      label: 'Payment Requests',
      icon: DollarSign,
      description: 'Create and approve payment requests',
      permissions: ['payment_request.view', 'payment_request.create'],
      color: 'primary',
    },
    {
      id: 'payments',
      label: 'Payment History',
      icon: CheckSquare,
      description: 'Track completed payments and settlements',
      permissions: ['payments.view'],
      color: 'primary',
    },
  ], []);

  const hasAnyPurchasePermission = workflowStages.some(stage =>
    stage.permissions.some(perm => hasPermission(perm))
  );

  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated) return;

    setCountsLoading(true);
    try {
      // Helper to safely fetch stats if permitted
      const fetchIfPermitted = async (permission: string, endpoint: string | (() => Promise<any>), dataKeys: string | string[]) => {
        if (!hasPermission(permission)) return 0;
        try {
          const response = typeof endpoint === 'function' ? await endpoint() : await api.get(endpoint);

          if (response.data?.success) {
            const keys = Array.isArray(dataKeys) ? dataKeys : [dataKeys];
            for (const key of keys) {
              if (response.data.data?.[key] !== undefined) {
                return response.data.data[key];
              }
            }
          }
          return 0;
        } catch (err) {
          console.warn(`Could not fetch stats for ${permission} (${dataKeys})`, err);
          return 0;
        }
      };

      const [vCount, prCount, pfCount, poCount, prqCount, pCount] = await Promise.all([
        fetchIfPermitted('vendors.view', getVendorStatistics, ['total', 'total_vendors']),
        fetchIfPermitted('pr.view', getPRStatistics, 'pending'),
        fetchIfPermitted('proforma.view', getProformaStatistics, 'pending'),
        fetchIfPermitted('po.view', getPOStatistics, 'draft'),
        fetchIfPermitted('payment_request.view', getPaymentRequestStatistics, 'pending'),
        fetchIfPermitted('payments.view', getVendorPaymentRevampedStatistics, 'paid_payments')
      ]);

      setStageCounts({
        'vendors': vCount,
        'purchase-requests': prCount,
        'proforma': pfCount,
        'purchase-orders': poCount,
        'payment-requests': prqCount,
        'payments': pCount,
      });
    } catch (error) {
      console.error('Failed to fetch stage counts', error);
    } finally {
      setCountsLoading(false);
    }
  }, [hasPermission, isAuthenticated]);

  // Fetch counts only on mount and when permissions change, not activeStage
  useEffect(() => {
    if (isAuthenticated) {
      fetchCounts();
    }
  }, [isAuthenticated, fetchCounts]);

  // Handle stage switching based on permissions
  useEffect(() => {
    if (isAuthenticated && activeStage === 'vendors' && !hasPermission('vendors.view')) {
      const firstPermittedStage = workflowStages.find(stage =>
        stage.permissions.some(perm => hasPermission(perm))
      );
      if (firstPermittedStage) {
        setActiveStage(firstPermittedStage.id);
      }
    }
  }, [isAuthenticated, hasPermission, activeStage]);

  const handleStageChange = (stageId: string) => {
    const stage = workflowStages.find(s => s.id === stageId);
    if (stage) {
      const hasAccess = stage.permissions.some(perm => hasPermission(perm));
      if (hasAccess) {
        setActiveStage(stageId);
      } else {
        toast.error('Access Denied', {
          description: `You don't have permission to access ${stage.label}.`,
        });
      }
    }
  };

  if (authLoading || permissionsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!hasAnyPurchasePermission) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-none shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground max-w-sm">
              You don't have permission to access Vendor and Purchase Management. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb Navigation - More subtle */}
        <div className="mb-8 opacity-80">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Vendor Management', href: '/dashboard/vendor-management' }
            ]}
          />
        </div>

        {/* Header Section - Refined and Modern */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-10 bg-primary rounded-full" />
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Vendor <span className="text-primary">Management</span>
                </h1>
              </div>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl font-medium">
                Comprehensive procurement lifecycle: From discovery and onboarding to purchase requests and final settlement.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search vendors or requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 w-full sm:w-72 bg-card border-border shadow-sm focus-visible:ring-primary rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-card border-border shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchCounts}
                  className="h-11 w-11 rounded-xl bg-card border-border shrink-0 hover:text-primary transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Workflow Pipeline - Simple Modern Stepper */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-10">
            {workflowStages.map((stage, index) => {
              const isActive = activeStage === stage.id;
              const hasAccess = stage.permissions.some(perm => hasPermission(perm));
              const Icon = stage.icon;
              const count = stageCounts[stage.id] || 0;

              return (
                <button
                  key={stage.id}
                  onClick={() => handleStageChange(stage.id)}
                  disabled={!hasAccess}
                  className={cn(
                    "relative group flex flex-col items-start p-4 rounded-2xl border transition-all duration-300 text-left",
                    isActive
                      ? "bg-primary/5 border-primary shadow-[0_0_20px_rgba(var(--primary),0.05)]"
                      : hasAccess
                        ? "bg-card border-border hover:border-primary/50 hover:bg-accent/50 shadow-sm"
                        : "bg-muted/30 border-transparent opacity-40 cursor-not-allowed grayscale"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {count > 0 && (
                      <Badge variant={isActive ? "default" : "secondary"} className="text-[10px] font-bold rounded-md px-1.5 h-5">
                        {count}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-wider opacity-60 transition-opacity",
                      isActive ? "opacity-100" : ""
                    )}>
                      Step {index + 1}
                    </p>
                    <h3 className={cn(
                      "text-xs sm:text-sm font-bold truncate w-full",
                      isActive ? "text-primary" : "text-foreground"
                    )}>
                      {stage.label}
                    </h3>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-[1px] left-4 right-4 h-0.5 bg-primary rounded-t-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage Content */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeStage === 'vendors' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center sm:items-end flex-wrap gap-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold tracking-tight">Vendor Directory</h2>
                      <p className="text-muted-foreground text-sm">Browse and manage your verified service providers.</p>
                    </div>
                    {hasPermission('vendors.create') && (
                      <Button onClick={handleCreateVendor} className="rounded-xl shadow-lg shadow-primary/20 h-10 px-5 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="h-4 w-4 mr-2" />
                        New Vendor
                      </Button>
                    )}
                  </div>
                  <VendorList
                    key={vendorListKey}
                    searchTerm={debouncedSearch}
                    onEdit={handleEditVendor}
                    onViewProfile={handleViewProfile}
                  />
                </div>
              )}

              {activeStage === 'purchase-requests' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center sm:items-end flex-wrap gap-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold tracking-tight">Purchase Requests</h2>
                      <p className="text-muted-foreground text-sm">Internal requests awaiting vendor matching and approval.</p>
                    </div>
                    {hasPermission('pr.create') && (
                      <Button onClick={() => setIsAddPROpen(true)} className="rounded-xl shadow-lg shadow-primary/20 h-10 px-5 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <FileText className="h-4 w-4 mr-2" />
                        Create PR
                      </Button>
                    )}
                  </div>
                  <PurchaseRequestList searchTerm={debouncedSearch} />
                </div>
              )}

              {activeStage === 'proforma' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center sm:items-end flex-wrap gap-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold tracking-tight">Proforma Invoices</h2>
                      <p className="text-muted-foreground text-sm">Vendor quotes awaiting formal approval for purchase order generation.</p>
                    </div>
                  </div>
                  <ProformaList searchTerm={debouncedSearch} />
                </div>
              )}

              {activeStage === 'purchase-orders' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center sm:items-end flex-wrap gap-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold tracking-tight">Purchase Orders</h2>
                      <p className="text-muted-foreground text-sm">Legally binding orders sent to vendors for fulfillment.</p>
                    </div>
                  </div>
                  <PurchaseOrderList searchTerm={debouncedSearch} />
                </div>
              )}

              {activeStage === 'payment-requests' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center sm:items-end flex-wrap gap-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold tracking-tight">Payment Requests</h2>
                      <p className="text-muted-foreground text-sm">Internal disbursement requests for verified vendor deliverables.</p>
                    </div>
                  </div>
                  <PaymentRequestList searchTerm={debouncedSearch} />
                </div>
              )}

              {activeStage === 'payments' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center sm:items-end flex-wrap gap-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold tracking-tight">Payment History</h2>
                      <p className="text-muted-foreground text-sm">Archived financial settlements and transaction records.</p>
                    </div>
                  </div>
                  <PaymentHistoryList searchTerm={debouncedSearch} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Modals */}
        {/* Modals */}
        <VendorOnboardingModal
          isOpen={isAddVendorOpen}
          onClose={() => {
            setIsAddVendorOpen(false);
            fetchCounts();
            setVendorListKey(prev => prev + 1);
            // Clear selected vendor handled by handler hooks
          }}
          initialData={selectedVendor}
        />
        <CreatePurchaseRequestModal
          isOpen={isAddPROpen}
          onClose={() => {
            setIsAddPROpen(false);
            fetchCounts();
          }}
        />
        <VendorProfileModal
          isOpen={isViewProfileOpen}
          onClose={() => setIsViewProfileOpen(false)}
          vendor={selectedVendor}
        />
      </div>
    </div>
  );
}
