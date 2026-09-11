import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { requestService } from '../../services/requestService';
import { employeeService } from '../../services/employeeService';
import { adminService, CalendarSummaryDay, CalendarDayData } from '../../services/adminService';
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
  ChevronLeft,
  ChevronRight,
  UserMinus,
  Building,
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
  handoverEmployee?: {
    id: number;
    name: string;
    employeeCode: string;
    email: string;
    department?: string;
    role?: string;
  } | null;
  handoverNotes?: string | null;
  createdAt?: string;
  originalLeave?: LeaveRequest;
  originalPermission?: PermissionRequest;
}

const AdminLeaveRequests: React.FC = () => {
  // Tabs: 'all' | 'leaves' | 'permissions' | 'balances' | 'calendar'
  const [activeTab, setActiveTab] = useState<'all' | 'leaves' | 'permissions' | 'balances' | 'calendar'>('all');

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

  // Calendar State
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth() + 1);
  const [calendarDays, setCalendarDays] = useState<CalendarSummaryDay[]>([]);
  const [calendarLoading, setCalendarLoading] = useState<boolean>(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<CalendarSummaryDay | null>(null);

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

  // Fetch Calendar Summary
  const fetchCalendarSummary = useCallback(async (year: number, month: number) => {
    setCalendarLoading(true);
    try {
      const data = await adminService.getCalendarSummary(year, month);
      const mapped = (data.days || []).map((d) => ({
        ...d,
        presents: d.presentCount,
        leaves: d.leaveCount,
        wfh: d.wfhCount,
        permissions: d.permissionCount,
        late: d.lateCount,
        details: {
          presentsList: d.presentEmployees.map((e) => ({
            employeeId: e.id,
            name: e.name,
            employeeCode: e.employeeCode,
            department: e.department,
          })),
          leavesList: d.leaveEmployees.map((e) => ({
            employeeId: e.id,
            name: e.name,
            employeeCode: e.employeeCode,
            leaveType: e.leaveType,
          })),
          wfhList: d.wfhEmployees.map((e) => ({
            employeeId: e.id,
            name: e.name,
            employeeCode: e.employeeCode,
          })),
          permissionsList: d.permissionEmployees.map((e) => ({
            employeeId: e.id,
            name: e.name,
            employeeCode: e.employeeCode,
            time: e.fromTime ? new Date(e.fromTime).toLocaleTimeString() : '',
          })),
          lateList: d.lateEmployees.map((e) => ({
            employeeId: e.id,
            name: e.name,
            employeeCode: e.employeeCode,
            checkIn: e.loginTime ? new Date(e.loginTime).toLocaleTimeString() : '',
          })),
        },
      }));
      setCalendarDays(mapped as any);
    } catch (err) {
      console.error('Failed to fetch calendar summary', err);
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  useEffect(() => {
    if (activeTab === 'balances') {
      fetchBalances(selectedYear);
    } else if (activeTab === 'calendar') {
      fetchCalendarSummary(calYear, calMonth);
    }
  }, [activeTab, selectedYear, calYear, calMonth, fetchBalances, fetchCalendarSummary]);

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
        handoverEmployee: l.handoverEmployee,
        handoverNotes: l.handoverNotes,
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

    const targetReq = actionModal.request;
    const nextStatus = actionModal.action === 'CANCELLED' ? 'CANCELLED' : actionModal.action;
    const remarks = adminRemarks.trim() || undefined;

    try {
      if (actionModal.action === 'CANCELLED') {
        await requestService.adminCancelLeave(targetReq.id, remarks);
      } else if (targetReq.requestType === 'LEAVE') {
        await requestService.updateLeaveStatus(targetReq.id, {
          status: nextStatus,
          adminRemarks: remarks,
        });
      } else {
        await requestService.updatePermissionStatus(targetReq.id, {
          status: nextStatus,
          adminRemarks: remarks,
        });
      }

      // Optimistic state update for instant UI feedback
      if (targetReq.requestType === 'LEAVE') {
        setLeaves((prev) =>
          prev.map((l) => (l.id === targetReq.id ? { ...l, status: nextStatus, adminRemarks: remarks } : l))
        );
      } else {
        setPermissions((prev) =>
          prev.map((p) => (p.id === targetReq.id ? { ...p, status: nextStatus, adminRemarks: remarks } : p))
        );
      }

      setActionModal(null);
      setAdminRemarks('');
      showToast('success', `Request marked as ${nextStatus}`);
      await Promise.all([fetchAllRequests(), fetchBalances(selectedYear)]);
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Action</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.pendingTotal}</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">needs review</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-2">
            <span>{stats.pendingLeaves} Leaves</span>
            <span>•</span>
            <span>{stats.pendingPermissions} Permissions</span>
          </div>
        </div>

        {/* Leave Requests Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Leave Applications</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{stats.totalLeaves}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-medium">
              ({stats.approvedLeaves} approved)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">Multi-day & full day leaves</p>
        </div>

        {/* Admin Noted / Unapplied Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-orange-200/80 dark:border-orange-900/50 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Admin Noted Leaves</span>
            <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <UserX className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{stats.adminNotedLeaves}</span>
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 font-medium">unapplied entries</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">Direct admin logged leaves</p>
        </div>

        {/* Permission Requests Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hourly Permissions</span>
            <div className="h-9 w-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{stats.totalPermissions}</span>
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 font-medium">
              ({stats.approvedPermissions} approved)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">Short office interval slips</p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            All Requests ({unifiedRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'leaves'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Leave Applications ({leaves.length})
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Clock3 className="h-4 w-4" />
            Permission Requests ({permissions.length})
          </button>

          <button
            onClick={() => setActiveTab('balances')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'balances'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Leave Balances & Grants
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'calendar'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Leave & Attendance Calendar
          </button>
        </div>
      </div>

      {/* ── TAB 1, 2, 3: REQUESTS LIST (Unified, Leaves, Permissions) ── */}
      {activeTab === 'all' || activeTab === 'leaves' || activeTab === 'permissions' ? (
        <div className="space-y-4">
          {/* Controls Bar (Search, Status Filter, Origin Filter) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee, code, or reason..."
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Origin & Status Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Origin Filter (All vs Self vs Admin Noted) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Origin:</span>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value as any)}
                  className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="ALL">All Origins</option>
                  <option value="SELF">👤 Employee Applied</option>
                  <option value="ADMIN_NOTED">⚡ Admin Noted (Unapplied)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">🟡 Pending</option>
                  <option value="APPROVED">🟢 Approved</option>
                  <option value="REJECTED">🔴 Rejected</option>
                  <option value="CANCELLED">⚪ Withdrawn / Cancelled</option>
                </select>
              </div>

              {/* Reset Filters */}
              {(selectedStatus || searchQuery || selectedOrigin !== 'ALL') && (
                <button
                  onClick={() => {
                    setSelectedStatus('');
                    setSelectedOrigin('ALL');
                    setSearchQuery('');
                  }}
                  className="p-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  title="Reset Filters"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Table View */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading requests...</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="py-4 px-6">Request Type</th>
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-6">Schedule / Date</th>
                      <th className="py-4 px-6">Duration</th>
                      <th className="py-4 px-6">Reason / Details</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                          <FileText className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                          <p className="font-semibold">No requests found matching your filters.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => (
                        <tr key={`${req.requestType}-${req.id}`} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/60 transition-colors">
                          {/* Type Column */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                                  req.requestType === 'LEAVE'
                                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                                    : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                                }`}
                              >
                                {req.requestType === 'LEAVE' ? (
                                  <CalendarDays className="h-4 w-4" />
                                ) : (
                                  <Clock3 className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block text-xs">{req.title}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                                      req.requestType === 'LEAVE'
                                        ? 'bg-indigo-100/60 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                                        : 'bg-teal-100/60 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                                    }`}
                                  >
                                    {req.requestType}
                                  </span>
                                  {req.isAdminNoted && (
                                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                                      Admin Noted
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Employee */}
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-900 dark:text-white block text-sm">{req.employee.name}</span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono font-medium">
                              {req.employee.employeeCode}
                            </span>
                            {req.handoverEmployee && (
                              <div className="mt-1 flex items-center gap-1 text-[10.5px] text-teal-700 dark:text-teal-300 bg-teal-50/90 dark:bg-teal-950/50 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800 font-medium max-w-xs truncate" title={`Work assigned to ${req.handoverEmployee.name}`}>
                                <Users className="h-3 w-3 text-teal-600 dark:text-teal-400 shrink-0" />
                                <span className="truncate">Handover: <strong className="font-bold">{req.handoverEmployee.name}</strong></span>
                              </div>
                            )}
                          </td>

                          {/* Schedule / Date */}
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{req.dateRange}</span>
                            {req.createdAt && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                Loged: {formatDate(req.createdAt)}
                              </span>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="py-4 px-6">
                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono">
                              {req.duration}
                            </span>
                          </td>

                          {/* Reason & Remarks / Withdrawal details */}
                          <td className="py-4 px-6 min-w-[220px] max-w-sm">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{req.reason}</p>
                            {req.handoverNotes && (
                              <div className="mt-1 text-[11px] text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/40 p-1.5 rounded-lg border border-teal-200/70 dark:border-teal-800 flex items-start gap-1">
                                <span className="font-bold shrink-0">Delegation Note:</span>
                                <span className="italic">{req.handoverNotes}</span>
                              </div>
                            )}
                            {req.remarks && (
                              <div
                                className={`mt-1.5 text-xs p-2 rounded-xl border flex items-start gap-1.5 ${
                                  req.status === 'CANCELLED' || req.status === 'WITHDRAWN'
                                    ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {req.status === 'CANCELLED' || req.status === 'WITHDRAWN' ? (
                                  <Undo2 className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                                ) : (
                                  <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                                )}
                                <div className="leading-snug break-words">
                                  <span className="font-bold">
                                    {req.status === 'CANCELLED' || req.status === 'WITHDRAWN'
                                      ? 'Withdrawal Note: '
                                      : 'Note: '}
                                  </span>
                                  <span>
                                    {req.remarks.replace(/^Withdrawn:\s*/i, '').replace(/^\|\s*Withdrawn:\s*/i, '')}
                                  </span>
                                </div>
                              </div>
                            )}
                            {req.adminRemarks && (
                              <div className="mt-1.5 text-xs p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 flex items-start gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                                <div className="leading-snug break-words">
                                  <span className="font-bold">Admin Remarks: </span>
                                  <span>{req.adminRemarks}</span>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                                req.status === 'APPROVED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : req.status === 'REJECTED'
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                  : req.status === 'CANCELLED' || req.status === 'WITHDRAWN'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse'
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
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs border border-transparent dark:border-emerald-800"
                                  title="Approve Request"
                                >
                                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => setActionModal({ request: req, action: 'REJECTED' })}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs border border-transparent dark:border-rose-800"
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
                                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                                  title="Revoke and cancel this approved leave (restore quota)"
                                >
                                  <Undo2 className="h-3 w-3" />
                                  Revoke
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium italic">Reviewed</span>
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
      ) : activeTab === 'balances' ? (
        /* ── TAB 4: LEAVE BALANCES & QUOTAS MANAGEMENT ── */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={balanceSearchQuery}
                onChange={(e) => setBalanceSearchQuery(e.target.value)}
                placeholder="Search employee by name or code..."
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Year Selector & Carry Forward */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Quota Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none"
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading leave quotas & balances...</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-6">Casual Leave (CL)</th>
                      <th className="py-4 px-6">Sick Leave (SL)</th>
                      <th className="py-4 px-6">Comp Off</th>
                      <th className="py-4 px-6">Work From Home</th>
                      <th className="py-4 px-6 text-right">Edit Quota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredBalances.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
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
                          <tr key={b.employeeId} className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-4 px-6">
                              <span className="font-bold text-slate-900 dark:text-white block text-sm">{b.employeeName}</span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{b.employeeCode}</span>
                            </td>

                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {cl ? `${cl.balance} / ${cl.granted}` : '--'}
                                  </span>
                                  {cl && (cl.carriedForward ?? 0) > 0 && (
                                    <span className="text-[9px] font-black px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                      +{cl.carriedForward} C/F
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">
                                  Consumed: {cl?.consumed || 0}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {sl ? `${sl.balance} / ${sl.granted}` : '--'}
                                  </span>
                                  {sl && (sl.carriedForward ?? 0) > 0 && (
                                    <span className="text-[9px] font-black px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                      +{sl.carriedForward} C/F
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">
                                  Consumed: {sl?.consumed || 0}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {co ? `${co.balance} / ${co.granted}` : '--'}
                                  </span>
                                  {co && (co.carriedForward ?? 0) > 0 && (
                                    <span className="text-[9px] font-black px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                      +{co.carriedForward} C/F
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">
                                  Consumed: {co?.consumed || 0}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {wfh ? `${wfh.balance} / ${wfh.granted}` : '--'}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">
                                  Consumed: {wfh?.consumed || 0}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleOpenEditQuota(b)}
                                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 font-bold"
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
      ) : (
        /* ── TAB 5: LEAVE & ATTENDANCE CALENDAR (DAILY STATS) ── */
        <div className="space-y-4 animate-fade-in">
          {/* Calendar Controls & Legend */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Month & Year Navigation */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (calMonth === 1) {
                    setCalMonth(12);
                    setCalYear((y) => y - 1);
                  } else {
                    setCalMonth((m) => m - 1);
                  }
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {new Date(calYear, calMonth - 1, 1).toLocaleString('default', { month: 'long' })} {calYear}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCalYear(now.getFullYear());
                    setCalMonth(now.getMonth() + 1);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer"
                >
                  Current Month
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (calMonth === 12) {
                    setCalMonth(1);
                    setCalYear((y) => y + 1);
                  } else {
                    setCalMonth((m) => m + 1);
                  }
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Legend Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Presents
              </span>
              <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span> Leaves
              </span>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span> WFH
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span> Permissions
              </span>
              <span className="px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500"></span> Late Check-ins
              </span>
            </div>
          </div>

          {/* Calendar Grid */}
          {calendarLoading ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-16 text-center shadow-sm">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading daily attendance & leave breakdown...</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 overflow-x-auto">
              {/* Day Name Headers */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-800 min-w-[700px]">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-2 pt-3 min-w-[700px]">
                {(() => {
                  const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
                  const totalDays = new Date(calYear, calMonth, 0).getDate();
                  const todayStr = new Date().toISOString().split('T')[0];

                  const cells = [];
                  // Empty padding days before 1st
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(
                      <div key={`empty-${i}`} className="min-h-[100px] p-2 bg-slate-50/40 dark:bg-slate-800/30 rounded-2xl border border-transparent opacity-30" />
                    );
                  }

                  // Actual month days
                  for (let d = 1; d <= totalDays; d++) {
                    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const foundDay = calendarDays.find((cd) => cd.date === dateStr);
                    const dayData: CalendarDayData = foundDay || {
                      date: dateStr,
                      day: d,
                      dayOfWeek: '',
                      isWeekend: false,
                      isHoliday: false,
                      holidayName: null,
                      holidayType: null,
                      totalEmployees: 0,
                      presentCount: 0,
                      leaveCount: 0,
                      wfhCount: 0,
                      lateCount: 0,
                      permissionCount: 0,
                      absentCount: 0,
                      presentEmployees: [],
                      leaveEmployees: [],
                      wfhEmployees: [],
                      lateEmployees: [],
                      permissionEmployees: [],
                      absentEmployees: [],
                      presents: 0,
                      leaves: 0,
                      wfh: 0,
                      permissions: 0,
                      late: 0,
                    };

                    const presentsCount = dayData.presentCount ?? dayData.presents ?? 0;
                    const leavesCount = dayData.leaveCount ?? dayData.leaves ?? 0;
                    const wfhCount = dayData.wfhCount ?? dayData.wfh ?? 0;
                    const permissionsCount = dayData.permissionCount ?? dayData.permissions ?? 0;
                    const lateCount = dayData.lateCount ?? dayData.late ?? 0;

                    const isToday = dateStr === todayStr;
                    const hasData =
                      presentsCount > 0 ||
                      leavesCount > 0 ||
                      wfhCount > 0 ||
                      permissionsCount > 0 ||
                      lateCount > 0;

                    cells.push(
                      <div
                        key={dateStr}
                        onClick={() => setSelectedCalendarDay(dayData)}
                        className={`min-h-[105px] p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 hover:scale-[1.01] ${
                          isToday
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20 shadow-xs'
                            : hasData
                            ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-150 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-black h-6 w-6 rounded-full flex items-center justify-center ${
                              isToday
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700'
                            }`}
                          >
                            {d}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                              Today
                            </span>
                          )}
                        </div>

                        {/* Counts Badges */}
                        <div className="mt-2 space-y-1">
                          {presentsCount > 0 && (
                            <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                              <span>🟢 Presents</span>
                              <span className="font-black">{presentsCount}</span>
                            </div>
                          )}
                          {leavesCount > 0 && (
                            <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 flex items-center justify-between">
                              <span>🔴 Leaves</span>
                              <span className="font-black">{leavesCount}</span>
                            </div>
                          )}
                          {wfhCount > 0 && (
                            <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center justify-between">
                              <span>🔵 WFH</span>
                              <span className="font-black">{wfhCount}</span>
                            </div>
                          )}
                          {permissionsCount > 0 && (
                            <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-between">
                              <span>🟡 Perms</span>
                              <span className="font-black">{permissionsCount}</span>
                            </div>
                          )}
                          {lateCount > 0 && (
                            <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100/80 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 flex items-center justify-between">
                              <span>🟠 Late</span>
                              <span className="font-black">{lateCount}</span>
                            </div>
                          )}
                          {!hasData && (
                            <span className="text-[10px] text-slate-300 dark:text-slate-600 block text-center py-2 font-medium">
                              No records
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return cells;
                })()}
              </div>
            </div>
          )}

          {/* Day Click Breakdown Modal */}
          {selectedCalendarDay && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 animate-scale-up overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Attendance & Leave Roster • {formatDate(selectedCalendarDay.date)}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Complete employee status breakdown for this day</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCalendarDay(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body Details */}
                <div className="p-6 overflow-y-auto space-y-5">
                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                      <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Presents</span>
                      <span className="text-lg font-black text-emerald-900 dark:text-emerald-100">{selectedCalendarDay.presents}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                      <span className="block text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">Leaves</span>
                      <span className="text-lg font-black text-rose-900 dark:text-rose-100">{selectedCalendarDay.leaves}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
                      <span className="block text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">WFH</span>
                      <span className="text-lg font-black text-blue-900 dark:text-blue-100">{selectedCalendarDay.wfh}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                      <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Permissions</span>
                      <span className="text-lg font-black text-amber-900 dark:text-amber-100">{selectedCalendarDay.permissions}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-center">
                      <span className="block text-[10px] font-bold text-orange-700 dark:text-orange-300 uppercase">Late Check-in</span>
                      <span className="text-lg font-black text-orange-900 dark:text-orange-100">{selectedCalendarDay.late}</span>
                    </div>
                  </div>

                  {/* On Leave Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <UserMinus className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      Employees on Leave ({selectedCalendarDay.details?.leavesList?.length || 0})
                    </h4>
                    {selectedCalendarDay.details?.leavesList && selectedCalendarDay.details.leavesList.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCalendarDay.details.leavesList.map((emp: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">{emp.name}</span>
                                <span className="font-mono text-slate-500 dark:text-slate-400 font-medium">({emp.employeeCode})</span>
                              </div>
                              <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold mt-0.5 block">
                                {formatLeaveType(emp.leaveType)}
                              </span>
                            </div>
                            {emp.handoverEmployee && (
                              <div className="text-[11px] bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-medium flex items-center gap-1">
                                <Users className="h-3 w-3 text-teal-600 dark:text-teal-400 shrink-0" />
                                <span>Delegated To: <strong>{emp.handoverEmployee}</strong></span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        No approved leaves recorded for this date.
                      </p>
                    )}
                  </div>

                  {/* Present Employees Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Present Employees ({selectedCalendarDay.details?.presentsList?.length || 0})
                    </h4>
                    {selectedCalendarDay.details?.presentsList && selectedCalendarDay.details.presentsList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedCalendarDay.details.presentsList.map((emp: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{emp.name}</span>
                              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                {emp.employeeCode} {emp.department ? `• ${emp.department}` : ''}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                              Present
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        No present records recorded for this date.
                      </p>
                    )}
                  </div>

                  {/* WFH & Permissions Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* WFH */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        WFH ({selectedCalendarDay.details?.wfhList?.length || 0})
                      </h4>
                      {selectedCalendarDay.details?.wfhList && selectedCalendarDay.details.wfhList.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedCalendarDay.details.wfhList.map((emp: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs flex items-center justify-between"
                            >
                              <span className="font-bold text-slate-900 dark:text-white">{emp.name}</span>
                              <span className="font-mono text-slate-500 dark:text-slate-400 font-medium">{emp.employeeCode}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">None</p>
                      )}
                    </div>

                    {/* Permissions */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        Permissions ({selectedCalendarDay.details?.permissionsList?.length || 0})
                      </h4>
                      {selectedCalendarDay.details?.permissionsList && selectedCalendarDay.details.permissionsList.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedCalendarDay.details.permissionsList.map((emp: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs flex items-center justify-between"
                            >
                              <span className="font-bold text-slate-900 dark:text-white">{emp.name}</span>
                              <span className="font-mono text-amber-800 dark:text-amber-300 font-bold">{emp.time}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">None</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <button
                    onClick={() => setSelectedCalendarDay(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: RECORD DIRECT / UNAPPLIED LEAVE BY ADMIN ── */}
      {showUnappliedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 animate-scale-up overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold shrink-0">
                  <UserX className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Record Unapplied Leave</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Log unannounced absence or direct leave for employee</p>
                </div>
              </div>
              <button
                onClick={() => setShowUnappliedModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {unappliedError && (
              <div className="mx-6 mt-3 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {unappliedError}
              </div>
            )}

            <form onSubmit={handleRecordUnappliedLeave} className="p-6 pt-4 space-y-3 overflow-y-auto flex-1">
              {/* Row 1: Employee & Leave Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Select Employee *
                  </label>
                  <select
                    required
                    value={unappliedEmployeeId}
                    onChange={(e) => setUnappliedEmployeeId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Leave Category *
                  </label>
                  <select
                    value={unappliedLeaveType}
                    onChange={(e) => setUnappliedLeaveType(e.target.value as LeaveType)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 dark:text-slate-100"
                  >
                    <option value="CASUAL_LEAVE">Casual Leave (CL)</option>
                    <option value="SICK_LEAVE">Sick Leave (SL)</option>
                    <option value="LOSS_OF_PAY">Loss Of Pay (LOP)</option>
                    <option value="PERSONAL_LEAVE">Personal Leave</option>
                    <option value="WORK_FROM_HOME">Work From Home (WFH)</option>
                    <option value="COMP_OFF">Compensatory Off</option>
                    <option value="OTHER">Other Absence</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Duration Type & Dates */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Duration:</span>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="unappliedIsHalfDayRadio"
                        checked={!unappliedIsHalfDay}
                        onChange={() => setUnappliedIsHalfDay(false)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      Full / Multi Day
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-orange-700 dark:text-orange-400">
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

                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
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
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {unappliedIsHalfDay ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Shift Half *
                      </label>
                      <select
                        value={unappliedHalfDaySession}
                        onChange={(e) => setUnappliedHalfDaySession(e.target.value as 'FIRST_HALF' | 'SECOND_HALF')}
                        className="w-full px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 rounded-xl focus:outline-none"
                      >
                        <option value="FIRST_HALF">1st Half (Morning)</option>
                        <option value="SECOND_HALF">2nd Half (Afternoon)</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        To Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={unappliedToDate}
                        onChange={(e) => setUnappliedToDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Quick Presets & Reason */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Reason / Absence Note *
                </label>
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  {[
                    '🚨 Unannounced Absence',
                    '📞 Verbal / Phone Notice',
                    '🏥 Medical / Sick Absence',
                    '🚗 Transit / Travel Delay',
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setUnappliedReason(preset)}
                      className={`text-left px-2.5 py-1 text-[10.5px] rounded-lg border transition-all truncate cursor-pointer ${
                        unappliedReason === preset
                          ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium'
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
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 dark:text-slate-100 resize-none"
                />
              </div>

              {/* Row 4: Admin Internal Note */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Admin Internal Note / Action
                </label>
                <input
                  type="text"
                  value={unappliedAdminRemarks}
                  onChange={(e) => setUnappliedAdminRemarks(e.target.value)}
                  placeholder="e.g. Noted by HR on morning check-in / Adjusted against CL"
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Info Notice */}
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-[10.5px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>
                  Records leave as <strong>Approved (Admin Noted)</strong> and updates attendance status to <strong>LEAVE</strong>.
                </span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUnappliedModal(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unappliedSubmitting}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {unappliedSubmitting && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />}
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
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-7 shadow-2xl border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold ${
                    actionModal.action === 'APPROVED'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {actionModal.action === 'APPROVED' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {actionModal.action === 'APPROVED' ? 'Approve Request' : 'Reject Request'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {actionModal.request.requestType} • {actionModal.request.employee.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="mt-5 space-y-4">
              {/* Request Summary */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Type:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{actionModal.request.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Schedule:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{actionModal.request.dateRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Duration:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{actionModal.request.duration}</span>
                </div>
                <div className="pt-1 text-slate-600 dark:text-slate-300">
                  <span className="font-bold block text-slate-700 dark:text-slate-300">Reason:</span>
                  <span>{actionModal.request.reason}</span>
                </div>
                {actionModal.request.handoverEmployee && (
                  <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-700">
                    <span className="font-bold block text-teal-800 dark:text-teal-300 text-[11px]">
                      Delegated Work Coverage (Handover):
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {actionModal.request.handoverEmployee.name} ({actionModal.request.handoverEmployee.employeeCode})
                    </span>
                    {actionModal.request.handoverNotes && (
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                        "{actionModal.request.handoverNotes}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Remarks / Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="e.g., Approved as per discussion, or Reschedule to next week..."
                  className="w-full px-4 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
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
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-7 shadow-2xl border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Leave Quota</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {editQuotaModal.employeeName} ({editQuotaModal.employeeCode}) • {editQuotaModal.year}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditQuotaModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuota} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Casual Leave (CL)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={quotaForm.casualLeaveGranted}
                    onChange={(e) =>
                      setQuotaForm({ ...quotaForm, casualLeaveGranted: e.target.value === '' ? ('' as any) : Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Sick Leave (SL)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={quotaForm.sickLeaveGranted}
                    onChange={(e) =>
                      setQuotaForm({ ...quotaForm, sickLeaveGranted: e.target.value === '' ? ('' as any) : Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Comp Off</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={quotaForm.compOffGranted}
                    onChange={(e) =>
                      setQuotaForm({ ...quotaForm, compOffGranted: e.target.value === '' ? ('' as any) : Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Work From Home</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={quotaForm.workFromHomeGranted}
                    onChange={(e) =>
                      setQuotaForm({ ...quotaForm, workFromHomeGranted: e.target.value === '' ? ('' as any) : Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditQuotaModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quotaSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer"
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
