export interface EmployeeKpiSummary {
  id: number;
  name: string;
  email: string;
  employeeCode: string;
  department: string;
  role: string;
  totalPlanned: number;
  completedPlanned: number;
  plannedScore: number;
  totalUnplanned: number;
  completedUnplanned: number;
  unplannedScore: number;
  totalLoggedDays: number;
  onTimeDays: number;
  lateDays: number;
  punctualityScore: number;
  approvedWfhDays: number;
  overallScore: number;
  performanceTier: 'Outstanding' | 'Excellent' | 'Good' | 'Needs Attention' | 'Critical' | string;
  tierColor: string;
}

export interface KpiDashboardMetrics {
  totalEmployees: number;
  avgKpiScore: number;
  plannedCompletionRate: number;
  unplannedCompletionRate: number;
  companyOnTimeRate: number;
  totalWfhDays: number;
  topPerformer: EmployeeKpiSummary | null;
  tierCounts: {
    outstanding: number;
    excellent: number;
    good: number;
    needsAttention: number;
    critical: number;
  };
}

export interface DepartmentKpiStat {
  department: string;
  employeeCount: number;
  avgScore: number;
  plannedTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface KpiDashboardResponse {
  year: number;
  month: number;
  metrics: KpiDashboardMetrics;
  departmentStats: DepartmentKpiStat[];
  employees: EmployeeKpiSummary[];
}

export interface PlannedWorkTask {
  id: number;
  taskName: string;
  category: string;
  priority: string;
  status: string;
  targetDescription?: string;
  remarks?: string;
  reasonRemarks?: string;
  timeSpent?: string;
  planDate: string;
}

export interface UnplannedWorkTask {
  id: number;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  createdAt?: string;
  completionNotes?: string;
  assignedByName?: string;
}

export interface AttendanceLoginLog {
  id: number;
  date: string;
  loginTime?: string;
  logoutTime?: string;
  status: string;
  timingStatus: string;
  distance?: number;
  accuracy?: number;
}

export interface WfhRequestItem {
  id: number;
  fromDate: string;
  toDate: string;
  status: string;
  reason: string;
  adminRemarks?: string;
  createdAt?: string;
}

export interface DailyTimelineItem {
  date: string;
  dayNumber: number;
  plans: PlannedWorkTask[];
  tasks: any[];
  note: any;
  attendance: any;
  isWfh: boolean;
  kpiScore: number;
  kpiLabel: string;
}

export interface ComprehensiveKpiReport {
  year: number;
  month: number;
  employee: {
    id: number;
    name: string;
    email: string;
    employeeCode: string;
    department: string;
    role: string;
    phone?: string;
  };
  overallPerformance: {
    score: number;
    tier: string;
    tierBadge: string;
    tierColor: string;
    strengths: string[];
    improvements: string[];
    componentBreakdown: {
      plannedWorksWeight: string;
      plannedWorksScore: number;
      unplannedWorksWeight: string;
      unplannedWorksScore: number;
      punctualityWeight: string;
      punctualityScore: number;
      consistencyWeight: string;
      consistencyScore: number;
      attendanceWeight: string;
      attendanceScore: number;
    };
  };
  plannedWorks: {
    score: number;
    totalPlanned: number;
    completed: number;
    inProgress: number;
    notCompleted: number;
    notStarted: number;
    completionRate: number;
    byPriority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
    byCategory: Record<string, number>;
    tasks: PlannedWorkTask[];
  };
  unplannedWorks: {
    score: number;
    totalUnplanned: number;
    completed: number;
    inProgress: number;
    underReview: number;
    pending: number;
    cancelled: number;
    completionRate: number;
    byPriority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
    tasks: UnplannedWorkTask[];
  };
  loginAndPunctuality: {
    score: number;
    totalLoggedDays: number;
    onTimeDays: number;
    lateDays: number;
    permissionDays: number;
    leaveDays: number;
    absentDays: number;
    punctualityRate: number;
    avgLoginTime: string;
    avgLogoutTime: string;
    avgDailyHours: number;
    totalHoursLogged: number;
    logs: AttendanceLoginLog[];
  };
  workFromHome: {
    score: number;
    totalRequests: number;
    approvedDays: number;
    pendingRequests: number;
    rejectedRequests: number;
    remotePunchesCount: number;
    requests: WfhRequestItem[];
  };
  dailyTimeline: DailyTimelineItem[];
}
