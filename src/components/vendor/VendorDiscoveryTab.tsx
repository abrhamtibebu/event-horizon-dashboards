import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, Eye, Edit } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import vendorApi from '@/lib/vendorApi';
import { VENDOR_STATUSES, getPhases, getStatusesByPhase } from '@/lib/vendorStatusConstants';
import VendorCard from './VendorCard';
import VendorLifecycleStageBadge from './VendorLifecycleStageBadge';
import VendorOnboardingModal from './VendorOnboardingModal';
import VendorDetailsDialog from './VendorDetailsDialog';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import { PermissionGuard } from '@/components/PermissionGuard';

export default function VendorDiscoveryTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { checkPermission } = usePermissionCheck();

  const { data: vendorsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['vendors', searchTerm, statusFilter, stageFilter],
    queryFn: () => {
      console.log('Fetching vendors with params:', { searchTerm, statusFilter, stageFilter });
      return vendorApi.getVendors({ 
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
    },
    staleTime: 0, // Always consider data stale to allow refetching
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Log when vendors data changes
  useEffect(() => {
    if (vendorsResponse) {
      console.log('Vendors data updated:', vendorsResponse.length, 'vendors');
    }
  }, [vendorsResponse]);

  const vendors = Array.isArray(vendorsResponse) ? vendorsResponse : [];

  // Filter by lifecycle stage if needed
  const filteredVendors = stageFilter !== 'all' 
    ? vendors.filter(v => v.lifecycle_stage === stageFilter)
    : vendors;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Directory</h2>
          <p className="text-muted-foreground">Discover and manage vendors in your network</p>
        </div>
        <PermissionGuard
          permission="vendors.create"
          showToast={true}
          actionName="create vendors"
        >
          <Button 
            onClick={() => {
              if (checkPermission('vendors.create', 'create vendors')) {
                setIsOnboardingModalOpen(true);
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </PermissionGuard>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                <SelectItem value="all">All Status</SelectItem>
                {/* Only show Pre-Engagement / Discovery statuses */}
                {(() => {
                  const discoveryStatuses = getStatusesByPhase('Pre-Engagement / Discovery');
                  return discoveryStatuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.bgColor}`} />
                        <span>{status.label}</span>
                      </div>
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lifecycle Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="discovery">Discovery</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="evaluation">Evaluation</SelectItem>
                <SelectItem value="contracting">Contracting</SelectItem>
                <SelectItem value="execution">Execution</SelectItem>
                <SelectItem value="closure">Closure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Error loading vendors. Please try again.
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No vendors found</p>
              <PermissionGuard
                permission="vendors.create"
                showToast={true}
                actionName="create vendors"
              >
                <Button 
                  onClick={() => {
                    if (checkPermission('vendors.create', 'create vendors')) {
                      setIsOnboardingModalOpen(true);
                    }
                  }}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Vendor
                </Button>
              </PermissionGuard>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVendors.map((vendor) => (
                <VendorCard 
                  key={vendor.id} 
                  vendor={vendor}
                  onClick={() => {
                    setSelectedVendorId(vendor.id);
                    setIsDetailsDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <VendorOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
      />

      <VendorDetailsDialog
        vendorId={selectedVendorId}
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedVendorId(null);
        }}
      />
    </div>
  );
}


