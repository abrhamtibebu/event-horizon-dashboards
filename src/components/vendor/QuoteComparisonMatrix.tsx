import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, TrendingUp, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { getVendorQuotations, getMyEvents, bulkApproveVendorQuotations } from '@/lib/api';
import vendorRequirementApi from '@/lib/vendorRequirementApi';
import QuoteComparisonCard from './QuoteComparisonCard';
import { useAuth } from '@/hooks/use-auth';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import { ProtectedButton } from '@/components/ProtectedButton';
import { toast } from 'sonner';

export default function QuoteComparisonMatrix() {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedQuotations, setSelectedQuotations] = useState<Set<number>>(new Set());
  const [activeStep, setActiveStep] = useState<'selection' | 'approval'>('selection');
  const queryClient = useQueryClient();

  const { checkPermission, hasPermission } = usePermissionCheck();
  
  // Check if user can approve/select based on permissions
  const canApprove = hasPermission('vendors.quotations.approve');
  const canSelect = hasPermission('vendors.quotations.compare');

  // Fetch events
  const { data: eventsResponse } = useQuery({
    queryKey: ['my-events'],
    queryFn: async () => {
      const response = await getMyEvents('draft,active');
      return response.data;
    },
  });

  const events = Array.isArray(eventsResponse?.data?.data)
    ? eventsResponse.data.data
    : Array.isArray(eventsResponse?.data)
    ? eventsResponse.data
    : Array.isArray(eventsResponse)
    ? eventsResponse
    : [];

  // Fetch requirements for selected event
  const { data: requirementsResponse } = useQuery({
    queryKey: ['vendor-requirements', 'event', selectedEventId],
    queryFn: () => vendorRequirementApi.getRequirements({ event_id: selectedEventId, per_page: 1000 }),
    enabled: !!selectedEventId,
  });

  const requirements = (() => {
    if (!requirementsResponse?.success) return [];
    const data = requirementsResponse.data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  })();

  // Fetch quotations for selected event
  const { data: quotationsResponse, isLoading } = useQuery({
    queryKey: ['vendor-quotations', 'event', selectedEventId],
    queryFn: async () => {
      const response = await getVendorQuotations({ event_id: selectedEventId });
      return response.data;
    },
    enabled: !!selectedEventId,
  });

  const quotations = Array.isArray(quotationsResponse?.data?.data)
    ? quotationsResponse.data.data
    : Array.isArray(quotationsResponse?.data)
    ? quotationsResponse.data
    : Array.isArray(quotationsResponse)
    ? quotationsResponse
    : [];

  // Group quotations by requirement
  const quotationsByRequirement = quotations.reduce((acc: any, quotation: any) => {
    const reqId = quotation.requirement_id || 'unassigned';
    if (!acc[reqId]) {
      acc[reqId] = [];
    }
    acc[reqId].push(quotation);
    return acc;
  }, {});

  // Calculate confidence scores if not present
  const quotationsWithScores = quotations.map((q: any) => {
    if (!q.confidence_score) {
      const vendorRating = Number(q.vendor?.average_rating) || 0;
      const scopeCoverage = Number(q.scope_coverage) || 0;
      const daysScore = q.days_required ? (30 - q.days_required) / 30 * 100 : 50;
      const confidence = (vendorRating * 20 + scopeCoverage * 0.6 + daysScore * 0.2);
      return { ...q, confidence_score: Math.min(100, Math.max(0, confidence)) };
    }
    return q;
  });

  // Selection mutation - just moves to approval step (no API call needed)
  const selectQuotationsMutation = useMutation({
    mutationFn: async () => {
      // Selection is just a UI workflow step, no API call needed
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      toast.success('Quotations selected. Proceed to approval step.');
      setActiveStep('approval');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to proceed to approval');
    },
  });

  // Approval mutation
  const approveQuotationsMutation = useMutation({
    mutationFn: async (quotationIds: number[]) => {
      const response = await bulkApproveVendorQuotations(quotationIds);
      return response.data;
    },
    onSuccess: (data: any) => {
      const approvedCount = data?.data?.approved?.length || 0;
      const failedCount = data?.data?.failed?.length || 0;
      
      if (failedCount > 0) {
        toast.warning(`Approved ${approvedCount} quotation(s). ${failedCount} failed.`);
      } else {
        toast.success(`Successfully approved ${approvedCount} quotation(s)`);
      }
      
      setSelectedQuotations(new Set());
      queryClient.invalidateQueries({ queryKey: ['vendor-quotations'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to approve quotations');
    },
  });

  const handleToggleQuotation = (quotationId: number) => {
    setSelectedQuotations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quotationId)) {
        newSet.delete(quotationId);
      } else {
        newSet.add(quotationId);
      }
      return newSet;
    });
  };

  const handleSelectQuotations = () => {
    if (!checkPermission('vendors.quotations.compare', 'compare quotations')) {
      return;
    }
    if (selectedQuotations.size === 0) {
      toast.error('Please select at least one quotation');
      return;
    }
    selectQuotationsMutation.mutate();
  };

  const handleApproveQuotations = () => {
    if (!checkPermission('vendors.quotations.approve', 'approve quotations')) {
      return;
    }
    if (selectedQuotations.size === 0) {
      toast.error('Please select at least one quotation to approve');
      return;
    }
    approveQuotationsMutation.mutate(Array.from(selectedQuotations));
  };

  const selectedEvent = events.find((e: any) => e.id === selectedEventId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quote Evaluation</h2>
          <p className="text-muted-foreground">Select an event to view and evaluate quotations</p>
        </div>
        <Select 
          value={selectedEventId?.toString() || ''} 
          onValueChange={(v) => {
            setSelectedEventId(Number(v));
            setSelectedQuotations(new Set());
            setActiveStep('selection');
          }}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            {events.length === 0 ? (
              <SelectItem value="no-events" disabled>
                No events available
              </SelectItem>
            ) : (
              events.map((event: any) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.name || event.title} {event.status ? `(${event.status})` : ''}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {!selectedEventId ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Please select an event to view requirements and quotations
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Spinner />
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeStep} onValueChange={(v) => setActiveStep(v as 'selection' | 'approval')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selection" disabled={!canSelect}>
              Step 1: Quotation Selection {selectedQuotations.size > 0 && `(${selectedQuotations.size})`}
            </TabsTrigger>
            <TabsTrigger value="approval" disabled={!canApprove || activeStep === 'selection'}>
              Step 2: Approval
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Event: {selectedEvent?.name || selectedEvent?.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {requirements.length} requirement(s), {quotations.length} quotation(s)
                </p>
              </div>
              {selectedQuotations.size > 0 && (
                <Button 
                  onClick={handleSelectQuotations}
                  disabled={selectQuotationsMutation.isPending}
                >
                  {selectQuotationsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Select {selectedQuotations.size} Quotation(s)
                </Button>
              )}
            </div>

            {requirements.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  No requirements found for this event
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {requirements.map((requirement: any) => {
                  const reqQuotations = quotationsByRequirement[requirement.id] || [];
                  return (
                    <Card key={requirement.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{requirement.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {requirement.description}
                            </CardDescription>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{requirement.status}</Badge>
                              {requirement.budget_min && requirement.budget_max && (
                                <Badge variant="secondary">
                                  {Number(requirement.budget_min).toLocaleString()} - {Number(requirement.budget_max).toLocaleString()} ETB
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {reqQuotations.length} quotation(s)
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {reqQuotations.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No quotations received for this requirement
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {reqQuotations.map((quotation: any) => {
                              const qWithScore = quotationsWithScores.find((q: any) => q.id === quotation.id) || quotation;
                              return (
                                <QuoteComparisonCard
                                  key={quotation.id}
                                  quotation={{
                                    id: quotation.id,
                                    vendor_name: quotation.vendor?.name || 'Unknown',
                                    vendor_rating: quotation.vendor?.average_rating || 0,
                                    total_cost: Number(quotation.amount),
                                    days_required: quotation.days_required,
                                    scope_coverage: quotation.scope_coverage,
                                    confidence_score: qWithScore.confidence_score,
                                    submission_date: quotation.submission_date,
                                    status: quotation.status,
                                  }}
                                  isSelected={selectedQuotations.has(quotation.id)}
                                  onSelect={() => handleToggleQuotation(quotation.id)}
                                />
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Unassigned quotations (quotations without requirement_id) */}
                {quotationsByRequirement['unassigned']?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Unassigned Quotations</CardTitle>
                      <CardDescription>
                        Quotations not linked to any requirement
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quotationsByRequirement['unassigned'].map((quotation: any) => {
                          const qWithScore = quotationsWithScores.find((q: any) => q.id === quotation.id) || quotation;
                          return (
                            <QuoteComparisonCard
                              key={quotation.id}
                              quotation={{
                                id: quotation.id,
                                vendor_name: quotation.vendor?.name || 'Unknown',
                                vendor_rating: quotation.vendor?.average_rating || 0,
                                total_cost: Number(quotation.amount),
                                days_required: quotation.days_required,
                                scope_coverage: quotation.scope_coverage,
                                confidence_score: qWithScore.confidence_score,
                                submission_date: quotation.submission_date,
                                status: quotation.status,
                              }}
                              isSelected={selectedQuotations.has(quotation.id)}
                              onSelect={() => handleToggleQuotation(quotation.id)}
                            />
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Comparison Table */}
                {quotationsWithScores.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Comparison</CardTitle>
                      <CardDescription>Compare all quotations side-by-side</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Select</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Requirement</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead>Days Required</TableHead>
                            <TableHead>Scope Coverage</TableHead>
                            <TableHead>Past Rating</TableHead>
                            <TableHead>Confidence Score</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotationsWithScores.map((q: any) => {
                            const requirement = requirements.find((r: any) => r.id === q.requirement_id);
                            return (
                              <TableRow key={q.id}>
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={selectedQuotations.has(q.id)}
                                    onChange={() => handleToggleQuotation(q.id)}
                                    className="h-4 w-4"
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{q.vendor?.name}</TableCell>
                                <TableCell>
                                  {requirement ? (
                                    <span className="text-sm">{requirement.title}</span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">Unassigned</span>
                                  )}
                                </TableCell>
                                <TableCell>{Number(q.amount).toLocaleString()} ETB</TableCell>
                                <TableCell>{q.days_required || 'N/A'}</TableCell>
                                <TableCell>
                                  {q.scope_coverage ? `${q.scope_coverage}%` : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    {q.vendor?.average_rating ? Number(q.vendor.average_rating).toFixed(1) : 'N/A'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={q.confidence_score > 70 ? 'default' : 'secondary'}>
                                    {q.confidence_score?.toFixed(1)}%
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={q.status === 'approved' ? 'default' : 'secondary'}>
                                    {q.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approval" className="space-y-4 mt-4">
            {!canApprove ? (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <p className="font-semibold mb-2">Approval Access Restricted</p>
                  <p>You need to be logged in as an organizer to approve quotations.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Approval Queue</h3>
                    <p className="text-sm text-muted-foreground">
                      Review and approve selected quotations
                    </p>
                  </div>
                  {selectedQuotations.size > 0 && (
                    <Button 
                      onClick={handleApproveQuotations}
                      disabled={approveQuotationsMutation.isPending}
                    >
                      {approveQuotationsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve {selectedQuotations.size} Quotation(s)
                    </Button>
                  )}
                </div>

                {quotationsWithScores.filter((q: any) => selectedQuotations.has(q.id)).length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12 text-muted-foreground">
                      No quotations selected for approval. Go back to Selection tab to select quotations.
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Selected Quotations for Approval</CardTitle>
                      <CardDescription>
                        Review the selected quotations before approving
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Requirement</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead>Confidence Score</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotationsWithScores
                            .filter((q: any) => selectedQuotations.has(q.id))
                            .map((q: any) => {
                              const requirement = requirements.find((r: any) => r.id === q.requirement_id);
                              return (
                                <TableRow key={q.id}>
                                  <TableCell className="font-medium">{q.vendor?.name}</TableCell>
                                  <TableCell>
                                    {requirement ? requirement.title : 'Unassigned'}
                                  </TableCell>
                                  <TableCell>{Number(q.amount).toLocaleString()} ETB</TableCell>
                                  <TableCell>
                                    <Badge variant={q.confidence_score > 70 ? 'default' : 'secondary'}>
                                      {q.confidence_score?.toFixed(1)}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={q.status === 'approved' ? 'default' : 'secondary'}>
                                      {q.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newSet = new Set(selectedQuotations);
                                        newSet.delete(q.id);
                                        setSelectedQuotations(newSet);
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
