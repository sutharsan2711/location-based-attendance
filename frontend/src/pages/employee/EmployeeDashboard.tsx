import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import { workPlanService } from '../../services/workPlanService';
import { attendanceService } from '../../services/attendanceService';
import {
  DailyWorkPlanItem,
  DailyWorkSummary,
  TodayDashboardResponse,
  WorkPlanPriority,
  WorkPlanStatus,
} from '../../types/workPlan';
import { Attendance } from '../../types/attendance';
import Loading from '../../components/Loading';
import KpiGauge, { getKpiTier } from '../../components/KpiGauge';
import PriorityDonutChart from '../../components/PriorityDonutChart';
import CompletionDonutChart from '../../components/CompletionDonutChart';
import AddTaskModal from '../../components/AddTaskModal';
import BulkUpdateModal from '../../components/BulkUpdateModal';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CheckSquare,
  ListTodo,
  TrendingUp,
  Save,
  LogIn,
  LogOut,
  RefreshCw,
  Award,
  XCircle,
  Calendar,
  ExternalLink,
  ArrowRight,
  X,
} from 'lucide-react';

const PRIORITY_BADGES: Record<WorkPlanPriority, { label: string; bg: string; text: string; dot: string }> = {
  HIGH: { label: 'High', bg: 'bg-rose-50 border-rose-200/80', text: 'text-rose-700 font-bold', dot: 'bg-rose-500' },
  MEDIUM: { label: 'Medium', bg: 'bg-amber-50 border-amber-200/80', text: 'text-amber-700 font-bold', dot: 'bg-amber-500' },
  LOW: { label: 'Low', bg: 'bg-emerald-50 border-emerald-200/80', text: 'text-emerald-700 font-bold', dot: 'bg-emerald-500' },
  NOT_SET: { label: 'Not Set', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const STATUS_BADGES: Record<WorkPlanStatus, { label: string; bg: string; text: string; icon: string }> = {
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-50 border-emerald-200/80', text: 'text-emerald-700 font-bold', icon: '✅' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-50 border-amber-200/80', text: 'text-amber-700 font-bold', icon: '🟡' },
  NOT_COMPLETED: { label: 'Not Completed', bg: 'bg-rose-50 border-rose-200/80', text: 'text-rose-700 font-bold', icon: '🔴' },
  NOT_STARTED: { label: 'Not Started', bg: 'bg-blue-50 border-blue-200/80', text: 'text-blue-700 font-bold', icon: '⚪' },
};

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { latitude, longitude, accuracy, getCoordinates } = useGeolocation();

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<TodayDashboardResponse | null>(null);
  const [plans, setPlans] = useState<DailyWorkPlanItem[]>([]);
  const [summary, setSummary] = useState<DailyWorkSummary>({
    totalTasks: 0,
    completedCount: 0,
    inProgressCount: 0,
    notCompletedCount: 0,
    notStartedCount: 0,
    kpiScore: 75,
    kpiLabel: 'Good',
    highPriorityCount: 0,
    mediumPriorityCount: 0,
    lowPriorityCount: 0,
    notSetPriorityCount: 0,
    checkInTime: '--:--',
    checkOutTime: '--:--',
    workHoursFormatted: '--',
  });
  const [notesText, setNotesText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modals state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DailyWorkPlanItem | null>(null);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);

  // Swipes & Attendance History Modal State
  const [showSwipesModal, setShowSwipesModal] = useState(false);
  const [recentSwipes, setRecentSwipes] = useState<Attendance[]>([]);
  const [swipesLoading, setSwipesLoading] = useState(false);

  // Attendance State
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [swipeError, setSwipeError] = useState<string | null>(null);
  const [swipeSuccess, setSwipeSuccess] = useState<string | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesMessage, setNotesMessage] = useState<string | null>(null);

  // Live Time
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const greetingText =
    currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Recalculate summary metrics & KPI score locally in real time
  const updateLocalSummary = (newPlans: DailyWorkPlanItem[], currentAttendance?: Attendance | null) => {
    const total = newPlans.length;
    const completed = newPlans.filter((p) => p.status === 'COMPLETED').length;
    const inProgress = newPlans.filter((p) => p.status === 'IN_PROGRESS').length;
    const notCompleted = newPlans.filter((p) => p.status === 'NOT_COMPLETED').length;
    const notStarted = newPlans.filter((p) => p.status === 'NOT_STARTED').length;

    const high = newPlans.filter((p) => p.priority === 'HIGH').length;
    const medium = newPlans.filter((p) => p.priority === 'MEDIUM').length;
    const low = newPlans.filter((p) => p.priority === 'LOW').length;
    const notSet = newPlans.filter((p) => p.priority === 'NOT_SET').length;

    // KPI calculation formula: Completed: 100%, In-Progress: 50%, Not Done: 0%
    let kpi = 75;
    if (total > 0) {
      kpi = Math.round(((completed * 100 + inProgress * 50) / total));
    }

    const tier = getKpiTier(kpi);

    const att = currentAttendance !== undefined ? currentAttendance : attendance;
    let checkIn = '--:--';
    let checkOut = '--:--';
    let hours = '--';

    if (att?.loginTime) {
      const d = new Date(att.loginTime);
      checkIn = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (att?.logoutTime) {
      const d = new Date(att.logoutTime);
      checkOut = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (att?.loginTime && att?.logoutTime) {
      const diffMs = new Date(att.logoutTime).getTime() - new Date(att.loginTime).getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      hours = `${diffHrs}h ${diffMins}m`;
    } else if (att?.loginTime) {
      const diffMs = new Date().getTime() - new Date(att.loginTime).getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      hours = `${diffHrs}h ${diffMins}m`;
    }

    setSummary({
      totalTasks: total,
      completedCount: completed,
      inProgressCount: inProgress,
      notCompletedCount: notCompleted,
      notStartedCount: notStarted,
      highPriorityCount: high,
      mediumPriorityCount: medium,
      lowPriorityCount: low,
      notSetPriorityCount: notSet,
      kpiScore: kpi,
      kpiLabel: tier.label,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      workHoursFormatted: hours,
    });
  };

  // ── 1. Fetch Dashboard Data ──
  const fetchDashboard = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [res, attRes] = await Promise.all([
        workPlanService.getTodayDashboard().catch(() => null),
        attendanceService.getTodayAttendance().catch(() => null),
      ]);

      if (res) {
        setDashboardData(res);
        setPlans(res.plans || []);
        if (res.note) {
          setNotesText(res.note.notes || '');
        }
      }

      if (attRes) {
        setAttendance(attRes);
      }

      const activePlans = res?.plans || [];
      updateLocalSummary(activePlans, attRes);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── 2. Open Swipes & History Modal ──
  const handleOpenSwipesModal = async () => {
    setShowSwipesModal(true);
    try {
      setSwipesLoading(true);
      const data = await attendanceService.getHistory();
      setRecentSwipes(data || []);
    } catch (err) {
      console.error('Failed to load swipe history', err);
    } finally {
      setSwipesLoading(false);
    }
  };

  // ── 3. Add / Edit Task Handler ──
  const handleSaveTask = async (data: {
    taskName: string;
    category: string;
    priority: WorkPlanPriority;
    targetDescription: string;
    remarks: string;
  }) => {
    if (editingItem) {
      const updated = await workPlanService.updatePlan(editingItem.id, data);
      const updatedList = plans.map((p) => (p.id === editingItem.id ? updated : p));
      setPlans(updatedList);
      updateLocalSummary(updatedList);
      setEditingItem(null);
    } else {
      const created = await workPlanService.createPlan(data);
      const updatedList = [...plans, created];
      setPlans(updatedList);
      updateLocalSummary(updatedList);
    }
  };

  // ── 4. Delete Task Handler ──
  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this planned task?')) return;
    try {
      await workPlanService.deletePlan(id);
      const updatedList = plans.filter((p) => p.id !== id);
      setPlans(updatedList);
      updateLocalSummary(updatedList);
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  // ── 5. Update Single Status ──
  const handleStatusChange = async (id: number, newStatus: WorkPlanStatus) => {
    try {
      const target = plans.find((p) => p.id === id);
      const updated = await workPlanService.updateStatus(id, {
        status: newStatus,
        reasonRemarks: target?.reasonRemarks,
        timeSpent: target?.timeSpent,
      });
      const updatedList = plans.map((p) => (p.id === id ? updated : p));
      setPlans(updatedList);
      updateLocalSummary(updatedList);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // ── 6. Bulk Update Handler ──
  const handleBulkUpdate = async (
    updates: {
      id: number;
      status: WorkPlanStatus;
      reasonRemarks?: string;
      timeSpent?: string;
    }[]
  ) => {
    const res = await workPlanService.bulkUpdateStatus(updates);
    if (res.plans) {
      setPlans(res.plans);
      updateLocalSummary(res.plans);
    }
  };

  // ── 7. Save Notes Handler ──
  const handleSaveNotes = async () => {
    try {
      setNotesSaving(true);
      setNotesMessage(null);
      await workPlanService.saveNote({
        notes: notesText,
        kpiScore: summary.kpiScore,
      });
      setNotesMessage('Notes saved successfully!');
      setTimeout(() => setNotesMessage(null), 3000);
    } catch (err) {
      setNotesMessage('Failed to save notes.');
    } finally {
      setNotesSaving(false);
    }
  };

  // ── 8. Attendance Swipe Handler (Check In / Check Out) ──
  const handleSwipe = async () => {
    setSwipeError(null);
    setSwipeSuccess(null);
    setActionLoading(true);

    try {
      let lat = latitude;
      let lng = longitude;
      let acc = accuracy || 15;

      if (!lat || !lng) {
        try {
          const coords = await getCoordinates();
          lat = coords.latitude;
          lng = coords.longitude;
          acc = coords.accuracy || 15;
        } catch (e) {
          console.warn('Geolocation fallback:', e);
        }
      }

      const hasCheckedIn =
        attendance?.status === 'LOGGED_IN' ||
        attendance?.status === 'COMPLETED' ||
        Boolean(attendance?.loginTime);
      const hasCheckedOut = attendance?.status === 'COMPLETED' || Boolean(attendance?.logoutTime);

      if (!hasCheckedIn) {
        await attendanceService.loginAttendance({
          latitude: lat || 13.0827,
          longitude: lng || 80.2707,
          accuracy: acc,
        });
        setSwipeSuccess('Checked in successfully! Have a great productive day.');
      } else if (!hasCheckedOut) {
        await attendanceService.logoutAttendance({
          latitude: lat || 13.0827,
          longitude: lng || 80.2707,
          accuracy: acc,
        });
        setSwipeSuccess('Checked out successfully! Have a wonderful evening.');
      } else {
        setSwipeError('You have already completed attendance for today.');
        setActionLoading(false);
        return;
      }

      await fetchDashboard(true);
    } catch (err: any) {
      setSwipeError(err?.response?.data?.error || err.message || 'Failed to record attendance swipe.');
    } finally {
      setActionLoading(false);
    }
  };

  const displayName = user?.name || dashboardData?.employee?.name || 'Employee';
  const hasCheckedIn =
    attendance?.status === 'LOGGED_IN' ||
    attendance?.status === 'COMPLETED' ||
    Boolean(attendance?.loginTime);
  const hasCheckedOut = attendance?.status === 'COMPLETED' || Boolean(attendance?.logoutTime);

  if (loading) {
    return <Loading fullScreen message="Loading Eclearnix EDTECH Portal..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
      {/* ── 1. Top Greeting & Motivational Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 md:p-8 text-white shadow-xl shadow-blue-900/15">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-8 h-32 w-32 rounded-full bg-blue-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-semibold text-blue-100 border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Eclearnix EDTECH • Plan • Perform • Progress</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {greetingText}, {displayName} 👋
            </h1>
            <p className="text-sm md:text-base text-blue-100 font-medium italic">
              "Discipline today leads to success tomorrow."
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => {
                setEditingItem(null);
                setIsAddTaskOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-800 hover:bg-blue-50 font-bold text-xs shadow-lg shadow-black/10 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-blue-600" />
              <span>+ Add Morning Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Swipe status notification alerts */}
      {swipeSuccess && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-slide">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{swipeSuccess}</span>
          </div>
          <button onClick={() => setSwipeSuccess(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">✕</button>
        </div>
      )}
      {swipeError && (
        <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold animate-slide">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{swipeError}</span>
          </div>
          <button onClick={() => setSwipeError(null)} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
        </div>
      )}

      {/* ── 2. Top 6 KPI Metric Overview Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Today's Tasks */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Tasks</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ListTodo className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800">{summary.totalTasks}</span>
            <span className="text-[10px] font-semibold text-slate-400">planned</span>
          </div>
        </div>

        {/* 2. Completed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Completed</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600">{summary.completedCount}</span>
            <span className="text-[10px] font-semibold text-emerald-600/70">done</span>
          </div>
        </div>

        {/* 3. In Progress */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">In Progress</span>
            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600">{summary.inProgressCount}</span>
            <span className="text-[10px] font-semibold text-amber-600/70">active</span>
          </div>
        </div>

        {/* 4. Not Completed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Not Done</span>
            <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-600">{summary.notCompletedCount}</span>
            <span className="text-[10px] font-semibold text-rose-600/70">pending</span>
          </div>
        </div>

        {/* 5. Today's KPI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Today's KPI</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl font-black text-blue-700">{summary.kpiScore}%</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {summary.kpiLabel}
            </span>
          </div>
        </div>

        {/* 6. Attendance Card with View Swipes & History click trigger */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 text-white p-4 rounded-2xl shadow-md flex flex-col justify-between relative group">
          <div className="flex items-center justify-between">
            <button
              onClick={handleOpenSwipesModal}
              className="text-[10px] font-bold text-slate-300 uppercase tracking-wider hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
              title="Click to view full Swipes & History"
            >
              <span>Attendance</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-70" />
            </button>
            <button
              onClick={handleSwipe}
              disabled={actionLoading || (hasCheckedIn && hasCheckedOut)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                !hasCheckedIn
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                  : !hasCheckedOut
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
              title={!hasCheckedIn ? 'Click to Check In' : !hasCheckedOut ? 'Click to Check Out' : 'Attendance Completed'}
            >
              {!hasCheckedIn ? (
                <>
                  <LogIn className="h-3 w-3" />
                  <span>Check In</span>
                </>
              ) : !hasCheckedOut ? (
                <>
                  <LogOut className="h-3 w-3" />
                  <span>Check Out</span>
                </>
              ) : (
                <span>Done ✓</span>
              )}
            </button>
          </div>

          <div
            onClick={handleOpenSwipesModal}
            className="mt-2 space-y-1 text-[11px] cursor-pointer hover:bg-white/5 p-1.5 rounded-xl transition-colors"
            title="Click to view Swipes & History"
          >
            <div className="flex items-center justify-between text-slate-300">
              <span>In:</span>
              <span className="font-bold text-white">{summary.checkInTime}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Out:</span>
              <span className="font-bold text-white">{summary.checkOutTime}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-700">
              <span>Hours:</span>
              <span className="font-bold text-emerald-400">{summary.workHoursFormatted}</span>
            </div>
          </div>

          <button
            onClick={handleOpenSwipesModal}
            className="mt-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center justify-center gap-1 hover:underline cursor-pointer"
          >
            <span>View Swipes & History</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      {/* ── 3. Morning - Daily Work Plan Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Morning Work Plan Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                <h2 className="text-base font-bold text-slate-800">
                  Morning - Daily Work Plan
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Plan your tasks for today before 10:30 AM
              </p>
            </div>

            <button
              onClick={() => {
                setEditingItem(null);
                setIsAddTaskOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">S.No</th>
                  <th className="py-3 px-4">Planned Task</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Target for Today</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ListTodo className="h-8 w-8 text-slate-300" />
                        <span className="font-medium">No planned tasks for today yet.</span>
                        <button
                          onClick={() => setIsAddTaskOpen(true)}
                          className="text-blue-600 font-semibold text-xs hover:underline mt-1 cursor-pointer"
                        >
                          + Click here to add your first morning task
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  plans.map((p, idx) => {
                    const pri = PRIORITY_BADGES[p.priority] || PRIORITY_BADGES.NOT_SET;
                    return (
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
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] ${pri.bg} ${pri.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${pri.dot}`} />
                            <span>{pri.label}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {p.targetDescription || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 italic">
                          {p.remarks || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingItem(p);
                                setIsAddTaskOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Edit Task"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(p.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Today's Planned Tasks Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Today's Planned Tasks</h3>
              <span className="text-[10px] font-semibold text-slate-400">By Priority</span>
            </div>
            <div className="pt-2">
              <PriorityDonutChart summary={summary} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Evening - Work Status Update Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Evening Work Status Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <h2 className="text-base font-bold text-slate-800">
                  Evening - Work Status Update
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your actual progress before 6:30 PM
              </p>
            </div>

            <button
              onClick={() => setIsBulkUpdateOpen(true)}
              disabled={plans.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Update All</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">S.No</th>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reason / Remarks</th>
                  <th className="py-3 px-4">Time Spent</th>
                  <th className="py-3 px-4 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No tasks to update for today.
                    </td>
                  </tr>
                ) : (
                  plans.map((p, idx) => {
                    const st = STATUS_BADGES[p.status] || STATUS_BADGES.NOT_STARTED;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {p.taskName}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value as WorkPlanStatus)}
                            className={`px-2 py-1 rounded-lg border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 ${st.bg} ${st.text}`}
                          >
                            <option value="COMPLETED">✅ Completed</option>
                            <option value="IN_PROGRESS">🟡 In Progress</option>
                            <option value="NOT_COMPLETED">🔴 Not Completed</option>
                            <option value="NOT_STARTED">⚪ Not Started</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {p.reasonRemarks || '—'}
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
                          <button
                            onClick={() => {
                              setEditingItem(p);
                              setIsAddTaskOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Today's Task Completion Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Today's Task Completion</h3>
              <span className="text-[10px] font-semibold text-slate-400">Progress</span>
            </div>
            <div className="pt-2">
              <CompletionDonutChart summary={summary} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Bottom 3-Card Section: KPI Score + Task Summary + My Notes ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Card 1: Today's KPI Score */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Today's KPI Score</h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Speedometer</span>
          </div>

          <div className="my-auto py-2">
            <KpiGauge score={summary.kpiScore} label={summary.kpiLabel} />
          </div>
        </div>

        {/* Card 2: Task Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">Task Summary</h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              Total: {summary.totalTasks}
            </span>
          </div>

          {/* 4 Status Badges */}
          <div className="space-y-2.5 my-auto py-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-900">Completed</span>
              </div>
              <span className="text-sm font-black text-emerald-700">{summary.completedCount}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-amber-900">In Progress</span>
              </div>
              <span className="text-sm font-black text-amber-700">{summary.inProgressCount}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-rose-900">Not Completed</span>
              </div>
              <span className="text-sm font-black text-rose-700">{summary.notCompletedCount}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-blue-900">Not Started</span>
              </div>
              <span className="text-sm font-black text-blue-700">{summary.notStartedCount}</span>
            </div>
          </div>

          {/* Progress Bar */}
          {summary.totalTasks > 0 && (
            <div className="pt-2">
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  style={{ width: `${(summary.completedCount / summary.totalTasks) * 100}%` }}
                  className="bg-emerald-500"
                />
                <div
                  style={{ width: `${(summary.inProgressCount / summary.totalTasks) * 100}%` }}
                  className="bg-amber-500"
                />
                <div
                  style={{ width: `${(summary.notCompletedCount / summary.totalTasks) * 100}%` }}
                  className="bg-rose-500"
                />
                <div
                  style={{ width: `${(summary.notStartedCount / summary.totalTasks) * 100}%` }}
                  className="bg-blue-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Card 3: My Notes / Comments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <h3 className="font-bold text-slate-800 text-sm">My Notes / Comments</h3>
            </div>
            {notesMessage && (
              <span className="text-[10px] font-semibold text-emerald-600 animate-fade-in">
                {notesMessage}
              </span>
            )}
          </div>

          <div className="flex-1 my-3 flex flex-col">
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Record daily achievements, challenges, blockers, or notes for the manager..."
              className="w-full flex-1 min-h-[140px] p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <button
            onClick={handleSaveNotes}
            disabled={notesSaving}
            className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{notesSaving ? 'Saving...' : 'Save Notes'}</span>
          </button>
        </div>
      </div>

      {/* ── 6. Footer ── */}
      <footer className="pt-6 pb-2 text-center text-xs text-slate-400 border-t border-slate-200/70 space-y-1">
        <p className="font-bold text-slate-600">
          Eclearnix EDTECH | Making Education a Global Impact
        </p>
        <p className="text-[11px] text-slate-400">
          Work Smart | Stay Focused | Grow Together
        </p>
      </footer>

      {/* ── Modals ── */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => {
          setIsAddTaskOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveTask}
        editItem={editingItem}
      />

      <BulkUpdateModal
        isOpen={isBulkUpdateOpen}
        onClose={() => setIsBulkUpdateOpen(false)}
        plans={plans}
        onSave={handleBulkUpdate}
      />

      {/* ── View Swipes & History Modal ── */}
      {showSwipesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    My Attendance Swipes & History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Today's punch activity and recent attendance records
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSwipesModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Today's Punch Summary Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-900">Today's Punch Activity</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-blue-700 border border-blue-200 shadow-2xs">
                    {attendance?.timingStatus || 'PRESENT'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-semibold block">Check-In</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">{summary.checkInTime}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-semibold block">Check-Out</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">{summary.checkOutTime}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-semibold block">Work Hours</span>
                    <span className="font-bold text-emerald-600 text-xs mt-0.5 block">{summary.workHoursFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Recent Swipes Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-xs">Recent Swipe Logs</h4>
                  <button
                    onClick={() => {
                      setShowSwipesModal(false);
                      navigate('/employee/attendance');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Attendance History</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {swipesLoading ? (
                  <div className="py-8 text-center text-slate-400 text-xs">Loading swipes...</div>
                ) : recentSwipes.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">No swipe records found.</div>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Check-In</th>
                          <th className="py-2.5 px-3">Check-Out</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Timing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentSwipes.slice(0, 7).map((sw, idx) => {
                          const inTime = sw.loginTime
                            ? new Date(sw.loginTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                            : '--';
                          const outTime = sw.logoutTime
                            ? new Date(sw.logoutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                            : '--';

                          return (
                            <tr key={sw.id || idx} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{sw.attendanceDate}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">{inTime}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">{outTime}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sw.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : sw.status === 'LOGGED_IN'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {sw.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-slate-600 text-[11px]">{sw.timingStatus || 'PRESENT'}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setShowSwipesModal(false);
                  navigate('/employee/attendance');
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer hover:underline"
              >
                <span>Open Full Swipes & History Page</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowSwipesModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
