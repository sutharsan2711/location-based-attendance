export type PayrollStatus = 'DRAFT' | 'GENERATED' | 'PAID';

export interface SalaryStructure {
  id?: number;
  employeeId: number;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  role?: string;

  basicSalary: number;
  hra: number;
  da: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  otherAllowance: number;
  grossSalary?: number;

  pf: number;
  esi: number;
  professionalTax: number;
  otherDeduction: number;
  totalDeduction?: number;

  netSalary?: number;

  effectiveFrom?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryHistory {
  id: number;
  employeeId: number;
  employeeName: string;
  basicSalary: number;
  grossSalary: number;
  totalDeduction: number;
  netSalary: number;
  effectiveFrom: string;
  createdAt: string;
}

export interface PayrollRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  role: string;

  month: number;
  year: number;

  basicSalary: number;
  hra: number;
  da: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  otherAllowance: number;
  grossSalary: number;

  pf: number;
  esi: number;
  professionalTax: number;
  otherDeduction: number;
  totalDeduction: number;

  netSalary: number;

  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  permissionDays: number;
  lateDays: number;

  status: PayrollStatus;
  generatedAt: string;
  paidAt?: string;
  createdAt?: string;
}

export interface PayrollDashboardStats {
  totalEmployees: number;
  payrollGenerated: number;
  payrollPending: number;
  payrollPaid: number;
  currentMonth: number;
  currentYear: number;
  currentMonthName: string;
}

export interface PayslipData {
  payrollId: number;
  companyName: string;
  companyAddress: string;

  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation?: string;
  role: string;
  joiningDate?: string;

  month: number;
  year: number;
  monthName: string;

  basicSalary: number;
  hra: number;
  da: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  otherAllowance: number;
  grossSalary: number;

  pf: number;
  esi: number;
  professionalTax: number;
  otherDeduction: number;
  totalDeduction: number;

  netSalary: number;

  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  permissionDays: number;
  lateDays: number;

  status: string;
  generatedAt: string;
  paidAt?: string;
}
