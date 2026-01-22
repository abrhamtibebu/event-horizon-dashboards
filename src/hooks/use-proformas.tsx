import { useState, useCallback } from 'react';
import { getProformaInvoices, uploadProformaInvoice, approveProformaInvoice, getProformaInvoiceById } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useProformas = () => {
    const [proformas, setProformas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<any>(null);
    const { toast } = useToast();

    const fetchProformas = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await getProformaInvoices(params);
            if (response.data.success) {
                setProformas(response.data.data.data);
                setPagination({
                    current_page: response.data.data.current_page,
                    last_page: response.data.data.last_page,
                    total: response.data.data.total,
                    per_page: response.data.data.per_page,
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch proforma invoices',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const uploadProforma = async (data: FormData) => {
        setLoading(true);
        try {
            const response = await uploadProformaInvoice(data);
            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: 'Proforma invoice uploaded successfully',
                });
                fetchProformas();
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to upload proforma',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const approveProforma = async (id: number, status: 'approved' | 'rejected', comments?: string) => {
        setLoading(true);
        try {
            const response = await approveProformaInvoice(id, { status, comments });
            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: `Proforma ${status} successfully`,
                });
                fetchProformas();
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to process proforma approval',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getProformaDetails = async (id: number) => {
        setLoading(true);
        try {
            const response = await getProformaInvoiceById(id);
            if (response.data.success) {
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch proforma details',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        proformas,
        loading,
        pagination,
        fetchProformas,
        uploadProforma,
        approveProforma,
        getProformaDetails,
    };
};
