import React, { useState, useEffect } from 'react';
import { databaseService, DatabaseStats } from '../../services/databaseService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Database,
  Users,
  CalendarDays,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  X,
  Lock,
  Bomb,
  Clock,
  Layers,
} from 'lucide-react';

interface ResetOptionConfig {
  id: string;
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  impactList: string[];
  preservedList: string[];
  buttonLabel: string;
  severity: 'danger' | 'warning' | 'critical';
}

const RESET_OPTIONS: ResetOptionConfig[] = [
  {
    id: 'ATTENDANCE',
    title: 'Purge All Attendance Records',
    badge: 'Attendance Wipe',
    icon: CalendarDays,
    description: 'Permanently deletes all historical punch-in and punch-out check-in logs across all dates and employees.',
    impactList: [
      'All daily attendance records deleted',
      'All GPS coordinates & distance logs removed',
      'Monthly attendance grid reset to clean',
    ],
    preservedList: ['Employee accounts intact', 'Leave records preserved', 'Office locations preserved'],
    buttonLabel: 'Purge Attendance Data',
    severity: 'warning',
  },
  {
    id: 'LEAVES',
    title: 'Purge Leaves & Permissions',
    badge: 'Leave Records Wipe',
    icon: FileCheck,
    description: 'Permanently removes all submitted leave applications, permission requests, and resets leave balances.',
    impactList: [
      'All leave requests (Pending, Approved, Rejected) deleted',
      'All permission requests deleted',
      'All leave balance tables cleared',
    ],
    preservedList: ['Employee profiles intact', 'Attendance logs preserved', 'Office locations preserved'],
    buttonLabel: 'Purge Leave & Permissions',
    severity: 'warning',
  },
  {
    id: 'EMPLOYEES',
    title: 'Remove All Employee Accounts',
    badge: 'Staff Data Wipe',
    icon: Users,
    description: 'Removes all employee, trainee, and intern accounts, along with their attendances, leaves, and balances.',
    impactList: [
      'All non-admin employee user profiles deleted',
      'All employee attendance logs deleted',
      'All employee leave & permission requests deleted',
    ],
    preservedList: ['Primary Admin account preserved (admin@company.com)', 'Office locations preserved'],
    buttonLabel: 'Remove All Employees',
    severity: 'danger',
  },
  {
    id: 'FULL_SYSTEM_RESET',
    title: 'Full Production Clean Slate Reset',
    badge: 'Factory Data Wipe',
    icon: Bomb,
    description: 'Performs a comprehensive database wipe. Removes all employees, attendances, leaves, permissions, and resets locations to default.',
    impactList: [
      'All employee accounts deleted',
      'All attendance logs deleted',
      'All leave & permission applications deleted',
      'Company office locations reset to default',
    ],
    preservedList: ['Primary Admin login & credentials preserved safely'],
    buttonLabel: 'Execute Full System Reset',
    severity: 'critical',
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
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl flex items-center gap-2.5">
            <Database className="h-7 w-7 text-rose-600" />
            Database & System Data Reset
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Safely purge test records, wipe historical attendance, or perform clean factory resets
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchStats}
          loading={refreshing}
          className="font-bold py-2.5 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Database Stats</span>
        </Button>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 animate-slide">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Live Database Status Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Employees</span>
              <Users className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 font-mono mt-2">{stats.totalEmployees}</p>
            <span className="text-[10px] text-slate-400 mt-1">Non-Admin accounts</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Attendance Logs</span>
              <CalendarDays className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 font-mono mt-2">{stats.totalAttendances}</p>
            <span className="text-[10px] text-slate-400 mt-1">Total punches</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Leave Requests</span>
              <FileCheck className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 font-mono mt-2">{stats.totalLeaves}</p>
            <span className="text-[10px] text-slate-400 mt-1">Leave applications</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Permissions</span>
              <Clock className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 font-mono mt-2">{stats.totalPermissions}</p>
            <span className="text-[10px] text-slate-400 mt-1">Permission slips</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Locations</span>
              <Layers className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 font-mono mt-2">{stats.totalLocations}</p>
            <span className="text-[10px] text-slate-400 mt-1">Active branches</span>
          </div>
        </div>
      )}

      {/* Safety Notice Card */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 p-5 rounded-3xl text-white border border-rose-500/30 flex items-start gap-4 shadow-xl">
        <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30 shrink-0 text-rose-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            Protected Admin Safeguard Active
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            All reset actions strictly protect your administrator account (<code>admin@company.com</code>). Admin credentials, permissions, and settings remain safe. Each database purge requires manual confirmation to prevent accidental clicks.
          </p>
        </div>
      </div>

      {/* Danger Zone Options Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {RESET_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isCritical = opt.severity === 'critical';

          return (
            <Card
              key={opt.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-5 ${
                isCritical
                  ? 'border-rose-300 bg-rose-50/20 shadow-md hover:shadow-lg'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-2xl border ${
                        isCritical
                          ? 'bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{opt.title}</h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        {opt.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{opt.description}</p>

                {/* Impact List */}
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Will be removed:
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {opt.impactList.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Preserved List */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Preserved:
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {opt.preservedList.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100">
                <Button
                  variant={isCritical ? 'danger' : 'outline'}
                  size="sm"
                  onClick={() => openConfirmationModal(opt)}
                  className={`w-full py-2.5 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer ${
                    isCritical
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                      : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{opt.buttonLabel}</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ══════════════ CONFIRMATION MODAL ══════════════ */}
      {selectedOption && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-4 sm:p-6 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-scale">
            {/* Modal Header */}
            <div className="bg-rose-950 text-white px-6 py-4 flex items-center justify-between border-b border-rose-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-rose-600 rounded-lg text-white">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Confirm Database Deletion</h3>
                  <p className="text-[10px] text-rose-300">Irreversible database modification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOption(null)}
                className="text-rose-300 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleExecuteReset} className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
                <p className="text-xs font-bold text-rose-900">
                  You are about to execute: <u>{selectedOption.title}</u>
                </p>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {selectedOption.description}
                </p>
              </div>

              {actionError && (
                <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-xs font-semibold text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-700 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  Type <span className="font-mono text-rose-600 font-extrabold">CONFIRM_RESET</span> to proceed:
                </label>
                <input
                  type="text"
                  required
                  placeholder="CONFIRM_RESET"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className="w-full rounded-xl border border-rose-300 px-3.5 py-2.5 text-xs font-mono font-bold text-rose-900 outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-200 bg-white"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOption(null)}
                  className="py-2.5 px-4 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  loading={resetting}
                  disabled={confirmationInput.trim().toUpperCase() !== 'CONFIRM_RESET'}
                  className="py-2.5 px-6 font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 cursor-pointer"
                >
                  Confirm & Delete
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
