import api from '../utils/api';
import {
  PermissionRequest,
  PermissionCreatePayload,
  LeaveRequest,
  LeaveCreatePayload,
  RequestStatusUpdatePayload,
} from '../types/request';

export const requestService = {
  // Permission APIs
  applyPermission: async (payload: PermissionCreatePayload): Promise<PermissionRequest> => {
    const response = await api.post<PermissionRequest>('/permissions', payload);
    return response.data;
  },

  getMyPermissions: async (): Promise<PermissionRequest[]> => {
    const response = await api.get<PermissionRequest[]>('/permissions/my');
    return response.data;
  },

  getAllPermissions: async (filters?: {
    employeeId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PermissionRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', String(filters.employeeId));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<PermissionRequest[]>('/admin/permissions', { params });
    return response.data;
  },

  updatePermissionStatus: async (
    id: number,
    payload: RequestStatusUpdatePayload
  ): Promise<PermissionRequest> => {
    const response = await api.patch<PermissionRequest>(`/admin/permissions/${id}/status`, payload);
    return response.data;
  },

  // Leave APIs
  applyLeave: async (payload: LeaveCreatePayload): Promise<LeaveRequest> => {
    const response = await api.post<LeaveRequest>('/leaves', payload);
    return response.data;
  },

  recordDirectLeave: async (payload: import('../types/request').AdminRecordLeavePayload): Promise<LeaveRequest> => {
    const response = await api.post<LeaveRequest>('/admin/leaves/direct', payload);
    return response.data;
  },

  getMyLeaves: async (): Promise<LeaveRequest[]> => {
    const response = await api.get<LeaveRequest[]>('/leaves/my');
    return response.data;
  },

  getAllLeaves: async (filters?: {
    employeeId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<LeaveRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', String(filters.employeeId));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<LeaveRequest[]>('/admin/leaves', { params });
    return response.data;
  },

  updateLeaveStatus: async (
    id: number,
    payload: RequestStatusUpdatePayload
  ): Promise<LeaveRequest> => {
    const response = await api.patch<LeaveRequest>(`/admin/leaves/${id}/status`, payload);
    return response.data;
  },

  adminCancelLeave: async (id: number, withdrawalReason?: string): Promise<LeaveRequest> => {
    const response = await api.patch<LeaveRequest>(`/admin/leaves/${id}/cancel`, { withdrawalReason });
    return response.data;
  },

  previewCarryForward: async (
    rules: import('../types/request').CarryForwardRulePayload
  ): Promise<import('../types/request').CarryForwardPreviewResponse> => {
    const response = await api.post<import('../types/request').CarryForwardPreviewResponse>(
      '/admin/leaves/carry-forward/preview',
      rules
    );
    return response.data;
  },

  executeCarryForward: async (
    rules: import('../types/request').CarryForwardRulePayload
  ): Promise<import('../types/request').CarryForwardPreviewResponse> => {
    const response = await api.post<import('../types/request').CarryForwardPreviewResponse>(
      '/admin/leaves/carry-forward/execute',
      rules
    );
    return response.data;
  },

  // Leave Balances APIs
  getAllLeaveBalances: async (year?: number): Promise<import('../types/request').LeaveBalanceSummary[]> => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    const response = await api.get<import('../types/request').LeaveBalanceSummary[]>('/admin/leaves/balances', { params });
    return response.data;
  },

  updateLeaveGrants: async (
    payload: import('../types/request').LeaveGrantUpdatePayload
  ): Promise<import('../types/request').LeaveBalanceSummary> => {
    const response = await api.put<import('../types/request').LeaveBalanceSummary>('/admin/leaves/balances', payload);
    return response.data;
  },
};

