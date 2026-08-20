import api from '../utils/api';
import { Attendance, AttendanceRequest, AttendanceResponse } from '../types/attendance';

export const attendanceService = {
  loginAttendance: async (request: AttendanceRequest): Promise<AttendanceResponse> => {
    const response = await api.post<AttendanceResponse>('/attendance/login', request);
    return response.data;
  },

  logoutAttendance: async (request: AttendanceRequest): Promise<AttendanceResponse> => {
    const response = await api.post<AttendanceResponse>('/attendance/logout', request);
    return response.data;
  },

  getTodayAttendance: async (): Promise<Attendance> => {
    const response = await api.get<Attendance>('/attendance/today');
    return response.data;
  },

  getHistory: async (): Promise<Attendance[]> => {
    const response = await api.get<Attendance[]>('/attendance/history');
    return response.data;
  },

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
