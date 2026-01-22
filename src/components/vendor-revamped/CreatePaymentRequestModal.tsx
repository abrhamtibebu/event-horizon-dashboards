import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Receipt, Loader2 } from 'lucide-react';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { toast } from 'sonner';

interface CreatePaymentRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    poId: number | null;
    poNumber: string;
    totalAmount: number;
}

export default function CreatePaymentRequestModal({ isOpen, onClose, poId, poNumber, totalAmount }: CreatePaymentRequestModalProps) {
    const { addPaymentRequest } = usePaymentRequests();
    const [processing, setProcessing] = useState(false);

    const [formData, setFormData] = useState({
        amount: totalAmount.toString(),
        payment_method: 'bank_transfer',
        purpose: '',
        bank_account: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!poId || !formData.amount || !formData.payment_method) {
            toast.error('Please fill in all required fields');
            return;
        }

        setProcessing(true);
        try {
            await addPaymentRequest({
                po_id: poId,
                amount: parseFloat(formData.amount),
                payment_method: formData.payment_method,
                purpose: formData.purpose,
                bank_account: formData.bank_account,
            });
            handleClose();
        } catch (error) {
            // Error handled by hook
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setFormData({
            amount: totalAmount.toString(),
            payment_method: 'bank_transfer',
            purpose: '',
            bank_account: '',
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-xl p-0 gap-0 bg-background border-border shadow-2xl overflow-hidden rounded-[2rem]">
                <div className="flex flex-col">
                    {/* Header */}
                    <div className="bg-muted/30 px-8 py-8 border-b border-border/50">
                        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                            <span className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
                                <Receipt size={20} />
                            </span>
                            Request Payment
                        </h2>
                        <p className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
                            <span className="font-bold text-primary">Purchase Order:</span> {poNumber}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                                        Amount to Pay <span className="text-primary">*</span>
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                        placeholder="0.00"
                                        required
                                        className="h-12 rounded-xl bg-muted/20 border-border/50 focus:border-primary focus:ring-primary/20 transition-all font-black text-lg"
                                    />
                                    <p className="text-[10px] text-muted-foreground ml-1">Total PO Amount: ETB {totalAmount.toLocaleString()}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="method" className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                                        Payment Method <span className="text-primary">*</span>
                                    </Label>
                                    <Select
                                        value={formData.payment_method}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, payment_method: val }))}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/50 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="cheque">Cheque</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="account" className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                                    Bank Account / Payee Details
                                </Label>
                                <Input
                                    id="account"
                                    value={formData.bank_account}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bank_account: e.target.value }))}
                                    placeholder="Enter account number or payee name..."
                                    className="h-12 rounded-xl bg-muted/20 border-border/50 focus:border-primary focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="purpose" className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                                    Purpose / Note
                                </Label>
                                <Textarea
                                    id="purpose"
                                    value={formData.purpose}
                                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                                    placeholder="Brief description of payment..."
                                    className="min-h-[80px] rounded-2xl bg-muted/20 border-border/50 focus:border-primary focus:ring-primary/20 transition-all font-medium p-4 resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-4 pt-4">
                            <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 h-12 rounded-xl font-bold hover:bg-muted transition-colors">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex-1 h-12 rounded-xl font-black bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <CreditCard size={16} />
                                        Submit Request
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
