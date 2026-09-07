export type WorkPlanPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_SET';
export type WorkPlanStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_COMPLETED';

export interface DailyWorkPlanItem {
  id: number;
  employeeId: number;
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

export interface DailyWorkSummary {
  totalTasks: number;
  completedCount: number;
  inProgressCount: number;
  notCompletedCount: number;
  notStartedCount: number;
  kpiScore: number;
  kpiLabel: string;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  notSetPriorityCount: number;
  checkInTime: string;
  checkOutTime: string;
  workHoursFormatted: string;
}

export interface DailyWorkNoteData {
  id?: number;
  employeeId?: number;
  noteDate?: string;
  notes: string;
  kpiScore?: number | null;
}

export interface TodayDashboardResponse {
  date: string;
  employee: {
    id: number;
    name: string;
    email: string;
    employeeCode: string;
    role: string;
    department?: string;
  };
  summary: DailyWorkSummary;
  plans: DailyWorkPlanItem[];
  note: DailyWorkNoteData | null;
  attendance: {
    id: number;
    status: string;
    timingStatus: string;
    loginTime?: string;
    logoutTime?: string;
  } | null;
}
