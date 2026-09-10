import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { taskService } from '../../services/taskService';
import { employeeService } from '../../services/employeeService';
import { adminWorkPlanService } from '../../services/adminWorkPlanService';
import { Task, TaskPriority, TaskRequest, TaskStats, TaskStatus } from '../../types/task';
import { Employee } from '../../types/employee';
import { AdminWorkPlanItem, AdminWorkPlanSummary, WorkPlanPriority, WorkPlanStatus } from '../../types/workPlan';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  Ban,
  Search,
  Filter,
  Calendar,
  User,
  Trash2,
  Edit2,
  X,
  LayoutGrid,
  List,
  Flame,
  CheckCheck,
  FileText,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  UserCheck,
  TrendingUp,
  ClipboardList,
  FolderKanban,
  CheckSquare,
  Hourglass,
  Tag,
  MessageSquare
} from 'lucide-react';

const priorityColors: Record<TaskPriority | WorkPlanPriority, { bg: string; text: string; border: string; badge: string }> = {
  LOW: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700' },
  MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-amber-100 text-amber-800' },
  HIGH: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800 font-bold' },
  URGENT: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', badge: 'bg-rose-100 text-rose-800' },
  NOT_SET: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600' },
};

const statusConfig: Record<TaskStatus, { label: string; bg: string; text: string; icon: any }> = {
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700', icon: PlayCircle },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  BLOCKED: { label: 'Blocked', bg: 'bg-rose-50', text: 'text-rose-700', icon: Ban },
  CANCELLED: { label: 'Cancelled', bg: 'bg-slate-100', text: 'text-slate-600', icon: X },
};

