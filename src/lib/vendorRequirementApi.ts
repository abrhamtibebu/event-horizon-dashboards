import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export interface VendorRequirement {
  id: number;
  event_id: number;
  title: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  deadline: string;
  status: 'draft' | 'active' | 'closed' | 'cancelled';
  service_categories?: string[];
  special_requirements?: string;
  created_at: string;
  updated_at: string;
  event?: any;
  creator?: any;
  rfq_invites?: any[];
  quotations?: any[];
  contracts?: any[];
}

export const vendorRequirementApi = {
  // Get all requirements
  async getRequirements(params?: {
    event_id?: number;
    status?: string;
    search?: string;
    per_page?: number;
  }): Promise<{ success: boolean; data: any }> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await axios.get(`${baseURL}/vendors/requirements${queryString ? `?${queryString}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get single requirement
  async getRequirement(id: number): Promise<{ success: boolean; data: VendorRequirement }> {
    const response = await axios.get(`${baseURL}/vendors/requirements/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Create requirement
  async createRequirement(data: {
    event_id: number;
    title: string;
    description: string;
    budget_min?: number;
    budget_max?: number;
    deadline: string;
    service_categories?: string[];
    special_requirements?: string;
    status?: string;
  }): Promise<{ success: boolean; data: VendorRequirement; message: string }> {
    const response = await axios.post(`${baseURL}/vendors/requirements`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update requirement
  async updateRequirement(
    id: number,
    data: Partial<VendorRequirement>
  ): Promise<{ success: boolean; data: VendorRequirement; message: string }> {
    const response = await axios.put(`${baseURL}/vendors/requirements/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Delete requirement
  async deleteRequirement(id: number): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${baseURL}/vendors/requirements/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Invite vendors to requirement
  async inviteVendors(
    requirementId: number,
    vendorIds: number[]
  ): Promise<{ success: boolean; data: any[]; message: string }> {
    const response = await axios.post(
      `${baseURL}/vendors/requirements/${requirementId}/invite-vendors`,
      { vendor_ids: vendorIds },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  // Send RFQ email to vendors
  async sendRfqEmail(
    requirementId: number,
    vendorIds: number[]
  ): Promise<{ success: boolean; data: { sent_count: number; failed_count: number }; message: string }> {
    const response = await axios.post(
      `${baseURL}/vendors/requirements/${requirementId}/send-email`,
      { vendor_ids: vendorIds },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  // Download RFQ document (PDF or Word)
  async downloadRfqDocument(
    requirementId: number,
    format: 'pdf' | 'word'
  ): Promise<{ success: boolean; data: { url: string; path: string }; message: string }> {
    const response = await axios.get(
      `${baseURL}/vendors/requirements/${requirementId}/download/${format}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },
};

export default vendorRequirementApi;


