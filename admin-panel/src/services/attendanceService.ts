import api from '../utils/api';
import { Attendance } from '../types/attendance';

export const attendanceService = {
  getEmployeeHistory: async (employeeId: number): Promise<Attendance[]> => {
    try {
      const response = await api.get<Attendance[]>(`/attendance/employee/${employeeId}`);
      if (response.data && Array.isArray(response.data)) {
        return response.data.filter(a => !['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005'].includes(a.employee?.employeeCode));
      }
      return [];
    } catch {
      return [];
    }
  },

  getAllAttendance: async (filters: {
    employeeId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Attendance[]> => {
    try {
      const params = new URLSearchParams();
      if (filters.employeeId) params.append('employeeId', String(filters.employeeId));
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get<Attendance[]>('/attendance', { params });
      if (response.data && Array.isArray(response.data)) {
        return response.data.filter(a => !['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005'].includes(a.employee?.employeeCode));
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch attendance logs', err);
      return [];
    }
  }
};
