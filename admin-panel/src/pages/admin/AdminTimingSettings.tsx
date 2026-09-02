import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';
import { CompanyLocation } from '../../types/location';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Code2,
  GraduationCap,
  Briefcase,
  Layers,
  Sparkles,
  Sliders,
  Check,
  Save,
  HelpCircle,
  Building2,
  ArrowRight,
  Zap,
  Timer,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const AdminTimingSettings: React.FC = () => {
  const [location, setLocation] = useState<CompanyLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'IT' | 'EDTECH' | 'BUSINESS'>('ALL');

  // General default fallback timings
  const [officeLoginTime, setOfficeLoginTime] = useState<string>('09:00');
  const [officeLogoutTime, setOfficeLogoutTime] = useState<string>('18:00');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(15);

  // 1. IT Team Shift (9:00 AM - 6:30 PM)
  const [itLoginTime, setItLoginTime] = useState<string>('09:00');
  const [itLogoutTime, setItLogoutTime] = useState<string>('18:30');
  const [itGraceMinutes, setItGraceMinutes] = useState<number>(15);

  // 2. EdTech Team Shift (8:45 AM - 5:45 PM)
  const [edtechLoginTime, setEdtechLoginTime] = useState<string>('08:45');
  const [edtechLogoutTime, setEdtechLogoutTime] = useState<string>('17:45');
  const [edtechGraceMinutes, setEdtechGraceMinutes] = useState<number>(15);

  // 3. Business Solution Team Shift (8:45 AM - 5:45 PM)
  const [businessLoginTime, setBusinessLoginTime] = useState<string>('08:45');
  const [businessLogoutTime, setBusinessLogoutTime] = useState<string>('17:45');
  const [businessGraceMinutes, setBusinessGraceMinutes] = useState<number>(15);

  // Live Simulator State
  const [simTeam, setSimTeam] = useState<'IT' | 'EDTECH' | 'BUSINESS'>('IT');
  const [simTime, setSimTime] = useState<string>('09:10');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await locationService.getLocation();
        setLocation(data);

        // General
        if (data.officeLoginTime) setOfficeLoginTime(data.officeLoginTime.substring(0, 5));
        if (data.officeLogoutTime) setOfficeLogoutTime(data.officeLogoutTime.substring(0, 5));
        if (data.gracePeriodMinutes !== undefined) setGracePeriodMinutes(data.gracePeriodMinutes);

        // IT Team
        if (data.itLoginTime) setItLoginTime(data.itLoginTime.substring(0, 5));
        if (data.itLogoutTime) setItLogoutTime(data.itLogoutTime.substring(0, 5));
        if (data.itGraceMinutes !== undefined) setItGraceMinutes(data.itGraceMinutes);

        // EdTech Team
        if (data.edtechLoginTime) setEdtechLoginTime(data.edtechLoginTime.substring(0, 5));
        if (data.edtechLogoutTime) setEdtechLogoutTime(data.edtechLogoutTime.substring(0, 5));
        if (data.edtechGraceMinutes !== undefined) setEdtechGraceMinutes(data.edtechGraceMinutes);

        // Business Solution Team
        if (data.businessLoginTime) setBusinessLoginTime(data.businessLoginTime.substring(0, 5));
        if (data.businessLogoutTime) setBusinessLogoutTime(data.businessLogoutTime.substring(0, 5));
        if (data.businessGraceMinutes !== undefined) setBusinessGraceMinutes(data.businessGraceMinutes);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load timing configurations.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Format 12hr helper
  const format12Hr = (timeStr: string) => {
    if (!timeStr) return '--';
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Compute late cutoff time string
  const calculateLateCutoff = (loginStr: string, graceMins: number) => {
    if (!loginStr) return '--';
    const [hours, mins] = loginStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + (graceMins || 0), 0);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Compute shift duration
  const computeShiftDuration = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return '8h 00m';
    const [h1, m1] = startStr.split(':').map(Number);
    const [h2, m2] = endStr.split(':').map(Number);
    let diffMins = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diffMins < 0) diffMins += 24 * 60;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : '00m'}`;
  };

  // Punctuality Simulator Calculation
  const simulateCheckIn = () => {
    let shiftStart = itLoginTime;
    let grace = itGraceMinutes;
    if (simTeam === 'EDTECH') {
      shiftStart = edtechLoginTime;
      grace = edtechGraceMinutes;
    } else if (simTeam === 'BUSINESS') {
      shiftStart = businessLoginTime;
      grace = businessGraceMinutes;
    }

    if (!simTime || !shiftStart) return { status: 'UNKNOWN', label: 'Enter time', color: 'slate' };

    const [hTest, mTest] = simTime.split(':').map(Number);
    const [hStart, mStart] = shiftStart.split(':').map(Number);

    const testMins = hTest * 60 + mTest;
    const startMins = hStart * 60 + mStart;
    const cutoffMins = startMins + (grace || 0);

    if (testMins <= startMins) {
      return {
        status: 'ON_TIME_STANDARD',
        label: 'PRESENT (Early / Right On Time)',
        detail: `Punched in before ${format12Hr(shiftStart)}. Full attendance recorded.`,
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        bannerColor: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        icon: 'emerald'
      };
    } else if (testMins <= cutoffMins) {
      const diff = testMins - startMins;
      return {
        status: 'ON_TIME_GRACE',
        label: 'PRESENT (Covered by Grace Period)',
        detail: `Punched in ${diff}m past shift start, but within ${grace}m grace allowance (Cutoff: ${calculateLateCutoff(shiftStart, grace)}).`,
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
        bannerColor: 'bg-amber-50 border-amber-200 text-amber-900',
        icon: 'amber'
      };
    } else {
      const diff = testMins - cutoffMins;
      return {
        status: 'LATE',
        label: 'LATE LOGIN RECORDED',
        detail: `Punched in ${diff}m after the ${grace}m grace cutoff (${calculateLateCutoff(shiftStart, grace)}). System automatically marks status as LATE.`,
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-300',
        bannerColor: 'bg-rose-50 border-rose-200 text-rose-900',
        icon: 'rose'
      };
    }
  };

  const simResult = simulateCheckIn();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;
    setSuccessMsg(null);
    setErrorMsg(null);
    setSaveLoading(true);

    try {
      const payload: CompanyLocation = {
        ...location,
        officeLoginTime: officeLoginTime.length === 5 ? `${officeLoginTime}:00` : officeLoginTime,
        officeLogoutTime: officeLogoutTime.length === 5 ? `${officeLogoutTime}:00` : officeLogoutTime,
        gracePeriodMinutes,

        itLoginTime: itLoginTime.length === 5 ? `${itLoginTime}:00` : itLoginTime,
        itLogoutTime: itLogoutTime.length === 5 ? `${itLogoutTime}:00` : itLogoutTime,
        itGraceMinutes,

        edtechLoginTime: edtechLoginTime.length === 5 ? `${edtechLoginTime}:00` : edtechLoginTime,
        edtechLogoutTime: edtechLogoutTime.length === 5 ? `${edtechLogoutTime}:00` : edtechLogoutTime,
        edtechGraceMinutes,

        businessLoginTime: businessLoginTime.length === 5 ? `${businessLoginTime}:00` : businessLoginTime,
        businessLogoutTime: businessLogoutTime.length === 5 ? `${businessLogoutTime}:00` : businessLogoutTime,
        businessGraceMinutes,
      };

      const updated = await locationService.updateLocation(payload);
      setLocation(updated);
      setSuccessMsg('Office attendance timing & team grace rules updated successfully!');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to update timing settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  const presetGraceOptions = [0, 5, 10, 15, 30];

  if (loading) return <Loading fullScreen message="Loading office timing engine..." />;

  return (
    <div className="space-y-6 max-w-6xl pb-16 animate-fade-in text-slate-800">
      {/* ── Top Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -mb-16 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              Office Attendance & Late Threshold Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Team Work Shifts & Late Login Timing Settings
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Configure standard work shifts, departure hours, and exact <strong>Permission / Grace Period (Minutes)</strong> applied to automatic late login detection across company departments.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={saveLoading}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
            >
              {saveLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-r-transparent" />
              ) : (
                <Save className="h-4 w-4 stroke-[2.5]" />
              )}
              Save All Timing Settings
            </button>
          </div>
        </div>

        {/* Quick Shift Summary Pills inside Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm rounded-xl px-3.5 py-2 border border-white/10">
            <div className="h-2 w-2 rounded-full bg-indigo-400" />
            <span className="text-indigo-200 font-bold">IT Team:</span>
            <span className="font-semibold text-white">{format12Hr(itLoginTime)} – {format12Hr(itLogoutTime)}</span>
            <span className="text-[10px] text-slate-400 font-mono ml-auto">+{itGraceMinutes}m grace</span>
          </div>

          <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm rounded-xl px-3.5 py-2 border border-white/10">
            <div className="h-2 w-2 rounded-full bg-teal-400" />
            <span className="text-teal-200 font-bold">EdTech:</span>
            <span className="font-semibold text-white">{format12Hr(edtechLoginTime)} – {format12Hr(edtechLogoutTime)}</span>
            <span className="text-[10px] text-slate-400 font-mono ml-auto">+{edtechGraceMinutes}m grace</span>
          </div>

          <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm rounded-xl px-3.5 py-2 border border-white/10">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-amber-200 font-bold">Business:</span>
            <span className="font-semibold text-white">{format12Hr(businessLoginTime)} – {format12Hr(businessLogoutTime)}</span>
            <span className="text-[10px] text-slate-400 font-mono ml-auto">+{businessGraceMinutes}m grace</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-slide">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── INTERACTIVE TEAM SHIFTS & GRACE TIMING SETTINGS ── */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ══════════════════════════════════════════════════════ */}
          {/* 1. IT TEAM SHIFT CARD                                  */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-3xl border-2 border-indigo-200/80 p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/70 rounded-bl-full -z-0" />

            <div className="relative z-10 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
                    <Code2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">IT Team</h3>
                    <p className="text-[11px] text-slate-400 font-semibold">Software & Technical Division</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {computeShiftDuration(itLoginTime, itLogoutTime)}
                </span>
              </div>

              {/* Timing Inputs */}
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Shift Start (Login)
                  </label>
                  <input
                    type="time"
                    required
                    value={itLoginTime}
                    onChange={(e) => setItLoginTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                  <span className="text-[10px] text-indigo-700 font-bold block mt-1">
                    {format12Hr(itLoginTime)}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Shift End (Logout)
                  </label>
                  <input
                    type="time"
                    required
                    value={itLogoutTime}
                    onChange={(e) => setItLogoutTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                  <span className="text-[10px] text-indigo-700 font-bold block mt-1">
                    {format12Hr(itLogoutTime)}
                  </span>
                </div>
              </div>

              {/* Permission / Grace Period Setting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Permission / Grace Window</span>
                  </label>
                  <span className="text-xs font-black text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    +{itGraceMinutes} Minutes
                  </span>
                </div>

                {/* Grace Quick Presets */}
                <div className="flex items-center gap-1.5">
                  {presetGraceOptions.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setItGraceMinutes(mins)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        itGraceMinutes === mins
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={itGraceMinutes}
                  onChange={(e) => setItGraceMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Late Login Result Formula */}
              <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-blue-50/60 rounded-2xl border border-indigo-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">On-Time Cutoff:</span>
                  <span className="font-bold text-emerald-700">Until {calculateLateCutoff(itLoginTime, itGraceMinutes)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Late Login Mark:</span>
                  <span className="font-bold text-rose-700">After {calculateLateCutoff(itLoginTime, itGraceMinutes)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '60%' }} title="On-time" />
                  <div className="bg-amber-400 h-full" style={{ width: '20%' }} title="Grace period" />
                  <div className="bg-rose-500 h-full" style={{ width: '20%' }} title="Late threshold" />
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════ */}
          {/* 2. EDTECH TEAM SHIFT CARD                              */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-3xl border-2 border-teal-200/80 p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/70 rounded-bl-full -z-0" />

            <div className="relative z-10 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shadow-xs">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">EdTech Team</h3>
                    <p className="text-[11px] text-slate-400 font-semibold">Content & Academic Division</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  {computeShiftDuration(edtechLoginTime, edtechLogoutTime)}
                </span>
              </div>

              {/* Timing Inputs */}
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Shift Start (Login)
                  </label>
                  <input
                    type="time"
                    required
                    value={edtechLoginTime}
                    onChange={(e) => setEdtechLoginTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                  />
                  <span className="text-[10px] text-teal-700 font-bold block mt-1">
                    {format12Hr(edtechLoginTime)}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Shift End (Logout)
                  </label>
                  <input
                    type="time"
                    required
                    value={edtechLogoutTime}
                    onChange={(e) => setEdtechLogoutTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                  />
                  <span className="text-[10px] text-teal-700 font-bold block mt-1">
                    {format12Hr(edtechLogoutTime)}
                  </span>
                </div>
              </div>

              {/* Permission / Grace Period Setting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-teal-600" />
                    <span>Permission / Grace Window</span>
                  </label>
                  <span className="text-xs font-black text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                    +{edtechGraceMinutes} Minutes
                  </span>
                </div>

                {/* Grace Quick Presets */}
                <div className="flex items-center gap-1.5">
                  {presetGraceOptions.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setEdtechGraceMinutes(mins)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        edtechGraceMinutes === mins
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={edtechGraceMinutes}
                  onChange={(e) => setEdtechGraceMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              {/* Late Login Result Formula */}
              <div className="p-3.5 bg-gradient-to-br from-teal-50 to-emerald-50/60 rounded-2xl border border-teal-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">On-Time Cutoff:</span>
                  <span className="font-bold text-emerald-700">Until {calculateLateCutoff(edtechLoginTime, edtechGraceMinutes)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Late Login Mark:</span>
                  <span className="font-bold text-rose-700">After {calculateLateCutoff(edtechLoginTime, edtechGraceMinutes)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '60%' }} title="On-time" />
                  <div className="bg-amber-400 h-full" style={{ width: '20%' }} title="Grace period" />
                  <div className="bg-rose-500 h-full" style={{ width: '20%' }} title="Late threshold" />
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════ */}
          {/* 3. BUSINESS SOLUTION TEAM SHIFT CARD                   */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-3xl border-2 border-amber-200/80 p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/70 rounded-bl-full -z-0" />

            <div className="relative z-10 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-xs">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Business Solution</h3>
                    <p className="text-[11px] text-slate-400 font-semibold">Operations & Sales Division</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {computeShiftDuration(businessLoginTime, businessLogoutTime)}
                </span>
              </div>

              {/* Timing Inputs */}
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Shift Start (Login)
                  </label>
                  <input
                    type="time"
                    required
                    value={businessLoginTime}
                    onChange={(e) => setBusinessLoginTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                  />
                  <span className="text-[10px] text-amber-800 font-bold block mt-1">
                    {format12Hr(businessLoginTime)}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Shift End (Logout)
                  </label>
                  <input
                    type="time"
                    required
                    value={businessLogoutTime}
                    onChange={(e) => setBusinessLogoutTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                  />
                  <span className="text-[10px] text-amber-800 font-bold block mt-1">
                    {format12Hr(businessLogoutTime)}
                  </span>
                </div>
              </div>

              {/* Permission / Grace Period Setting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-amber-600" />
                    <span>Permission / Grace Window</span>
                  </label>
                  <span className="text-xs font-black text-amber-800 font-mono bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                    +{businessGraceMinutes} Minutes
                  </span>
                </div>

                {/* Grace Quick Presets */}
                <div className="flex items-center gap-1.5">
                  {presetGraceOptions.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setBusinessGraceMinutes(mins)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        businessGraceMinutes === mins
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={businessGraceMinutes}
                  onChange={(e) => setBusinessGraceMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Late Login Result Formula */}
              <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl border border-amber-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">On-Time Cutoff:</span>
                  <span className="font-bold text-emerald-700">Until {calculateLateCutoff(businessLoginTime, businessGraceMinutes)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Late Login Mark:</span>
                  <span className="font-bold text-rose-700">After {calculateLateCutoff(businessLoginTime, businessGraceMinutes)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '60%' }} title="On-time" />
                  <div className="bg-amber-400 h-full" style={{ width: '20%' }} title="Grace period" />
                  <div className="bg-rose-500 h-full" style={{ width: '20%' }} title="Late threshold" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── INTERACTIVE TESTER & LOGIC RULES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ⚡ LIVE PUNCTUALITY SIMULATOR TOOL */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 text-white shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Live Late Login Simulator</h3>
                <p className="text-[11px] text-slate-400">Test how punch times evaluate with current grace rules</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Select Team
                </label>
                <select
                  value={simTeam}
                  onChange={(e) => setSimTeam(e.target.value as any)}
                  className="w-full rounded-xl bg-slate-800/90 border border-slate-700 px-3 py-2 text-xs font-bold text-white outline-none focus:border-indigo-400"
                >
                  <option value="IT">IT Team (09:00 AM)</option>
                  <option value="EDTECH">EdTech Team (08:45 AM)</option>
                  <option value="BUSINESS">Business Solution (08:45 AM)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Test Punch-In Time
                </label>
                <input
                  type="time"
                  value={simTime}
                  onChange={(e) => setSimTime(e.target.value)}
                  className="w-full rounded-xl bg-slate-800/90 border border-slate-700 px-3 py-2 text-xs font-bold text-white outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Live Result Box */}
            <div className={`p-4 rounded-2xl border ${simResult.bannerColor} space-y-1.5 transition-all`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Simulated Attendance Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${simResult.badgeColor}`}>
                  {simResult.label}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed font-medium">
                {simResult.detail}
              </p>
            </div>
          </div>

          {/* 🏢 GENERAL FALLBACK & POLICY EXPLANATION */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-extrabold text-sm text-slate-800">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <span>Attendance Evaluation & Permission Priority Rules</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>1. On-Time</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Check-in before or within the assigned team's grace period window.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="font-bold text-rose-700 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    <span>2. Late Login</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Check-in after grace cutoff. Automatically flagged as <strong>LATE</strong> in the register.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="font-bold text-indigo-700 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-indigo-600" />
                    <span>3. Permissions</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Approved permission requests waive late login marks for authorized windows.
                  </p>
                </div>
              </div>
            </div>

            {/* General Fallback Inputs */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 block">General Default Fallback</span>
                <span className="text-[11px] text-slate-400">Applied if employee is not assigned to a team</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={officeLoginTime}
                  onChange={(e) => setOfficeLoginTime(e.target.value)}
                  className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-800"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="time"
                  value={officeLogoutTime}
                  onChange={(e) => setOfficeLogoutTime(e.target.value)}
                  className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM STICKY SAVE BAR ── */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-3xl shadow-xl">
          <div className="flex items-center gap-3 pl-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">All changes are applied immediately</p>
              <p className="text-[11px] text-slate-400">Employee punch evaluations & late status calculate in real-time</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saveLoading}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
          >
            {saveLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-r-transparent" />
            ) : (
              <Save className="h-4 w-4 stroke-[2.5]" />
            )}
            Save Office Timing Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminTimingSettings;
