import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  Home,
  Clock,
  AlertTriangle,
  Sparkles,
  Search,
  X,
  MapPin,
  FileText,
  Eye,
  ShieldCheck,
  Building2,
  CalendarDays,
} from 'lucide-react';
import { adminService, CalendarDayData, CalendarSummaryResponse } from '../../services/adminService';
import Loading from '../../components/Loading';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const AdminAttendanceCalendar: React.FC = () => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const [calendarData, setCalendarData] = useState<CalendarSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Day Details Modal State
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null);
  const [modalTab, setModalTab] = useState<'all' | 'presents' | 'leaves' | 'wfh' | 'permissions' | 'late' | 'absents'>('all');
  const [modalSearch, setModalSearch] = useState<string>('');

  // Fetch Calendar Summary
  const fetchCalendar = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getCalendarSummary(selectedYear, selectedMonth, selectedDept);
      setCalendarData(res);
      // If modal is open, keep selected day in sync
      if (selectedDay) {
        const updated = res.dailySummaries[selectedDay.date];
        if (updated) setSelectedDay(updated);
      }
    } catch (err: any) {
      console.error('Failed to fetch attendance calendar', err);
      setError(err.response?.data?.message || 'Failed to load attendance calendar data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [selectedYear, selectedMonth, selectedDept]);

  // Month Navigation
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

  const handleToday = () => {
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth() + 1);
  };

  // Calendar Grid Calculation
  const gridCells = useMemo(() => {
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const cells: (CalendarDayData | null)[] = [];

    // Padding empty days before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = calendarData?.dailySummaries[dateStr] || {
        date: dateStr,
        day: d,
        dayOfWeek: new Date(selectedYear, selectedMonth - 1, d).toLocaleDateString('en-US', { weekday: 'short' }),
        isWeekend: new Date(selectedYear, selectedMonth - 1, d).getDay() === 0 || new Date(selectedYear, selectedMonth - 1, d).getDay() === 6,
        isHoliday: false,
        holidayName: null,
        holidayType: null,
        totalEmployees: calendarData?.totalEmployees || 0,
        presentCount: 0,
        leaveCount: 0,
        wfhCount: 0,
        lateCount: 0,
        permissionCount: 0,
        absentCount: 0,
        presentEmployees: [],
        leaveEmployees: [],
        wfhEmployees: [],
        lateEmployees: [],
        permissionEmployees: [],
        absentEmployees: [],
      };
      cells.push(dayData);
    }

    return cells;
  }, [selectedYear, selectedMonth, calendarData]);

  // Today string for comparison
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Filtered employees inside Day Details Modal
  const modalFilteredEmployees = useMemo(() => {
    if (!selectedDay) return [];
    const query = modalSearch.toLowerCase().trim();

    const matchesQuery = (name: string, code: string, dept: string) => {
      if (!query) return true;
      return (
        name.toLowerCase().includes(query) ||
        code.toLowerCase().includes(query) ||
        (dept && dept.toLowerCase().includes(query))
      );
    };

    if (modalTab === 'presents') {
      return selectedDay.presentEmployees
        .filter((e) => matchesQuery(e.name, e.employeeCode, e.department))
        .map((e) => ({ ...e, recordType: 'PRESENT' as const }));
    }
    if (modalTab === 'leaves') {
      return selectedDay.leaveEmployees
        .filter((e) => matchesQuery(e.name, e.employeeCode, e.department))
        .map((e) => ({ ...e, recordType: 'LEAVE' as const }));
    }
    if (modalTab === 'wfh') {
      return selectedDay.wfhEmployees
        .filter((e) => matchesQuery(e.name, e.employeeCode, e.department))
        .map((e) => ({ ...e, recordType: 'WFH' as const }));
    }
    if (modalTab === 'permissions') {
      return selectedDay.permissionEmployees
        .filter((e) => matchesQuery(e.name, e.employeeCode, e.department))
        .map((e) => ({ ...e, recordType: 'PERMISSION' as const }));
    }
    if (modalTab === 'late') {
      return selectedDay.lateEmployees
        .filter((e) => matchesQuery(e.name, e.employeeCode, e.department))
        .map((e) => ({ ...e, recordType: 'LATE' as const }));
    }
    if (modalTab === 'absents') {
      return selectedDay.absentEmployees
        .filter((e) => matchesQuery(e.name, e.employeeCode, e.department))
        .map((e) => ({ ...e, recordType: 'ABSENT' as const }));
    }

    // 'all' tab: compile all lists
    const combined: any[] = [
      ...selectedDay.presentEmployees.map((e) => ({ ...e, recordType: 'PRESENT' as const })),
      ...selectedDay.leaveEmployees.map((e) => ({ ...e, recordType: 'LEAVE' as const })),
      ...selectedDay.wfhEmployees.map((e) => ({ ...e, recordType: 'WFH' as const })),
      ...selectedDay.permissionEmployees.map((e) => ({ ...e, recordType: 'PERMISSION' as const })),
      ...selectedDay.absentEmployees.map((e) => ({ ...e, recordType: 'ABSENT' as const })),
    ];

    return combined.filter((e) => matchesQuery(e.name, e.employeeCode, e.department));
  }, [selectedDay, modalTab, modalSearch]);

  // Export CSV of calendar summary
  const handleExportCSV = () => {
    if (!calendarData || !calendarData.days.length) return;

    const headers = [
      'Date',
      'Day',
      'Is Weekend',
      'Holiday',
      'Total Employees',
      'Presents (Logins)',
      'Leaves',
      'WFH',
      'Permissions',
      'Late Logins',
      'Absents',
    ];

    const rows = calendarData.days.map((d) => [
      d.date,
      d.dayOfWeek,
      d.isWeekend ? 'Yes' : 'No',
      d.holidayName || (d.isHoliday ? 'Holiday' : 'No'),
      d.totalEmployees,
      d.presentCount,
      d.leaveCount,
      d.wfhCount,
      d.permissionCount,
      d.lateCount,
      d.absentCount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Attendance_Calendar_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* ── Top Header & Controls ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
            <CalendarDays className="h-4 w-4" />
            Live Organization Calendar
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Attendance & Leave Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Daily breakdown of employee check-ins, leaves, work-from-home, permissions & holidays.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl px-3.5 py-2.5 pr-8 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-xs cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {calendarData?.departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <Filter className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Month Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl px-3.5 py-2.5 pr-8 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-xs cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <CalendarIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl px-3.5 py-2.5 pr-8 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-xs cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <CalendarIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Today Button */}
          <button
            onClick={handleToday}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
            title="Jump to today"
          >
            Today
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={loading || !calendarData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
            title="Export Monthly Calendar CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchCalendar}
            disabled={loading}
            className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
            title="Refresh Calendar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Metric Summary Cards ── */}
      {calendarData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Active Staff */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Active Staff</span>
              <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{calendarData.totalEmployees}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Eligible for punches</span>
          </div>

          {/* Card 2: Total Logins */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Total Logins</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {calendarData.metrics.totalPresentSum}
            </p>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">Present punches</span>
          </div>

          {/* Card 3: Total Leaves */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Approved Leaves</span>
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <XCircle className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
              {calendarData.metrics.totalLeavesSum}
            </p>
            <span className="text-[10px] text-rose-700/80 dark:text-rose-400/80 font-medium">Casual/Sick/LOP</span>
          </div>

          {/* Card 4: Work From Home */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">WFH Days</span>
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Home className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
              {calendarData.metrics.totalWfhSum}
            </p>
            <span className="text-[10px] text-blue-700/80 dark:text-blue-400/80 font-medium">Remote days</span>
          </div>

          {/* Card 5: Permissions */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Permissions</span>
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
              {calendarData.metrics.totalPermissionsSum}
            </p>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium">Short permissions</span>
          </div>

          {/* Card 6: Late Logins */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Late Arrivals</span>
              <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-orange-600 dark:text-orange-400">
              {calendarData.metrics.totalLateSum}
            </p>
            <span className="text-[10px] text-orange-700/80 dark:text-orange-400/80 font-medium">Grace exceeded</span>
          </div>
        </div>
      )}

      {/* ── Main Calendar Container ── */}
      <div className="bg-white dark:bg-slate-850 dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 overflow-hidden">
        {/* Month Title & Quick Chevron Switcher */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800/50">
              <Building2 className="h-3.5 w-3.5" />
              {selectedDept === 'ALL' ? 'All Departments' : `${selectedDept} Dept`}
            </span>
          </div>

          {/* Chevron Controls */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-2xs cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-2xs cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Legend Indicator Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-3 px-1 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Logins (Presents)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/50 font-bold">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Approved Leaves
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 font-bold">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Work From Home (WFH)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/50 font-bold">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Permissions
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800/50 font-bold">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Late Check-ins
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/50 font-bold">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              Holidays
            </span>
          </div>

          <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
            💡 Click any date to view complete employee punch logs
          </span>
        </div>

        {/* ── Calendar Grid ── */}
        {loading && !calendarData ? (
          <Loading message="Loading attendance calendar..." />
        ) : (
          <div className="overflow-x-auto pt-4">
            <div className="min-w-[760px]">
              {/* Weekday Columns Header */}
              <div className="grid grid-cols-7 gap-2.5 text-center text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                {WEEKDAYS.map((w, idx) => (
                  <div
                    key={w}
                    className={`py-1.5 rounded-lg ${
                      idx === 0 || idx === 6 ? 'text-rose-500 dark:text-rose-400 font-extrabold' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-2.5">
                {gridCells.map((day, index) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[120px] rounded-2xl bg-slate-50/40 dark:bg-slate-800/20 border border-transparent opacity-30"
                      />
                    );
                  }

                  const isToday = day.date === todayStr;
                  const hasActivity =
                    day.presentCount > 0 ||
                    day.leaveCount > 0 ||
                    day.wfhCount > 0 ||
                    day.permissionCount > 0 ||
                    day.lateCount > 0 ||
                    day.isHoliday;

                  return (
                    <div
                      key={day.date}
                      onClick={() => setSelectedDay(day)}
                      className={`min-h-[125px] p-2.5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between group hover:shadow-md hover:scale-[1.01] ${
                        isToday
                          ? 'bg-primary-50/40 dark:bg-primary-950/30 border-primary-400 dark:border-primary-500 ring-2 ring-primary-500/20 shadow-xs'
                          : day.isHoliday
                          ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40 hover:border-purple-300 dark:hover:border-purple-600'
                          : day.isWeekend
                          ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          : hasActivity
                          ? 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/70 hover:border-primary-300 dark:hover:border-primary-500'
                          : 'bg-slate-50/50 dark:bg-slate-850 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Cell Header: Day Number & Holiday / Today Tag */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-black h-6 w-6 rounded-full flex items-center justify-center transition ${
                            isToday
                              ? 'bg-primary-600 text-white shadow-xs'
                              : day.isHoliday
                              ? 'bg-purple-600 text-white'
                              : day.isWeekend
                              ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60'
                              : 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/60 group-hover:text-primary-800 dark:group-hover:text-primary-200'
                          }`}
                        >
                          {day.day}
                        </span>

                        {isToday ? (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary-600 text-white shadow-xs">
                            Today
                          </span>
                        ) : day.isHoliday ? (
                          <span className="text-[9px] font-bold truncate max-w-[80px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300" title={day.holidayName || 'Holiday'}>
                            {day.holidayName || 'Holiday'}
                          </span>
                        ) : null}
                      </div>

                      {/* Cell Content: Metric Badges */}
                      <div className="mt-2 space-y-1">
                        {/* Presents / Logins */}
                        {day.presentCount > 0 && (
                          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-between border border-emerald-200/50 dark:border-emerald-800/40">
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Logins
                            </span>
                            <span className="font-black">{day.presentCount}</span>
                          </div>
                        )}

                        {/* Leaves */}
                        {day.leaveCount > 0 && (
                          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 flex items-center justify-between border border-rose-200/50 dark:border-rose-800/40">
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Leaves
                            </span>
                            <span className="font-black">{day.leaveCount}</span>
                          </div>
                        )}

                        {/* Work From Home */}
                        {day.wfhCount > 0 && (
                          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center justify-between border border-blue-200/50 dark:border-blue-800/40">
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              WFH
                            </span>
                            <span className="font-black">{day.wfhCount}</span>
                          </div>
                        )}

                        {/* Permissions */}
                        {day.permissionCount > 0 && (
                          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-between border border-amber-200/50 dark:border-amber-800/40">
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Perms
                            </span>
                            <span className="font-black">{day.permissionCount}</span>
                          </div>
                        )}

                        {/* Late Check-ins */}
                        {day.lateCount > 0 && (
                          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100/80 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 flex items-center justify-between border border-orange-200/50 dark:border-orange-800/40">
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                              Late
                            </span>
                            <span className="font-black">{day.lateCount}</span>
                          </div>
                        )}

                        {/* No Activity on Normal Working Day */}
                        {!hasActivity && !day.isWeekend && (
                          <span className="text-[10px] text-slate-300 dark:text-slate-600 block text-center py-1.5 font-medium">
                            No Logs
                          </span>
                        )}

                        {/* Weekend label */}
                        {!hasActivity && day.isWeekend && (
                          <span className="text-[10px] text-rose-300 dark:text-rose-500/70 block text-center py-1.5 font-bold uppercase tracking-wider">
                            Weekend
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Comprehensive Day Details Modal ("All Details") ── */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  {selectedDay.day}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {selectedDay.dayOfWeek},{' '}
                      {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </h2>
                    {selectedDay.isHoliday && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                        {selectedDay.holidayName || 'Company Holiday'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {selectedDay.presentCount} Logged In • {selectedDay.leaveCount} Leaves •{' '}
                    {selectedDay.wfhCount} WFH • {selectedDay.permissionCount} Permissions
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Search & Filter Tabs */}
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setModalTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    modalTab === 'all'
                      ? 'bg-slate-900 dark:bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All ({modalFilteredEmployees.length})
                </button>
                <button
                  onClick={() => setModalTab('presents')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    modalTab === 'presents'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                  }`}
                >
                  Logins ({selectedDay.presentCount})
                </button>
                <button
                  onClick={() => setModalTab('leaves')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    modalTab === 'leaves'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                  }`}
                >
                  Leaves ({selectedDay.leaveCount})
                </button>
                <button
                  onClick={() => setModalTab('wfh')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    modalTab === 'wfh'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                  }`}
                >
                  WFH ({selectedDay.wfhCount})
                </button>
                <button
                  onClick={() => setModalTab('permissions')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    modalTab === 'permissions'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                  }`}
                >
                  Permissions ({selectedDay.permissionCount})
                </button>
                <button
                  onClick={() => setModalTab('late')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    modalTab === 'late'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40'
                  }`}
                >
                  Late ({selectedDay.lateCount})
                </button>
                <button
                  onClick={() => setModalTab('absents')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    modalTab === 'absents'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Absent ({selectedDay.absentCount})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative shrink-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by name, code..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-48 transition"
                />
              </div>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
              {modalFilteredEmployees.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarDays className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No records found for this category</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try switching tabs or adjusting search query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Time & Status</th>
                        <th className="py-3 px-4">Details / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {modalFilteredEmployees.map((emp: any, idx: number) => {
                        const recType = emp.recordType;

                        return (
                          <tr key={`${emp.id}-${recType}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                            {/* Employee */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-xs shrink-0">
                                  {emp.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-100">{emp.name}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {emp.employeeCode} • <span className="font-semibold text-slate-600 dark:text-slate-400">{emp.department}</span>
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category Badge */}
                            <td className="py-3.5 px-4">
                              {recType === 'PRESENT' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  Present ({emp.workMode || 'OFFICE'})
                                </span>
                              )}
                              {recType === 'LEAVE' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                                  <XCircle className="h-3 w-3 text-rose-500" />
                                  {emp.leaveType?.replace('_', ' ') || 'Leave'}
                                </span>
                              )}
                              {recType === 'WFH' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                                  <Home className="h-3 w-3 text-blue-500" />
                                  Work From Home
                                </span>
                              )}
                              {recType === 'PERMISSION' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                  <Clock className="h-3 w-3 text-amber-500" />
                                  Permission
                                </span>
                              )}
                              {recType === 'LATE' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40">
                                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                                  Late Check-in
                                </span>
                              )}
                              {recType === 'ABSENT' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  Not Logged In
                                </span>
                              )}
                            </td>

                            {/* Time & Status */}
                            <td className="py-3.5 px-4">
                              {recType === 'PRESENT' || recType === 'LATE' ? (
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                                    In:{' '}
                                    <strong className="text-slate-900 dark:text-white">
                                      {emp.loginTime
                                        ? new Date(emp.loginTime).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : '—'}
                                    </strong>{' '}
                                    • Out:{' '}
                                    <strong className="text-slate-900 dark:text-white">
                                      {emp.logoutTime
                                        ? new Date(emp.logoutTime).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : 'Pending'}
                                    </strong>
                                  </p>
                                  {emp.timingStatus === 'LATE' && (
                                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                                      ⚠️ Marked Late Punch
                                    </span>
                                  )}
                                </div>
                              ) : recType === 'PERMISSION' ? (
                                <p className="font-semibold text-slate-700 dark:text-slate-300">
                                  From:{' '}
                                  <strong className="text-slate-900 dark:text-white">
                                    {emp.fromTime
                                      ? new Date(emp.fromTime).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : '—'}
                                  </strong>{' '}
                                  To:{' '}
                                  <strong className="text-slate-900 dark:text-white">
                                    {emp.toTime
                                      ? new Date(emp.toTime).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : '—'}
                                  </strong>
                                </p>
                              ) : recType === 'LEAVE' ? (
                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                  {emp.isHalfDay
                                    ? `Half Day (${emp.halfDaySession || 'Half Day'})`
                                    : 'Full Day Approved'}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">—</span>
                              )}
                            </td>

                            {/* Details / Reason */}
                            <td className="py-3.5 px-4">
                              <p className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-xs" title={emp.reason || 'No remarks'}>
                                {emp.reason || (recType === 'PRESENT' ? 'Normal office day' : '—')}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceCalendar;
