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
    Mail,
    Phone,
    MapPin,
    ExternalLink,
    Edit,
    Trash2,
    Eye,
    Users
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useVendors } from '@/hooks/use-vendors';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { usePermissionCheck } from '@/hooks/use-permission-check';

interface VendorListProps {
    searchTerm: string;
    onEdit: (vendor: any) => void;
    onViewProfile: (vendor: any) => void;
}

export default function VendorList({ searchTerm, onEdit, onViewProfile }: VendorListProps) {
    const { vendors, loading, pagination, fetchVendors, removeVendor } = useVendors();
    const { hasPermission } = usePermissionCheck();
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchVendors({ search: searchTerm, page });
    }, [fetchVendors, searchTerm, page]);

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this vendor?')) {
            await removeVendor(id);
        }
    };

    if (loading && vendors.length === 0) {
        return (
            <div className="flex justify-center items-center py-32 bg-card/20 rounded-[2rem] border border-dashed border-border/50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (vendors.length === 0) {
        return (
            <div className="text-center py-24 bg-card/20 rounded-[2rem] border border-dashed border-border flex flex-col items-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-lg font-bold mb-1">No vendors found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium">
                    Try adjusting your search filters or add a new vendor to get started.
                </p>
                <Button variant="outline" className="mt-6 rounded-xl font-bold" onClick={() => fetchVendors({ search: '' })}>
                    Clear Search
                </Button>
            </div>
        );
    }

    return (
        <div className="rounded-[2rem] border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50 border-b border-border">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[320px] h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vendor Profile</TableHead>
                            <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Classification</TableHead>
                            <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Connectivity</TableHead>
                            <TableHead className="h-12 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lifecycle Status</TableHead>
                            <TableHead className="text-right h-12 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Management</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vendors.map((vendor, idx) => (
                            <motion.tr
                                key={vendor.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group hover:bg-muted/30 transition-all border-b border-border/50 last:border-0"
                            >
                                <TableCell className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-12 w-12 rounded-xl ring-2 ring-background shadow-sm border border-border transition-transform group-hover:scale-105">
                                                <AvatarImage src={vendor.logo_url} />
                                                <AvatarFallback className="bg-primary/5 text-primary font-bold">{vendor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                                                vendor.status === 'active' ? "bg-emerald-500" : "bg-muted-foreground/30"
                                            )} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-foreground text-sm truncate">{vendor.name}</span>
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium truncate">
                                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                                {vendor.address || 'Location Unspecified'}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4">
                                    <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/[0.03] text-primary/80 font-bold text-[10px] px-2 py-0.5">
                                        {vendor.category || 'General Service'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="px-4">
                                    <div className="flex flex-col gap-1.5">
                                        {vendor.email && (
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                                                <Mail className="h-3 w-3" />
                                                <span className="truncate max-w-[150px]">{vendor.email}</span>
                                            </div>
                                        )}
                                        {vendor.phone && (
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                                                <Phone className="h-3 w-3" />
                                                <span>{vendor.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="px-4">
                                    <Badge
                                        className={cn(
                                            "capitalize text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0",
                                            vendor.status === 'active' ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20" :
                                                vendor.status === 'inactive' ? "bg-muted text-muted-foreground" :
                                                    "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20"
                                        )}
                                    >
                                        {vendor.status}
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
                                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 px-3">Vendor Operations</DropdownMenuLabel>
                                            <DropdownMenuItem
                                                className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary"
                                                onClick={() => onViewProfile(vendor)}
                                            >
                                                <Eye className="mr-2 h-4 w-4" /> View Full Profile
                                            </DropdownMenuItem>

                                            {hasPermission('vendors.manage') && (
                                                <DropdownMenuItem
                                                    className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary"
                                                    onClick={() => onEdit(vendor)}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" /> Edit Information
                                                </DropdownMenuItem>
                                            )}

                                            <DropdownMenuItem
                                                className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary"
                                                onClick={() => toast.info('Public Vendor Portal coming soon!')}
                                            >
                                                <ExternalLink className="mr-2 h-4 w-4" /> Public Portal
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="my-1 bg-border/50" />
                                            {hasPermission('vendors.delete') && (
                                                <DropdownMenuItem
                                                    className="rounded-xl px-3 py-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                    onClick={() => handleDelete(vendor.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Retire Vendor
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </motion.tr>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination / Footer Information */}
            <div className="px-6 py-4 bg-muted/20 border-t border-border flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <div>
                    Showing {vendors.length} of {pagination?.total || vendors.length} verified providers
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
    );
}
