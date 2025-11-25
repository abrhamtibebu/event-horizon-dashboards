import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Trash2, Send, Mail } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import vendorRequirementApi from '@/lib/vendorRequirementApi';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ProtectedButton } from '@/components/ProtectedButton';
import VendorRfqInviteDialog from './VendorRfqInviteDialog';
import VendorRfqStatusView from './VendorRfqStatusView';
import CreateRequirementDialog from './CreateRequirementDialog';
import SendRfqEmailDialog from './SendRfqEmailDialog';
import RfqDetailsDialog from './RfqDetailsDialog';

export default function VendorRequirementManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequirement, setSelectedRequirement] = useState<number | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { checkPermission } = usePermissionCheck();

  const { data: requirementsResponse, isLoading } = useQuery({
    queryKey: ['vendor-requirements', searchTerm],
    queryFn: () => vendorRequirementApi.getRequirements({ search: searchTerm }),
  });

  const requirements = requirementsResponse?.success 
    ? (requirementsResponse.data?.data || requirementsResponse.data || [])
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Requirements</h2>
          <p className="text-muted-foreground">Create and manage vendor requirements for your events</p>
        </div>
        <ProtectedButton
          permission="vendors.requirements"
          onClick={() => {
            if (checkPermission('vendors.requirements', 'create requirements') || 
                checkPermission('vendors.rfq.create', 'create RFQs')) {
              setIsCreateDialogOpen(true);
            }
          }}
          actionName="create requirements"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Requirement
        </ProtectedButton>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requirements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : requirements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No requirements found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Budget Range</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-left"
                        onClick={() => {
                          setSelectedRequirement(req.id);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        {req.title}
                      </Button>
                    </TableCell>
                    <TableCell>{req.event?.title || 'N/A'}</TableCell>
                    <TableCell>
                      {req.budget_min && req.budget_max
                        ? `${req.budget_min.toLocaleString()} - ${req.budget_max.toLocaleString()} ETB`
                        : 'Not specified'}
                    </TableCell>
                    <TableCell>{new Date(req.deadline).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={req.status === 'active' ? 'default' : 'secondary'}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ProtectedButton
                          permission="vendors.rfq.view"
                          onClick={() => {
                            setSelectedRequirement(req.id);
                            setIsDetailsDialogOpen(true);
                          }}
                          actionName="view RFQ details"
                          variant="default"
                          size="sm"
                          title="View RFQ Details"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </ProtectedButton>
                        <ProtectedButton
                          permission="vendors.rfq.invite"
                          onClick={() => {
                            setSelectedRequirement(req.id);
                            setIsInviteDialogOpen(true);
                          }}
                          actionName="invite vendors to RFQ"
                          variant="ghost"
                          size="sm"
                          title="Invite Vendors"
                        >
                          <Send className="h-4 w-4" />
                        </ProtectedButton>
                        <ProtectedButton
                          permission="vendors.rfq.send"
                          onClick={() => {
                            setSelectedRequirement(req.id);
                            setIsEmailDialogOpen(true);
                          }}
                          actionName="send RFQ via email"
                          variant="ghost"
                          size="sm"
                          title="Send RFQ via Email"
                        >
                          <Mail className="h-4 w-4" />
                        </ProtectedButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateRequirementDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      {selectedRequirement && (
        <>
          <VendorRfqInviteDialog
            isOpen={isInviteDialogOpen}
            onClose={() => {
              setIsInviteDialogOpen(false);
              setSelectedRequirement(null);
            }}
            requirementId={selectedRequirement}
          />
          <SendRfqEmailDialog
            isOpen={isEmailDialogOpen}
            onClose={() => {
              setIsEmailDialogOpen(false);
              setSelectedRequirement(null);
            }}
            requirementId={selectedRequirement}
          />
        </>
      )}
      <RfqDetailsDialog
        requirementId={selectedRequirement}
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedRequirement(null);
        }}
      />
    </div>
  );
}

