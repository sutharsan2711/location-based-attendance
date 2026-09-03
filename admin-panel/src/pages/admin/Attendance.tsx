import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { adminService } from '../../services/adminService';
import { employeeService } from '../../services/employeeService';
import { Attendance, MonthlyAttendanceData } from '../../types/attendance';
import { Employee } from '../../types/employee';
import { formatDate, formatTime } from '../../utils/dateUtils';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import { holidayService, Holiday } from '../../services/holidayService';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ListFilter,
  Download,
  Clock,
  UserCheck,
  AlertCircle,
  ShieldAlert,
  FileSpreadsheet,
  Sun,
  Coffee,
  Sparkles,
  Check,
} from 'lucide-react';

const Attendance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');

  // ── Daily Tab State ──
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // ── Monthly Tab State ──
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [monthlyEmployeeId, setMonthlyEmployeeId] = useState<string>('');
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendanceData | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState<boolean>(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [satActionLoading, setSatActionLoading] = useState<string | null>(null);

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

  const fetchFiltersData = useCallback(async () => {
    try {
      const employeesData = await employeeService.getAll();
      setEmployees(employeesData.filter((e) => e.role !== 'ADMIN' && !['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005'].includes(e.employeeCode)));
    } catch (err) {
      console.error('Failed to load filter dropdowns', err);
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

  const fetchAttendanceLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await attendanceService.getAllAttendance({
        employeeId: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : undefined,
        status: selectedStatus || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setLogs(data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch attendance logs.');
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, selectedStatus, startDate, endDate]);

  const fetchMonthlyData = useCallback(async () => {
    setMonthlyLoading(true);
    try {
      const data = await adminService.getMonthlyAttendance({
        year: selectedYear,
        month: selectedMonth,
        employeeId: monthlyEmployeeId ? parseInt(monthlyEmployeeId, 10) : undefined,
      });
      setMonthlyData(data);
    } catch (err) {
      console.error('Failed to load monthly attendance', err);
    } finally {
      setMonthlyLoading(false);
    }
  }, [selectedYear, selectedMonth, monthlyEmployeeId]);

  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchAttendanceLogs();
    } else {
      fetchMonthlyData();
    }
  }, [activeTab, fetchAttendanceLogs, fetchMonthlyData]);

  const calculateWorkingHours = (loginTime?: string, logoutTime?: string) => {
    if (!loginTime || !logoutTime) return '--';
    try {
      const start = new Date(loginTime).getTime();
      const end = new Date(logoutTime).getTime();
      const diffMs = end - start;
      if (diffMs <= 0) return '--';
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    } catch {
      return '--';
    }
  };

  const renderStatusBadge = (row: Attendance) => {
    if (row.timingStatus === 'LEAVE') {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-200/60">
          Leave
        </span>
      );
    }
    if (row.timingStatus === 'PERMISSION') {
      return (
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 border border-indigo-200/60">
          Permission
        </span>
      );
    }
    if (row.timingStatus === 'LATE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-300">
          <AlertCircle className="h-3 w-3 text-amber-600" />
          Late
        </span>
      );
    }
    if (row.status === 'LOGGED_IN') {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 border border-blue-200/60">
          Working
        </span>
      );
    }
    if (row.status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-200/60">
          Present
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
        Not Logged In
      </span>
    );
  };

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      log.employee.name.toLowerCase().includes(query) ||
      log.employee.employeeCode.toLowerCase().includes(query) ||
      log.employee.email.toLowerCase().includes(query)
    );
  });

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const columns = [
    {
      header: 'Employee Name',
      render: (row: Attendance) => (
        <div>
          <span className="font-bold text-slate-800 block text-sm">{row.employee.name}</span>
          <span className="text-[10px] text-slate-400 font-medium">{row.employee.email}</span>
        </div>
      ),
    },
    {
      header: 'Employee ID',
      render: (row: Attendance) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {row.employee.employeeCode}
        </span>
      ),
    },
    {
      header: 'Date',
      render: (row: Attendance) => (
        <span className="font-medium text-slate-700">{formatDate(row.attendanceDate)}</span>
      ),
    },
    {
      header: 'Login Time',
      render: (row: Attendance) => (
        <span className="font-mono text-xs text-slate-800">
          {row.loginTime ? formatTime(row.loginTime) : '--'}
        </span>
      ),
    },
    {
      header: 'Logout Time',
      render: (row: Attendance) => (
        <span className="font-mono text-xs text-slate-800">
          {row.logoutTime ? formatTime(row.logoutTime) : '--'}
        </span>
      ),
    },
    {
      header: 'Working Hours',
      render: (row: Attendance) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {calculateWorkingHours(row.loginTime, row.logoutTime)}
        </span>
      ),
    },
    {
      header: 'Distance (In / Out)',
      render: (row: Attendance) => (
        <span className="text-xs text-slate-500">
          {row.loginDistance !== null && row.loginDistance !== undefined
            ? `${row.loginDistance.toFixed(1)}m`
            : '--'}{' '}
          /{' '}
          {row.logoutDistance !== null && row.logoutDistance !== undefined
            ? `${row.logoutDistance.toFixed(1)}m`
            : '--'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row: Attendance) => renderStatusBadge(row),
    },
  ];

  const clearFilters = () => {
    setSelectedEmployeeId('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const getCellColor = (code: string) => {
    switch (code) {
      case 'P':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'L':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold hover:bg-amber-200';
      case 'PR':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
      case 'LV':
        return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
      case 'WO':
        return 'bg-slate-100 text-slate-400 border-slate-200';
      case 'A':
        return 'bg-red-50 text-red-600 border-red-200 font-bold';
      default:
        return 'bg-slate-50/50 text-slate-300 border-transparent';
    }
  };

  // Display Format in Grid: 'excel_register' (User's Excel Sheet format) | 'time' (Login Time) | 'in_out' | 'hours' | 'status'
  const [gridDisplayMode, setGridDisplayMode] = useState<'excel_register' | 'time' | 'in_out' | 'hours' | 'status'>('excel_register');

  const handleExportExcel = () => {
    if (!monthlyData) return;
    import('../../utils/excelExport').then(({ exportMonthlyRegisterToExcel }) => {
      exportMonthlyRegisterToExcel(monthlyData, selectedYear, selectedMonth);
    });
  };

  const exportMonthlyTimeMatrixCSV = () => {
    if (!monthlyData) return;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthAbbr = monthNames[selectedMonth - 1] || 'Mon';

    const dayNames = Array.from({ length: monthlyData.daysInMonth }).map((_, i) => {
      return new Date(selectedYear, selectedMonth - 1, i + 1).toLocaleString('en-US', { weekday: 'short' });
    });
    const dateLabels = Array.from({ length: monthlyData.daysInMonth }).map((_, i) => `${i + 1}-${monthAbbr}`);

    const row1 = ['Login Time', 'Employee Code', 'Employee Name', ...dayNames, 'No .of Working days', 'No. Of Days Present', 'No of days Leave', 'Attendance %'];
    const row2 = ['Login Time', 'Emp ID', 'Employee Name', ...dateLabels, 'Working days', 'Present', 'Leave', '%'];

    const rows = [
      row1,
      row2,
      ...monthlyData.employees.map((emp: any) => {
        const dayValues = Array.from({ length: monthlyData.daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dayDetail = emp.days[String(dayNum)];
          if (!dayDetail) return '--';
          if (dayDetail.isHoliday || dayDetail.code === 'HD') return 'HD';
          if (dayDetail.status === 'Week Off') return 'WO';
          if (dayDetail.code === 'CL') return 'CL';
          if (dayDetail.code === 'SL') return 'SL';
          if (dayDetail.code === 'WFH') return 'WFH';
          if (dayDetail.code === 'Spl Leave') return 'Spl Leave';
          if (dayDetail.code === 'CO') return 'CO';
          if (dayDetail.status === 'Leave' || dayDetail.code === 'LV') return 'Leave';
          if (dayDetail.code === 'P' || dayDetail.status === 'Present') return 'P';
          if (dayDetail.code === 'AB' || dayDetail.status === 'Absent') return 'AB';
          if (dayDetail.status === 'Late') return 'P';
          if (dayDetail.status === 'Permission') return 'P';
          return dayDetail.code || 'P';
        });

        const workingDays = emp.workingDays || (monthlyData as any).workingDays || 25;
        const presentDays = emp.presentDays !== undefined ? emp.presentDays : emp.totalPresent;
        const leaveDays = emp.leaveDays !== undefined ? emp.leaveDays : emp.totalLeave;
        const attPercentage = emp.attendancePercentage !== undefined ? `${emp.attendancePercentage}%` : `${Math.round((presentDays / workingDays) * 100)}%`;
        const loginTime = emp.loginTime || '8.45';

        return [
          loginTime,
          emp.employeeCode,
          emp.employeeName,
          ...dayValues,
          workingDays,
          presentDays,
          leaveDays,
          attPercentage
        ];
      }),
    ];

    const csvContent =
      '\ufeff' + rows.map((e) => e.map((cell) => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Register_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const handleToggleSaturday = async (sat: typeof saturdaysInMonth[0]) => {
    setSatActionLoading(sat.dateStr);
    try {
      if (sat.isLeave && sat.existingHoliday) {
        await holidayService.deleteHoliday(sat.existingHoliday.id);
      } else {
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

  const renderCellContent = (dayDetail: any) => {
    if (!dayDetail) return <span className="text-slate-300">--</span>;

    const { status, code, loginTime, logoutTime, workingHours } = dayDetail;

    if (gridDisplayMode === 'time') {
      if (loginTime && loginTime !== '--') {
        return (
          <div className="flex flex-col items-center">
            <span
              className={`text-[10px] font-mono font-bold leading-tight ${
                status === 'Late'
                  ? 'text-amber-800'
                  : status === 'Permission'
                  ? 'text-indigo-700'
                  : 'text-emerald-800'
              }`}
            >
              {loginTime.replace(' AM', '').replace(' PM', '')}
            </span>
            {status === 'Late' && (
              <span className="text-[8px] font-extrabold text-amber-700 uppercase">Late</span>
            )}
            {status === 'Permission' && (
              <span className="text-[8px] font-extrabold text-indigo-700 uppercase">Perm</span>
            )}
          </div>
        );
      }
      if (status === 'Leave') {
        return <span className="text-[9px] font-bold text-rose-700">Leave</span>;
      }
      if (status === 'Permission') {
        return <span className="text-[9px] font-bold text-indigo-700">Perm</span>;
      }
      if (status === 'Week Off') {
        return <span className="text-[9px] font-bold text-slate-400">WO</span>;
      }
      if (status === 'Absent') {
        return <span className="text-[9px] font-bold text-red-500">A</span>;
      }
      return <span className="text-slate-300">--</span>;
    }

    if (gridDisplayMode === 'in_out') {
      if (loginTime && loginTime !== '--') {
        const inShort = loginTime.replace(' AM', '').replace(' PM', '');
        const outShort = logoutTime && logoutTime !== '--' ? logoutTime.replace(' AM', '').replace(' PM', '') : '--';
        return (
          <span className="text-[9px] font-mono font-bold text-slate-800 whitespace-nowrap">
            {inShort}-{outShort}
          </span>
        );
      }
      if (status === 'Leave') return <span className="text-[9px] font-bold text-rose-700">Leave</span>;
      if (status === 'Week Off') return <span className="text-[9px] font-bold text-slate-400">WO</span>;
      return <span className="text-slate-300">--</span>;
    }

    if (gridDisplayMode === 'hours') {
      if (workingHours && workingHours !== '--') {
        return <span className="text-[10px] font-mono font-bold text-slate-800">{workingHours}</span>;
      }
      return <span className="text-slate-300">--</span>;
    }

    // Default status code
    return (
      <div
        className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-[10px] font-bold border transition-all ${getCellColor(
          code
        )}`}
      >
        {code}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
            Attendance Matrix & Time Grid
          </h1>
          <p className="text-sm text-slate-400">
            View employee check-in times across all days of the month with late & leave status
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'daily'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListFilter className="h-4 w-4" />
            Daily Table View
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'monthly'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Date-as-Columns Time Grid
          </button>
        </div>
      </div>

      {/* ════════════════ TAB 1: DAILY TABLE VIEW ════════════════ */}
      {activeTab === 'daily' && (
        <div className="space-y-6 animate-slide">
          {/* Filters Bar */}
          <Card className="p-4 bg-white border-slate-100">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Employee
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none bg-white text-slate-700"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none bg-white text-slate-700"
                >
                  <option value="">All Statuses</option>
                  <option value="LOGGED_IN">LOGGED_IN</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none text-slate-700 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none text-slate-700 bg-white"
                />
              </div>

              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full p-2.5 font-bold"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </Card>

          {/* Search Input & Refresh */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search employee name, code, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-xs outline-none focus:border-primary-500 bg-white"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchAttendanceLogs} className="py-2.5 px-4">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>

          {/* Attendance Table */}
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <Table
                  data={currentLogs}
                  columns={columns}
                  keyExtractor={(row) => row.id}
                  loading={loading}
                  emptyMessage="No matching attendance records found."
                />
              </Card>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100/50 pt-4 px-2">
                  <span className="text-xs text-slate-400">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of{' '}
                    {totalItems} entries
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className="px-2 py-1.5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Button
                        key={i}
                        variant={currentPage === i + 1 ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(i + 1)}
                        className="w-8 h-8 rounded-lg text-xs"
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className="px-2 py-1.5"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ TAB 2: MONTHLY ATTENDANCE GRID VIEW (DATE AS COLUMNS) ════════════════ */}
      {activeTab === 'monthly' && (
        <div className="space-y-6 animate-slide">
          {/* ── 🏢 SATURDAY WORKING DAY & LEAVE CONTROLLER BAR ── */}
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
                  <span className="text-emerald-400 font-bold">
                    {saturdaysInMonth.filter((s) => !s.isLeave).length} Working
                  </span>{' '}
                  &{' '}
                  <span className="text-amber-300 font-bold">
                    {saturdaysInMonth.filter((s) => s.isLeave).length} Leave / Off
                  </span>.
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

          {/* Controls Bar */}
          <Card className="p-4 bg-white border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Month Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none bg-white text-slate-700"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none bg-white text-slate-700"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employee Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Employee Filter
                  </label>
                  <select
                    value={monthlyEmployeeId}
                    onChange={(e) => setMonthlyEmployeeId(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none bg-white text-slate-700"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Display Value Switcher */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    View Format
                  </label>
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      onClick={() => setGridDisplayMode('excel_register')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        gridDisplayMode === 'excel_register'
                          ? 'bg-[#107c41] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📑 Excel Register (P/AB Sheet)
                    </button>
                    <button
                      onClick={() => setGridDisplayMode('time')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        gridDisplayMode === 'time'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🕒 Login Time
                    </button>
                    <button
                      onClick={() => setGridDisplayMode('in_out')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        gridDisplayMode === 'in_out'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      In - Out
                    </button>
                    <button
                      onClick={() => setGridDisplayMode('hours')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        gridDisplayMode === 'hours'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Hours
                    </button>
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExportExcel}
                  className="font-bold py-2.5 px-4 rounded-xl bg-[#107c41] hover:bg-[#0b5e31] text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Download Excel Sheet (.xlsx)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportMonthlyTimeMatrixCSV}
                  className="font-bold py-2.5 px-3.5 rounded-xl border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-4 w-4" /> CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchMonthlyData}
                  className="py-2.5 px-3 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Monthly Matrix Grid */}
          {monthlyLoading ? (
            <Loading fullScreen={false} message="Loading monthly attendance register..." />
          ) : !monthlyData || monthlyData.employees.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">
              No employee records found for {months.find((m) => m.value === selectedMonth)?.name}{' '}
              {selectedYear}.
            </Card>
          ) : (
            <div className="rounded-2xl border border-slate-300 bg-white overflow-hidden shadow-xl font-sans">
              {/* Top Excel Green Bar */}
              <div className="bg-[#107c41] text-white px-5 py-3 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-sm font-extrabold tracking-wide">
                  <FileSpreadsheet className="h-4 w-4" /> {months.find((m) => m.value === selectedMonth)?.name} {selectedYear} — Monthly Attendance Register Spreadsheet
                </span>
                <span className="text-[11px] bg-emerald-900/60 border border-white/20 px-3 py-1 rounded-full font-mono font-bold">
                  {monthlyData.employees.length} Employees • {monthlyData.daysInMonth} Days
                </span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse border border-slate-400 min-w-[1300px]">
                  {/* TWO-TIER HEADER (Exact match to image) */}
                  <thead className="sticky top-0 z-20 select-none">
                    {/* Tier 1: Day of Week (Grey Background) */}
                    <tr className="bg-[#7f7f7f] text-white text-center text-[11px] font-bold border-b border-slate-400">
                      <th className="p-2.5 sticky left-0 bg-[#595959] z-30 min-w-[90px] border-r border-slate-400 text-center font-bold">
                        Login Time
                      </th>
                      <th className="p-2.5 sticky left-[90px] bg-[#595959] z-30 min-w-[170px] border-r border-slate-400 text-left font-bold pl-3">
                        Employee
                      </th>
                      {Array.from({ length: monthlyData.daysInMonth }).map((_, i) => {
                        const dt = new Date(selectedYear, selectedMonth - 1, i + 1);
                        const dayOfWeek = dt.toLocaleString('en-US', { weekday: 'short' });
                        const isSunday = dt.getDay() === 0;
                        const isSaturday = dt.getDay() === 6;

                        return (
                          <th
                            key={`dow-${i + 1}`}
                            className={`p-1.5 text-center border-r border-slate-400 min-w-[48px] font-bold text-[11px] ${
                              isSunday || isSaturday ? 'bg-[#595959] text-amber-200' : 'bg-[#7f7f7f]'
                            }`}
                          >
                            {dayOfWeek}
                          </th>
                        );
                      })}
                      {/* Summary Headers (Dark Black / Navy) */}
                      <th className="p-2 text-center bg-[#000000] text-white font-bold min-w-[70px] border-r border-slate-400 text-[10px] leading-tight">
                        No .of<br />Working days
                      </th>
                      <th className="p-2 text-center bg-[#000000] text-white font-bold min-w-[70px] border-r border-slate-400 text-[10px] leading-tight">
                        No. Of<br />Days Present
                      </th>
                      <th className="p-2 text-center bg-[#000000] text-white font-bold min-w-[70px] border-r border-slate-400 text-[10px] leading-tight">
                        No of<br />days Leave
                      </th>
                      <th className="p-2 text-center bg-[#000000] text-white font-bold min-w-[75px] text-[10px] leading-tight">
                        Attendance<br />%
                      </th>
                    </tr>

                    {/* Tier 2: Date Number (Green Background #a9d08e) */}
                    <tr className="bg-[#a9d08e] text-slate-950 text-center text-[11px] font-extrabold border-b-2 border-slate-500">
                      <th className="p-2 sticky left-0 bg-[#a9d08e] z-30 border-r border-slate-400 text-center text-[10px] font-mono">
                        Time
                      </th>
                      <th className="p-2 sticky left-[90px] bg-[#a9d08e] z-30 border-r border-slate-400 text-left pl-3 text-[10px]">
                        ID & Name
                      </th>
                      {Array.from({ length: monthlyData.daysInMonth }).map((_, i) => {
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const monthAbbr = monthNames[selectedMonth - 1] || 'Mon';

                        return (
                          <th
                            key={`date-${i + 1}`}
                            className="p-1 text-center border-r border-slate-400 min-w-[48px] text-[10px] font-bold font-mono text-slate-950"
                          >
                            {i + 1}-{monthAbbr}
                          </th>
                        );
                      })}
                      <th className="p-1 text-center bg-[#1f2937] text-white border-r border-slate-400 text-[9px] font-mono">Total</th>
                      <th className="p-1 text-center bg-[#1f2937] text-white border-r border-slate-400 text-[9px] font-mono">P</th>
                      <th className="p-1 text-center bg-[#1f2937] text-white border-r border-slate-400 text-[9px] font-mono">L</th>
                      <th className="p-1 text-center bg-[#1f2937] text-white text-[9px] font-mono">%</th>
                    </tr>
                  </thead>

                  {/* Table Body (Data Rows with Weekend Peach #f8cbad and Status Badges) */}
                  <tbody className="divide-y divide-slate-300 bg-white font-mono text-xs">
                    {monthlyData.employees.map((emp: any) => {
                      const workingDays = emp.workingDays || (monthlyData as any).workingDays || 25;
                      const presentDays = emp.presentDays !== undefined ? emp.presentDays : emp.totalPresent;
                      const leaveDays = emp.leaveDays !== undefined ? emp.leaveDays : emp.totalLeave;
                      const attPct = emp.attendancePercentage !== undefined ? emp.attendancePercentage : Math.round((presentDays / workingDays) * 100);
                      const isLowAttendance = attPct < 75;

                      return (
                        <tr key={emp.employeeId} className="hover:bg-blue-50/70 transition-colors border-b border-slate-300">
                          {/* Login Time Col (Col 1) */}
                          <td className="p-2 sticky left-0 bg-white z-10 border-r border-slate-400 text-center font-bold text-slate-800 text-[11px] shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
                            {emp.loginTime || '8.45'}
                          </td>

                          {/* Employee Name + Code (Col 2) */}
                          <td className="p-2.5 sticky left-[90px] bg-white z-10 border-r border-slate-400 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                            <span className="font-bold text-slate-900 block text-xs truncate max-w-[150px] font-sans">
                              {emp.employeeName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-medium">
                              {emp.employeeCode}
                            </span>
                          </td>

                          {/* Day Columns (P, AB, Spl Leave, WO, etc.) */}
                          {Array.from({ length: monthlyData.daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const dayDetail = emp.days[String(dayNum)];
                            const dt = new Date(selectedYear, selectedMonth - 1, dayNum);
                            const isSunday = dt.getDay() === 0;
                            const isSaturday = dt.getDay() === 6;
                            const isWeekend = isSunday || isSaturday;
                            const isMidMonthRange = dayNum >= 25 && dayNum <= 28;

                            // Determine Background
                            let cellBg = '';
                            if (isWeekend) {
                              cellBg = 'bg-[#f8cbad] text-slate-800'; // Peach / Orange weekend column
                            } else if (isMidMonthRange) {
                              cellBg = 'bg-[#fff2cc] text-slate-900'; // Soft yellow mid-month highlight
                            }

                            // Render depending on mode
                            let cellDisplay = '--';
                            let cellColor = 'text-slate-800';

                            if (gridDisplayMode === 'excel_register') {
                              if (dayDetail) {
                                if (dayDetail.isHoliday || dayDetail.code === 'HD') {
                                  cellDisplay = 'HD';
                                  cellColor = 'text-purple-700 font-bold';
                                } else if (dayDetail.status === 'Week Off' || isSunday) {
                                  cellDisplay = '';
                                } else if (dayDetail.code === 'CL') {
                                  cellDisplay = 'CL';
                                  cellColor = 'text-indigo-800 font-bold';
                                } else if (dayDetail.code === 'SL') {
                                  cellDisplay = 'SL';
                                  cellColor = 'text-amber-800 font-bold';
                                } else if (dayDetail.code === 'WFH') {
                                  cellDisplay = 'WFH';
                                  cellColor = 'text-teal-800 font-bold';
                                } else if (dayDetail.code === 'Spl Leave') {
                                  cellDisplay = 'Spl Leave';
                                  cellColor = 'text-rose-800 font-bold text-[10px]';
                                } else if (dayDetail.code === 'CO') {
                                  cellDisplay = 'CO';
                                  cellColor = 'text-blue-800 font-bold';
                                } else if (dayDetail.status === 'Leave' || dayDetail.code === 'LV') {
                                  cellDisplay = 'Leave';
                                  cellColor = 'text-rose-700 font-bold text-[10px]';
                                } else if (dayDetail.code === 'P' || dayDetail.status === 'Present' || dayDetail.status === 'Late' || dayDetail.status === 'Permission') {
                                  cellDisplay = 'P';
                                  cellColor = 'text-slate-900 font-bold';
                                } else if (dayDetail.code === 'AB' || dayDetail.status === 'Absent') {
                                  cellDisplay = 'AB';
                                  cellColor = 'text-red-700 font-extrabold';
                                } else if (dayDetail.code === '--') {
                                  cellDisplay = '';
                                } else {
                                  cellDisplay = dayDetail.code || 'P';
                                }
                              }
                            } else {
                              // Other modes (Time / In-Out / Hours)
                              return (
                                <td
                                  key={dayNum}
                                  className={`p-1 text-center border-r border-slate-300 ${cellBg}`}
                                >
                                  {renderCellContent(dayDetail)}
                                </td>
                              );
                            }

                            return (
                              <td
                                key={dayNum}
                                className={`p-1.5 text-center border-r border-slate-300 font-sans text-xs ${cellBg}`}
                                title={`${emp.employeeName} - Day ${dayNum}: ${dayDetail?.status || 'N/A'}`}
                              >
                                <span className={cellColor}>{cellDisplay}</span>
                              </td>
                            );
                          })}

                          {/* Summary Counter Columns */}
                          <td className="p-2 text-center font-bold text-slate-800 bg-slate-50 border-r border-slate-400">
                            {workingDays}
                          </td>
                          <td className="p-2 text-center font-bold text-slate-900 bg-emerald-50/50 border-r border-slate-400">
                            {presentDays}
                          </td>
                          <td className="p-2 text-center font-bold text-rose-700 bg-rose-50/50 border-r border-slate-400">
                            {leaveDays}
                          </td>
                          <td className={`p-2 text-center font-extrabold ${isLowAttendance ? 'text-red-600 bg-red-50' : 'text-slate-900 bg-slate-50'}`}>
                            {attPct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Grid Legend Footer */}
              <div className="bg-slate-100 border-t border-slate-300 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-sans text-slate-700">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-extrabold text-slate-900">Sheet Color Legend:</span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="inline-block w-4 h-4 bg-white border border-slate-400 text-center font-bold text-[10px] leading-tight">P</span> Present
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="inline-block w-4 h-4 bg-white border border-slate-400 text-center font-bold text-red-600 text-[10px] leading-tight">AB</span> Absent
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="inline-block w-4 h-4 bg-[#f8cbad] border border-slate-400 text-center text-[10px]"></span> Weekend (Sat/Sun)
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="inline-block w-4 h-4 bg-[#fff2cc] border border-slate-400 text-center text-[10px]"></span> Special Range
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="inline-block px-1 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] rounded">HD</span> Holiday
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="inline-block px-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] rounded">Spl Leave</span> Special / Leave
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                    &lt; 75% Attendance Alert
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">Exact Excel Register Format</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
