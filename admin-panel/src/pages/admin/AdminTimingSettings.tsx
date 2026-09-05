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
  Sliders,
  Check,
  Save,
  HelpCircle,
  Building2,
  ArrowRight,
  Timer,
  AlertCircle,
  Users,
  Plus,
  Trash2,
  Sparkles,
  X,
} from 'lucide-react';

export interface CustomTeamShift {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  loginTime: string;
  logoutTime: string;
  graceMinutes: number;
}

const AdminTimingSettings: React.FC = () => {
  const [location, setLocation] = useState<CompanyLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'IT' | 'EDTECH' | 'BUSINESS' | 'OG'>('ALL');

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

  // 4. OG Team Shift (8:45 AM - 6:15 PM)
  const [ogLoginTime, setOgLoginTime] = useState<string>('08:45');
  const [ogLogoutTime, setOgLogoutTime] = useState<string>('18:15');
  const [ogGraceMinutes, setOgGraceMinutes] = useState<number>(15);

  // Custom Team Shifts created by Admin
  const [customShifts, setCustomShifts] = useState<CustomTeamShift[]>(() => {
    try {
      const raw = localStorage.getItem('custom_attendance_teams');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.map((item: any) => ({
        id: item.id || item.name,
        name: item.name?.split('(')[0]?.trim() || item.name || 'Custom Team',
        displayName: item.displayName || item.name,
        description: item.description || 'Custom Assigned Work Shift',
        loginTime: item.loginTime || '09:00',
        logoutTime: item.logoutTime || '18:00',
        graceMinutes: typeof item.graceMinutes === 'number' ? item.graceMinutes : 15,
      }));
    } catch {
      return [];
    }
  });

  const [showAddShiftModal, setShowAddShiftModal] = useState<boolean>(false);
  const [newShiftName, setNewShiftName] = useState<string>('');
  const [newShiftDesc, setNewShiftDesc] = useState<string>('');
  const [newShiftLogin, setNewShiftLogin] = useState<string>('09:00');
  const [newShiftLogout, setNewShiftLogout] = useState<string>('18:00');
  const [newShiftGrace, setNewShiftGrace] = useState<number>(15);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddCustomShift = () => {
    if (!newShiftName.trim()) return;
    const teamId = newShiftName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const dispName = `${newShiftName.trim()} (${format12Hr(newShiftLogin)} - ${format12Hr(newShiftLogout)})`;
    const newShift: CustomTeamShift = {
      id: teamId,
      name: newShiftName.trim(),
      displayName: dispName,
      description: newShiftDesc.trim() || 'Custom Assigned Work Shift',
      loginTime: newShiftLogin,
      logoutTime: newShiftLogout,
      graceMinutes: newShiftGrace,
    };
    const updated = [...customShifts.filter((s) => s.id !== teamId), newShift];
    setCustomShifts(updated);
    localStorage.setItem('custom_attendance_teams', JSON.stringify(updated));
    setNewShiftName('');
    setNewShiftDesc('');
    setNewShiftLogin('09:00');
    setNewShiftLogout('18:00');
    setNewShiftGrace(15);
    setShowAddShiftModal(false);
    setSuccessMsg(`Team Work Shift for "${newShift.name}" created successfully!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleUpdateCustomShift = (id: string, field: keyof CustomTeamShift, value: any) => {
    setCustomShifts((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== id) return s;
        const modified = { ...s, [field]: value };
        modified.displayName = `${modified.name} (${format12Hr(modified.loginTime)} - ${format12Hr(modified.logoutTime)})`;
        return modified;
      });
      localStorage.setItem('custom_attendance_teams', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteCustomShift = (id: string) => {
    const updated = customShifts.filter((s) => s.id !== id);
    setCustomShifts(updated);
    localStorage.setItem('custom_attendance_teams', JSON.stringify(updated));
    setSuccessMsg('Custom team shift removed.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

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

        // OG Team
        if (data.ogLoginTime) setOgLoginTime(data.ogLoginTime.substring(0, 5));
        if (data.ogLogoutTime) setOgLogoutTime(data.ogLogoutTime.substring(0, 5));
        if (data.ogGraceMinutes !== undefined) setOgGraceMinutes(data.ogGraceMinutes);
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

        ogLoginTime: ogLoginTime.length === 5 ? `${ogLoginTime}:00` : ogLoginTime,
        ogLogoutTime: ogLogoutTime.length === 5 ? `${ogLogoutTime}:00` : ogLogoutTime,
        ogGraceMinutes,
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
    <div className="space-y-6 max-w-7xl pb-16 animate-fade-in text-slate-800">
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
              type="button"
              onClick={() => setShowAddShiftModal(true)}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              Add Team Shift
            </button>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
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

          <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm rounded-xl px-3.5 py-2 border border-white/10">
            <div className="h-2 w-2 rounded-full bg-violet-400" />
            <span className="text-violet-200 font-bold">Business Solution 2:</span>
            <span className="font-semibold text-white">{format12Hr(ogLoginTime)} – {format12Hr(ogLogoutTime)}</span>
            <span className="text-[10px] text-slate-400 font-mono ml-auto">+{ogGraceMinutes}m grace</span>
          </div>

          {/* Render custom team shift pills */}
          {customShifts.map((cs) => (
            <div key={cs.id} className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm rounded-xl px-3.5 py-2 border border-white/10">
              <div className="h-2 w-2 rounded-full bg-cyan-400" />
              <span className="text-cyan-200 font-bold truncate max-w-[100px]">{cs.name}:</span>
              <span className="font-semibold text-white">{format12Hr(cs.loginTime)} – {format12Hr(cs.logoutTime)}</span>
              <span className="text-[10px] text-slate-400 font-mono ml-auto">+{cs.graceMinutes}m grace</span>
            </div>
          ))}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

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
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
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
                  <span className="text-[10px] text-teal-800 font-bold block mt-1">
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
                  <span className="text-[10px] text-teal-800 font-bold block mt-1">
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
                  <span className="text-xs font-black text-teal-800 font-mono bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
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

          {/* ══════════════════════════════════════════════════════ */}
          {/* 4. OG TEAM SHIFT CARD                                  */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-3xl border-2 border-violet-200/80 p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50/70 rounded-bl-full -z-0" />

            <div className="relative z-10 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold shadow-xs">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Business Solution 2</h3>
                    <p className="text-[11px] text-slate-400 font-semibold">Business Solution 2 Shift Division</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-50 text-violet-800 border border-violet-200">
                  {computeShiftDuration(ogLoginTime, ogLogoutTime)}
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
                    value={ogLoginTime}
                    onChange={(e) => setOgLoginTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none"
                  />
                  <span className="text-[10px] text-violet-800 font-bold block mt-1">
                    {format12Hr(ogLoginTime)}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Shift End (Logout)
                  </label>
                  <input
                    type="time"
                    required
                    value={ogLogoutTime}
                    onChange={(e) => setOgLogoutTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none"
                  />
                  <span className="text-[10px] text-violet-800 font-bold block mt-1">
                    {format12Hr(ogLogoutTime)}
                  </span>
                </div>
              </div>

              {/* Permission / Grace Period Setting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-violet-600" />
                    <span>Permission / Grace Window</span>
                  </label>
                  <span className="text-xs font-black text-violet-800 font-mono bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                    +{ogGraceMinutes} Minutes
                  </span>
                </div>

                {/* Grace Quick Presets */}
                <div className="flex items-center gap-1.5">
                  {presetGraceOptions.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setOgGraceMinutes(mins)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        ogGraceMinutes === mins
                          ? 'bg-violet-600 text-white shadow-xs'
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
                  value={ogGraceMinutes}
                  onChange={(e) => setOgGraceMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              {/* Late Login Result Formula */}
              <div className="p-3.5 bg-gradient-to-br from-violet-50 to-purple-50/60 rounded-2xl border border-violet-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">On-Time Cutoff:</span>
                  <span className="font-bold text-emerald-700">Until {calculateLateCutoff(ogLoginTime, ogGraceMinutes)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Late Login Mark:</span>
                  <span className="font-bold text-rose-700">After {calculateLateCutoff(ogLoginTime, ogGraceMinutes)}</span>
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
          {/* 5+. DYNAMIC CUSTOM TEAM WORK SHIFTS                     */}
          {/* ══════════════════════════════════════════════════════ */}
          {customShifts.map((shift, idx) => (
            <div
              key={shift.id}
              className="bg-white rounded-3xl border-2 border-cyan-200/80 p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden animate-fade-in"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50/70 rounded-bl-full -z-0" />

              <div className="relative z-10 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold shadow-xs">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{shift.name}</h3>
                      <p className="text-[11px] text-slate-400 font-semibold">{shift.description || 'Custom Shift Division'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                      {computeShiftDuration(shift.loginTime, shift.logoutTime)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomShift(shift.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Custom Shift"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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
                      value={shift.loginTime}
                      onChange={(e) => handleUpdateCustomShift(shift.id, 'loginTime', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none"
                    />
                    <span className="text-[10px] text-cyan-800 font-bold block mt-1">
                      {format12Hr(shift.loginTime)}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                      Shift End (Logout)
                    </label>
                    <input
                      type="time"
                      required
                      value={shift.logoutTime}
                      onChange={(e) => handleUpdateCustomShift(shift.id, 'logoutTime', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none"
                    />
                    <span className="text-[10px] text-cyan-800 font-bold block mt-1">
                      {format12Hr(shift.logoutTime)}
                    </span>
                  </div>
                </div>

                {/* Permission / Grace Period Setting */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5 text-cyan-600" />
                      <span>Permission / Grace Window</span>
                    </label>
                    <span className="text-xs font-black text-cyan-800 font-mono bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">
                      +{shift.graceMinutes} Minutes
                    </span>
                  </div>

                  {/* Grace Quick Presets */}
                  <div className="flex items-center gap-1.5">
                    {presetGraceOptions.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleUpdateCustomShift(shift.id, 'graceMinutes', mins)}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                          shift.graceMinutes === mins
                            ? 'bg-cyan-600 text-white shadow-xs'
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
                    value={shift.graceMinutes}
                    onChange={(e) => handleUpdateCustomShift(shift.id, 'graceMinutes', parseInt(e.target.value, 10) || 0)}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>

                {/* Late Login Result Formula */}
                <div className="p-3.5 bg-gradient-to-br from-cyan-50 to-teal-50/60 rounded-2xl border border-cyan-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold">On-Time Cutoff:</span>
                    <span className="font-bold text-emerald-700">Until {calculateLateCutoff(shift.loginTime, shift.graceMinutes)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold">Late Login Mark:</span>
                    <span className="font-bold text-rose-700">After {calculateLateCutoff(shift.loginTime, shift.graceMinutes)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: '60%' }} title="On-time" />
                    <div className="bg-amber-400 h-full" style={{ width: '20%' }} title="Grace period" />
                    <div className="bg-rose-500 h-full" style={{ width: '20%' }} title="Late threshold" />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Action Card: Add New Shift */}
          <button
            type="button"
            onClick={() => setShowAddShiftModal(true)}
            className="rounded-3xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 p-8 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer group min-h-[350px]"
          >
            <div className="h-14 w-14 rounded-2xl bg-white group-hover:bg-emerald-100 text-slate-400 group-hover:text-emerald-700 flex items-center justify-center shadow-xs border border-slate-200 group-hover:border-emerald-200 transition-all">
              <Plus className="h-7 w-7" />
            </div>
            <div>
              <h4 className="font-black text-slate-800 group-hover:text-emerald-900 text-sm">Create New Team Work Shift</h4>
              <p className="text-slate-400 text-xs mt-1 max-w-[220px]">
                Define shift login/logout hours & late grace window for any department.
              </p>
            </div>
          </button>
        </div>
      </form>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ADD CUSTOM WORK SHIFT MODAL                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showAddShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <Card title="Add New Team Work Shift & Grace Timing" className="w-full max-w-md shadow-2xl bg-white animate-in fade-in">
            <div className="space-y-4 text-xs">
              <p className="text-slate-500 text-[11px]">
                Set up standard work shift hours and late login grace limits for a department.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Team / Department Name</label>
                <input
                  type="text"
                  required
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-indigo-600 font-semibold"
                  placeholder="e.g. Digital Marketing, Customer Support"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Division / Description (Optional)</label>
                <input
                  type="text"
                  value={newShiftDesc}
                  onChange={(e) => setNewShiftDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-indigo-600"
                  placeholder="e.g. Growth & Marketing Operations"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">Shift Start (Login)</label>
                  <input
                    type="time"
                    required
                    value={newShiftLogin}
                    onChange={(e) => setNewShiftLogin(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-indigo-600 bg-white font-bold"
                  />
                  <span className="text-[10px] text-indigo-700 font-bold block mt-1">
                    {format12Hr(newShiftLogin)}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">Shift End (Logout)</label>
                  <input
                    type="time"
                    required
                    value={newShiftLogout}
                    onChange={(e) => setNewShiftLogout(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-indigo-600 bg-white font-bold"
                  />
                  <span className="text-[10px] text-indigo-700 font-bold block mt-1">
                    {format12Hr(newShiftLogout)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 text-[11px]">Late Login Grace Window</label>
                  <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                    +{newShiftGrace} Minutes
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  {presetGraceOptions.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setNewShiftGrace(mins)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        newShiftGrace === mins
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
                  value={newShiftGrace}
                  onChange={(e) => setNewShiftGrace(parseInt(e.target.value, 10) || 0)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowAddShiftModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="button" onClick={handleAddCustomShift} disabled={!newShiftName.trim()}>
                  Create Team Shift
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminTimingSettings;
