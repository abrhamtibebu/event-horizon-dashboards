import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Receipt, AlertCircle, ShoppingBag, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatePOModalProps {
    isOpen: boolean;
    onClose: () => void;
    proforma: any;
    onGenerate: (data: any) => Promise<void>;
}

export default function CreatePOModal({ isOpen, onClose, proforma, onGenerate }: CreatePOModalProps) {
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [terms, setTerms] = useState("Standard Terms Apply");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [vatRate, setVatRate] = useState(0.15);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (isOpen && proforma) {
            // Default select all items
            const items = proforma.items || proforma.purchase_request?.items || [];
            setSelectedIndices(items.map((_: any, idx: number) => idx));
            setTerms("Standard Terms Apply");
            setDeliveryDate("");
            setVatRate(0.15);
        }
    }, [isOpen, proforma]);

    const items = proforma?.items || proforma?.purchase_request?.items || [];

    const handleToggleItem = (index: number) => {
        setSelectedIndices(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const calculateTotals = () => {
        let subTotal = 0;
        selectedIndices.forEach(idx => {
            const item = items[idx];
            const qty = item.quantity || 1;
            const price = parseFloat(item.unit_price || item.estimated_unit_price || 0);
            subTotal += qty * price;
        });
        const vatAmount = subTotal * vatRate;
        const grandTotal = subTotal + vatAmount;

        return { subTotal, vatAmount, grandTotal };
    };

    const { subTotal, vatAmount, grandTotal } = calculateTotals();

    const handleSubmit = async () => {
        if (selectedIndices.length === 0) {
            toast.error("Please select at least one item.");
            return;
        }

        setProcessing(true);
        try {
            const selectedItems = selectedIndices.map(idx => items[idx]);
            await onGenerate({
                proforma_id: proforma.id,
                terms_and_conditions: terms,
                delivery_date: deliveryDate || null,
                selected_items: selectedItems,
                vat_rate: vatRate
            });
            onClose();
        } catch (error) {
            console.error("Failed to generate PO", error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !processing && onClose()}>
            <DialogContent className="max-w-4xl p-0 gap-0 bg-background border-border/50 shadow-xl overflow-hidden rounded-2xl">
                <div className="flex flex-col h-[90vh]">
                    {/* Header */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 px-8 py-6 border-b border-border/50">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <Receipt size={20} className="text-white" />
                                </div>
                                Generate Purchase Order
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                                <AlertCircle size={16} className="text-blue-600 dark:text-blue-400" />
                                Select items to include in this Purchase Order.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                        {/* Item Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                    Select Items
                                    <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{selectedIndices.length} / {items.length}</span>
                                </Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs font-bold text-primary"
                                    onClick={() => setSelectedIndices(selectedIndices.length === items.length ? [] : items.map((_: any, idx: number) => idx))}
                                >
                                    {selectedIndices.length === items.length ? "Deselect All" : "Select All"}
                                </Button>
                            </div>

                            <div className="grid gap-3">
                                {items.map((item: any, idx: number) => {
                                    const isSelected = selectedIndices.includes(idx);
                                    const price = parseFloat(item.unit_price || item.estimated_unit_price || 0);
                                    const total = (item.quantity || 1) * price;

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                                                isSelected
                                                    ? "bg-blue-500/5 border-blue-500/30 ring-1 ring-blue-500/20"
                                                    : "bg-card border-border hover:border-border/80"
                                            )}
                                            onClick={() => handleToggleItem(idx)}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => handleToggleItem(idx)}
                                                className="data-[state=checked]:bg-blue-600 border-blue-200"
                                            />
                                            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                                                <div className="col-span-6">
                                                    <p className="font-bold text-sm text-foreground">{item.name || item.item_name || 'Item #' + (idx + 1)}</p>
                                                    {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <p className="text-xs uppercase font-bold text-muted-foreground">Qty</p>
                                                    <p className="font-mono text-sm">{item.quantity || 1}</p>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <p className="text-xs uppercase font-bold text-muted-foreground">Unit</p>
                                                    <p className="font-mono text-sm">{price.toLocaleString()}</p>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <p className="text-xs uppercase font-bold text-muted-foreground">Total</p>
                                                    <p className="font-mono font-bold text-sm text-blue-600">{total.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Terms & Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Terms & Conditions</Label>
                                <textarea
                                    className="w-full h-32 rounded-xl bg-muted/20 border-border/50 p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                                    value={terms}
                                    onChange={(e) => setTerms(e.target.value)}
                                    placeholder="Enter terms..."
                                />
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Delivery Date</Label>
                                    <Input
                                        type="date"
                                        value={deliveryDate}
                                        onChange={(e) => setDeliveryDate(e.target.value)}
                                        className="h-12 rounded-xl bg-muted/20 border-border/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">VAT Rate</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={vatRate}
                                            onChange={(e) => setVatRate(parseFloat(e.target.value))}
                                            className="h-12 rounded-xl bg-muted/20 border-border/50"
                                        />
                                        <span className="text-sm font-bold text-muted-foreground">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Totals */}
                    <div className="bg-muted/30 border-t border-border/50 p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex-1 w-full md:w-auto space-y-2">
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="font-mono">{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>VAT ({(vatRate * 100).toFixed(0)}%)</span>
                                    <span className="font-mono">{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-black text-blue-600 pt-2 border-t border-border/50">
                                    <span>Grand Total</span>
                                    <span className="font-mono">{proforma?.currency || 'ETB'} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto items-end">
                                <Button variant="ghost" onClick={onClose} className="h-12 px-6 rounded-xl font-bold">Cancel</Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={processing || selectedIndices.length === 0}
                                    className="h-12 px-8 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create PO"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
