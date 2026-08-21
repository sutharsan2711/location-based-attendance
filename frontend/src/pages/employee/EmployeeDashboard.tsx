import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import { attendanceService } from '../../services/attendanceService';
import { locationService } from '../../services/locationService';
import { Attendance } from '../../types/attendance';
import { CompanyLocation } from '../../types/location';
import { calculateDistance } from '../../utils/locationUtils';
import { formatTime, formatDate } from '../../utils/dateUtils';
import Loading from '../../components/Loading';
import {
  TrackIllustration,
} from '../../components/GreythrIllustrations';
import {
  ArrowRight,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const {
    latitude,
    longitude,
    accuracy,
    loading: geoLoading,
    error: geoError,
    getCoordinates,
  } = useGeolocation();

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [officeLocation, setOfficeLocation] = useState<CompanyLocation | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [checkingLocation, setCheckingLocation] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSwipesModal, setShowSwipesModal] = useState(false);

  // ── 1. Live Digital Clock ──
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── 2. Data Fetching ──
  const fetchDashboardData = useCallback(async () => {
    try {
      const [todayAtt, locationConfig] = await Promise.all([
        attendanceService.getTodayAttendance(),
        locationService.getLocation(),
      ]);
      setAttendance(todayAtt);
      setOfficeLocation(locationConfig);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      if (!attendance) {
        setAttendance({
          id: 0,
          employee: { id: 0, name: user?.name || '', email: user?.email || '', role: 'EMPLOYEE', employeeCode: '', phone: '', status: 'ACTIVE' },
          attendanceDate: new Date().toISOString().split('T')[0],
          status: 'NOT_LOGGED_IN',
        } as any);
      }
    }
  }, [user, attendance]);

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading]);

  // Handle client-side distance calculation
  useEffect(() => {
    if (latitude && longitude && officeLocation) {
      const dist = calculateDistance(
        latitude,
        longitude,
        officeLocation.latitude,
        officeLocation.longitude
      );
      setCalculatedDistance(dist);
    } else {
      setCalculatedDistance(null);
    }
  }, [latitude, longitude, officeLocation]);

  // Browser geolocation check
  const checkCurrentLocation = useCallback(async () => {
    setCheckingLocation(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      await getCoordinates();
    } catch (err: any) {
      console.error(err);
    } finally {
      setCheckingLocation(false);
    }
  }, [getCoordinates]);

  useEffect(() => {
    if (officeLocation) {
      checkCurrentLocation();
    }
  }, [officeLocation, checkCurrentLocation]);

  // ── 3. Swipe Actions ──
  const handleSignIn = async () => {
    if (!latitude || !longitude || !accuracy || !officeLocation) {
      setApiError('GPS coordinates not ready. Please verify location first.');
      return;
    }

    setActionLoading(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const response = await attendanceService.loginAttendance({
        latitude,
        longitude,
        accuracy,
      });
      if (response.success) {
        setApiSuccess(response.message || 'Sign In recorded successfully!');
        fetchDashboardData();
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.response?.data?.message || 'Failed to record Sign In.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!latitude || !longitude || !accuracy || !officeLocation) {
      setApiError('GPS coordinates not ready. Please verify location first.');
      return;
    }

    setActionLoading(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const response = await attendanceService.logoutAttendance({
        latitude,
        longitude,
        accuracy,
      });
      if (response.success) {
        setApiSuccess(response.message || 'Sign Out recorded successfully!');
        fetchDashboardData();
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.response?.data?.message || 'Failed to record Sign Out.');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || !attendance) {
    return <Loading fullScreen message="Loading ESS Portal..." />;
  }

  const resolvedLocation = officeLocation ?? {
    companyName: 'ABC Technologies',
    latitude: 11.078319,
    longitude: 76.999745,
    allowedRadius: 50,
    maxGpsAccuracy: 100,
  };

  const isLocationVerified =
    calculatedDistance !== null &&
    calculatedDistance <= resolvedLocation.allowedRadius &&
    accuracy !== null &&
    accuracy <= resolvedLocation.maxGpsAccuracy;

  // Format dynamic dates
  const formattedDay = currentTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedWeekday = currentTime.toLocaleDateString('en-IN', { weekday: 'long' });
  const formattedTime = currentTime.toTimeString().split(' ')[0]; // e.g. 13:14:49

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* ── Status Alerts (if any) ── */}
      {apiSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 animate-slide">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{apiSuccess}</span>
          </div>
          <button onClick={() => setApiSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {apiError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 animate-slide">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button onClick={() => setApiError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Main Dashboard Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* ════════ COLUMN 1: Attendance Punch & Status (5 cols) ════════ */}
        <div className="md:col-span-5 space-y-4">
          
          {/* Attendance / Swipe In-Out Card */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
            {/* Header Date & Shift */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{formattedDay}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{formattedWeekday} | General Shift</p>
                <div className="text-2xl font-extrabold text-slate-800 tracking-tight mt-2 font-mono">
                  {formattedTime}
                </div>
              </div>
              
              {/* Online / GPS status dot indicator */}
              <div className="flex items-center gap-1.5 pt-1">
                <span
                  className={`h-3 w-3 rounded-full ${
                    isLocationVerified
                      ? 'bg-emerald-500 animate-pulse'
                      : geoLoading || checkingLocation
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-emerald-400'
                  }`}
                  title={isLocationVerified ? 'Within office boundary' : 'GPS Active'}
                />
              </div>
            </div>

            {/* Today's Attendance Details Box */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Login</span>
                <span className="text-xs font-bold text-slate-800 font-mono">
                  {attendance.loginTime ? formatTime(attendance.loginTime) : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Logout</span>
                <span className="text-xs font-bold text-slate-800 font-mono">
                  {attendance.logoutTime ? formatTime(attendance.logoutTime) : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Hours</span>
                <span className="text-xs font-bold text-slate-800 font-mono">
                  {attendance.loginTime && attendance.logoutTime
                    ? (() => {
                        const diff = new Date(attendance.logoutTime).getTime() - new Date(attendance.loginTime).getTime();
                        if (diff <= 0) return '--';
                        const h = Math.floor(diff / (1000 * 60 * 60));
                        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                      })()
                    : '--'}
                </span>
              </div>
            </div>

            {/* Attendance state helper banner */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">
                Status:{' '}
                {attendance.timingStatus === 'LEAVE' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    On Leave
                  </span>
                ) : attendance.timingStatus === 'PERMISSION' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Permission
                  </span>
                ) : attendance.timingStatus === 'LATE' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Late
                  </span>
                ) : attendance.status === 'LOGGED_IN' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Working
                  </span>
                ) : attendance.status === 'COMPLETED' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Present
                  </span>
                ) : (
                  <span className="font-bold text-slate-600">Not Signed In</span>
                )}
              </span>
              <button
                onClick={checkCurrentLocation}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold text-[10px]"
                title="Refresh GPS location"
              >
                <RefreshCw className={`h-3 w-3 ${checkingLocation ? 'animate-spin' : ''}`} />
                {calculatedDistance !== null ? `${Math.round(calculatedDistance)}m from office` : 'Detecting'}
              </button>
            </div>

            {/* Bottom Actions Row: "View Swipes" + "Sign In / Sign Out" Button */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setShowSwipesModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                View Swipes
              </button>

              {attendance.status === 'NOT_LOGGED_IN' && (
                <button
                  onClick={handleSignIn}
                  disabled={actionLoading || geoLoading || checkingLocation}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all duration-200 disabled:opacity-60"
                >
                  {actionLoading ? 'Signing In...' : 'Sign In'}
                </button>
              )}

              {attendance.status === 'LOGGED_IN' && (
                <button
                  onClick={handleSignOut}
                  disabled={actionLoading || geoLoading || checkingLocation}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all duration-200 disabled:opacity-60"
                >
                  {actionLoading ? 'Signing Out...' : 'Sign Out'}
                </button>
              )}

              {attendance.status === 'COMPLETED' && (
                <div className="px-4 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  Completed ✓
                </div>
              )}
            </div>

            {/* GPS Warning if outside radius */}
            {!isLocationVerified && calculatedDistance !== null && calculatedDistance > resolvedLocation.allowedRadius && (
              <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>You are {Math.round(calculatedDistance)}m away (max {resolvedLocation.allowedRadius}m allowed).</span>
              </div>
            )}
          </div>

          {/* Track card */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-xs font-bold text-slate-700">Track</h2>
            <div className="flex flex-col items-center justify-center py-5 text-center">
              <TrackIllustration className="w-24 h-20 mb-2" />
              <p className="text-xs text-slate-500 font-medium">All good! You've nothing new to track.</p>
            </div>
          </div>

        </div>

        {/* ════════ COLUMN 2: Requests & Leaves (4 cols) ════════ */}
        <div className="md:col-span-4 space-y-4">
          
          {/* Permission Requests Section */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-600" /> Permission
              </h2>
              <button
                onClick={() => navigate('/employee/permissions')}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                My Requests
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Need temporary time off during work hours? Apply for permission.
            </p>
            <button
              onClick={() => navigate('/employee/permissions')}
              className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              Apply Permission <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Leave Section */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-600" /> Leave
              </h2>
              <button
                onClick={() => navigate('/employee/leaves')}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                My Leaves
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Planning time off? Apply for casual, sick, or personal leave.
            </p>
            <button
              onClick={() => navigate('/employee/leaves')}
              className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              Apply Leave <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

        {/* ════════ COLUMN 3: Quick Access & Holidays (3 cols) ════════ */}
        <div className="md:col-span-3 space-y-4">
          
          {/* Quick Access */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-xs font-bold text-slate-700 mb-3">Quick Access</h2>
            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div onClick={() => navigate('/employee/attendance')} className="hover:text-blue-600 cursor-pointer transition-colors flex items-center justify-between py-1 border-b border-slate-100">
                <span>Attendance History</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </div>
              <div onClick={() => navigate('/employee/leaves')} className="hover:text-blue-600 cursor-pointer transition-colors flex items-center justify-between py-1 border-b border-slate-100">
                <span>Apply Leave</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </div>
              <div onClick={() => navigate('/employee/permissions')} className="hover:text-blue-600 cursor-pointer transition-colors flex items-center justify-between py-1 border-b border-slate-100">
                <span>Apply Permission</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </div>
              <div onClick={() => navigate('/employee/profile')} className="hover:text-blue-600 cursor-pointer transition-colors flex items-center justify-between py-1">
                <span>My Profile</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Upcoming Holidays */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-700">Upcoming Holidays</h2>
              <ArrowRight className="h-4 w-4 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="border-b border-slate-100 pb-2">
                <p className="text-[11px] font-bold text-slate-800">01 Sep <span className="font-medium text-slate-400">Tuesday</span></p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Vinayakar Chathurthi</p>
              </div>

              <div className="border-b border-slate-100 pb-2">
                <p className="text-[11px] font-bold text-slate-800">04 Sep <span className="font-medium text-slate-400">Friday</span></p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Krishna Jayanthi</p>
              </div>

              <div className="pb-1">
                <p className="text-[11px] font-bold text-slate-800">01 Oct <span className="font-medium text-slate-400">Thursday</span></p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Gandhi Jayanthi</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ════════ VIEW SWIPES MODAL ════════ */}
      {showSwipesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-slide">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Today's Swipe Details</h3>
              </div>
              <button
                onClick={() => setShowSwipesModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Date</span>
                <span className="font-bold text-slate-800">{attendance.attendanceDate}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Sign In Time</span>
                <span className="font-bold text-slate-800">
                  {attendance.loginTime ? formatTime(attendance.loginTime) : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Sign Out Time</span>
                <span className="font-bold text-slate-800">
                  {attendance.logoutTime ? formatTime(attendance.logoutTime) : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Attendance Status</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">
                  {attendance.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Recorded Distance</span>
                <span className="font-bold text-slate-800">
                  {attendance.loginDistance ? `${Math.round(attendance.loginDistance)} meters` : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500 font-medium">Office Geofence</span>
                <span className="font-bold text-emerald-600">
                  {resolvedLocation.companyName} (≤ {resolvedLocation.allowedRadius}m)
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => { setShowSwipesModal(false); navigate('/employee/attendance'); }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                View Full Monthly History
              </button>
              <button
                onClick={() => setShowSwipesModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
