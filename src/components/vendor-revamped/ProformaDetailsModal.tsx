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
    Download,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Calendar,
    User,
    Building2
} from 'lucide-react';
import { useProformas } from '@/hooks/use-proformas';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProformaDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    proforma: any;
}

export default function ProformaDetailsModal({ isOpen, onClose, proforma }: ProformaDetailsModalProps) {
    const { approveProforma } = useProformas();
    const { hasPermission } = usePermissionCheck();
    const [processing, setProcessing] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [approvalRemark, setApprovalRemark] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    if (!proforma) return null;

    const handleApprove = async () => {
        if (!approvalRemark.trim()) {
            toast.error('Please provide an approval remark.');
            return;
        }

        setProcessing(true);
        try {
            await approveProforma(proforma.id, 'approved', approvalRemark);
            toast.success('Proforma Invoice Approved Successfully');
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection.');
            return;
        }

        setProcessing(true);
        try {
            await approveProforma(proforma.id, 'rejected', rejectReason);
            toast.success('Proforma Invoice Rejected');
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    // Parse items if they are JSON string, otherwise use as is
    const items = typeof proforma.items === 'string' ? JSON.parse(proforma.items) : (proforma.items || []);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !processing && onClose()}>
            <DialogContent className="max-w-4xl p-0 gap-0 bg-background border-border shadow-2xl overflow-hidden rounded-[1rem]">
                <div className="flex flex-col h-[85vh]">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-border/50 bg-background/95 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                                    Proforma Details
                                    <Badge variant="outline" className="text-xs font-mono uppercase tracking-wider">
                                        {proforma.status?.replace('_', ' ')}
                                    </Badge>
                                </h2>
                                <p className="text-muted-foreground font-medium text-sm">
                                    Linked to PR: <span className="text-primary font-bold">{proforma.purchaseRequest?.pr_number}</span>
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-muted">
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-8">
                        <div className="space-y-8">

                            {/* Meta Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                        <Calendar className="h-4 w-4" /> Subject Event
                                    </div>
                                    <p className="font-bold text-lg">{proforma.purchaseRequest?.event?.title || 'General Operations'}</p>
                                    <p className="text-xs text-muted-foreground">{proforma.purchaseRequest?.event?.location || 'No Location Specified'}</p>
                                </div>
                                <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                        <User className="h-4 w-4" /> Uploaded By
                                    </div>
                                    <p className="font-bold text-lg">{proforma.uploader?.name || 'System'}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(proforma.created_at), 'PPP p')}</p>
                                </div>
                                <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                        <User className="h-4 w-4" /> Requested By
                                    </div>
                                    <p className="font-bold text-lg">{proforma.purchaseRequest?.requester?.name || 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground">{proforma.purchaseRequest?.requester?.email || 'No Email'}</p>
                                </div>
                            </div>

                            {/* Files Section */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                                    Attached Documents
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {proforma.file_paths && proforma.file_paths.length > 0 ? (
                                        proforma.file_paths.map((path: string, idx: number) => (
                                            <a
                                                key={idx}
                                                href={`${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/storage/${path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-muted/50 transition-all group"
                                            >
                                                <div className="p-2 bg-muted rounded-lg group-hover:bg-background transition-colors">
                                                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">Document {idx + 1}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">PDF / Image</span>
                                                </div>
                                                <Download className="h-4 w-4 text-muted-foreground ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground italic">No files attached.</div>
                                    )}
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                                    Line Items & Quotations
                                </h3>
                                <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm bg-card/30">
                                    <Table>
                                        <TableHeader className="bg-muted/40">
                                            <TableRow className="hover:bg-transparent border-b border-border/50">
                                                <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest pl-6">Product Item</TableHead>
                                                <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest text-right">Unit Price</TableHead>
                                                <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest text-center">Qty</TableHead>
                                                <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest text-right">Total (Inc. VAT)</TableHead>
                                                <TableHead className="h-12 font-bold text-[10px] uppercase text-muted-foreground tracking-widest text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item: any, idx: number) => (
                                                <TableRow key={idx} className="hover:bg-muted/30 border-b border-border/30 last:border-0">
                                                    <TableCell className="font-bold text-sm text-foreground pl-6 py-4">{item.name}</TableCell>
                                                    <TableCell className="text-sm text-right font-medium text-muted-foreground">
                                                        {Number(item.unit_price).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-center font-bold">{item.quantity}</TableCell>
                                                    <TableCell className="text-right font-black text-sm text-primary">
                                                        {Number(item.total_price).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {item.is_selected ? (
                                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 uppercase text-[9px] font-bold">Preferred</Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground/30 text-xs font-bold uppercase">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <div className="text-right">
                                        <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1">Total Valuation</p>
                                        <p className="text-3xl font-black text-primary">{proforma.currency} {Number(proforma.amount).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Rejection Input */}
                            {isRejecting && (
                                <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex items-center gap-2 text-destructive font-bold mb-2">
                                        <AlertCircle className="h-5 w-5" /> Rejection Details
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Reason for Rejection</Label>
                                        <Textarea
                                            value={rejectReason}
                                            onChange={e => setRejectReason(e.target.value)}
                                            placeholder="Please specify why this proforma is being rejected (e.g. Price too high, Invalid document...)"
                                            className="bg-background border-destructive/20 min-h-[100px]"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <Button variant="ghost" onClick={() => setIsRejecting(false)}>Cancel</Button>
                                        <Button variant="destructive" onClick={handleReject} disabled={processing}>
                                            {processing ? 'Rejecting...' : 'Confirm Rejection'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Approval Input */}
                            {isApproving && (
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
                                        <CheckCircle2 className="h-5 w-5" /> Approval Confirmation
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-emerald-700/70">Approval Remarks</Label>
                                        <Textarea
                                            value={approvalRemark}
                                            onChange={e => setApprovalRemark(e.target.value)}
                                            placeholder="Add any specific notes for this approval (e.g., 'Prices verified', 'Urgent processing requested')..."
                                            className="bg-background border-emerald-500/20 min-h-[100px] focus-visible:ring-emerald-500/30"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <Button variant="ghost" onClick={() => setIsApproving(false)}>Cancel</Button>
                                        <Button
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={handleApprove}
                                            disabled={processing}
                                        >
                                            {processing ? 'Approving...' : 'Confirm Approval'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </ScrollArea>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-border/50 bg-muted/20 backdrop-blur-sm flex justify-between items-center">
                        <div className="text-xs text-muted-foreground font-medium">
                            Actions taken here will verify the document and update workflow status.
                        </div>
                        {proforma.status === 'pending_approval' && hasPermission('proforma.approve') ? (
                            !isRejecting && !isApproving && (
                                <div className="flex gap-4">
                                    <Button
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive font-bold h-12 px-6 rounded-xl"
                                        onClick={() => setIsRejecting(true)}
                                    >
                                        <XCircle className="mr-2 h-5 w-5" /> Reject
                                    </Button>
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-emerald-900/10"
                                        onClick={() => setIsApproving(true)}
                                        disabled={processing}
                                    >
                                        <CheckCircle2 className="mr-2 h-5 w-5" /> Approve Proforma
                                    </Button>
                                </div>
                            )
                        ) : (
                            <Button disabled variant="outline" className="opacity-50">
                                {proforma.status === 'approved' ? 'Approved' : proforma.status === 'rejected' ? 'Rejected' : 'Action Unavailable'}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
