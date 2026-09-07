import api from '../utils/api';
import {
  DailyWorkPlanItem,
  DailyWorkNoteData,
  TodayDashboardResponse,
  WorkPlanPriority,
  WorkPlanStatus,
} from '../types/workPlan';

export interface MonthlyKpiResponse {
  year: number;
  month: number;
  employee: {
    id: number;
    name: string;
    email: string;
    employeeCode: string;
    department?: string;
  };
  summary: {
    averageKpiScore: number;
    monthlyLabel: string;
    totalMonthlyTasks: number;
    totalCompletedTasks: number;
    totalInProgressTasks: number;
    totalNotCompletedTasks: number;
    completionRate: number;
    activeWorkDays: number;
    presentDays: number;
    onTimeDays: number;
  };
  dailyBreakdown: Array<{
    date: string;
    plans: DailyWorkPlanItem[];
    note: DailyWorkNoteData | null;
    attendance: {
      id: number;
      status: string;
      timingStatus: string;
      loginTime?: string;
      logoutTime?: string;
    } | null;
    kpiScore: number;
    kpiLabel: string;
    totalTasks: number;
    completedCount: number;
    inProgressCount: number;
    notCompletedCount: number;
  }>;
}

export const workPlanService = {
  getTodayDashboard: async (date?: string): Promise<TodayDashboardResponse> => {
    const params = date ? { date } : {};
    const res = await api.get<TodayDashboardResponse>('/work-plans/today', { params });
    return res.data;
  },

  createPlan: async (data: {
    taskName: string;
    category?: string;
    priority?: WorkPlanPriority;
    targetDescription?: string;
    remarks?: string;
    planDate?: string;
  }): Promise<DailyWorkPlanItem> => {
    const res = await api.post<DailyWorkPlanItem>('/work-plans', data);
    return res.data;
  },

  updatePlan: async (
    id: number,
    data: {
      taskName?: string;
      category?: string;
      priority?: WorkPlanPriority;
      targetDescription?: string;
      remarks?: string;
    }
  ): Promise<DailyWorkPlanItem> => {
    const res = await api.put<DailyWorkPlanItem>(`/work-plans/${id}`, data);
    return res.data;
  },

  updateStatus: async (
    id: number,
    data: {
      status: WorkPlanStatus;
      reasonRemarks?: string;
      timeSpent?: string;
    }
  ): Promise<DailyWorkPlanItem> => {
    const res = await api.patch<DailyWorkPlanItem>(`/work-plans/${id}/status`, data);
    return res.data;
  },

  bulkUpdateStatus: async (
    updates: {
      id: number;
      status: WorkPlanStatus;
      reasonRemarks?: string;
      timeSpent?: string;
    }[]
  ): Promise<{ success: boolean; plans: DailyWorkPlanItem[] }> => {
    const res = await api.post<{ success: boolean; plans: DailyWorkPlanItem[] }>(
      '/work-plans/bulk-status',
      { updates }
    );
    return res.data;
  },

  deletePlan: async (id: number): Promise<{ success: boolean }> => {
    const res = await api.delete<{ success: boolean }>(`/work-plans/${id}`);
    return res.data;
  },

  getNote: async (date?: string): Promise<DailyWorkNoteData> => {
    const params = date ? { date } : {};
    const res = await api.get<DailyWorkNoteData>('/work-plans/notes', { params });
    return res.data;
  },

  saveNote: async (data: { notes: string; noteDate?: string; kpiScore?: number }): Promise<DailyWorkNoteData> => {
    const res = await api.post<DailyWorkNoteData>('/work-plans/notes', data);
    return res.data;
  },

  getMonthlyKpi: async (year?: number, month?: number): Promise<MonthlyKpiResponse> => {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const res = await api.get<MonthlyKpiResponse>('/work-plans/monthly', { params });
    return res.data;
  },

  getAdminEmployeesKpi: async (year?: number, month?: number) => {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const res = await api.get('/admin/kpi/employees', { params });
    return res.data;
  },

  getAdminEmployeeKpiDetail: async (id: number, year?: number, month?: number): Promise<MonthlyKpiResponse> => {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const res = await api.get<MonthlyKpiResponse>(`/admin/kpi/employee/${id}`, { params });
    return res.data;
  },
};
