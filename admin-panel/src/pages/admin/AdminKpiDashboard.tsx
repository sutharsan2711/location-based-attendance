import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  Home,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Calendar,
  Download,
  Printer,
  Eye,
  RefreshCw,
  BarChart3,
  Target,
  Percent,
  MapPin,
  Sparkles,
  Layers,
  ChevronRight,
  X,
  User,
  HelpCircle,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { kpiService } from '../../services/kpiService';
import {
  KpiDashboardResponse,
  EmployeeKpiSummary,
  ComprehensiveKpiReport,
} from '../../types/kpi';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AdminKpiDashboard: React.FC = () => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [dashboardData, setDashboardData] = useState<KpiDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal / Report View State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeeReport, setEmployeeReport] = useState<ComprehensiveKpiReport | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportTab, setReportTab] = useState<'overview' | 'planned' | 'unplanned' | 'login' | 'wfh' | 'timeline'>('overview');

  // Load Dashboard Data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kpiService.getDashboardData({
        year: selectedYear,
        month: selectedMonth,
        department: selectedDept,
      });
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to load KPI dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load KPI dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedYear, selectedMonth, selectedDept]);

  // Load Specific Employee Report
  const handleViewEmployeeReport = async (empId: number) => {
    try {
      setSelectedEmployeeId(empId);
      setReportLoading(true);
      setReportTab('overview');
      const report = await kpiService.getEmployeeKpiReport(empId, {
        year: selectedYear,
        month: selectedMonth,
      });
      setEmployeeReport(report);
    } catch (err: any) {
      console.error('Failed to load employee KPI report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const [exportingReport, setExportingReport] = useState<boolean>(false);

  const handleDownloadMonthlyKpiReport = async () => {
    try {
      setExportingReport(true);
      await kpiService.exportMonthlyKpiReport(selectedYear, selectedMonth, selectedDept === 'ALL' ? undefined : selectedDept);
    } catch (err) {
      console.error('Failed to export KPI report', err);
      alert('Failed to export monthly KPI report');
    } finally {
      setExportingReport(false);
    }
  };

  const handleCloseReport = () => {
    setSelectedEmployeeId(null);
    setEmployeeReport(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered employees for table
  const filteredEmployees = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [dashboardData, searchQuery]);

  // Unique departments for filter
  const departments = useMemo(() => {
    if (!dashboardData) return [];
    const depts = new Set<string>();
    dashboardData.employees.forEach((e) => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts);
  }, [dashboardData]);

  // Score color helper
  const getScoreColorBadge = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 80) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (score >= 70) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 80) return 'bg-sky-500';
    if (score >= 70) return 'bg-indigo-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">
            <BarChart3 className="h-4 w-4" />
            Performance & Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Employee KPI Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Multi-factor evaluation: Planned works, assigned tasks, punctuality & WFH compliance.
          </p>
        </div>

        {/* Global Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3.5 py-2.5 pr-8 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-xs cursor-pointer"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <Calendar className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3.5 py-2.5 pr-8 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-xs cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <Calendar className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3.5 py-2.5 pr-8 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-xs cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <Filter className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Download Monthly KPI CSV Button */}
          <button
            onClick={handleDownloadMonthlyKpiReport}
            disabled={exportingReport || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
            title="Download comprehensive monthly KPI report"
          >
            <Download className="h-3.5 w-3.5" />
            {exportingReport ? 'Exporting...' : 'Export Monthly KPI'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition shadow-xs disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top 5 Highlight Condition Metric Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Overall Average KPI */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg KPI Score</span>
              <div className="p-2 rounded-xl bg-primary-50 text-primary-600">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {dashboardData.metrics.avgKpiScore}%
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                Org Benchmark
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${getScoreBarColor(dashboardData.metrics.avgKpiScore)} transition-all duration-500`}
                style={{ width: `${dashboardData.metrics.avgKpiScore}%` }}
              />
            </div>
          </div>

          {/* Card 2: Planned Works Condition */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Planned Work Rate</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {dashboardData.metrics.plannedCompletionRate}%
              </span>
              <span className="text-[11px] font-medium text-slate-400">Daily Plans</span>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${dashboardData.metrics.plannedCompletionRate}%` }}
              />
            </div>
          </div>

          {/* Card 3: Unplanned / Assigned Tasks Condition */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Task Rate</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {dashboardData.metrics.unplannedCompletionRate}%
              </span>
              <span className="text-[11px] font-medium text-slate-400">Ad-hoc Tasks</span>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${dashboardData.metrics.unplannedCompletionRate}%` }}
              />
            </div>
          </div>

          {/* Card 4: Login Time & Punctuality Condition */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">On-Time Logins</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {dashboardData.metrics.companyOnTimeRate}%
              </span>
              <span className="text-[11px] font-medium text-slate-400">Punctuality</span>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${dashboardData.metrics.companyOnTimeRate}%` }}
              />
            </div>
          </div>

          {/* Card 5: Work From Home Condition */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">WFH Days Logged</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Home className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {dashboardData.metrics.totalWfhDays}
              </span>
              <span className="text-[11px] font-medium text-slate-400">Approved Days</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              Remote Geofence Active
            </div>
          </div>
        </div>
      )}

      {/* Tier Distribution and Top Performer Banner */}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Top Performer Card */}
          {dashboardData.metrics.topPerformer && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 backdrop-blur-xs">
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    Month Top Performer
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    {dashboardData.metrics.topPerformer.overallScore}%
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-lg font-black text-white shrink-0 shadow-inner">
                    {dashboardData.metrics.topPerformer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {dashboardData.metrics.topPerformer.name}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      {dashboardData.metrics.topPerformer.role} • {dashboardData.metrics.topPerformer.department}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Code: {dashboardData.metrics.topPerformer.employeeCode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white/5 rounded-xl py-1.5 px-2">
                    <span className="block text-[10px] text-slate-400">Planned</span>
                    <span className="font-bold text-white">{dashboardData.metrics.topPerformer.plannedScore}%</span>
                  </div>
                  <div className="bg-white/5 rounded-xl py-1.5 px-2">
                    <span className="block text-[10px] text-slate-400">Assigned</span>
                    <span className="font-bold text-white">{dashboardData.metrics.topPerformer.unplannedScore}%</span>
                  </div>
                  <div className="bg-white/5 rounded-xl py-1.5 px-2">
                    <span className="block text-[10px] text-slate-400">Punctuality</span>
                    <span className="font-bold text-white">{dashboardData.metrics.topPerformer.punctualityScore}%</span>
                  </div>
                </div>
                <button
                  onClick={() => handleViewEmployeeReport(dashboardData.metrics.topPerformer!.id)}
                  className="px-3.5 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition shadow-sm flex items-center gap-1 shrink-0 ml-2"
                >
                  View Report
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Performance Tier Distribution */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary-500" />
                  Performance Tier Distribution ({MONTHS[selectedMonth - 1]} {selectedYear})
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {dashboardData.metrics.totalEmployees} Active Staff
                </span>
              </div>

              {/* Progress Tier Bar */}
              <div className="h-4 w-full rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5">
                <div
                  className="bg-emerald-500 rounded-l-full transition-all"
                  style={{
                    width: `${(dashboardData.metrics.tierCounts.outstanding / (dashboardData.metrics.totalEmployees || 1)) * 100}%`,
                  }}
                  title={`Outstanding: ${dashboardData.metrics.tierCounts.outstanding}`}
                />
                <div
                  className="bg-sky-500 transition-all"
                  style={{
                    width: `${(dashboardData.metrics.tierCounts.excellent / (dashboardData.metrics.totalEmployees || 1)) * 100}%`,
                  }}
                  title={`Excellent: ${dashboardData.metrics.tierCounts.excellent}`}
                />
                <div
                  className="bg-indigo-500 transition-all"
                  style={{
                    width: `${(dashboardData.metrics.tierCounts.good / (dashboardData.metrics.totalEmployees || 1)) * 100}%`,
                  }}
                  title={`Good: ${dashboardData.metrics.tierCounts.good}`}
                />
                <div
                  className="bg-amber-500 transition-all"
                  style={{
                    width: `${(dashboardData.metrics.tierCounts.needsAttention / (dashboardData.metrics.totalEmployees || 1)) * 100}%`,
                  }}
                  title={`Needs Attention: ${dashboardData.metrics.tierCounts.needsAttention}`}
                />
                <div
                  className="bg-rose-500 rounded-r-full transition-all"
                  style={{
                    width: `${(dashboardData.metrics.tierCounts.critical / (dashboardData.metrics.totalEmployees || 1)) * 100}%`,
                  }}
                  title={`Critical: ${dashboardData.metrics.tierCounts.critical}`}
                />
              </div>

              {/* Legend Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-emerald-800 uppercase">Outstanding (90%+)</span>
                    <span className="text-sm font-black text-slate-800">{dashboardData.metrics.tierCounts.outstanding}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-sky-50/60 border border-sky-100">
                  <div className="h-3 w-3 rounded-full bg-sky-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-sky-800 uppercase">Excellent (80-89%)</span>
                    <span className="text-sm font-black text-slate-800">{dashboardData.metrics.tierCounts.excellent}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <div className="h-3 w-3 rounded-full bg-indigo-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-indigo-800 uppercase">Good (70-79%)</span>
                    <span className="text-sm font-black text-slate-800">{dashboardData.metrics.tierCounts.good}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                  <div className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-amber-800 uppercase">Attention (60-69%)</span>
                    <span className="text-sm font-black text-slate-800">{dashboardData.metrics.tierCounts.needsAttention}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50/60 border border-rose-100">
                  <div className="h-3 w-3 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-rose-800 uppercase">Critical (&lt;60%)</span>
                    <span className="text-sm font-black text-slate-800">{dashboardData.metrics.tierCounts.critical}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Department Summary Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-500">Department Overview:</span>
              <div className="flex flex-wrap items-center gap-3">
                {dashboardData.departmentStats.map((ds) => (
                  <span key={ds.department} className="inline-flex items-center gap-1.5 text-slate-700 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-primary-500" />
                    {ds.department}: <strong className="text-slate-900">{ds.avgScore}%</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Employee KPI Leaderboard Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Employee KPI Evaluation Leaderboard
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Click &quot;View Full Report&quot; on any employee to inspect planned works, unplanned tasks, login logs, and WFH breakdown.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee name, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-64 transition"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Calculating KPI metrics & condition reports...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No employee records found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your department or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Rank & Employee</th>
                  <th className="py-3.5 px-4 text-center">Overall KPI Score</th>
                  <th className="py-3.5 px-4">Planned Works (35%)</th>
                  <th className="py-3.5 px-4">Assigned Tasks (25%)</th>
                  <th className="py-3.5 px-4">Punctuality & Logins (20%)</th>
                  <th className="py-3.5 px-4 text-center">WFH Days</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                {filteredEmployees.map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition group">
                    {/* Rank & Employee */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                          index === 0 ? 'bg-amber-100 text-amber-700 font-extrabold' :
                          index === 1 ? 'bg-slate-200 text-slate-700' :
                          index === 2 ? 'bg-amber-50 text-amber-800' :
                          'text-slate-400 bg-slate-100'
                        }`}>
                          #{index + 1}
                        </span>
                        <div className="h-9 w-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm group-hover:text-primary-600 transition">
                            {emp.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {emp.employeeCode} • <span className="font-semibold text-slate-600">{emp.department}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Overall KPI Score */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${getScoreColorBadge(emp.overallScore)}`}>
                          {emp.overallScore}% • {emp.performanceTier}
                        </span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full ${getScoreBarColor(emp.overallScore)}`}
                            style={{ width: `${emp.overallScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Planned Works */}
                    <td className="py-4 px-4">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800">{emp.completedPlanned}/{emp.totalPlanned} Done</span>
                          <span className="font-black text-emerald-600">{emp.plannedScore}%</span>
                        </div>
                        <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${emp.plannedScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Assigned Tasks */}
                    <td className="py-4 px-4">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800">{emp.completedUnplanned}/{emp.totalUnplanned} Done</span>
                          <span className="font-black text-purple-600">{emp.unplannedScore}%</span>
                        </div>
                        <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${emp.unplannedScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Punctuality */}
                    <td className="py-4 px-4">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800">{emp.onTimeDays}/{emp.totalLoggedDays} On-Time</span>
                          <span className="font-black text-blue-600">{emp.punctualityScore}%</span>
                        </div>
                        <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${emp.punctualityScore}%` }}
                          />
                        </div>
                        {emp.lateDays > 0 && (
                          <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                            ⚠️ {emp.lateDays} Late Logins
                          </span>
                        )}
                      </div>
                    </td>

                    {/* WFH Days */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                        <Home className="h-3 w-3 text-slate-400" />
                        {emp.approvedWfhDays} Days
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleViewEmployeeReport(emp.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white font-bold text-xs transition duration-150 shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View KPI Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* COMPREHENSIVE EMPLOYEE KPI REPORT MODAL (ALL 5 CONDITIONS)               */}
      {/* ========================================================================= */}
      {selectedEmployeeId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  {employeeReport?.employee.name.charAt(0) || <User className="h-6 w-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                      {employeeReport?.employee.name || 'Loading Employee...'}
                    </h2>
                    {employeeReport && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${getScoreColorBadge(employeeReport.overallPerformance.score)}`}>
                        {employeeReport.overallPerformance.tier} ({employeeReport.overallPerformance.score}%)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Code: <strong className="text-slate-700">{employeeReport?.employee.employeeCode}</strong> • Dept: <strong className="text-slate-700">{employeeReport?.employee.department}</strong> • Period: <strong className="text-primary-600">{MONTHS[selectedMonth - 1]} {selectedYear}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                  title="Print / Export Report"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Export
                </button>
                <button
                  onClick={handleCloseReport}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs for the 5 Conditions */}
            <div className="border-b border-slate-100 px-6 bg-white shrink-0 overflow-x-auto">
              <div className="flex gap-2">
                <button
                  onClick={() => setReportTab('overview')}
                  className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                    reportTab === 'overview'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  1. Overall Performance
                </button>
                <button
                  onClick={() => setReportTab('planned')}
                  className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                    reportTab === 'planned'
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  2. Planned Works ({employeeReport?.plannedWorks.totalPlanned || 0})
                </button>
                <button
                  onClick={() => setReportTab('unplanned')}
                  className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                    reportTab === 'unplanned'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  3. Unplanned Tasks ({employeeReport?.unplannedWorks.totalUnplanned || 0})
                </button>
                <button
                  onClick={() => setReportTab('login')}
                  className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                    reportTab === 'login'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  4. Login Time & Punctuality
                </button>
                <button
                  onClick={() => setReportTab('wfh')}
                  className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                    reportTab === 'wfh'
                      ? 'border-amber-600 text-amber-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  5. Work From Home ({employeeReport?.workFromHome.approvedDays || 0}d)
                </button>
                <button
                  onClick={() => setReportTab('timeline')}
                  className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                    reportTab === 'timeline'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Daily Log Timeline
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {reportLoading || !employeeReport ? (
                <div className="p-16 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">Generating multidimensional KPI report...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERALL PERFORMANCE CONDITION */}
                  {reportTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Overall Composite Score Card */}
                      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-emerald-300 border border-white/20">
                            Weighted Performance Metric
                          </span>
                          <h3 className="text-2xl font-black text-white">
                            Composite KPI Score: {employeeReport.overallPerformance.score}%
                          </h3>
                          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                            Calculated dynamically using real-time factors: Planned work completion (35%), Assigned task delivery (25%), Login time & punctuality (20%), and Working hours compliance (20%).
                          </p>
                        </div>
                        <div className="text-center shrink-0">
                          <div className="h-28 w-28 rounded-full border-4 border-emerald-400/80 bg-white/10 flex flex-col items-center justify-center shadow-lg">
                            <span className="text-3xl font-black text-white">
                              {employeeReport.overallPerformance.score}%
                            </span>
                            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-0.5">
                              {employeeReport.overallPerformance.tier}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 5 Factors Breakdown Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Planned Works Component */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                            <span>Planned Works</span>
                            <span className="text-emerald-600 font-mono">Weight 35%</span>
                          </div>
                          <p className="text-2xl font-black text-slate-900">
                            {employeeReport.overallPerformance.componentBreakdown.plannedWorksScore}%
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {employeeReport.plannedWorks.completed} of {employeeReport.plannedWorks.totalPlanned} daily tasks done
                          </p>
                        </div>

                        {/* Unplanned Tasks Component */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                            <span>Assigned Tasks</span>
                            <span className="text-purple-600 font-mono">Weight 25%</span>
                          </div>
                          <p className="text-2xl font-black text-slate-900">
                            {employeeReport.overallPerformance.componentBreakdown.unplannedWorksScore}%
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {employeeReport.unplannedWorks.completed} of {employeeReport.unplannedWorks.totalUnplanned} ad-hoc tasks done
                          </p>
                        </div>

                        {/* Punctuality Component */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                            <span>Punctuality</span>
                            <span className="text-blue-600 font-mono">Weight 20%</span>
                          </div>
                          <p className="text-2xl font-black text-slate-900">
                            {employeeReport.overallPerformance.componentBreakdown.punctualityScore}%
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {employeeReport.loginAndPunctuality.onTimeDays} on-time logins ({employeeReport.loginAndPunctuality.lateDays} late)
                          </p>
                        </div>

                        {/* Consistency / Attendance Component */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                            <span>Working Hours</span>
                            <span className="text-indigo-600 font-mono">Weight 20%</span>
                          </div>
                          <p className="text-2xl font-black text-slate-900">
                            {employeeReport.loginAndPunctuality.avgDailyHours} hrs/d
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {employeeReport.loginAndPunctuality.totalHoursLogged} total hours recorded
                          </p>
                        </div>
                      </div>

                      {/* Strengths & Improvement Insights */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Key Strengths & Achievements
                          </h4>
                          <ul className="space-y-2">
                            {employeeReport.overallPerformance.strengths.map((s, i) => (
                              <li key={i} className="text-xs text-emerald-900 font-medium flex items-start gap-2">
                                <span className="text-emerald-500 font-bold">•</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5">
                          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            Actionable Growth & Observations
                          </h4>
                          <ul className="space-y-2">
                            {employeeReport.overallPerformance.improvements.map((imp, i) => (
                              <li key={i} className="text-xs text-amber-900 font-medium flex items-start gap-2">
                                <span className="text-amber-500 font-bold">•</span>
                                {imp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PLANNED WORKS CONDITION */}
                  {reportTab === 'planned' && (
                    <div className="space-y-5">
                      {/* Top Summary Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Planned</span>
                          <p className="text-xl font-black text-slate-900 mt-1">{employeeReport.plannedWorks.totalPlanned}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">Completed</span>
                          <p className="text-xl font-black text-emerald-700 mt-1">{employeeReport.plannedWorks.completed}</p>
                        </div>
                        <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 text-center">
                          <span className="text-[10px] font-bold text-sky-700 uppercase">In Progress</span>
                          <p className="text-xl font-black text-sky-700 mt-1">{employeeReport.plannedWorks.inProgress}</p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
                          <span className="text-[10px] font-bold text-amber-700 uppercase">Not Completed</span>
                          <p className="text-xl font-black text-amber-700 mt-1">{employeeReport.plannedWorks.notCompleted}</p>
                        </div>
                        <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 text-center">
                          <span className="text-[10px] font-bold text-primary-700 uppercase">Completion Rate</span>
                          <p className="text-xl font-black text-primary-700 mt-1">{employeeReport.plannedWorks.completionRate}%</p>
                        </div>
                      </div>

                      {/* Planned Tasks Table */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 uppercase">Planned Tasks Details</h4>
                          <span className="text-xs text-slate-500 font-medium">Recorded from Daily Work Plans</span>
                        </div>
                        {employeeReport.plannedWorks.tasks.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 font-medium">
                            No planned tasks recorded for this month.
                          </div>
                        ) : (
                          <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                                  <th className="py-2.5 px-4">Date</th>
                                  <th className="py-2.5 px-4">Task Name</th>
                                  <th className="py-2.5 px-3">Category</th>
                                  <th className="py-2.5 px-3">Priority</th>
                                  <th className="py-2.5 px-3">Status</th>
                                  <th className="py-2.5 px-3">Time Spent</th>
                                  <th className="py-2.5 px-4">Remarks / Obstacles</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {employeeReport.plannedWorks.tasks.map((task) => (
                                  <tr key={task.id} className="hover:bg-slate-50">
                                    <td className="py-3 px-4 font-mono text-slate-500">{task.planDate}</td>
                                    <td className="py-3 px-4 font-bold text-slate-900">{task.taskName}</td>
                                    <td className="py-3 px-3">
                                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                        {task.category}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                        task.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                                        task.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-100 text-slate-600'
                                      }`}>
                                        {task.priority}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                        task.status === 'IN_PROGRESS' ? 'bg-sky-100 text-sky-700' :
                                        'bg-rose-100 text-rose-700'
                                      }`}>
                                        {task.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-slate-500 font-mono">{task.timeSpent || '--'}</td>
                                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={task.remarks || task.reasonRemarks || ''}>
                                      {task.reasonRemarks || task.remarks || '--'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: UNPLANNED WORKS CONDITION */}
                  {reportTab === 'unplanned' && (
                    <div className="space-y-5">
                      {/* Top Summary Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Tasks</span>
                          <p className="text-xl font-black text-slate-900 mt-1">{employeeReport.unplannedWorks.totalUnplanned}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-center">
                          <span className="text-[10px] font-bold text-purple-700 uppercase">Completed</span>
                          <p className="text-xl font-black text-purple-700 mt-1">{employeeReport.unplannedWorks.completed}</p>
                        </div>
                        <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 text-center">
                          <span className="text-[10px] font-bold text-sky-700 uppercase">Under Review / Active</span>
                          <p className="text-xl font-black text-sky-700 mt-1">
                            {employeeReport.unplannedWorks.inProgress + employeeReport.unplannedWorks.underReview}
                          </p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">Performance Score</span>
                          <p className="text-xl font-black text-emerald-700 mt-1">{employeeReport.unplannedWorks.score}%</p>
                        </div>
                      </div>

                      {/* Unplanned Tasks Table */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 uppercase">Management Assigned & Ad-hoc Tasks</h4>
                          <span className="text-xs text-slate-500 font-medium">Task Management System</span>
                        </div>
                        {employeeReport.unplannedWorks.tasks.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 font-medium">
                            No unplanned/assigned tasks found for this period.
                          </div>
                        ) : (
                          <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                                  <th className="py-2.5 px-4">Task Title</th>
                                  <th className="py-2.5 px-3">Priority</th>
                                  <th className="py-2.5 px-3">Status</th>
                                  <th className="py-2.5 px-3">Due Date</th>
                                  <th className="py-2.5 px-3">Assigned By</th>
                                  <th className="py-2.5 px-4">Completion Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {employeeReport.unplannedWorks.tasks.map((task) => (
                                  <tr key={task.id} className="hover:bg-slate-50">
                                    <td className="py-3 px-4">
                                      <p className="font-bold text-slate-900">{task.title}</p>
                                      {task.description && <p className="text-[11px] text-slate-400 line-clamp-1">{task.description}</p>}
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                        task.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                                        task.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-100 text-slate-600'
                                      }`}>
                                        {task.priority}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                        task.status === 'UNDER_REVIEW' ? 'bg-purple-100 text-purple-700' :
                                        task.status === 'IN_PROGRESS' ? 'bg-sky-100 text-sky-700' :
                                        'bg-amber-100 text-amber-700'
                                      }`}>
                                        {task.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 font-mono text-slate-500">
                                      {task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '--'}
                                    </td>
                                    <td className="py-3 px-3 font-semibold text-slate-700">
                                      {task.assignedByName || 'Management'}
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                                      {task.completionNotes || '--'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: LOGIN TIME & PUNCTUALITY CONDITION */}
                  {reportTab === 'login' && (
                    <div className="space-y-5">
                      {/* Top Summary Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Login Time</span>
                          <p className="text-lg font-black text-slate-900 mt-1">{employeeReport.loginAndPunctuality.avgLoginTime}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Logout Time</span>
                          <p className="text-lg font-black text-slate-900 mt-1">{employeeReport.loginAndPunctuality.avgLogoutTime}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                          <span className="text-[10px] font-bold text-blue-700 uppercase">On-Time Days</span>
                          <p className="text-xl font-black text-blue-700 mt-1">{employeeReport.loginAndPunctuality.onTimeDays}</p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
                          <span className="text-[10px] font-bold text-amber-700 uppercase">Late Days</span>
                          <p className="text-xl font-black text-amber-700 mt-1">{employeeReport.loginAndPunctuality.lateDays}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">Punctuality Score</span>
                          <p className="text-xl font-black text-emerald-700 mt-1">{employeeReport.loginAndPunctuality.score}%</p>
                        </div>
                      </div>

                      {/* Daily Login Logs Table */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 uppercase">Daily Attendance & Geofence Logs</h4>
                          <span className="text-xs text-slate-500 font-medium">GPS Geofence Verified</span>
                        </div>
                        {employeeReport.loginAndPunctuality.logs.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 font-medium">
                            No attendance records found for this period.
                          </div>
                        ) : (
                          <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                                  <th className="py-2.5 px-4">Date</th>
                                  <th className="py-2.5 px-4">Login Time</th>
                                  <th className="py-2.5 px-4">Logout Time</th>
                                  <th className="py-2.5 px-3">Timing Status</th>
                                  <th className="py-2.5 px-3">Geofence Distance</th>
                                  <th className="py-2.5 px-3">GPS Accuracy</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {employeeReport.loginAndPunctuality.logs.map((log) => (
                                  <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{log.date}</td>
                                    <td className="py-3 px-4 font-mono text-slate-600">
                                      {log.loginTime ? new Date(log.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </td>
                                    <td className="py-3 px-4 font-mono text-slate-600">
                                      {log.logoutTime ? new Date(log.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        log.timingStatus === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                                        log.timingStatus === 'LATE' ? 'bg-amber-100 text-amber-700' :
                                        log.timingStatus === 'PERMISSION' ? 'bg-sky-100 text-sky-700' :
                                        'bg-rose-100 text-rose-700'
                                      }`}>
                                        {log.timingStatus}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 font-mono text-slate-500">
                                      {log.distance !== undefined && log.distance !== null ? `${Math.round(log.distance)}m` : 'Office'}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-slate-400">
                                      {log.accuracy ? `±${Math.round(log.accuracy)}m` : '--'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: WORK FROM HOME CONDITION */}
                  {reportTab === 'wfh' && (
                    <div className="space-y-5">
                      {/* Top Summary Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Total WFH Requests</span>
                          <p className="text-xl font-black text-slate-900 mt-1">{employeeReport.workFromHome.totalRequests}</p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
                          <span className="text-[10px] font-bold text-amber-700 uppercase">Approved WFH Days</span>
                          <p className="text-xl font-black text-amber-700 mt-1">{employeeReport.workFromHome.approvedDays}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                          <span className="text-[10px] font-bold text-blue-700 uppercase">Remote Punches</span>
                          <p className="text-xl font-black text-blue-700 mt-1">{employeeReport.workFromHome.remotePunchesCount}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">WFH Approval Score</span>
                          <p className="text-xl font-black text-emerald-700 mt-1">{employeeReport.workFromHome.score}%</p>
                        </div>
                      </div>

                      {/* WFH Requests Table */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 uppercase">Work From Home Applications</h4>
                          <span className="text-xs text-slate-500 font-medium">Leave & Remote Request Module</span>
                        </div>
                        {employeeReport.workFromHome.requests.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 font-medium">
                            No Work From Home requests submitted for this month.
                          </div>
                        ) : (
                          <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                                  <th className="py-2.5 px-4">From Date</th>
                                  <th className="py-2.5 px-4">To Date</th>
                                  <th className="py-2.5 px-3">Status</th>
                                  <th className="py-2.5 px-4">Reason</th>
                                  <th className="py-2.5 px-4">Admin Remarks</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {employeeReport.workFromHome.requests.map((req) => (
                                  <tr key={req.id} className="hover:bg-slate-50">
                                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{req.fromDate}</td>
                                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{req.toDate}</td>
                                    <td className="py-3 px-3">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                        req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                        'bg-rose-100 text-rose-700'
                                      }`}>
                                        {req.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-700">{req.reason}</td>
                                    <td className="py-3 px-4 text-slate-400">{req.adminRemarks || '--'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: DAY-BY-DAY TIMELINE */}
                  {reportTab === 'timeline' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-600 flex items-center justify-between">
                        <span>Day-by-Day Activity Feed ({MONTHS[selectedMonth - 1]} {selectedYear})</span>
                        <span className="text-[11px] text-slate-400">Total {employeeReport.dailyTimeline.length} calendar days</span>
                      </div>

                      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                        {employeeReport.dailyTimeline.map((day) => (
                          <div
                            key={day.date}
                            className={`p-4 rounded-2xl border transition ${
                              day.plans.length > 0 || day.attendance
                                ? 'bg-white border-slate-200 hover:border-primary-300 shadow-2xs'
                                : 'bg-slate-50/50 border-slate-100 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-black text-slate-800">
                                  {day.date}
                                </span>
                                {day.isWfh && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">
                                    WFH Approved
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {day.attendance && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    day.attendance.timingStatus === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                                    day.attendance.timingStatus === 'LATE' ? 'bg-amber-100 text-amber-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {day.attendance.timingStatus} • {day.attendance.loginTime ? new Date(day.attendance.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getScoreColorBadge(day.kpiScore)}`}>
                                  Score: {day.kpiScore}%
                                </span>
                              </div>
                            </div>

                            {/* Plans list */}
                            {day.plans.length > 0 && (
                              <div className="space-y-1 mt-2">
                                {day.plans.map((p) => (
                                  <div key={p.id} className="text-xs flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl">
                                    <span className="font-semibold text-slate-800">{p.taskName}</span>
                                    <span className={`text-[10px] font-bold ${
                                      p.status === 'COMPLETED' ? 'text-emerald-600' :
                                      p.status === 'IN_PROGRESS' ? 'text-sky-600' :
                                      'text-rose-600'
                                    }`}>
                                      {p.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                AttendGPS Performance Analytics Engine v2.4
              </span>
              <button
                onClick={handleCloseReport}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow-sm"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKpiDashboard;
