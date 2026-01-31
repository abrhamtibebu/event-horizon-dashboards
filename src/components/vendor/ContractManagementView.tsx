import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileText, Eye, Download, Edit } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import vendorContractApi from '@/lib/vendorContractApi';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import { getApiBaseURLForStorage } from '@/config/env';
import { ProtectedButton } from '@/components/ProtectedButton';
import MilestonePaymentSetup from './MilestonePaymentSetup';
import CreateContractDialog from './CreateContractDialog';
import AddPODialog from './AddPODialog';
import UpdateContractStatusDialog from './UpdateContractStatusDialog';

export default function ContractManagementView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const [contractForPO, setContractForPO] = useState<{ id: number; po_number?: string } | null>(null);
  const [contractForStatus, setContractForStatus] = useState<{ id: number; status: string } | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { checkPermission } = usePermissionCheck();

  const { data: contractsResponse, isLoading } = useQuery({
    queryKey: ['vendor-contracts', searchTerm],
    queryFn: () => vendorContractApi.getContracts({ search: searchTerm }),
  });

  const contracts = (() => {
    if (!contractsResponse?.success) return [];
    const data = contractsResponse.data;
    // Handle paginated response
    if (data?.data && Array.isArray(data.data)) return data.data;
    // Handle direct array response
    if (Array.isArray(data)) return data;
    return [];
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contract Management</h2>
          <p className="text-muted-foreground">Manage vendor contracts and purchase orders</p>
        </div>
        <ProtectedButton
          permission="vendors.contracts.create"
          onClick={() => setIsCreateDialogOpen(true)}
          actionName="create contracts"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Contract
        </ProtectedButton>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contracts..."
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
          ) : contracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No contracts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract: any) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.contract_number}</TableCell>
                    <TableCell>{contract.vendor?.name || 'N/A'}</TableCell>
                    <TableCell>{contract.event?.name || contract.event?.title || 'N/A'}</TableCell>
                    <TableCell>{Number(contract.total_amount).toLocaleString()} ETB</TableCell>
                    <TableCell>
                      {contract.po_number ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{contract.po_number}</Badge>
                          {(contract.po_file_path || contract.po_file_url) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a 
                                href={contract.po_file_url || `${getApiBaseURLForStorage()}/storage/${contract.po_file_path}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Download className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setContractForPO({ id: contract.id })}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Add PO
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={contract.status === 'signed' || contract.status === 'active' ? 'default' : 'secondary'}>
                          {contract.status?.replace('_', ' ') || 'N/A'}
                        </Badge>
                        <ProtectedButton
                          permission="vendors.contracts.edit"
                          onClick={() => {
                            if (checkPermission('vendors.contracts.edit', 'edit contracts')) {
                              setContractForStatus({ id: contract.id, status: contract.status });
                            }
                          }}
                          variant="ghost"
                          size="sm"
                          actionName="edit contracts"
                        >
                          <Edit className="h-3 w-3" />
                        </ProtectedButton>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedContract(contract.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateContractDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      {contractForPO && (
        <AddPODialog
          isOpen={!!contractForPO}
          onClose={() => setContractForPO(null)}
          contractId={contractForPO.id}
        />
      )}

      {contractForStatus && (
        <UpdateContractStatusDialog
          isOpen={!!contractForStatus}
          onClose={() => setContractForStatus(null)}
          contractId={contractForStatus.id}
          currentStatus={contractForStatus.status}
        />
      )}

      {selectedContract && (
        <MilestonePaymentSetup
          contractId={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}
    </div>
  );
}
