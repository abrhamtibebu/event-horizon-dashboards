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
    Tag,
    Upload,
    Trash2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePurchaseRequests } from '@/hooks/use-purchase-requests';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import UploadProformaModal from '@/components/vendor-revamped/UploadProformaModal';
import CreatePurchaseRequestModal from '@/components/vendor-revamped/CreatePurchaseRequestModal';
import { usePermissionCheck } from '@/hooks/use-permission-check';

import PurchaseRequestDetailsModal from './PurchaseRequestDetailsModal';

interface PurchaseRequestListProps {
    searchTerm: string;
}

export default function PurchaseRequestList({ searchTerm }: PurchaseRequestListProps) {
    const { purchaseRequests, loading, pagination, fetchPRs, approvePR, updatePR, deletePR } = usePurchaseRequests();
    const { hasPermission } = usePermissionCheck();
    const [isUploadProformaOpen, setIsUploadProformaOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedPr, setSelectedPr] = useState<any>(null);
    const [page, setPage] = useState(1);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [prToEdit, setPrToEdit] = useState<any>(null); // State for editing

    useEffect(() => {
        fetchPRs({ search: searchTerm, page });
    }, [fetchPRs, searchTerm, page]);

    const handleApprove = async (id: number) => {
        if (confirm('Approve this purchase request?')) {
            await approvePR(id, 'approved');
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt('Reason for rejection:');
        if (reason !== null) {
            await approvePR(id, 'rejected', reason);
        }
    };

    const handleSubmitDraft = async (id: number) => {
        if (confirm('Submit this draft for approval?')) {
            await updatePR(id, { status: 'pending_approval' });
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
            await deletePR(id);
        }
    };

    const handleEdit = (pr: any) => {
        setPrToEdit(pr);
        setIsCreateModalOpen(true);
    };

    const handleInspect = (pr: any) => {
        setSelectedPr(pr);
        setIsDetailsOpen(true);
    };

    const handleUploadProformaSelection = (id: number, title: string, items: any[]) => {
        setSelectedPr({ id, title, items });
        setIsUploadProformaOpen(true);
    };

    if (loading && purchaseRequests.length === 0) {
        return (
            <div className="flex justify-center items-center py-32 bg-card/20 rounded-[2rem] border border-dashed border-border/50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (purchaseRequests.length === 0) {
        return (
            <div className="text-center py-24 bg-card/20 rounded-[2rem] border border-dashed border-border flex flex-col items-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-lg font-bold mb-1">No purchase requests found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium">
                    Try adjusting your search filters or create a new request to get started.
                </p>
                <Button variant="outline" className="mt-6 rounded-xl font-bold" onClick={() => {
                    fetchPRs({ search: '', page: 1 });
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
                <div className="p-1 bg-primary rounded-lg">
                    <FileText className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Purchase Records</h3>
                <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20 uppercase text-[10px] font-bold px-2 py-0.5 rounded-full">{pagination?.total || purchaseRequests.length} Active Items</Badge>
            </div>
            <div className="rounded-[2rem] border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50 border-b border-border">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-[160px] h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID Record</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Requirement Details</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assigned Vendor</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timeline</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Financials</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workflow</TableHead>
                                <TableHead className="text-right h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Operations</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseRequests.map((pr, idx) => (
                                <motion.tr
                                    key={pr.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group hover:bg-muted/30 transition-all border-b border-border/50 last:border-0"
                                >
                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-primary/20 rounded-full group-hover:bg-primary transition-colors shrink-0" />
                                            <span className="font-mono font-bold text-primary text-xs tracking-wider">{pr.pr_number}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-4">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-foreground text-sm truncate max-w-[200px]">{pr.title}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    <User className="h-2.5 w-2.5" />
                                                    <span>{pr.requester?.name || pr.user?.name || 'Unassigned'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                            <div className={cn("p-1.5 rounded-lg", !pr.vendor ? "bg-amber-500/10" : "bg-accent/50")}>
                                                <Tag className={cn("h-3 w-3", !pr.vendor ? "text-amber-500" : "text-muted-foreground")} />
                                            </div>
                                            <span className={cn("text-xs font-bold truncate max-w-[140px]", !pr.vendor ? "text-muted-foreground italic" : "text-foreground")}>
                                                {pr.vendor?.name || 'Pending Assignment'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{pr.created_at ? format(new Date(pr.created_at), 'MMM dd, yyyy') : 'N/A'}</span>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tighter">
                                                {pr.created_at ? format(new Date(pr.created_at), 'HH:mm aaa') : ''}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <div className="flex flex-col">
                                            {Number(pr.total_amount) > 0 ? (
                                                <>
                                                    <span className="font-black text-primary text-sm">
                                                        ETB {Number(pr.total_amount).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Estimated Value</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="font-bold text-muted-foreground text-xs italic">
                                                        To Be Determined
                                                    </span>
                                                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">Awaiting Proforma</span>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <Badge
                                            className={cn(
                                                "capitalize flex w-fit items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0",
                                                pr.status === 'approved' ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
                                                    pr.status === 'pending' || pr.status === 'pending_approval' ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]" :
                                                        pr.status === 'draft' ? "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20" :
                                                            "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                                            )}
                                        >
                                            {(pr.status === 'pending' || pr.status === 'pending_approval') && <Clock className="h-2.5 w-2.5 animate-pulse" />}
                                            {pr.status === 'approved' && <CheckCircle2 className="h-2.5 w-2.5" />}
                                            {pr.status === 'rejected' && <XCircle className="h-2.5 w-2.5" />}
                                            {pr.status === 'draft' && <FileText className="h-2.5 w-2.5" />}
                                            {pr.status === 'pending_approval' ? 'Pending' : pr.status}
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
                                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 px-3">Lifecycle Control</DropdownMenuLabel>
                                                <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary" onClick={() => handleInspect(pr)}>
                                                    <Eye className="mr-2 h-4 w-4" /> Inspect Details
                                                </DropdownMenuItem>
                                                {pr.status === 'draft' && (
                                                    <>
                                                        <DropdownMenuSeparator className="my-1 bg-border/50" />
                                                        <DropdownMenuItem
                                                            className="rounded-xl px-3 py-2 cursor-pointer text-primary focus:bg-primary/10 focus:text-primary"
                                                            onClick={() => handleEdit(pr)}
                                                        >
                                                            <FileText className="mr-2 h-4 w-4" /> Edit Request
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="rounded-xl px-3 py-2 cursor-pointer text-primary focus:bg-primary/10 focus:text-primary"
                                                            onClick={() => handleSubmitDraft(pr.id)}
                                                        >
                                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Submit Request
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="rounded-xl px-3 py-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                            onClick={() => handleDelete(pr.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Request
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {(pr.status === 'pending' || pr.status === 'pending_approval') && hasPermission('pr.approve') && (
                                                    <>
                                                        <DropdownMenuSeparator className="my-1 bg-border/50" />
                                                        <DropdownMenuItem
                                                            className="rounded-xl px-3 py-2 cursor-pointer text-emerald-600 focus:bg-emerald-500/10 focus:text-emerald-600"
                                                            onClick={() => handleApprove(pr.id)}
                                                        >
                                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Formal Approval
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="rounded-xl px-3 py-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                            onClick={() => handleReject(pr.id)}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" /> Decline Request
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {pr.status === 'approved' && hasPermission('proforma.upload') && (
                                                    <>
                                                        <DropdownMenuSeparator className="my-1 bg-border/50" />
                                                        <DropdownMenuItem
                                                            className="rounded-xl px-3 py-2 cursor-pointer text-primary focus:bg-primary/10 focus:text-primary"
                                                            onClick={() => handleUploadProformaSelection(pr.id, pr.title, pr.items || [])}
                                                        >
                                                            <Upload className="mr-2 h-4 w-4" /> Upload Proforma
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
                        Showing {purchaseRequests.length} of {pagination?.total || purchaseRequests.length} verified records
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

            <PurchaseRequestDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => {
                    setIsDetailsOpen(false);
                    setSelectedPr(null);
                }}
                pr={selectedPr}
            />

            <CreatePurchaseRequestModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setPrToEdit(null);
                    fetchPRs({ search: searchTerm, page }); // Refresh
                }}
                prToEdit={prToEdit}
            />

            <UploadProformaModal
                isOpen={isUploadProformaOpen}
                onClose={() => {
                    setIsUploadProformaOpen(false);
                    setSelectedPr(null);
                    fetchPRs({ search: searchTerm, page }); // Refresh list on close
                }}
                prId={selectedPr?.id || null}
                prTitle={selectedPr?.title || ''}
                prItems={selectedPr?.items || []}
            />
        </div>
    );
}
