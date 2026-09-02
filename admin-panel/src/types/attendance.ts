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
  timingStatus?: 'PRESENT' | 'LATE' | 'PERMISSION' | 'LEAVE' | 'ABSENT' | 'WORKING';
  displayStatus?: string;
  workingHours?: string;
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
  timingStatus?: string;
}

export interface MonthlyDayDetail {
  day: number;
  date: string;
  code: 'P' | 'L' | 'PR' | 'LV' | 'A' | 'WO' | '--';
  status: string;
  loginTime: string;
  logoutTime: string;
  workingHours: string;
}

export interface MonthlyEmployeeRow {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department?: string;
  loginTime?: string;
  days: Record<string, MonthlyDayDetail>;
  totalPresent: number;
  totalLate: number;
  totalPermission: number;
  totalLeave: number;
  totalAbsent: number;
  totalWeekOff: number;
  workingDays?: number;
  presentDays?: number;
  leaveDays?: number;
  attendancePercentage?: number;
}

export interface MonthlyAttendanceData {
  year: number;
  month: number;
  daysInMonth: number;
  workingDays?: number;
  employees: MonthlyEmployeeRow[];
}

