import { api } from './api';

export interface Task {
  id: number;
  event_id?: number | null;
  organizer_id: number;
  vendor_id?: number;
  quotation_id?: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'deliverable' | 'milestone' | 'review' | 'payment' | 'other';
  task_category?: 'vendor_recruitment' | 'sponsor_followup' | 'sponsor_listing' | 'event_setup' | 'post_event' | 'other' | null;
  due_date?: string;
  completed_date?: string;
  notes?: string;
  attachments?: string[];
  assigned_to?: number;
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Relations
  event?: {
    id: number;
    title: string;
    event_date: string;
  };
  organizer?: {
    id: number;
    name: string;
  };
  vendor?: {
    id: number;
    name: string;
    contact_email: string;
  };
  quotation?: {
    id: number;
    quotation_number: string;
    amount: number;
    status: string;
  };
  assignedUser?: {
    id: number;
    name: string;
    email: string;
  };
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  updater?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TaskFormData {
  event_id?: number | null;
  organizer_id?: number;
  vendor_id?: number;
  quotation_id?: number;
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  type?: 'deliverable' | 'milestone' | 'review' | 'payment' | 'other';
  task_category?: 'vendor_recruitment' | 'sponsor_followup' | 'sponsor_listing' | 'event_setup' | 'post_event' | 'other' | null;
  due_date?: string;
  completed_date?: string;
  notes?: string;
  attachments?: string[];
  assigned_to?: number;
}

export interface TaskStatistics {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  due_soon: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  by_type: {
    deliverable: number;
    milestone: number;
    review: number;
    payment: number;
    other: number;
  };
  by_category?: {
    vendor_recruitment: number;
    sponsor_followup: number;
    sponsor_listing: number;
    event_setup: number;
    post_event: number;
    other: number;
  };
  operational_tasks?: number;
  event_tasks?: number;
}

export interface TaskFilters {
  event_id?: number;
  vendor_id?: number;
  status?: string;
  priority?: string;
  type?: string;
  task_category?: string;
  operational?: boolean;
  assigned_to?: number;
  overdue?: boolean;
  due_soon?: boolean;
  due_soon_days?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

class TaskApiService {
  private baseUrl = '/tasks';

  // Set a test token for development (remove in production)
  setTestToken(): void {
    localStorage.setItem('jwt', 'test-jwt-token-for-development');
    localStorage.setItem('user_role', 'organizer');
    localStorage.setItem('user_id', '6'); // Test Organizer user ID
    localStorage.setItem('organizer_id', '1');
  }

  async getTasks(filters: TaskFilters = {}): Promise<{ data: Task[]; meta: any }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    try {
      const response = await api.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.warn('Task API unavailable, using offline data:', error);
      return this.getTasksOffline(filters);
    }
  }

  async getTask(id: number): Promise<Task> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  async createTask(taskData: TaskFormData): Promise<Task> {
    const response = await api.post(this.baseUrl, taskData);
    return response.data.data;
  }

  async updateTask(id: number, taskData: Partial<TaskFormData>): Promise<Task> {
    const response = await api.put(`${this.baseUrl}/${id}`, taskData);
    return response.data.data;
  }

