import api from '../utils/api';
import { Employee, EmployeeRequest } from '../types/employee';

export const MASTER_19_EMPLOYEES: Employee[] = [
  { id: 1, employeeCode: 'EMP000', name: 'System Admin', email: 'admin@eclearnix.com', phone: '1234567890', role: 'ADMIN', status: 'ACTIVE', department: 'Management', createdAt: '2024-01-01T09:00:00Z', updatedAt: '2024-01-01T09:00:00Z' },
  { id: 2, employeeCode: 'ECLCE2008', name: 'Sasiprabha J', email: 'sasiprabha@company.com', phone: '9876543201', role: 'EMPLOYEE', status: 'ACTIVE', department: 'Employee', createdAt: '2025-02-01T09:00:00Z', updatedAt: '2025-02-01T09:00:00Z' },
  { id: 3, employeeCode: 'ECLCE2014', name: 'Sriram R', email: 'sriram@company.com', phone: '9876543202', role: 'EMPLOYEE', status: 'ACTIVE', department: 'Employee', createdAt: '2025-08-01T09:00:00Z', updatedAt: '2025-08-01T09:00:00Z' },
  { id: 4, employeeCode: 'ECLCE2015', name: 'Manimegalai B', email: 'manimegalai@company.com', phone: '9876543203', role: 'EMPLOYEE', status: 'ACTIVE', department: 'Employee', createdAt: '2025-08-01T09:00:00Z', updatedAt: '2025-08-01T09:00:00Z' },
  { id: 5, employeeCode: 'ECLCE2016', name: 'Gopinath', email: 'gopinath@company.com', phone: '9876543204', role: 'EMPLOYEE', status: 'ACTIVE', department: 'Employee', createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 6, employeeCode: 'ECLCE2017', name: 'Dhanuja G T', email: 'dhanuja@company.com', phone: '9876543205', role: 'EMPLOYEE', status: 'ACTIVE', department: 'Employee', createdAt: '2025-09-01T09:00:00Z', updatedAt: '2025-09-01T09:00:00Z' },
  { id: 7, employeeCode: 'ECLCT3009', name: 'Kanishkaa S', email: 'kanishkaa@company.com', phone: '9876543206', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2025-09-01T09:00:00Z', updatedAt: '2025-09-01T09:00:00Z' },
  { id: 8, employeeCode: 'ECLCT3010', name: 'Kanchana Mala V G', email: 'kanchanamala@company.com', phone: '9876543207', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2025-09-01T09:00:00Z', updatedAt: '2025-09-01T09:00:00Z' },
  { id: 9, employeeCode: 'ECLCT3014', name: 'Prabavathi', email: 'prabavathi@company.com', phone: '9876543208', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2025-11-01T09:00:00Z', updatedAt: '2025-11-01T09:00:00Z' },
  { id: 10, employeeCode: 'ECLCT3019', name: 'Dhivyadharshini', email: 'dhivyadharshini@company.com', phone: '9876543209', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2026-02-01T09:00:00Z', updatedAt: '2026-02-01T09:00:00Z' },
  { id: 11, employeeCode: 'ECLCT3020', name: 'Abinaya', email: 'abinaya@company.com', phone: '9876543210', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2026-02-01T09:00:00Z', updatedAt: '2026-02-01T09:00:00Z' },
  { id: 12, employeeCode: 'ECLCT3021', name: 'Swetha', email: 'swetha@company.com', phone: '9876543211', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2026-02-01T09:00:00Z', updatedAt: '2026-02-01T09:00:00Z' },
  { id: 13, employeeCode: 'ECLCT3022', name: 'Kavyasree', email: 'kavyasree@company.com', phone: '9876543212', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2026-03-01T09:00:00Z', updatedAt: '2026-03-01T09:00:00Z' },
  { id: 14, employeeCode: 'ECLCT3023', name: 'Vijayashanthi', email: 'vijayashanthi@company.com', phone: '9876543213', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2026-03-01T09:00:00Z', updatedAt: '2026-03-01T09:00:00Z' },
  { id: 15, employeeCode: 'ECLCT3024', name: 'Merlin', email: 'merlin@company.com', phone: '9876543214', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2026-04-01T09:00:00Z', updatedAt: '2026-04-01T09:00:00Z' },
  { id: 16, employeeCode: 'ECLCT3025', name: 'Deeksha', email: 'deeksha@company.com', phone: '9876543215', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2026-04-01T09:00:00Z', updatedAt: '2026-04-01T09:00:00Z' },
  { id: 17, employeeCode: 'ECLCT3026', name: 'Monisha', email: 'monisha@company.com', phone: '9876543216', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2026-04-01T09:00:00Z', updatedAt: '2026-04-01T09:00:00Z' },
  { id: 18, employeeCode: 'ECLCT4017', name: 'Rubella V', email: 'rubella@company.com', phone: '9876543217', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2026-02-01T09:00:00Z', updatedAt: '2026-02-01T09:00:00Z' },
  { id: 19, employeeCode: 'ECLCT4021', name: 'Deepika', email: 'deepika@company.com', phone: '9876543218', role: 'TRAINEE', status: 'ACTIVE', department: 'Trainee', createdAt: '2026-04-01T09:00:00Z', updatedAt: '2026-04-01T09:00:00Z' },
  { id: 20, employeeCode: 'ECLCI4023', name: 'Mahalakhmi', email: 'mahalakhmi@company.com', phone: '9876543219', role: 'INTERN', status: 'ACTIVE', department: 'Intern', createdAt: '2026-07-01T09:00:00Z', updatedAt: '2026-07-01T09:00:00Z' },
];

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
