import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import { authService } from '../../services/authService';
import {
  KeyRound,
  User as UserIcon,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  MapPin,
  MapPinOff,
  RefreshCw,
  Info,
  Sparkles,
  Lock,
} from 'lucide-react';
import Button from '../../components/Button';

interface LoginFormData {
  identifier: string;
  password: string;
}

const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const {
    getCoordinates,
    checkPermission,
    permissionStatus,
    error: geoError,
    latitude,
    longitude,
    accuracy,
    loading: geoLoading,
    isVerified,
  } = useGeolocation();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Signing in...');
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate('/employee/dashboard');
    }
  }, [user, navigate]);

  // Check and prompt for location permission on mount
  useEffect(() => {
    const initLocation = async () => {
      const status = await checkPermission();
      if (status === 'granted') {
        getCoordinates().catch(() => {});
      }
    };
    initLocation();
  }, [checkPermission, getCoordinates]);

  const handleRequestLocation = async () => {
    setError(null);
    try {
      await getCoordinates();
    } catch (err: any) {
      console.warn('Location retrieval notice:', err);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);
    const identifier = data.identifier.trim();
    const password = data.password.trim();

    try {
      setLoadingMessage('Acquiring and verifying live GPS coordinates...');
      let coords: { latitude: number; longitude: number; accuracy: number } | null = null;

      // Mandatory GPS verification: Get fresh coordinates
      try {
        coords = await getCoordinates();
      } catch (locErr: any) {
        setLoading(false);
        setError(
          locErr?.message ||
          'Device GPS / Location is required. Please switch ON Location in your phone settings and tap Allow to log in.'
        );
        return; // Strictly stop login if GPS is denied or turned off!
      }

      if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
        setLoading(false);
        setError('Accurate GPS coordinates could not be retrieved. Please ensure GPS is active and retry.');
        return;
      }

      setLoadingMessage('Connecting to portal...');
      const response = await authService.login(
        identifier,
        password,
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        }
      );

      login(response.token, response.user);
      navigate('/employee/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Invalid credentials or employee account not found in database.');
      }
    } finally {
      setLoading(false);
      setLoadingMessage('Signing in...');
    }
  };

  const isLocationDenied = permissionStatus === 'denied';
  const hasRealCoords = isVerified && latitude !== null && longitude !== null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/25 ring-4 ring-white/10 mb-2">
            <span className="text-lg font-black font-display tracking-tight">EC</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white font-display">
            EC Learnix Portal
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Employee Workspace • Attendance, Daily Tasks, and Leave Management
          </p>
        </div>

        {/* Login Glass Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-7 sm:p-8 rounded-3xl shadow-2xl space-y-5">
          {/* Location Status Notice */}
          {geoLoading ? (
            <div className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2.5 text-xs text-indigo-300 animate-pulse">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
                <span className="font-semibold text-[11px]">Acquiring Device GPS Location...</span>
              </div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-lg">
                Tracking...
              </span>
            </div>
          ) : isLocationDenied || (geoError && !hasRealCoords) ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <MapPinOff className="h-4 w-4 shrink-0" />
                <span>Device Location / GPS Required</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-200/90">
                {geoError || 'Please ensure Location/GPS is turned ON in your phone settings and allowed in browser site permissions.'}
              </p>
              <button
                type="button"
                onClick={handleRequestLocation}
                className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-500 transition-colors shadow-sm cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Turn On / Retry GPS Location
              </button>
            </div>
          ) : hasRealCoords ? (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="font-semibold text-[11px] block">GPS Geo-Location Verified</span>
                  <span className="text-[10px] text-emerald-400/80 block font-mono">
                    {latitude?.toFixed(4)}, {longitude?.toFixed(4)} (±{Math.round(accuracy || 0)}m)
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-lg border border-emerald-500/30 shrink-0">
                Verified ✓
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-300 text-[11px]">Device GPS Location</p>
                  <p className="text-[10px] text-amber-200/80 leading-tight">
                    Tap to verify GPS coordinates for attendance check-in.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestLocation}
                className="shrink-0 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/40 transition-colors cursor-pointer"
              >
                Acquire GPS
              </button>
            </div>
          )}

          <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-300 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Email or Employee ID Field */}
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Email or Employee ID
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  placeholder="e.g. employee@eclat.com or ECL001"
                  className={`w-full rounded-2xl border bg-slate-800/60 pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium ${
                    errors.identifier ? 'border-rose-500/50' : 'border-white/10 hover:border-white/20'
                  }`}
                  {...register('identifier', {
                    required: 'Email or Employee ID is required',
                  })}
                />
              </div>
              {errors.identifier && (
                <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.identifier.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`w-full rounded-2xl border bg-slate-800/60 pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium ${
                    errors.password ? 'border-rose-500/50' : 'border-white/10 hover:border-white/20'
                  }`}
                  {...register('password', {
                    required: 'Password is required',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  <span>{loadingMessage}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Sign In as Employee</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500">
          EC Learnix Workspace • Attendance & Workforce Operations
        </p>
      </div>
    </div>
  );
};

export default Login;

