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
    Receipt,
    ExternalLink
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

interface PaymentHistoryListProps {
    searchTerm: string;
}

export default function PaymentHistoryList({ searchTerm }: PaymentHistoryListProps) {
    const { paymentRequests, loading, pagination, fetchPaymentRequests } = usePaymentRequests();
    const [page, setPage] = React.useState(1);

    useEffect(() => {
        fetchPaymentRequests({ search: searchTerm, status: 'paid', page });
    }, [fetchPaymentRequests, searchTerm, page]);

    // Filter only paid payment requests (redundant if API handles it but useful for safety)
    const processedPayments = paymentRequests.filter(pr => pr.status === 'paid');

    if (loading && processedPayments.length === 0) {
        return (
            <div className="flex justify-center items-center py-32 bg-card/20 rounded-[2rem] border border-dashed border-border/50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (processedPayments.length === 0) {
        return (
            <div className="text-center py-24 bg-card/20 rounded-[2rem] border border-dashed border-border flex flex-col items-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Receipt className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-lg font-bold mb-1">No payments recorded</h3>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium">
                    Processed payments will appear here.
                </p>
                <Button variant="outline" className="mt-6 rounded-xl font-bold" onClick={() => {
                    fetchPaymentRequests({ search: '', status: 'paid', page: 1 });
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
                <div className="p-1 bg-emerald-500 rounded-lg">
                    <Receipt className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Payment History</h3>
                <Badge variant="outline" className="ml-auto bg-emerald-500/10 text-emerald-600 border-emerald-200 uppercase text-[10px] font-bold px-2 py-0.5 rounded-full">{pagination?.total || processedPayments.length} Transactions</Badge>
            </div>
            <div className="rounded-[2rem] border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50 border-b border-border">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-[160px] h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Transaction ID</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vendor</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment Date</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Value</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment Method</TableHead>
                                <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                                <TableHead className="text-right h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Operations</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedPayments.map((item, idx) => {
                                // Get the first payment record from the payments array
                                const payment = item.payments?.[0];

                                return (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-muted/30 transition-all border-b border-border/50 last:border-0"
                                    >
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-6 bg-emerald-500/20 rounded-full group-hover:bg-emerald-500 transition-colors shrink-0" />
                                                <span className="font-mono font-bold text-emerald-600 text-xs tracking-wider truncate max-w-[100px]">
                                                    {payment?.transaction_id || payment?.cheque_number || item.payment_request_number}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-4">
                                            <span className="text-xs font-bold text-foreground">{item.purchase_order?.vendor?.name || 'N/A'}</span>
                                        </TableCell>
                                        <TableCell className="px-4">
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{payment?.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-emerald-600 text-sm">
                                                    ETB {Number(item.amount).toLocaleString()}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Settled</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-mono text-muted-foreground">
                                                    {payment?.payment_method === 'cheque' ? 'Cheque' : 'Bank Transfer'}
                                                </span>
                                                <span className="text-[9px] font-mono text-muted-foreground/60">
                                                    {payment?.cheque_number || payment?.transaction_id || 'N/A'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4">
                                            <Badge
                                                className="capitalize flex w-fit items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                            >
                                                <CheckCircle2 className="h-2.5 w-2.5" />
                                                Paid
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
                                                        <Receipt className="mr-2 h-4 w-4" /> Payment Receipt
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer">
                                                        <FileText className="mr-2 h-4 w-4" /> View PO
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </motion.tr>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-4 bg-muted/20 border-t border-border flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <div>
                        Showing {processedPayments.length} of {pagination?.total || processedPayments.length} transactions
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
    );
}
