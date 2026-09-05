import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { requestService } from '../../services/requestService';
import { employeeService } from '../../services/employeeService';
import {
  LeaveRequest,
  PermissionRequest,
  LeaveBalanceSummary,
  LeaveGrantUpdatePayload,
  LeaveType,
  AdminRecordLeavePayload,
} from '../../types/request';
import { Employee } from '../../types/employee';
import { formatDate } from '../../utils/dateUtils';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  Calendar,
  Search,
  RefreshCw,
  Clock,
  Check,
  X,
  Sliders,
  FileSpreadsheet,
  Download,
  Edit3,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock3,
  CalendarDays,
  FileCheck,
  Layers,
  Sparkles,
  ArrowUpDown,
  Filter,
  UserX,
  FileText,
  UserCheck,
  PlusCircle,
  HelpCircle,
  Info,
  ShieldAlert,
  Undo2,
} from 'lucide-react';
import AdminCarryForwardModal from '../../components/AdminCarryForwardModal';

const currentYear = new Date().getFullYear();

// Unified Request Item Interface
export type UnifiedRequestType = 'LEAVE' | 'PERMISSION';

export interface UnifiedRequest {
  id: number;
  requestType: UnifiedRequestType;
  employee: {
    id: number;
    name: string;
    employeeCode: string;
    email: string;
  };
  title: string; // e.g., "Casual Leave" or "Hourly Permission"
  dateRange: string; // e.g., "14 Jan 2026 - 15 Jan 2026" or "14 Jan 2026 (10:00 AM - 12:00 PM)"
  duration: string; // e.g., "2 Days" or "2.0 Hours"
  rawStartDate: string; // for sorting
  reason: string;
  remarks?: string;
  isAdminNoted?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN';
  adminRemarks?: string;
  createdAt?: string;
  originalLeave?: LeaveRequest;
  originalPermission?: PermissionRequest;
}

