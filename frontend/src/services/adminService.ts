import api from '../utils/api';

export const adminService = {
  getStats: async (): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    todayLogin: number;
    todayLogout: number;
    currentlyWorking: number;
    absent: number;
  }> => {
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