const workPlanStatusConfig: Record<WorkPlanStatus, { label: string; bg: string; text: string; dot: string }> = {
  NOT_STARTED: { label: 'Not Started', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  NOT_COMPLETED: { label: 'Not Completed / Hold', bg: 'bg-rose-50 border border-rose-200', text: 'text-rose-800', dot: 'bg-rose-500' },
};

const AdminTasks: React.FC = () => {
  // Top Level Module Switcher: WORK_PLANS vs ASSIGNED_TASKS
  const [activeTab, setActiveTab] = useState<'WORK_PLANS' | 'ASSIGNED_TASKS'>('WORK_PLANS');

  // Common State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Daily Work Plans State
  const [workPlans, setWorkPlans] = useState<AdminWorkPlanItem[]>([]);
  const [workPlanSummary, setWorkPlanSummary] = useState<AdminWorkPlanSummary>({
    totalPlans: 0,
    completedPlans: 0,
    inProgressPlans: 0,
    notStartedPlans: 0,
    holdPlans: 0,
    kpiAverage: 0,
  });
  const [selectedPlanDate, setSelectedPlanDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [workPlanEmployeeFilter, setWorkPlanEmployeeFilter] = useState<string>('ALL');
  const [workPlanStatusFilter, setWorkPlanStatusFilter] = useState<string>('ALL');
  const [workPlanPriorityFilter, setWorkPlanPriorityFilter] = useState<string>('ALL');
  const [workPlanCategoryFilter, setWorkPlanCategoryFilter] = useState<string>('ALL');
  const [workPlanSearch, setWorkPlanSearch] = useState<string>('');

  // Assigned Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    urgentTasks: 0,
  });
  const [taskViewMode, setTaskViewMode] = useState<'board' | 'table'>('board');
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('ALL');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('ALL');
  const [taskEmployeeFilter, setTaskEmployeeFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit Work Plan Remarks Modal
  const [editingWorkPlan, setEditingWorkPlan] = useState<AdminWorkPlanItem | null>(null);
  const [planRemarksText, setPlanRemarksText] = useState<string>('');

  // Form State for Assigned Tasks
  const [formData, setFormData] = useState<TaskRequest>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assignedEmployeeId: 0,
    assignedByName: 'System Admin',
  });

  const DEFAULT_ASSIGNER_OPTIONS = [
    'System Admin',
    'Operations Lead',
    'HR Team Lead',
    'Project Manager',
    'Technical Lead',
  ];

  const [assignerOptions, setAssignerOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('admin_task_assigners');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_ASSIGNER_OPTIONS;
  });

  const [deletedAssigners, setDeletedAssigners] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('admin_task_deleted_assigners');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [showAddAssignerInput, setShowAddAssignerInput] = useState<boolean>(false);
  const [newAssignerName, setNewAssignerName] = useState<string>('');

  // Fetch Work Plans
  const fetchWorkPlans = useCallback(async () => {
    try {
      const res = await adminWorkPlanService.getAdminWorkPlans({
        date: selectedPlanDate,
        employeeId: workPlanEmployeeFilter !== 'ALL' ? workPlanEmployeeFilter : undefined,
        status: workPlanStatusFilter !== 'ALL' ? workPlanStatusFilter : undefined,
        priority: workPlanPriorityFilter !== 'ALL' ? workPlanPriorityFilter : undefined,
        category: workPlanCategoryFilter !== 'ALL' ? workPlanCategoryFilter : undefined,
        search: workPlanSearch.trim() || undefined,
      });
      setWorkPlans(res.plans);
      setWorkPlanSummary(res.summary);
    } catch (err) {
      console.error('Failed to load admin work plans', err);
    }
  }, [
    selectedPlanDate,
    workPlanEmployeeFilter,
    workPlanStatusFilter,
    workPlanPriorityFilter,
    workPlanCategoryFilter,
    workPlanSearch,
  ]);

  // Fetch Assigned Tasks
  const fetchAssignedTasks = useCallback(async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        taskService.getAllTasks(),
        taskService.getStats(),
      ]);
      setTasks(tasksRes);
      setTaskStats(statsRes);
    } catch (err) {
      console.error('Failed to load assigned tasks data', err);
    }
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [empRes] = await Promise.all([
        employeeService.getAll(),
        fetchWorkPlans(),
        fetchAssignedTasks(),
      ]);
      setEmployees(empRes);
    } catch (err) {
      console.error('Failed to initialize task management', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    fetchWorkPlans();
  }, [fetchWorkPlans]);

  // Handle inline work plan status update
  const handleWorkPlanStatusChange = async (planId: number, newStatus: WorkPlanStatus) => {
    try {
      await adminWorkPlanService.updateWorkPlanStatus(planId, newStatus);
      await fetchWorkPlans();
    } catch (err) {
      console.error('Failed to update work plan status', err);
      alert('Failed to update status.');
    }
  };

  // Handle delete work plan
  const handleDeleteWorkPlan = async (planId: number) => {
    if (window.confirm('Are you sure you want to remove this daily work plan entry?')) {
      try {
        await adminWorkPlanService.deleteWorkPlan(planId);
        await fetchWorkPlans();
      } catch (err) {
        console.error('Failed to delete work plan', err);
        alert('Failed to delete work plan.');
      }
    }
  };

  // Save Work Plan Remarks
  const handleSavePlanRemarks = async () => {
    if (!editingWorkPlan) return;
    try {
      await adminWorkPlanService.updateWorkPlan(editingWorkPlan.id, {
        remarks: planRemarksText,
      });
      setEditingWorkPlan(null);
      await fetchWorkPlans();
    } catch (err) {
      console.error('Failed to update remarks', err);
      alert('Failed to update remarks.');
    }
  };

  // Assigned Tasks Filtering
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const empName = t.assignedEmployeeName || t.employeeName || '';
      const empCode = t.assignedEmployeeCode || t.employeeCode || '';
      const assigner = t.assignedByName || t.createdByName || '';
      const matchSearch =
        t.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(taskSearchQuery.toLowerCase())) ||
        empName.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
        empCode.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
        assigner.toLowerCase().includes(taskSearchQuery.toLowerCase());

      const matchStatus = taskStatusFilter === 'ALL' || t.status === taskStatusFilter;
      const matchPriority = taskPriorityFilter === 'ALL' || t.priority === taskPriorityFilter;
      const targetEmpId = t.assignedEmployeeId || t.employeeId;
      const matchEmployee = taskEmployeeFilter === 'ALL' || String(targetEmpId) === taskEmployeeFilter;

      return matchSearch && matchStatus && matchPriority && matchEmployee;
    });
  }, [tasks, taskSearchQuery, taskStatusFilter, taskPriorityFilter, taskEmployeeFilter]);

  const handleOpenCreateModal = (taskToEdit?: Task) => {
    setShowAddAssignerInput(false);
    setNewAssignerName('');
    if (taskToEdit) {
      setSelectedTask(taskToEdit);
      const empId = taskToEdit.assignedEmployeeId || taskToEdit.employeeId || 0;
      const assigner = taskToEdit.assignedByName || taskToEdit.createdByName || 'System Admin';
      if (!assignerOptions.includes(assigner)) {
        setAssignerOptions((prev) => [assigner, ...prev]);
      }
      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description || '',
        priority: taskToEdit.priority,
        status: taskToEdit.status,
        dueDate: taskToEdit.dueDate ? taskToEdit.dueDate.substring(0, 10) : '',
        assignedEmployeeId: empId,
        employeeId: empId,
        assignedByName: assigner,
        whoAssigned: assigner,
      });
    } else {
      setSelectedTask(null);
      const defaultEmpId = employees.length > 0 ? employees[0].id : 0;
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: new Date().toISOString().substring(0, 10),
        assignedEmployeeId: defaultEmpId,
        employeeId: defaultEmpId,
        assignedByName: 'System Admin',
        whoAssigned: 'System Admin',
      });
    }
    setIsCreateModalOpen(true);
  };

  const availableAssigners = useMemo(() => {
    const all = Array.from(new Set([...assignerOptions, ...employees.map((e) => e.name)]));
    return all.filter((name) => !deletedAssigners.includes(name));
  }, [assignerOptions, employees, deletedAssigners]);

  const handleAddCustomAssigner = () => {
    if (!newAssignerName.trim()) return;
    const name = newAssignerName.trim();
    const updated = assignerOptions.includes(name) ? assignerOptions : [name, ...assignerOptions];
    setAssignerOptions(updated);
    const updatedDeleted = deletedAssigners.filter((d) => d !== name);
    setDeletedAssigners(updatedDeleted);
    try {
      localStorage.setItem('admin_task_assigners', JSON.stringify(updated));
      localStorage.setItem('admin_task_deleted_assigners', JSON.stringify(updatedDeleted));
    } catch {
      // ignore
    }
    setFormData((prev) => ({ ...prev, assignedByName: name, whoAssigned: name }));
    setNewAssignerName('');
    setShowAddAssignerInput(false);
  };

  const handleDeleteCurrentAssigner = () => {
    const current = formData.assignedByName || (availableAssigners[0] || 'System Admin');
    if (!current) return;

    if (window.confirm(`Are you sure you want to delete "${current}" from the assigner options?`)) {
      const updatedOptions = assignerOptions.filter((opt) => opt !== current);
      const updatedDeleted = Array.from(new Set([...deletedAssigners, current]));
      setAssignerOptions(updatedOptions);
      setDeletedAssigners(updatedDeleted);
      try {
        localStorage.setItem('admin_task_assigners', JSON.stringify(updatedOptions));
        localStorage.setItem('admin_task_deleted_assigners', JSON.stringify(updatedDeleted));
      } catch {
        // ignore
      }

      const nextAvailable = Array.from(
        new Set([...updatedOptions, ...employees.map((e) => e.name)])
      ).filter((name) => !updatedDeleted.includes(name));

      const nextVal = nextAvailable.length > 0 ? nextAvailable[0] : 'System Admin';
      setFormData((prev) => ({ ...prev, assignedByName: nextVal, whoAssigned: nextVal }));
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmpId = Number(formData.assignedEmployeeId || formData.employeeId);
    if (!formData.title.trim() || !targetEmpId) {
      alert('Please fill the task title and select an employee.');
      return;
    }

    try {
      setIsSubmitting(true);
      const assigner = formData.assignedByName?.trim() || 'System Admin';
      const payload: TaskRequest = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        priority: formData.priority,
        status: formData.status || 'PENDING',
        dueDate: formData.dueDate || undefined,
        assignedEmployeeId: targetEmpId,
        employeeId: targetEmpId,
        assignedByName: assigner,
        whoAssigned: assigner,
      };

      if (selectedTask) {
        await taskService.updateTask(selectedTask.id, payload);
      } else {
        await taskService.createTask(payload);
      }
      setIsCreateModalOpen(false);
      await fetchAssignedTasks();
    } catch (err: any) {
      console.error('Failed to save task', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save task. Please try again.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this assigned task?')) {
      try {
        await taskService.deleteTask(id);
        if (selectedTask?.id === id) {
          setIsDetailModalOpen(false);
        }
        await fetchAssignedTasks();
      } catch (err) {
        console.error('Failed to delete task', err);
        alert('Failed to delete task.');
      }
    }
  };

  const handleQuickStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      await fetchAssignedTasks();
    } catch (err) {
      console.error('Failed to update task status', err);
    }
  };

  if (loading && workPlans.length === 0 && tasks.length === 0) {
    return <Loading message="Loading Task Management & Work Plans..." />;
  }

  // Work plan categories for filter dropdown
  const uniqueCategories = Array.from(new Set(workPlans.map((p) => p.category).filter(Boolean)));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Task Management & Work Plans</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
              <Sparkles className="w-3 h-3 mr-1" /> Live Connected
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitor real-time employee daily work plans, KPI scores, and assign delegated tasks across your team.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {activeTab === 'ASSIGNED_TASKS' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setTaskViewMode('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  taskViewMode === 'board' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" /> Board
              </button>
              <button
                onClick={() => setTaskViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  taskViewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-4 h-4" /> Table
              </button>
            </div>
          )}

          <Button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-2 shadow-lg shadow-primary-500/20"
          >
            <Plus className="h-4 w-4" />
            Assign New Task
          </Button>
        </div>
      </div>

      {/* Primary Module Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-white px-3 pt-2 rounded-2xl shadow-sm">
        <button
          onClick={() => setActiveTab('WORK_PLANS')}
          className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'WORK_PLANS'
              ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Employee Daily Work Plans</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'WORK_PLANS' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {workPlanSummary.totalPlans}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ASSIGNED_TASKS')}
          className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ASSIGNED_TASKS'
              ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Admin Assigned Tasks</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'ASSIGNED_TASKS' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {taskStats.totalTasks}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EMPLOYEE DAILY WORK PLANS VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'WORK_PLANS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Planned</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{workPlanSummary.totalPlans}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tasks scheduled</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-700 mt-2">{workPlanSummary.completedPlans}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Delivered deliverables</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">In Progress</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Hourglass className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-700 mt-2">{workPlanSummary.inProgressPlans}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Underway by employees</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Not Started</span>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-700 mt-2">{workPlanSummary.notStartedPlans}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pending execution</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2 sm:col-span-1 bg-gradient-to-br from-indigo-50/50 to-white hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Avg KPI Score</span>
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-indigo-700 mt-2">{workPlanSummary.kpiAverage}%</p>
              <p className="text-[11px] text-indigo-500 font-semibold mt-0.5">
                {workPlanSummary.kpiAverage >= 85
                  ? 'Excellent Performance'
                  : workPlanSummary.kpiAverage >= 70
                  ? 'Very Good'
                  : workPlanSummary.kpiAverage >= 50
                  ? 'Good Progress'
                  : 'Needs Attention'}
              </p>
            </div>
          </div>

          {/* Filter Bar for Daily Work Plans */}
          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Date Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={selectedPlanDate}
                  onChange={(e) => setSelectedPlanDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                  title="Filter by Plan Date"
                />
              </div>

              {/* Employee Filter */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={workPlanEmployeeFilter}
                  onChange={(e) => setWorkPlanEmployeeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                >
                  <option value="ALL">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={workPlanStatusFilter}
                  onChange={(e) => setWorkPlanStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="NOT_COMPLETED">Not Completed / Hold</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={workPlanPriorityFilter}
                  onChange={(e) => setWorkPlanPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="NOT_SET">Not Set</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={workPlanCategoryFilter}
                  onChange={(e) => setWorkPlanCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                >
                  <option value="ALL">All Categories</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search plan or employee..."
                  value={workPlanSearch}
                  onChange={(e) => setWorkPlanSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>
          </Card>

          {/* Work Plans Table */}
          <Card className="overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Daily Work Plans for {selectedPlanDate === new Date().toISOString().split('T')[0] ? "Today (" + selectedPlanDate + ")" : selectedPlanDate}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {workPlans.length} daily task items planned by employees
                </p>
              </div>
              <button
                onClick={() => setSelectedPlanDate(new Date().toISOString().split('T')[0])}
                className="text-xs font-bold text-primary-600 hover:text-primary-800 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200 transition"
              >
                Reset to Today
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100 tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">S.No</th>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Planned Task</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Target Deliverable</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Time Spent</th>
                    <th className="px-5 py-3.5">Remarks</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-xs">
                  {workPlans.map((plan, index) => {
                    const empName = plan.employee?.name || plan.employeeName || 'Employee';
                    const empCode = plan.employee?.employeeCode || plan.employeeCode || '';
                    const empDept = plan.employee?.department || plan.employeeDepartment || 'Staff';
                    const statusInfo = workPlanStatusConfig[plan.status] || workPlanStatusConfig.NOT_STARTED;

                    return (
                      <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-4 text-center font-bold text-slate-400">{index + 1}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {empName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{empName}</p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <span>{empCode}</span>
                                <span>•</span>
                                <span className="font-medium text-slate-500">{empDept}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <p className="font-bold text-slate-800 text-sm">{plan.taskName}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {plan.category || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              priorityColors[plan.priority]?.badge || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {plan.priority}
                          </span>
                        </td>
                        <td className="px-5 py-4 max-w-xs text-slate-600">
                          {plan.targetDescription ? (
                            <p className="line-clamp-2">{plan.targetDescription}</p>
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {/* Live Interactive Status Dropdown */}
                          <select
                            value={plan.status}
                            onChange={(e) => handleWorkPlanStatusChange(plan.id, e.target.value as WorkPlanStatus)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${statusInfo.bg} ${statusInfo.text}`}
                          >
                            <option value="NOT_STARTED">⚪ Not Started</option>
                            <option value="IN_PROGRESS">🟡 In Progress</option>
                            <option value="COMPLETED">🟢 Completed</option>
                            <option value="NOT_COMPLETED">🔴 Not Completed / Hold</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-mono">
                          {plan.timeSpent ? plan.timeSpent : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-4 max-w-xs text-slate-600">
                          {plan.remarks ? (
                            <p className="line-clamp-2 text-slate-700">{plan.remarks}</p>
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingWorkPlan(plan);
                                setPlanRemarksText(plan.remarks || '');
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                              title="Edit Remarks"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteWorkPlan(plan.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition"
                              title="Delete Plan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {workPlans.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-16 text-center text-slate-400">
                        <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600 text-sm">No Daily Work Plans Found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          No work plans match the selected date ({selectedPlanDate}) or filter criteria.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ASSIGNED TASKS (ADMIN DELEGATION) VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'ASSIGNED_TASKS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Assigned Tasks KPI Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Tasks</span>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{taskStats.totalTasks}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Across all employees</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 uppercase">Pending</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-700 mt-2">{taskStats.pendingTasks}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting start</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600 uppercase">In Progress</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <PlayCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-700 mt-2">{taskStats.inProgressTasks}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Currently being worked</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 uppercase">Completed</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-700 mt-2">{taskStats.completedTasks}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Finished deliverables</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600 uppercase">Urgent Priority</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-rose-700 mt-2">{taskStats.urgentTasks}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Needs immediate attention</p>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, employee name, code..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={taskPriorityFilter}
                  onChange={(e) => setTaskPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={taskEmployeeFilter}
                  onChange={(e) => setTaskEmployeeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                >
                  <option value="ALL">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Main View: Kanban Board vs Table */}
          {taskViewMode === 'board' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {/* Column 1: Pending */}
              <div className="flex flex-col bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                    <h3 className="font-bold text-sm text-slate-800">Pending</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {filteredTasks.filter((t) => t.status === 'PENDING').length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-1">
                  {filteredTasks
                    .filter((t) => t.status === 'PENDING')
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailModalOpen(true);
                        }}
                        onStatusChange={handleQuickStatusChange}
                        onEdit={() => handleOpenCreateModal(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                      />
                    ))}
                  {filteredTasks.filter((t) => t.status === 'PENDING').length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">No pending tasks</div>
                  )}
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="flex flex-col bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                    <h3 className="font-bold text-sm text-slate-800">In Progress</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-1">
                  {filteredTasks
                    .filter((t) => t.status === 'IN_PROGRESS')
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailModalOpen(true);
                        }}
                        onStatusChange={handleQuickStatusChange}
                        onEdit={() => handleOpenCreateModal(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                      />
                    ))}
                  {filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">No active tasks in progress</div>
                  )}
                </div>
              </div>

              {/* Column 3: Blocked / Need Review */}
              <div className="flex flex-col bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                    <h3 className="font-bold text-sm text-slate-800">Blocked / Review</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    {filteredTasks.filter((t) => t.status === 'BLOCKED' || t.status === 'CANCELLED').length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-1">
                  {filteredTasks
                    .filter((t) => t.status === 'BLOCKED' || t.status === 'CANCELLED')
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailModalOpen(true);
                        }}
                        onStatusChange={handleQuickStatusChange}
                        onEdit={() => handleOpenCreateModal(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                      />
                    ))}
                  {filteredTasks.filter((t) => t.status === 'BLOCKED' || t.status === 'CANCELLED').length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">No blocked tasks</div>
                  )}
                </div>
              </div>

              {/* Column 4: Completed */}
              <div className="flex flex-col bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    <h3 className="font-bold text-sm text-slate-800">Completed</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {filteredTasks.filter((t) => t.status === 'COMPLETED').length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-1">
                  {filteredTasks
                    .filter((t) => t.status === 'COMPLETED')
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailModalOpen(true);
                        }}
                        onStatusChange={handleQuickStatusChange}
                        onEdit={() => handleOpenCreateModal(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                      />
                    ))}
                  {filteredTasks.filter((t) => t.status === 'COMPLETED').length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">No completed tasks yet</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Table View for Assigned Tasks */
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Task Details</th>
                      <th className="px-6 py-4">Assigned To</th>
                      <th className="px-6 py-4">Assigned By</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTasks.map((task) => {
                      const StatusIcon = statusConfig[task.status].icon;
                      const empName = task.assignedEmployeeName || task.employeeName || 'Unassigned';
                      const empCode = task.assignedEmployeeCode || task.employeeCode || '';
                      const assignerName = task.assignedByName || task.createdByName || 'Admin';

                      return (
                        <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 max-w-xs">
                            <p className="font-bold text-slate-800 line-clamp-1">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{task.description}</p>
                            )}
                            {task.completionNotes && (
                              <p className="text-[11px] text-emerald-600 font-medium mt-1 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                                Notes: {task.completionNotes}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {empName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{empName}</p>
                                {empCode && <p className="text-[10px] text-slate-400 font-mono">{empCode}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-slate-700">{assignerName}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${priorityColors[task.priority].badge}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig[task.status].bg} ${statusConfig[task.status].text}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusConfig[task.status].label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Deadline'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsDetailModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                                title="View Details"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenCreateModal(task)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                                title="Edit Task"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition"
                                title="Delete Task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTasks.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                          No delegated tasks found matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT WORK PLAN REMARKS */}
      {/* ========================================================================= */}
      {editingWorkPlan && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary-50 text-primary-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Edit Task Remarks</h3>
                  <p className="text-xs text-slate-400">{editingWorkPlan.taskName}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingWorkPlan(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Remarks / Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter manager remarks, feedback, or blockers..."
                  value={planRemarksText}
                  onChange={(e) => setPlanRemarksText(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setEditingWorkPlan(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePlanRemarks}>Save Remarks</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT DELEGATED TASK */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary-50 text-primary-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {selectedTask ? 'Edit Task Assignment' : 'Assign New Task'}
                  </h3>
                  <p className="text-xs text-slate-400">Set task requirements and assign to an employee</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare Monthly Financial Report"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assign Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.assignedEmployeeId}
                    onChange={(e) => setFormData({ ...formData, assignedEmployeeId: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium bg-white"
                  >
                    <option value={0} disabled>Select an employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.employeeCode} ({emp.role || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Who Assigned (Assigned By) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddAssignerInput(!showAddAssignerInput);
                        setNewAssignerName('');
                      }}
                      className="text-[11px] font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {showAddAssignerInput ? 'Choose from list' : '+ Add Name'}
                    </button>
                  </div>

                  {showAddAssignerInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type name (e.g. Sriram (Lead))..."
                        value={newAssignerName}
                        onChange={(e) => setNewAssignerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomAssigner();
                          }
                        }}
                        className="flex-1 px-3.5 py-2 text-sm border border-primary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium bg-primary-50/20"
                        autoFocus
                      />
                      <Button
                        type="button"
                        onClick={handleAddCustomAssigner}
                        className="text-xs py-2 px-3 shrink-0 font-bold"
                      >
                        Add
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={formData.assignedByName || (availableAssigners[0] || 'System Admin')}
                        onChange={(e) => setFormData({ ...formData, assignedByName: e.target.value, whoAssigned: e.target.value })}
                        className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium bg-white"
                      >
                        {availableAssigners.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddAssignerInput(true)}
                        className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-primary-600 transition shrink-0 cursor-pointer shadow-2xs"
                        title="Add custom assigner name"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteCurrentAssigner}
                        className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition shrink-0 cursor-pointer shadow-2xs"
                        title="Delete selected assigner option"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent ⚡</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Task Description & Requirements
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail out the requirements, instructions, resources, or deliverables expected..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : selectedTask ? 'Update Task' : 'Assign Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW DELEGATED TASK DETAILS */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedTask && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${priorityColors[selectedTask.priority].badge}`}>
                  {selectedTask.priority}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig[selectedTask.status].bg} ${statusConfig[selectedTask.status].text}`}>
                  {statusConfig[selectedTask.status].label}
                </span>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedTask.title}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Created on {new Date(selectedTask.createdAt).toLocaleDateString()} by Admin
                </p>
              </div>

              {selectedTask.description && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Assigned Employee</span>
                  <div className="flex items-center gap-2 mt-1">
                    <UserCheck className="w-4 h-4 text-primary-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {selectedTask.assignedEmployeeName || selectedTask.employeeName || 'Unassigned'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {selectedTask.assignedEmployeeCode || selectedTask.employeeCode || ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Assigned By</span>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {selectedTask.assignedByName || selectedTask.createdByName || 'Admin'}
                      </p>
                      <p className="text-[10px] text-slate-400">Task Creator</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedTask.completionNotes && (
                <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-1">
                    <CheckCheck className="w-4 h-4" /> Employee Completion Notes
                  </div>
                  <p className="text-xs text-emerald-900 whitespace-pre-wrap">{selectedTask.completionNotes}</p>
                  {selectedTask.completedAt && (
                    <p className="text-[10px] text-emerald-600 mt-2 font-medium">
                      Completed at: {new Date(selectedTask.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Update Task Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'] as TaskStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={async () => {
                        await handleQuickStatusChange(selectedTask.id, st);
                        setSelectedTask({ ...selectedTask, status: st });
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                        selectedTask.status === st
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {statusConfig[st].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenCreateModal(selectedTask);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                  </Button>
                  <Button onClick={() => setIsDetailModalOpen(false)}>Close</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onStatusChange: (id: number, status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onStatusChange, onEdit, onDelete }) => {
  const empName = task.assignedEmployeeName || task.employeeName || 'Unassigned';
  const empCode = task.assignedEmployeeCode || task.employeeCode || '';
  const assignerName = task.assignedByName || task.createdByName || 'Admin';

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${priorityColors[task.priority].badge}`}>
            {task.priority}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
              title="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <h4
          onClick={onClick}
          className="font-bold text-sm text-slate-800 hover:text-primary-600 cursor-pointer line-clamp-2 leading-snug"
        >
          {task.title}
        </h4>

        {task.description && (
          <p onClick={onClick} className="text-xs text-slate-500 mt-1 line-clamp-2 cursor-pointer">
            {task.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
              {empName.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-800 truncate block text-xs" title={empName}>
                {empName}
              </span>
              {empCode && (
                <span className="text-[10px] text-slate-400 font-mono block">
                  {empCode}
                </span>
              )}
            </div>
          </div>

          {task.dueDate && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              <Calendar className="w-3 h-3 text-amber-500" />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-400 font-medium">
          Assigned by: <span className="font-semibold text-slate-600">{assignerName}</span>
        </div>

        {task.completionNotes && (
          <div className="mt-2 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-medium truncate">
            ✓ Notes: {task.completionNotes}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTasks;
