import React, { useState } from 'react';
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
    XCircle,
    AlertCircle,
    Calendar,
    User,
    Tag,
    Clock,
    ShoppingBag
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PurchaseRequestDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pr: any;
}

export default function PurchaseRequestDetailsModal({ isOpen, onClose, pr }: PurchaseRequestDetailsModalProps) {
    if (!pr) return null;

    // Parse items if they are JSON string, otherwise use as is
    const items = Array.isArray(pr.items) ? pr.items : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 gap-0 bg-background border-border shadow-2xl overflow-hidden rounded-[2rem]">
                <div className="flex flex-col h-[80vh]">
                    {/* Header */}
                    <div className="bg-muted/30 px-8 py-8 border-b border-border/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <ShoppingBag size={120} />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <span className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
                                        <FileText size={20} />
                                    </span>
                                    <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                                        PR Detail Record
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] font-mono uppercase tracking-[0.2em] border-primary/20 bg-primary/5 text-primary px-3 py-1",
                                                pr.status === 'approved' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                    pr.status === 'rejected' ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : ""
                                            )}
                                        >
                                            {pr.status?.replace('_', ' ')}
                                        </Badge>
                                    </h2>
                                </div>
                                <p className="text-muted-foreground font-medium text-sm flex items-center gap-2 mt-2">
                                    Reference ID: <span className="font-mono text-primary font-bold">{pr.pr_number}</span>
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-muted/50">
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-8 space-y-10">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 bg-card/50 rounded-[1.5rem] border border-border/50 space-y-3 relative overflow-hidden group hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">
                                        <Calendar className="h-3.5 w-3.5 text-primary/60" /> Created On
                                    </div>
                                    <p className="font-bold text-lg px-1">{format(new Date(pr.created_at), 'MMM dd, yyyy')}</p>
                                    <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest px-1">{format(new Date(pr.created_at), 'p')}</p>
                                </div>

                                <div className="p-5 bg-card/50 rounded-[1.5rem] border border-border/50 space-y-3 relative overflow-hidden group hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">
                                        <User className="h-3.5 w-3.5 text-primary/60" /> Originator
                                    </div>
                                    <p className="font-bold text-lg px-1 truncate">{pr.requester?.name || pr.user?.name || 'Unknown'}</p>
                                    <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest px-1 truncate">{pr.requester?.email || pr.user?.email || 'N/A'}</p>
                                </div>

                                <div className="p-5 bg-card/50 rounded-[1.5rem] border border-border/50 space-y-3 relative overflow-hidden group hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">
                                        <Tag className="h-3.5 w-3.5 text-primary/60" /> Target Vendor
                                    </div>
                                    <p className="font-bold text-lg px-1 truncate">{pr.vendor?.name || 'Pending Matching'}</p>
                                    {pr.vendor && <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest px-1 truncate">{pr.vendor.category}</p>}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Justification & Scope</h3>
                                <div className="p-6 bg-muted/20 rounded-[1.5rem] border border-border/30 text-sm font-medium leading-relaxed">
                                    {pr.description || <span className="text-muted-foreground/40 italic">No description provided for this request.</span>}
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Requested Line Items</h3>
                                    <Badge variant="secondary" className="rounded-lg font-bold text-[10px]">{items.length} items</Badge>
                                </div>

                                <div className="rounded-[1.5rem] border border-border/50 overflow-hidden shadow-sm bg-card/30">
                                    <Table>
                                        <TableHeader className="bg-muted/40">
                                            <TableRow className="hover:bg-transparent border-b border-border/50">
                                                <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest pl-8">Item Specification</TableHead>
                                                <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest text-right pr-8">Requested Qty</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.length > 0 ? (
                                                items.map((item: any, idx: number) => (
                                                    <TableRow key={idx} className="hover:bg-muted/30 border-b border-border/30 last:border-0 transition-colors">
                                                        <TableCell className="font-bold text-sm text-foreground pl-8 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                                {item.name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-right font-black text-primary pr-8">{item.quantity}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center py-10 text-muted-foreground font-medium italic">
                                                        No line items specified.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Financial Summary if available */}
                            {pr.total_amount > 0 && (
                                <div className="p-6 bg-primary/[0.03] rounded-[1.5rem] border border-primary/10 flex justify-between items-center">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">Estimated Value</h4>
                                        <p className="text-muted-foreground text-[10px] font-bold uppercase">Based on manual estimation or vendor quote</p>
                                    </div>
                                    <div className="text-right font-black text-2xl text-primary">
                                        ETB {Number(pr.total_amount).toLocaleString()}
                                    </div>
                                </div>
                            )}

                            {/* Rejection/Comments */}
                            {pr.rejection_reason && (
                                <div className="bg-rose-500/5 border border-rose-500/20 rounded-[1.5rem] p-6 space-y-3">
                                    <div className="flex items-center gap-2 text-rose-600 text-xs font-black uppercase tracking-widest">
                                        <XCircle className="h-4 w-4" /> Rejection Remark
                                    </div>
                                    <p className="text-sm font-medium text-rose-900/80 leading-relaxed bg-white/50 p-4 rounded-xl border border-rose-200/50">
                                        {pr.rejection_reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-muted/30 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Clock className="h-4 w-4 text-muted-foreground/60" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Stage Duration</span>
                                <span className="text-[11px] font-bold">Created {format(new Date(pr.created_at), 'PPP')}</span>
                            </div>
                        </div>
                        <Button onClick={onClose} className="rounded-xl px-8 font-bold h-11">
                            Close Inspection
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
