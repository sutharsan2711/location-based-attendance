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
  Info
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
    longitude
  } = useGeolocation();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Signing in...');
  const [showPassword, setShowPassword] = useState(false);
  const [locPrompted, setLocPrompted] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard');
    }
  }, [user, navigate]);

  // Check and prompt for location permission on mount
  useEffect(() => {
    const initLocation = async () => {
      const status = await checkPermission();
      if (status === 'granted') {
        // Pre-fetch coordinates if permission is already granted
        getCoordinates(true).catch(() => {});
      }
    };
    initLocation();
  }, [checkPermission, getCoordinates]);

  const handleRequestLocation = async () => {
    setError(null);
    setLocPrompted(true);
    try {
      await getCoordinates(true);
    } catch (err: any) {
      setError(err.message || 'Location permission is required to sign in.');
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      identifier: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);
    const identifier = data.identifier.trim();
    const password = data.password.trim();

    try {
      // 1. Mandatory Location Access Check: Acquire active GPS coordinates
      setLoadingMessage('Verifying location access...');
      let coords: { latitude: number; longitude: number; accuracy: number };

      try {
        coords = await getCoordinates(true);
      } catch (locErr: any) {
        setError(
          locErr.message ||
          'Location permission is required to sign in. Please allow location access in your browser.'
        );
        setLoading(false);
        return; // Strictly stop login if location permission is not granted
      }

      // 2. Proceed with authentication with location payload
      setLoadingMessage('Signing in to portal...');
      const response = await authService.login(identifier, password, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy
      });

      login(response.token, response.user);
      navigate(response.user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (!error) {
        setError('Invalid credentials or employee account not found in database.');
      }
    } finally {
      setLoading(false);
      setLoadingMessage('Signing in...');
    }
  };

  const isLocationDenied = permissionStatus === 'denied';
  const isLocationGranted = permissionStatus === 'granted' || (latitude !== null && longitude !== null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-6 z-10 animate-slide">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-xl shadow-primary-500/30 mb-4">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Employee Login</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in using your <span className="font-bold text-slate-200">Employee Code</span> and password
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-7 sm:p-8 rounded-3xl shadow-2xl space-y-5">
          {/* Location Status Notice */}
          {isLocationDenied ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <MapPinOff className="h-4 w-4 shrink-0" />
                <span>Location Access Required</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-200/90">
                You must grant browser location permission to sign in. Please click the site settings/lock icon in your browser URL bar, allow Location access, and click retry.
              </p>
              <button
                type="button"
                onClick={handleRequestLocation}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 text-white text-[11px] font-bold hover:bg-rose-600 transition-colors shadow"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Location Access
              </button>
            </div>
          ) : isLocationGranted ? (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Location Access Granted</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-lg border border-emerald-500/30">
                GPS Ready
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300">
              <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-amber-300">Location Verification Required</p>
                <p className="text-[11px] text-amber-200/80 leading-tight">
                  Your browser will request your device location when you sign in.
                </p>
              </div>
            </div>
          )}

          <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Global Error */}
            {(error || geoError) && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error || geoError}</span>
              </div>
            )}

            {/* Employee Code / Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Employee Code / Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  placeholder="e.g. ECLCE2008 or email"
                  className={`w-full rounded-2xl border bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-medium ${
                    errors.identifier ? 'border-rose-500/50' : 'border-white/10'
                  }`}
                  {...register('identifier', {
                    required: 'Employee Code or Email is required',
                  })}
                />
              </div>
              {errors.identifier && (
                <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.identifier.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Default: <code className="bg-white/10 px-1.5 py-0.5 rounded text-primary-300">123456789</code>
                </span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="123456789"
                  className={`w-full rounded-2xl border bg-white/5 pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${
                    errors.password ? 'border-rose-500/50' : 'border-white/10'
                  }`}
                  {...register('password', {
                    required: 'Password is required',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading || isLocationDenied}
              className={`mt-4 bg-primary-500 hover:bg-primary-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-primary-500/25 ${
                isLocationDenied ? 'opacity-60 cursor-not-allowed hover:bg-primary-500' : ''
              }`}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {loading ? loadingMessage : isLocationDenied ? 'Location Permission Required to Sign In' : 'Sign In to Portal'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

