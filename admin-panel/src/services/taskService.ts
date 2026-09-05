import api from '../utils/api';
import { Task, TaskRequest, TaskStats, TaskStatus } from '../types/task';

export const taskService = {
  getAllTasks: async (filters?: { status?: string; priority?: string; employeeId?: number }): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.employeeId) params.append('employeeId', String(filters.employeeId));

    const response = await api.get<Task[]>('/tasks', { params });
    return response.data;
  },

  getTaskById: async (id: number): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (task: TaskRequest): Promise<Task> => {
    const response = await api.post<Task>('/tasks', task);
    return response.data;
  },

  updateTask: async (id: number, task: TaskRequest): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${id}`, task);
    return response.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  updateTaskStatus: async (id: number, status: TaskStatus, completionNotes?: string): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${id}/status`, { status, completionNotes });
    return response.data;
  },

  getStats: async (): Promise<TaskStats> => {
    const response = await api.get<TaskStats>('/tasks/stats');
    return response.data;
  }
};
