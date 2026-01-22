import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    FileText,
    X,
    CheckCircle2,
    Calendar,
    User,
    Building2,
    Download,
    Truck,
    CreditCard,
    ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { downloadPOPDF } from '@/lib/api';

interface PurchaseOrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    po: any;
}

export default function PurchaseOrderDetailsModal({ isOpen, onClose, po }: PurchaseOrderDetailsModalProps) {
    if (!po) return null;

    const handleDownloadPDF = async () => {
        try {
            const response = await downloadPOPDF(po.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `PO-${po.po_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download PDF", error);
        }
    };

    const items = Array.isArray(po.items) ? po.items : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 gap-0 bg-background border-border shadow-2xl overflow-hidden rounded-[2rem]">
                <div className="flex flex-col h-[85vh]">
                    {/* Header */}
                    <div className="bg-emerald-600 px-8 py-10 border-b border-white/10 relative overflow-hidden text-white">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldCheck size={140} />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white">
                                        <FileText size={24} />
                                    </span>
                                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                        Purchase Order
                                        <Badge
                                            className="bg-white/20 text-white border-0 text-[10px] font-mono uppercase tracking-[0.2em] px-3 py-1 backdrop-blur-md"
                                        >
                                            {po.status}
                                        </Badge>
                                    </h2>
                                </div>
                                <div className="flex items-center gap-4 mt-4">
                                    <p className="text-white/80 font-bold text-sm flex items-center gap-2">
                                        PO NUMBER: <span className="font-mono text-white text-lg">{po.po_number}</span>
                                    </p>
                                    <Separator orientation="vertical" className="h-4 bg-white/20" />
                                    <p className="text-white/80 font-bold text-sm">
                                        DATE: {format(new Date(po.created_at), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-white/10 text-white">
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-8 space-y-10">
                            {/* Entity Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-6 bg-card rounded-[2rem] border border-border/50 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em] pb-2 border-b border-border/50">
                                        <Building2 className="h-4 w-4" /> Vendor Information
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-xl text-foreground">{po.vendor?.name}</p>
                                        <p className="text-sm font-medium text-muted-foreground">{po.vendor?.address || 'No Address Provided'}</p>
                                        <p className="text-xs font-bold text-muted-foreground/60 mt-2 italic">{po.vendor?.email} | {po.vendor?.phone}</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-card rounded-[2rem] border border-border/50 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em] pb-2 border-b border-border/50">
                                        <Truck className="h-4 w-4" /> Delivery Logistics
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Expected Date</p>
                                            <p className="font-bold text-foreground">{po.delivery_date ? format(new Date(po.delivery_date), 'MMM dd, yyyy') : 'TBD'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Shipping Terms</p>
                                            <p className="font-bold text-foreground">Standard Delivery</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reference Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 bg-muted/20 rounded-2xl flex flex-col items-center text-center space-y-2">
                                    <CreditCard className="h-5 w-5 text-indigo-500" />
                                    <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Payment Terms</span>
                                    <span className="font-bold text-sm">Net 30 Days</span>
                                </div>
                                <div className="p-5 bg-muted/20 rounded-2xl flex flex-col items-center text-center space-y-2">
                                    <Calendar className="h-5 w-5 text-amber-500" />
                                    <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Linked PR</span>
                                    <span className="font-mono font-bold text-sm text-primary">{po.purchaseRequest?.pr_number}</span>
                                </div>
                                <div className="p-5 bg-muted/20 rounded-2xl flex flex-col items-center text-center space-y-2">
                                    <User className="h-5 w-5 text-emerald-500" />
                                    <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Authorized By</span>
                                    <span className="font-bold text-sm">Procurement Office</span>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Ordered Commodities</h3>
                                <div className="rounded-[2rem] border border-border/50 overflow-hidden shadow-md bg-card">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow className="hover:bg-transparent border-b border-border/80">
                                                <TableHead className="h-14 font-black text-[10px] uppercase text-muted-foreground tracking-widest pl-10">Description</TableHead>
                                                <TableHead className="h-14 font-black text-[10px] uppercase text-muted-foreground tracking-widest text-right">Unit Price</TableHead>
                                                <TableHead className="h-14 font-black text-[10px] uppercase text-muted-foreground tracking-widest text-center">Qty</TableHead>
                                                <TableHead className="h-14 font-black text-[10px] uppercase text-muted-foreground tracking-widest text-right pr-10">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item: any, idx: number) => (
                                                <TableRow key={idx} className="hover:bg-muted/10 border-b border-border/30 last:border-0">
                                                    <TableCell className="font-bold text-sm text-foreground pl-10 py-5">{item.name}</TableCell>
                                                    <TableCell className="text-sm text-right font-medium text-muted-foreground">
                                                        {Number(item.unit_price).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-center font-black">{item.quantity}</TableCell>
                                                    <TableCell className="text-right font-black text-sm text-primary pr-10">
                                                        {Number(item.total_price).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-primary/[0.02] hover:bg-primary/[0.02]">
                                                <TableCell colSpan={3} className="text-right py-6 pl-10">
                                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">PO Total Value</span>
                                                </TableCell>
                                                <TableCell className="text-right py-6 pr-10">
                                                    <span className="text-2xl font-black text-primary">
                                                        ETB {Number(po.total_amount).toLocaleString()}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Extra Remarks */}
                            {po.notes && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Internal Notes</h3>
                                    <div className="p-6 bg-muted/10 rounded-[1.5rem] border border-border/30 text-sm italic text-muted-foreground">
                                        "{po.notes}"
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="px-10 py-6 bg-muted/30 border-t border-border/50 flex items-center justify-between">
                        <Button variant="outline" className="rounded-xl font-bold h-12 px-6 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10" onClick={handleDownloadPDF}>
                            <Download className="mr-2 h-4 w-4" /> Export as PDF
                        </Button>
                        <Button onClick={onClose} className="rounded-xl px-10 font-bold h-12">
                            Close Preview
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
