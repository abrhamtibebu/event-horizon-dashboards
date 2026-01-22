import React, { useEffect } from 'react';
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
    CreditCard,
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
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import ProcessPaymentModal from '@/components/vendor-revamped/ProcessPaymentModal';

interface PaymentRequestListProps {
    searchTerm: string;
}

export default function PaymentRequestList({ searchTerm }: PaymentRequestListProps) {
    const { paymentRequests, loading, pagination, fetchPaymentRequests, approvePaymentReq, processPayment } = usePaymentRequests();
    const { hasPermission } = usePermissionCheck();
    const [isProcessPaymentOpen, setIsProcessPaymentOpen] = React.useState(false);
    const [selectedPaymentRequest, setSelectedPaymentRequest] = React.useState<any>(null);
    const [page, setPage] = React.useState(1);

    useEffect(() => {
        fetchPaymentRequests({ search: searchTerm, page });
    }, [fetchPaymentRequests, searchTerm, page]);

    const handleApprove = async (id: number) => {
        if (confirm('Approve this payment request?')) {
            await approvePaymentReq(id, 'approved');
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt('Reason for rejection:');
        if (reason !== null) {
            await approvePaymentReq(id, 'rejected', reason);
        }
    };

    const handleProcessPayment = (paymentRequest: any) => {
        setSelectedPaymentRequest(paymentRequest);
        setIsProcessPaymentOpen(true);
    };

    const handlePaymentProcessed = async (data: any) => {
        if (selectedPaymentRequest) {
            await processPayment(selectedPaymentRequest.id, data);
            fetchPaymentRequests({ search: searchTerm, page });
        }
    };

    if (loading && paymentRequests.length === 0) {
        return (
            <div className="flex justify-center items-center py-32 bg-card/20 rounded-[2rem] border border-dashed border-border/50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (paymentRequests.length === 0) {
        return (
            <div className="text-center py-24 bg-card/20 rounded-[2rem] border border-dashed border-border flex flex-col items-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-lg font-bold mb-1">No payment requests found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium">
                    Internal payment requests for vendors will appear here.
                </p>
                <Button variant="outline" className="mt-6 rounded-xl font-bold" onClick={() => {
                    fetchPaymentRequests({ search: '', page: 1 });
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
                <div className="p-1 bg-indigo-500 rounded-lg">
                    <CreditCard className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Payment Requests</h3>
                <Badge variant="outline" className="ml-auto bg-indigo-500/10 text-indigo-600 border-indigo-200 uppercase text-[10px] font-bold px-2 py-0.5 rounded-full">{pagination?.total || paymentRequests.length} Outstanding</Badge>
            </div>
            <div className="rounded-[2rem] border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50 border-b border-border">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-[160px] h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Request #</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Original PO</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vendor</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount Requested</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Method</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                                <TableHead className="text-right h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Operations</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paymentRequests.map((item, idx) => (
                                <motion.tr
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group hover:bg-muted/30 transition-all border-b border-border/50 last:border-0"
                                >
                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-indigo-500/20 rounded-full group-hover:bg-indigo-500 transition-colors shrink-0" />
                                            <span className="font-mono font-bold text-indigo-600 text-xs tracking-wider">{item.payment_request_number}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-4">
                                        <span className="text-[10px] font-mono text-muted-foreground">{item.purchase_order?.po_number}</span>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <span className="text-xs font-bold text-foreground">{item.purchase_order?.vendor?.name}</span>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-primary text-sm">
                                                ETB {Number(item.amount).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Settlement</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                            <CreditCard className="h-3 w-3" />
                                            <span className="capitalize">{item.payment_method?.replace('_', ' ')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <Badge
                                            className={cn(
                                                "capitalize flex w-fit items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0",
                                                item.status === 'approved' || item.status === 'paid' ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20" :
                                                    item.status === 'pending_approval' ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20" :
                                                        "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20"
                                            )}
                                        >
                                            {item.status === 'pending_approval' && <Clock className="h-2.5 w-2.5 animate-pulse" />}
                                            {(item.status === 'approved' || item.status === 'paid') && <CheckCircle2 className="h-2.5 w-2.5" />}
                                            {item.status === 'rejected' && <XCircle className="h-2.5 w-2.5" />}
                                            {item.status?.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl border-border">
                                                <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer">
                                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer">
                                                    <FileText className="mr-2 h-4 w-4" /> Payment Voucher
                                                </DropdownMenuItem>
                                                {item.status === 'pending_approval' && hasPermission('payment_request.approve') && (
                                                    <>
                                                        <DropdownMenuSeparator className="my-1" />
                                                        <DropdownMenuItem
                                                            className="rounded-xl px-3 py-2 cursor-pointer text-emerald-600 focus:bg-emerald-500/10 focus:text-emerald-600"
                                                            onClick={() => handleApprove(item.id)}
                                                        >
                                                            <Check className="mr-2 h-4 w-4" /> Approve for Payment
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="rounded-xl px-3 py-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                            onClick={() => handleReject(item.id)}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" /> Reject Request
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {item.status === 'approved' && hasPermission('payments.process') && (
                                                    <>
                                                        <DropdownMenuSeparator className="my-1" />
                                                        <DropdownMenuItem
                                                            className="rounded-xl px-3 py-2 cursor-pointer text-emerald-600 focus:bg-emerald-500/10 focus:text-emerald-600"
                                                            onClick={() => handleProcessPayment(item)}
                                                        >
                                                            <CreditCard className="mr-2 h-4 w-4" /> Process Payment
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
                        Showing {paymentRequests.length} of {pagination?.total || paymentRequests.length} requests
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

            {selectedPaymentRequest && (
                <ProcessPaymentModal
                    isOpen={isProcessPaymentOpen}
                    onClose={() => {
                        setIsProcessPaymentOpen(false);
                        setSelectedPaymentRequest(null);
                    }}
                    paymentRequest={selectedPaymentRequest}
                    onProcess={handlePaymentProcessed}
                />
            )}
        </div>
    );
}
