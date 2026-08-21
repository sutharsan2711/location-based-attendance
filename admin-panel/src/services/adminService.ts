import api from '../utils/api';
import { MonthlyAttendanceData } from '../types/attendance';

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  todayLogin: number;
  todayLogout: number;
  currentlyWorking: number;
  lateToday: number;
  onLeaveToday: number;
  pendingPermissionRequests: number;
  pendingLeaveRequests: number;
  absent: number;
}

export const adminService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getSummaryCharts: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/admin/attendance-summary');
    return response.data;
  },

  getReport: async (filters: {
    employeeId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', String(filters.employeeId));
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<any[]>('/admin/attendance-report', { params });
    return response.data;
  },

  getMonthlyAttendance: async (filters?: {
    year?: number;
    month?: number;
    employeeId?: number;
  }): Promise<MonthlyAttendanceData> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', String(filters.year));
    if (filters?.month) params.append('month', String(filters.month));
    if (filters?.employeeId) params.append('employeeId', String(filters.employeeId));

    const response = await api.get<MonthlyAttendanceData>('/admin/attendance-monthly', { params });
    return response.data;
  },

  exportCsv: async (filters: {
    employeeId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', String(filters.employeeId));
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get('/admin/attendance-report/csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
};

