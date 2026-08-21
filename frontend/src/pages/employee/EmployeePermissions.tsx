import React, { useState, useEffect, useCallback } from 'react';
import { requestService } from '../../services/requestService';
import { PermissionRequest, PermissionCreatePayload } from '../../types/request';
import { formatDate } from '../../utils/dateUtils';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  Clock,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Check,
  RefreshCw,
} from 'lucide-react';

const EmployeePermissions: React.FC = () => {
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);

  const [permissionDate, setPermissionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [fromTime, setFromTime] = useState<string>('09:00');
  const [toTime, setToTime] = useState<string>('10:00');
  const [reason, setReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMyPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestService.getMyPermissions();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPermissions();
  }, [fetchMyPermissions]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setSubmitLoading(true);

    try {
      const payload: PermissionCreatePayload = {
        permissionDate,
        fromTime: fromTime.length === 5 ? `${fromTime}:00` : fromTime,
        toTime: toTime.length === 5 ? `${toTime}:00` : toTime,
        reason: reason.trim(),
        remarks: remarks.trim() || undefined,
      };

      await requestService.applyPermission(payload);
      setSuccessMsg('Permission request submitted successfully! Pending admin approval.');
      setShowApplyModal(false);
      setReason('');
      setRemarks('');
      fetchMyPermissions();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit permission request.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatTimeSlot = (timeStr: string) => {
    if (!timeStr) return '--';
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const columns = [
    {
      header: 'Permission Date',
      render: (row: PermissionRequest) => (
        <span className="font-bold text-slate-800 text-xs">{formatDate(row.permissionDate)}</span>
      ),
    },
    {
      header: 'Time Window',
      render: (row: PermissionRequest) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
          {formatTimeSlot(row.fromTime)} — {formatTimeSlot(row.toTime)}
        </span>
      ),
    },
    {
      header: 'Reason',
      render: (row: PermissionRequest) => (
        <div className="max-w-xs">
          <p className="text-xs font-semibold text-slate-800">{row.reason}</p>
          {row.remarks && <p className="text-[11px] text-slate-400 mt-0.5">{row.remarks}</p>}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row: PermissionRequest) => {
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
      render: (row: PermissionRequest) => (
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
            Permission Requests
          </h1>
          <p className="text-sm text-slate-400">
            Apply for office permissions or view status of submitted requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchMyPermissions} className="py-2.5 px-3">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowApplyModal(true)}
            className="py-2.5 px-4 font-bold"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Apply Permission
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
      <Card title="My Permission History">
        <Table
          data={requests}
          columns={columns}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyMessage="You have not submitted any permission requests yet."
        />
      </Card>

      {/* Apply Permission Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" /> Apply for Permission
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
                  Permission Date
                </label>
                <input
                  type="date"
                  required
                  value={permissionDate}
                  onChange={(e) => setPermissionDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white text-slate-800"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    From Time
                  </label>
                  <input
                    type="time"
                    required
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    To Time
                  </label>
                  <input
                    type="time"
                    required
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Reason for Permission
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doctor appointment, Personal work..."
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
                  placeholder="Additional details or explanations..."
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
                  Apply Permission
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePermissions;
