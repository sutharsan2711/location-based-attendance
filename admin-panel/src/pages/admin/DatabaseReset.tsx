import React, { useState, useEffect } from 'react';
import { databaseService, DatabaseStats } from '../../services/databaseService';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Database,
  Users,
  CalendarDays,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  X,
  Lock,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ResetOptionConfig {
  id: string;
  title: string;
  tag: string;
  icon: React.ElementType;
  description: string;
  impactText: string;
  buttonLabel: string;
  accent: 'amber' | 'rose' | 'red';
}

const RESET_OPTIONS: ResetOptionConfig[] = [
  {
    id: 'ATTENDANCE',
    title: 'Attendance Records',
    tag: 'Logs Only',
    icon: CalendarDays,
    description: 'Permanently remove all historical check-in and check-out logs and GPS coordinates.',
    impactText: 'Deletes all punch logs. Keeps employees, leaves, and locations.',
    buttonLabel: 'Purge Attendance',
    accent: 'amber',
  },
  {
    id: 'LEAVES',
    title: 'Leaves & Permissions',
    tag: 'Requests',
    icon: FileCheck,
    description: 'Permanently remove all leave requests, permission slips, and reset balances.',
    impactText: 'Deletes leave applications. Keeps employee profiles and attendances.',
    buttonLabel: 'Purge Requests',
    accent: 'amber',
  },
  {
    id: 'EMPLOYEES',
    title: 'Employee Accounts',
    tag: 'Staff Wipe',
    icon: Users,
    description: 'Remove all non-admin employee accounts along with their attendances, leaves, and balances.',
    impactText: 'Deletes all employee profiles. Admin account is preserved.',
    buttonLabel: 'Remove Employees',
    accent: 'rose',
  },
  {
    id: 'FULL_SYSTEM_RESET',
    title: 'Full Clean Slate Reset',
    tag: 'Factory Wipe',
    icon: Trash2,
    description: 'Complete database wipe restoring a fresh production state with default settings.',
    impactText: 'Deletes all employees, logs, leaves, and resets locations. Keeps Admin account.',
    buttonLabel: 'Reset Database',
    accent: 'red',
  },
];

const DatabaseReset: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modal State
  const [selectedOption, setSelectedOption] = useState<ResetOptionConfig | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [resetting, setResetting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const data = await databaseService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load database stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const openConfirmationModal = (opt: ResetOptionConfig) => {
    setSelectedOption(opt);
    setConfirmationInput('');
    setActionError(null);
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;

    if (confirmationInput.trim().toUpperCase() !== 'CONFIRM_RESET') {
      setActionError('Please type exact confirmation code: CONFIRM_RESET');
      return;
    }

    setResetting(true);
    setActionError(null);

    try {
      const res = await databaseService.executeReset(selectedOption.id, confirmationInput.trim());
      setSuccessMessage(res.message || 'Database reset operation completed successfully.');
      setSelectedOption(null);
      await fetchStats();
    } catch (err: any) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to execute database reset operation.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <Loading fullScreen message="Loading database status..." />;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <Database className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Database Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Overview of stored records and administrative data purge tools
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Stats</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-xs font-medium text-emerald-800 animate-slide">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Minimalist Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Employees</span>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.totalEmployees}</p>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Attendance</span>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.totalAttendances}</p>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Leaves</span>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.totalLeaves}</p>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Permissions</span>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.totalPermissions}</p>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Locations</span>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.totalLocations}</p>
          </div>
        </div>
      )}

      {/* Admin Safeguard Pill */}
      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center gap-3 text-xs text-slate-600">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          <strong className="text-slate-800">Admin Account Safeguard:</strong> Primary administrator credentials (<code>admin@company.com</code>) are protected and will never be deleted.
        </span>
      </div>

      {/* Reset Options Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {RESET_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isFull = opt.id === 'FULL_SYSTEM_RESET';

          return (
            <div
              key={opt.id}
              className={`p-5 rounded-2xl border bg-white flex flex-col justify-between space-y-4 transition-all hover:border-slate-300 shadow-2xs ${
                isFull ? 'border-rose-200/90 bg-rose-50/10' : 'border-slate-200/80'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${
                      isFull ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">{opt.title}</h3>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {opt.tag}
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">{opt.description}</p>
                <p className="text-[11px] text-slate-400 italic">💡 {opt.impactText}</p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openConfirmationModal(opt)}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isFull
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200'
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{opt.buttonLabel}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Elegant Confirmation Modal */}
      {selectedOption && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-4 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden animate-scale">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600 border border-rose-100">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Reset</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOption(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleExecuteReset} className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-800">
                  Are you sure you want to execute <span className="text-rose-600">"{selectedOption.title}"</span>?
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {selectedOption.description}
                </p>
              </div>

              {actionError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-slate-400" />
                  Type <span className="font-mono font-bold text-rose-600">CONFIRM_RESET</span> to unlock:
                </label>
                <input
                  type="text"
                  required
                  placeholder="CONFIRM_RESET"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-rose-500 bg-white"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOption(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  loading={resetting}
                  disabled={confirmationInput.trim().toUpperCase() !== 'CONFIRM_RESET'}
                  className="py-2 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 cursor-pointer rounded-xl"
                >
                  Confirm Delete
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseReset;
