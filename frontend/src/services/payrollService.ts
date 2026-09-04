import api from '../utils/api';
import {
  EmployeeSalaryStructure,
  EmployeePayrollRecord,
  EmployeePayslipData,
} from '../types/payroll';

export const payrollService = {
  getMySalary: async (): Promise<EmployeeSalaryStructure> => {
    const res = await api.get<EmployeeSalaryStructure>('/salary/my');
    return res.data;
  },

  getMyPayrollList: async (year?: number): Promise<EmployeePayrollRecord[]> => {
    const params: any = {};
    if (year) params.year = year;
    const res = await api.get<EmployeePayrollRecord[]>('/payroll/my', { params });
    return res.data;
  },

  getMyPayrollById: async (id: number): Promise<EmployeePayrollRecord> => {
    const res = await api.get<EmployeePayrollRecord>(`/payroll/my/${id}`);
    return res.data;
  },

  getMyPayslip: async (payrollId: number): Promise<EmployeePayslipData> => {
    const res = await api.get<EmployeePayslipData>(`/payroll/${payrollId}/payslip`);
    return res.data;
  },
};
