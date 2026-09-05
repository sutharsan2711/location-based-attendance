import React, { useState, useEffect, useMemo } from 'react';
import { taskService } from '../../services/taskService';
import { employeeService } from '../../services/employeeService';
import { Task, TaskPriority, TaskRequest, TaskStats, TaskStatus } from '../../types/task';
import { Employee } from '../../types/employee';
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
  UserCheck
} from 'lucide-react';

const priorityColors: Record<TaskPriority, { bg: string; text: string; border: string; badge: string }> = {
  LOW: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700' },
  MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  HIGH: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
  URGENT: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', badge: 'bg-rose-100 text-rose-800' },
};

const statusConfig: Record<TaskStatus, { label: string; bg: string; text: string; icon: any }> = {
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700', icon: PlayCircle },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  BLOCKED: { label: 'Blocked', bg: 'bg-rose-50', text: 'text-rose-700', icon: Ban },
  CANCELLED: { label: 'Cancelled', bg: 'bg-slate-100', text: 'text-slate-600', icon: X },
};

const AdminTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    urgentTasks: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<TaskRequest>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assignedEmployeeId: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, empRes, statsRes] = await Promise.all([
        taskService.getAllTasks(),
        employeeService.getAll(),
        taskService.getStats(),
      ]);
      setTasks(tasksRes);
      setEmployees(empRes);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load task management data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const empName = t.assignedEmployeeName || t.employeeName || '';
      const empCode = t.assignedEmployeeCode || t.employeeCode || '';
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        empCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      const targetEmpId = t.assignedEmployeeId || t.employeeId;
      const matchEmployee = employeeFilter === 'ALL' || String(targetEmpId) === employeeFilter;

      return matchSearch && matchStatus && matchPriority && matchEmployee;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, employeeFilter]);

  const handleOpenCreateModal = (taskToEdit?: Task) => {
    if (taskToEdit) {
      setSelectedTask(taskToEdit);
      const empId = taskToEdit.assignedEmployeeId || taskToEdit.employeeId || 0;
      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description || '',
        priority: taskToEdit.priority,
        status: taskToEdit.status,
        dueDate: taskToEdit.dueDate ? taskToEdit.dueDate.substring(0, 10) : '',
        assignedEmployeeId: empId,
        employeeId: empId,
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
      });
    }
    setIsCreateModalOpen(true);
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
      const payload: TaskRequest = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        priority: formData.priority,
        status: formData.status || 'PENDING',
        dueDate: formData.dueDate || undefined,
        assignedEmployeeId: targetEmpId,
        employeeId: targetEmpId,
      };

      if (selectedTask) {
        await taskService.updateTask(selectedTask.id, payload);
      } else {
        await taskService.createTask(payload);
      }
      setIsCreateModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to save task', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save task. Please try again.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(id);
        if (selectedTask?.id === id) {
          setIsDetailModalOpen(false);
        }
        await fetchData();
      } catch (err) {
        console.error('Failed to delete task', err);
        alert('Failed to delete task.');
      }
    }
  };

  const handleQuickStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      await fetchData();
    } catch (err) {
      console.error('Failed to update task status', err);
    }
  };

  if (loading && tasks.length === 0) {
    return <Loading fullScreen message="Loading Task Management Module..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Task Management & Assignments</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
              <Sparkles className="w-3 h-3 mr-1" /> Live
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Assign work items, establish priorities, set deadlines, and track employee progress in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'board' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" /> Table
            </button>
          </div>
          <Button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-2 shadow-lg shadow-primary-500/20"
          >
            <Plus className="h-4 w-4" />
            Assign New Task
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Tasks</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{stats.totalTasks}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all employees</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase">Pending</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{stats.pendingTasks}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting start</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase">In Progress</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">{stats.inProgressTasks}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Currently being worked</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{stats.completedTasks}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Finished deliverables</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase">Urgent Priority</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{stats.urgentTasks}</p>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
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
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
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
      {viewMode === 'board' ? (
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
        /* Table View */
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
                      No tasks found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Create / Edit Task */}
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

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assign Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.assignedEmployeeId}
                  onChange={(e) => setFormData({ ...formData, assignedEmployeeId: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                >
                  <option value={0} disabled>Select an employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.employeeCode} ({emp.role || 'Staff'})
                    </option>
                  ))}
                </select>
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

      {/* Modal: View Task Details & Updates */}
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
