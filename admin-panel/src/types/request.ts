import { Employee } from './employee';

export interface PermissionRequest {
  id: number;
  employee: Employee;
  permissionDate: string;
  fromTime: string;
  toTime: string;
  reason: string;
  remarks?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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

export interface LeaveRequest {
  id: number;
  employee: Employee;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
  remarks?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveCreatePayload {
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
  remarks?: string;
}

export interface RequestStatusUpdatePayload {
  status: 'APPROVED' | 'REJECTED';
  adminRemarks?: string;
}

export interface LeaveDetailItem {
  id: number;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: string;
}

export interface LeaveBalanceItem {
  type: string;
  title: string;
  granted: number;
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
