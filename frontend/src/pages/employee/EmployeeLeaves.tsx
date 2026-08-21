import React, { useState, useEffect, useCallback } from 'react';
import { requestService } from '../../services/requestService';
import { LeaveRequest, LeaveCreatePayload } from '../../types/request';
import { formatDate } from '../../utils/dateUtils';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  Calendar,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  Clock,
  RefreshCw,
} from 'lucide-react';

const EmployeeLeaves: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);

  const [leaveType, setLeaveType] = useState<
    'CASUAL_LEAVE' | 'SICK_LEAVE' | 'PERSONAL_LEAVE' | 'OTHER'
  >('CASUAL_LEAVE');
  const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMyLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestService.getMyLeaves();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyLeaves();
  }, [fetchMyLeaves]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setSubmitLoading(true);

    try {
      const payload: LeaveCreatePayload = {
        leaveType,
        fromDate,
        toDate,
        reason: reason.trim(),
        remarks: remarks.trim() || undefined,
      };

      await requestService.applyLeave(payload);
      setSuccessMsg('Leave application submitted successfully! Pending admin approval.');
      setShowApplyModal(false);
      setReason('');
      setRemarks('');
      fetchMyLeaves();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit leave application.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatLeaveType = (type: string) => {
    switch (type) {
      case 'CASUAL_LEAVE':
        return 'Casual Leave';
      case 'SICK_LEAVE':
        return 'Sick Leave';
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
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const columns = [
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
      header: 'Duration',
      render: (row: LeaveRequest) => (
        <span className="font-semibold text-slate-800 text-xs">
          {formatDate(row.fromDate)}
          {row.fromDate !== row.toDate && ` — ${formatDate(row.toDate)}`}
        </span>
      ),
    },
    {
      header: 'Reason',
      render: (row: LeaveRequest) => (
        <div className="max-w-xs">
          <p className="text-xs font-semibold text-slate-800">{row.reason}</p>
          {row.remarks && <p className="text-[11px] text-slate-400 mt-0.5">{row.remarks}</p>}
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
      header: 'Admin Feedback',
      render: (row: LeaveRequest) => (
        <span className="text-xs text-slate-500 italic">{row.adminRemarks || '--'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
            Leave Applications
          </h1>
          <p className="text-sm text-slate-400">
            Apply for casual, sick, or personal leaves and track approval status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchMyLeaves} className="py-2.5 px-3">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowApplyModal(true)}
            className="py-2.5 px-4 font-bold"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Apply Leave
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 animate-slide">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 animate-slide">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Table */}
      <Card title="My Leave History">
        <Table
          data={requests}
          columns={columns}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyMessage="You have not submitted any leave applications yet."
        />
      </Card>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" /> Apply for Leave
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white text-slate-800"
                >
                  <option value="CASUAL_LEAVE">Casual Leave</option>
                  <option value="SICK_LEAVE">Sick Leave</option>
                  <option value="PERSONAL_LEAVE">Personal Leave</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    From Date
                  </label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    To Date
                  </label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Reason for Leave
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Out of town, Viral fever, Family emergency..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional handover details or contact number..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-600 bg-white text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={submitLoading}
                  className="font-bold px-6"
                >
                  Apply Leave
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaves;
