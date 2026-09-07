import React, { useState, useEffect } from 'react';
import { X, Check, Clock, AlertCircle } from 'lucide-react';
import { DailyWorkPlanItem, WorkPlanStatus } from '../types/workPlan';

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: DailyWorkPlanItem[];
  onSave: (
    updates: {
      id: number;
      status: WorkPlanStatus;
      reasonRemarks?: string;
      timeSpent?: string;
    }[]
  ) => Promise<void>;
}

const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({
  isOpen,
  onClose,
  plans,
  onSave,
}) => {
  const [formValues, setFormValues] = useState<
    Record<
      number,
      {
        status: WorkPlanStatus;
        reasonRemarks: string;
        timeSpent: string;
      }
    >
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<
      number,
      {
        status: WorkPlanStatus;
        reasonRemarks: string;
        timeSpent: string;
      }
    > = {};
    plans.forEach((p) => {
      initial[p.id] = {
        status: p.status || 'IN_PROGRESS',
        reasonRemarks: p.reasonRemarks || '',
        timeSpent: p.timeSpent || '',
      };
    });
    setFormValues(initial);
    setError(null);
  }, [plans, isOpen]);

  if (!isOpen) return null;

  const handleStatusChange = (id: number, status: WorkPlanStatus) => {
    setFormValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        status,
      },
    }));
  };

  const handleReasonChange = (id: number, reasonRemarks: string) => {
    setFormValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        reasonRemarks,
      },
    }));
  };

  const handleTimeChange = (id: number, timeSpent: string) => {
    setFormValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        timeSpent,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const updates = plans.map((p) => ({
        id: p.id,
        status: formValues[p.id]?.status || 'NOT_STARTED',
        reasonRemarks: formValues[p.id]?.reasonRemarks || '',
        timeSpent: formValues[p.id]?.timeSpent || '',
      }));
      await onSave(updates);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update work statuses.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Evening Work Status Update
              </h3>
              <p className="text-xs text-slate-500">
                Quickly review and update all your tasks for today
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {plans.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              No tasks planned for today. Please add morning tasks first.
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((p, idx) => {
                const current = formValues[p.id] || {
                  status: p.status,
                  reasonRemarks: p.reasonRemarks,
                  timeSpent: p.timeSpent,
                };
                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">{p.taskName}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                        {p.category || 'General'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Status
                        </label>
                        <select
                          value={current.status}
                          onChange={(e) => handleStatusChange(p.id, e.target.value as WorkPlanStatus)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="COMPLETED">✅ Completed</option>
                          <option value="IN_PROGRESS">🟡 In Progress</option>
                          <option value="NOT_COMPLETED">🔴 Not Completed</option>
                          <option value="NOT_STARTED">⚪ Not Started</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Time Spent
                        </label>
                        <input
                          type="text"
                          value={current.timeSpent}
                          onChange={(e) => handleTimeChange(p.id, e.target.value)}
                          placeholder="e.g. 2h 30m"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Remarks / Reason
                        </label>
                        <input
                          type="text"
                          value={current.reasonRemarks}
                          onChange={(e) => handleReasonChange(p.id, e.target.value)}
                          placeholder="Status reason or note..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || plans.length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Updating...</span>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Update All Tasks</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkUpdateModal;
