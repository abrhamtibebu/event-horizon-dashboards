import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Calendar,
  CreditCard,
  Link,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { paymentApi, Payment, PaymentFormData, ReferralLinkData } from '@/lib/paymentApi';
import vendorApi from '@/lib/vendorApi';
import { autoSetupTestAuth } from '@/lib/authHelper';
import { TransactionInputDialog } from '@/components/ui/InputDialog';

interface PaymentManagementModalProps {
  vendor: any;
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdated?: () => void;
}

export const PaymentManagementModal: React.FC<PaymentManagementModalProps> = ({
  vendor,
  isOpen,
  onClose,
  onPaymentUpdated,
}) => {
  const [activeTab, setActiveTab] = useState('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [showGenerateReferral, setShowGenerateReferral] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [approvedQuotations, setApprovedQuotations] = useState<any[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [paymentToProcess, setPaymentToProcess] = useState<Payment | null>(null);

  const queryClient = useQueryClient();

  // Payment form state
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    vendor_id: vendor?.id || 0,
    event_id: '',
    amount: '',
    currency: 'ETB',
    payment_type: 'quotation_payment',
    payment_method: 'bank_transfer',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    notes: '',
  });

  // Referral form state
  const [referralForm, setReferralForm] = useState<ReferralLinkData>({
    event_id: '',
    commission_rate: 0.05,
    count: 1,
  });

  // Load payments when modal opens
  useEffect(() => {
    if (isOpen && vendor) {
      // Auto-setup test authentication if needed
      autoSetupTestAuth().catch(err => {
        console.warn('Failed to setup test auth:', err);
      });
      
      loadPayments();
      loadApprovedQuotations();
    }
  }, [isOpen, vendor]);

  const loadApprovedQuotations = async () => {
    if (!vendor?.id) return;
    
    setLoadingQuotations(true);
    try {
      const quotations = await vendorApi.getApprovedQuotations(vendor.id);
      setApprovedQuotations(quotations);
    } catch (error) {
      console.error('Failed to load approved quotations:', error);
      setApprovedQuotations([]);
    } finally {
      setLoadingQuotations(false);
    }
  };

  const loadPayments = async () => {
    if (!vendor) return;
    
    setLoading(true);
    try {
      const result = await paymentApi.getPayments({ vendor_id: vendor.id });
      setPayments(result.data);
    } catch (error) {
      console.error('Failed to load payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) => paymentApi.createPayment(data),
    onSuccess: () => {
      toast.success('Payment created successfully!');
      setPaymentForm({
        vendor_id: vendor?.id || 0,
        event_id: '',
        amount: '',
        currency: 'ETB',
        payment_type: 'quotation_payment',
        payment_method: 'bank_transfer',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
      });
      setShowCreatePayment(false);
      loadPayments();
      onPaymentUpdated?.();
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      console.error('Create payment error:', error);
      if (error?.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).flat();
        toast.error(`Validation Error: ${validationErrors.join(', ')}`);
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create payment';
        toast.error(errorMessage);
      }
    },
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => paymentApi.processPayment(id, data),
    onSuccess: () => {
      toast.success('Payment processed successfully!');
      loadPayments();
      onPaymentUpdated?.();
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      console.error('Process payment error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to process payment';
      toast.error(errorMessage);
    },
  });

  // Generate referral links mutation
  const generateReferralMutation = useMutation({
    mutationFn: (data: ReferralLinkData) => paymentApi.generateReferralLinks(vendor.id, data),
    onSuccess: (result) => {
      toast.success('Referral links generated successfully!');
      setReferralForm({
        event_id: '',
        commission_rate: 0.05,
        count: 1,
      });
      setShowGenerateReferral(false);
      loadPayments();
      onPaymentUpdated?.();
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      console.error('Generate referral error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to generate referral links';
      toast.error(errorMessage);
    },
  });

  const handleCreatePayment = () => {
    createPaymentMutation.mutate(paymentForm);
  };

  const handleProcessPayment = (payment: Payment) => {
    setPaymentToProcess(payment);
    setShowTransactionDialog(true);
  };

  const handleTransactionConfirm = (data: { transactionId: string; notes: string }) => {
    if (!paymentToProcess) return;
    
    processPaymentMutation.mutate({
      id: paymentToProcess.id,
      data: {
        transaction_id: data.transactionId || undefined,
        notes: data.notes || undefined,
      }
    });
    
    setShowTransactionDialog(false);
    setPaymentToProcess(null);
  };

  const handleGenerateReferral = () => {
    generateReferralMutation.mutate(referralForm);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'ETB') => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (!vendor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Management - {vendor.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="referrals">Referral System</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payment History</h3>
              <Button onClick={() => setShowCreatePayment(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Payment
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No payments found for this vendor</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <Card key={payment.id}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {formatCurrency(payment.amount, payment.currency)}
                              </CardTitle>
                              <p className="text-sm text-gray-600">
                                {payment.reference_number} • {payment.payment_type.replace('_', ' ')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(payment.status)}
                              {getStatusBadge(payment.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Due Date:</strong> {new Date(payment.due_date).toLocaleDateString()}</p>
                              <p><strong>Method:</strong> {payment.payment_method.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <p><strong>Event:</strong> {payment.event?.title || 'N/A'}</p>
                              <p><strong>Created:</strong> {new Date(payment.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          {payment.notes && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600">{payment.notes}</p>
                            </div>
                          )}

                          {payment.payment_type === 'referral_commission' && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium text-blue-900">Referral Commission</p>
                                  <p className="text-xs text-blue-700">
                                    {payment.referral_count} referrals • {((payment.commission_rate || 0) * 100).toFixed(1)}% rate
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-blue-900">
                                    {formatCurrency(payment.referral_commission || 0, payment.currency)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 mt-4">
                            {payment.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleProcessPayment(payment)}
                                disabled={processPaymentMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Referral System</h3>
              <Button onClick={() => setShowGenerateReferral(true)}>
                <Link className="h-4 w-4 mr-2" />
                Generate Referral Links
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Marketing & Sales Commission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Generate referral links for marketing and sales vendors. They will earn commission for each successful event registration.
                </p>
                
                {payments.filter(p => p.payment_type === 'referral_commission').length > 0 ? (
                  <div className="space-y-4">
                    {payments
                      .filter(p => p.payment_type === 'referral_commission')
                      .map((payment) => (
                        <div key={payment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">Event: {payment.event?.title}</h4>
                              <p className="text-sm text-gray-600">
                                Commission Rate: {((payment.commission_rate || 0) * 100).toFixed(1)}% • 
                                Referrals: {payment.referral_count} • 
                                Earned: {formatCurrency(payment.referral_commission || 0)}
                              </p>
                            </div>
                            {getStatusBadge(payment.status)}
                          </div>
                          
                          {payment.referral_links && payment.referral_links.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Referral Links:</p>
                              {payment.referral_links.map((link, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <Input
                                    value={link}
                                    readOnly
                                    className="flex-1 text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(link)}
                                  >
                                    {copiedLink === link ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No referral campaigns created yet</p>
                    <p className="text-sm text-gray-400">Generate referral links to start earning commissions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Paid</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(
                          payments
                            .filter(p => p.status === 'paid')
                            .reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(
                          payments
                            .filter(p => p.status === 'pending')
                            .reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Link className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Referrals</p>
                      <p className="text-lg font-semibold">
                        {payments
                          .filter(p => p.payment_type === 'referral_commission')
                          .reduce((sum, p) => sum + (p.referral_count || 0), 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Commission</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(
                          payments
                            .filter(p => p.payment_type === 'referral_commission')
                            .reduce((sum, p) => sum + (p.referral_commission || 0), 0)
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Payment Modal */}
        {showCreatePayment && (
          <Dialog open={showCreatePayment} onOpenChange={setShowCreatePayment}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Approved Quotations Dropdown */}
                <div>
                  <Label htmlFor="quotation_id">Select Approved Quotation *</Label>
                  <Select
                    value={paymentForm.quotation_id || ''}
                    onValueChange={(value) => {
                      const selectedQuotation = approvedQuotations.find(q => q.id.toString() === value);
                      setPaymentForm({
                        ...paymentForm,
                        quotation_id: value,
                        event_id: selectedQuotation?.event_id?.toString() || '',
                        amount: selectedQuotation?.amount?.toString() || '',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingQuotations ? "Loading quotations..." : "Select an approved quotation"} />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedQuotations.map((quotation) => (
                        <SelectItem key={quotation.id} value={quotation.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{quotation.quotation_number}</span>
                            <span className="text-xs text-gray-500">
                              {quotation.event?.title} - ETB {quotation.amount?.toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select an approved quotation to auto-fill event and amount details
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event_id">Event</Label>
                    <Input
                      id="event_id"
                      value={paymentForm.event_id}
                      onChange={(e) => setPaymentForm({ ...paymentForm, event_id: e.target.value })}
                      placeholder="Event ID"
                      disabled={!!paymentForm.quotation_id}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {paymentForm.quotation_id ? "Auto-filled from selected quotation" : "Enter event ID manually"}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (ETB)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="0.00"
                      disabled={!!paymentForm.quotation_id}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {paymentForm.quotation_id ? "Auto-filled from selected quotation" : "Enter amount manually"}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={paymentForm.currency} onValueChange={(value) => setPaymentForm({ ...paymentForm, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ETB">ETB</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_type">Payment Type</Label>
                    <Select value={paymentForm.payment_type} onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quotation_payment">Quotation Payment</SelectItem>
                        <SelectItem value="referral_commission">Referral Commission</SelectItem>
                        <SelectItem value="bonus">Bonus</SelectItem>
                        <SelectItem value="penalty">Penalty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select value={paymentForm.payment_method} onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="digital_wallet">E-Payment (Telebirr)</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={paymentForm.due_date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Conditional Fields Based on Payment Method */}
                {(paymentForm.payment_method === 'bank_transfer' || paymentForm.payment_method === 'digital_wallet') && (
                  <div>
                    <Label htmlFor="transaction_id">
                      {paymentForm.payment_method === 'bank_transfer' ? 'Transaction Number *' : 'Telebirr Transaction Number *'}
                    </Label>
                    <Input
                      id="transaction_id"
                      value={paymentForm.transaction_id || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                      placeholder={
                        paymentForm.payment_method === 'bank_transfer' 
                          ? 'Enter bank transaction number' 
                          : 'Enter Telebirr transaction number'
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {paymentForm.payment_method === 'bank_transfer' 
                        ? 'Required for bank transfer payments' 
                        : 'Required for Telebirr payments'}
                    </p>
                  </div>
                )}

                {paymentForm.payment_method === 'check' && (
                  <div>
                    <Label htmlFor="check_number">Check Number *</Label>
                    <Input
                      id="check_number"
                      value={paymentForm.check_number || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, check_number: e.target.value })}
                      placeholder="Enter check number"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for check payments
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreatePayment(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePayment} disabled={createPaymentMutation.isPending}>
                    {createPaymentMutation.isPending ? 'Creating...' : 'Create Payment'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Generate Referral Links Modal */}
        {showGenerateReferral && (
          <Dialog open={showGenerateReferral} onOpenChange={setShowGenerateReferral}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Referral Links</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="referral_event_id">Event</Label>
                  <Input
                    id="referral_event_id"
                    value={referralForm.event_id}
                    onChange={(e) => setReferralForm({ ...referralForm, event_id: e.target.value })}
                    placeholder="Event ID"
                  />
                </div>
                
                <div>
                  <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={referralForm.commission_rate * 100}
                    onChange={(e) => setReferralForm({ ...referralForm, commission_rate: parseFloat(e.target.value) / 100 })}
                    placeholder="5.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Commission rate as percentage (e.g., 5.0 for 5%)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="count">Number of Links</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="10"
                    value={referralForm.count}
                    onChange={(e) => setReferralForm({ ...referralForm, count: parseInt(e.target.value) })}
                    placeholder="1"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowGenerateReferral(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateReferral} disabled={generateReferralMutation.isPending}>
                    {generateReferralMutation.isPending ? 'Generating...' : 'Generate Links'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Transaction Input Dialog */}
        <TransactionInputDialog
          isOpen={showTransactionDialog}
          onClose={() => {
            setShowTransactionDialog(false);
            setPaymentToProcess(null);
          }}
          onConfirm={handleTransactionConfirm}
          isLoading={processPaymentMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};