  async deleteTask(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async completeTask(id: number): Promise<Task> {
    const response = await api.post(`${this.baseUrl}/${id}/complete`);
    return response.data.data;
  }

  async startTask(id: number): Promise<Task> {
    const response = await api.post(`${this.baseUrl}/${id}/start`);
    return response.data.data;
  }

  async cancelTask(id: number): Promise<Task> {
    const response = await api.post(`${this.baseUrl}/${id}/cancel`);
    return response.data.data;
  }

  async getTaskStatistics(filters: { event_id?: number } = {}): Promise<TaskStatistics> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseUrl}/statistics?${params.toString()}`);
    return response.data.data;
  }

  // Mock data for offline functionality
  private mockTasks: Task[] = [
    {
      id: 1,
      event_id: 1,
      organizer_id: 1,
      vendor_id: 17,
      quotation_id: 1,
      title: 'Setup catering equipment',
      description: 'Set up all catering equipment and tables for the event',
      status: 'pending',
      priority: 'high',
      type: 'deliverable',
      due_date: '2025-01-20',
      notes: 'Ensure all equipment is tested before event',
      assigned_to: 1,
      created_by: 1,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
      event: {
        id: 1,
        title: 'Corporate Annual Meeting',
        event_date: '2025-01-20T09:00:00Z'
      },
      vendor: {
        id: 17,
        name: 'Test Vendor 1',
        contact_email: 'vendor1@example.com'
      },
      quotation: {
        id: 1,
        quotation_number: 'QUO-2025-000001',
        amount: 45000,
        status: 'approved'
      },
      creator: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      }
    },
    {
      id: 2,
      event_id: 1,
      organizer_id: 1,
      vendor_id: 18,
      title: 'Photography setup',
      description: 'Set up photography equipment and lighting',
      status: 'in_progress',
      priority: 'medium',
      type: 'deliverable',
      due_date: '2025-01-19',
      notes: 'Test all camera equipment',
      assigned_to: 2,
      created_by: 1,
      created_at: '2025-01-15T11:00:00Z',
      updated_at: '2025-01-16T14:30:00Z',
      event: {
        id: 1,
        title: 'Corporate Annual Meeting',
        event_date: '2025-01-20T09:00:00Z'
      },
      vendor: {
        id: 18,
        name: 'Test Vendor 2',
        contact_email: 'vendor2@example.com'
      },
      creator: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      }
    },
    {
      id: 3,
      event_id: 1,
      organizer_id: 1,
      title: 'Final event review',
      description: 'Conduct final review of all event preparations',
      status: 'completed',
      priority: 'urgent',
      type: 'review',
      due_date: '2025-01-18',
      completed_date: '2025-01-18',
      notes: 'All preparations completed successfully',
      assigned_to: 1,
      created_by: 1,
      created_at: '2025-01-15T12:00:00Z',
      updated_at: '2025-01-18T16:00:00Z',
      event: {
        id: 1,
        title: 'Corporate Annual Meeting',
        event_date: '2025-01-20T09:00:00Z'
      },
      creator: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      }
    }
  ];

  private mockStatistics: TaskStatistics = {
    total: 3,
    pending: 1,
    in_progress: 1,
    completed: 1,
    cancelled: 0,
    overdue: 0,
    due_soon: 2,
    by_priority: {
      low: 0,
      medium: 1,
      high: 1,
      urgent: 1
    },
    by_type: {
      deliverable: 2,
      milestone: 0,
      review: 1,
      payment: 0,
      other: 0
    }
  };

  // Fallback methods for offline functionality
  async getTasksOffline(filters: TaskFilters = {}): Promise<{ data: Task[]; meta: any }> {
    let filteredTasks = [...this.mockTasks];

    // Apply filters
    if (filters.event_id) {
      filteredTasks = filteredTasks.filter(task => task.event_id === filters.event_id);
    }
    if (filters.vendor_id) {
      filteredTasks = filteredTasks.filter(task => task.vendor_id === filters.vendor_id);
    }
    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }
    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }
    if (filters.type) {
      filteredTasks = filteredTasks.filter(task => task.type === filters.type);
    }
    if (filters.assigned_to) {
      filteredTasks = filteredTasks.filter(task => task.assigned_to === filters.assigned_to);
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    filteredTasks.sort((a, b) => {
      const aValue = a[sortBy as keyof Task];
      const bValue = b[sortBy as keyof Task];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return {
      data: filteredTasks,
      meta: {
        total: filteredTasks.length,
        per_page: filters.per_page || 15,
        current_page: filters.page || 1,
        last_page: Math.ceil(filteredTasks.length / (filters.per_page || 15))
      }
    };
  }

  async getTaskOffline(id: number): Promise<Task> {
    const task = this.mockTasks.find(t => t.id === id);
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }

  async getTaskStatisticsOffline(filters: { event_id?: number } = {}): Promise<TaskStatistics> {
    return this.mockStatistics;
  }
}

export const taskApi = new TaskApiService();
