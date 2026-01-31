import axios from 'axios';

import { getApiBaseURL } from '@/config/env';
const baseURL = getApiBaseURL();

const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export interface VendorContract {
  id: number;
  vendor_id: number;
  quotation_id: number;
  requirement_id?: number;
  event_id: number;
  contract_number: string;
  po_number?: string;
  signed_date?: string;
  start_date?: string;
  end_date?: string;
  total_amount: number;
  currency: string;
  terms_conditions?: string;
  contract_file_path?: string;
  po_file_path?: string;
  status: 'draft' | 'pending_signature' | 'signed' | 'active' | 'completed' | 'terminated' | 'cancelled';
  signed_by_vendor?: number;
  signed_by_organizer?: number;
  created_at: string;
  updated_at: string;
  vendor?: any;
  quotation?: any;
  requirement?: any;
  event?: any;
  milestones?: any[];
  deliverables?: any[];
  reviews?: any[];
}

export const vendorContractApi = {
  // Get all contracts
  async getContracts(params?: {
    vendor_id?: number;
    event_id?: number;
    status?: string;
    search?: string;
    per_page?: number;
  }): Promise<{ success: boolean; data: any }> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await axios.get(`${baseURL}/vendors/contracts${queryString ? `?${queryString}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get single contract
  async getContract(id: number): Promise<{ success: boolean; data: VendorContract }> {
    const response = await axios.get(`${baseURL}/vendors/contracts/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Create contract (accepts FormData for file uploads)
  async createContract(data: FormData | {
    vendor_id: number;
    quotation_id: number;
    event_id: number;
    requirement_id?: number;
    total_amount: number;
    currency?: string;
    start_date?: string;
    end_date?: string;
    terms_conditions?: string;
    contract_file?: File;
    deliverables?: any[];
  }): Promise<{ success: boolean; data: VendorContract; message: string }> {
    const headers = getAuthHeaders();
    // Remove Content-Type header for FormData (browser will set it with boundary)
    if (data instanceof FormData) {
      delete headers['Content-Type'];
    }
    
    const response = await axios.post(`${baseURL}/vendors/contracts`, data, {
      headers: headers,
    });
    return response.data;
  },

  // Update contract
  async updateContract(
    id: number,
    data: Partial<VendorContract>
  ): Promise<{ success: boolean; data: VendorContract; message: string }> {
    const response = await axios.put(`${baseURL}/vendors/contracts/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Delete contract
  async deleteContract(id: number): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${baseURL}/vendors/contracts/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Add PO (manual PO number and file upload)
  async addPO(id: number, data: FormData | { po_number: string; po_file?: File }): Promise<{ success: boolean; data: VendorContract; message: string }> {
    const headers = getAuthHeaders();
    // Remove Content-Type header for FormData (browser will set it with boundary)
    if (data instanceof FormData) {
      delete headers['Content-Type'];
    }
    
    const response = await axios.post(`${baseURL}/vendors/contracts/${id}/add-po`, data, {
      headers: headers,
    });
    return response.data;
  },
};

export default vendorContractApi;


