import React, { useState, useEffect, useCallback } from 'react';
import { requestService } from '../../services/requestService';
import { PermissionRequest } from '../../types/request';
import { formatDate, formatTime } from '../../utils/dateUtils';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

const AdminPermissionRequests: React.FC = () => {
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action state
  const [actionModal, setActionModal] = useState<{
    request: PermissionRequest;
    action: 'APPROVED' | 'REJECTED';
  } | null>(null);
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestService.getAllPermissions({
        status: selectedStatus || undefined,
      });
      setRequests(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load permission requests.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    setActionLoading(true);

    try {
      await requestService.updatePermissionStatus(actionModal.request.id, {
        status: actionModal.action,
        adminRemarks: adminRemarks.trim() || undefined,
      });
      setActionModal(null);
      setAdminRemarks('');
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update permission status.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimeSlot = (timeStr: string) => {
    if (!timeStr) return '--';
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const filteredRequests = requests.filter((req) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      req.employee.name.toLowerCase().includes(q) ||
      req.employee.employeeCode.toLowerCase().includes(q) ||
      req.reason.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      header: 'Employee',
      render: (row: PermissionRequest) => (
        <div>
          <span className="font-bold text-slate-800 block text-sm">{row.employee.name}</span>
          <span className="font-mono text-[10px] text-slate-400 font-medium">
            {row.employee.employeeCode}
          </span>
        </div>
      ),
    },
    {
      header: 'Permission Date',
      render: (row: PermissionRequest) => (
        <span className="font-medium text-slate-700">{formatDate(row.permissionDate)}</span>
      ),
    },
    {
      header: 'Time Window',
      render: (row: PermissionRequest) => (
        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
          {formatTimeSlot(row.fromTime)} — {formatTimeSlot(row.toTime)}
        </span>
      ),
    },
    {
      header: 'Reason & Remarks',
      render: (row: PermissionRequest) => (
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
      header: 'Action',
      render: (row: PermissionRequest) => {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
            Permission Requests
          </h1>
          <p className="text-sm text-slate-400">Review, approve, or reject employee permission applications</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} className="py-2.5 px-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Status Filter:
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

      {/* Requests Table */}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : (
        <Card>
          <Table
            data={filteredRequests}
            columns={columns}
            keyExtractor={(row) => row.id}
            loading={loading}
            emptyMessage="No permission requests found."
          />
        </Card>
      )}

      {/* Approve/Reject Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">
              {actionModal.action === 'APPROVED' ? 'Approve Permission Request' : 'Reject Permission Request'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Employee: <strong>{actionModal.request.employee.name}</strong> ({formatDate(actionModal.request.permissionDate)})
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
                  placeholder="Add any internal note or remark for the employee..."
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
    </div>
  );
};

export default AdminPermissionRequests;
