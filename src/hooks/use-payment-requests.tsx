import { useState, useCallback } from 'react';
import { getPaymentRequests, createPaymentRequest, approvePaymentRequest, getPaymentRequestById, getVendorPaymentsRevamped, processVendorPayment, processPaymentRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const usePaymentRequests = () => {
    const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
    const [vendorPayments, setVendorPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<any>(null);
    const { toast } = useToast();

    const fetchPaymentRequests = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await getPaymentRequests(params);
            if (response.data.success) {
                setPaymentRequests(response.data.data.data);
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
                description: error.response?.data?.message || 'Failed to fetch payment requests',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const fetchVendorPayments = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await getVendorPaymentsRevamped(params);
            if (response.data.success) {
                setVendorPayments(response.data.data.data);
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch vendor payments',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const addPaymentRequest = async (data: any) => {
        setLoading(true);
        try {
            const response = await createPaymentRequest(data);
            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: 'Payment request submitted successfully',
                });
                fetchPaymentRequests();
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to submit payment request',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const approvePaymentReq = async (id: number, status: 'approved' | 'rejected', comments?: string) => {
        setLoading(true);
        try {
            const response = await approvePaymentRequest(id, { status, comments });
            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: `Payment request ${status} successfully`,
                });
                fetchPaymentRequests();
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to process payment request approval',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const processPayment = async (id: number, data: any) => {
        setLoading(true);
        try {
            const response = await processPaymentRequest(id, data);
            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: 'Payment processed successfully',
                });
                fetchPaymentRequests();
                return response.data.data;
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to process payment',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        paymentRequests,
        vendorPayments,
        loading,
        pagination,
        fetchPaymentRequests,
        fetchVendorPayments,
        addPaymentRequest,
        approvePaymentReq,
        processPayment,
    };
};
