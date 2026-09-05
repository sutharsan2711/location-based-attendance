export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string;
  dueDate?: string;
  department?: string;

  // Assignee Information
  assignedEmployeeId: number;
  assignedEmployeeName: string;
  assignedEmployeeCode: string;
  assignedEmployeeEmail?: string;
  employeeId?: number;
  employeeName?: string;
  employeeCode?: string;

  // Creator / Assigner Information
  assignedById?: number;
  assignedByName?: string;
  createdById?: number;
  createdByName?: string;

  completionNotes?: string;
  completedAt?: string;
  checklistJson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  status?: TaskStatus;
  startDate?: string;
  dueDate?: string;
  department?: string;
  assignedEmployeeId?: number;
  employeeId?: number;
  completionNotes?: string;
  checklistJson?: string;
}

export interface TaskStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  urgentTasks: number;
}
