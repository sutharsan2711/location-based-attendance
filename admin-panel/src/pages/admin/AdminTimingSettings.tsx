import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';
import { CompanyLocation } from '../../types/location';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import { Clock, ShieldCheck, CheckCircle2, AlertTriangle, Info, Calendar } from 'lucide-react';

const AdminTimingSettings: React.FC = () => {
  const [location, setLocation] = useState<CompanyLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const [officeLoginTime, setOfficeLoginTime] = useState<string>('09:00');
  const [officeLogoutTime, setOfficeLogoutTime] = useState<string>('18:00');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(15);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await locationService.getLocation();
        setLocation(data);
        if (data.officeLoginTime) {
          setOfficeLoginTime(data.officeLoginTime.substring(0, 5));
        }
        if (data.officeLogoutTime) {
          setOfficeLogoutTime(data.officeLogoutTime.substring(0, 5));
        }
        if (data.gracePeriodMinutes !== undefined) {
          setGracePeriodMinutes(data.gracePeriodMinutes);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load timing configurations.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const calculateLateCutoff = () => {
    if (!officeLoginTime) return '09:15 AM';
    const [hours, mins] = officeLoginTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + (gracePeriodMinutes || 0), 0);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const format12Hr = (timeStr: string) => {
    if (!timeStr) return '--';
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
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
      };

      const updated = await locationService.updateLocation(payload);
      setLocation(updated);
      setSuccessMsg('Office attendance timing settings updated successfully!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to update office timing settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <Loading fullScreen message="Loading timing configurations..." />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
          Office Attendance Timing Settings
        </h1>
        <p className="text-sm text-slate-400">
          Control office work shifts, check-in cutoff thresholds, permission grace periods, and automated late detection
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Settings Form */}
        <Card title="Shift & Timing Controls" className="md:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-4">
            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Office Login Time
                </label>
                <input
                  type="time"
                  required
                  value={officeLoginTime}
                  onChange={(e) => setOfficeLoginTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none text-slate-800 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Office Logout Time
                </label>
                <input
                  type="time"
                  required
                  value={officeLogoutTime}
                  onChange={(e) => setOfficeLogoutTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none text-slate-800 bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Permission Time / Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                required
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-primary-500 outline-none text-slate-800 bg-white"
              />
              <p className="text-[11px] text-slate-400">
                Employees checking in within this grace window are marked as on-time.
              </p>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Late Threshold Preview:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Employees logging in <strong>after {calculateLateCutoff()}</strong> will be automatically marked as <strong className="text-amber-800 uppercase">LATE</strong>.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                loading={saveLoading}
                className="py-2.5 font-bold px-6"
              >
                SAVE TIMING SETTINGS
              </Button>
            </div>
          </form>
        </Card>

        {/* Info & Rule Summary Card */}
        <Card title="Attendance Logic Rules" className="md:col-span-2">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Standard Shift</p>
              <p className="text-sm font-bold text-slate-800">
                {format12Hr(officeLoginTime)} — {format12Hr(officeLogoutTime)}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Grace Window</p>
              <p className="text-sm font-bold text-slate-800">
                +{gracePeriodMinutes} Minutes (Until {calculateLateCutoff()})
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4 text-[11px] text-slate-500 space-y-2 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Info className="h-3.5 w-3.5 text-primary-500" />
                <span>Automatic Priority Evaluation:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                <li><strong className="text-rose-600">Approved Leave</strong>: Overrides all attendance requirements.</li>
                <li><strong className="text-indigo-600">Approved Permission</strong>: Check-in within approved permission window is never marked late.</li>
                <li><strong className="text-emerald-600">On Time</strong>: Login ≤ {calculateLateCutoff()}.</li>
                <li><strong className="text-amber-600">Late</strong>: Login &gt; {calculateLateCutoff()}.</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminTimingSettings;
