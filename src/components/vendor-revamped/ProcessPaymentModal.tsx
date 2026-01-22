import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard, Receipt, Calendar as CalendarIcon, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProcessPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentRequest: any;
    onProcess: (data: any) => Promise<void>;
}

export default function ProcessPaymentModal({ isOpen, onClose, paymentRequest, onProcess }: ProcessPaymentModalProps) {
    const [formData, setFormData] = useState({
        payment_method: 'bank_transfer',
        cheque_number: '',
        transaction_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (formData.payment_method === 'cheque' && !formData.cheque_number) {
            toast.error('Please enter the cheque number');
            return;
        }
        if (formData.payment_method === 'bank_transfer' && !formData.transaction_id) {
            toast.error('Please enter the FT number');
            return;
        }
        if (!formData.payment_date) {
            toast.error('Please select the payment date');
            return;
        }

        setProcessing(true);
        try {
            await onProcess(formData);
            handleClose();
        } catch (error) {
            console.error('Failed to process payment', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setFormData({
            payment_method: 'bank_transfer',
            cheque_number: '',
            transaction_id: '',
            payment_date: new Date().toISOString().split('T')[0],
            notes: ''
        });
        onClose();
    };

    if (!paymentRequest) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl p-0 gap-0 bg-background border-border shadow-2xl overflow-hidden rounded-[2rem]">
                <div className="flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="bg-emerald-500/5 px-8 py-8 border-b border-emerald-500/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-500">
                            <CreditCard size={120} />
                        </div>
                        <div className="relative z-10">
                            <DialogTitle className="text-3xl font-black tracking-tight text-emerald-950 dark:text-emerald-100 flex items-center gap-3">
                                <span className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20">
                                    <Receipt size={24} />
                                </span>
                                Process Payment
                            </DialogTitle>
                            <DialogDescription className="text-emerald-900/60 dark:text-emerald-200/60 mt-2 font-medium flex items-center gap-2">
                                <AlertCircle size={16} className="text-emerald-600" />
                                Finalize payment for approved payment request
                            </DialogDescription>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                        {/* Payment Request Details */}
                        <div className="bg-muted/30 rounded-2xl p-6 space-y-3">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Payment Request Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Request Number</p>
                                    <p className="font-mono font-bold text-sm">{paymentRequest.payment_request_number}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase font-bold text-muted-foreground mb-1">PO Number</p>
                                    <p className="font-mono font-bold text-sm">{paymentRequest.purchase_order?.po_number}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Vendor</p>
                                    <p className="font-bold text-sm">{paymentRequest.purchase_order?.vendor?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Amount</p>
                                    <p className="font-black text-emerald-600 text-lg">ETB {Number(paymentRequest.amount).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Payment Method <span className="text-primary">*</span>
                            </Label>
                            <Select
                                value={formData.payment_method}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, payment_method: val }))}
                            >
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/50 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium">
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={14} className="text-emerald-500/50" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border shadow-xl">
                                    <SelectItem value="bank_transfer" className="rounded-xl my-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">Bank Transfer (FT)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="cheque" className="rounded-xl my-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">Cheque</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Conditional Input Fields */}
                        {formData.payment_method === 'bank_transfer' && (
                            <div className="space-y-2">
                                <Label htmlFor="transaction_id" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    FT Number <span className="text-primary">*</span>
                                </Label>
                                <Input
                                    id="transaction_id"
                                    value={formData.transaction_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                                    placeholder="e.g., FT-2026-001234"
                                    required
                                    className="h-12 rounded-xl bg-muted/20 border-border/50 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                />
                            </div>
                        )}

                        {formData.payment_method === 'cheque' && (
                            <div className="space-y-2">
                                <Label htmlFor="cheque_number" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Cheque Number <span className="text-primary">*</span>
                                </Label>
                                <Input
                                    id="cheque_number"
                                    value={formData.cheque_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cheque_number: e.target.value }))}
                                    placeholder="e.g., CHQ-123456"
                                    required
                                    className="h-12 rounded-xl bg-muted/20 border-border/50 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                />
                            </div>
                        )}

                        {/* Payment Date */}
                        <div className="space-y-2">
                            <Label htmlFor="payment_date" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Payment Date <span className="text-primary">*</span>
                            </Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/50" />
                                <Input
                                    id="payment_date"
                                    type="date"
                                    value={formData.payment_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                                    required
                                    className="h-12 rounded-xl bg-muted/20 border-border/50 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium pl-12"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Notes (Optional)
                            </Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add any additional notes about this payment..."
                                className="min-h-[100px] rounded-2xl bg-muted/20 border-border/50 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium p-4 resize-none"
                            />
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-muted/30 border-t border-border/50 flex items-center justify-between">
                        <div className="hidden md:flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Confirmation</span>
                            <span className="text-xs font-medium text-muted-foreground/60">This will mark the payment as processed.</span>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleClose}
                                disabled={processing}
                                className="flex-1 md:flex-none h-12 rounded-xl font-bold hover:bg-muted transition-colors px-6"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                onClick={handleSubmit}
                                className="flex-1 md:flex-none h-12 rounded-xl px-10 font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Process Payment"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
