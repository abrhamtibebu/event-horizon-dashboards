import api from './api';
import type {
  Task,
  TaskFilters,
  TaskPayload,
  TasksResponse,
  TaskResponse,
  TaskStatistics,
  TaskStatisticsResponse,
  TaskActivityLog,
  TaskTemplate,
} from '@/types/tasks';

/**
 * Fetch tasks with filters
 */
export const getTasks = async (filters?: TaskFilters): Promise<TasksResponse> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(`${key}[]`, String(v)));
        } else {
          params.append(key, String(value));
        }
      }
    });
  }

  const response = await api.get<TasksResponse>(`/tasks?${params.toString()}`);
  return response.data;
};

/**
 * Fetch a single task by ID
 */
export const getTask = async (id: number): Promise<TaskResponse> => {
  const response = await api.get<TaskResponse>(`/tasks/${id}`);
  return response.data;
};

/**
 * Create a new task
 */
export const createTask = async (data: TaskPayload): Promise<TaskResponse> => {
  const response = await api.post<TaskResponse>('/tasks', data);
  return response.data;
};

/**
 * Update an existing task
 */
export const updateTask = async (id: number, data: Partial<TaskPayload>): Promise<TaskResponse> => {
  const response = await api.put<TaskResponse>(`/tasks/${id}`, data);
  return response.data;
};

/**
 * Delete a task
 */
export const deleteTask = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

/**
 * Get current user's tasks
 */
export const getMyTasks = async (filters?: TaskFilters): Promise<TasksResponse> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(`${key}[]`, String(v)));
        } else {
          params.append(key, String(value));
        }
      }
    });
  }

  const response = await api.get<TasksResponse>(`/tasks/my-tasks?${params.toString()}`);
  return response.data;
};

/**
 * Get tasks by role (future implementation)
 */
export const getTasksByRole = async (role: string, filters?: TaskFilters): Promise<TasksResponse> => {
  // This endpoint may need to be implemented in the backend
  const params = new URLSearchParams();
  params.append('role', role);
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(`${key}[]`, String(v)));
        } else {
          params.append(key, String(value));
        }
      }
    });
  }

  const response = await api.get<TasksResponse>(`/tasks/by-role/${role}?${params.toString()}`);
  return response.data;
};

/**
 * Get task statistics
 */
export const getTaskStatistics = async (filters?: TaskFilters): Promise<TaskStatisticsResponse> => {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.event_id) params.append('event_id', String(filters.event_id));
  }

  const response = await api.get<TaskStatisticsResponse>(`/tasks/statistics?${params.toString()}`);
  return response.data;
};

/**
 * Assign watchers to a task
 */
export const assignWatchers = async (taskId: number, userIds: number[]): Promise<TaskResponse> => {
  const response = await api.post<TaskResponse>(`/tasks/${taskId}/watchers`, {
    user_ids: userIds,
  });
  return response.data;
};

/**
 * Remove a watcher from a task
 */
export const removeWatcher = async (taskId: number, userId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/tasks/${taskId}/watchers/${userId}`);
  return response.data;
};

/**
 * Add a dependency to a task
 */
export const addDependency = async (taskId: number, dependsOnTaskId: number): Promise<{ success: boolean; data: any; message: string }> => {
  const response = await api.post(`/tasks/${taskId}/dependencies`, {
    depends_on_task_id: dependsOnTaskId,
  });
  return response.data;
};

/**
 * Remove a dependency from a task
 */
export const removeDependency = async (taskId: number, dependencyId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
  return response.data;
};

/**
 * Approve a task completion
 */
export const approveTask = async (taskId: number, notes?: string): Promise<TaskResponse> => {
  const response = await api.post<TaskResponse>(`/tasks/${taskId}/approve`, {
    notes,
  });
  return response.data;
};

/**
 * Reject a task completion
 */
export const rejectTask = async (taskId: number, notes?: string): Promise<TaskResponse> => {
  const response = await api.post<TaskResponse>(`/tasks/${taskId}/reject`, {
    notes,
  });
  return response.data;
};

/**
 * Upload proof media for a task
 */
export const uploadProof = async (taskId: number, files: File[]): Promise<{ success: boolean; data: string[]; message: string }> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files[]', file);
  });

  const response = await api.post(`/tasks/${taskId}/proof`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Get activity log for a task
 */
export const getActivityLog = async (taskId: number): Promise<{ success: boolean; data: TaskActivityLog[]; message: string }> => {
  const response = await api.get(`/tasks/${taskId}/activity`);
  return response.data;
};

/**
 * Bulk update tasks
 */
export const bulkUpdate = async (taskIds: number[], updates: Partial<TaskPayload>): Promise<{ success: boolean; data: { updated_count: number }; message: string }> => {
  const response = await api.post('/tasks/bulk-update', {
    task_ids: taskIds,
    updates,
  });
  return response.data;
};

/**
 * Get task templates (future implementation)
 */
export const getTaskTemplates = async (): Promise<{ success: boolean; data: TaskTemplate[]; message: string }> => {
  const response = await api.get('/tasks/templates');
  return response.data;
};

/**
 * Create task from template (future implementation)
 */
export const createFromTemplate = async (templateId: number, data: Partial<TaskPayload>): Promise<TaskResponse> => {
  const response = await api.post<TaskResponse>('/tasks/from-template', {
    template_id: templateId,
    ...data,
  });
  return response.data;
};

/**
 * Mark task as completed
 */
export const completeTask = async (taskId: number): Promise<TaskResponse> => {
  const response = await api.post<TaskResponse>(`/tasks/${taskId}/complete`);
  return response.data;
};

/**
 * Mark task as in progress
 */
export const startTask = async (taskId: number): Promise<TaskResponse> => {
  const response = await api.post<TaskResponse>(`/tasks/${taskId}/start`);
  return response.data;
};

/**
 * Cancel a task
 */
export const cancelTask = async (taskId: number): Promise<TaskResponse> => {
  const response = await api.post<TaskResponse>(`/tasks/${taskId}/cancel`);
  return response.data;
};

