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
  status: 'NOT_LOGGED_IN' | 'LOGGED_IN' | 'COMPLETED' | 'WORK_FROM_HOME';
  timingStatus?: 'PRESENT' | 'LATE' | 'PERMISSION' | 'LEAVE' | 'ABSENT' | 'WORKING';
  displayStatus?: string;
  workingHours?: string;
  isWfhApproved?: boolean;
  wfhRequest?: {
    id: number;
    fromDate: string;
    toDate: string;
    reason: string;
  } | null;
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
  status?: 'NOT_LOGGED_IN' | 'LOGGED_IN' | 'COMPLETED' | 'WORK_FROM_HOME';
  timingStatus?: string;
  isWfh?: boolean;
}


