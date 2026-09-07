import React, { useState, useEffect } from 'react';
import { workPlanService, MonthlyKpiResponse } from '../../services/workPlanService';
import KpiGauge, { getKpiTier } from '../../components/KpiGauge';
import Loading from '../../components/Loading';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ListTodo,
  CheckSquare,
  Sparkles,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const EmployeeKpi: React.FC = () => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [kpiData, setKpiData] = useState<MonthlyKpiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMonthlyKpi = async (year: number, month: number) => {
    try {
      setLoading(true);
      const data = await workPlanService.getMonthlyKpi(year, month);
      setKpiData(data);
    } catch (err) {
      console.error('Failed to load monthly KPI:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyKpi(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const summary = kpiData?.summary || {
    averageKpiScore: 80,
    monthlyLabel: 'Good',
    totalMonthlyTasks: 0,
    totalCompletedTasks: 0,
    totalInProgressTasks: 0,
    totalNotCompletedTasks: 0,
    completionRate: 0,
    activeWorkDays: 0,
    presentDays: 0,
    onTimeDays: 0,
  };

  const tier = getKpiTier(summary.averageKpiScore);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
      {/* ── 1. Page Header & Month Selector ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
                My Monthly KPI & Performance
              </h1>
              <p className="text-xs text-slate-500">
                Track your monthly performance, task completion, and daily KPI history
              </p>
            </div>
          </div>
        </div>

        {/* Month Picker Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 px-2 text-xs font-bold text-slate-800 min-w-[130px] justify-center">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            <span>
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <Loading fullScreen={false} message="Loading monthly KPI performance..." />
      ) : (
        <>
          {/* ── 2. Top Summary KPI Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Card 1: Monthly Average KPI Gauge */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <h3 className="font-bold text-slate-800 text-sm">Monthly Average KPI</h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tier.bg} ${tier.text} ${tier.border}`}
                >
                  {summary.monthlyLabel}
                </span>
              </div>

              <div className="py-4 my-auto">
                <KpiGauge score={summary.averageKpiScore} label={summary.monthlyLabel} size={220} />
              </div>
            </div>

            {/* Card 2: Tasks Overview Metrics */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Monthly Tasks Summary</h3>
                </div>
                <span className="text-xs font-bold text-blue-600">
                  {summary.completionRate}% Done
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 my-auto py-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Planned</span>
                  <p className="text-xl font-black text-slate-800 mt-1">{summary.totalMonthlyTasks}</p>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Completed</span>
                  <p className="text-xl font-black text-emerald-600 mt-1">{summary.totalCompletedTasks}</p>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">In Progress</span>
                  <p className="text-xl font-black text-amber-600 mt-1">{summary.totalInProgressTasks}</p>
                </div>
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">Not Done</span>
                  <p className="text-xl font-black text-rose-600 mt-1">{summary.totalNotCompletedTasks}</p>
                </div>
              </div>

              {/* Progress Bar */}
              {summary.totalMonthlyTasks > 0 && (
                <div className="pt-2">
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      style={{ width: `${(summary.totalCompletedTasks / summary.totalMonthlyTasks) * 100}%` }}
                      className="bg-emerald-500"
                    />
                    <div
                      style={{ width: `${(summary.totalInProgressTasks / summary.totalMonthlyTasks) * 100}%` }}
                      className="bg-amber-500"
                    />
                    <div
                      style={{ width: `${(summary.totalNotCompletedTasks / summary.totalMonthlyTasks) * 100}%` }}
                      className="bg-rose-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Attendance & Consistency */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Attendance & Consistency</h3>
                </div>
                <span className="text-xs font-semibold text-slate-400">Monthly</span>
              </div>

              <div className="space-y-3 my-auto py-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-600">Present Work Days:</span>
                  <span className="font-black text-slate-800 text-sm">{summary.presentDays} days</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="font-semibold text-emerald-900">On-Time Check-Ins:</span>
                  <span className="font-black text-emerald-700 text-sm">{summary.onTimeDays} days</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span className="font-semibold text-blue-900">Active Task Planning Days:</span>
                  <span className="font-black text-blue-700 text-sm">{summary.activeWorkDays} days</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. Daily Breakdown History Table ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Daily KPI & Work Plan Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed day-by-day record of planned tasks, attendance, and scores for{' '}
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 w-28">Date</th>
                    <th className="py-3 px-4">Planned Tasks</th>
                    <th className="py-3 px-4 text-center w-28">Tasks (Done/Total)</th>
                    <th className="py-3 px-4 text-center w-28">Attendance</th>
                    <th className="py-3 px-4 text-center w-28">Daily KPI Score</th>
                    <th className="py-3 px-4">Notes / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(kpiData?.dailyBreakdown || []).map((day) => {
                    const dayDate = new Date(day.date);
                    const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                    const isWeekend = dayName === 'Sun' || dayName === 'Sat';
                    const hasTasks = day.totalTasks > 0;
                    const dayTier = getKpiTier(day.kpiScore);

                    return (
                      <tr
                        key={day.date}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isWeekend ? 'bg-slate-50/40 text-slate-400' : ''
                        }`}
                      >
                        {/* Date */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{day.date}</span>
                            <span className="text-[10px] text-slate-400">{dayName}</span>
                          </div>
                        </td>

                        {/* Planned Tasks */}
                        <td className="py-3.5 px-4">
                          {day.plans.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">No tasks planned</span>
                          ) : (
                            <div className="space-y-1 max-w-md">
                              {day.plans.map((p, idx) => (
                                <div key={p.id || idx} className="flex items-center gap-1.5 text-[11px]">
                                  <span>{p.status === 'COMPLETED' ? '✅' : p.status === 'IN_PROGRESS' ? '🟡' : '🔴'}</span>
                                  <span className="font-medium text-slate-700 truncate">{p.taskName}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Tasks Count */}
                        <td className="py-3.5 px-4 text-center">
                          {hasTasks ? (
                            <span className="font-bold text-slate-700">
                              <span className="text-emerald-600">{day.completedCount}</span> / {day.totalTasks}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Attendance */}
                        <td className="py-3.5 px-4 text-center">
                          {day.attendance ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {day.attendance.timingStatus || 'PRESENT'}
                            </span>
                          ) : isWeekend ? (
                            <span className="text-slate-300 text-[10px]">Weekend</span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>

                        {/* Daily KPI Score */}
                        <td className="py-3.5 px-4 text-center">
                          {hasTasks || (day.note && day.note.kpiScore !== null) ? (
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${dayTier.bg} ${dayTier.text} ${dayTier.border}`}
                            >
                              {day.kpiScore}% ({day.kpiLabel})
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Notes / Remarks */}
                        <td className="py-3.5 px-4 text-slate-600 text-xs">
                          {day.note?.notes ? (
                            <span className="line-clamp-2 italic">{day.note.notes}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeKpi;