const AdminLeaveRequests: React.FC = () => {
  // Tabs: 'all' | 'leaves' | 'permissions' | 'balances'
  const [activeTab, setActiveTab] = useState<'all' | 'leaves' | 'permissions' | 'balances'>('all');

  // Requests State
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Carry Forward Engine Modal State
  const [showCarryForwardModal, setShowCarryForwardModal] = useState<boolean>(false);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedOrigin, setSelectedOrigin] = useState<'ALL' | 'SELF' | 'ADMIN_NOTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Balances State
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [balanceSummaries, setBalanceSummaries] = useState<LeaveBalanceSummary[]>([]);
  const [balancesLoading, setBalancesLoading] = useState<boolean>(false);
  const [balanceSearchQuery, setBalanceSearchQuery] = useState<string>('');

  // Action State (Approval / Rejection / Cancellation Modal)
  const [actionModal, setActionModal] = useState<{
    request: UnifiedRequest;
    action: 'APPROVED' | 'REJECTED' | 'CANCELLED';
  } | null>(null);
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Unapplied / Direct Leave Modal State
  const [showUnappliedModal, setShowUnappliedModal] = useState<boolean>(false);
  const [unappliedEmployeeId, setUnappliedEmployeeId] = useState<number | ''>('');
  const [unappliedLeaveType, setUnappliedLeaveType] = useState<LeaveType>('CASUAL_LEAVE');
  const [unappliedIsHalfDay, setUnappliedIsHalfDay] = useState<boolean>(false);
  const [unappliedHalfDaySession, setUnappliedHalfDaySession] = useState<'FIRST_HALF' | 'SECOND_HALF'>('FIRST_HALF');
  const [unappliedFromDate, setUnappliedFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [unappliedToDate, setUnappliedToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [unappliedReason, setUnappliedReason] = useState<string>('Unannounced Absence (Employee did not apply)');
  const [unappliedAdminRemarks, setUnappliedAdminRemarks] = useState<string>('Noted & approved directly by Admin');
  const [unappliedSubmitting, setUnappliedSubmitting] = useState<boolean>(false);
  const [unappliedError, setUnappliedError] = useState<string>('');

  // Edit Quota Modal State (Balances)
  const [editQuotaModal, setEditQuotaModal] = useState<LeaveBalanceSummary | null>(null);
  const [quotaForm, setQuotaForm] = useState<LeaveGrantUpdatePayload>({
    employeeId: 0,
    year: currentYear,
    casualLeaveGranted: 5,
    sickLeaveGranted: 1,
    compOffGranted: 0,
    lossOfPayGranted: 0,
    workFromHomeGranted: 0,
  });
  const [quotaSaving, setQuotaSaving] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Leaves, Permissions and Employees
  const fetchAllRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leavesData, permissionsData, empsData] = await Promise.all([
        requestService.getAllLeaves({ status: selectedStatus || undefined }),
        requestService.getAllPermissions({ status: selectedStatus || undefined }),
        employeeService.getAll(),
      ]);
      setLeaves(leavesData);
      setPermissions(permissionsData);
      setEmployees(empsData.filter((e) => e.status === 'ACTIVE'));
    } catch (err) {
      console.error(err);
      setError('Failed to load leave and permission requests.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  // Fetch Balances
  const fetchBalances = useCallback(async (year: number) => {
    setBalancesLoading(true);
    try {
      const data = await requestService.getAllLeaveBalances(year);
      setBalanceSummaries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBalancesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  useEffect(() => {
    if (activeTab === 'balances') {
      fetchBalances(selectedYear);
    }
  }, [activeTab, selectedYear, fetchBalances]);

  // Format Time Slot helper
  const formatTimeSlot = (timeStr: string) => {
    if (!timeStr) return '--';
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = new Date();
    d.setHours(h, m, 0);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Compute duration between two times
  const computeTimeDuration = (fromTime: string, toTime: string) => {
    if (!fromTime || !toTime) return '1 Hour';
    const [h1, m1] = fromTime.split(':').map(Number);
    const [h2, m2] = toTime.split(':').map(Number);
    const totalMinutes = h2 * 60 + m2 - (h1 * 60 + m1);
    if (totalMinutes <= 0) return '1 Hour';
    const hours = totalMinutes / 60;
    return hours % 1 === 0 ? `${hours} hr${hours > 1 ? 's' : ''}` : `${hours.toFixed(1)} hrs`;
  };

  // Format Leave Type label
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

  // Build Unified Request list
  const unifiedRequests = useMemo<UnifiedRequest[]>(() => {
    const list: UnifiedRequest[] = [];

    // Map Leaves
    leaves.forEach((l) => {
      const fromD = new Date(l.fromDate);
      const toD = new Date(l.toDate);
      const diffTime = Math.abs(toD.getTime() - fromD.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const isHalf = Boolean(l.isHalfDay);
      const sessionLabel =
        l.halfDaySession === 'FIRST_HALF'
          ? '1st Half'
          : l.halfDaySession === 'SECOND_HALF'
          ? '2nd Half'
          : 'Half Day';

      const isAdminNoted =
        (l.remarks && l.remarks.toLowerCase().includes('admin noted')) ||
        (l.remarks && l.remarks.toLowerCase().includes('direct entry')) ||
        (l.adminRemarks && l.adminRemarks.toLowerCase().includes('direct entry'));

      list.push({
        id: l.id,
        requestType: 'LEAVE',
        employee: l.employee,
        title: formatLeaveType(l.leaveType),
        dateRange:
          l.fromDate === l.toDate
            ? isHalf
              ? `${formatDate(l.fromDate)} • ${sessionLabel}`
              : formatDate(l.fromDate)
            : `${formatDate(l.fromDate)} - ${formatDate(l.toDate)}`,
        duration: isHalf ? `0.5 Day (${sessionLabel})` : `${diffDays} Day${diffDays > 1 ? 's' : ''}`,
        rawStartDate: l.fromDate,
        reason: l.reason,
        remarks: l.remarks,
        isAdminNoted: !!isAdminNoted,
        status: l.status,
        adminRemarks: l.adminRemarks,
        createdAt: l.createdAt,
        originalLeave: l,
      });
    });

    // Map Permissions
    permissions.forEach((p) => {
      list.push({
        id: p.id,
        requestType: 'PERMISSION',
        employee: p.employee,
        title: 'Short Permission',
        dateRange: `${formatDate(p.permissionDate)} (${formatTimeSlot(p.fromTime)} - ${formatTimeSlot(p.toTime)})`,
        duration: computeTimeDuration(p.fromTime, p.toTime),
        rawStartDate: p.permissionDate,
        reason: p.reason,
        remarks: p.remarks,
        isAdminNoted: false,
        status: p.status,
        adminRemarks: p.adminRemarks,
        createdAt: p.createdAt,
        originalPermission: p,
      });
    });

    // Sort: Pending requests at the TOP, then newest createdAt / ID / date
    return list.sort((a, b) => {
      // 1. PENDING requests prioritized at the top
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;

      // 2. Newest createdAt at the top
      if (a.createdAt && b.createdAt) {
        const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
      }

      // 3. Latest start date at the top
      const dateDiff = b.rawStartDate.localeCompare(a.rawStartDate);
      if (dateDiff !== 0) return dateDiff;

      // 4. Highest ID at the top
      return b.id - a.id;
    });
  }, [leaves, permissions]);

  // Filter requests according to activeTab, selectedStatus, selectedOrigin, searchQuery
  const filteredRequests = useMemo(() => {
    return unifiedRequests.filter((req) => {
      // Tab filter
      if (activeTab === 'leaves' && req.requestType !== 'LEAVE') return false;
      if (activeTab === 'permissions' && req.requestType !== 'PERMISSION') return false;

      // Status filter
      if (selectedStatus && req.status !== selectedStatus) return false;

      // Origin filter
      if (selectedOrigin === 'ADMIN_NOTED' && !req.isAdminNoted) return false;
      if (selectedOrigin === 'SELF' && req.isAdminNoted) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = req.employee.name?.toLowerCase().includes(q);
        const matchesCode = req.employee.employeeCode?.toLowerCase().includes(q);
        const matchesReason = req.reason?.toLowerCase().includes(q);
        const matchesTitle = req.title?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesReason && !matchesTitle) return false;
      }

      return true;
    });
  }, [unifiedRequests, activeTab, selectedStatus, selectedOrigin, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalPendingLeaves = leaves.filter((l) => l.status === 'PENDING').length;
    const totalPendingPermissions = permissions.filter((p) => p.status === 'PENDING').length;
    const totalApprovedLeaves = leaves.filter((l) => l.status === 'APPROVED').length;
    const totalApprovedPermissions = permissions.filter((p) => p.status === 'APPROVED').length;
    const totalAdminNoted = leaves.filter(
      (l) =>
        (l.remarks && l.remarks.toLowerCase().includes('admin noted')) ||
        (l.remarks && l.remarks.toLowerCase().includes('direct entry'))
    ).length;

    return {
      pendingTotal: totalPendingLeaves + totalPendingPermissions,
      pendingLeaves: totalPendingLeaves,
      pendingPermissions: totalPendingPermissions,
      totalLeaves: leaves.length,
      totalPermissions: permissions.length,
      approvedLeaves: totalApprovedLeaves,
      approvedPermissions: totalApprovedPermissions,
      adminNotedLeaves: totalAdminNoted,
    };
  }, [leaves, permissions]);

  // Handle Approve/Reject Action Submit
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    setActionLoading(true);

    try {
      if (actionModal.action === 'CANCELLED') {
        await requestService.adminCancelLeave(actionModal.request.id, adminRemarks.trim() || undefined);
      } else if (actionModal.request.requestType === 'LEAVE') {
        await requestService.updateLeaveStatus(actionModal.request.id, {
          status: actionModal.action,
          adminRemarks: adminRemarks.trim() || undefined,
        });
      } else {
        await requestService.updatePermissionStatus(actionModal.request.id, {
          status: actionModal.action,
          adminRemarks: adminRemarks.trim() || undefined,
        });
      }
      setActionModal(null);
      setAdminRemarks('');
      showToast('success', `Request marked as ${actionModal.action}`);
      fetchAllRequests();
    } catch (err: any) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Failed to update request status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Direct / Unapplied Leave Submission by Admin
  const handleRecordUnappliedLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unappliedEmployeeId) {
      setUnappliedError('Please select an employee');
      return;
    }
    if (!unappliedFromDate || !unappliedToDate) {
      setUnappliedError('Please specify valid dates');
      return;
    }
    if (unappliedToDate < unappliedFromDate) {
      setUnappliedError('To Date cannot be before From Date');
      return;
    }

    try {
      setUnappliedSubmitting(true);
      setUnappliedError('');

      const payload: AdminRecordLeavePayload = {
        employeeId: Number(unappliedEmployeeId),
        leaveType: unappliedLeaveType,
        fromDate: unappliedFromDate,
        toDate: unappliedIsHalfDay ? unappliedFromDate : unappliedToDate,
        isHalfDay: unappliedIsHalfDay,
        halfDaySession: unappliedIsHalfDay ? unappliedHalfDaySession : undefined,
        reason: unappliedReason.trim() || 'Unapplied Leave (Admin Noted)',
        adminRemarks: unappliedAdminRemarks.trim() || 'Directly logged by Admin',
        isUnapplied: true,
      };

      await requestService.recordDirectLeave(payload);
      const emp = employees.find((e) => e.id === Number(unappliedEmployeeId));
      showToast('success', `Unapplied leave for ${emp ? emp.name : 'employee'} recorded & approved!`);
      setShowUnappliedModal(false);
      fetchAllRequests();
    } catch (err: any) {
      setUnappliedError(err.response?.data?.message || err.message || 'Failed to record leave');
    } finally {
      setUnappliedSubmitting(false);
    }
  };

  // Handle Edit Quota modal opening
  const handleOpenEditQuota = (item: LeaveBalanceSummary) => {
    const getGrant = (type: string) => {
      const b = item.balances.find((x) => x.type === type);
      return b ? b.granted : 0;
    };

    setEditQuotaModal(item);
    setQuotaForm({
      employeeId: item.employeeId,
      year: item.year,
      casualLeaveGranted: getGrant('CASUAL_LEAVE') || 5,
      sickLeaveGranted: getGrant('SICK_LEAVE') || 1,
      compOffGranted: getGrant('COMP_OFF') || 0,
      lossOfPayGranted: getGrant('LOSS_OF_PAY') || 0,
      workFromHomeGranted: getGrant('WORK_FROM_HOME') || 0,
    });
  };

  const handleSaveQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuotaSaving(true);
    try {
      await requestService.updateLeaveGrants(quotaForm);
      setEditQuotaModal(null);
      showToast('success', 'Leave quotas updated successfully');
      fetchBalances(selectedYear);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Failed to update leave quotas.');
    } finally {
      setQuotaSaving(false);
    }
  };

  // Export Combined CSV
  const handleExportCsv = () => {
    const headers = [
      'Type',
      'Origin',
      'Employee Code',
      'Employee Name',
      'Request Title',
      'Date / Range',
      'Duration',
      'Reason',
      'Remarks',
      'Status',
      'Admin Remarks',
    ];

    const rows = filteredRequests.map((r) => [
      r.requestType,
      r.isAdminNoted ? 'Admin Noted (Unapplied)' : 'Employee Applied',
      r.employee.employeeCode,
      r.employee.name,
      r.title,
      r.dateRange,
      r.duration,
      r.reason || '',
      r.remarks || '',
      r.status,
      r.adminRemarks || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leave_permission_requests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Balances
  const filteredBalances = useMemo(() => {
    if (!balanceSearchQuery.trim()) return balanceSummaries;
    const q = balanceSearchQuery.toLowerCase().trim();
    return balanceSummaries.filter(
      (b) => b.employeeName.toLowerCase().includes(q) || b.employeeCode.toLowerCase().includes(q)
    );
  }, [balanceSummaries, balanceSearchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* ── Toast Notifications ── */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/95 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Top Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-7 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -mb-16 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
              <FileCheck className="h-3.5 w-3.5 text-indigo-400" />
              Unified Approvals & Absence Manager
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Leave & Permission Requests
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-normal">
              Review employee applications, record unapplied leaves / unannounced absences directly, and configure annual leave quota entitlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* ANNUAL CARRY FORWARD ENGINE */}
            <button
              onClick={() => setShowCarryForwardModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Layers className="h-4 w-4 text-white stroke-[2.5]" />
              Annual Carry-Forward
            </button>

            {/* SEPARATE DIRECT LEAVE / UNAPPLIED LEAVE OPTION */}
            <button
              onClick={() => {
                setShowUnappliedModal(true);
                setUnappliedError('');
                if (employees.length > 0 && !unappliedEmployeeId) {
                  setUnappliedEmployeeId(employees[0].id);
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
            >
              <UserX className="h-4 w-4 text-slate-950 stroke-[2.5]" />
              + Record Unapplied Leave
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Action</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.pendingTotal}</span>
            <span className="text-xs font-semibold text-amber-600">needs review</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium flex items-center gap-2">
            <span>{stats.pendingLeaves} Leaves</span>
            <span>•</span>
            <span>{stats.pendingPermissions} Permissions</span>
          </div>
        </div>

        {/* Leave Requests Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leave Applications</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">{stats.totalLeaves}</span>
            <span className="text-xs font-semibold text-emerald-600 font-medium">
              ({stats.approvedLeaves} approved)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-medium">Multi-day & full day leaves</p>
        </div>

        {/* Admin Noted / Unapplied Card */}
        <div className="bg-white rounded-2xl border border-orange-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Admin Noted Leaves</span>
            <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <UserX className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">{stats.adminNotedLeaves}</span>
            <span className="text-xs font-semibold text-orange-600 font-medium">unapplied entries</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-medium">Direct admin logged leaves</p>
        </div>

        {/* Permission Requests Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hourly Permissions</span>
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">{stats.totalPermissions}</span>
            <span className="text-xs font-semibold text-teal-600 font-medium">
              ({stats.approvedPermissions} approved)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-medium">Short office interval slips</p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'border-indigo-600 text-indigo-600'
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
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Leave Applications ({leaves.length})
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock3 className="h-4 w-4" />
            Permission Requests ({permissions.length})
          </button>

          <button
            onClick={() => setActiveTab('balances')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'balances'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Leave Balances & Grants
          </button>
        </div>
      </div>

      {/* ── TAB 1, 2, 3: REQUESTS LIST (Unified, Leaves, Permissions) ── */}
      {activeTab !== 'balances' ? (
        <div className="space-y-4">
          {/* Controls Bar (Search, Status Filter, Origin Filter) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee, code, or reason..."
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Origin & Status Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Origin Filter (All vs Self vs Admin Noted) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Origin:</span>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value as any)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="ALL">All Origins</option>
                  <option value="SELF">Employee Self-Applied</option>
                  <option value="ADMIN_NOTED">Admin Noted / Unapplied</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending Action</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-3" />
              <p className="text-sm font-semibold text-slate-600">Loading requests...</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-4 px-6">Request Type</th>
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-6">Schedule / Dates</th>
                      <th className="py-4 px-6">Duration</th>
                      <th className="py-4 px-6">Reason & Origin</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <FileCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-700">No requests found</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {searchQuery || selectedStatus || selectedOrigin !== 'ALL'
                              ? 'Try adjusting your search or origin filter parameters'
                              : 'No leave or permission requests currently recorded.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => (
                        <tr key={`${req.requestType}-${req.id}`} className="hover:bg-indigo-50/30 transition-colors">
                          {/* Type Column */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                                  req.requestType === 'LEAVE'
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'bg-teal-50 text-teal-600'
                                }`}
                              >
                                {req.requestType === 'LEAVE' ? (
                                  <CalendarDays className="h-4 w-4" />
                                ) : (
                                  <Clock3 className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block text-xs">{req.title}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                                      req.requestType === 'LEAVE'
                                        ? 'bg-indigo-100/60 text-indigo-700'
                                        : 'bg-teal-100/60 text-teal-700'
                                    }`}
                                  >
                                    {req.requestType}
                                  </span>
                                  {req.isAdminNoted && (
                                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                                      Admin Noted
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Employee */}
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-900 block text-sm">{req.employee.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono font-medium">
                              {req.employee.employeeCode}
                            </span>
                          </td>

                          {/* Schedule / Date */}
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-800 block text-xs">{req.dateRange}</span>
                            {req.createdAt && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                Logged: {formatDate(req.createdAt)}
                              </span>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="py-4 px-6">
                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 font-mono">
                              {req.duration}
                            </span>
                          </td>

                          {/* Reason */}
                          <td className="py-4 px-6 max-w-xs">
                            <p className="font-semibold text-slate-800 line-clamp-1">{req.reason}</p>
                            {req.remarks && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">
                                Note: {req.remarks}
                              </p>
                            )}
                            {req.adminRemarks && (
                              <div className="mt-1 text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                                <span className="font-bold">Admin:</span> {req.adminRemarks}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                                req.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : req.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : req.status === 'CANCELLED' || req.status === 'WITHDRAWN'
                                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  req.status === 'APPROVED'
                                    ? 'bg-emerald-500'
                                    : req.status === 'REJECTED'
                                    ? 'bg-rose-500'
                                    : req.status === 'CANCELLED' || req.status === 'WITHDRAWN'
                                    ? 'bg-slate-400'
                                    : 'bg-amber-500'
                                }`}
                              />
                              {req.status === 'CANCELLED' ? 'WITHDRAWN / CANCELLED' : req.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            {req.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setActionModal({ request: req, action: 'APPROVED' })}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                  title="Approve Request"
                                >
                                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => setActionModal({ request: req, action: 'REJECTED' })}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                  title="Reject Request"
                                >
                                  <X className="h-3.5 w-3.5 stroke-[3]" />
                                  Reject
                                </button>
                              </div>
                            ) : req.status === 'APPROVED' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setActionModal({ request: req, action: 'CANCELLED' })}
                                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-200"
                                  title="Revoke and cancel this approved leave (restore quota)"
                                >
                                  <Undo2 className="h-3 w-3" />
                                  Revoke
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium italic">Reviewed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── TAB 4: LEAVE BALANCES & QUOTAS MANAGEMENT ── */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={balanceSearchQuery}
                onChange={(e) => setBalanceSearchQuery(e.target.value)}
                placeholder="Search employee by name or code..."
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Year Selector & Carry Forward */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Quota Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowCarryForwardModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Annual Carry-Forward
              </button>
            </div>
          </div>

          {balancesLoading ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-3" />
              <p className="text-sm font-semibold text-slate-600">Loading leave quotas & balances...</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-6">Casual Leave (CL)</th>
                      <th className="py-4 px-6">Sick Leave (SL)</th>
                      <th className="py-4 px-6">Comp Off</th>
                      <th className="py-4 px-6">Work From Home</th>
                      <th className="py-4 px-6 text-right">Edit Quota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBalances.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No employee balance records found for {selectedYear}.
                        </td>
                      </tr>
                    ) : (
                      filteredBalances.map((b) => {
                        const cl = b.balances.find((x) => x.type === 'CASUAL_LEAVE');
                        const sl = b.balances.find((x) => x.type === 'SICK_LEAVE');
                        const co = b.balances.find((x) => x.type === 'COMP_OFF');
                        const wfh = b.balances.find((x) => x.type === 'WORK_FROM_HOME');

                        return (
                          <tr key={b.employeeId} className="hover:bg-indigo-50/20 transition-colors">
                            <td className="py-4 px-6">
                              <span className="font-bold text-slate-900 block text-sm">{b.employeeName}</span>
                              <span className="text-[11px] text-slate-400 font-mono">{b.employeeCode}</span>
                            </td>

                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-900">
                                    {cl ? `${cl.balance} / ${cl.granted}` : '--'}
                                  </span>
                                  {cl && (cl.carriedForward ?? 0) > 0 && (
                                    <span className="text-[9px] font-black px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      +{cl.carriedForward} C/F
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  Consumed: {cl?.consumed || 0}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-900">
                                    {sl ? `${sl.balance} / ${sl.granted}` : '--'}
                                  </span>
                                  {sl && (sl.carriedForward ?? 0) > 0 && (
                                    <span className="text-[9px] font-black px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      +{sl.carriedForward} C/F
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  Consumed: {sl?.consumed || 0}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-900">
                                    {co ? `${co.balance} / ${co.granted}` : '--'}
                                  </span>
                                  {co && (co.carriedForward ?? 0) > 0 && (
                                    <span className="text-[9px] font-black px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      +{co.carriedForward} C/F
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  Consumed: {co?.consumed || 0}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900">
                                  {wfh ? `${wfh.balance} / ${wfh.granted}` : '--'}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  Consumed: {wfh?.consumed || 0}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleOpenEditQuota(b)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 font-bold"
                              >
                                <Edit3 className="h-4 w-4" />
                                <span>Edit</span>
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
          )}
        </div>
      )}

      {/* ── MODAL: RECORD DIRECT / UNAPPLIED LEAVE BY ADMIN ── */}
      {showUnappliedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Unapplied / Direct Leave</h3>
                  <p className="text-xs text-slate-400">Note an employee absence or unapplied leave</p>
                </div>
              </div>
              <button
                onClick={() => setShowUnappliedModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {unappliedError && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {unappliedError}
              </div>
            )}

            <form onSubmit={handleRecordUnappliedLeave} className="mt-5 space-y-4">
              {/* Employee Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Employee *
                </label>
                <select
                  required
                  value={unappliedEmployeeId}
                  onChange={(e) => setUnappliedEmployeeId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode}) - {emp.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Leave Category *
                </label>
                <select
                  value={unappliedLeaveType}
                  onChange={(e) => setUnappliedLeaveType(e.target.value as LeaveType)}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="CASUAL_LEAVE">Casual Leave (CL)</option>
                  <option value="SICK_LEAVE">Sick Leave (SL)</option>
                  <option value="LOSS_OF_PAY">Loss Of Pay (Unannounced / Unapproved)</option>
                  <option value="PERSONAL_LEAVE">Personal Leave</option>
                  <option value="WORK_FROM_HOME">Work From Home (WFH)</option>
                  <option value="COMP_OFF">Compensatory Off</option>
                  <option value="OTHER">Other Absence</option>
                </select>
              </div>

              {/* Day Duration Toggle (Full Day vs Half Day) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Duration Type:</span>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="unappliedIsHalfDayRadio"
                        checked={!unappliedIsHalfDay}
                        onChange={() => setUnappliedIsHalfDay(false)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      Full / Multi Day (1.0+)
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-orange-700">
                      <input
                        type="radio"
                        name="unappliedIsHalfDayRadio"
                        checked={unappliedIsHalfDay}
                        onChange={() => {
                          setUnappliedIsHalfDay(true);
                          setUnappliedToDate(unappliedFromDate);
                        }}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      Half Day (0.5)
                    </label>
                  </div>
                </div>

                {unappliedIsHalfDay && (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-3 animate-fade-in">
                    <label className="text-xs font-bold text-slate-700">Select Shift Half *</label>
                    <select
                      value={unappliedHalfDaySession}
                      onChange={(e) => setUnappliedHalfDaySession(e.target.value as 'FIRST_HALF' | 'SECOND_HALF')}
                      className="px-3 py-1.5 text-xs font-bold bg-white border border-orange-200 text-orange-800 rounded-xl focus:outline-none"
                    >
                      <option value="FIRST_HALF">First Half (Morning Shift)</option>
                      <option value="SECOND_HALF">Second Half (Afternoon Shift)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className={`grid ${unappliedIsHalfDay ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {unappliedIsHalfDay ? 'Leave Date *' : 'From Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={unappliedFromDate}
                    onChange={(e) => {
                      setUnappliedFromDate(e.target.value);
                      if (unappliedIsHalfDay) setUnappliedToDate(e.target.value);
                    }}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                {!unappliedIsHalfDay && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      To Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={unappliedToDate}
                      onChange={(e) => setUnappliedToDate(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Quick Preset Reasons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason / Absence Note *
                </label>
                <div className="grid grid-cols-1 gap-1.5 mb-2">
                  {[
                    '🚨 Unannounced Absence (Employee did not apply)',
                    '📞 Informed verbally / via Phone Call (Assisted Log)',
                    '🏥 Medical Emergency / Sick (Did not submit request)',
                    '🚗 Travel / Transit Delay (Emergency leave)',
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setUnappliedReason(preset)}
                      className={`text-left px-3 py-1.5 text-[11px] rounded-xl border transition-all ${
                        unappliedReason === preset
                          ? 'bg-orange-50 border-orange-300 text-orange-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  required
                  value={unappliedReason}
                  onChange={(e) => setUnappliedReason(e.target.value)}
                  placeholder="Describe reason for unapplied leave..."
                  className="w-full px-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                />
              </div>

              {/* Admin Note / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Internal Note / Action
                </label>
                <input
                  type="text"
                  value={unappliedAdminRemarks}
                  onChange={(e) => setUnappliedAdminRemarks(e.target.value)}
                  placeholder="e.g. Noted by HR on morning check-in / Adjusted against CL"
                  className="w-full px-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              {/* Info Notice */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  This will immediately record the leave as <strong>Approved (Admin Noted)</strong>, update the employee's attendance status to <strong>LEAVE</strong>, and reflect on the dashboard & reports.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUnappliedModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unappliedSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {unappliedSubmitting && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />}
                  Record & Approve Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── APPROVE / REJECT MODAL ── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold ${
                    actionModal.action === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {actionModal.action === 'APPROVED' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {actionModal.action === 'APPROVED' ? 'Approve Request' : 'Reject Request'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {actionModal.request.requestType} • {actionModal.request.employee.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="mt-5 space-y-4">
              {/* Request Summary */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Type:</span>
                  <span className="font-bold text-slate-800">{actionModal.request.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Schedule:</span>
                  <span className="font-bold text-slate-800">{actionModal.request.dateRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Duration:</span>
                  <span className="font-bold text-slate-800">{actionModal.request.duration}</span>
                </div>
                <div className="pt-1 text-slate-600">
                  <span className="font-bold block text-slate-700">Reason:</span>
                  <span>{actionModal.request.reason}</span>
                </div>
              </div>

              {/* Admin Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Remarks / Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="e.g., Approved as per discussion, or Reschedule to next week..."
                  className="w-full px-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center gap-1.5 ${
                    actionModal.action === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  }`}
                >
                  {actionLoading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />}
                  Confirm {actionModal.action === 'APPROVED' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT QUOTA MODAL ── */}
      {editQuotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Leave Quota</h3>
                  <p className="text-xs text-slate-400">
                    {editQuotaModal.employeeName} ({editQuotaModal.employeeCode}) • {editQuotaModal.year}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditQuotaModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuota} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Casual Leave (CL)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quotaForm.casualLeaveGranted}
                    onChange={(e) =>
                      setQuotaForm({ ...quotaForm, casualLeaveGranted: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sick Leave (SL)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quotaForm.sickLeaveGranted}
                    onChange={(e) =>
                      setQuotaForm({ ...quotaForm, sickLeaveGranted: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Comp Off</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quotaForm.compOffGranted}
                    onChange={(e) =>
                      setQuotaForm({ ...quotaForm, compOffGranted: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Work From Home</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quotaForm.workFromHomeGranted}
                    onChange={(e) =>
                      setQuotaForm({ ...quotaForm, workFromHomeGranted: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditQuotaModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quotaSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
                >
                  {quotaSaving ? 'Saving...' : 'Save Quotas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ANNUAL CARRY-FORWARD ENGINE MODAL ── */}
      <AdminCarryForwardModal
        isOpen={showCarryForwardModal}
        onClose={() => setShowCarryForwardModal(false)}
        onSuccess={() => {
          fetchBalances(selectedYear);
          fetchAllRequests();
          setNotification({
            type: 'success',
            message: 'Annual leave carry-forward executed successfully!',
          });
        }}
      />
    </div>
  );
};

export default AdminLeaveRequests;
