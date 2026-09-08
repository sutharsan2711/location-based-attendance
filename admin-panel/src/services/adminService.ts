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
  getStats: async (startDate?: string, endDate?: string): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    if (startDate && endDate) {
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    } else if (startDate) {
      params.append('date', startDate);
    }
    const response = await api.get('/admin/dashboard', { params });
    return response.data;
  },

  getSummaryCharts: async (startDate?: string, endDate?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (startDate && endDate) {
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    } else if (startDate) {
      params.append('date', startDate);
    }
    const response = await api.get<any[]>('/admin/attendance-summary', { params });
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

    try {
      const response = await api.get<MonthlyAttendanceData>('/admin/attendance-monthly', { params });
      if (response.data && Array.isArray(response.data.employees)) {
        response.data.employees = response.data.employees.filter(
          (e: any) =>
            !['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'].includes(e.employeeName)
        );
      }
      return response.data;
    } catch (err) {
      console.error('Failed to get monthly attendance', err);
      throw err;
    }
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
  },

  getEmployeesKpi: async (year?: number, month?: number): Promise<any> => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    const response = await api.get('/admin/kpi/employees', { params });
    return response.data;
  },

  getEmployeeKpiDetail: async (id: number, year?: number, month?: number): Promise<any> => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    const response = await api.get(`/admin/kpi/employee/${id}`, { params });
    return response.data;
  },
};


