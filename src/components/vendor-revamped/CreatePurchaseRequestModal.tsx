import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, AlertCircle, ShoppingBag, Receipt, Calendar as CalendarIcon, Tag } from 'lucide-react';
import { useVendors } from '@/hooks/use-vendors';
import { usePurchaseRequests } from '@/hooks/use-purchase-requests';
import { getMyEvents } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatePurchaseRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    prToEdit?: any; // Purchase Request to edit
}

export default function CreatePurchaseRequestModal({ isOpen, onClose, prToEdit }: CreatePurchaseRequestModalProps) {
    const { vendors, fetchVendors } = useVendors();
    const { addPR, updatePR, loading: processing } = usePurchaseRequests();
    const [events, setEvents] = useState<any[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_id: '',
        items: [{ name: '', quantity: 1 }] as { name: string; quantity: number }[],
    });

    useEffect(() => {
        if (isOpen) {
            loadEvents();
            if (prToEdit) {
                setFormData({
                    title: prToEdit.title,
                    description: prToEdit.description || '',
                    event_id: prToEdit.event_id ? prToEdit.event_id.toString() : '',
                    items: prToEdit.items && prToEdit.items.length > 0 ? prToEdit.items : [{ name: '', quantity: 1 }],
                });
            } else {
                setFormData({
                    title: '',
                    description: '',
                    event_id: '',
                    items: [{ name: '', quantity: 1 }],
                });
            }
        }
    }, [isOpen, prToEdit]);

    const loadEvents = async () => {
        setLoadingEvents(true);
        try {
            // Fetch all events by the organizer except canceled ones
            const response = await getMyEvents('all', 'cancelled');
            // Backend returns a direct array of events
            const eventsData = Array.isArray(response.data)
                ? response.data
                : (response.data?.data || []);
            setEvents(eventsData);
        } catch (error) {
            console.error('Failed to load events', error);
            toast.error('Failed to load events');
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { name: '', quantity: 1 }]
        }));
    };

    const handleRemoveItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        // @ts-ignore
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'pending_approval' = 'pending_approval') => {
        e.preventDefault();

        if (!formData.event_id || !formData.title) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.items.length === 0 || formData.items.some(i => !i.name || i.quantity <= 0)) {
            toast.error('Please add valid items to the request');
            return;
        }

        try {
            const payload = {
                ...formData,
                total_amount: 0, // No price at this stage
                vendor_id: null, // No vendor at this stage
                status,
            };

            if (prToEdit) {
                await updatePR(prToEdit.id, payload);
            } else {
                await addPR(payload);
            }
            handleClose();
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleClose = () => {
        setFormData({
            title: '',
            description: '',
            event_id: '',
            items: [{ name: '', quantity: 1 }],
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl p-0 gap-0 bg-background border-border shadow-2xl overflow-hidden rounded-[2rem]">
                <div className="flex flex-col h-[90vh]">
                    {/* Header */}
                    <div className="bg-muted/30 px-8 py-8 border-b border-border/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <ShoppingBag size={120} />
                        </div>
                        <div className="relative z-10">
                            <DialogTitle className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                                <span className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
                                    <Receipt size={24} />
                                </span>
                                Purchase Requisition
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
                                <AlertCircle size={16} className="text-primary" />
                                Initiate a purchase request. Vendor selection and pricing will be handled in the next stage.
                            </DialogDescription>
                        </div>
                    </div>

                    <form onSubmit={(e) => handleSubmit(e)} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                        {/* Section 1: Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                                        Request Identifier <span className="text-primary">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g., Office Supplies Restock"
                                        required
                                        className="h-12 rounded-xl bg-muted/20 border-border/50 focus:border-primary focus:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="event" className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                                        Contextual Event <span className="text-primary">*</span>
                                    </Label>
                                    <Select
                                        value={formData.event_id}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, event_id: val }))}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/50 focus:border-primary focus:ring-primary/20 transition-all font-medium text-left">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon size={14} className="text-primary/50" />
                                                <SelectValue placeholder={loadingEvents ? "Syncing events..." : "Select context..."} />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border shadow-xl">
                                            {events.map(event => (
                                                <SelectItem key={event.id} value={event.id.toString()} className="rounded-xl my-1">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon size={14} className="text-primary/50" />
                                                        <span className="font-bold">{event.name || event.title}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                                Justification & Scope
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Explain the purpose of this request..."
                                className="min-h-[100px] rounded-2xl bg-muted/20 border-border/50 focus:border-primary focus:ring-primary/20 transition-all font-medium p-4 resize-none"
                            />
                        </div>

                        {/* Section 2: Line Items */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <div>
                                    <Label className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                        Items Needed
                                        <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{formData.items.length}</span>
                                    </Label>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-1">Specify items and quantities found.</p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="rounded-xl font-bold gap-2 text-primary border-primary/20 bg-primary/[0.03] hover:bg-primary/10 transition-colors">
                                    <Plus className="h-4 w-4" /> Add Item
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {formData.items.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-muted/10 p-5 rounded-[1.5rem] border border-border/30 hover:border-primary/30 transition-all duration-300 shadow-sm"
                                        >
                                            <div className="md:col-span-10 space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Specification</Label>
                                                <Input
                                                    value={item.name}
                                                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                    placeholder="Item Name / Description"
                                                    className="h-10 rounded-xl bg-background border-border/50 font-medium"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Quantity</Label>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    className="h-10 rounded-xl bg-background border-border/50 font-bold text-center"
                                                />
                                            </div>

                                            <div className="absolute top-2 right-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                    onClick={() => handleRemoveItem(index)}
                                                    disabled={formData.items.length === 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-muted/30 border-t border-border/50 flex items-center justify-between">
                        <div className="hidden md:flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Confirmation</span>
                            <span className="text-xs font-medium text-muted-foreground/60">This request will be sent to the Proforma Manager.</span>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 md:flex-none h-12 rounded-xl font-bold hover:bg-muted transition-colors px-6">
                                Discard
                            </Button>
                            <Button
                                type="button"
                                disabled={processing}
                                onClick={(e) => handleSubmit(e, 'draft')}
                                className="flex-1 md:flex-none h-12 rounded-xl px-8 font-bold bg-muted text-foreground hover:bg-muted/80 border border-border transition-all"
                            >
                                Save as Draft
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                onClick={(e) => handleSubmit(e, 'pending_approval')}
                                className="flex-1 md:flex-none h-12 rounded-xl px-10 font-black bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Submit Request"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
