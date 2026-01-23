import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Task, TaskFilters, TaskPayload, TaskStatistics, TaskActivityLog } from '@/types/tasks';
import * as taskApi from '@/lib/taskApi';

/**
 * Hook to fetch and manage tasks list
 */
export const useTasks = (filters?: TaskFilters) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskApi.getTasks(filters),
    staleTime: 30000, // 30 seconds
  });

  const tasks = data?.data?.data || [];
  const pagination = data?.data ? {
    current_page: data.data.current_page,
    last_page: data.data.last_page,
    per_page: data.data.per_page,
    total: data.data.total,
  } : null;

  const createTaskMutation = useMutation({
    mutationFn: (payload: TaskPayload) => taskApi.createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TaskPayload> }) =>
      taskApi.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => taskApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ taskIds, updates }: { taskIds: number[]; updates: Partial<TaskPayload> }) =>
      taskApi.bulkUpdate(taskIds, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasks,
    pagination,
    isLoading,
    isFetching,
    error,
    refetch,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    bulkUpdate: bulkUpdateMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
  };
};

/**
 * Hook to fetch and manage a single task
 */
export const useTask = (id: number | null) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskApi.getTask(id!),
    enabled: !!id,
    staleTime: 30000,
  });

  const task = data?.data;

  const updateTaskMutation = useMutation({
    mutationFn: (data: Partial<TaskPayload>) => taskApi.updateTask(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: () => taskApi.completeTask(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const startTaskMutation = useMutation({
    mutationFn: () => taskApi.startTask(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const cancelTaskMutation = useMutation({
    mutationFn: () => taskApi.cancelTask(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const approveTaskMutation = useMutation({
    mutationFn: (notes?: string) => taskApi.approveTask(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const rejectTaskMutation = useMutation({
    mutationFn: (notes?: string) => taskApi.rejectTask(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: (files: File[]) => taskApi.uploadProof(id!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    },
  });

  const assignWatchersMutation = useMutation({
    mutationFn: (userIds: number[]) => taskApi.assignWatchers(id!, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    },
  });

  const addDependencyMutation = useMutation({
    mutationFn: (dependsOnTaskId: number) => taskApi.addDependency(id!, dependsOnTaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    task,
    isLoading,
    error,
    refetch,
    updateTask: updateTaskMutation.mutateAsync,
    completeTask: completeTaskMutation.mutateAsync,
    startTask: startTaskMutation.mutateAsync,
    cancelTask: cancelTaskMutation.mutateAsync,
    approveTask: approveTaskMutation.mutateAsync,
    rejectTask: rejectTaskMutation.mutateAsync,
    uploadProof: uploadProofMutation.mutateAsync,
    assignWatchers: assignWatchersMutation.mutateAsync,
    addDependency: addDependencyMutation.mutateAsync,
    isUpdating: updateTaskMutation.isPending,
    isCompleting: completeTaskMutation.isPending,
    isStarting: startTaskMutation.isPending,
    isCancelling: cancelTaskMutation.isPending,
    isApproving: approveTaskMutation.isPending,
    isRejecting: rejectTaskMutation.isPending,
    isUploadingProof: uploadProofMutation.isPending,
    isAssigningWatchers: assignWatchersMutation.isPending,
    isAddingDependency: addDependencyMutation.isPending,
  };
};

/**
 * Hook to fetch task statistics
 */
export const useTaskStatistics = (filters?: TaskFilters) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['task-statistics', filters || {}],
    queryFn: () => taskApi.getTaskStatistics(filters),
    staleTime: 60000, // 1 minute
  });

  return {
    statistics: data?.data as TaskStatistics | undefined,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to fetch current user's tasks
 */
export const useMyTasks = (filters?: TaskFilters) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-tasks', filters],
    queryFn: () => taskApi.getMyTasks(filters),
    staleTime: 30000,
  });

  const tasks = data?.data?.data || [];
  const pagination = data?.data ? {
    current_page: data.data.current_page,
    last_page: data.data.last_page,
    per_page: data.data.per_page,
    total: data.data.total,
  } : null;

  return {
    tasks,
    pagination,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to fetch task activity log
 */
export const useTaskActivity = (taskId: number | null) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['task-activity', taskId],
    queryFn: () => taskApi.getActivityLog(taskId!),
    enabled: !!taskId,
    staleTime: 30000,
  });

  return {
    activityLog: (data?.data || []) as TaskActivityLog[],
    isLoading,
    error,
    refetch,
  };
};

