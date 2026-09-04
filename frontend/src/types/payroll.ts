export interface EmployeeSalaryStructure {
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
  effectiveFrom?: string;
}

export interface EmployeePayrollRecord {
  id: number;
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

  status: 'DRAFT' | 'GENERATED' | 'PAID';
  generatedAt: string;
  paidAt?: string;
}

export interface EmployeePayslipData {
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
