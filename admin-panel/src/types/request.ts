import { Employee } from './employee';

export interface PermissionRequest {
  id: number;
  employee: Employee;
  permissionDate: string;
  fromTime: string;
  toTime: string;
  reason: string;
  remarks?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN';
  adminRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionCreatePayload {
  permissionDate: string;
  fromTime: string;
  toTime: string;
  reason: string;
  remarks?: string;
}

export type LeaveType =
  | 'LOSS_OF_PAY'
  | 'COMP_OFF'
  | 'CASUAL_LEAVE'
  | 'SICK_LEAVE'
  | 'WORK_FROM_HOME'
  | 'PERSONAL_LEAVE'
  | 'OTHER';

export type HalfDaySession = 'FIRST_HALF' | 'SECOND_HALF';

export interface LeaveRequest {
  id: number;
  employee: Employee;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  isHalfDay?: boolean;
  halfDaySession?: HalfDaySession;
  reason: string;
  remarks?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN';
  adminRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveCreatePayload {
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  isHalfDay?: boolean;
  halfDaySession?: HalfDaySession;
  reason: string;
  remarks?: string;
}

export interface AdminRecordLeavePayload {
  employeeId: number;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  isHalfDay?: boolean;
  halfDaySession?: HalfDaySession;
  reason: string;
  adminRemarks?: string;
  isUnapplied?: boolean;
}

export interface RequestStatusUpdatePayload {
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminRemarks?: string;
}

export interface LeaveDetailItem {
  id: number;
  fromDate: string;
  toDate: string;
  days: number;
  isHalfDay?: boolean;
  halfDaySession?: HalfDaySession;
  reason: string;
  status: string;
}

export interface LeaveBalanceItem {
  type: string;
  title: string;
  granted: number;
  carriedForward?: number;
  consumed: number;
  balance: number;
  breakdown: LeaveDetailItem[];
}

export interface LeaveBalanceSummary {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  year: number;
  balances: LeaveBalanceItem[];
}

export interface LeaveGrantUpdatePayload {
  employeeId: number;
  year: number;
  casualLeaveGranted: number;
  sickLeaveGranted: number;
  compOffGranted: number;
  lossOfPayGranted: number;
  workFromHomeGranted: number;
}

export interface CarryForwardRulePayload {
  fromYear: number;
  toYear: number;
  maxCasualLeaveCap: number;
  maxSickLeaveCap: number;
  maxCompOffCap: number;
  enableCasualLeave: boolean;
  enableSickLeave: boolean;
  enableCompOff: boolean;
}

export interface CarryForwardEmployeeItem {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  casualClosing: number;
  casualCarried: number;
  sickClosing: number;
  sickCarried: number;
  compOffClosing: number;
  compOffCarried: number;
  totalCarried: number;
}

export interface CarryForwardPreviewResponse {
  fromYear: number;
  toYear: number;
  totalEmployees: number;
  totalDaysCarriedForward: number;
  employees: CarryForwardEmployeeItem[];
}
