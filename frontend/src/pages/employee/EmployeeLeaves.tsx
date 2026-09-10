import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { requestService } from '../../services/requestService';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../hooks/useAuth';
import {
  LeaveRequest,
  PermissionRequest,
  LeaveCreatePayload,
  PermissionCreatePayload,
  LeaveType,
  TeamLeaveItem,
} from '../../types/request';
import { Employee } from '../../types/employee';
import { formatDate } from '../../utils/dateUtils';
import {
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  Clock3,
  CalendarDays,
  RefreshCw,
  Layers,
  Sparkles,
  Info,
  Undo2,
  Users,
  UserCheck,
  Search,
  Building,
  User,
  ShieldAlert,
} from 'lucide-react';

interface UnifiedEmployeeRequest {
  id: number;
  type: 'LEAVE' | 'PERMISSION';
  title: string;
  schedule: string;
  duration: string;
  rawDate: string;
  reason: string;
  remarks?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN';
  adminRemarks?: string;
  handoverEmployee?: {
    id: number;
    name: string;
    employeeCode: string;
  } | null;
  handoverNotes?: string | null;
  createdAt?: string;
}

const EmployeeLeaves: React.FC = () => {
  const { user } = useAuth();

  // Tabs: 'all' | 'leaves' | 'permissions' | 'team'
  const [activeTab, setActiveTab] = useState<'all' | 'leaves' | 'permissions' | 'team'>('all');

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<TeamLeaveItem[]>([]);
  const [colleagues, setColleagues] = useState<Employee[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<import('../../types/request').LeaveBalanceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // Team Leave Search / Filter
  const [teamSearch, setTeamSearch] = useState<string>('');

  // Apply Modal State
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [applyType, setApplyType] = useState<'LEAVE' | 'PERMISSION'>('LEAVE');

  // Leave Form Fields
  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL_LEAVE');
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [halfDaySession, setHalfDaySession] = useState<'FIRST_HALF' | 'SECOND_HALF'>('FIRST_HALF');
  const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [handoverEmployeeId, setHandoverEmployeeId] = useState<number | ''>('');
  const [handoverNotes, setHandoverNotes] = useState<string>('');

  // Permission Form Fields
  const [permDate, setPermDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [permFromTime, setPermFromTime] = useState<string>('10:00');
  const [permToTime, setPermToTime] = useState<string>('12:00');

  // Common Fields
  const [reason, setReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Withdraw Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState<boolean>(false);
  const [withdrawTarget, setWithdrawTarget] = useState<UnifiedEmployeeRequest | null>(null);
  const [withdrawReason, setWithdrawReason] = useState<string>('');
  const [withdrawing, setWithdrawing] = useState<boolean>(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch all employee requests and team leaves
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leavesData, permsData, teamData, empList, balancesData] = await Promise.all([
        requestService.getMyLeaves(),
        requestService.getMyPermissions(),
        requestService.getTeamLeaves().catch(() => []),
        employeeService.getAll().catch(() => []),
        requestService.getMyLeaveBalances().catch(() => null),
      ]);
      setLeaves(leavesData || []);
      setPermissions(permsData || []);
      setTeamLeaves(teamData || []);
      setColleagues(empList || []);
      if (balancesData) {
        setBalanceSummary(balancesData);
      }
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatTimeSlot = (timeStr: string) => {
    if (!timeStr) return '--';
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = new Date();
    d.setHours(h, m, 0);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const computeDuration = (fromTime: string, toTime: string) => {
    if (!fromTime || !toTime) return '1 hr';
    const [h1, m1] = fromTime.split(':').map(Number);
    const [h2, m2] = toTime.split(':').map(Number);
    const diff = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diff <= 0) return '1 hr';
    const hours = diff / 60;
    return hours % 1 === 0 ? `${hours} hr${hours > 1 ? 's' : ''}` : `${hours.toFixed(1)} hrs`;
  };

  const formatLeaveType = (type: string) => {
    switch (type) {
      case 'CASUAL_LEAVE':
        return 'Casual Leave';
      case 'SICK_LEAVE':
        return 'Sick Leave';
      case 'PERSONAL_LEAVE':
        return 'Personal Leave';
      case 'COMP_OFF':
        return 'Comp Off';
      case 'LOSS_OF_PAY':
        return 'Loss of Pay';
      case 'WORK_FROM_HOME':
        return 'Work From Home';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  // Filter available colleagues for handover (exclude self)
  const handoverCandidates = useMemo(() => {
    return colleagues.filter((c) => c.id !== user?.id && c.status !== 'INACTIVE');
  }, [colleagues, user?.id]);

  // Unified Request Items
  const unifiedRequests = useMemo<UnifiedEmployeeRequest[]>(() => {
    const list: UnifiedEmployeeRequest[] = [];

    leaves.forEach((l) => {
      const fromD = new Date(l.fromDate);
      const toD = new Date(l.toDate);
      const diffDays = Math.ceil(Math.abs(toD.getTime() - fromD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const isHalf = Boolean(l.isHalfDay);
      const sessionLabel =
        l.halfDaySession === 'FIRST_HALF'
          ? '1st Half'
          : l.halfDaySession === 'SECOND_HALF'
          ? '2nd Half'
          : 'Half Day';

      list.push({
        id: l.id,
        type: 'LEAVE',
        title: formatLeaveType(l.leaveType),
        schedule:
          l.fromDate === l.toDate
            ? isHalf
              ? `${formatDate(l.fromDate)} (${sessionLabel})`
              : formatDate(l.fromDate)
            : `${formatDate(l.fromDate)} - ${formatDate(l.toDate)}`,
        duration: isHalf ? `0.5 Day (${sessionLabel})` : `${diffDays} Day${diffDays > 1 ? 's' : ''}`,
        rawDate: l.fromDate,
        reason: l.reason,
        remarks: l.remarks,
        status: l.status,
        adminRemarks: l.adminRemarks,
        handoverEmployee: l.handoverEmployee,
        handoverNotes: l.handoverNotes,
        createdAt: l.createdAt,
      });
    });

    permissions.forEach((p) => {
      list.push({
        id: p.id,
        type: 'PERMISSION',
        title: 'Hourly Permission',
        schedule: `${formatDate(p.permissionDate)} (${formatTimeSlot(p.fromTime)} - ${formatTimeSlot(p.toTime)})`,
        duration: computeDuration(p.fromTime, p.toTime),
        rawDate: p.permissionDate,
        reason: p.reason,
        remarks: p.remarks,
        status: p.status,
        adminRemarks: p.adminRemarks,
        createdAt: p.createdAt,
      });
    });

    // Sort: Pending requests at TOP, then newest createdAt / ID / date
    return list.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;

      if (a.createdAt && b.createdAt) {
        const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
      }

      const dateDiff = b.rawDate.localeCompare(a.rawDate);
      if (dateDiff !== 0) return dateDiff;

      return b.id - a.id;
    });
  }, [leaves, permissions]);

  const filteredRequests = useMemo(() => {
    if (activeTab === 'leaves') return unifiedRequests.filter((r) => r.type === 'LEAVE');
    if (activeTab === 'permissions') return unifiedRequests.filter((r) => r.type === 'PERMISSION');
    return unifiedRequests;
  }, [unifiedRequests, activeTab]);

  // Filtered Team Leaves
  const filteredTeamLeaves = useMemo(() => {
    if (!teamSearch.trim()) return teamLeaves;
    const query = teamSearch.toLowerCase().trim();
    return teamLeaves.filter(
      (item) =>
        item.employee?.name?.toLowerCase().includes(query) ||
        item.employee?.employeeCode?.toLowerCase().includes(query) ||
        item.employee?.department?.toLowerCase().includes(query) ||
        item.leaveType?.toLowerCase().includes(query) ||
        item.reason?.toLowerCase().includes(query)
    );
  }, [teamLeaves, teamSearch]);

  // Handle Application Submit
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setSubmitLoading(true);

    try {
      if (applyType === 'LEAVE') {
        const payload: LeaveCreatePayload = {
          leaveType,
          fromDate,
          toDate: isHalfDay ? fromDate : toDate,
          isHalfDay,
          halfDaySession: isHalfDay ? halfDaySession : undefined,
          reason: reason.trim(),
          remarks: remarks.trim() || undefined,
          handoverEmployeeId: handoverEmployeeId ? Number(handoverEmployeeId) : undefined,
          handoverNotes: handoverNotes.trim() || undefined,
        };
        await requestService.applyLeave(payload);
        setSuccessMsg(
          isHalfDay
            ? 'Half-day leave application submitted successfully! Awaiting supervisor approval.'
            : 'Leave application submitted successfully! Awaiting supervisor approval.'
        );
      } else {
        const payload: PermissionCreatePayload = {
          permissionDate: permDate,
          fromTime: permFromTime,
          toTime: permToTime,
          reason: reason.trim(),
          remarks: remarks.trim() || undefined,
        };
        await requestService.applyPermission(payload);
        setSuccessMsg('Permission request submitted successfully! Awaiting supervisor approval.');
      }

      setShowApplyModal(false);
      setReason('');
      setRemarks('');
      setHandoverEmployeeId('');
      setHandoverNotes('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit request.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleConfirmWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawTarget) return;

    try {
      setWithdrawing(true);
      setErrorMsg(null);
      await requestService.withdrawLeave(withdrawTarget.id, withdrawReason.trim() || undefined);
      setSuccessMsg(`Leave request (${withdrawTarget.title}) successfully withdrawn and balance restored.`);
      setWithdrawModalOpen(false);
      setWithdrawTarget(null);
      setWithdrawReason('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to withdraw leave request.');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none animate-fade-in">
      {/* Toast Messages */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto p-1 hover:bg-emerald-100 rounded-lg">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold shadow-sm">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto p-1 hover:bg-rose-100 rounded-lg">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-7 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-200">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              Employee Request & Approval Center
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Leave & Permission Requests
            </h1>
            <p className="text-sm text-blue-100 max-w-2xl font-normal">
              Submit applications for full-day leaves, work from home, or short hourly permissions with task handover delegation.
            </p>
          </div>

          <button
            onClick={() => {
              setShowApplyModal(true);
              setSuccessMsg(null);
              setErrorMsg(null);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            + New Request
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Action</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">
              {unifiedRequests.filter((r) => r.status === 'PENDING').length}
            </span>
            <span className="text-xs font-semibold text-amber-600">awaiting approval</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved Leaves</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">
              {leaves.filter((r) => r.status === 'APPROVED').length}
            </span>
            <span className="text-xs font-semibold text-indigo-600 font-medium">approved</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved Permissions</span>
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">
              {permissions.filter((r) => r.status === 'APPROVED').length}
            </span>
            <span className="text-xs font-semibold text-teal-600 font-medium">approved</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Team On Leave</span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-purple-700">
              {teamLeaves.length}
            </span>
            <span className="text-xs font-semibold text-purple-600 font-medium">colleagues</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            All Requests ({unifiedRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-4 py-3 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'leaves'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Leaves ({leaves.length})
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-3 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock3 className="h-4 w-4" />
            Permissions ({permissions.length})
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-3 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'team'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            Team Availability ({teamLeaves.length})
          </button>
        </div>

        <button
          onClick={fetchData}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          title="Refresh List"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── TAB CONTENT: TEAM AVAILABILITY ── */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search colleague by name, code or department..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{filteredTeamLeaves.length}</span> colleague schedule(s)
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-r-transparent mb-3" />
              <p className="text-sm font-semibold text-slate-600">Loading team availability...</p>
            </div>
          ) : filteredTeamLeaves.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-2">
              <Users className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Colleagues On Leave</p>
              <p className="text-xs text-slate-400">All team members are active and available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeamLeaves.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                        {t.employee?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{t.employee?.name}</h4>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">
                          {t.employee?.employeeCode} • {t.employee?.department || 'General'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      {formatLeaveType(t.leaveType)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Schedule:</span>
                      <span className="font-bold text-slate-800">
                        {formatDate(t.fromDate)} {t.fromDate !== t.toDate ? `to ${formatDate(t.toDate)}` : ''}
                      </span>
                    </div>
                    {t.isHalfDay && (
                      <div className="flex items-center justify-between text-purple-700 font-medium">
                        <span>Session:</span>
                        <span className="font-bold">{t.halfDaySession === 'FIRST_HALF' ? '1st Half' : '2nd Half'}</span>
                      </div>
                    )}
                    <div className="text-slate-500 line-clamp-2 pt-1 border-t border-slate-200/60">
                      <span className="font-semibold text-slate-700">Reason: </span>
                      {t.reason}
                    </div>
                  </div>

                  {t.handoverEmployee && (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span>Work Handover To: {t.handoverEmployee.name} ({t.handoverEmployee.employeeCode})</span>
                      </div>
                      {t.handoverNotes && (
                        <p className="text-blue-700 text-[10px] pl-5 italic line-clamp-2">
                          "{t.handoverNotes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT: MY REQUESTS (ALL / LEAVES / PERMISSIONS) ── */}
      {activeTab !== 'team' && (
        loading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading your requests...</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-6">Request Type</th>
                    <th className="py-4 px-6">Schedule / Dates</th>
                    <th className="py-4 px-6">Duration</th>
                    <th className="py-4 px-6">Reason & Handover</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No applications found in this category. Click "+ New Request" to apply.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((r) => (
                      <tr key={`${r.type}-${r.id}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                                r.type === 'LEAVE' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'
                              }`}
                            >
                              {r.type === 'LEAVE' ? <CalendarDays className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{r.title}</span>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                  r.type === 'LEAVE' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'
                                }`}
                              >
                                {r.type}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-800 block">{r.schedule}</span>
                          {r.createdAt && (
                            <span className="text-[10px] text-slate-400">Applied: {formatDate(r.createdAt)}</span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 font-mono">
                            {r.duration}
                          </span>
                        </td>

                        {/* Reason, Handover & Remarks */}
                        <td className="py-4 px-6 min-w-[240px] max-w-sm space-y-1.5">
                          <p className="font-semibold text-slate-800 text-xs">{r.reason}</p>

                          {/* Handover delegation tag */}
                          {r.handoverEmployee && (
                            <div className="p-2 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                              <div className="flex items-center gap-1.5 font-bold">
                                <UserCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                <span>Task Handover: {r.handoverEmployee.name} ({r.handoverEmployee.employeeCode})</span>
                              </div>
                              {r.handoverNotes && (
                                <p className="text-[10px] text-blue-700 mt-0.5 pl-5 italic">
                                  Notes: {r.handoverNotes}
                                </p>
                              )}
                            </div>
                          )}

                          {r.remarks && (
                            <div
                              className={`text-xs p-2 rounded-xl border flex items-start gap-1.5 ${
                                r.status === 'CANCELLED' || r.status === 'WITHDRAWN'
                                  ? 'bg-rose-50/90 border-rose-200 text-rose-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              {r.status === 'CANCELLED' || r.status === 'WITHDRAWN' ? (
                                <Undo2 className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                              ) : (
                                <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                              )}
                              <div className="leading-snug break-words">
                                <span className="font-bold">
                                  {r.status === 'CANCELLED' || r.status === 'WITHDRAWN'
                                    ? 'Withdrawal Note: '
                                    : 'Note: '}
                                </span>
                                <span>
                                  {r.remarks.replace(/^Withdrawn:\s*/i, '').replace(/^\|\s*Withdrawn:\s*/i, '')}
                                </span>
                              </div>
                            </div>
                          )}

                          {r.adminRemarks && (
                            <div className="text-xs p-2 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 flex items-start gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                              <div className="leading-snug break-words">
                                <span className="font-bold">Admin Remarks: </span>
                                <span>{r.adminRemarks}</span>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                              r.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : r.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : r.status === 'CANCELLED' || r.status === 'WITHDRAWN'
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                r.status === 'APPROVED'
                                  ? 'bg-emerald-500'
                                  : r.status === 'REJECTED'
                                  ? 'bg-rose-500'
                                  : r.status === 'CANCELLED' || r.status === 'WITHDRAWN'
                                  ? 'bg-slate-400'
                                  : 'bg-amber-500'
                              }`}
                            />
                            {r.status === 'CANCELLED' ? 'WITHDRAWN / CANCELLED' : r.status}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          {r.type === 'LEAVE' && (r.status === 'PENDING' || r.status === 'APPROVED') ? (
                            <button
                              onClick={() => {
                                setWithdrawTarget(r);
                                setWithdrawReason('');
                                setWithdrawModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer"
                              title="Withdraw Leave Application"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              Withdraw
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs">--</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── WITHDRAW CONFIRMATION MODAL ── */}
      {withdrawModalOpen && withdrawTarget && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Undo2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Withdraw Leave Application</h3>
                  <p className="text-xs text-slate-400">{withdrawTarget.title}</p>
                </div>
              </div>
              <button
                onClick={() => setWithdrawModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmWithdraw} className="py-4 space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <p><strong>Schedule:</strong> {withdrawTarget.schedule}</p>
                <p><strong>Duration:</strong> {withdrawTarget.duration}</p>
                <p className="text-amber-700 font-medium">
                  {withdrawTarget.status === 'APPROVED'
                    ? '⚠️ This leave was approved. Withdrawing it will restore the leave days back into your available balance.'
                    : 'ℹ️ Withdrawing will cancel this pending application.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Withdrawal (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Plan postponed, attended office instead, or client meeting scheduled..."
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Keep Request
                </button>
                <button
                  type="submit"
                  disabled={withdrawing}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {withdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UNIFIED APPLY MODAL ── */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200/80 max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header - Pinned at top */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Apply for Leave / Permission</h3>
                  <p className="text-xs text-slate-400">Choose request type and optional handover</p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Request Type Selector - Pinned underneath header */}
            <div className="px-6 pt-4 pb-2 shrink-0 bg-white">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setApplyType('LEAVE')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    applyType === 'LEAVE'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>Full / Multi-Day Leave</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApplyType('PERMISSION')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    applyType === 'PERMISSION'
                      ? 'bg-white text-teal-600 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock3 className="h-4 w-4" />
                  <span>Hourly Permission</span>
                </button>
              </div>
            </div>

            {/* Modal Body - Smoothly scrollable */}
            <form onSubmit={handleApply} className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
              {applyType === 'LEAVE' ? (
                <>
                  {/* Leave Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Leave Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="CASUAL_LEAVE">Casual Leave (CL)</option>
                      <option value="SICK_LEAVE">Sick Leave (SL)</option>
                      <option value="PERSONAL_LEAVE">Personal Leave</option>
                      <option value="COMP_OFF">Compensatory Off (Comp-off)</option>
                      <option value="WORK_FROM_HOME">Work From Home (WFH)</option>
                      <option value="LOSS_OF_PAY">Loss Of Pay (LOP)</option>
                    </select>

                    {/* Comp Off Info Helper */}
                    {leaveType === 'COMP_OFF' && (
                      <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900">Available Comp-Off Balance:</span>
                          <span className="font-extrabold text-emerald-800 font-mono px-2 py-0.5 bg-emerald-100/90 rounded-md">
                            {balanceSummary?.balances?.find((b) => b.type === 'COMP_OFF')?.balance ?? 0} Day(s)
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 leading-snug">
                          Compensatory Off is credited when you attend work on official holidays/weekends or when granted by Admin.
                        </p>
                      </div>
                    )}

                    {/* Work From Home Info Helper */}
                    {leaveType === 'WORK_FROM_HOME' && (
                      <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1 animate-fade-in">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">🏡</span>
                          <span className="font-bold text-purple-900">Admin-Controlled Work From Home</span>
                        </div>
                        <p className="text-[11px] text-purple-700 leading-snug">
                          Once approved by Admin, the office physical geofence will be bypassed so you can punch in and punch out directly from home.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Day Duration Toggle (Full Day vs Half Day) */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Duration Type:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsHalfDay(false)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            !isHalfDay
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Full / Multi Day (1.0+)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsHalfDay(true);
                            setToDate(fromDate);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isHalfDay
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Half Day (0.5)
                        </button>
                      </div>
                    </div>

                    {isHalfDay && (
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-3 animate-fade-in">
                        <label className="text-xs font-bold text-slate-700">Select Shift Half *</label>
                        <select
                          value={halfDaySession}
                          onChange={(e) => setHalfDaySession(e.target.value as 'FIRST_HALF' | 'SECOND_HALF')}
                          className="px-3 py-1.5 text-xs font-bold bg-white border border-blue-200 text-blue-800 rounded-xl focus:outline-none"
                        >
                          <option value="FIRST_HALF">First Half (Morning Shift)</option>
                          <option value="SECOND_HALF">Second Half (Afternoon Shift)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className={`grid ${isHalfDay ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        {isHalfDay ? 'Leave Date *' : 'From Date *'}
                      </label>
                      <input
                        type="date"
                        required
                        value={fromDate}
                        onChange={(e) => {
                          setFromDate(e.target.value);
                          if (isHalfDay) setToDate(e.target.value);
                        }}
                        className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    {!isHalfDay && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          To Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* ── WORK HANDOVER DELEGATION SECTION ── */}
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2.5">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                      <UserCheck className="h-4 w-4 text-indigo-600" />
                      <span>Task Delegation / Work Handover (Optional)</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Delegate Work To Colleague:
                      </label>
                      <select
                        value={handoverEmployeeId}
                        onChange={(e) => setHandoverEmployeeId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 text-xs font-medium bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">-- No Handover Selected --</option>
                        {handoverCandidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.employeeCode}) {c.department ? `• ${c.department}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {Boolean(handoverEmployeeId) && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Handover Instructions / Pending Tasks:
                        </label>
                        <textarea
                          rows={2}
                          value={handoverNotes}
                          onChange={(e) => setHandoverNotes(e.target.value)}
                          placeholder="List client deliverables, meeting coverages, or critical instructions for this colleague..."
                          className="w-full px-3 py-2 text-xs bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-medium"
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Permission Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Permission Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={permDate}
                      onChange={(e) => setPermDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  {/* Permission Time Slot */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        From Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={permFromTime}
                        onChange={(e) => setPermFromTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        To Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={permToTime}
                        onChange={(e) => setPermToTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Request <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Medical appointment, Family emergency, Work from home..."
                  className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Remarks / Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional note for supervisor..."
                  className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Submit Buttons - Pinned at bottom of form / modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </span>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaves;
