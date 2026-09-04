import api from '../utils/api';
import {
  SalaryStructure,
  SalaryHistory,
  PayrollRecord,
  PayrollDashboardStats,
  PayslipData,
  PayrollStatus,
} from '../types/payroll';

export const payrollService = {
  // ── Salary Structure ──
  getAllSalaryStructures: async (): Promise<SalaryStructure[]> => {
    const res = await api.get<SalaryStructure[]>('/salary');
    return res.data;
  },

  getSalaryStructure: async (employeeId: number): Promise<SalaryStructure> => {
    const res = await api.get<SalaryStructure>(`/salary/${employeeId}`);
    return res.data;
  },

  saveSalaryStructure: async (data: SalaryStructure): Promise<SalaryStructure> => {
    const res = await api.post<SalaryStructure>('/salary', data);
    return res.data;
  },

  updateSalaryStructure: async (employeeId: number, data: Partial<SalaryStructure>): Promise<SalaryStructure> => {
    const res = await api.put<SalaryStructure>(`/salary/${employeeId}`, data);
    return res.data;
  },

  getSalaryHistory: async (employeeId: number): Promise<SalaryHistory[]> => {
    const res = await api.get<SalaryHistory[]>(`/salary/history/${employeeId}`);
    return res.data;
  },

  // ── Payroll Generation & Management ──
  getStats: async (month?: number, year?: number): Promise<PayrollDashboardStats> => {
    const params: any = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await api.get<PayrollDashboardStats>('/payroll/stats', { params });
    return res.data;
  },

  getPayrollList: async (filters?: {
    month?: number;
    year?: number;
    employeeId?: number;
    status?: PayrollStatus;
  }): Promise<PayrollRecord[]> => {
    const res = await api.get<PayrollRecord[]>('/payroll', { params: filters });
    return res.data;
  },

  generatePayroll: async (month: number, year: number, employeeId?: number): Promise<PayrollRecord[]> => {
    const res = await api.post<PayrollRecord[]>('/payroll/generate', { month, year, employeeId });
    return res.data;
  },

  getPayrollById: async (id: number): Promise<PayrollRecord> => {
    const res = await api.get<PayrollRecord>(`/payroll/${id}`);
    return res.data;
  },

  updateStatus: async (id: number, status: PayrollStatus): Promise<PayrollRecord> => {
    const res = await api.patch<PayrollRecord>(`/payroll/${id}/status`, { status });
    return res.data;
  },

  getPayslip: async (payrollId: number): Promise<PayslipData> => {
    const res = await api.get<PayslipData>(`/payroll/${payrollId}/payslip`);
    return res.data;
  },
};
