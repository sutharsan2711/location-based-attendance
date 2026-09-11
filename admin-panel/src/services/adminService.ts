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
  wfhToday?: number;
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

  getDashboardStatsRange: async (startDate?: string, endDate?: string): Promise<DashboardStats> => {
    return adminService.getStats(startDate, endDate);
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

  getAttendanceTrends: async (startDate?: string, endDate?: string): Promise<any[]> => {
    return adminService.getSummaryCharts(startDate, endDate);
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

  updateMonthlyAttendanceDay: async (data: {
    employeeId: number;
    date: string;
    code: string;
    loginTime?: string;
    logoutTime?: string;
  }): Promise<any> => {
    const response = await api.post('/admin/attendance-monthly', data);
    return response.data;
  },

  updateMonthlyAttendanceBatch: async (data: {
    employeeId: number;
    year: number;
    month: number;
    days: Record<number, { code: string; loginTime?: string; logoutTime?: string }>;
  }): Promise<any> => {
    const response = await api.post('/admin/attendance-monthly', data);
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

  getMonthlyAttendanceReport: async (year?: number, month?: number): Promise<any> => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    const response = await api.get('/admin/attendance/monthly-report', { params });
    return response.data;
  },

  getCalendarSummary: async (year?: number, month?: number, department?: string): Promise<CalendarSummaryResponse> => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    if (department && department !== 'ALL') params.append('department', department);
    const response = await api.get('/admin/calendar/summary', { params });
    return response.data;
  },
};

export interface CalendarEmployeePresent {
  id: number;
  name: string;
  employeeCode: string;
  department: string;
  loginTime: string | null;
  logoutTime: string | null;
  status: string;
  timingStatus: string;
  workMode?: string;
}

export interface CalendarEmployeeLeave {
  id: number;
  name: string;
  employeeCode: string;
  department: string;
  leaveType: string;
  reason: string;
  isHalfDay?: boolean;
  halfDaySession?: string | null;
}

export interface CalendarEmployeeWfh {
  id: number;
  name: string;
  employeeCode: string;
  department: string;
  reason: string;
}

export interface CalendarEmployeeLate {
  id: number;
  name: string;
  employeeCode: string;
  department: string;
  loginTime: string | null;
  timingStatus: string;
}

export interface CalendarEmployeePermission {
  id: number;
  name: string;
  employeeCode: string;
  department: string;
  fromTime: string | null;
  toTime: string | null;
  reason: string;
}

export interface CalendarEmployeeAbsent {
  id: number;
  name: string;
  employeeCode: string;
  department: string;
}

export interface CalendarDayData {
  date: string;
  day: number;
  dayOfWeek: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  holidayType: string | null;
  totalEmployees: number;
  presentCount: number;
  leaveCount: number;
  wfhCount: number;
  lateCount: number;
  permissionCount: number;
  absentCount: number;
  presentEmployees: CalendarEmployeePresent[];
  leaveEmployees: CalendarEmployeeLeave[];
  wfhEmployees: CalendarEmployeeWfh[];
  lateEmployees: CalendarEmployeeLate[];
  permissionEmployees: CalendarEmployeePermission[];
  absentEmployees: CalendarEmployeeAbsent[];
  // Compatibility aliases
  presents?: number;
  leaves?: number;
  wfh?: number;
  permissions?: number;
  late?: number;
  details?: {
    presentsList?: any[];
    leavesList?: any[];
    wfhList?: any[];
    permissionsList?: any[];
    lateList?: any[];
  };
}

export interface CalendarSummaryResponse {
  year: number;
  month: number;
  department: string;
  totalEmployees: number;
  departments: string[];
  metrics: {
    totalPresentSum: number;
    totalLeavesSum: number;
    totalWfhSum: number;
    totalLateSum: number;
    totalPermissionsSum: number;
    daysInMonth: number;
  };
  dailySummaries: Record<string, CalendarDayData>;
  days: CalendarDayData[];
}

// Backward compatibility
export type CalendarSummaryDay = CalendarDayData;



