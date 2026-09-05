import api from '../utils/api';
import { Task, TaskStats, TaskStatus, TaskStatusUpdateRequest } from '../types/task';

export const taskService = {
  getMyTasks: async (filters?: { status?: string; priority?: string }): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);

    const response = await api.get<Task[]>('/tasks/my', { params });
    return response.data;
  },

  updateStatus: async (id: number, request: TaskStatusUpdateRequest): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${id}/status`, request);
    return response.data;
  },

  getStats: async (): Promise<TaskStats> => {
    const response = await api.get<TaskStats>('/tasks/stats');
    return response.data;
  }
};
