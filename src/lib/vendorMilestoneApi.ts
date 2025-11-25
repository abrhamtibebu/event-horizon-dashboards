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

export interface VendorPaymentMilestone {
  id: number;
  contract_id: number;
  milestone_name: string;
  description?: string;
  trigger_event: 'contract_signing' | 'deliverable_completion' | 'date' | 'percentage_completion' | 'manual';
  trigger_date?: string;
  percentage: number;
  amount: number;
  status: 'pending' | 'triggered' | 'approved' | 'paid' | 'cancelled';
  triggered_by?: number;
  triggered_at?: string;
  approved_by?: number;
  approved_at?: string;
  paid_by?: number;
  paid_at?: string;
  notes?: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export const vendorMilestoneApi = {
  // Get milestones for a contract
  async getMilestones(contractId: number): Promise<{ success: boolean; data: VendorPaymentMilestone[] }> {
    const response = await axios.get(`${baseURL}/vendors/contracts/${contractId}/milestones`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Create milestone
  async createMilestone(
    contractId: number,
    data: {
      milestone_name: string;
      description?: string;
      trigger_event: string;
      trigger_date?: string;
      percentage: number;
      amount: number;
      sequence_order?: number;
      notes?: string;
    }
  ): Promise<{ success: boolean; data: VendorPaymentMilestone; message: string }> {
    const response = await axios.post(`${baseURL}/vendors/contracts/${contractId}/milestones`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Bulk create milestones
  async bulkCreateMilestones(
    contractId: number,
    milestones: Array<{
      milestone_name: string;
      description?: string;
      trigger_event: string;
      trigger_date?: string;
      percentage: number;
      amount: number;
    }>
  ): Promise<{ success: boolean; data: VendorPaymentMilestone[]; message: string }> {
    const response = await axios.post(
      `${baseURL}/vendors/contracts/${contractId}/milestones/bulk`,
      { milestones },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  // Update milestone
  async updateMilestone(
    contractId: number,
    milestoneId: number,
    data: Partial<VendorPaymentMilestone>
  ): Promise<{ success: boolean; data: VendorPaymentMilestone; message: string }> {
    const response = await axios.put(
      `${baseURL}/vendors/contracts/${contractId}/milestones/${milestoneId}`,
      data,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  // Delete milestone
  async deleteMilestone(contractId: number, milestoneId: number): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(
      `${baseURL}/vendors/contracts/${contractId}/milestones/${milestoneId}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },
};

export default vendorMilestoneApi;


