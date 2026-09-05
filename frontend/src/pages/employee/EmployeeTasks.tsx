import React, { useState, useEffect, useMemo } from 'react';
import { taskService } from '../../services/taskService';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
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
  X
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'>('ALL');

  // Complete / Status Update Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<TaskStatus>('COMPLETED');
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getMyTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load my tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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

  if (loading && tasks.length === 0) {
    return <Loading fullScreen message="Loading Your Assigned Tasks..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">My Assigned Tasks</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
              <Sparkles className="w-3 h-3 mr-1" /> Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track tasks assigned to you by admin, manage progress, and submit work completion notes.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Tasks</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total assignments</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase">In Progress</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">{stats.inProgress}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Currently working</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{stats.completed}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Delivered to admin</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
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
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const StatusIcon = statusConfig[task.status].icon;
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
                  : 'border-l-primary-500'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${priorityColors[task.priority].badge}`}>
                      {task.priority === 'URGENT' && <Flame className="w-3 h-3 mr-1" />}
                      {task.priority} Priority
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig[task.status].bg} ${statusConfig[task.status].text}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig[task.status].label}
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-800">{task.title}</h3>

                  {task.description && (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Deadline'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span>Assigned by Admin on {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {task.completionNotes && (
                    <div className="mt-3 bg-emerald-50/80 p-3 rounded-xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" /> Submitted Completion Notes:
                      </p>
                      <p className="text-xs text-emerald-900 mt-1">{task.completionNotes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  {task.status === 'PENDING' && (
                    <Button
                      onClick={() => handleQuickStart(task)}
                      className="text-xs py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white w-full flex items-center justify-center gap-1.5"
                    >
                      <PlayCircle className="w-4 h-4" /> Start Working
                    </Button>
                  )}

                  {task.status !== 'COMPLETED' && (
                    <Button
                      onClick={() => handleOpenStatusModal(task, 'COMPLETED')}
                      className="text-xs py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white w-full flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Completed
                    </Button>
                  )}

                  <button
                    onClick={() =>
                      handleOpenStatusModal(
                        task,
                        task.status === 'BLOCKED' ? 'IN_PROGRESS' : 'BLOCKED'
                      )
                    }
                    className="text-xs py-2 px-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-semibold w-full transition text-center"
                  >
                    {task.status === 'BLOCKED' ? 'Unblock Task' : 'Report Issue / Blocked'}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="h-12 w-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-700 text-base">No Tasks Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You are all caught up! When administrator assigns you new deliverables or work items, they will appear right here.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Update Status & Completion Notes */}
      {isUpdateModalOpen && selectedTask && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary-50 text-primary-600">
                  <MessageSquareText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Update Task Status</h3>
                  <p className="text-xs text-slate-400">{selectedTask.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatusUpdate} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['IN_PROGRESS', 'COMPLETED', 'BLOCKED'] as TaskStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetStatus(st)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                        targetStatus === st
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {statusConfig[st].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Completion Notes / Work Summary
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide details of the work completed, links, or notes for the admin..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUpdateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Submit Update'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTasks;
