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
  Award,
  Edit,
  User,
  Mail,
  Phone,
  Shield,
  X,
  Save,
  Wand2,
  CheckCheck,
  FileEdit,
  CalendarClock
} from 'lucide-react';

const Reports: React.FC = () => {
  // Report Views: 'leave_balance_sheet' (Exact leave report) | 'monthly_excel' (2-Tier Spreadsheet) | 'daily_logs' | 'kpi_report'
  const [reportView, setReportView] = useState<'leave_balance_sheet' | 'monthly_excel' | 'daily_logs' | 'kpi_report'>('leave_balance_sheet');

  // KPI Inspection State
  const [kpiEmployees, setKpiEmployees] = useState<any[]>([]);
  const [selectedKpiEmpId, setSelectedKpiEmpId] = useState<string>('');
  const [employeeKpiDetail, setEmployeeKpiDetail] = useState<any | null>(null);
  const [kpiLoading, setKpiLoading] = useState<boolean>(false);

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

  // ── Edit Employee Monthly Attendance Sheet (P, AB, HD, WO, CL, SL, Late, Perm, WFH) ──
  const [editingSheetEmployee, setEditingSheetEmployee] = useState<any | null>(null);
  const [sheetDaysState, setSheetDaysState] = useState<Record<number, { code: string; loginTime?: string; logoutTime?: string }>>({});
  const [sheetSaveLoading, setSheetSaveLoading] = useState(false);
  const [sheetMessage, setSheetMessage] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // ── Quick Single Day Cell Attendance Editor ──
  const [editingDayCell, setEditingDayCell] = useState<{
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    dayNum: number;
    dateLabel: string;
    dateStr: string;
    code: string;
    loginTime: string;
    logoutTime: string;
  } | null>(null);
  const [daySaveLoading, setDaySaveLoading] = useState(false);
  const [daySaveMessage, setDaySaveMessage] = useState<string | null>(null);

  // ── Edit Employee Profile Details State & Handlers ──
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    employeeCode: '',
    email: '',
    phone: '',
    department: 'IT',
    role: 'EMPLOYEE',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const handleOpenEditEmployee = (emp: any) => {
    setEditingEmployee(emp);
    setEditMessage(null);
    setEditError(null);
    setEditForm({
      name: emp.employeeName || emp.name || '',
      employeeCode: emp.employeeCode || emp.code || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || 'IT',
      role: emp.role || 'EMPLOYEE',
      status: (emp.status as any) || 'ACTIVE',
    });
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    const empId = editingEmployee.employeeId || editingEmployee.id;
    if (!empId) {
      setEditError('Employee ID not found.');
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      await employeeService.update(Number(empId), {
        name: editForm.name,
        employeeCode: editForm.employeeCode,
        email: editForm.email,
        phone: editForm.phone,
        department: editForm.department,
        role: editForm.role as any,
        status: editForm.status,
      });

      setEditMessage('Employee details updated successfully!');
      await Promise.all([fetchFilters(), fetchMonthlyData(), runDailyReport()]);

      setTimeout(() => {
        setEditingEmployee(null);
        setEditMessage(null);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to update employee details', err);
      setEditError(err.response?.data?.error || err.message || 'Failed to update employee details.');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Handlers for Employee Monthly Attendance Sheet Editor (P, AB, HD, WO, CL, SL, Late, Perm, WFH) ──
  const handleOpenEditAttendanceSheet = (emp: any) => {
    setEditingSheetEmployee(emp);
    setSheetMessage(null);
    setSheetError(null);

    const daysInit: Record<number, { code: string; loginTime?: string; logoutTime?: string }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const existingCell = emp.days?.[String(d)];
      const satObj = saturdaysInMonth.find((s) => s.dayNum === d);
      const isSatLeave = satObj?.isLeave;
      const isSun = new Date(selectedYear, selectedMonth - 1, d).getDay() === 0;

      let defaultCode = '--';
      if (existingCell?.code && existingCell.code !== '--') {
        defaultCode = existingCell.code;
      } else if (isSun || isSatLeave) {
        defaultCode = 'WO';
      }

      daysInit[d] = {
        code: defaultCode,
        loginTime: existingCell?.loginTime && existingCell.loginTime !== '--' ? existingCell.loginTime : (emp.department === 'IT' ? '09:00' : '08:45'),
        logoutTime: existingCell?.logoutTime && existingCell.logoutTime !== '--' ? existingCell.logoutTime : '18:30',
      };
    }
    setSheetDaysState(daysInit);
  };

  const handleSetDayStatus = (dayNum: number, code: string) => {
    setSheetDaysState((prev) => ({
      ...prev,
      [dayNum]: {
        ...(prev[dayNum] || { loginTime: '09:00', logoutTime: '18:30' }),
        code,
      },
    }));
  };

  const handleBulkSetSheet = (targetCode: string, weekdaysOnly = true) => {
    setSheetDaysState((prev) => {
      const next = { ...prev };
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(selectedYear, selectedMonth - 1, d);
        const isSun = dt.getDay() === 0;
        const satObj = saturdaysInMonth.find((s) => s.dayNum === d);
        const isSatOff = satObj?.isLeave;

        if (weekdaysOnly && (isSun || isSatOff)) {
          next[d] = { ...(next[d] || { loginTime: '09:00', logoutTime: '18:30' }), code: 'WO' };
        } else {
          next[d] = { ...(next[d] || { loginTime: '09:00', logoutTime: '18:30' }), code: targetCode };
        }
      }
      return next;
    });
  };

  const handleSaveAttendanceSheet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingSheetEmployee) return;
    const empId = editingSheetEmployee.employeeId || editingSheetEmployee.id;
    if (!empId) {
      setSheetError('Employee ID not found.');
      return;
    }

    setSheetSaveLoading(true);
    setSheetError(null);
    setSheetMessage(null);

    try {
      await adminService.updateMonthlyAttendanceBatch({
        employeeId: Number(empId),
        year: selectedYear,
        month: selectedMonth,
        days: sheetDaysState,
      });

      setSheetMessage('Attendance sheet updated successfully!');
      await fetchMonthlyData();

      setTimeout(() => {
        setEditingSheetEmployee(null);
        setSheetMessage(null);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save attendance sheet', err);
      setSheetError(err.response?.data?.message || err.message || 'Failed to update attendance sheet.');
    } finally {
      setSheetSaveLoading(false);
    }
  };

  // ── Quick Day Cell Editor Handlers ──
  const handleOpenEditDayCell = (emp: any, dayNum: number, dateLabel: string) => {
    const dayCell = emp.days?.[String(dayNum)];
    const satObj = saturdaysInMonth.find((s) => s.dayNum === dayNum);
    const isSatLeave = satObj?.isLeave;
    const isSun = new Date(selectedYear, selectedMonth - 1, dayNum).getDay() === 0;
    const initialCode = dayCell?.code || (isSun || isSatLeave ? 'WO' : '--');

    const mStr = String(selectedMonth).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    const dateStr = `${selectedYear}-${mStr}-${dStr}`;

    setEditingDayCell({
      employeeId: Number(emp.employeeId || emp.id),
      employeeName: emp.employeeName || emp.name || 'Employee',
      employeeCode: emp.employeeCode || emp.code || '',
      dayNum,
      dateLabel,
      dateStr,
      code: initialCode,
      loginTime: dayCell?.loginTime && dayCell.loginTime !== '--' ? dayCell.loginTime : (emp.department === 'IT' ? '09:00' : '08:45'),
      logoutTime: dayCell?.logoutTime && dayCell.logoutTime !== '--' ? dayCell.logoutTime : '18:30',
    });
    setDaySaveMessage(null);
  };

  const handleSaveDayCell = async (newCode: string, inTime?: string, outTime?: string) => {
    if (!editingDayCell) return;
    setDaySaveLoading(true);
    setDaySaveMessage(null);

    try {
      await adminService.updateMonthlyAttendanceDay({
        employeeId: editingDayCell.employeeId,
        date: editingDayCell.dateStr,
        code: newCode,
        loginTime: inTime || editingDayCell.loginTime,
        logoutTime: outTime || editingDayCell.logoutTime,
      });

      setDaySaveMessage(`Updated to ${newCode}!`);
      await fetchMonthlyData();

      setTimeout(() => {
        setEditingDayCell(null);
        setDaySaveMessage(null);
      }, 700);
    } catch (err: any) {
      console.error('Failed to update day attendance', err);
      alert('Failed to update day attendance: ' + (err.response?.data?.message || err.message));
    } finally {
      setDaySaveLoading(false);
    }
  };

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
      setEmployees(data.filter((e) => e.role !== 'ADMIN'));
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

  // Fetch KPI Employees List
  const fetchKpiEmployees = useCallback(async () => {
    try {
      setKpiLoading(true);
      const res = await adminService.getEmployeesKpi(selectedYear, selectedMonth);
      if (res && res.employees) {
        setKpiEmployees(res.employees);
        if (!selectedKpiEmpId && res.employees.length > 0) {
          setSelectedKpiEmpId(String(res.employees[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load KPI employees', err);
    } finally {
      setKpiLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedKpiEmpId]);

  useEffect(() => {
    if (reportView === 'kpi_report') {
      fetchKpiEmployees();
    }
  }, [reportView, fetchKpiEmployees]);

  // Fetch Selected Employee KPI Detail
  const fetchEmployeeKpiDetail = useCallback(async (empId: number) => {
    try {
      setKpiLoading(true);
      const res = await adminService.getEmployeeKpiDetail(empId, selectedYear, selectedMonth);
      setEmployeeKpiDetail(res);
    } catch (err) {
      console.error('Failed to load employee KPI detail', err);
    } finally {
      setKpiLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (reportView === 'kpi_report' && selectedKpiEmpId) {
      fetchEmployeeKpiDetail(Number(selectedKpiEmpId));
    }
  }, [reportView, selectedKpiEmpId, fetchEmployeeKpiDetail]);

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
    const empName = (emp.employeeName || emp.name || '').toLowerCase();
    const empCode = (emp.employeeCode || emp.code || '').toLowerCase();
    const matchesSearch = !q || empName.includes(q) || empCode.includes(q);

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
      {/* ── Top Page Header Banner (Sleek & Compact) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white shadow-lg border border-slate-800/80">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 h-36 w-36 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Attendance Reports & Excel Register Sheet
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                <FileSpreadsheet className="h-3 w-3 text-emerald-400" />
                Register & Policy
              </span>
            </div>
            <p className="text-xs text-slate-300 font-normal leading-relaxed">
              Standard 2-tier monthly attendance register spreadsheet with login timings, Saturday working policy, and direct <strong>.xlsx Excel</strong> download.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/15 text-xs font-bold text-white">
              <button
                onClick={() => setReportView('leave_balance_sheet')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  reportView === 'leave_balance_sheet'
                    ? 'bg-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-400/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Leave Balance Report</span>
              </button>

              <button
                onClick={() => setReportView('monthly_excel')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  reportView === 'monthly_excel'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Monthly Register (2-Tier)</span>
              </button>

              <button
                onClick={() => setReportView('daily_logs')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  reportView === 'daily_logs'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Punch Logs</span>
              </button>

              <button
                onClick={() => setReportView('kpi_report')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  reportView === 'kpi_report'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>Employee KPI Inspector</span>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-500 hover:from-cyan-300 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-400/20 transition-all cursor-pointer active:scale-95"
            >
              <Download className="h-3.5 w-3.5 stroke-[2.5]" />
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
                      className="px-3 py-2 border-r border-slate-700 bg-black text-white font-extrabold min-w-[85px] leading-tight cursor-pointer"
                      onClick={() => handleCellClick('1', 'AP', 'Attendance %', 'Total Attendance Percentage')}
                    >
                      Attendance<br />%
                    </th>
                    <th className="px-3 py-2 bg-[#2d3748] text-white font-extrabold min-w-[75px] leading-tight text-center">
                      Action
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
                    <th className="px-2 py-1.5 border-r border-slate-700 bg-black text-white text-[10px] font-bold">
                      %
                    </th>
                    <th className="px-2 py-1.5 bg-[#2d3748] text-white text-[10px] font-bold text-center">
                      Edit
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMonthlyEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={daysInMonth + 8} className="py-12 text-center text-slate-400 font-semibold">
                        No employee records found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMonthlyEmployees.map((emp: any, rowIndex: number) => {
                      const empName = emp.employeeName || emp.name || 'Employee';
                      const empCode = emp.employeeCode || emp.code || `EMP-${emp.employeeId || emp.id}`;
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
                          key={emp.employeeId || emp.employeeCode || rowIndex}
                          className="border-b border-slate-200 hover:bg-indigo-50/20 transition-colors"
                        >
                          {/* Login Time Column (8.45 / 9.00) */}
                          <td
                            className="px-2.5 py-2 border-r border-slate-200 font-mono font-bold text-slate-800 bg-white cursor-pointer hover:bg-indigo-100"
                            onClick={() => handleCellClick(rowNum, 'A', loginTime, `${empName} scheduled login time`)}
                          >
                            {loginTime}
                          </td>

                          {/* Employee Code */}
                          <td
                            className="px-2.5 py-2 border-r border-slate-200 font-mono font-bold text-left text-slate-700 bg-white cursor-pointer hover:bg-indigo-100 truncate max-w-[90px]"
                            onClick={() => handleCellClick(rowNum, 'B', empCode, `Employee Code`)}
                          >
                            {empCode}
                          </td>

                          {/* Employee Name */}
                          <td
                            className="px-3 py-2 border-r border-slate-200 text-left bg-white min-w-[150px] max-w-[190px]"
                          >
                            <div className="flex items-center justify-between gap-1.5 group">
                              <div
                                className="cursor-pointer truncate flex-1"
                                onClick={() => handleCellClick(rowNum, 'C', empName, `Employee Name (${emp.department || 'IT'})`)}
                                title={`${empName} (${emp.department || 'IT'})`}
                              >
                                <span className="font-bold text-slate-800 hover:text-indigo-600 transition-colors block truncate">
                                  {empName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal block truncate">
                                  {emp.department || 'General'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditEmployee(emp);
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title={`Edit ${empName}'s Details`}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                            </div>
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
                                key={`cell-${emp.employeeId || rowIndex}-${dh.dayNum}`}
                                className={`px-1 py-2 border-r border-slate-200 cursor-pointer transition-all hover:ring-2 hover:ring-indigo-500 hover:z-10 relative group ${cellStyle}`}
                                onClick={() => {
                                  handleCellClick(
                                    rowNum,
                                    String(dh.dayNum),
                                    cellValue,
                                    `${empName} on ${dh.dateLabel}: ${dayCell?.status || cellValue} (In: ${dayCell?.loginTime || '--'}, Out: ${dayCell?.logoutTime || '--'})`
                                  );
                                  handleOpenEditDayCell(emp, dh.dayNum, dh.dateLabel);
                                }}
                                title={`Click to edit ${empName} status on ${dh.dateLabel} (Current: ${cellValue})`}
                              >
                                <span>{cellValue}</span>
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
                            className={`px-2.5 py-2 border-r border-slate-200 font-mono font-black bg-[#f2f2f2] cursor-pointer hover:bg-slate-300 ${
                              isLowAtt ? 'text-[#c00000] bg-rose-50' : 'text-slate-900'
                            }`}
                            onClick={() => handleCellClick(rowNum, 'AP', `${attPct}%`, 'Attendance Percentage')}
                          >
                            {attPct}%
                          </td>

                          {/* Action Column - Edit Attendance Sheet & Details Buttons */}
                          <td className="px-2 py-2 text-center bg-white min-w-[110px]">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditAttendanceSheet(emp)}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                                title={`Edit full monthly attendance sheet (P, AB, HD, Leave, etc.) for ${empName}`}
                              >
                                <CalendarClock className="h-3 w-3" />
                                <span>Edit Sheet</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditEmployee(emp)}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-bold rounded-lg text-[10px] border border-slate-200 transition-all cursor-pointer"
                                title={`Edit ${empName} profile & department`}
                              >
                                <User className="h-3 w-3" />
                              </button>
                            </div>
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
                {
                  header: 'Action',
                  render: (r: any) => {
                    const empObj = employees.find((e) => e.id === r.employeeId || e.employeeCode === r.employeeCode) || {
                      id: r.employeeId,
                      employeeId: r.employeeId,
                      employeeCode: r.employeeCode,
                      employeeName: r.employeeName || r.name,
                      name: r.employeeName || r.name,
                      department: r.department,
                    };
                    return (
                      <button
                        type="button"
                        onClick={() => handleOpenEditEmployee(empObj)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Edit Employee Details"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    );
                  },
                },
              ]}
            />
          </div>
        </Card>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* 🏆 EMPLOYEE KPI & WORK PLAN PERFORMANCE INSPECTOR VIEW                   */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {reportView === 'kpi_report' && (
        <div className="space-y-6">
          {/* Controls: Employee Selector & Month/Year */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span>Employee Monthly KPI & Work Plan Inspector</span>
              </h2>
              <p className="text-xs text-slate-500">
                Select an employee to inspect their daily work plans, completion rate, and KPI performance
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Employee Select */}
              <div className="min-w-[220px]">
                <select
                  value={selectedKpiEmpId}
                  onChange={(e) => setSelectedKpiEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Select Employee --</option>
                  {kpiEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode}) - {emp.kpiScore}% KPI
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Picker */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>

              {/* Year Picker */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  fetchKpiEmployees();
                  if (selectedKpiEmpId) fetchEmployeeKpiDetail(Number(selectedKpiEmpId));
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
                title="Refresh KPI Data"
              >
                <RefreshCw className={`h-4 w-4 ${kpiLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Selected Employee Summary Cards */}
          {employeeKpiDetail && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee</span>
                  <p className="text-base font-black text-slate-800 mt-1 truncate">
                    {employeeKpiDetail.employee?.name}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {employeeKpiDetail.employee?.employeeCode} • {employeeKpiDetail.employee?.department || 'General'}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Average Monthly KPI</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-800">
                      {employeeKpiDetail.summary?.averageKpiScore}%
                    </span>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {employeeKpiDetail.summary?.monthlyLabel}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Tasks Delivered</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {employeeKpiDetail.summary?.totalCompletedTasks} / {employeeKpiDetail.summary?.totalMonthlyTasks}
                  </p>
                  <p className="text-xs text-slate-400">
                    {employeeKpiDetail.summary?.completionRate}% completion rate
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Attendance Present</span>
                  <p className="text-2xl font-black text-blue-700 mt-1">
                    {employeeKpiDetail.summary?.presentDays} days
                  </p>
                  <p className="text-xs text-slate-400">
                    {employeeKpiDetail.summary?.onTimeDays} on-time check-ins
                  </p>
                </div>
              </div>

              {/* Day-by-day Breakdown Table */}
              <Card title={`Daily Work Plan & KPI History for ${months.find((m) => m.value === selectedMonth)?.name} ${selectedYear}`} className="bg-white">
                <div className="overflow-x-auto my-2">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4 w-28">Date</th>
                        <th className="py-3 px-4">Daily Work Plan Tasks</th>
                        <th className="py-3 px-4 text-center w-28">Tasks (Done/Total)</th>
                        <th className="py-3 px-4 text-center w-28">Attendance</th>
                        <th className="py-3 px-4 text-center w-28">Daily KPI</th>
                        <th className="py-3 px-4">Employee Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(employeeKpiDetail.dailyBreakdown || []).map((day: any) => {
                        const dayDate = new Date(day.date);
                        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                        const isWeekend = dayName === 'Sun' || dayName === 'Sat';
                        const hasTasks = day.totalTasks > 0;

                        return (
                          <tr key={day.date} className={`hover:bg-slate-50 ${isWeekend ? 'bg-slate-50/50' : ''}`}>
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              <div>{day.date}</div>
                              <span className="text-[10px] text-slate-400 font-normal">{dayName}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              {day.plans.length === 0 ? (
                                <span className="text-slate-400 italic text-[11px]">No planned tasks</span>
                              ) : (
                                <div className="space-y-1">
                                  {day.plans.map((p: any, idx: number) => (
                                    <div key={p.id || idx} className="flex items-center gap-1.5 text-[11px]">
                                      <span>{p.status === 'COMPLETED' ? '✅' : p.status === 'IN_PROGRESS' ? '🟡' : '🔴'}</span>
                                      <span className="font-semibold text-slate-800">{p.taskName}</span>
                                      {p.timeSpent && <span className="text-blue-600 font-bold">({p.timeSpent})</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                              {hasTasks ? (
                                <span>
                                  <strong className="text-emerald-600">{day.completedCount}</strong> / {day.totalTasks}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {day.attendance ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  {day.attendance.timingStatus || 'PRESENT'}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">{isWeekend ? 'Weekend' : '—'}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {hasTasks || (day.note && day.note.kpiScore !== null) ? (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {day.kpiScore}%
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 italic text-[11px]">
                              {day.note?.notes || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ✏️ EDIT EMPLOYEE DETAILS MODAL                                            */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Edit Employee Details</h3>
                  <p className="text-xs text-slate-400">
                    ID #{editingEmployee.employeeId || editingEmployee.id} • {editingEmployee.employeeCode || editForm.employeeCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {editMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{editMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Employee Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.employeeCode}
                    onChange={(e) => setEditForm({ ...editForm, employeeCode: e.target.value })}
                    placeholder="e.g. ECLCE2016"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="IT">IT Team</option>
                    <option value="EDTECH">EdTech Team</option>
                    <option value="BUSINESS_SOLUTION">Business Solution</option>
                    <option value="OG_TEAM">OG Team</option>
                    <option value="HR">HR Department</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="OPERATIONS">Operations</option>
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="employee@company.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="TEAM_LEAD">Team Lead</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">Admin</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  disabled={editLoading}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {editLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* 📅 EDIT EMPLOYEE MONTHLY ATTENDANCE REGISTER MODAL (P, AB, HD, WO, etc.) */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {editingSheetEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span>Edit Attendance Register Sheet</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-700 font-mono">
                      {months.find((m) => m.value === selectedMonth)?.name} {selectedYear}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingSheetEmployee.employeeName || editingSheetEmployee.name} ({editingSheetEmployee.employeeCode}) • {editingSheetEmployee.department || 'IT'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSheetEmployee(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Bulk Preset Toolbar */}
            <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                <Wand2 className="h-4 w-4 text-indigo-600" />
                <span>Bulk Fast Actions:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBulkSetSheet('P', true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Set all Monday-Friday to Present (P), keep weekends as Week Off (WO)"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark Weekdays Present (P)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSetSheet('WO', false)}
                  className="px-2.5 py-1 rounded-lg bg-[#fce4d6] text-[#c65911] hover:bg-[#f8cbad] border border-[#f4b084] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Mark standard Sunday/Saturday week offs"
                >
                  <Coffee className="h-3.5 w-3.5" />
                  <span>Standard Week Offs (WO)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSetSheet('--', false)}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reset All to Absent (AB)</span>
                </button>
              </div>
            </div>

            {/* Feedback Notifications */}
            {sheetError && (
              <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{sheetError}</span>
              </div>
            )}
            {sheetMessage && (
              <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{sheetMessage}</span>
              </div>
            )}

            {/* Day Matrix Grid */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              <div className="text-xs text-slate-500 font-medium">
                Click any status pill below for each day of {months.find((m) => m.value === selectedMonth)?.name} to update status (<strong className="text-slate-700">P, AB, WO, HD, CL, SL, Late, Perm, WFH</strong>):
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dt = new Date(selectedYear, selectedMonth - 1, dayNum);
                  const dow = dt.toLocaleDateString('en-US', { weekday: 'short' });
                  const isSun = dt.getDay() === 0;
                  const satObj = saturdaysInMonth.find((s) => s.dayNum === dayNum);
                  const isSatLeave = satObj?.isLeave;

                  const currentDayObj = sheetDaysState[dayNum] || { code: '--', loginTime: '09:00', logoutTime: '18:30' };
                  const curCode = currentDayObj.code;

                  return (
                    <div
                      key={`edit-day-${dayNum}`}
                      className={`p-3 rounded-2xl border transition-all ${
                        isSun || isSatLeave
                          ? 'bg-[#fce4d6]/30 border-[#f4b084]/60'
                          : curCode === 'P'
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : curCode === 'HD'
                          ? 'bg-[#fff2cc]/40 border-[#ffe699]'
                          : curCode === 'CL' || curCode === 'SL' || curCode === 'Leave'
                          ? 'bg-amber-50/50 border-amber-200'
                          : curCode === 'AB' || curCode === '--'
                          ? 'bg-rose-50/30 border-rose-200/80'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Day Title */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-slate-800 font-mono">
                            {String(dayNum).padStart(2, '0')}
                          </span>
                          <span className={`text-xs font-bold ${isSun ? 'text-[#c65911]' : 'text-slate-500'}`}>
                            ({dow})
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            curCode === 'P'
                              ? 'bg-emerald-600 text-white'
                              : curCode === 'AB' || curCode === '--'
                              ? 'bg-rose-600 text-white'
                              : curCode === 'WO'
                              ? 'bg-[#fce4d6] text-[#c65911] border border-[#f4b084]'
                              : curCode === 'HD'
                              ? 'bg-[#fff2cc] text-[#7030a0] border border-[#ffe699]'
                              : curCode === 'CL' || curCode === 'SL'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {curCode === '--' ? 'AB' : curCode}
                        </span>
                      </div>

                      {/* Status Badges Selector */}
                      <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
                        {[
                          { label: 'P', val: 'P', color: 'hover:bg-emerald-100 text-emerald-700', active: 'bg-emerald-600 text-white' },
                          { label: 'AB', val: 'AB', color: 'hover:bg-rose-100 text-rose-700', active: 'bg-rose-600 text-white' },
                          { label: 'WO', val: 'WO', color: 'hover:bg-[#fce4d6] text-[#c65911]', active: 'bg-[#c65911] text-white' },
                          { label: 'HD', val: 'HD', color: 'hover:bg-[#fff2cc] text-[#7030a0]', active: 'bg-[#7030a0] text-white' },
                          { label: 'CL', val: 'CL', color: 'hover:bg-amber-100 text-amber-800', active: 'bg-amber-600 text-white' },
                          { label: 'SL', val: 'SL', color: 'hover:bg-red-100 text-red-800', active: 'bg-red-600 text-white' },
                          { label: 'Late', val: 'Late', color: 'hover:bg-amber-100 text-amber-800', active: 'bg-amber-700 text-white' },
                          { label: 'Perm', val: 'Perm', color: 'hover:bg-indigo-100 text-indigo-800', active: 'bg-indigo-700 text-white' },
                          { label: 'WFH', val: 'WFH', color: 'hover:bg-sky-100 text-sky-800', active: 'bg-sky-600 text-white' },
                        ].map((btn) => {
                          const isSelected = curCode === btn.val || (btn.val === 'AB' && curCode === '--');
                          return (
                            <button
                              key={btn.val}
                              type="button"
                              onClick={() => handleSetDayStatus(dayNum, btn.val)}
                              className={`py-1 rounded-md text-center transition-all cursor-pointer border ${
                                isSelected
                                  ? `${btn.active} border-transparent shadow-xs font-black`
                                  : `bg-white border-slate-200 ${btn.color}`
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500 font-semibold hidden sm:block">
                All changes will be applied to database immediately upon saving.
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setEditingSheetEmployee(null)}
                  disabled={sheetSaveLoading}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendanceSheet}
                  disabled={sheetSaveLoading}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {sheetSaveLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving Register...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Attendance Sheet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ⚡ QUICK SINGLE DAY ATTENDANCE CELL EDITOR MODAL (CLICK ON ANY DAY CELL) */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {editingDayCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Edit Day Attendance</h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    {editingDayCell.employeeName} ({editingDayCell.employeeCode}) • <span className="text-indigo-300 font-bold">{editingDayCell.dateLabel}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDayCell(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {daySaveMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{daySaveMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Attendance Status:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Present (P)', val: 'P', desc: 'On-time present', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300' },
                    { label: 'Absent (AB)', val: 'AB', desc: 'No punch / absent', color: 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300' },
                    { label: 'Week Off (WO)', val: 'WO', desc: 'Scheduled off', color: 'bg-[#fce4d6] hover:bg-[#f8cbad] text-[#c65911] border-[#f4b084]' },
                    { label: 'Holiday (HD)', val: 'HD', desc: 'Company/Special', color: 'bg-[#fff2cc] hover:bg-[#ffe699] text-[#7030a0] border-[#ffe699]' },
                    { label: 'Casual Leave (CL)', val: 'CL', desc: 'Approved casual', color: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300' },
                    { label: 'Sick Leave (SL)', val: 'SL', desc: 'Approved medical', color: 'bg-red-50 hover:bg-red-100 text-red-800 border-red-300' },
                    { label: 'Late Login', val: 'Late', desc: 'Arrived late', color: 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300' },
                    { label: 'Permission (Perm)', val: 'Perm', desc: 'Approved perm', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-300' },
                    { label: 'Work From Home', val: 'WFH', desc: 'Remote working', color: 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300' },
                  ].map((st) => {
                    const isSelected = editingDayCell.code === st.val || (st.val === 'AB' && editingDayCell.code === '--');
                    return (
                      <button
                        key={st.val}
                        type="button"
                        onClick={() => handleSaveDayCell(st.val)}
                        disabled={daySaveLoading}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'ring-2 ring-indigo-600 font-extrabold shadow-sm'
                            : ''
                        } ${st.color}`}
                      >
                        <span className="font-extrabold text-xs">{st.label}</span>
                        <span className="text-[10px] opacity-75">{st.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timing Overrides */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Login Time</label>
                  <input
                    type="time"
                    value={editingDayCell.loginTime}
                    onChange={(e) => setEditingDayCell({ ...editingDayCell, loginTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Logout Time</label>
                  <input
                    type="time"
                    value={editingDayCell.logoutTime}
                    onChange={(e) => setEditingDayCell({ ...editingDayCell, logoutTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDayCell(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveDayCell(editingDayCell.code, editingDayCell.loginTime, editingDayCell.logoutTime)}
                  disabled={daySaveLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {daySaveLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Apply Timings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

