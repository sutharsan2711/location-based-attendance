import api from '../utils/api';
import { Attendance } from '../types/attendance';

export const attendanceService = {
  getEmployeeHistory: async (employeeId: number): Promise<Attendance[]> => {
    const response = await api.get<Attendance[]>(`/attendance/employee/${employeeId}`);
    return response.data;
  },

  getAllAttendance: async (filters: {
    employeeId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Attendance[]> => {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', String(filters.employeeId));
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<Attendance[]>('/attendance', { params });
    return response.data;
  }
};
