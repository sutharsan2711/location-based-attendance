import React, { useState, useEffect } from 'react';
import { adminService, DashboardStats } from '../../services/adminService';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Briefcase,
  AlertTriangle,
  Calendar,
  FileCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Selected customized date state (YYYY-MM-DD)
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isToday = selectedDate === getTodayISO();

  // Format date nicely: e.g. "Saturday, 5 September 2026"
  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Quick Date Navigation
  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const nextStr = date.toISOString().split('T')[0];
    setSelectedDate(nextStr);
  };

  const handleSelectToday = () => {
    setSelectedDate(getTodayISO());
  };

  const handleSelectYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const fetchDashboardData = async (targetDate: string, isManualRefresh: boolean = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [statsRes, chartsRes] = await Promise.all([
        adminService.getStats(targetDate),
        adminService.getSummaryCharts(targetDate),
      ]);
      setStats(statsRes);
      setChartData(chartsRes);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard metrics for date:', targetDate, err);
      setError('Failed to load dashboard metrics for selected date.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate]);

  if (loading && !stats) return <Loading fullScreen message="Loading dashboard insights for selected date..." />;

  const shortDateLabel = formatShortDate(selectedDate);

  const kpis = [
    {
      title: 'Total Employees',
      value: stats?.totalEmployees ?? 0,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600',
      link: '/employees',
    },
    {
      title: isToday ? 'Present Today' : `Present (${shortDateLabel})`,
      value: stats?.presentToday ?? 0,
      icon: UserCheck,
      color: 'bg-emerald-500/10 text-emerald-600',
      link: '/attendance',
    },
    {
      title: isToday ? 'Late Today' : `Late (${shortDateLabel})`,
      value: stats?.lateToday ?? 0,
      icon: AlertTriangle,
      color: 'bg-amber-500/15 text-amber-700 border border-amber-300',
      badge: (stats?.lateToday ?? 0) > 0 ? 'Warning' : undefined,
      link: '/attendance',
    },
    {
      title: isToday ? 'Currently Working' : `Logged In (${shortDateLabel})`,
      value: stats?.currentlyWorking ?? 0,
      icon: Briefcase,
      color: 'bg-violet-500/10 text-violet-600',
      link: '/attendance',
    },
    {
      title: isToday ? 'On Leave Today' : `On Leave (${shortDateLabel})`,
      value: stats?.onLeaveToday ?? 0,
      icon: Calendar,
      color: 'bg-rose-500/10 text-rose-600',
      link: '/requests/leaves',
    },
    {
      title: 'Permission Requests',
      value: stats?.pendingPermissionRequests ?? 0,
      icon: Clock,
      color: 'bg-indigo-500/10 text-indigo-600',
      subtitle: `${stats?.pendingPermissionRequests ?? 0} Pending`,
      link: '/requests/permissions',
    },
    {
      title: 'Leave Requests',
      value: stats?.pendingLeaveRequests ?? 0,
      icon: FileCheck,
      color: 'bg-sky-500/10 text-sky-600',
      subtitle: `${stats?.pendingLeaveRequests ?? 0} Pending`,
      link: '/requests/leaves',
    },
    {
      title: isToday ? 'Absent Today' : `Absent (${shortDateLabel})`,
      value: stats?.absent ?? 0,
      icon: UserX,
      color: 'bg-slate-500/10 text-slate-600',
      link: '/attendance',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header & Customized Date Filter Toolbar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              Admin Dashboard
            </h1>
            {isToday ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live (Today)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-700 border border-indigo-200">
                <CalendarDays className="h-3 w-3 text-indigo-600" />
                Custom Date
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Viewing attendance stats & charts for: <strong className="text-slate-800">{formatFullDate(selectedDate)}</strong>
          </p>
        </div>

        {/* Customized Date Selection Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Presets */}
          <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={handleSelectToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isToday
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleSelectYesterday}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isToday && selectedDate === (() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  return d.toISOString().split('T')[0];
                })()
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Yesterday
            </button>
          </div>

          {/* Date Picker Input with Previous/Next Arrows */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative flex items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || getTodayISO())}
                className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600 cursor-pointer shadow-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchDashboardData(selectedDate, true)}
            disabled={refreshing}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer shadow-xs"
            title="Refresh Metrics"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={idx}
              className={`hover:-translate-y-1 transition-all cursor-pointer ${
                kpi.badge ? 'border-amber-200 bg-amber-50/20 shadow-sm' : ''
              }`}
              onClick={() => kpi.link && navigate(kpi.link)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {kpi.title}
                  </p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">{kpi.value}</p>
                  {kpi.subtitle && (
                    <span className="inline-block mt-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {kpi.subtitle}
                    </span>
                  )}
                </div>
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title={`Attendance Analysis (7 Days ending ${shortDateLabel})`}
          subtitle="Present vs Absent trends for the selected timeline"
        >
          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b66ff" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b66ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stroke="#3b66ff"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#presentGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="absent"
                  name="Absent"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#absentGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title={`Punch Trends (7 Days ending ${shortDateLabel})`}
          subtitle="Check-in vs check-out volume for the selected timeline"
        >
          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="login" name="Check-ins" fill="#3b66ff" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="logout" name="Check-outs" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
