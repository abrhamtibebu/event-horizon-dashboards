import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Trash2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useProformas } from '@/hooks/use-proformas';
import { useVendors } from '@/hooks/use-vendors';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface UploadProformaModalProps {
    isOpen: boolean;
    onClose: () => void;
    prId: number | null;
    prTitle: string;
    prItems: any[];
}

interface AddedItem {
    id: string; // Unique ID for local list
    productIndex: number; // Index in prItems
    vendorId: number;
    quantity: number;
    unitPrice: number;
    vatIncluded: boolean;
    isSelected: boolean;
    // Helpers
    productName: string;
    vendorName: string;
}

export default function UploadProformaModal({ isOpen, onClose, prId, prTitle, prItems }: UploadProformaModalProps) {
    const { uploadProforma } = useProformas();
    const { vendors, fetchVendors } = useVendors();
    const [processing, setProcessing] = useState(false);

    // Form inputs
    const [files, setFiles] = useState<File[]>([]);
    const [remarks, setRemarks] = useState('');

    // Row Input State
    const [currentProductIdx, setCurrentProductIdx] = useState<string>('');
    const [currentVendorId, setCurrentVendorId] = useState<string>('');
    const [currentQty, setCurrentQty] = useState<string>('');
    const [currentPrice, setCurrentPrice] = useState<string>('');
    const [currentVatIncluded, setCurrentVatIncluded] = useState(false);
    const [currentIsSelected, setCurrentIsSelected] = useState(false);

    // List of added items
    const [addedItems, setAddedItems] = useState<AddedItem[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchVendors();
            setAddedItems([]);
            setFiles([]);
            setRemarks('');
            resetCurrentInput();
        }
    }, [isOpen, fetchVendors]);

    const resetCurrentInput = () => {
        setCurrentProductIdx('');
        setCurrentVendorId('');
        setCurrentQty('');
        setCurrentPrice('');
        setCurrentVatIncluded(false);
        setCurrentIsSelected(false);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddItem = () => {
        // Validation
        if (!currentProductIdx || !currentVendorId || !currentQty || !currentPrice) {
            toast.error("Please fill all item fields");
            return;
        }

        const pIdx = parseInt(currentProductIdx);
        const vId = parseInt(currentVendorId);
        const qty = parseFloat(currentQty);
        const price = parseFloat(currentPrice);

        if (isNaN(qty) || qty <= 0) {
            toast.error("Invalid quantity");
            return;
        }
        if (isNaN(price) || price < 0) {
            toast.error("Invalid price");
            return;
        }

        // Uniqueness Check: Vendor + Product must be unique
        const exists = addedItems.some(item => item.productIndex === pIdx && item.vendorId === vId);
        if (exists) {
            toast.error("This vendor has already submitted a price for this product.");
            return;
        }

        const product = prItems[pIdx];
        const vendor = vendors.find(v => v.id === vId);

        const newItem: AddedItem = {
            id: Math.random().toString(36).substr(2, 9),
            productIndex: pIdx,
            vendorId: vId,
            quantity: qty,
            unitPrice: price,
            vatIncluded: currentVatIncluded,
            isSelected: currentIsSelected,
            productName: product?.name || 'Unknown Product',
            vendorName: vendor?.name || 'Unknown Vendor',
        };

        setAddedItems(prev => [...prev, newItem]);
        resetCurrentInput();
    };

    const removeItem = (id: string) => {
        setAddedItems(prev => prev.filter(i => i.id !== id));
    };

    const calculateItemFinancials = (item: AddedItem) => {
        // Logic:
        // If Toggle ON (Inclusive): Base = Price / 1.15, Total = Price * Qty
        // If Toggle OFF (Exclusive): Base = Price, Total = (Price * 1.15) * Qty

        const rawPrice = item.unitPrice;
        const isVatIncluded = item.vatIncluded;

        const effectiveUnitPrice = isVatIncluded ? rawPrice / 1.15 : rawPrice;
        const effectiveLineTotal = (isVatIncluded ? rawPrice : rawPrice * 1.15) * item.quantity;

        return { effectiveUnitPrice, effectiveLineTotal };
    };

    const totalSelectedAmount = useMemo(() => {
        return addedItems
            .filter(item => item.isSelected)
            .reduce((sum, item) => sum + calculateItemFinancials(item).effectiveLineTotal, 0);
    }, [addedItems]);

    const handleSubmit = async () => {
        if (!prId) return;
        if (addedItems.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setProcessing(true);
        try {
            const data = new FormData();
            data.append('pr_id', prId.toString());
            // Amount is sum of SELECTED items
            data.append('amount', totalSelectedAmount.toString());
            data.append('currency', 'ETB'); // Defaulting to ETB as per design
            data.append('notes', remarks);

            // Append files
            files.forEach((file) => {
                data.append('proforma_files[]', file);
            });

            // Prepare items payload
            // We need to map addedItems to the structure backend expects, but also include vendor info
            const itemsPayload = addedItems.map(item => {
                const { effectiveUnitPrice, effectiveLineTotal } = calculateItemFinancials(item);

                return {
                    product_index: item.productIndex,
                    name: item.productName,
                    vendor_id: item.vendorId,
                    vendor_name: item.vendorName,
                    quantity: item.quantity,
                    original_input_price: item.unitPrice,
                    vat_included_input: item.vatIncluded,
                    is_selected: item.isSelected,
                    unit_price: effectiveUnitPrice, // STORED BASIC PRICE
                    total_price: effectiveLineTotal // STORED TOTAL (INCL VAT)
                };
            });

            data.append('items', JSON.stringify(itemsPayload));

            await uploadProforma(data);
            handleClose();
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setFiles([]);
        setAddedItems([]);
        resetCurrentInput();
        setRemarks('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !processing && handleClose()}>
            <DialogContent className="max-w-6xl p-0 gap-0 bg-background border-border shadow-2xl overflow-hidden rounded-[1rem]">
                <div className="flex flex-col h-[90vh]">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-border/50 bg-background/95 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                                <span className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
                                    <FileText size={20} />
                                </span>
                                Create Proforma Sheet
                            </h2>
                            <p className="text-muted-foreground mt-1 font-medium text-sm ml-12">
                                Compare quotes for <span className="text-primary font-bold">{prTitle}</span>
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-xl hover:bg-muted">
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                            {/* File Upload Section */}
                            <div className="border-2 border-dashed border-border rounded-2xl p-6 hover:bg-muted/30 transition-colors bg-card/50">
                                <div className="flex items-center gap-6">
                                    <div className="relative group flex-1">
                                        <input
                                            type="file"
                                            id="files"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            multiple
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="h-14 px-6 rounded-xl border border-input bg-background/50 hover:bg-background flex items-center gap-4 text-sm font-medium text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-all shadow-sm">
                                            <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                                                <Upload className="h-5 w-5" />
                                            </div>
                                            {files.length > 0 ? (
                                                <span className="text-foreground font-bold">{files.length} documents attached</span>
                                            ) : (
                                                <span>Click to upload original proforma invoices (PDF, Images)</span>
                                            )}
                                        </div>
                                    </div>
                                    {files.length > 0 && (
                                        <div className="flex gap-2 flex-wrap max-w-[50%]">
                                            {files.map((f, i) => (
                                                <Badge key={i} variant="secondary" className="gap-2 px-3 py-1.5 rounded-lg text-xs">
                                                    <span className="truncate max-w-[100px]">{f.name}</span>
                                                    <Trash2 className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFile(i)} />
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Input Row */}
                            <div className="p-6 bg-card border border-border/50 rounded-2xl shadow-lg shadow-black/5 space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    {/* Background decoration removed */}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative z-10">
                                    {/* Product Select */}
                                    <div className="md:col-span-3 space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Product Item</Label>
                                        <Select value={currentProductIdx} onValueChange={(val) => {
                                            setCurrentProductIdx(val);
                                            // Auto-fill quantity
                                            const idx = parseInt(val);
                                            if (!isNaN(idx) && prItems[idx]) {
                                                setCurrentQty(prItems[idx].quantity?.toString() || '1');
                                            }
                                        }}>
                                            <SelectTrigger className="h-11 rounded-xl bg-background/50 border-input font-medium focus:ring-primary/20">
                                                <SelectValue placeholder="Select Product" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {prItems.map((item, idx) => (
                                                    <SelectItem key={idx} value={idx.toString()} className="font-medium">
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Vendor Select */}
                                    <div className="md:col-span-3 space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Supplier</Label>
                                        <Select value={currentVendorId} onValueChange={setCurrentVendorId}>
                                            <SelectTrigger className="h-11 rounded-xl bg-background/50 border-input font-medium focus:ring-primary/20">
                                                <SelectValue placeholder="Select Supplier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vendors.map((vendor) => (
                                                    <SelectItem key={vendor.id} value={vendor.id.toString()} className="font-medium">
                                                        {vendor.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Quantity */}
                                    <div className="md:col-span-1 space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Qty</Label>
                                        <Input
                                            type="number"
                                            value={currentQty}
                                            readOnly
                                            className="h-11 rounded-xl bg-muted/50 border-input font-bold text-center focus-visible:ring-0 cursor-not-allowed text-muted-foreground"
                                        />
                                    </div>

                                    {/* Unit Price */}
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Unit Price</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={currentPrice}
                                            onChange={e => setCurrentPrice(e.target.value)}
                                            className="h-11 rounded-xl bg-background/50 border-input font-bold"
                                        />
                                    </div>

                                    {/* Toggles */}
                                    <div className="md:col-span-3 flex flex-col gap-3 pb-1">
                                        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border/50">
                                            <Checkbox
                                                id="isSelected"
                                                checked={currentIsSelected}
                                                onCheckedChange={(c) => setCurrentIsSelected(c as boolean)}
                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                            <Label htmlFor="isSelected" className="text-sm font-medium cursor-pointer">Mark as Preferred</Label>
                                        </div>
                                        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border/50">
                                            <Checkbox
                                                id="vatIncluded"
                                                checked={currentVatIncluded}
                                                onCheckedChange={(c) => setCurrentVatIncluded(c as boolean)}
                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                            <Label htmlFor="vatIncluded" className="text-sm font-medium cursor-pointer">Price includes 15% VAT</Label>
                                        </div>
                                    </div>
                                </div>

                                <Button onClick={handleAddItem} variant="outline" className="w-full h-12 font-bold tracking-wide rounded-xl border-2 hover:bg-muted/50 hover:border-primary/50 transition-all relative z-10 text-muted-foreground hover:text-foreground">
                                    Add Item to Sheet
                                </Button>
                            </div>

                            {/* Items Table */}
                            <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm bg-card/30">
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                            <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest pl-6">Product Item</TableHead>
                                            <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest">Supplier</TableHead>
                                            <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest text-center">Qty</TableHead>
                                            <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest text-right">Unit Price</TableHead>
                                            <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest text-right">Sub Total</TableHead>
                                            <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest text-center">Status</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {addedItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <AlertCircle className="h-8 w-8 opacity-20" />
                                                        <p className="text-sm font-medium">No items added to the sheet yet.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            addedItems.map((item, idx) => {
                                                const financials = calculateItemFinancials(item);
                                                return (
                                                    <TableRow key={item.id} className="hover:bg-muted/30 border-b border-border/30 last:border-0 transition-colors">
                                                        <TableCell className="font-bold text-sm text-foreground pl-6 py-4">{item.productName}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground font-medium">{item.vendorName}</TableCell>
                                                        <TableCell className="text-sm text-center font-bold">{item.quantity}</TableCell>
                                                        <TableCell className="text-sm text-right font-medium text-muted-foreground">
                                                            {item.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                            {item.vatIncluded && <span className="ml-1 text-[9px] uppercase tracking-tighter border border-border px-1 rounded bg-background/50">Inc. VAT</span>}
                                                        </TableCell>
                                                        <TableCell className="font-black text-sm text-right text-primary">
                                                            {financials.effectiveLineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {item.isSelected ? (
                                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 uppercase text-[9px] font-bold">Selected</Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground/30 text-xs font-bold uppercase">Skipped</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeItem(item.id)}
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination / Info (Visual only) */}
                            {addedItems.length > 0 && (
                                <div className="flex justify-end items-center gap-4 text-xs text-muted-foreground">
                                    <span>Rows per page: 10</span>
                                </div>
                            )}

                            {/* Remarks */}
                            <div className="pt-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">Additional Remarks</Label>
                                <Textarea
                                    placeholder="Add any specific notes about this proforma sheet comparison..."
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                    className="min-h-[80px] rounded-xl border-border bg-muted/20 focus:bg-background resize-none p-4 font-medium transition-all"
                                />
                            </div>

                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="p-6 border-t border-border/50 flex justify-end gap-4 bg-muted/20 backdrop-blur-sm">
                        <Button onClick={handleClose} variant="ghost" className="font-bold h-12 px-8 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border text-muted-foreground">
                            Cancel Sheet
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="font-bold h-12 px-8 rounded-xl shadow-sm transition-all"
                        >
                            {processing ? "Processing..." : "Submit Sheet"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
