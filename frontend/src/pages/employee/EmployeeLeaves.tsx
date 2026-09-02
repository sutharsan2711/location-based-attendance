import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { requestService } from '../../services/requestService';
import {
  LeaveRequest,
  PermissionRequest,
  LeaveCreatePayload,
  PermissionCreatePayload,
  LeaveType,
} from '../../types/request';
import { formatDate } from '../../utils/dateUtils';
import {
  Calendar,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  Clock,
  Clock3,
  CalendarDays,
  RefreshCw,
  FileCheck,
  Layers,
  Sparkles,
  Info,
  CalendarRange,
  Building,
  Filter
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminRemarks?: string;
  createdAt?: string;
}

const EmployeeLeaves: React.FC = () => {
  // Tabs: 'all' | 'leaves' | 'permissions'
  const [activeTab, setActiveTab] = useState<'all' | 'leaves' | 'permissions'>('all');

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // Apply Modal State
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [applyType, setApplyType] = useState<'LEAVE' | 'PERMISSION'>('LEAVE');

  // Leave Form Fields
  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL_LEAVE');
  const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Permission Form Fields
  const [permDate, setPermDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [permFromTime, setPermFromTime] = useState<string>('10:00');
  const [permToTime, setPermToTime] = useState<string>('12:00');

  // Common Fields
  const [reason, setReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch all employee requests
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leavesData, permsData] = await Promise.all([
        requestService.getMyLeaves(),
        requestService.getMyPermissions(),
      ]);
      setLeaves(leavesData);
      setPermissions(permsData);
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

  // Unified Request Items
  const unifiedRequests = useMemo<UnifiedEmployeeRequest[]>(() => {
    const list: UnifiedEmployeeRequest[] = [];

    leaves.forEach((l) => {
      const fromD = new Date(l.fromDate);
      const toD = new Date(l.toDate);
      const diffDays = Math.ceil(Math.abs(toD.getTime() - fromD.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      list.push({
        id: l.id,
        type: 'LEAVE',
        title: formatLeaveType(l.leaveType),
        schedule:
          l.fromDate === l.toDate
            ? formatDate(l.fromDate)
            : `${formatDate(l.fromDate)} - ${formatDate(l.toDate)}`,
        duration: `${diffDays} Day${diffDays > 1 ? 's' : ''}`,
        rawDate: l.fromDate,
        reason: l.reason,
        remarks: l.remarks,
        status: l.status,
        adminRemarks: l.adminRemarks,
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
      // 1. PENDING requests prioritized at the top
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;

      // 2. Newest createdAt at top
      if (a.createdAt && b.createdAt) {
        const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
      }

      // 3. Date descending
      const dateDiff = b.rawDate.localeCompare(a.rawDate);
      if (dateDiff !== 0) return dateDiff;

      // 4. ID descending
      return b.id - a.id;
    });
  }, [leaves, permissions]);

  const filteredRequests = useMemo(() => {
    if (activeTab === 'leaves') return unifiedRequests.filter((r) => r.type === 'LEAVE');
    if (activeTab === 'permissions') return unifiedRequests.filter((r) => r.type === 'PERMISSION');
    return unifiedRequests;
  }, [unifiedRequests, activeTab]);

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
          toDate,
          reason: reason.trim(),
          remarks: remarks.trim() || undefined,
        };
        await requestService.applyLeave(payload);
        setSuccessMsg('Leave application submitted successfully! Awaiting supervisor approval.');
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
      fetchData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit request.');
    } finally {
      setSubmitLoading(false);
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
              Submit applications for full-day leaves, work from home, or short hourly permissions. Track supervisor approvals in real time.
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
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
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
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
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock3 className="h-4 w-4" />
            Permissions ({permissions.length})
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

      {/* Requests History List */}
      {loading ? (
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
                  <th className="py-4 px-6">Reason & Notes</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
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

                      <td className="py-4 px-6 max-w-xs">
                        <p className="font-semibold text-slate-800 line-clamp-1">{r.reason}</p>
                        {r.remarks && <p className="text-[10px] text-slate-400 italic">Note: {r.remarks}</p>}
                        {r.adminRemarks && (
                          <div className="mt-1 text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                            <span className="font-bold">Supervisor:</span> {r.adminRemarks}
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
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              r.status === 'APPROVED'
                                ? 'bg-emerald-500'
                                : r.status === 'REJECTED'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── UNIFIED APPLY MODAL ── */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Apply for Leave / Permission</h3>
                  <p className="text-xs text-slate-400">Choose request type and fill in details</p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Request Type Selector */}
            <div className="mt-5 grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setApplyType('LEAVE')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  applyType === 'LEAVE'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Full / Multi-Day Leave
              </button>
              <button
                type="button"
                onClick={() => setApplyType('PERMISSION')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  applyType === 'PERMISSION'
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock3 className="h-4 w-4" />
                Hourly Permission
              </button>
            </div>

            <form onSubmit={handleApply} className="mt-5 space-y-4">
              {applyType === 'LEAVE' ? (
                <>
                  {/* Leave Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Leave Type *
                    </label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                      className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="CASUAL_LEAVE">Casual Leave (CL)</option>
                      <option value="SICK_LEAVE">Sick Leave (SL)</option>
                      <option value="PERSONAL_LEAVE">Personal Leave</option>
                      <option value="COMP_OFF">Compensatory Off (Comp-off)</option>
                      <option value="WORK_FROM_HOME">Work From Home (WFH)</option>
                      <option value="LOSS_OF_PAY">Loss Of Pay (LOP)</option>
                    </select>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        From Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        To Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
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
                      className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                        className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                        className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Request *
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Medical appointment, Family emergency, Work from home..."
                  className="w-full px-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
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
                  className="w-full px-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  {submitLoading ? 'Submitting...' : 'Submit Application'}
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
