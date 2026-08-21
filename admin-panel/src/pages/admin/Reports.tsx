import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminService } from '../../services/adminService';
import { employeeService } from '../../services/employeeService';
import { Employee } from '../../types/employee';
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
} from 'lucide-react';

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'excel' (Spreadsheet Grid) vs 'table' (Standard Table)
  const [viewMode, setViewMode] = useState<'excel' | 'table'>('excel');

  // Excel Sheet Tabs: 'all' | 'late' | 'permissions_leaves'
  const [activeSheetTab, setActiveSheetTab] = useState<'all' | 'late' | 'permissions_leaves'>('all');

  // Active Selected Cell (Spreadsheet simulation)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: string; val: string }>({
    row: 1,
    col: 'B',
    val: 'Employee Attendance Data',
  });

  // Real-time Live Polling
  const [isLivePolling, setIsLivePolling] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Filters State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchFilters = useCallback(async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data.filter((e) => e.role === 'EMPLOYEE'));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const runReport = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const data = await adminService.getReport({
        employeeId: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : undefined,
        status: selectedStatus || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setReportData(data);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      if (!isBackground) setError('Failed to generate attendance report.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [selectedEmployeeId, selectedStatus, startDate, endDate]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    runReport();
  }, [runReport]);

  // Polling interval for live Excel updates (every 5 seconds when live mode enabled)
  useEffect(() => {
    if (!isLivePolling) return;
    const timer = setInterval(() => {
      runReport(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [isLivePolling, runReport]);

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

  // Filter according to Search and Active Sheet Tab
  const filteredData = reportData.filter((row) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      row.employeeName?.toLowerCase().includes(q) ||
      row.employeeCode?.toLowerCase().includes(q) ||
      row.date?.toLowerCase().includes(q) ||
      row.displayStatus?.toLowerCase().includes(q) ||
      row.timingStatus?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeSheetTab === 'late') {
      return (
        row.timingStatus === 'LATE' ||
        row.displayStatus?.toLowerCase().includes('late')
      );
    }
    if (activeSheetTab === 'permissions_leaves') {
      return (
        row.timingStatus === 'PERMISSION' ||
        row.timingStatus === 'LEAVE' ||
        row.displayStatus?.toLowerCase().includes('permission') ||
        row.displayStatus?.toLowerCase().includes('leave')
      );
    }
    return true;
  });

  // Calculate Summary Metrics
  const totalRecords = filteredData.length;
  const lateCount = filteredData.filter(
    (r) => r.timingStatus === 'LATE' || r.displayStatus === 'Late'
  ).length;
  const permissionCount = filteredData.filter(
    (r) => r.timingStatus === 'PERMISSION' || r.displayStatus === 'Permission'
  ).length;
  const leaveCount = filteredData.filter(
    (r) => r.timingStatus === 'LEAVE' || r.displayStatus === 'Leave'
  ).length;
  const presentCount = filteredData.filter(
    (r) => r.displayStatus === 'Present' || r.status === 'COMPLETED'
  ).length;

  const renderStatusBadge = (row: any) => {
    const timing = row.timingStatus || '';
    const display = row.displayStatus || '';

    if (timing === 'LEAVE' || display === 'Leave') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          ● Leave
        </span>
      );
    }
    if (timing === 'PERMISSION' || display === 'Permission') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          ● Permission
        </span>
      );
    }
    if (timing === 'LATE' || display === 'Late') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          ● Late
        </span>
      );
    }
    if (row.status === 'LOGGED_IN') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          ● Working
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        ✓ Present
      </span>
    );
  };

  const columns = [
    {
      header: 'Employee Code',
      render: (row: any) => <span className="font-bold text-slate-800">{row.employeeCode}</span>,
    },
    {
      header: 'Employee Name',
      render: (row: any) => <span className="font-semibold text-slate-700">{row.employeeName}</span>,
    },
    {
      header: 'Date',
      render: (row: any) => <span>{row.date}</span>,
    },
    {
      header: 'Login Time',
      render: (row: any) => <span>{row.loginTime}</span>,
    },
    {
      header: 'Login Distance',
      render: (row: any) => <span className="text-xs text-slate-500">{row.loginDistance}</span>,
    },
    {
      header: 'Logout Time',
      render: (row: any) => <span>{row.logoutTime}</span>,
    },
    {
      header: 'Logout Distance',
      render: (row: any) => <span className="text-xs text-slate-500">{row.logoutDistance}</span>,
    },
    {
      header: 'Working Hours',
      render: (row: any) => (
        <span
          className={`font-bold ${
            row.workingHours !== '--' ? 'text-slate-800' : 'text-slate-400'
          }`}
        >
          {row.workingHours}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row: any) => renderStatusBadge(row),
    },
  ];

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* ── Top Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-sm font-black text-sm">
              X
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl flex items-center gap-2">
                Live Excel Attendance Sheet
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Live streaming spreadsheet with real-time Login, Late, Permission, & Leave updates
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Live Polling Toggle Button */}
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm ${
              isLivePolling
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title="Auto-refresh attendance logs live"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isLivePolling ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
              }`}
            />
            <span>{isLivePolling ? 'LIVE SYNC ACTIVE (5s)' : 'PAUSED'}</span>
          </button>

          {/* View Mode Switcher: Excel vs Standard Table */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('excel')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'excel'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Excel View</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table View</span>
            </button>
          </div>

          {/* Export to CSV / Excel */}
          <Button
            variant="primary"
            size="md"
            loading={exportLoading}
            onClick={handleExportCsv}
            className="font-bold py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 text-xs flex items-center gap-1.5"
          >
            <FileDown className="h-4 w-4" /> Download .xlsx / .csv
          </Button>
        </div>
      </div>

      {/* ── Summary Counters Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Records
          </span>
          <span className="text-xl font-extrabold text-slate-800 font-mono mt-0.5 block">
            {totalRecords}
          </span>
        </div>
        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
            Present
          </span>
          <span className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5 block">
            {presentCount}
          </span>
        </div>
        <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100 shadow-sm">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            Late Logins
          </span>
          <span className="text-xl font-extrabold text-amber-800 font-mono mt-0.5 block">
            {lateCount}
          </span>
        </div>
        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 shadow-sm">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
            Permissions
          </span>
          <span className="text-xl font-extrabold text-indigo-800 font-mono mt-0.5 block">
            {permissionCount}
          </span>
        </div>
        <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 shadow-sm">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            On Leave
          </span>
          <span className="text-xl font-extrabold text-rose-800 font-mono mt-0.5 block">
            {leaveCount}
          </span>
        </div>
      </div>

      {/* ── Filter Options Bar ── */}
      <Card className="p-4 bg-white border-slate-100">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          {/* Employee Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Employee Filter
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none bg-white text-slate-700 cursor-pointer"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {/* Status Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Status Filter
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none bg-white text-slate-700 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="LOGGED_IN">Working (LOGGED_IN)</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Date Picker Start */}
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

          {/* Date Picker End */}
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

          {/* Search Bar */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Quick Search
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs outline-none text-slate-700 bg-white"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── SPREADSHEET (LIVE EXCEL VIEW) OR STANDARD TABLE ── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : viewMode === 'excel' ? (
        <div className="rounded-2xl border border-slate-300 bg-white shadow-xl overflow-hidden font-sans">
          {/* ── Excel Ribbon Toolbar Header ── */}
          <div className="bg-[#107c41] text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-xs tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4" /> AttendGPS_LiveAttendance_2026.xlsx
              </span>
              <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded font-mono">
                Auto-saved
              </span>
            </div>

            <div className="text-[11px] font-medium flex items-center gap-4 text-emerald-100">
              <span>Last synced: {lastSyncTime}</span>
              <button
                onClick={() => runReport(false)}
                className="hover:text-white p-1 rounded hover:bg-emerald-800 transition-colors"
                title="Sync now"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ── Excel Formula Bar (fx) ── */}
          <div className="bg-slate-100 border-b border-slate-300 px-4 py-1.5 flex items-center gap-3 text-xs">
            {/* Active Cell Name box */}
            <div className="h-7 w-16 bg-white border border-slate-300 rounded flex items-center justify-center font-mono font-bold text-slate-700 text-xs">
              {selectedCell.col}
              {selectedCell.row}
            </div>

            {/* Formula fx symbol */}
            <span className="font-serif italic font-bold text-slate-400 text-xs">fx</span>

            {/* Cell Value Input box */}
            <input
              type="text"
              readOnly
              value={selectedCell.val}
              className="flex-1 h-7 bg-white border border-slate-300 rounded px-3 text-xs font-mono text-slate-800 outline-none"
            />
          </div>

          {/* ── Excel Grid Container ── */}
          <div className="overflow-x-auto max-h-[550px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse border border-slate-300 font-mono">
              {/* Column Letters (A, B, C, D, ...) */}
              <thead className="bg-[#f3f4f6] text-slate-600 sticky top-0 z-10 select-none">
                <tr className="border-b border-slate-300 text-center font-bold text-[11px]">
                  <th className="w-12 py-1.5 px-2 bg-[#e5e7eb] border-r border-slate-300 text-slate-500 font-mono text-[10px]">
                    #
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700">
                    A <span className="text-[10px] font-sans font-semibold text-slate-500 block">Emp Code</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700 min-w-[160px]">
                    B <span className="text-[10px] font-sans font-semibold text-slate-500 block">Employee Name</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700 min-w-[110px]">
                    C <span className="text-[10px] font-sans font-semibold text-slate-500 block">Date</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700 min-w-[100px]">
                    D <span className="text-[10px] font-sans font-semibold text-slate-500 block">Login Time</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700 min-w-[100px]">
                    E <span className="text-[10px] font-sans font-semibold text-slate-500 block">Login Dist</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700 min-w-[100px]">
                    F <span className="text-[10px] font-sans font-semibold text-slate-500 block">Logout Time</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700 min-w-[100px]">
                    G <span className="text-[10px] font-sans font-semibold text-slate-500 block">Logout Dist</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700 min-w-[90px]">
                    H <span className="text-[10px] font-sans font-semibold text-slate-500 block">Hours</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700 min-w-[110px]">
                    I <span className="text-[10px] font-sans font-semibold text-slate-500 block">Punch State</span>
                  </th>
                  <th className="py-1.5 px-3 border-slate-300 text-slate-700 min-w-[120px]">
                    J <span className="text-[10px] font-sans font-semibold text-slate-500 block">Timing Status</span>
                  </th>
                </tr>
              </thead>

              {/* Spreadsheet Rows */}
              <tbody className="divide-y divide-slate-200 text-slate-800 bg-white">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 font-sans text-xs">
                      No live attendance rows match current filters.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const rowNum = idx + 1;
                    return (
                      <tr
                        key={row.id || idx}
                        className="hover:bg-blue-50/40 transition-colors cursor-cell group"
                      >
                        {/* Row Index Number */}
                        <td className="py-2 px-2 bg-[#f9fafb] border-r border-slate-300 text-center font-bold text-[10px] text-slate-400 select-none group-hover:bg-slate-200">
                          {rowNum}
                        </td>

                        {/* A: Employee Code */}
                        <td
                          onClick={() =>
                            setSelectedCell({ row: rowNum, col: 'A', val: row.employeeCode || '' })
                          }
                          className={`py-2 px-3 border-r border-slate-200 font-bold ${
                            selectedCell.row === rowNum && selectedCell.col === 'A'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {row.employeeCode}
                        </td>

                        {/* B: Employee Name */}
                        <td
                          onClick={() =>
                            setSelectedCell({ row: rowNum, col: 'B', val: row.employeeName || '' })
                          }
                          className={`py-2 px-3 border-r border-slate-200 font-sans font-semibold text-slate-800 ${
                            selectedCell.row === rowNum && selectedCell.col === 'B'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {row.employeeName}
                        </td>

                        {/* C: Date */}
                        <td
                          onClick={() =>
                            setSelectedCell({ row: rowNum, col: 'C', val: row.date || '' })
                          }
                          className={`py-2 px-3 border-r border-slate-200 text-slate-600 ${
                            selectedCell.row === rowNum && selectedCell.col === 'C'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {row.date}
                        </td>

                        {/* D: Login Time */}
                        <td
                          onClick={() =>
                            setSelectedCell({ row: rowNum, col: 'D', val: row.loginTime || '--' })
                          }
                          className={`py-2 px-3 border-r border-slate-200 font-bold ${
                            row.loginTime !== '--' ? 'text-slate-800' : 'text-slate-300'
                          } ${
                            selectedCell.row === rowNum && selectedCell.col === 'D'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {row.loginTime}
                        </td>

                        {/* E: Login Distance */}
                        <td
                          onClick={() =>
                            setSelectedCell({ row: rowNum, col: 'E', val: row.loginDistance || '--' })
                          }
                          className={`py-2 px-3 border-r border-slate-200 text-xs text-slate-500 ${
                            selectedCell.row === rowNum && selectedCell.col === 'E'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {row.loginDistance}
                        </td>

                        {/* F: Logout Time */}
                        <td
                          onClick={() =>
                            setSelectedCell({ row: rowNum, col: 'F', val: row.logoutTime || '--' })
                          }
                          className={`py-2 px-3 border-r border-slate-200 font-bold ${
                            row.logoutTime !== '--' ? 'text-slate-800' : 'text-slate-300'
                          } ${
                            selectedCell.row === rowNum && selectedCell.col === 'F'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {row.logoutTime}
                        </td>

                        {/* G: Logout Distance */}
                        <td
                          onClick={() =>
                            setSelectedCell({ row: rowNum, col: 'G', val: row.logoutDistance || '--' })
                          }
                          className={`py-2 px-3 border-r border-slate-200 text-xs text-slate-500 ${
                            selectedCell.row === rowNum && selectedCell.col === 'G'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {row.logoutDistance}
                        </td>

                        {/* H: Working Hours */}
                        <td
                          onClick={() =>
                            setSelectedCell({ row: rowNum, col: 'H', val: row.workingHours || '--' })
                          }
                          className={`py-2 px-3 border-r border-slate-200 font-bold ${
                            row.workingHours !== '--' ? 'text-slate-900 bg-slate-50/70' : 'text-slate-300'
                          } ${
                            selectedCell.row === rowNum && selectedCell.col === 'H'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {row.workingHours}
                        </td>

                        {/* I: Punch State */}
                        <td
                          onClick={() =>
                            setSelectedCell({ row: rowNum, col: 'I', val: row.status || '' })
                          }
                          className={`py-2 px-3 border-r border-slate-200 ${
                            selectedCell.row === rowNum && selectedCell.col === 'I'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          <span className="text-[10px] font-bold text-slate-600">
                            {row.status || '--'}
                          </span>
                        </td>

                        {/* J: Timing Status (Late / Permission / Leave / Present) */}
                        <td
                          onClick={() =>
                            setSelectedCell({
                              row: rowNum,
                              col: 'J',
                              val: row.displayStatus || row.timingStatus || 'Present',
                            })
                          }
                          className={`py-2 px-3 ${
                            selectedCell.row === rowNum && selectedCell.col === 'J'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {renderStatusBadge(row)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Excel Bottom Sheet Tabs (Sheet 1, Sheet 2, Sheet 3) ── */}
          <div className="bg-slate-100 border-t border-slate-300 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-semibold select-none">
            {/* Sheet Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveSheetTab('all')}
                className={`px-3 py-1.5 rounded-t-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeSheetTab === 'all'
                    ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-emerald-600" />
                <span>Sheet 1: All Attendance ({reportData.length})</span>
              </button>

              <button
                onClick={() => setActiveSheetTab('late')}
                className={`px-3 py-1.5 rounded-t-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeSheetTab === 'late'
                    ? 'bg-white text-amber-700 border-t-2 border-amber-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Sheet 2: Late Check-Ins ({lateCount})</span>
              </button>

              <button
                onClick={() => setActiveSheetTab('permissions_leaves')}
                className={`px-3 py-1.5 rounded-t-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeSheetTab === 'permissions_leaves'
                    ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Sheet 3: Leaves & Permissions ({leaveCount + permissionCount})</span>
              </button>
            </div>

            {/* Excel Status Bar Summary */}
            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-4">
              <span>Ready</span>
              <span>Count: {filteredData.length}</span>
              <span>LATE: {lateCount}</span>
              <span>LEAVES: {leaveCount}</span>
              <span>100% Zoom</span>
            </div>
          </div>
        </div>
      ) : (
        /* ════════ STANDARD TABLE VIEW ════════ */
        <Card>
          <Table
            data={filteredData}
            columns={columns}
            keyExtractor={(row, index) => row.id || index}
            loading={loading}
            emptyMessage="No report entries generated under current filters."
          />
        </Card>
      )}
    </div>
  );
};

export default Reports;
