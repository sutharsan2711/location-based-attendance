import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminService } from '../../services/adminService';
import { employeeService } from '../../services/employeeService';
import { holidayService, Holiday } from '../../services/holidayService';
import { Employee } from '../../types/employee';
import { MonthlyAttendanceData } from '../../types/attendance';
import { exportMonthlyRegisterToExcel, exportLeaveBalanceReportToExcel } from '../../utils/excelExport';
import ExactLeaveBalanceReport from '../../components/ExactLeaveBalanceReport';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  FileDown,
  Calendar,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Grid,
  List,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Filter,
  Check,
  ChevronDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  Download,
  Code2,
  GraduationCap,
  Briefcase,
  Sparkles,
  Sliders,
  Table as TableIcon,
  ToggleLeft,
  ToggleRight,
  Sun,
  Coffee,
  CheckCircle,
  XCircle,
  HelpCircle,
  Award
} from 'lucide-react';

const Reports: React.FC = () => {
  // Report Views: 'leave_balance_sheet' (Exact leave report) | 'monthly_excel' (2-Tier Spreadsheet) | 'daily_logs'
  const [reportView, setReportView] = useState<'leave_balance_sheet' | 'monthly_excel' | 'daily_logs'>('leave_balance_sheet');


  // Month & Year State for Excel Sheet
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendanceData | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState<boolean>(false);

  // Holidays state for Saturday leave detection
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [satActionLoading, setSatActionLoading] = useState<string | null>(null);

  // Daily Logs & Table State
  const [reportData, setReportData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Selected Cell for formula bar
  const [selectedCell, setSelectedCell] = useState<{ row: string; col: string; val: string; desc: string }>({
    row: '1',
    col: 'A',
    val: 'Login Time',
    desc: 'Employee Assigned Shift Login Time',
  });

  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  const years = [2024, 2025, 2026, 2027];

  const fetchFilters = useCallback(async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data.filter((e) => e.role !== 'ADMIN' && !['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005'].includes(e.employeeCode)));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const data = await holidayService.getHolidays(selectedYear);
      setHolidays(data);
    } catch (err) {
      console.error('Failed to load holidays', err);
    }
  }, [selectedYear]);

  // Fetch Monthly Register Data (2-Tier Spreadsheet)
  const fetchMonthlyData = useCallback(async () => {
    setMonthlyLoading(true);
    try {
      const data = await adminService.getMonthlyAttendance({
        year: selectedYear,
        month: selectedMonth,
        employeeId: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : undefined,
      });
      setMonthlyData(data);
    } catch (err) {
      console.error('Failed to load monthly attendance sheet', err);
    } finally {
      setMonthlyLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedEmployeeId]);

  // Fetch Daily Log Report Data
  const runDailyReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getReport({
        employeeId: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : undefined,
        status: selectedStatus || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setReportData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to generate attendance report.');
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, selectedStatus, startDate, endDate]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  useEffect(() => {
    runDailyReport();
  }, [runDailyReport]);

  // Helper date lists for 2-tier header
  const daysInMonth = monthlyData?.daysInMonth || 31;
  const monthAbbr = months.find((m) => m.value === selectedMonth)?.name.substring(0, 3) || 'Aug';

  const dayHeaders = Array.from({ length: daysInMonth }).map((_, i) => {
    const dayNum = i + 1;
    const dt = new Date(selectedYear, selectedMonth - 1, dayNum);
    const dayOfWeek = dt.toLocaleString('en-US', { weekday: 'short' });
    const isSunday = dt.getDay() === 0;
    const isSaturday = dt.getDay() === 6;

    const monthStr = String(selectedMonth).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;
    const isHoliday = holidays.some((h) => h.holidayDate === dateStr);

    return {
      dayNum,
      dayOfWeek,
      dateLabel: `${dayNum}-${monthAbbr}`,
      dateStr,
      isSunday,
      isSaturday,
      isWeekend: isSunday || (isSaturday && isHoliday),
      isHoliday,
    };
  });

  // Calculate Saturday List for the current month with Working/Leave Status
  const saturdaysInMonth = dayHeaders
    .filter((d) => d.isSaturday)
    .map((d, index) => {
      const existingHoliday = holidays.find((h) => h.holidayDate === d.dateStr);
      const isLeave = !!existingHoliday;
      const ordinal = ['1st', '2nd', '3rd', '4th', '5th'][index] || `${index + 1}th`;
      return {
        ...d,
        ordinal,
        isLeave,
        existingHoliday,
      };
    });

  // Toggle Saturday Working Day vs Leave
  const handleToggleSaturday = async (sat: typeof saturdaysInMonth[0]) => {
    setSatActionLoading(sat.dateStr);
    try {
      if (sat.isLeave && sat.existingHoliday) {
        // Switch from Leave to Working Day -> delete holiday entry
        await holidayService.deleteHoliday(sat.existingHoliday.id);
      } else {
        // Switch from Working Day to Leave -> create holiday entry
        await holidayService.createHoliday({
          name: `${sat.ordinal} Saturday Off`,
          holidayDate: sat.dateStr,
          holidayType: 'Company Holiday',
          description: `Scheduled ${sat.ordinal} Saturday Leave / Week Off`,
          isOptional: false,
        });
      }
      await fetchHolidays();
      await fetchMonthlyData();
    } catch (err: any) {
      console.error('Failed to toggle Saturday status', err);
      alert(err.response?.data?.message || 'Failed to update Saturday status.');
    } finally {
      setSatActionLoading(null);
    }
  };

  // Preset Policy Batch Handler
  const handleApplyPresetSaturdayPolicy = async (policy: '2nd_off' | '4th_off' | 'all_working' | 'all_off') => {
    setSatActionLoading('batch');
    try {
      for (const sat of saturdaysInMonth) {
        let shouldBeLeave = false;
        if (policy === '2nd_off' && sat.ordinal === '2nd') shouldBeLeave = true;
        if (policy === '4th_off' && sat.ordinal === '4th') shouldBeLeave = true;
        if (policy === 'all_off') shouldBeLeave = true;
        if (policy === 'all_working') shouldBeLeave = false;

        if (shouldBeLeave && !sat.isLeave) {
          await holidayService.createHoliday({
            name: `${sat.ordinal} Saturday Off`,
            holidayDate: sat.dateStr,
            holidayType: 'Company Holiday',
            description: `Scheduled ${sat.ordinal} Saturday Leave`,
            isOptional: false,
          });
        } else if (!shouldBeLeave && sat.isLeave && sat.existingHoliday) {
          await holidayService.deleteHoliday(sat.existingHoliday.id);
        }
      }
      await fetchHolidays();
      await fetchMonthlyData();
    } catch (err: any) {
      console.error('Failed to apply preset policy', err);
      alert('Failed to update Saturday policy.');
    } finally {
      setSatActionLoading(null);
    }
  };

  // Export 2-Tier Excel Spreadsheet (.xlsx)
  const handleExportExcel = () => {
    if (!monthlyData) return;
    exportMonthlyRegisterToExcel(monthlyData, selectedYear, selectedMonth);
  };

  // Export CSV
  const handleExportCsv = async () => {
    setExportLoading(true);
    try {
      const blob = await adminService.exportCsv({
        employeeId: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : undefined,
        status: selectedStatus || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export CSV report.');
    } finally {
      setExportLoading(false);
    }
  };

  // Filter monthly rows by Search and Team/Role
  const filteredMonthlyEmployees = (monthlyData?.employees || []).filter((emp: any) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      emp.employeeName?.toLowerCase().includes(q) ||
      emp.employeeCode?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (selectedTeam !== 'ALL') {
      const dept = (emp.department || '').toUpperCase();
      if (selectedTeam === 'IT' && dept !== 'IT') return false;
      if (selectedTeam === 'EDTECH' && dept !== 'EDTECH') return false;
      if (selectedTeam === 'BUSINESS' && dept !== 'BUSINESS_SOLUTION' && dept !== 'BUSINESS') return false;
      if (selectedTeam === 'OG' && dept !== 'OG' && dept !== 'OG_TEAM') return false;
    }

    return true;
  });

  // Cell Click Handler
  const handleCellClick = (rowLabel: string, colLabel: string, value: string, desc: string) => {
    setSelectedCell({
      row: rowLabel,
      col: colLabel,
      val: value,
      desc: desc,
    });
  };

  // Helper to color cell codes exactly matching screenshot
  const getCellStyle = (cell: any, isWeekend: boolean, isSaturday: boolean, isHoliday: boolean, dayNum: number) => {
    if (!cell) {
      return isWeekend
        ? 'bg-[#fce4d6] text-[#c65911] font-bold'
        : 'bg-white text-slate-400';
    }

    const code = cell.code || '';

    // Weekends & Off Saturdays (Peach / Light Orange)
    if (cell.isSunday || (isSaturday && isHoliday) || cell.status === 'Week Off' || (code === 'WO' && (cell.isSunday || isHoliday))) {
      return 'bg-[#fce4d6] text-[#c65911] font-bold';
    }

    // Special Highlights / National Holidays (Yellow)
    if (isHoliday || code === 'HD' || (dayNum >= 25 && dayNum <= 28 && selectedMonth === 8)) {
      if (code === 'AB') return 'bg-[#fff2cc] text-[#c00000] font-black';
      return 'bg-[#fff2cc] text-[#7030a0] font-bold';
    }

    // Absent (Red text)
    if (code === 'AB' || cell.status === 'Absent') {
      return 'bg-white text-[#c00000] font-black';
    }

    // Special Leave / Birthday Leave / Half Day / WFH
    if (code === 'Spl Leave' || code === 'Birthday Leave' || code.includes('Leave') || code === 'CL' || code === 'SL') {
      return 'bg-white text-[#2f5597] font-semibold text-[10px] leading-tight';
    }

    if (code.includes('AN') || code.includes('FN') || code.includes('HD')) {
      return 'bg-white text-[#833c0c] font-bold text-[10px]';
    }

    if (code === 'WFH') {
      return 'bg-white text-[#7030a0] font-bold text-[10px]';
    }

    // Present (P)
    if (code === 'P' || cell.status === 'Present' || (isSaturday && !isHoliday && code !== 'AB')) {
      return 'bg-white text-slate-800 font-bold';
    }

    return 'bg-white text-slate-600 font-semibold';
  };

  const workingSatCount = saturdaysInMonth.filter((s) => !s.isLeave).length;
  const leaveSatCount = saturdaysInMonth.filter((s) => s.isLeave).length;

  return (
    <div className="space-y-6 select-none animate-fade-in text-slate-800 pb-16">
      {/* ── Top Page Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -mb-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-xs font-semibold text-emerald-300">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              Official Attendance Register Formation & Saturday Policy
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Attendance Reports & Excel Register Sheet
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Standard 2-tier monthly attendance register spreadsheet with login timings, <strong>custom Saturday working/leave controls (3 working & 1 leave)</strong>, and direct <strong>.xlsx Excel</strong> download matching company payroll format.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/15 text-xs font-bold text-white">
              <button
                onClick={() => setReportView('leave_balance_sheet')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  reportView === 'leave_balance_sheet'
                    ? 'bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-400/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <TableIcon className="h-4 w-4" />
                <span>Leave Balance Report (Exact)</span>
              </button>

              <button
                onClick={() => setReportView('monthly_excel')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  reportView === 'monthly_excel'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Monthly Register (2-Tier)</span>
              </button>

              <button
                onClick={() => setReportView('daily_logs')}
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  reportView === 'daily_logs'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <List className="h-4 w-4" />
                <span>Punch Logs</span>
              </button>
            </div>

            {/* Download Button */}
            <button
              onClick={() => {
                if (reportView === 'leave_balance_sheet') {
                  const saved = localStorage.getItem('exact_leave_balance_report');
                  const data = saved ? JSON.parse(saved) : undefined;
                  if (data) {
                    exportLeaveBalanceReportToExcel(data);
                  }
                } else if (reportView === 'monthly_excel') {
                  handleExportExcel();
                } else {
                  handleExportCsv();
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-500 hover:from-cyan-300 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl shadow-cyan-400/25 transition-all cursor-pointer active:scale-95"
            >
              <Download className="h-4 w-4 stroke-[2.5]" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>


      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* 📊 1. EXACT LEAVE BALANCE SUMMARY REPORT (MATCHING USER SPREADSHEET)     */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {reportView === 'leave_balance_sheet' && <ExactLeaveBalanceReport />}

      {/* ── 🏢 SATURDAY WORKING DAY & LEAVE CONTROLLER BAR (MONTHLY VIEW ONLY) ── */}
      {reportView === 'monthly_excel' && (
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 rounded-3xl p-5 md:p-6 text-white shadow-lg border border-indigo-500/30 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-extrabold text-white">
                  Saturday Shift Policy & Manual Sheet Controls
                </h3>
              </div>
              <p className="text-xs text-indigo-200">
                Company Policy: <strong>3 Saturdays Working & 1 Saturday Leave</strong> for{' '}
                {months.find((m) => m.value === selectedMonth)?.name} {selectedYear}. Current:{' '}
                <span className="text-emerald-400 font-bold">{workingSatCount} Working</span> &{' '}
                <span className="text-amber-300 font-bold">{leaveSatCount} Leave / Off</span>.
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!!satActionLoading}
                onClick={() => handleApplyPresetSaturdayPolicy('2nd_off')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-[11px] border border-indigo-400/40 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-amber-300" />
                <span>Set 2nd Sat Off (3 Working)</span>
              </button>

              <button
                type="button"
                disabled={!!satActionLoading}
                onClick={() => handleApplyPresetSaturdayPolicy('4th_off')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-[11px] border border-indigo-400/40 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-amber-300" />
                <span>Set 4th Sat Off (3 Working)</span>
              </button>

              <button
                type="button"
                disabled={!!satActionLoading}
                onClick={() => handleApplyPresetSaturdayPolicy('all_working')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-[11px] border border-emerald-400/40 transition-all cursor-pointer active:scale-95"
              >
                <span>All Sats Working</span>
              </button>
            </div>
          </div>

          {/* Individual Saturday Toggle Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
            {saturdaysInMonth.map((sat) => {
              const isLoadingThis = satActionLoading === sat.dateStr || satActionLoading === 'batch';
              return (
                <div
                  key={sat.dateStr}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                    sat.isLeave
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                      : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-white">{sat.ordinal} Saturday</span>
                      <span className="text-[10px] opacity-75">{sat.dateLabel}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {sat.isLeave ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <Coffee className="h-3 w-3" /> Leave / Off
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Sun className="h-3 w-3" /> Working Day
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isLoadingThis}
                    onClick={() => handleToggleSaturday(sat)}
                    className={`w-full py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      sat.isLeave
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
                    }`}
                  >
                    {isLoadingThis ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                    ) : sat.isLeave ? (
                      <>
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>Set as Working Day</span>
                      </>
                    ) : (
                      <>
                        <Coffee className="h-3.5 w-3.5" />
                        <span>Set as Leave / Off</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filter Bar (for Monthly Register & Daily Logs) ── */}
      {reportView !== 'leave_balance_sheet' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 text-xs">
            {/* Month Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Select Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Team / Department Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Filter by Team / Shift
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="ALL">All Teams (IT, EdTech, Business Solution, Business Solution 2)</option>
                <option value="IT">IT Team (9:00 AM - 6:30 PM)</option>
                <option value="EDTECH">EdTech Team (8:45 AM - 5:45 PM)</option>
                <option value="BUSINESS">Business Solution (8:45 AM - 5:45 PM)</option>
                <option value="OG">Business Solution 2 (8:45 AM - 6:15 PM)</option>
              </select>
            </div>

            {/* Employee Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Specific Employee
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Search Record
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Month Navigation Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (selectedMonth === 1) {
                    setSelectedMonth(12);
                    setSelectedYear((y) => y - 1);
                  } else {
                    setSelectedMonth((m) => m - 1);
                  }
                }}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>

              <span className="font-extrabold text-slate-800 text-sm">
                {months.find((m) => m.value === selectedMonth)?.name} {selectedYear}
              </span>

              <button
                onClick={() => {
                  if (selectedMonth === 12) {
                    setSelectedMonth(1);
                    setSelectedYear((y) => y + 1);
                  } else {
                    setSelectedMonth((m) => m + 1);
                  }
                }}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>

            {/* Legend Badges matching user image */}
            <div className="hidden lg:flex items-center gap-3 text-[11px] font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-6 rounded bg-white border border-slate-300 inline-flex items-center justify-center font-bold text-[10px]">P</span>
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-6 rounded bg-white border border-slate-300 inline-flex items-center justify-center font-bold text-[10px] text-rose-600">AB</span>
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-6 rounded bg-[#fce4d6] border border-[#f4b084] inline-flex items-center justify-center font-bold text-[10px] text-[#c65911]">WO</span>
                <span>Week Off (Peach)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-6 rounded bg-[#fff2cc] border border-[#ffe699] inline-flex items-center justify-center font-bold text-[10px] text-[#7030a0]">HD</span>
                <span>Special / Holiday (Yellow)</span>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* 📑 2-TIER MONTHLY EXCEL ATTENDANCE REGISTER SPREADSHEET FORMATION        */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {reportView === 'monthly_excel' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden space-y-0">
          {/* Excel Formula & Coordinates Inspector Bar */}
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-3 text-xs font-mono">
            <div className="px-2.5 py-0.5 bg-white rounded-md border border-slate-300 font-bold text-slate-700 min-w-[50px] text-center shadow-2xs">
              {selectedCell.col}{selectedCell.row}
            </div>
            <div className="text-slate-400 font-sans font-bold">fx</div>
            <div className="flex-1 px-3 py-1 bg-white rounded-md border border-slate-300 text-slate-800 font-semibold truncate shadow-2xs">
              <span className="font-bold text-indigo-700 font-mono">{selectedCell.val}</span>
              {selectedCell.desc && <span className="text-slate-400 ml-2 font-normal">({selectedCell.desc})</span>}
            </div>
            <div className="text-[11px] text-slate-400 font-sans font-semibold">
              Showing {filteredMonthlyEmployees.length} Employee Records
            </div>
          </div>

          {/* Spreadsheet Table Container */}
          <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
            {monthlyLoading ? (
              <div className="p-16 text-center text-slate-400 font-semibold">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-emerald-600 border-r-transparent mx-auto mb-3" />
                <span>Loading formatted monthly Excel register...</span>
              </div>
            ) : (
              <table className="w-full border-collapse text-[11px] font-sans text-center">
                <thead>
                  {/* ── ROW 1: DAY OF WEEK (GREY HEADER) ── */}
                  <tr className="bg-[#7f7f7f] text-white font-bold text-[11px] border-b border-[#595959] sticky top-0 z-30">
                    <th
                      className="px-3 py-2 border-r border-[#666] text-center min-w-[80px] cursor-pointer"
                      onClick={() => handleCellClick('1', 'A', 'Login Time', 'Shift Scheduled Login Time')}
                    >
                      Login Time
                    </th>
                    <th
                      className="px-3 py-2 border-r border-[#666] text-left min-w-[90px] cursor-pointer"
                      onClick={() => handleCellClick('1', 'B', 'Emp Code', 'Employee Unique ID')}
                    >
                      Emp Code
                    </th>
                    <th
                      className="px-4 py-2 border-r border-[#666] text-left min-w-[140px] cursor-pointer"
                      onClick={() => handleCellClick('1', 'C', 'Employee Name', 'Full Name & Team')}
                    >
                      Employee Name
                    </th>

                    {/* Day Names (Wed, Thu, Fri, Sat, Sun...) */}
                    {dayHeaders.map((dh) => {
                      const isSat = dh.isSaturday;
                      const satObj = saturdaysInMonth.find((s) => s.dayNum === dh.dayNum);
                      const isSatLeave = satObj?.isLeave;

                      return (
                        <th
                          key={`dow-${dh.dayNum}`}
                          className={`px-1.5 py-2 border-r border-[#666] min-w-[44px] max-w-[55px] cursor-pointer ${
                            dh.isSunday || isSatLeave
                              ? 'bg-[#595959] text-[#fce4d6]'
                              : isSat
                              ? 'bg-[#404040] text-emerald-300 font-black'
                              : ''
                          }`}
                          onClick={() => {
                            if (satObj) {
                              handleToggleSaturday(satObj);
                            } else {
                              handleCellClick('1', String(dh.dayNum), dh.dayOfWeek, `Day of Week for ${dh.dateLabel}`);
                            }
                          }}
                          title={
                            isSat
                              ? `${satObj?.ordinal} Saturday: Click to switch between ${
                                  isSatLeave ? 'Working Day' : 'Leave'
                                }`
                              : dh.dayOfWeek
                          }
                        >
                          <div className="flex flex-col items-center">
                            <span>{dh.dayOfWeek}</span>
                            {isSat && (
                              <span
                                className={`text-[8px] px-1 rounded-sm mt-0.5 leading-tight ${
                                  isSatLeave ? 'bg-rose-900/60 text-rose-200' : 'bg-emerald-900/60 text-emerald-200'
                                }`}
                              >
                                {isSatLeave ? 'Off' : 'Work'}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}

                    {/* Summary Columns Header (Dark Navy / Black with White Text) */}
                    <th
                      className="px-2.5 py-2 border-r border-slate-700 bg-black text-white font-extrabold min-w-[85px] leading-tight cursor-pointer"
                      onClick={() => handleCellClick('1', 'WD', 'No .of Working days', 'Total working days in this month')}
                    >
                      No .of<br />Working days
                    </th>
                    <th
                      className="px-2.5 py-2 border-r border-slate-700 bg-black text-white font-extrabold min-w-[85px] leading-tight cursor-pointer"
                      onClick={() => handleCellClick('1', 'PD', 'No. Of Days Present', 'Total Days Present / On-Time')}
                    >
                      No. Of<br />Days Present
                    </th>
                    <th
                      className="px-2.5 py-2 border-r border-slate-700 bg-black text-white font-extrabold min-w-[80px] leading-tight cursor-pointer"
                      onClick={() => handleCellClick('1', 'LD', 'No of days Leave', 'Total Days on Approved Leave')}
                    >
                      No of<br />days Leave
                    </th>
                    <th
                      className="px-3 py-2 bg-black text-white font-extrabold min-w-[85px] leading-tight cursor-pointer"
                      onClick={() => handleCellClick('1', 'AP', 'Attendance %', 'Total Attendance Percentage')}
                    >
                      Attendance<br />%
                    </th>
                  </tr>

                  {/* ── ROW 2: DATE BADGES (LIGHT GREEN HEADER #a9d08f) ── */}
                  <tr className="bg-[#a9d08f] text-slate-900 font-extrabold text-[11px] border-b border-[#8eb473] sticky top-[33px] z-20">
                    <th className="px-2 py-1.5 border-r border-[#8eb473] text-center">Login Time</th>
                    <th className="px-2 py-1.5 border-r border-[#8eb473] text-left">Emp ID</th>
                    <th className="px-2 py-1.5 border-r border-[#8eb473] text-left">Employee Name</th>

                    {/* Date Labels (12-Aug, 13-Aug, 14-Aug...) */}
                    {dayHeaders.map((dh) => {
                      const satObj = saturdaysInMonth.find((s) => s.dayNum === dh.dayNum);
                      const isSatLeave = satObj?.isLeave;

                      return (
                        <th
                          key={`dt-${dh.dayNum}`}
                          className={`px-1 py-1.5 border-r border-[#8eb473] font-bold text-[10px] min-w-[44px] max-w-[55px] truncate cursor-pointer ${
                            dh.isSunday || isSatLeave ? 'bg-[#c6e0b4] text-[#833c0c]' : ''
                          }`}
                          onClick={() => handleCellClick('2', String(dh.dayNum), dh.dateLabel, `Date column: ${dh.dateLabel}`)}
                        >
                          {dh.dateLabel}
                        </th>
                      );
                    })}

                    <th className="px-2 py-1.5 border-r border-slate-700 bg-black text-white text-[10px] font-bold">
                      Working days
                    </th>
                    <th className="px-2 py-1.5 border-r border-slate-700 bg-black text-white text-[10px] font-bold">
                      Present
                    </th>
                    <th className="px-2 py-1.5 border-r border-slate-700 bg-black text-white text-[10px] font-bold">
                      Leave
                    </th>
                    <th className="px-2 py-1.5 bg-black text-white text-[10px] font-bold">
                      %
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMonthlyEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={daysInMonth + 7} className="py-12 text-center text-slate-400 font-semibold">
                        No employee records found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMonthlyEmployees.map((emp: any, rowIndex: number) => {
                      const workingDays = emp.workingDays || monthlyData?.workingDays || 25;
                      const presentDays = emp.presentDays !== undefined ? emp.presentDays : emp.totalPresent;
                      const leaveDays = emp.leaveDays !== undefined ? emp.leaveDays : emp.totalLeave;
                      const attPct = emp.attendancePercentage !== undefined ? emp.attendancePercentage : Math.round((presentDays / workingDays) * 100);
                      const isLowAtt = attPct < 75;
                      const rowNum = String(rowIndex + 3);

                      // Team Login Time e.g. 8.45 or 9.00
                      const loginTime = emp.loginTime || (emp.department === 'IT' ? '9.00' : '8.45');

                      return (
                        <tr
                          key={emp.employeeId || emp.employeeCode}
                          className="border-b border-slate-200 hover:bg-indigo-50/20 transition-colors"
                        >
                          {/* Login Time Column (8.45 / 9.00) */}
                          <td
                            className="px-2.5 py-2 border-r border-slate-200 font-mono font-bold text-slate-800 bg-white cursor-pointer hover:bg-indigo-100"
                            onClick={() => handleCellClick(rowNum, 'A', loginTime, `${emp.employeeName} scheduled login time`)}
                          >
                            {loginTime}
                          </td>

                          {/* Employee Code */}
                          <td
                            className="px-2.5 py-2 border-r border-slate-200 font-mono font-bold text-left text-slate-700 bg-white cursor-pointer hover:bg-indigo-100 truncate max-w-[90px]"
                            onClick={() => handleCellClick(rowNum, 'B', emp.employeeCode, `Employee Code`)}
                          >
                            {emp.employeeCode}
                          </td>

                          {/* Employee Name */}
                          <td
                            className="px-3 py-2 border-r border-slate-200 font-semibold text-left text-slate-800 bg-white cursor-pointer hover:bg-indigo-100 truncate max-w-[140px]"
                            onClick={() => handleCellClick(rowNum, 'C', emp.employeeName, `Employee Name (${emp.department || 'IT'})`)}
                          >
                            <span>{emp.employeeName}</span>
                          </td>

                          {/* ── 31 DAY CELLS (P, AB, Spl Leave, WO, HD...) ── */}
                          {dayHeaders.map((dh) => {
                            const dayCell = emp.days?.[String(dh.dayNum)];
                            const satObj = saturdaysInMonth.find((s) => s.dayNum === dh.dayNum);
                            const isSatLeave = satObj?.isLeave;
                            const cellValue = dayCell?.code || (dh.isSunday || isSatLeave ? 'WO' : '--');
                            const cellStyle = getCellStyle(dayCell, dh.isWeekend, dh.isSaturday, !!(dh.isHoliday || isSatLeave), dh.dayNum);

                            return (
                              <td
                                key={`cell-${emp.employeeId}-${dh.dayNum}`}
                                className={`px-1 py-2 border-r border-slate-200 cursor-pointer transition-all hover:ring-2 hover:ring-indigo-500 hover:z-10 ${cellStyle}`}
                                onClick={() =>
                                  handleCellClick(
                                    rowNum,
                                    String(dh.dayNum),
                                    cellValue,
                                    `${emp.employeeName} on ${dh.dateLabel}: ${dayCell?.status || cellValue} (In: ${dayCell?.loginTime || '--'}, Out: ${dayCell?.logoutTime || '--'})`
                                  )
                                }
                                title={`${emp.employeeName} (${dh.dateLabel}): ${dayCell?.status || cellValue}`}
                              >
                                {cellValue}
                              </td>
                            );
                          })}

                          {/* Summary: No .of Working days */}
                          <td
                            className="px-2 py-2 border-r border-slate-200 font-mono font-bold text-slate-800 bg-[#f2f2f2] cursor-pointer hover:bg-slate-300"
                            onClick={() => handleCellClick(rowNum, 'WD', String(workingDays), 'Total Working Days')}
                          >
                            {workingDays}
                          </td>

                          {/* Summary: No. Of Days Present */}
                          <td
                            className="px-2 py-2 border-r border-slate-200 font-mono font-bold text-slate-900 bg-[#f2f2f2] cursor-pointer hover:bg-slate-300"
                            onClick={() => handleCellClick(rowNum, 'PD', String(presentDays), 'Total Days Present')}
                          >
                            {presentDays}
                          </td>

                          {/* Summary: No of days Leave */}
                          <td
                            className="px-2 py-2 border-r border-slate-200 font-mono font-bold text-slate-900 bg-[#f2f2f2] cursor-pointer hover:bg-slate-300"
                            onClick={() => handleCellClick(rowNum, 'LD', String(leaveDays), 'Total Days on Leave')}
                          >
                            {leaveDays}
                          </td>

                          {/* Summary: Attendance % */}
                          <td
                            className={`px-2.5 py-2 font-mono font-black bg-[#f2f2f2] cursor-pointer hover:bg-slate-300 ${
                              isLowAtt ? 'text-[#c00000] bg-rose-50' : 'text-slate-900'
                            }`}
                            onClick={() => handleCellClick(rowNum, 'AP', `${attPct}%`, 'Attendance Percentage')}
                          >
                            {attPct}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Spreadsheet Footer Toolbar */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Full Attendance Register for {months.find((m) => m.value === selectedMonth)?.name} {selectedYear}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Spreadsheet (.xlsx)</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* 📋 DAILY PUNCH LOGS REPORT VIEW                                         */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {reportView === 'daily_logs' && (
        <Card title="Detailed Attendance Punch History" className="bg-white">
          <div className="overflow-x-auto my-2">
            <Table
              data={reportData}
              keyExtractor={(r) => r.id || `${r.employeeCode}_${r.date}`}
              columns={[
                { header: 'Employee Code', render: (r: any) => <span className="font-bold text-slate-800">{r.employeeCode}</span> },
                { header: 'Employee Name', render: (r: any) => <span className="font-semibold text-slate-700">{r.employeeName}</span> },
                { header: 'Date', render: (r: any) => <span>{r.date}</span> },
                { header: 'Login Time', render: (r: any) => <span className="font-mono font-bold text-slate-800">{r.loginTime}</span> },
                { header: 'Login GPS', render: (r: any) => <span className="text-xs text-slate-500">{r.loginDistance}</span> },
                { header: 'Logout Time', render: (r: any) => <span className="font-mono">{r.logoutTime}</span> },
                { header: 'Working Hours', render: (r: any) => <span className="font-bold text-slate-800">{r.workingHours}</span> },
                {
                  header: 'Status',
                  render: (r: any) => {
                    if (r.timingStatus === 'LEAVE' || r.displayStatus === 'Leave') {
                      return <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600 border border-rose-200">Leave</span>;
                    }
                    if (r.timingStatus === 'PERMISSION' || r.displayStatus === 'Permission') {
                      return <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600 border border-indigo-200">Permission</span>;
                    }
                    if (r.timingStatus === 'LATE' || r.displayStatus === 'Late') {
                      return <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">Late</span>;
                    }
                    return <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-200">Present</span>;
                  },
                },
              ]}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default Reports;
