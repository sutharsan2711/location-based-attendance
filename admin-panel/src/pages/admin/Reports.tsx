import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { employeeService } from '../../services/employeeService';
import { Employee } from '../../types/employee';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import { FileDown, Calendar, Search, RefreshCw, FileText } from 'lucide-react';

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchFilters = useCallback(async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data.filter(e => e.role === 'EMPLOYEE'));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const runReport = useCallback(async () => {
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
    runReport();
  }, [runReport]);

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
        <span className={`font-bold ${row.workingHours !== '--' ? 'text-slate-800' : 'text-slate-400'}`}>
          {row.workingHours}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row: any) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
            Attendance Reports
          </h1>
          <p className="text-sm text-slate-400">Run and export customized attendance report logs containing calculated working hours</p>
        </div>
        <Button
          variant="primary"
          size="md"
          loading={exportLoading}
          onClick={handleExportCsv}
          className="font-bold py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
        >
          <FileDown className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filter Options */}
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

          {/* Status Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Status Filter
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

          {/* Reset button */}
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedEmployeeId('');
                setSelectedStatus('');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full p-2.5 font-bold"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : (
        <Card>
          <Table
            data={reportData}
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
