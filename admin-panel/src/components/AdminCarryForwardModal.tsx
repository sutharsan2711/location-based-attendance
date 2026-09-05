import React, { useState, useEffect } from 'react';
import { requestService } from '../services/requestService';
import { CarryForwardPreviewResponse, CarryForwardRulePayload } from '../types/request';
import Button from './Button';
import {
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Users,
  Calendar,
  Layers
} from 'lucide-react';

interface AdminCarryForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const currentYear = new Date().getFullYear();

const AdminCarryForwardModal: React.FC<AdminCarryForwardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fromYear, setFromYear] = useState<number>(currentYear - 1);
  const [toYear, setToYear] = useState<number>(currentYear);
  const [maxCasualLeaveCap, setMaxCasualLeaveCap] = useState<number>(3.0);
  const [maxSickLeaveCap, setMaxSickLeaveCap] = useState<number>(5.0);
  const [maxCompOffCap, setMaxCompOffCap] = useState<number>(2.0);
  const [enableCasualLeave, setEnableCasualLeave] = useState<boolean>(true);
  const [enableSickLeave, setEnableSickLeave] = useState<boolean>(true);
  const [enableCompOff, setEnableCompOff] = useState<boolean>(true);

  const [preview, setPreview] = useState<CarryForwardPreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getPayload = (): CarryForwardRulePayload => ({
    fromYear,
    toYear,
    maxCasualLeaveCap,
    maxSickLeaveCap,
    maxCompOffCap,
    enableCasualLeave,
    enableSickLeave,
    enableCompOff,
  });

  const handleFetchPreview = async () => {
    setLoadingPreview(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const data = await requestService.previewCarryForward(getPayload());
      setPreview(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to generate rollover preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecute = async () => {
    if (!window.confirm(`Are you sure you want to apply year ${fromYear} carry-forward balances into year ${toYear}? This will update opening balances for all employees.`)) {
      return;
    }

    setExecuting(true);
    setErrorMsg(null);
    try {
      await requestService.executeCarryForward(getPayload());
      setSuccessMsg(`Successfully rolled over leave balances from ${fromYear} into ${toYear}!`);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to execute carry-forward rollover.');
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleFetchPreview();
    }
  }, [isOpen, fromYear, toYear, maxCasualLeaveCap, maxSickLeaveCap, maxCompOffCap, enableCasualLeave, enableSickLeave, enableCompOff]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-sm text-blue-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Annual Leave Carry-Forward Engine</h3>
              <p className="text-xs text-blue-200">Roll over unused leave quota from previous calendar year with caps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Notifications */}
          {successMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Rule Settings Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary-500" /> Carry-Forward Rules & Year Selection
              </h4>
              <button
                type="button"
                onClick={handleFetchPreview}
                className="text-xs text-primary-600 hover:underline font-bold flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPreview ? 'animate-spin' : ''}`} /> Refresh Preview
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">From Year</label>
                <select
                  value={fromYear}
                  onChange={(e) => setFromYear(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">To Year (Target)</label>
                <select
                  value={toYear}
                  onChange={(e) => setToYear(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Casual Leave Max Cap</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.5}
                    value={maxCasualLeaveCap}
                    onChange={(e) => setMaxCasualLeaveCap(Number(e.target.value))}
                    disabled={!enableCasualLeave}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold"
                  />
                  <input
                    type="checkbox"
                    checked={enableCasualLeave}
                    onChange={(e) => setEnableCasualLeave(e.target.checked)}
                    title="Enable/Disable Casual Leave Rollover"
                    className="h-4 w-4 rounded text-primary-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Sick Leave Max Cap</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.5}
                    value={maxSickLeaveCap}
                    onChange={(e) => setMaxSickLeaveCap(Number(e.target.value))}
                    disabled={!enableSickLeave}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold"
                  />
                  <input
                    type="checkbox"
                    checked={enableSickLeave}
                    onChange={(e) => setEnableSickLeave(e.target.checked)}
                    title="Enable/Disable Sick Leave Rollover"
                    className="h-4 w-4 rounded text-primary-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Stats Banner */}
          {preview && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100 text-center">
                <span className="text-[10px] font-bold uppercase text-blue-700">Eligible Employees</span>
                <p className="text-xl font-extrabold text-blue-900 mt-0.5">{preview.totalEmployees}</p>
              </div>
              <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 text-center">
                <span className="text-[10px] font-bold uppercase text-indigo-700">Total Days to Carry</span>
                <p className="text-xl font-extrabold text-indigo-900 mt-0.5">{preview.totalDaysCarriedForward} Days</p>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Target Year</span>
                <p className="text-xl font-extrabold text-emerald-900 mt-0.5">Year {preview.toYear}</p>
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Casual Closing</th>
                    <th className="py-2.5 px-4">Casual Rollover</th>
                    <th className="py-2.5 px-4">Sick Closing</th>
                    <th className="py-2.5 px-4">Sick Rollover</th>
                    <th className="py-2.5 px-4 text-right">Total Carried</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {preview?.employees.map((emp) => (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/60">
                      <td className="py-2 px-4 font-semibold text-slate-800">
                        {emp.employeeName} <span className="text-[10px] text-slate-400 font-normal">({emp.employeeCode})</span>
                      </td>
                      <td className="py-2 px-4 font-mono">{emp.casualClosing}</td>
                      <td className="py-2 px-4 font-mono text-indigo-600 font-bold">+{emp.casualCarried}</td>
                      <td className="py-2 px-4 font-mono">{emp.sickClosing}</td>
                      <td className="py-2 px-4 font-mono text-indigo-600 font-bold">+{emp.sickCarried}</td>
                      <td className="py-2 px-4 text-right font-mono font-extrabold text-emerald-700">
                        +{emp.totalCarried} Days
                      </td>
                    </tr>
                  ))}
                  {(!preview || preview.employees.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {loadingPreview ? 'Calculating rollover preview...' : 'No employees eligible for carry-forward.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExecute}
            disabled={executing || !preview || preview.employees.length === 0}
            className="flex items-center gap-1.5 shadow-md bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="w-4 h-4" />
            {executing ? 'Rolling Over...' : `Apply Rollover to Year ${toYear}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminCarryForwardModal;
