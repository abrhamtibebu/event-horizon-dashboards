import React, { useEffect, useState } from 'react';
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
    FileText,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    User,
    Download,
    Check
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProformas } from '@/hooks/use-proformas';
import { usePurchaseOrders } from '@/hooks/use-purchase-orders';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { usePermissionCheck } from '@/hooks/use-permission-check';

import ProformaDetailsModal from './ProformaDetailsModal';

interface ProformaListProps {
    searchTerm: string;
}

export default function ProformaList({ searchTerm }: ProformaListProps) {
    const { proformas, loading, pagination, fetchProformas } = useProformas();
    const { addPO } = usePurchaseOrders();
    const { hasPermission } = usePermissionCheck();
    const [selectedProforma, setSelectedProforma] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchProformas({ search: searchTerm, page });
    }, [fetchProformas, searchTerm, page]);

    const handleViewDetails = (proforma: any) => {
        setSelectedProforma(proforma);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        fetchProformas({ search: searchTerm, page }); // Refresh list after action
    };

    if (loading && proformas.length === 0) {
        return (
            <div className="flex justify-center items-center py-32 bg-card/20 rounded-[2rem] border border-dashed border-border/50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (proformas.length === 0) {
        return (
            <div className="text-center py-24 bg-card/20 rounded-[2rem] border border-dashed border-border flex flex-col items-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-lg font-bold mb-1">No proformas found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium">
                    Proforma invoices uploaded for purchase requests will appear here.
                </p>
                <Button variant="outline" className="mt-6 rounded-xl font-bold" onClick={() => {
                    fetchProformas({ search: '', page: 1 });
                    setPage(1);
                }}>
                    Clear Filters
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <div className="p-1 bg-amber-500 rounded-lg">
                    <FileText className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Proforma Invoices</h3>
                <Badge variant="outline" className="ml-auto bg-amber-500/10 text-amber-600 border-amber-200 uppercase text-[10px] font-bold px-2 py-0.5 rounded-full">{pagination?.total || proformas.length} Documents</Badge>
            </div>
            <div className="rounded-[2rem] border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50 border-b border-border">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-[160px] h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID Record</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Linked Request</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vendor</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valuation</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Validity</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workflow</TableHead>
                                <TableHead className="text-right h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Operations</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {proformas.map((item, idx) => (
                                <motion.tr
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group hover:bg-muted/30 transition-all border-b border-border/50 last:border-0"
                                >
                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-amber-500/20 rounded-full group-hover:bg-amber-500 transition-colors shrink-0" />
                                            <span className="font-mono font-bold text-amber-600 text-xs tracking-wider">PI-{item.id.toString().padStart(4, '0')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-4">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-foreground text-sm truncate max-w-[200px]">{item.purchaseRequest?.title}</span>
                                            <span className="text-[10px] font-mono text-muted-foreground">{item.purchaseRequest?.pr_number}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <span className="text-xs font-bold text-foreground">{item.purchaseRequest?.vendor?.name || 'Unknown Vendor'}</span>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-primary text-sm">
                                                {item.currency} {Number(item.amount).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Total Quote</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            <span>{item.validity_date ? format(new Date(item.validity_date), 'MMM dd, yyyy') : 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <Badge
                                            className={cn(
                                                "capitalize flex w-fit items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0",
                                                item.status === 'approved' ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20" :
                                                    item.status === 'pending_approval' ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20" :
                                                        "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20"
                                            )}
                                        >
                                            {item.status === 'pending_approval' && <Clock className="h-2.5 w-2.5 animate-pulse" />}
                                            {item.status === 'approved' && <CheckCircle2 className="h-2.5 w-2.5" />}
                                            {item.status === 'rejected' && <XCircle className="h-2.5 w-2.5" />}
                                            {item.status?.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                            onClick={() => handleViewDetails(item)}
                                        >
                                            <Eye className="h-5 w-5" />
                                        </Button>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-4 bg-muted/20 border-t border-border flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <div>
                        Showing {proformas.length} of {pagination?.total || proformas.length} documents
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

            <ProformaDetailsModal
                isOpen={isDetailsOpen}
                onClose={handleCloseDetails}
                proforma={selectedProforma}
            />
        </div>
    );
}
