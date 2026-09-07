import api from '../utils/api';
import { AdminWorkPlanResponse, AdminWorkPlanItem, WorkPlanStatus } from '../types/workPlan';

export const adminWorkPlanService = {
  getAdminWorkPlans: async (filters?: {
    date?: string;
    employeeId?: string;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<AdminWorkPlanResponse> => {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get<AdminWorkPlanResponse>('/admin/work-plans', { params });
    return response.data;
  },

  updateWorkPlanStatus: async (
    id: number,
    status: WorkPlanStatus,
    reasonRemarks?: string
  ): Promise<AdminWorkPlanItem> => {
    const response = await api.patch<AdminWorkPlanItem>(`/admin/work-plans/${id}`, {
      status,
      reasonRemarks,
    });
    return response.data;
  },

  updateWorkPlan: async (
    id: number,
    data: Partial<AdminWorkPlanItem>
  ): Promise<AdminWorkPlanItem> => {
    const response = await api.patch<AdminWorkPlanItem>(`/admin/work-plans/${id}`, data);
    return response.data;
  },

  deleteWorkPlan: async (id: number): Promise<void> => {
    await api.delete(`/admin/work-plans/${id}`);
  },
};
