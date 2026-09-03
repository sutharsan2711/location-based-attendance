import api from '../utils/api';
import { Employee, EmployeeRequest } from '../types/employee';

export const employeeService = {
  getAll: async (): Promise<Employee[]> => {
    try {
      const response = await api.get<Employee[]>('/employees');
      if (response.data && Array.isArray(response.data)) {
        return response.data.filter(e => e.role !== 'ADMIN' && !['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005'].includes(e.employeeCode));
      }
      return [];
    } catch (e) {
      console.error('Failed to fetch employees', e);
      return [];
    }
  },

  getById: async (id: number): Promise<Employee> => {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  create: async (request: EmployeeRequest): Promise<Employee> => {
    const response = await api.post<Employee>('/employees', request);
    return response.data;
  },

  update: async (id: number, request: EmployeeRequest): Promise<Employee> => {
    const response = await api.put<Employee>(`/employees/${id}`, request);
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/employees/${id}`);
    return response.data;
  },

  toggleStatus: async (id: number, status: 'ACTIVE' | 'INACTIVE'): Promise<Employee> => {
    const response = await api.patch<Employee>(`/employees/${id}/status`, { status });
    return response.data;
  },

  resetPassword: async (id: number, password: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(`/employees/${id}/reset-password`, { password });
    return response.data;
  }
};
