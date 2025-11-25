import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus,
  Users,
  FileText,
  CheckCircle, 
  FileCheck,
  PlayCircle,
  CheckSquare,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import { PermissionGuard } from '@/components/PermissionGuard';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

// Import stage components
import VendorDiscoveryTab from '@/components/vendor/VendorDiscoveryTab';
import VendorRequirementManager from '@/components/vendor/VendorRequirementManager';
import QuoteComparisonMatrix from '@/components/vendor/QuoteComparisonMatrix';
import ContractManagementView from '@/components/vendor/ContractManagementView';
import DeliverablesTracker from '@/components/vendor/DeliverablesTracker';
import PaymentSettlementView from '@/components/vendor/PaymentSettlementView';

export default function VendorManagement() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { checkPermission, hasPermission, isLoading: permissionsLoading } = usePermissionCheck();
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState<string>('discovery');
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Check if user has ANY vendor-related permission
  // This allows access to the page if they have any vendor permission (e.g., approve quotations)
  const vendorPermissions = [
    'vendors.view',
    'vendors.manage',
    'vendors.create',
    'vendors.edit',
    'vendors.delete',
    'vendors.discovery',
    'vendors.onboard',
    'vendors.lookup',
    'vendors.requirements',
    'vendors.rfq.create',
    'vendors.rfq.send',
    'vendors.rfq.invite',
    'vendors.rfq.view',
    'vendors.quotations.view',
    'vendors.quotations.manage',
    'vendors.quotations.approve',
    'vendors.quotations.compare',
    'vendors.contracts.view',
    'vendors.contracts.create',
    'vendors.contracts.edit',
    'vendors.contracts.manage',
    'vendors.contracts.milestones',
    'vendors.contracts.po',
    'vendors.deliverables.view',
    'vendors.deliverables.manage',
    'vendors.deliverables.track',
    'vendors.payments.view',
    'vendors.payments.manage',
    'vendors.payments.process',
    'vendors.reviews.view',
    'vendors.reviews.create',
    'vendors.reviews.manage',
    'vendors.ratings.view',
    'vendors.ratings.create',
  ];

  const hasAnyVendorPermission = vendorPermissions.some(perm => hasPermission(perm));

  // Map stage IDs to required permissions
  const stagePermissions: Record<string, string[]> = {
    discovery: ['vendors.view', 'vendors.discovery'],
    engagement: ['vendors.requirements', 'vendors.rfq.view'],
    evaluation: ['vendors.quotations.view'],
    contracting: ['vendors.contracts.view'],
    execution: ['vendors.deliverables.view'],
    closure: ['vendors.payments.view', 'vendors.reviews.view'],
  };

  const lifecycleStages = [
    {
      id: 'discovery',
      label: 'Discovery',
      icon: Users,
      description: 'Find and onboard vendors',
      permissions: ['vendors.view', 'vendors.discovery'],
    },
    {
      id: 'engagement',
      label: 'Engagement (RFQ)',
      icon: FileText,
      description: 'Create requirements and send RFQs',
      permissions: ['vendors.requirements', 'vendors.rfq.view'],
    },
    {
      id: 'evaluation',
      label: 'Evaluation',
      icon: CheckCircle,
      description: 'Compare quotes and select vendors',
      permissions: ['vendors.quotations.view'],
    },
    {
      id: 'contracting',
      label: 'Contracting',
      icon: FileCheck,
      description: 'Generate contracts and setup milestones',
      permissions: ['vendors.contracts.view'],
    },
    {
      id: 'execution',
      label: 'Execution',
      icon: PlayCircle,
      description: 'Track deliverables and progress',
      permissions: ['vendors.deliverables.view'],
    },
    {
      id: 'closure',
      label: 'Closure & Review',
      icon: CheckSquare,
      description: 'Final payments and vendor reviews',
      permissions: ['vendors.payments.view', 'vendors.reviews.view'],
    }
  ];

  // Auto-select first accessible stage once permissions are loaded
  useEffect(() => {
    if (permissionsLoading || !hasAnyVendorPermission) return; // Wait for permissions to load
    
    const firstAccessibleStage = lifecycleStages.find(stage =>
      stage.permissions.some(perm => hasPermission(perm))
    );
    
    if (firstAccessibleStage) {
      const currentStage = lifecycleStages.find(s => s.id === activeStage);
      const hasCurrentAccess = currentStage?.permissions.some(perm => hasPermission(perm));
      
      // If current stage is not accessible, switch to first accessible one
      if (!hasCurrentAccess) {
        setActiveStage(firstAccessibleStage.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, hasAnyVendorPermission]); // Re-run when permissions finish loading

  const handleStageChange = (stageId: string) => {
    const stage = lifecycleStages.find(s => s.id === stageId);
    if (stage) {
      const hasAccess = stage.permissions.some(perm => hasPermission(perm));
      if (hasAccess) {
        setActiveStage(stageId);
      } else {
        toast.error('Access Denied', {
          description: `You don't have permission to access the ${stage.label} stage. Please contact your organizer admin to request access.`,
          duration: 5000,
        });
      }
    }
  };

  // Early return after all hooks are called
  if (!hasAnyVendorPermission) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">You don't have permission to access vendor management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Vendor Management', href: '/dashboard/vendor-management' }
            ]}
          />
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2">Vendor Management</h1>
              <p className="text-muted-foreground text-lg">
                Manage vendor lifecycle from discovery to closure
              </p>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>

          {/* Lifecycle Stages Navigation */}
          <Tabs value={activeStage} onValueChange={handleStageChange} className="w-full">
            <div className="bg-[hsl(var(--color-primary)/0.12)] rounded-lg p-1 mb-6">
              <TabsList className="inline-flex h-auto w-full bg-transparent p-0 gap-0">
                {lifecycleStages.map((stage) => {
                  const isActive = activeStage === stage.id;
                  const hasAccess = stage.permissions.some(perm => hasPermission(perm));
                  return (
                    <TabsTrigger
                      key={stage.id}
                      value={stage.id}
                      disabled={!hasAccess}
                      className={`
                        relative flex items-center justify-center px-6 py-3 rounded-md
                        transition-all duration-200 ease-in-out
                        ${isActive 
                          ? 'bg-background text-foreground font-bold' 
                          : hasAccess
                          ? 'bg-transparent text-foreground/70 font-normal hover:text-foreground'
                          : 'bg-transparent text-muted-foreground/50 font-normal cursor-not-allowed opacity-50'
                        }
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                      `}
                      title={!hasAccess ? `You don't have permission to access ${stage.label}` : stage.description}
                    >
                      <span className="whitespace-nowrap relative z-10">
                        {stage.label}
                      </span>
                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[calc(100%+1.5rem)] h-1.5 bg-primary rounded-full" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Stage Content - Only render if user has access to that stage */}
            {lifecycleStages.find(s => s.id === 'discovery')?.permissions.some(perm => hasPermission(perm)) && (
              <TabsContent value="discovery" className="mt-0">
                <VendorDiscoveryTab />
              </TabsContent>
            )}

            {lifecycleStages.find(s => s.id === 'engagement')?.permissions.some(perm => hasPermission(perm)) && (
              <TabsContent value="engagement" className="mt-0">
                <VendorRequirementManager />
              </TabsContent>
            )}

            {lifecycleStages.find(s => s.id === 'evaluation')?.permissions.some(perm => hasPermission(perm)) && (
              <TabsContent value="evaluation" className="mt-0">
                <QuoteComparisonMatrix />
              </TabsContent>
            )}

            {lifecycleStages.find(s => s.id === 'contracting')?.permissions.some(perm => hasPermission(perm)) && (
              <TabsContent value="contracting" className="mt-0">
                <ContractManagementView />
              </TabsContent>
            )}

            {lifecycleStages.find(s => s.id === 'execution')?.permissions.some(perm => hasPermission(perm)) && (
              <TabsContent value="execution" className="mt-0">
                <DeliverablesTracker />
              </TabsContent>
            )}

            {lifecycleStages.find(s => s.id === 'closure')?.permissions.some(perm => hasPermission(perm)) && (
              <TabsContent value="closure" className="mt-0">
                <PaymentSettlementView />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
