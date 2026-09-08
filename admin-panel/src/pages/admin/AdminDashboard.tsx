import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowRight,
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

  // Format local date string as YYYY-MM-DD cleanly without UTC timezone shifting
  const formatLocalDateISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayISO = () => formatLocalDateISO(new Date());

  // Date Range state: Start Date to End Date
  const [startDate, setStartDate] = useState<string>(getTodayISO());
  const [endDate, setEndDate] = useState<string>(getTodayISO());

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Chart view mode states
  const [attendanceViewMode, setAttendanceViewMode] = useState<'area' | 'bar' | 'line'>('area');
  const [punchViewMode, setPunchViewMode] = useState<'bar' | 'stacked' | 'area'>('bar');

  const isSingleDay = startDate === endDate;
  const isToday = isSingleDay && startDate === getTodayISO();

  // Helper to parse date string for chart X-axis ticks (e.g. "04-09-2026" or "2026-09-04" -> "4 Sep")
  const formatChartDateTick = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3) {
        if (parts[0] > 1000) {
          // YYYY-MM-DD
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        } else {
          // DD-MM-YYYY
          const d = new Date(parts[2], parts[1] - 1, parts[0]);
          return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        }
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Helper to format full date for tooltip
  const formatTooltipDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3) {
        let d: Date;
        if (parts[0] > 1000) {
          d = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          d = new Date(parts[2], parts[1] - 1, parts[0]);
        }
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Compute summary aggregations from chartData for quick badges
  const chartSummary = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { totalPresent: 0, totalAbsent: 0, totalLogins: 0, totalLogouts: 0, avgRate: 0, peakPresent: 0 };
    }
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLogins = 0;
    let totalLogouts = 0;
    let peakPresent = 0;

    chartData.forEach((item) => {
      const p = Number(item.present || 0);
      const a = Number(item.absent || 0);
      const li = Number(item.login || 0);
      const lo = Number(item.logout || 0);

      totalPresent += p;
      totalAbsent += a;
      totalLogins += li;
      totalLogouts += lo;
      if (p > peakPresent) peakPresent = p;
    });

    const totalSlots = totalPresent + totalAbsent;
    const avgRate = totalSlots > 0 ? Math.round((totalPresent / totalSlots) * 100) : 0;

    return { totalPresent, totalAbsent, totalLogins, totalLogouts, avgRate, peakPresent };
  }, [chartData]);

  // Custom Glassmorphic Tooltip for Attendance Analysis
  const CustomAttendanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const presentItem = payload.find((p: any) => p.dataKey === 'present')?.value || 0;
      const absentItem = payload.find((p: any) => p.dataKey === 'absent')?.value || 0;
      const total = presentItem + absentItem;
      const rate = total > 0 ? Math.round((presentItem / total) * 100) : 0;

      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200/90 min-w-[200px] text-xs">
          <p className="font-extrabold text-slate-800 border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
            <span>{formatTooltipDate(label)}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {rate}% Rate
            </span>
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
                <span className="font-semibold text-slate-600">Present</span>
              </div>
              <span className="font-extrabold text-slate-900 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg">
                {presentItem}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-xs" />
                <span className="font-semibold text-slate-600">Absent</span>
              </div>
              <span className="font-extrabold text-slate-900 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-lg">
                {absentItem}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Glassmorphic Tooltip for Punch Trends
  const CustomPunchTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const logins = payload.find((p: any) => p.dataKey === 'login')?.value || 0;
      const logouts = payload.find((p: any) => p.dataKey === 'logout')?.value || 0;

      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200/90 min-w-[200px] text-xs">
          <p className="font-extrabold text-slate-800 border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
            <span>{formatTooltipDate(label)}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {logins + logouts} Punches
            </span>
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 shadow-xs" />
                <span className="font-semibold text-slate-600">Check-ins</span>
              </div>
              <span className="font-extrabold text-slate-900 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg">
                {logins}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-500 shadow-xs" />
                <span className="font-semibold text-slate-600">Check-outs</span>
              </div>
              <span className="font-extrabold text-slate-900 bg-violet-50 text-violet-700 px-2 py-0.5 rounded-lg">
                {logouts}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Format date nicely: e.g. "Saturday, 5 September 2026"
  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
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

  // Preset Date Selection Handlers
  const handleSelectToday = () => {
    const today = getTodayISO();
    setStartDate(today);
    setEndDate(today);
  };

  const handleSelectYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = formatLocalDateISO(d);
    setStartDate(yesterday);
    setEndDate(yesterday);
  };

  const handleSelectLast7Days = () => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    setStartDate(formatLocalDateISO(d));
    setEndDate(getTodayISO());
  };

  const handleSelectThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(formatLocalDateISO(firstDay));
    setEndDate(getTodayISO());
  };

  const handleSelectLast30Days = () => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    setStartDate(formatLocalDateISO(d));
    setEndDate(getTodayISO());
  };

  const fetchDashboardData = async (start: string, end: string, isManualRefresh: boolean = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [statsRes, chartsRes] = await Promise.all([
        adminService.getStats(start, end),
        adminService.getSummaryCharts(start, end),
      ]);
      setStats(statsRes);
      setChartData(chartsRes);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard metrics for range:', start, end, err);
      setError('Failed to load dashboard metrics for selected date range.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(startDate, endDate);
  }, [startDate, endDate]);

  if (loading && !stats) return <Loading fullScreen message="Loading dashboard insights..." />;

  const rangeLabel = isSingleDay
    ? formatShortDate(startDate)
    : `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;

  const headerDateDescription = isSingleDay
    ? isToday
      ? `Today (${formatFullDate(startDate)})`
      : formatFullDate(startDate)
    : `${formatFullDate(startDate)} to ${formatFullDate(endDate)}`;

  const kpis = [
    {
      title: 'Total Employees',
      value: stats?.totalEmployees ?? 0,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600',
      link: '/employees',
    },
    {
      title: isToday ? 'Present Today' : `Present (${rangeLabel})`,
      value: stats?.presentToday ?? 0,
      icon: UserCheck,
      color: 'bg-emerald-500/10 text-emerald-600',
      link: '/attendance',
    },
    {
      title: isToday ? 'Late Today' : `Late (${rangeLabel})`,
      value: stats?.lateToday ?? 0,
      icon: AlertTriangle,
      color: 'bg-amber-500/15 text-amber-700 border border-amber-300',
      badge: (stats?.lateToday ?? 0) > 0 ? 'Warning' : undefined,
      link: '/attendance',
    },
    {
      title: isToday ? 'Currently Working' : `Logged In (${rangeLabel})`,
      value: stats?.currentlyWorking ?? 0,
      icon: Briefcase,
      color: 'bg-violet-500/10 text-violet-600',
      link: '/attendance',
    },
    {
      title: isToday ? 'On Leave Today' : `On Leave (${rangeLabel})`,
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
      title: isToday ? 'Absent Today' : `Absent (${rangeLabel})`,
      value: stats?.absent ?? 0,
      icon: UserX,
      color: 'bg-slate-500/10 text-slate-600',
      link: '/attendance',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header & Customized Date Range Filter Toolbar ── */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
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
                {isSingleDay ? 'Selected Date' : 'Date Range'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Viewing metrics for: <strong className="text-slate-800">{headerDateDescription}</strong>
          </p>
        </div>

        {/* Customized Date Selection Range Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Presets */}
          <div className="inline-flex flex-wrap bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
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
              className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                isSingleDay && !isToday && startDate === (() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  return formatLocalDateISO(d);
                })()
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={handleSelectLast7Days}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                startDate === (() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 6);
                  return formatLocalDateISO(d);
                })() && endDate === getTodayISO()
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={handleSelectThisMonth}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                startDate === (() => {
                  const now = new Date();
                  return formatLocalDateISO(new Date(now.getFullYear(), now.getMonth(), 1));
                })() && endDate === getTodayISO()
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={handleSelectLast30Days}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                startDate === (() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 29);
                  return formatLocalDateISO(d);
                })() && endDate === getTodayISO()
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Start Date to End Date Range Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const newStart = e.target.value || getTodayISO();
                  setStartDate(newStart);
                  if (newStart > endDate) setEndDate(newStart);
                }}
                className="px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
              />
            </div>

            <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  const newEnd = e.target.value || getTodayISO();
                  setEndDate(newEnd);
                  if (newEnd < startDate) setStartDate(newEnd);
                }}
                className="px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
              />
            </div>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchDashboardData(startDate, endDate, true)}
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

      {/* ── Customized Charts Section ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance Analysis Chart Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Attendance Analysis
                  </h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {rangeLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Present vs Absent trends across the selected date range
                </p>
              </div>

              {/* Chart Mode & Stat Badges */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60">
                  Avg: {chartSummary.avgRate}% Present
                </span>

                {/* Switch View Buttons */}
                <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/70 text-xs">
                  <button
                    type="button"
                    onClick={() => setAttendanceViewMode('area')}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      attendanceViewMode === 'area'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Area
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceViewMode('bar')}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      attendanceViewMode === 'bar'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Bar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceViewMode('line')}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      attendanceViewMode === 'line'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Line
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance Chart Body */}
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {attendanceViewMode === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDateTick}
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      minTickGap={18}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomAttendanceTooltip />} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 12 }}
                    />
                    <Bar
                      dataKey="present"
                      name="Present"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      barSize={16}
                    />
                    <Bar
                      dataKey="absent"
                      name="Absent"
                      fill="#f43f5e"
                      radius={[6, 6, 0, 0]}
                      barSize={16}
                    />
                  </BarChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDateTick}
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      minTickGap={18}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomAttendanceTooltip />} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="present"
                      name="Present"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill={attendanceViewMode === 'line' ? 'transparent' : 'url(#presentGrad)'}
                      dot={chartData.length <= 15 ? { r: 3.5, strokeWidth: 2, fill: '#fff', stroke: '#10b981' } : false}
                      activeDot={{ r: 6, strokeWidth: 2, fill: '#10b981', stroke: '#fff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="absent"
                      name="Absent"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill={attendanceViewMode === 'line' ? 'transparent' : 'url(#absentGrad)'}
                      dot={chartData.length <= 15 ? { r: 3, strokeWidth: 2, fill: '#fff', stroke: '#f43f5e' } : false}
                      activeDot={{ r: 5, strokeWidth: 2, fill: '#f43f5e', stroke: '#fff' }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Metric Badges */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-700">Total Present:</span>
                <span className="font-extrabold text-emerald-600">{chartSummary.totalPresent}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="font-bold text-slate-700">Total Absent:</span>
                <span className="font-extrabold text-rose-600">{chartSummary.totalAbsent}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Peak: <strong className="text-slate-700">{chartSummary.peakPresent} present</strong>
            </span>
          </div>
        </div>

        {/* Punch Trends Chart Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Punch Trends
                  </h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {rangeLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check-in vs check-out volume across the selected date range
                </p>
              </div>

              {/* Punch View Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/70 text-xs">
                  <button
                    type="button"
                    onClick={() => setPunchViewMode('bar')}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      punchViewMode === 'bar'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Grouped
                  </button>
                  <button
                    type="button"
                    onClick={() => setPunchViewMode('stacked')}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      punchViewMode === 'stacked'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Stacked
                  </button>
                  <button
                    type="button"
                    onClick={() => setPunchViewMode('area')}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      punchViewMode === 'area'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Area
                  </button>
                </div>
              </div>
            </div>

            {/* Punch Trends Chart Body */}
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {punchViewMode === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="loginGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="logoutGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDateTick}
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      minTickGap={18}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomPunchTooltip />} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="login"
                      name="Check-ins"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#loginGrad)"
                      dot={chartData.length <= 15 ? { r: 3.5, strokeWidth: 2, fill: '#fff', stroke: '#4f46e5' } : false}
                      activeDot={{ r: 6, strokeWidth: 2, fill: '#4f46e5', stroke: '#fff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="logout"
                      name="Check-outs"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#logoutGrad)"
                      dot={chartData.length <= 15 ? { r: 3, strokeWidth: 2, fill: '#fff', stroke: '#8b5cf6' } : false}
                      activeDot={{ r: 5, strokeWidth: 2, fill: '#8b5cf6', stroke: '#fff' }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDateTick}
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      minTickGap={18}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomPunchTooltip />} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 12 }}
                    />
                    <Bar
                      dataKey="login"
                      name="Check-ins"
                      fill="#4f46e5"
                      stackId={punchViewMode === 'stacked' ? 'a' : undefined}
                      radius={punchViewMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                      barSize={16}
                    />
                    <Bar
                      dataKey="logout"
                      name="Check-outs"
                      fill="#8b5cf6"
                      stackId={punchViewMode === 'stacked' ? 'a' : undefined}
                      radius={[6, 6, 0, 0]}
                      barSize={16}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Metric Badges */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                <span className="font-bold text-slate-700">Total Check-ins:</span>
                <span className="font-extrabold text-indigo-600">{chartSummary.totalLogins}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                <span className="font-bold text-slate-700">Total Check-outs:</span>
                <span className="font-extrabold text-violet-600">{chartSummary.totalLogouts}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Total Volume: <strong className="text-slate-700">{chartSummary.totalLogins + chartSummary.totalLogouts} punches</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
