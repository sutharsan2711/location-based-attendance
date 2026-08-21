import React, { useState, useEffect, useCallback } from 'react';
import { requestService } from '../../services/requestService';
import {
  LeaveRequest,
  LeaveBalanceSummary,
  LeaveGrantUpdatePayload,
} from '../../types/request';
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
} from 'lucide-react';

const currentYear = new Date().getFullYear();

const AdminLeaveRequests: React.FC = () => {
  // Tabs: 'applications' vs 'balances'
  const [activeTab, setActiveTab] = useState<'applications' | 'balances'>('applications');

  // Application State
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Balances State
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [balanceSummaries, setBalanceSummaries] = useState<LeaveBalanceSummary[]>([]);
  const [balancesLoading, setBalancesLoading] = useState<boolean>(false);
  const [balanceSearchQuery, setBalanceSearchQuery] = useState<string>('');

  // Action State (Applications)
  const [actionModal, setActionModal] = useState<{
    request: LeaveRequest;
    action: 'APPROVED' | 'REJECTED';
  } | null>(null);
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

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

  // Fetch Applications
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestService.getAllLeaves({
        status: selectedStatus || undefined,
      });
      setRequests(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load leave requests.');
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
    fetchRequests();
    fetchBalances(selectedYear);
  }, [fetchRequests, fetchBalances, selectedYear]);

  // Handle Application Approval/Rejection
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    setActionLoading(true);

    try {
      await requestService.updateLeaveStatus(actionModal.request.id, {
        status: actionModal.action,
        adminRemarks: adminRemarks.trim() || undefined,
      });
      setActionModal(null);
      setAdminRemarks('');
      fetchRequests();
      fetchBalances(selectedYear);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update leave request status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Quota Modal
  const openEditQuota = (summary: LeaveBalanceSummary) => {
    const getVal = (type: string) =>
      summary.balances.find((b) => b.type === type)?.granted ?? 0;

    setQuotaForm({
      employeeId: summary.employeeId,
      year: selectedYear,
      casualLeaveGranted: getVal('CASUAL_LEAVE'),
      sickLeaveGranted: getVal('SICK_LEAVE'),
      compOffGranted: getVal('COMP_OFF'),
      lossOfPayGranted: getVal('LOSS_OF_PAY'),
      workFromHomeGranted: getVal('WORK_FROM_HOME'),
    });
    setEditQuotaModal(summary);
  };

  // Save Edit Quota
  const handleQuotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuotaSaving(true);
    try {
      await requestService.updateLeaveGrants(quotaForm);
      setEditQuotaModal(null);
      fetchBalances(selectedYear);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save leave quota.');
    } finally {
      setQuotaSaving(false);
    }
  };

  // Export Balances to CSV
  const exportBalancesCSV = () => {
    const rows = [
      [
        'Employee Name',
        'Employee Code',
        'Casual Granted',
        'Casual Consumed',
        'Casual Balance',
        'Sick Granted',
        'Sick Consumed',
        'Sick Balance',
        'Comp-Off Granted',
        'Comp-Off Consumed',
        'Comp-Off Balance',
        'LOP Consumed',
        'WFH Granted',
        'WFH Consumed',
      ],
      ...balanceSummaries.map((s) => {
        const findB = (t: string) =>
          s.balances.find((b) => b.type === t) || { granted: 0, consumed: 0, balance: 0 };
        const cl = findB('CASUAL_LEAVE');
        const sl = findB('SICK_LEAVE');
        const co = findB('COMP_OFF');
        const lop = findB('LOSS_OF_PAY');
        const wfh = findB('WORK_FROM_HOME');
        return [
          s.employeeName,
          s.employeeCode,
          cl.granted,
          cl.consumed,
          cl.balance,
          sl.granted,
          sl.consumed,
          sl.balance,
          co.granted,
          co.consumed,
          co.balance,
          lop.consumed,
          wfh.granted,
          wfh.consumed,
        ];
      }),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Employee_Leave_Balances_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatLeaveType = (type: string) => {
    switch (type) {
      case 'CASUAL_LEAVE':
        return 'Casual Leave';
      case 'SICK_LEAVE':
        return 'Sick Leave';
      case 'LOSS_OF_PAY':
        return 'Loss of Pay';
      case 'COMP_OFF':
        return 'Comp - Off';
      case 'WORK_FROM_HOME':
        return 'Work From Home';
      case 'PERSONAL_LEAVE':
        return 'Personal Leave';
      default:
        return 'Other Leave';
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case 'SICK_LEAVE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CASUAL_LEAVE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'WORK_FROM_HOME':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'LOSS_OF_PAY':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const filteredRequests = requests.filter((req) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      req.employee.name.toLowerCase().includes(q) ||
      req.employee.employeeCode.toLowerCase().includes(q) ||
      req.reason.toLowerCase().includes(q)
    );
  });

  const filteredBalances = balanceSummaries.filter((s) => {
    const q = balanceSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.employeeName.toLowerCase().includes(q) ||
      s.employeeCode.toLowerCase().includes(q)
    );
  });

  const applicationColumns = [
    {
      header: 'Employee',
      render: (row: LeaveRequest) => (
        <div>
          <span className="font-bold text-slate-800 block text-sm">{row.employee.name}</span>
          <span className="font-mono text-[10px] text-slate-400 font-medium">
            {row.employee.employeeCode}
          </span>
        </div>
      ),
    },
    {
      header: 'Leave Type',
      render: (row: LeaveRequest) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${getLeaveTypeBadge(
            row.leaveType
          )}`}
        >
          {formatLeaveType(row.leaveType)}
        </span>
      ),
    },
    {
      header: 'Date Duration',
      render: (row: LeaveRequest) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs">
            {formatDate(row.fromDate)}
            {row.fromDate !== row.toDate && ` — ${formatDate(row.toDate)}`}
          </span>
        </div>
      ),
    },
    {
      header: 'Reason & Remarks',
      render: (row: LeaveRequest) => (
        <div className="max-w-xs">
          <p className="text-xs font-semibold text-slate-800">{row.reason}</p>
          {row.remarks && <p className="text-[11px] text-slate-400 mt-0.5">{row.remarks}</p>}
          {row.adminRemarks && (
            <p className="text-[10px] text-primary-600 mt-1 italic">Admin: {row.adminRemarks}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row: LeaveRequest) => {
        if (row.status === 'APPROVED') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              <Check className="h-3 w-3" /> Approved
            </span>
          );
        }
        if (row.status === 'REJECTED') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
              <X className="h-3 w-3" /> Rejected
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      },
    },
    {
      header: 'Action',
      render: (row: LeaveRequest) => {
        if (row.status !== 'PENDING') {
          return <span className="text-xs text-slate-400 font-medium">Completed</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActionModal({ request: row, action: 'APPROVED' })}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              onClick={() => setActionModal({ request: row, action: 'REJECTED' })}
              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
            Leave & Balances Management
          </h1>
          <p className="text-sm text-slate-400">
            Control employee leave balances, quotas, and review leave applications
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'balances' && (
            <Button variant="outline" size="sm" onClick={exportBalancesCSV} className="py-2 px-3">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchRequests();
              fetchBalances(selectedYear);
            }}
            className="py-2.5 px-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Tabs Header ── */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'applications'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <span>Leave Applications</span>
          {pendingCount > 0 && (
            <span className="h-5 px-2 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'balances'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Leave Balances & Quota Control</span>
        </button>
      </div>

      {/* ════════ TAB 1: APPLICATIONS ════════ */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <Card className="p-4 bg-white border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Status:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none bg-white text-slate-700"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div className="relative max-w-sm flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search employee or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs outline-none focus:border-primary-500 bg-white"
                />
              </div>
            </div>
          </Card>

          {/* Table */}
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
              {error}
            </div>
          ) : (
            <Card>
              <Table
                data={filteredRequests}
                columns={applicationColumns}
                keyExtractor={(row) => row.id}
                loading={loading}
                emptyMessage="No leave requests found."
              />
            </Card>
          )}
        </div>
      )}

      {/* ════════ TAB 2: BALANCES & QUOTA CONTROL ════════ */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <Card className="p-4 bg-white border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Select Year:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none bg-white text-slate-700 cursor-pointer"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                </select>
              </div>

              <div className="relative max-w-sm flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search employee name or code..."
                  value={balanceSearchQuery}
                  onChange={(e) => setBalanceSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs outline-none focus:border-primary-500 bg-white"
                />
              </div>
            </div>
          </Card>

          {/* Balances Table */}
          <Card className="overflow-hidden">
            {balancesLoading ? (
              <div className="p-8 text-center">
                <Loading fullScreen={false} message="Loading employee balances..." />
              </div>
            ) : filteredBalances.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No employee leave balances found for {selectedYear}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Casual Leave (Gr / Used / Bal)</th>
                      <th className="py-3 px-4">Sick Leave (Gr / Used / Bal)</th>
                      <th className="py-3 px-4">Comp-Off (Gr / Used / Bal)</th>
                      <th className="py-3 px-4">Loss Of Pay</th>
                      <th className="py-3 px-4">Work From Home</th>
                      <th className="py-3 px-4 text-right">Quota Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBalances.map((summary) => {
                      const findB = (t: string) =>
                        summary.balances.find((b) => b.type === t) || {
                          granted: 0,
                          consumed: 0,
                          balance: 0,
                        };
                      const cl = findB('CASUAL_LEAVE');
                      const sl = findB('SICK_LEAVE');
                      const co = findB('COMP_OFF');
                      const lop = findB('LOSS_OF_PAY');
                      const wfh = findB('WORK_FROM_HOME');

                      return (
                        <tr key={summary.employeeId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block text-sm">
                              {summary.employeeName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {summary.employeeCode}
                            </span>
                          </td>

                          {/* Casual Leave */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="font-bold text-slate-700">{cl.granted}</span>
                              <span className="text-slate-400">/</span>
                              <span className="text-rose-600 font-semibold">{cl.consumed}</span>
                              <span className="text-slate-400">/</span>
                              <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {cl.balance}
                              </span>
                            </div>
                          </td>

                          {/* Sick Leave */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="font-bold text-slate-700">{sl.granted}</span>
                              <span className="text-slate-400">/</span>
                              <span className="text-rose-600 font-semibold">{sl.consumed}</span>
                              <span className="text-slate-400">/</span>
                              <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {sl.balance}
                              </span>
                            </div>
                          </td>

                          {/* Comp-off */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="font-bold text-slate-700">{co.granted}</span>
                              <span className="text-slate-400">/</span>
                              <span className="text-rose-600 font-semibold">{co.consumed}</span>
                              <span className="text-slate-400">/</span>
                              <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {co.balance}
                              </span>
                            </div>
                          </td>

                          {/* Loss of Pay */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                              {lop.consumed} days
                            </span>
                          </td>

                          {/* Work From Home */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="font-bold text-slate-700">{wfh.granted}</span>
                              <span className="text-slate-400">/</span>
                              <span className="text-indigo-600 font-semibold">{wfh.consumed} used</span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openEditQuota(summary)}
                              className="px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Adjust Quota
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Approve/Reject Modal ── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">
              {actionModal.action === 'APPROVED' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Employee: <strong>{actionModal.request.employee.name}</strong> (
              {formatLeaveType(actionModal.request.leaveType)} from{' '}
              {formatDate(actionModal.request.fromDate)} to {formatDate(actionModal.request.toDate)})
            </p>

            <form onSubmit={handleActionSubmit} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Admin Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Add any internal note or message for the employee..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-primary-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setActionModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant={actionModal.action === 'APPROVED' ? 'primary' : 'danger'}
                  size="sm"
                  type="submit"
                  loading={actionLoading}
                  className="font-bold px-6"
                >
                  Confirm {actionModal.action === 'APPROVED' ? 'Approval' : 'Rejection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Quota Modal ── */}
      {editQuotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Adjust Leave Quota ({selectedYear})
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {editQuotaModal.employeeName} ({editQuotaModal.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setEditQuotaModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuotaSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Casual Leave Grant</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={quotaForm.casualLeaveGranted}
                    onChange={(e) =>
                      setQuotaForm({ ...quotaForm, casualLeaveGranted: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-primary-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block">Default: 5 days</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Sick Leave Grant</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={quotaForm.sickLeaveGranted}
                    onChange={(e) =>
                      setQuotaForm({ ...quotaForm, sickLeaveGranted: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-primary-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block">Default: 1 day</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Comp-Off Credit</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={quotaForm.compOffGranted}
                    onChange={(e) =>
                      setQuotaForm({ ...quotaForm, compOffGranted: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-primary-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block">Compensatory off days</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Work From Home (WFH)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={quotaForm.workFromHomeGranted}
                    onChange={(e) =>
                      setQuotaForm({
                        ...quotaForm,
                        workFromHomeGranted: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-primary-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block">WFH allowed quota</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setEditQuotaModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={quotaSaving}
                  className="px-6 font-bold"
                >
                  Save Quota Allocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaveRequests;
