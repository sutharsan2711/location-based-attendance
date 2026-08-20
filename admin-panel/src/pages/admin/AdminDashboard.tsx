import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Briefcase,
  LogOut as LogOutIcon,
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

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  todayLogin: number;
  todayLogout: number;
  currentlyWorking: number;
  absent: number;
}

const AdminDashboard: React.FC = () => {
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
    { title: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'bg-blue-500/10 text-blue-600' },
    { title: 'Active Employees', value: stats.activeEmployees, icon: UserCheck, color: 'bg-emerald-500/10 text-emerald-600' },
    { title: 'Today Logins', value: stats.todayLogin, icon: Clock, color: 'bg-primary-500/10 text-primary-600' },
    { title: 'Today Logouts', value: stats.todayLogout, icon: LogOutIcon, color: 'bg-indigo-500/10 text-indigo-600' },
    { title: 'Currently Working', value: stats.currentlyWorking, icon: Briefcase, color: 'bg-violet-500/10 text-violet-600' },
    { title: 'Absent Today', value: stats.absent, icon: UserX, color: 'bg-rose-500/10 text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-400">Live operational overview, attendance summaries, and trends</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">{kpi.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${kpi.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Attendance Analysis (Last 7 Days)" subtitle="Present vs Absent employees">
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
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="present" name="Present" stroke="#3b66ff" strokeWidth={2.5} fillOpacity={1} fill="url(#presentGrad)" />
                <Area type="monotone" dataKey="absent" name="Absent" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#absentGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Punch Trends (Last 7 Days)" subtitle="Check-in vs check-out punches">
          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px' }} />
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
