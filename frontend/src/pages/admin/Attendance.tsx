import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { employeeService } from '../../services/employeeService';
import { Attendance } from '../../types/attendance';
import { Employee } from '../../types/employee';
import { formatDate, formatTime } from '../../utils/dateUtils';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const Attendance: React.FC = () => {
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const fetchFiltersData = useCallback(async () => {
    try {
      const employeesData = await employeeService.getAll();
      setEmployees(employeesData.filter(e => e.role === 'EMPLOYEE'));
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
      setCurrentPage(1); // Reset to page 1 on search
    } catch (err) {
      console.error(err);
      setError('Failed to fetch attendance logs.');
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, selectedStatus, startDate, endDate]);

  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]);

  useEffect(() => {
    fetchAttendanceLogs();
  }, [fetchAttendanceLogs]);

  // Client-side search mapping (matches employee code or name)
  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      log.employee.name.toLowerCase().includes(query) ||
      log.employee.employeeCode.toLowerCase().includes(query) ||
      log.employee.email.toLowerCase().includes(query)
    );
  });

  // Pagination split
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const columns = [
    {
      header: 'Employee Code',
      render: (row: Attendance) => <span className="font-bold text-slate-800">{row.employee.employeeCode}</span>,
    },
    {
      header: 'Employee Name',
      render: (row: Attendance) => <span className="font-semibold text-slate-700">{row.employee.name}</span>,
    },
    {
      header: 'Date',
      render: (row: Attendance) => <span>{formatDate(row.attendanceDate)}</span>,
    },
    {
      header: 'Login Time',
      render: (row: Attendance) => <span>{row.loginTime ? formatTime(row.loginTime) : '--'}</span>,
    },
    {
      header: 'Login Distance',
      render: (row: Attendance) => (
        <span className="text-xs text-slate-500">
          {row.loginDistance !== null && row.loginDistance !== undefined 
            ? `${row.loginDistance.toFixed(1)}m` 
            : '--'}
        </span>
      ),
    },
    {
      header: 'Logout Time',
      render: (row: Attendance) => <span>{row.logoutTime ? formatTime(row.logoutTime) : '--'}</span>,
    },
    {
      header: 'Logout Distance',
      render: (row: Attendance) => (
        <span className="text-xs text-slate-500">
          {row.logoutDistance !== null && row.logoutDistance !== undefined 
            ? `${row.logoutDistance.toFixed(1)}m` 
            : '--'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row: Attendance) => {
        if (row.status === 'LOGGED_IN') {
          return (
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-600">
              Logged In
            </span>
          );
        }
        if (row.status === 'COMPLETED') {
          return (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
              Completed
            </span>
          );
        }
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-400">
            Not Logged In
          </span>
        );
      },
    },
  ];

  const clearFilters = () => {
    setSelectedEmployeeId('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
            Attendance Logs
          </h1>
          <p className="text-sm text-slate-400">Search and filter employee check-in/check-out history logs</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAttendanceLogs} className="py-2 px-3.5">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Filters Box */}
      <Card className="p-4 bg-white border-slate-100">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          {/* Employee dropdown */}
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
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {/* Status dropdown */}
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

          {/* Action Trigger button */}
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

      {/* Search Input */}
      <div className="relative max-w-sm">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search by code, name, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-xs outline-none focus:border-primary-500 bg-white"
        />
      </div>

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
              emptyMessage="No matching attendance logs found."
            />
          </Card>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100/50 pt-4 px-2">
              <span className="text-xs text-slate-400">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} entries
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
  );
};

export default Attendance;
