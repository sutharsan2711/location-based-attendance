import { Employee } from './employee';

export interface Attendance {
  id: number;
  employee: Employee;
  attendanceDate: string;
  loginTime?: string;
  loginLatitude?: number;
  loginLongitude?: number;
  loginAccuracy?: number;
  loginDistance?: number;
  logoutTime?: string;
  logoutLatitude?: number;
  logoutLongitude?: number;
  logoutAccuracy?: number;
  logoutDistance?: number;
  status: 'NOT_LOGGED_IN' | 'LOGGED_IN' | 'COMPLETED';
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRequest {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface AttendanceResponse {
  success: boolean;
  message: string;
  distance?: number;
  allowedRadius?: number;
  time?: string;
  status?: 'NOT_LOGGED_IN' | 'LOGGED_IN' | 'COMPLETED';
}
