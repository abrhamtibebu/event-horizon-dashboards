import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Globe, Loader2, FileText, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VendorProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendor: any;
}

export default function VendorProfileModal({ isOpen, onClose, vendor }: VendorProfileModalProps) {
    if (!vendor) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-border shadow-2xl rounded-[2rem]">
                <div className="relative h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
                    {/* Gradient Header */}
                </div>

                <div className="px-8 pb-8 -mt-12">
                    <div className="flex justify-between items-end mb-6">
                        <div className="flex items-end gap-6">
                            <Avatar className="h-24 w-24 rounded-[1.5rem] border-4 border-background shadow-xl ring-2 ring-border/50">
                                <AvatarImage src={vendor.logo_url} />
                                <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
                                    {vendor.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="mb-2">
                                <DialogTitle className="text-2xl font-black tracking-tight">{vendor.name}</DialogTitle>
                                <DialogDescription className="sr-only">
                                    Detailed profile information for {vendor.name}.
                                </DialogDescription>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mt-1">
                                    <Badge variant="secondary" className="rounded-lg">{vendor.category || 'General Service'}</Badge>
                                    <span>•</span>
                                    <span className="capitalize">{vendor.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Contact Information</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm font-medium">
                                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <span>{vendor.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium">
                                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <span>{vendor.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium">
                                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <span>{vendor.address || 'Address not specified'}</span>
                                    </div>
                                    {vendor.website && (
                                        <div className="flex items-center gap-3 text-sm font-medium">
                                            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                                <Globe className="h-4 w-4" />
                                            </div>
                                            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                {vendor.website}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Business Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Tax ID (TIN)</p>
                                        <p className="font-mono font-medium text-sm">{vendor.tax_id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold">License #</p>
                                        <p className="font-mono font-medium text-sm">{vendor.business_license || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Pricing Model</p>
                                        <p className="capitalize font-medium text-sm">{vendor.pricing_model?.replace('_', ' ') || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Payment Terms</p>
                                        <p className="capitalize font-medium text-sm">{vendor.payment_terms?.replace('_', ' ') || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Services Provided</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(vendor.services_provided) ? vendor.services_provided.map((service: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-primary">
                                            {service}
                                        </Badge>
                                    )) : <span className="text-sm text-muted-foreground">No services listed</span>}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Portfolio Highlights</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(vendor.portfolio_items) && vendor.portfolio_items.length > 0 ? vendor.portfolio_items.map((item: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="rounded-lg text-muted-foreground">
                                            {item}
                                        </Badge>
                                    )) : <span className="text-sm text-muted-foreground italic">No portfolio items added</span>}
                                </div>
                            </div>

                            {vendor.notes && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Internal Notes</h3>
                                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
                                        {vendor.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
