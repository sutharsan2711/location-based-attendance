export type WorkPlanPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_SET';
export type WorkPlanStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_COMPLETED';

export interface AdminWorkPlanItem {
  id: number;
  employeeId: number;
  employeeName?: string;
  employeeCode?: string;
  employeeDepartment?: string;
  employeeAvatar?: string;
  employee?: {
    id: number;
    name: string;
    employeeCode: string;
    email: string;
    department?: string;
    role?: string;
  };
  planDate: string;
  taskName: string;
  category: string;
  priority: WorkPlanPriority;
  targetDescription: string;
  remarks: string;
  status: WorkPlanStatus;
  reasonRemarks: string;
  timeSpent: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminWorkPlanSummary {
  totalPlans: number;
  completedPlans: number;
  inProgressPlans: number;
  notStartedPlans: number;
  holdPlans: number;
  kpiAverage: number;
}

export interface AdminWorkPlanResponse {
  plans: AdminWorkPlanItem[];
  summary: AdminWorkPlanSummary;
}
