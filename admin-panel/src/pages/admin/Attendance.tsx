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
      setEmployees(employeesData.filter((e) => e.role === 'EMPLOYEE'));
    } catch (err) {
      console.error('Failed to load filter dropdowns', err);
    }
  }, []);

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

  // Display Format in Grid: 'time' (Login Time) | 'in_out' | 'hours' | 'status'
  const [gridDisplayMode, setGridDisplayMode] = useState<'time' | 'in_out' | 'hours' | 'status'>('time');

  const exportMonthlyTimeMatrixCSV = () => {
    if (!monthlyData) return;
    const daysHeader = Array.from({ length: monthlyData.daysInMonth }).map((_, i) => `Day ${i + 1}`);
    const headers = ['Employee Code', 'Employee Name', ...daysHeader, 'Total Present', 'Total Late', 'Total Permission', 'Total Leave', 'Total Absent'];

    const rows = [
      headers,
      ...monthlyData.employees.map((emp) => {
        const dayValues = Array.from({ length: monthlyData.daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dayDetail = emp.days[String(dayNum)];
          if (!dayDetail) return '--';
          if (dayDetail.status === 'Leave') return 'Leave';
          if (dayDetail.status === 'Week Off') return 'Week Off';
          if (dayDetail.loginTime && dayDetail.loginTime !== '--') {
            if (dayDetail.status === 'Late') return `${dayDetail.loginTime} (Late)`;
            if (dayDetail.status === 'Permission') return `${dayDetail.loginTime} (Perm)`;
            return dayDetail.loginTime;
          }
          if (dayDetail.status === 'Permission') return 'Permission';
          if (dayDetail.status === 'Absent') return 'Absent';
          return '--';
        });

        return [
          emp.employeeCode,
          emp.employeeName,
          ...dayValues,
          emp.totalPresent,
          emp.totalLate,
          emp.totalPermission,
          emp.totalLeave,
          emp.totalAbsent,
        ];
      }),
    ];

    const csvContent =
      '\ufeff' + rows.map((e) => e.map((cell) => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monthly_Attendance_Time_Matrix_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

                {/* Display Value Switcher: Login Time Only vs Others */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Cell Content
                  </label>
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      onClick={() => setGridDisplayMode('time')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        gridDisplayMode === 'time'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Login Time (09:15)
                    </button>
                    <button
                      onClick={() => setGridDisplayMode('in_out')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        gridDisplayMode === 'in_out'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      In - Out
                    </button>
                    <button
                      onClick={() => setGridDisplayMode('hours')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        gridDisplayMode === 'hours'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Hours
                    </button>
                    <button
                      onClick={() => setGridDisplayMode('status')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        gridDisplayMode === 'status'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Code (P/L)
                    </button>
                  </div>
                </div>
              </div>

              {/* Export Time Matrix Button */}
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={exportMonthlyTimeMatrixCSV}
                  className="font-bold py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" /> Export Date-Time Matrix CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchMonthlyData}
                  className="py-2.5 px-3"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Monthly Matrix Grid */}
          {monthlyLoading ? (
            <Loading fullScreen={false} message="Loading monthly attendance time matrix..." />
          ) : !monthlyData || monthlyData.employees.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">
              No employee records found for {months.find((m) => m.value === selectedMonth)?.name}{' '}
              {selectedYear}.
            </Card>
          ) : (
            <div className="rounded-2xl border border-slate-300 bg-white overflow-hidden shadow-lg font-mono">
              {/* Top Excel Green Bar */}
              <div className="bg-[#107c41] text-white px-4 py-2 flex items-center justify-between text-xs font-bold font-sans">
                <span className="flex items-center gap-2">
                  📅 {months.find((m) => m.value === selectedMonth)?.name} {selectedYear} — Date Columns Time Matrix (Excel View)
                </span>
                <span className="text-[10px] bg-emerald-800/80 px-2.5 py-0.5 rounded font-mono">
                  {monthlyData.employees.length} Employees × {monthlyData.daysInMonth} Days
                </span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse border border-slate-300 min-w-[1200px]">
                  {/* Table Header with Day Columns */}
                  <thead className="bg-[#f3f4f6] text-slate-700 font-bold sticky top-0 z-10 select-none">
                    <tr className="border-b border-slate-300 text-center text-[11px]">
                      <th className="p-3 sticky left-0 bg-[#e5e7eb] z-20 min-w-[190px] border-r border-slate-300 text-left font-sans text-slate-800">
                        Employee (Rows)
                      </th>
                      {Array.from({ length: monthlyData.daysInMonth }).map((_, i) => (
                        <th
                          key={i + 1}
                          className="p-1.5 text-center border-r border-slate-300 min-w-[55px] font-mono text-[11px] bg-slate-100 text-slate-800"
                        >
                          <span className="block font-bold">D{i + 1}</span>
                          <span className="text-[9px] font-normal text-slate-500 font-sans block">
                            {new Date(selectedYear, selectedMonth - 1, i + 1).toLocaleDateString('en-US', { weekday: 'narrow' })}
                          </span>
                        </th>
                      ))}
                      <th className="p-2 text-center bg-emerald-50 text-emerald-800 font-bold min-w-[45px] border-r border-slate-200">Pres</th>
                      <th className="p-2 text-center bg-amber-50 text-amber-800 font-bold min-w-[45px] border-r border-slate-200">Late</th>
                      <th className="p-2 text-center bg-indigo-50 text-indigo-800 font-bold min-w-[45px] border-r border-slate-200">Perm</th>
                      <th className="p-2 text-center bg-rose-50 text-rose-800 font-bold min-w-[45px] border-r border-slate-200">Leave</th>
                      <th className="p-2 text-center bg-red-50 text-red-700 font-bold min-w-[45px]">Abs</th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {monthlyData.employees.map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-blue-50/50 transition-colors">
                        {/* Sticky Employee Name + Code */}
                        <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <span className="font-bold text-slate-800 block text-xs truncate max-w-[170px] font-sans">
                            {emp.employeeName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">
                            {emp.employeeCode}
                          </span>
                        </td>

                        {/* Day Columns (1..31) displaying Time */}
                        {Array.from({ length: monthlyData.daysInMonth }).map((_, i) => {
                          const dayNum = i + 1;
                          const dayDetail = emp.days[String(dayNum)];
                          const isWeekend =
                            new Date(selectedYear, selectedMonth - 1, dayNum).getDay() === 0;

                          return (
                            <td
                              key={dayNum}
                              className={`p-1.5 text-center border-r border-slate-200 ${
                                isWeekend ? 'bg-slate-50/70' : ''
                              }`}
                              title={`${emp.employeeName} - Day ${dayNum}: ${dayDetail?.status || 'N/A'} (Login: ${dayDetail?.loginTime || '--'}, Logout: ${dayDetail?.logoutTime || '--'})`}
                            >
                              {renderCellContent(dayDetail)}
                            </td>
                          );
                        })}

                        {/* Summary Counter Columns */}
                        <td className="p-2 text-center font-bold text-emerald-700 bg-emerald-50/40 border-r border-slate-200">
                          {emp.totalPresent}
                        </td>
                        <td className="p-2 text-center font-bold text-amber-700 bg-amber-50/40 border-r border-slate-200">
                          {emp.totalLate}
                        </td>
                        <td className="p-2 text-center font-bold text-indigo-700 bg-indigo-50/40 border-r border-slate-200">
                          {emp.totalPermission}
                        </td>
                        <td className="p-2 text-center font-bold text-rose-700 bg-rose-50/40 border-r border-slate-200">
                          {emp.totalLeave}
                        </td>
                        <td className="p-2 text-center font-bold text-red-600 bg-red-50/40">
                          {emp.totalAbsent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grid Legend Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-sans text-slate-600">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-bold text-slate-700">Legend:</span>
                  <span className="flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    09:14 = Present
                  </span>
                  <span className="flex items-center gap-1 font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 text-[11px]">
                    09:45 [Late]
                  </span>
                  <span className="flex items-center gap-1 font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                    09:15 [Perm]
                  </span>
                  <span className="flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                    Leave
                  </span>
                  <span className="flex items-center gap-1 font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                    WO = Week Off
                  </span>
                </div>
                <span className="font-mono text-slate-400 text-[11px]">Excel-compatible Grid View</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
