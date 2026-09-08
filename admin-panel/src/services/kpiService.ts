import api from '../utils/api';
import { KpiDashboardResponse, ComprehensiveKpiReport } from '../types/kpi';

export const kpiService = {
  /**
   * Get aggregate KPI Dashboard overview & all employees summary
   */
  getDashboardData: async (params?: {
    year?: number;
    month?: number;
    department?: string;
  }): Promise<KpiDashboardResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.year) searchParams.append('year', params.year.toString());
    if (params?.month) searchParams.append('month', params.month.toString());
    if (params?.department && params.department !== 'ALL') {
      searchParams.append('department', params.department);
    }

    const response = await api.get<KpiDashboardResponse>('/admin/kpi/dashboard', {
      params: searchParams,
    });
    return response.data;
  },

  /**
   * Get detailed 5-condition KPI Report for a specific employee
   */
  getEmployeeKpiReport: async (
    employeeId: number,
    params?: { year?: number; month?: number }
  ): Promise<ComprehensiveKpiReport> => {
    const searchParams = new URLSearchParams();
    if (params?.year) searchParams.append('year', params.year.toString());
    if (params?.month) searchParams.append('month', params.month.toString());

    const response = await api.get<ComprehensiveKpiReport>(
      `/admin/kpi/employee/${employeeId}`,
      { params: searchParams }
    );
    return response.data;
  },
};
