import { useState, useCallback } from 'react';
import { getPurchaseOrders, createPurchaseOrder, sendPOToVendor, getPurchaseOrderById, getApprovedProformas } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const usePurchaseOrders = () => {
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<any>(null);
    const { toast } = useToast();

    const fetchPOs = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await getPurchaseOrders(params);
            if (response.data.success) {
                setPurchaseOrders(response.data.data.data);
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
                description: error.response?.data?.message || 'Failed to fetch purchase orders',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const addPO = async (data: any) => {
        setLoading(true);
        try {
            const response = await createPurchaseOrder(data);
            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: 'Purchase order created successfully',
                });
                fetchPOs();
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create PO',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const markPOSent = async (id: number) => {
        setLoading(true);
        try {
            const response = await sendPOToVendor(id);
            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: 'PO marked as sent successfully',
                });
                fetchPOs();
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update PO status',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getPODetails = async (id: number) => {
        setLoading(true);
        try {
            const response = await getPurchaseOrderById(id);
            if (response.data.success) {
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch PO details',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchApprovedProformas = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await getApprovedProformas(params);
            if (response.data.success) {
                setApprovedProformas(response.data.data);
            }
        } catch (error: any) {
            console.error("Failed to fetch approved proformas", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const [approvedProformas, setApprovedProformas] = useState<any[]>([]);

    return {
        purchaseOrders,
        approvedProformas,
        loading,
        pagination,
        fetchPOs,
        fetchApprovedProformas,
        addPO,
        markPOSent,
        getPODetails,
    };
};
