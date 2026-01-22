import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    MoreHorizontal,
    Plus,
    FileText,
    Calendar,
    Send,
    Download,
    Eye,
    CheckCircle,
    Clock,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePurchaseOrders } from '@/hooks/use-purchase-orders';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import CreatePOModal from '@/components/vendor-revamped/CreatePOModal';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import { downloadPOPDF } from '@/lib/api';
import PurchaseOrderDetailsModal from './PurchaseOrderDetailsModal';
import { toast } from 'sonner';

interface PurchaseOrderListProps {
    searchTerm: string;
}

export default function PurchaseOrderList({ searchTerm }: PurchaseOrderListProps) {
    const { purchaseOrders, approvedProformas, loading, fetchPOs, fetchApprovedProformas, markPOSent, pagination } = usePurchaseOrders();
    const { hasPermission } = usePermissionCheck();

    const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedProforma, setSelectedProforma] = useState<any>(null);
    const [selectedPo, setSelectedPo] = useState<any>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchPOs({ search: searchTerm, page });
        fetchApprovedProformas({ search: searchTerm });
    }, [fetchPOs, fetchApprovedProformas, searchTerm, page]);

    const handleCreatePO = (proforma: any) => {
        setSelectedProforma(proforma);
        setIsCreatePOOpen(true);
    };

    const handleViewDetails = (po: any) => {
        setSelectedPo(po);
        setIsDetailsOpen(true);
    };

    const handleSendPOAction = async (id: number) => {
        if (confirm('Send this Purchase Order to the vendor via email?')) {
            try {
                await markPOSent(id);
                fetchPOs({ search: searchTerm, page });
            } catch (error) {
                // Error handled by hook
            }
        }
    };

    const handleDownload = async (id: number, poNumber: string) => {
        try {
            const response = await downloadPOPDF(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `PO-${poNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download PDF');
        }
    };

    if (loading && purchaseOrders.length === 0 && approvedProformas.length === 0) {
        return (
            <div className="flex justify-center items-center py-32 bg-card/20 rounded-[2rem] border border-dashed border-border/50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (purchaseOrders.length === 0 && approvedProformas.length === 0) {
        return (
            <div className="text-center py-24 bg-card/20 rounded-[2rem] border border-dashed border-border flex flex-col items-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-lg font-bold mb-1">No purchase orders found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium">
                    Approved proformas awaiting PO generation or existing orders will appear here.
                </p>
                <Button variant="outline" className="mt-6 rounded-xl font-bold" onClick={() => {
                    fetchPOs({ search: '', page: 1 });
                    fetchApprovedProformas({ search: '' });
                    setPage(1);
                }}>
                    Clear Filters
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Approved Proformas Awaiting PO */}
            {approvedProformas.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className="p-1 bg-amber-500 rounded-lg">
                            <Clock className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Action Required: PO Generation</h3>
                        <Badge variant="outline" className="ml-auto bg-amber-500/10 text-amber-600 border-amber-200 uppercase text-[10px] font-bold px-2 py-0.5 rounded-full">{approvedProformas.length} Pending Items</Badge>
                    </div>
                    <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/[0.02] overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-amber-500/5">
                                <TableRow className="hover:bg-transparent border-b border-amber-500/10">
                                    <TableHead className="w-[160px] h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-amber-900/40">Proforma ID</TableHead>
                                    <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-amber-900/40">Vendor Name</TableHead>
                                    <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-amber-900/40">Value</TableHead>
                                    <TableHead className="text-right h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-amber-900/40">Operations</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {approvedProformas.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-amber-500/5 transition-all border-b border-amber-500/10 last:border-0">
                                        <TableCell className="px-6 py-4">
                                            <span className="font-mono font-bold text-amber-700 text-xs tracking-wider">{item.proforma_number || `PF-${item.id}`}</span>
                                        </TableCell>
                                        <TableCell className="px-4 py-4">
                                            <span className="text-xs font-bold text-foreground truncate max-w-[200px]">{item.vendor?.name}</span>
                                        </TableCell>
                                        <TableCell className="px-4">
                                            <span className="font-black text-amber-700 text-sm">{item.currency || 'ETB'} {Number(item.amount).toLocaleString()}</span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            {hasPermission('po.create') && (
                                                <Button
                                                    size="sm"
                                                    className="rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/10 h-9"
                                                    onClick={() => handleCreatePO(item)}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" /> Generate PO
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Existing Purchase Orders */}
            {purchaseOrders.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className="p-1 bg-primary rounded-lg">
                            <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Active Purchase Orders</h3>
                        <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20 uppercase text-[10px] font-bold px-2 py-0.5 rounded-full">{pagination?.total || purchaseOrders.length} Records</Badge>
                    </div>
                    <div className="rounded-[2rem] border border-border bg-card overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50 border-b border-border">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="w-[160px] h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order ID</TableHead>
                                        <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Merchant</TableHead>
                                        <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Settlement Value</TableHead>
                                        <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Logistics Timeline</TableHead>
                                        <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fulfillment</TableHead>
                                        <TableHead className="text-right h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Operations</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchaseOrders.map((item, idx) => (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-muted/30 transition-all border-b border-border/50 last:border-0"
                                        >
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-6 bg-primary/20 rounded-full group-hover:bg-primary transition-colors shrink-0" />
                                                    <span className="font-mono font-bold text-primary text-xs tracking-wider">{item.po_number}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-4">
                                                <span className="text-xs font-bold text-foreground">{item.vendor?.name}</span>
                                            </TableCell>
                                            <TableCell className="px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-primary text-sm">{item.currency || 'ETB'} {Number(item.total_amount).toLocaleString()}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Consolidated</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4">
                                                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{item.delivery_date ? format(new Date(item.delivery_date), 'MMM dd, yyyy') : 'No Date Set'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4">
                                                <Badge
                                                    className={cn(
                                                        "capitalize flex w-fit items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0",
                                                        item.status === 'sent' ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
                                                            item.status === 'draft' ? "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20" :
                                                                "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                                                    )}
                                                >
                                                    {item.status === 'sent' && <Send className="h-2.5 w-2.5" />}
                                                    {item.status === 'draft' && <FileText className="h-2.5 w-2.5" />}
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl border-border">
                                                        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 px-3">Order Control</DropdownMenuLabel>
                                                        <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary" onClick={() => handleViewDetails(item)}>
                                                            <Eye className="mr-2 h-4 w-4" /> Inspect PO
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary" onClick={() => handleDownload(item.id, item.po_number)}>
                                                            <Download className="mr-2 h-4 w-4" /> Export PDF
                                                        </DropdownMenuItem>
                                                        {item.status === 'draft' && hasPermission('po.send') && (
                                                            <>
                                                                <DropdownMenuSeparator className="my-1 bg-border/50" />
                                                                <DropdownMenuItem
                                                                    className="rounded-xl px-3 py-2 cursor-pointer text-primary focus:bg-primary/10 focus:text-primary"
                                                                    onClick={() => handleSendPOAction(item.id)}
                                                                >
                                                                    <Send className="mr-2 h-4 w-4" /> Ship to Vendor
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="px-6 py-4 bg-muted/20 border-t border-border flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            <div>
                                Showing {purchaseOrders.length} of {pagination?.total || purchaseOrders.length} orders
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 rounded-lg font-bold"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 rounded-lg font-bold"
                                    disabled={!pagination || page >= pagination.last_page}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CreatePOModal
                isOpen={isCreatePOOpen}
                onClose={() => {
                    setIsCreatePOOpen(false);
                    setSelectedProforma(null);
                    fetchPOs({ search: searchTerm, page });
                    fetchApprovedProformas({ search: searchTerm });
                }}
                proforma={selectedProforma}
                onGenerate={async (data) => {
                    // This is handled inside the modal usually, but if passed as prop:
                    // The hook addPO will be called
                }}
            />

            <PurchaseOrderDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => {
                    setIsDetailsOpen(false);
                    setSelectedPo(null);
                }}
                po={selectedPo}
            />
        </div>
    );
}
