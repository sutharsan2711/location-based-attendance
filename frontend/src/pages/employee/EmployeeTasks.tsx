import React, { useState, useEffect, useMemo } from 'react';
import { taskService } from '../../services/taskService';
import { workPlanService } from '../../services/workPlanService';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { DailyWorkPlanItem, WorkPlanPriority, WorkPlanStatus } from '../../types/workPlan';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import AddTaskModal from '../../components/AddTaskModal';
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  Ban,
  Search,
  Calendar,
  Sparkles,
  Flame,
  CheckCheck,
  FileText,
  AlertTriangle,
  ArrowRight,
  MessageSquareText,
  Check,
  X,
  ListTodo,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
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

const EmployeeTasks: React.FC = () => {
  // Panel View Switch: 'DAILY_PLAN' | 'ASSIGNED'
  const [panelView, setPanelView] = useState<'DAILY_PLAN' | 'ASSIGNED'>('DAILY_PLAN');

  // Assigned Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'>('ALL');

  // Daily Work Plan State
  const [plans, setPlans] = useState<DailyWorkPlanItem[]>([]);
  const [plansLoading, setPlansLoading] = useState<boolean>(false);
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DailyWorkPlanItem | null>(null);

  // Complete / Status Update Modal for Assigned Tasks
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<TaskStatus>('COMPLETED');
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchTasks = async () => {
    try {
      const data = await taskService.getMyTasks();
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to load my tasks', err);
    }
  };

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const data = await workPlanService.getTodayDashboard();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Failed to load daily work plans', err);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchPlans()]);
      setLoading(false);
    };
    init();
  }, []);

  // ── Work Plan Actions ──
  const handleSavePlan = async (data: {
    taskName: string;
    category: string;
    priority: WorkPlanPriority;
    targetDescription: string;
    remarks: string;
  }) => {
    if (editingPlan) {
      await workPlanService.updatePlan(editingPlan.id, data);
    } else {
      await workPlanService.createPlan(data);
    }
    await fetchPlans();
  };

  const handleDeletePlan = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this daily work plan task?')) return;
    try {
      await workPlanService.deletePlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert('Failed to delete work plan item');
    }
  };

  const handlePlanStatusChange = async (id: number, status: WorkPlanStatus) => {
    try {
      const plan = plans.find((p) => p.id === id);
      await workPlanService.updateStatus(id, {
        status,
        reasonRemarks: plan?.reasonRemarks,
        timeSpent: plan?.timeSpent,
      });
      await fetchPlans();
    } catch (err) {
      console.error('Failed to update work plan status', err);
    }
  };

  // ── Assigned Tasks Filter & Stats ──
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTab = activeTab === 'ALL' || t.status === activeTab;
      return matchSearch && matchTab;
    });
  }, [tasks, searchQuery, activeTab]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'PENDING').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const urgent = tasks.filter((t) => t.priority === 'URGENT' && t.status !== 'COMPLETED').length;
    return { total, pending, inProgress, completed, urgent };
  }, [tasks]);

  const planStats = useMemo(() => {
    const total = plans.length;
    const completed = plans.filter((p) => p.status === 'COMPLETED').length;
    const inProgress = plans.filter((p) => p.status === 'IN_PROGRESS').length;
    const notCompleted = plans.filter((p) => p.status === 'NOT_COMPLETED').length;
    const kpi = total > 0 ? Math.round(((completed * 100 + inProgress * 50) / total)) : 0;
    return { total, completed, inProgress, notCompleted, kpi };
  }, [plans]);

  const handleOpenStatusModal = (task: Task, status: TaskStatus) => {
    setSelectedTask(task);
    setTargetStatus(status);
    setCompletionNotes(task.completionNotes || '');
    setIsUpdateModalOpen(true);
  };

  const handleSaveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      setIsSubmitting(true);
      await taskService.updateStatus(selectedTask.id, {
        status: targetStatus,
        completionNotes: completionNotes.trim() ? completionNotes.trim() : undefined,
      });
      setIsUpdateModalOpen(false);
      await fetchTasks();
    } catch (err) {
      console.error('Failed to update task status', err);
      alert('Failed to update task status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStart = async (task: Task) => {
    try {
      await taskService.updateStatus(task.id, { status: 'IN_PROGRESS' });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to start task', err);
    }
  };

  if (loading) {
    return <Loading message="Loading Tasks and Daily Work Plans..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
      {/* ── 1. Page Header & View Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ListTodo className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Task & Daily Work Plan Management
              </h1>
              <p className="text-xs text-slate-500">
                Manage your daily planned work and monitor manager-assigned project tasks
              </p>
            </div>
          </div>
        </div>

        {/* View Switch Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 flex-wrap">
          <button
            onClick={() => setPanelView('DAILY_PLAN')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              panelView === 'DAILY_PLAN'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>Today's Work Plan ({plans.length})</span>
          </button>

          <button
            onClick={() => setPanelView('ASSIGNED')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              panelView === 'ASSIGNED'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Assigned Tasks ({tasks.length})</span>
          </button>
        </div>
      </div>

      {/* ── VIEW 1: DAILY WORK PLAN ── */}
      {panelView === 'DAILY_PLAN' && (
        <div className="space-y-6">
          {/* Work Plan Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Today's Planned</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <ListTodo className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">{planStats.total}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tasks scheduled</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase">Completed</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2">{planStats.completed}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Delivered today</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 uppercase">In Progress</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 mt-2">{planStats.inProgress}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Underway</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 uppercase">Today's KPI Score</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-700 mt-2">{planStats.kpi}%</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Calculated score</p>
            </div>
          </div>

          {/* Daily Work Plan Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 gap-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Today's Daily Work Plan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Plan tasks in the morning and update actual status and remarks throughout the day
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingPlan(null);
                  setIsAddPlanModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add Daily Task</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">S.No</th>
                    <th className="py-3 px-4">Planned Task</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Target for Today</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Time Spent</th>
                    <th className="py-3 px-4 w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ListTodo className="h-8 w-8 text-slate-300" />
                          <span className="font-semibold text-slate-600">No daily tasks planned yet for today.</span>
                          <button
                            onClick={() => setIsAddPlanModalOpen(true)}
                            className="text-blue-600 font-bold text-xs hover:underline mt-1"
                          >
                            + Click here to add your morning task
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    plans.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {p.taskName}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {p.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              p.priority === 'HIGH'
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : p.priority === 'MEDIUM'
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : p.priority === 'LOW'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            {p.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {p.targetDescription || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={p.status}
                            onChange={(e) => handlePlanStatusChange(p.id, e.target.value as WorkPlanStatus)}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            <option value="COMPLETED">✅ Completed</option>
                            <option value="IN_PROGRESS">🟡 In Progress</option>
                            <option value="NOT_COMPLETED">🔴 Not Completed</option>
                            <option value="NOT_STARTED">⚪ Not Started</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {p.timeSpent ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[11px]">
                              {p.timeSpent}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingPlan(p);
                                setIsAddPlanModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Task"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(p.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 2: ASSIGNED TASKS FROM ADMIN ── */}
      {panelView === 'ASSIGNED' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Tasks</span>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{stats.total}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Total assignments</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600 uppercase">In Progress</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <PlayCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-700 mt-2">{stats.inProgress}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Currently working</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 uppercase">Completed</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-700 mt-2">{stats.completed}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Delivered to admin</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600 uppercase">Urgent Items</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-rose-700 mt-2">{stats.urgent}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Requires priority</p>
            </div>
          </div>

          {/* Tabs & Search */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none flex-nowrap">
              {(
                [
                  { id: 'ALL', label: 'All Tasks' },
                  { id: 'PENDING', label: 'Pending' },
                  { id: 'IN_PROGRESS', label: 'In Progress' },
                  { id: 'COMPLETED', label: 'Completed' },
                  { id: 'BLOCKED', label: 'Blocked' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
                No assigned tasks match your filter.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const StatusIcon = statusConfig[task.status]?.icon || Clock;
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) &&
                  task.status !== 'COMPLETED';

                return (
                  <Card
                    key={task.id}
                    className={`p-5 transition-all hover:shadow-md border-l-4 ${
                      task.status === 'COMPLETED'
                        ? 'border-l-emerald-500'
                        : task.priority === 'URGENT'
                        ? 'border-l-rose-500'
                        : 'border-l-blue-500'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              priorityColors[task.priority]?.badge || 'bg-slate-100'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Assigned by {task.assignedByName || 'Admin'}
                          </span>
                          {isOverdue && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Overdue
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-800">{task.title}</h3>
                        {task.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                        )}

                        {task.completionNotes && (
                          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-800">
                            <span className="font-bold">Completion Notes: </span>
                            <span>{task.completionNotes}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold ${
                            statusConfig[task.status]?.bg || 'bg-slate-100'
                          } ${statusConfig[task.status]?.text || 'text-slate-700'}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{statusConfig[task.status]?.label || task.status}</span>
                        </span>

                        {task.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleOpenStatusModal(task, 'COMPLETED')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Daily Plan Modal */}
      <AddTaskModal
        isOpen={isAddPlanModalOpen}
        onClose={() => {
          setIsAddPlanModalOpen(false);
          setEditingPlan(null);
        }}
        onSave={handleSavePlan}
        editItem={editingPlan}
      />

      {/* Update Assigned Task Modal */}
      {isUpdateModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Update Task Status</h3>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatusUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="COMPLETED">✅ Completed</option>
                  <option value="IN_PROGRESS">🟡 In Progress</option>
                  <option value="BLOCKED">🔴 Blocked</option>
                  <option value="PENDING">⚪ Pending</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Completion Notes / Remarks</label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Provide delivery notes, links, or blockers..."
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Saving...' : 'Save Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTasks;
