import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { KeyRound, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/Button';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard');
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);
    try {
      const response = await authService.login(data.email.trim(), data.password);
      login(response.token, response.user);
      navigate(response.user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Connection failed. Please check your credentials or backend server status.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-8 z-10 animate-slide">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-xl shadow-primary-500/30 mb-4">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your Employee Attendance Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Global Error */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="employee@company.com"
                  className={`w-full rounded-2xl border bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${
                    errors.email ? 'border-rose-500/50' : 'border-white/10'
                  }`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <KeyRound className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
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
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
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
              className="mt-8 bg-primary-500 hover:bg-primary-600 text-white font-bold py-3.5"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
