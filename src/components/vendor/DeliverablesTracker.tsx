import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { getDeliverables } from '@/lib/api';
import DeliverableStatusBadge from './DeliverableStatusBadge';
import DeliverableUpdateModal from './DeliverableUpdateModal';

export default function DeliverablesTracker() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDeliverable, setSelectedDeliverable] = useState<number | null>(null);

  const { data: deliverablesResponse, isLoading } = useQuery({
    queryKey: ['deliverables', searchTerm, statusFilter],
    queryFn: async () => {
      const response = await getDeliverables({
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        has_contract: 'true', // Fetch all deliverables created during contract creation
        per_page: 1000, // Get all deliverables from contracts
      });
      return response.data;
    },
  });

  const deliverables = Array.isArray(deliverablesResponse?.data?.data)
    ? deliverablesResponse.data.data
    : Array.isArray(deliverablesResponse?.data)
    ? deliverablesResponse.data
    : Array.isArray(deliverablesResponse)
    ? deliverablesResponse
    : [];

  // Group by status for Kanban view
  const groupedDeliverables = {
    pending: deliverables.filter((d: any) => d.status === 'pending'),
    in_progress: deliverables.filter((d: any) => d.status === 'in_progress'),
    completed: deliverables.filter((d: any) => d.status === 'completed'),
    delayed: deliverables.filter((d: any) => d.status === 'delayed'),
    at_risk: deliverables.filter((d: any) => d.status === 'at_risk'),
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Deliverables Tracker</h2>
        <p className="text-muted-foreground">Track and manage deliverables from contracts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deliverables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(groupedDeliverables).map(([status, items]: [string, any[]]) => (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <h3 className="font-semibold capitalize">{status.replace('_', ' ')}</h3>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {items.map((deliverable: any) => (
                      <Card
                        key={deliverable.id}
                        className="cursor-pointer hover:shadow-md"
                        onClick={() => setSelectedDeliverable(deliverable.id)}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium text-sm mb-2">{deliverable.title}</h4>
                          <DeliverableStatusBadge status={deliverable.status} size="sm" />
                          {deliverable.due_date && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Due: {new Date(deliverable.due_date).toLocaleDateString()}
                            </p>
                          )}
                          {deliverable.due_date && new Date(deliverable.due_date) < new Date() && deliverable.status !== 'completed' && (
                            <div className="flex items-center gap-1 mt-2 text-destructive text-xs">
                              <AlertTriangle className="h-3 w-3" />
                              Overdue
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDeliverable && (
        <DeliverableUpdateModal
          deliverableId={selectedDeliverable}
          onClose={() => setSelectedDeliverable(null)}
        />
      )}
    </div>
  );
}

