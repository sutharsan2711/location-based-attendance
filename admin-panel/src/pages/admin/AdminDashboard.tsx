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
  ArrowUpRight,
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          adminService.getStats(),
          adminService.getSummaryCharts(),
        ]);
        setStats(statsRes);
        setChartData(chartsRes);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <Loading fullScreen message="Loading dashboard insights..." />;
  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
        {error || 'Dashboard loading failed.'}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600',
      link: '/employees',
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      icon: UserCheck,
      color: 'bg-emerald-500/10 text-emerald-600',
      link: '/attendance',
    },
    {
      title: 'Late Today',
      value: stats.lateToday,
      icon: AlertTriangle,
      color: 'bg-amber-500/15 text-amber-700 border border-amber-300',
      badge: 'Warning',
      link: '/attendance',
    },
    {
      title: 'Currently Working',
      value: stats.currentlyWorking,
      icon: Briefcase,
      color: 'bg-violet-500/10 text-violet-600',
      link: '/attendance',
    },
    {
      title: 'On Leave Today',
      value: stats.onLeaveToday,
      icon: Calendar,
      color: 'bg-rose-500/10 text-rose-600',
      link: '/requests/leaves',
    },
    {
      title: 'Permission Requests',
      value: stats.pendingPermissionRequests,
      icon: Clock,
      color: 'bg-indigo-500/10 text-indigo-600',
      subtitle: `${stats.pendingPermissionRequests} Pending`,
      link: '/requests/permissions',
    },
    {
      title: 'Leave Requests',
      value: stats.pendingLeaveRequests,
      icon: FileCheck,
      color: 'bg-sky-500/10 text-sky-600',
      subtitle: `${stats.pendingLeaveRequests} Pending`,
      link: '/requests/leaves',
    },
    {
      title: 'Absent Today',
      value: stats.absent,
      icon: UserX,
      color: 'bg-slate-500/10 text-slate-600',
      link: '/attendance',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-400">
          Live attendance statistics, late monitoring, and quick approvals
        </p>
      </div>

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
                    <span className="inline-block mt-1.5 text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
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
        <Card title="Attendance Analysis (Last 7 Days)" subtitle="Present vs Absent trends">
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

        <Card title="Punch Trends (Last 7 Days)" subtitle="Check-in vs check-out volume">
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
