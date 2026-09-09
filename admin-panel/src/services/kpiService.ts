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

  /**
   * Export Monthly KPI Report for all employees
   */
  exportMonthlyKpiReport: async (year?: number, month?: number, department?: string): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (year) searchParams.append('year', year.toString());
    if (month) searchParams.append('month', month.toString());
    if (department && department !== 'ALL') searchParams.append('department', department);

    const response = await api.get('/admin/kpi/export', { params: searchParams });
    const data = response.data;
    if (data?.records) {
      const headers = [
        'Employee Code',
        'Employee Name',
        'Department',
        'Designation',
        'Planned Tasks',
        'Unplanned Tasks',
        'Completed',
        'Completion %',
        'Punctuality %',
        'WFH Days',
        'KPI Score',
        'Rating',
      ];
      const rows = data.records.map((r: any) => [
        r.employeeCode,
        r.name,
        r.department,
        r.designation,
        r.plannedTasksCount,
        r.unplannedTasksCount,
        r.completedTasksCount,
        `${r.completionRate}%`,
        `${r.punctualityRate}%`,
        r.wfhDays,
        r.kpiScore,
        r.rating,
      ]);
      const csv =
        '\uFEFF' +
        [
          headers.join(','),
          ...rows.map((row: any[]) =>
            row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
          ),
        ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `kpi_report_${year || new Date().getFullYear()}_${month || new Date().getMonth() + 1}.csv`;
      link.click();
    }
    return data;
  },
};
