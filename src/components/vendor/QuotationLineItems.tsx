import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getQuotationLineItems, createQuotationLineItem, updateQuotationLineItem, deleteQuotationLineItem, uploadProforma, getVendorQuotationById } from '@/lib/api';

interface QuotationLineItemsProps {
  quotationId: number;
}

export default function QuotationLineItems({ quotationId }: QuotationLineItemsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProformaDialogOpen, setIsProformaDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [proformaFile, setProformaFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: quotationResponse } = useQuery({
    queryKey: ['quotation', quotationId],
    queryFn: () => getVendorQuotationById(quotationId),
    enabled: !!quotationId,
  });

  const quotation = quotationResponse?.data?.data || quotationResponse?.data;

  const { data: lineItemsResponse, isLoading } = useQuery({
    queryKey: ['quotation-line-items', quotationId],
    queryFn: () => getQuotationLineItems(quotationId),
    enabled: !!quotationId,
  });

  const lineItems = lineItemsResponse?.data?.data || lineItemsResponse?.data || [];

  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    quantity: 1,
    unit_price: 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createQuotationLineItem(quotationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-line-items', quotationId] });
      toast.success('Line item added successfully');
      setIsAddDialogOpen(false);
      setFormData({ item_name: '', description: '', quantity: 1, unit_price: 0 });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add line item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: any }) =>
      updateQuotationLineItem(quotationId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-line-items', quotationId] });
      toast.success('Line item updated successfully');
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update line item');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: number) => deleteQuotationLineItem(quotationId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-line-items', quotationId] });
      toast.success('Line item deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete line item');
    },
  });

  const uploadProformaMutation = useMutation({
    mutationFn: (file: File) => uploadProforma(quotationId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] });
      toast.success('Proforma uploaded successfully');
      setIsProformaDialogOpen(false);
      setProformaFile(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to upload proforma');
    },
  });

  const handleAdd = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      description: item.description || '',
      quantity: item.quantity,
      unit_price: item.unit_price,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    updateMutation.mutate({ itemId: editingItem.id, data: formData });
  };

  const handleDelete = (itemId: number) => {
    if (confirm('Are you sure you want to delete this line item?')) {
      deleteMutation.mutate(itemId);
    }
  };

  const handleProformaUpload = () => {
    if (!proformaFile) {
      toast.error('Please select a file');
      return;
    }
    uploadProformaMutation.mutate(proformaFile);
  };

  const totalAmount = lineItems.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Line Items & Proforma</h4>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsProformaDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Proforma
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {quotation?.proforma_path && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded">
          <FileText className="h-4 w-4" />
          <span className="text-sm">Proforma uploaded</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(quotation.proforma_path, '_blank')}
          >
            View
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : lineItems.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No line items added yet
        </p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell>{item.description || '-'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit_price.toLocaleString()} ETB</TableCell>
                  <TableCell>{item.total_price.toLocaleString()} ETB</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 border-t bg-muted">
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold">{totalAmount.toLocaleString()} ETB</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          setEditingItem(null);
          setFormData({ item_name: '', description: '', quantity: 1, unit_price: 0 });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Line Item' : 'Add Line Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the line item details' : 'Add a new line item to the quotation'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name *</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price (ETB) *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setEditingItem(null);
                  setFormData({ item_name: '', description: '', quantity: 1, unit_price: 0 });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingItem ? handleUpdate : handleAdd}
                disabled={!formData.item_name || formData.quantity < 1 || formData.unit_price < 0}
              >
                {editingItem ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proforma Upload Dialog */}
      <Dialog open={isProformaDialogOpen} onOpenChange={setIsProformaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Proforma Invoice</DialogTitle>
            <DialogDescription>
              Upload the proforma invoice file for this quotation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proforma">Proforma File</Label>
              <Input
                id="proforma"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setProformaFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsProformaDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleProformaUpload}
                disabled={!proformaFile || uploadProformaMutation.isPending}
              >
                {uploadProformaMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

