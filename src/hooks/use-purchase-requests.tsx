import { useState, useCallback } from 'react';
import { getPurchaseRequests, createPurchaseRequest, updatePurchaseRequest, deletePurchaseRequest, approvePurchaseRequest, getPurchaseRequestById } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const usePurchaseRequests = () => {
    const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<any>(null);
    const { toast } = useToast();

    const fetchPRs = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await getPurchaseRequests(params);
            if (response.data.success) {
                setPurchaseRequests(response.data.data.data);
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
                description: error.response?.data?.message || 'Failed to fetch purchase requests',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const addPR = async (data: any) => {
        setLoading(true);
        try {
            const response = await createPurchaseRequest(data);
            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: 'Purchase request submitted successfully',
                });
                fetchPRs();
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to submit PR',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updatePR = async (id: number, data: any) => {
        setLoading(true);
        try {
            const response = await updatePurchaseRequest(id, data);
            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: 'Purchase request updated successfully',
                });
                fetchPRs();
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update PR',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const approvePR = async (id: number, status: 'approved' | 'rejected', comments?: string) => {
        setLoading(true);
        try {
            const response = await approvePurchaseRequest(id, { status, comments });
            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: `PR ${status} successfully`,
                });
                fetchPRs();
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to process PR approval',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getPRDetails = async (id: number) => {
        setLoading(true);
        try {
            const response = await getPurchaseRequestById(id);
            if (response.data.success) {
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch PR details',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const deletePR = async (id: number) => {
        setLoading(true);
        try {
            const response = await deletePurchaseRequest(id);
            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: 'Purchase request deleted successfully',
                });
                fetchPRs();
                return true;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete PR',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        purchaseRequests,
        loading,
        pagination,
        fetchPRs,
        addPR,
        updatePR,
        deletePR,
        approvePR,
        getPRDetails,
    };
};
