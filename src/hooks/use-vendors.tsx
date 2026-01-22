import { useState, useCallback } from 'react';
import vendorApi from '@/lib/vendorApi';
import { useToast } from '@/hooks/use-toast';

export const useVendors = () => {
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<any>(null);
    const { toast } = useToast();

    const fetchVendors = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await vendorApi.getVendors(params);

            if (response && response.is_paginated) {
                setVendors(response.data);
                setPagination({
                    current_page: response.current_page,
                    last_page: response.last_page,
                    total: response.total,
                    per_page: response.per_page,
                });
            } else {
                setVendors(response);
                setPagination({
                    current_page: (params as any).page || 1,
                    last_page: 1,
                    total: response.length,
                    per_page: response.length,
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch vendors',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const addVendor = async (data: any) => {
        setLoading(true);
        try {
            const result = await vendorApi.createVendor(data);
            toast({
                title: 'Success',
                description: 'Vendor created successfully',
            });
            fetchVendors();
            return result;
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create vendor',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const editVendor = async (id: number, data: any) => {
        setLoading(true);
        try {
            const result = await vendorApi.updateVendor(id, data);
            toast({
                title: 'Success',
                description: 'Vendor updated successfully',
            });
            fetchVendors();
            return result;
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update vendor',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const removeVendor = async (id: number) => {
        setLoading(true);
        try {
            await vendorApi.deleteVendor(id);
            toast({
                title: 'Success',
                description: 'Vendor deleted successfully',
            });
            fetchVendors();
            return true;
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete vendor',
                variant: 'destructive',
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        vendors,
        loading,
        pagination,
        fetchVendors,
        addVendor,
        editVendor,
        removeVendor,
    };
};
