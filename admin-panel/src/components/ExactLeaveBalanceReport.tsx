import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { employeeService } from '../services/employeeService';
import { requestService } from '../services/requestService';
import {
  ExactLeaveReportRow,
  exportLeaveBalanceReportToExcel,
} from '../utils/excelExport';
import {
  Download,
  FileSpreadsheet,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Printer,
  FileDown,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Users,
  Award,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';

const currentYear = new Date().getFullYear();

export const DEFAULT_EXACT_LEAVE_ROWS: ExactLeaveReportRow[] = [
  { sNo: 1, employeeId: 'ECLCE2008', employeeName: 'Sasiprabha J', type: 'Employee', joinedMonth: 'Feb-25', totalLeave: 18, leaveTaken: 9, balance: 9, highlightRedTotal: true },
  { sNo: 2, employeeId: 'ECLCE2014', employeeName: 'Sriram R', type: 'Employee', joinedMonth: 'Aug-25', totalLeave: 16, leaveTaken: 7, balance: 9 },
  { sNo: 3, employeeId: 'ECLCE2015', employeeName: 'Manimegalai B', type: 'Employee', joinedMonth: 'Aug-25', totalLeave: 16, leaveTaken: 8.5, balance: 7.5 },
  { sNo: 4, employeeId: 'ECLCE2016', employeeName: 'Gopinath', type: 'Employee', joinedMonth: 'Dec-25', totalLeave: 16, leaveTaken: 5.5, balance: 10.5 },
  { sNo: 5, employeeId: 'ECLCE2017', employeeName: 'Dhanuja G T', type: 'Employee', joinedMonth: 'Sep-25', totalLeave: 16, leaveTaken: 7, balance: 9 },
  { sNo: 6, employeeId: 'ECLCT3009', employeeName: 'Kanishkaa S', type: 'Trainee', joinedMonth: 'Sep-25', totalLeave: 14, leaveTaken: 7.5, balance: 6.5 },
  { sNo: 7, employeeId: 'ECLCT3010', employeeName: 'Kanchana Mala V G', type: 'Trainee', joinedMonth: 'Sep-25', totalLeave: 14, leaveTaken: 11, balance: 3 },
  { sNo: 8, employeeId: 'ECLCT3014', employeeName: 'Prabavathi', type: 'Trainee', joinedMonth: 'Nov-25', totalLeave: 14, leaveTaken: 7.5, balance: 6.5 },
  { sNo: 9, employeeId: 'ECLCT3019', employeeName: 'Dhivyadharshini', type: 'Trainee', joinedMonth: 'Feb-26', totalLeave: 13, leaveTaken: 8, balance: 5 },
  { sNo: 10, employeeId: 'ECLCT3020', employeeName: 'Abinaya', type: 'Trainee', joinedMonth: 'Feb-26', totalLeave: 13, leaveTaken: 9, balance: 4 },
  { sNo: 11, employeeId: 'ECLCT3021', employeeName: 'Swetha', type: 'Trainee', joinedMonth: 'Feb-26', totalLeave: 13, leaveTaken: 8, balance: 5 },
  { sNo: 12, employeeId: 'ECLCT3022', employeeName: 'Kavyasree', type: 'Trainee', joinedMonth: 'Mar-26', totalLeave: 12, leaveTaken: 3, balance: 9 },
  { sNo: 13, employeeId: 'ECLCT3023', employeeName: 'Vijayashanthi', type: 'Trainee', joinedMonth: 'Mar-26', totalLeave: 12, leaveTaken: 5.5, balance: 6.5 },
  { sNo: 14, employeeId: 'ECLCT3024', employeeName: 'Merlin', type: 'Trainee', joinedMonth: 'Apr-26', totalLeave: 11, leaveTaken: 8, balance: 3 },
  { sNo: 15, employeeId: 'ECLCT3025', employeeName: 'Deeksha', type: 'Trainee', joinedMonth: 'Apr-26', totalLeave: 11, leaveTaken: 5, balance: 6 },
  { sNo: 16, employeeId: 'ECLCT3026', employeeName: 'Monisha', type: 'Trainee', joinedMonth: 'Apr-26', totalLeave: 11, leaveTaken: 6, balance: 5 },
  { sNo: 17, employeeId: 'ECLCT4017', employeeName: 'Rubella V', type: 'Trainee', joinedMonth: 'Feb-26', totalLeave: 13, leaveTaken: 8, balance: 5 },
  { sNo: 18, employeeId: 'ECLCT4021', employeeName: 'Deepika', type: 'Trainee', joinedMonth: 'Apr-26', totalLeave: 11, leaveTaken: 17, balance: -6, highlightYellowTaken: true },
  { sNo: 19, employeeId: 'ECLCI4023', employeeName: 'Mahalakhmi', type: 'Intern', joinedMonth: 'Jul-26', totalLeave: 8, leaveTaken: 10, balance: -2 },
];

export const ExactLeaveBalanceReport: React.FC = () => {
  const [reportRows, setReportRows] = useState<ExactLeaveReportRow[]>(() => {
    const saved = localStorage.getItem('exact_leave_balance_report_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_EXACT_LEAVE_ROWS;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedBalanceFilter, setSelectedBalanceFilter] = useState<string>('ALL');

  // Edit / Add Modal State
  const [editingRow, setEditingRow] = useState<ExactLeaveReportRow | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [formData, setFormData] = useState<ExactLeaveReportRow>({
    sNo: 1,
    employeeId: '',
    employeeName: '',
    type: 'Employee',
    joinedMonth: 'Jan-26',
    totalLeave: 16,
    leaveTaken: 0,
    balance: 16,
  });

  // Cell inspector / active cell
  const [activeCell, setActiveCell] = useState<{ row: number; col: string; val: string | number; label: string }>({
    row: 1,
    col: 'A',
    val: '--',
    label: 'Cell Inspector',
  });

  // Fetch actual employees & leave balances from system
  const syncFromSystemDatabase = useCallback(async () => {
    setLoading(true);
    try {
      // Clear legacy storage
      localStorage.removeItem('exact_leave_balance_report');

      const [emps, balanceData] = await Promise.all([
        employeeService.getAll().catch(() => []),
        requestService.getAllLeaveBalances(selectedYear).catch(() => []),
      ]);

      if (emps && emps.length > 0) {
        const rows: ExactLeaveReportRow[] = emps
          .filter((e) => e.role === 'EMPLOYEE' || e.role === 'ADMIN')
          .map((emp, index) => {
            const summary = balanceData.find((b) => b.employeeId === emp.id);
            let totalGranted = 0;
            let totalConsumed = 0;

            if (summary && summary.balances) {
              summary.balances.forEach((b) => {
                totalGranted += b.granted || 0;
                totalConsumed += b.consumed || 0;
              });
            } else {
              totalGranted = 16;
              totalConsumed = 0;
            }

            const bal = Number((totalGranted - totalConsumed).toFixed(1));

            // Determine type
            let empType: 'Employee' | 'Trainee' | 'Intern' = 'Employee';
            const dept = (emp.department || '').toUpperCase();
            if (dept.includes('TRAINEE') || emp.name.toLowerCase().includes('trainee')) {
              empType = 'Trainee';
            } else if (dept.includes('INTERN') || emp.name.toLowerCase().includes('intern')) {
              empType = 'Intern';
            }

            // Joined month
            let joinedMonth = 'Jan-26';
            if (emp.createdAt) {
              const dt = new Date(emp.createdAt);
              joinedMonth = dt.toLocaleString('en-US', { month: 'short' }) + '-' + String(dt.getFullYear()).slice(2);
            }

            return {
              sNo: index + 1,
              employeeId: emp.employeeCode || `EMP${emp.id}`,
              employeeName: emp.name || 'Employee',
              type: empType,
              joinedMonth,
              totalLeave: totalGranted,
              leaveTaken: totalConsumed,
              balance: bal,
              highlightRedTotal: totalGranted >= 18,
              highlightYellowTaken: totalConsumed >= 15,
            };
          });

        setReportRows(rows);
        localStorage.setItem('exact_leave_balance_report_v2', JSON.stringify(rows));
      } else {
        setReportRows([]);
        localStorage.setItem('exact_leave_balance_report_v2', JSON.stringify([]));
      }
    } catch (err) {
      console.error('Failed to sync from database', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  // Initial load
  useEffect(() => {
    const saved = localStorage.getItem('exact_leave_balance_report_v2');
    if (!saved || JSON.parse(saved).length === 0) {
      syncFromSystemDatabase();
    }
  }, [syncFromSystemDatabase]);

  const saveRows = (newRows: ExactLeaveReportRow[]) => {
    const indexed = newRows.map((r, i) => ({
      ...r,
      sNo: i + 1,
      balance: Number((r.totalLeave - r.leaveTaken).toFixed(1)),
      highlightRedTotal: r.totalLeave >= 18,
      highlightYellowTaken: r.leaveTaken >= 15,
    }));
    setReportRows(indexed);
    localStorage.setItem('exact_leave_balance_report_v3', JSON.stringify(indexed));
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset leave report table to default master records (19 employees)?')) {
      setReportRows(DEFAULT_EXACT_LEAVE_ROWS);
      localStorage.setItem('exact_leave_balance_report_v3', JSON.stringify(DEFAULT_EXACT_LEAVE_ROWS));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Remove all employee records from this report view?')) {
      setReportRows([]);
      localStorage.setItem('exact_leave_balance_report_v3', JSON.stringify([]));
    }
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return reportRows.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        r.employeeId.toLowerCase().includes(q) ||
        r.employeeName.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.joinedMonth.toLowerCase().includes(q);

      if (!matchQuery) return false;

      if (selectedType !== 'ALL' && r.type !== selectedType) return false;

      if (selectedBalanceFilter === 'NEGATIVE' && r.balance >= 0) return false;
      if (selectedBalanceFilter === 'POSITIVE' && r.balance < 0) return false;

      return true;
    });
  }, [reportRows, searchQuery, selectedType, selectedBalanceFilter]);

  // Statistics
  const totalEmployees = reportRows.length;
  const employeesCount = reportRows.filter((r) => r.type === 'Employee').length;
  const traineesCount = reportRows.filter((r) => r.type === 'Trainee').length;
  const internsCount = reportRows.filter((r) => r.type === 'Intern').length;
  const totalLeaveQuota = reportRows.reduce((sum, r) => sum + r.totalLeave, 0);
  const totalLeaveTaken = reportRows.reduce((sum, r) => sum + r.leaveTaken, 0);
  const totalBalance = reportRows.reduce((sum, r) => sum + r.balance, 0);
  const negativeBalanceCount = reportRows.filter((r) => r.balance < 0).length;

  // Export handlers
  const handleExportExcel = () => {
    exportLeaveBalanceReportToExcel(filteredRows, `Employee_Leave_Balance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportCsv = () => {
    const headers = ['S.No', 'Employee ID', 'Employee Name', 'Type', 'Joined Month', 'Total Leave', 'Leave Taken', 'Balance'];
    const csvContent = [
      headers.join(','),
      ...filteredRows.map((r) =>
        [r.sNo, `"${r.employeeId}"`, `"${r.employeeName}"`, `"${r.type}"`, `"${r.joinedMonth}"`, r.totalLeave, r.leaveTaken, r.balance].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Leave_Balance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Open Edit Modal
  const handleEditClick = (row: ExactLeaveReportRow) => {
    setEditingRow(row);
    setIsAddMode(false);
    setFormData({ ...row });
  };

  // Open Add Modal
  const handleAddNewClick = () => {
    setIsAddMode(true);
    setEditingRow(null);
    setFormData({
      sNo: reportRows.length + 1,
      employeeId: '',
      employeeName: '',
      type: 'Employee',
      joinedMonth: 'Jan-26',
      totalLeave: 16,
      leaveTaken: 0,
      balance: 16,
    });
  };

  // Delete Row
  const handleDeleteRow = (sNo: number) => {
    if (window.confirm(`Delete record for row #${sNo}?`)) {
      const next = reportRows.filter((r) => r.sNo !== sNo);
      saveRows(next);
    }
  };

  // Save Modal Form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeName.trim() || !formData.employeeId.trim()) {
      alert('Please fill in Employee ID and Employee Name');
      return;
    }

    const calculatedBalance = Number((formData.totalLeave - formData.leaveTaken).toFixed(1));
    const cleanRow: ExactLeaveReportRow = {
      ...formData,
      balance: calculatedBalance,
    };

    if (isAddMode) {
      saveRows([...reportRows, cleanRow]);
    } else if (editingRow) {
      const next = reportRows.map((r) => (r.sNo === editingRow.sNo ? cleanRow : r));
      saveRows(next);
    }

    setEditingRow(null);
    setIsAddMode(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Staff</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalEmployees}</span>
            <span className="text-[10px] text-slate-500 font-medium">Headcount</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Employees</span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{employeesCount}</span>
            <span className="text-[10px] text-emerald-600 font-medium">Permanent</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Trainees / Interns</span>
            <Award className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-700">{traineesCount + internsCount}</span>
            <span className="text-[10px] text-teal-600 font-medium">({traineesCount}T / {internsCount}I)</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Quota</span>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">{totalLeaveQuota}</span>
            <span className="text-[10px] text-blue-600 font-medium">Days Granted</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Leaves Taken</span>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{totalLeaveTaken}</span>
            <span className="text-[10px] text-amber-600 font-medium">Days Used</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overdrawn / Deficit</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{negativeBalanceCount}</span>
            <span className="text-[10px] text-rose-500 font-medium">Negative Bal.</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar & Filters ── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[240px] flex-1 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ID, Name, Month..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white outline-none cursor-pointer"
            >
              <option value="ALL">All Types (Employee, Trainee, Intern)</option>
              <option value="Employee">Employee Only</option>
              <option value="Trainee">Trainee Only</option>
              <option value="Intern">Intern Only</option>
            </select>

            {/* Balance Filter */}
            <select
              value={selectedBalanceFilter}
              onChange={(e) => setSelectedBalanceFilter(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white outline-none cursor-pointer"
            >
              <option value="ALL">All Balances</option>
              <option value="POSITIVE">Positive / In Credit (Balance &gt;= 0)</option>
              <option value="NEGATIVE">Deficit / Negative (Balance &lt; 0)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-colors cursor-pointer"
              title="Reset to 19 Master Employee Records"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Master List</span>
            </button>

            <button
              onClick={syncFromSystemDatabase}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              title="Sync dynamically from registered employees"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync from Database</span>
            </button>

            <button
              onClick={handleAddNewClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Record</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              title="Export as CSV"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Print Sheet"
            >
              <Printer className="h-4 w-4" />
            </button>

            <button
              onClick={handleClearAll}
              className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
              title="Clear all records"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Formula Bar / Active Cell Inspector ── */}
      <div className="bg-slate-100 px-4 py-2 rounded-2xl border border-slate-300 flex items-center gap-3 text-xs font-mono">
        <div className="px-3 py-1 bg-white rounded-md border border-slate-300 font-bold text-slate-800 min-w-[60px] text-center shadow-2xs">
          {activeCell.col}{activeCell.row}
        </div>
        <div className="text-slate-400 font-sans font-bold">fx</div>
        <div className="flex-1 px-3 py-1 bg-white rounded-md border border-slate-300 text-slate-800 font-semibold truncate shadow-2xs">
          <span className="font-bold text-indigo-700 font-mono">{String(activeCell.val)}</span>
          <span className="text-slate-400 ml-2 font-normal font-sans">({activeCell.label})</span>
        </div>
        <div className="text-[11px] text-slate-500 font-sans font-semibold">
          Showing {filteredRows.length} of {reportRows.length} Employees
        </div>
      </div>

      {/* ── 📊 THE EXACT LEAVE REPORT SPREADSHEET ── */}
      <div className="bg-white rounded-3xl border-2 border-black/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-sans text-xs text-slate-900 border border-black">
            <thead>
              {/* Cyan Header: #00FFFF with solid black text and black cell borders */}
              <tr className="bg-[#00FFFF] text-black font-extrabold text-xs border-b-2 border-black">
                <th className="py-2.5 px-3 text-center border-r border-black border-b border-t min-w-[55px]">
                  S.No
                </th>
                <th className="py-2.5 px-4 text-center border-r border-black border-b border-t min-w-[120px]">
                  Employee ID
                </th>
                <th className="py-2.5 px-6 text-center border-r border-black border-b border-t min-w-[160px]">
                  Employee Name
                </th>
                <th className="py-2.5 px-4 text-center border-r border-black border-b border-t min-w-[100px]">
                  Type
                </th>
                <th className="py-2.5 px-4 text-center border-r border-black border-b border-t min-w-[110px]">
                  Joined Month
                </th>
                <th className="py-2.5 px-4 text-center border-r border-black border-b border-t min-w-[100px]">
                  Total Leave
                </th>
                <th className="py-2.5 px-4 text-center border-r border-black border-b border-t min-w-[110px]">
                  Leave Taken
                </th>
                <th className="py-2.5 px-4 text-center border-r border-black border-b border-t min-w-[90px]">
                  Balance
                </th>
                <th className="py-2.5 px-3 text-center border-b border-t border-black min-w-[80px] print:hidden bg-[#00e5ff]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 font-semibold space-y-2">
                    <p className="text-sm text-slate-600 font-bold">No employee records in this leave report.</p>
                    <p className="text-xs text-slate-400">Click &quot;Sync from Database&quot; to fetch registered employees or click &quot;Add Record&quot;.</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const isRedTotal = row.highlightRedTotal || row.totalLeave >= 18;
                  const isYellowTaken = row.highlightYellowTaken || row.leaveTaken >= 15;
                  const isNegativeBalance = row.balance < 0;
                  const rowIdx = index + 1;

                  return (
                    <tr
                      key={row.employeeId || index}
                      className="border-b border-black hover:bg-cyan-50/30 transition-colors font-medium text-slate-900"
                    >
                      {/* S.No */}
                      <td
                        className="py-2 px-3 text-center border-r border-black font-semibold cursor-pointer hover:bg-cyan-100/50"
                        onClick={() =>
                          setActiveCell({
                            row: rowIdx,
                            col: 'A',
                            val: row.sNo,
                            label: `Serial Number #${row.sNo}`,
                          })
                        }
                      >
                        {row.sNo}
                      </td>

                      {/* Employee ID */}
                      <td
                        className="py-2 px-4 text-center border-r border-black font-semibold font-mono tracking-tight cursor-pointer hover:bg-cyan-100/50"
                        onClick={() =>
                          setActiveCell({
                            row: rowIdx,
                            col: 'B',
                            val: row.employeeId,
                            label: `${row.employeeName}'s Employee ID`,
                          })
                        }
                      >
                        {row.employeeId}
                      </td>

                      {/* Employee Name */}
                      <td
                        className="py-2 px-6 text-center border-r border-black font-semibold cursor-pointer hover:bg-cyan-100/50"
                        onClick={() =>
                          setActiveCell({
                            row: rowIdx,
                            col: 'C',
                            val: row.employeeName,
                            label: `Employee Full Name`,
                          })
                        }
                      >
                        {row.employeeName}
                      </td>

                      {/* Type */}
                      <td
                        className="py-2 px-4 text-center border-r border-black font-semibold cursor-pointer hover:bg-cyan-100/50"
                        onClick={() =>
                          setActiveCell({
                            row: rowIdx,
                            col: 'D',
                            val: row.type,
                            label: `Employment Type (${row.type})`,
                          })
                        }
                      >
                        {row.type}
                      </td>

                      {/* Joined Month */}
                      <td
                        className="py-2 px-4 text-center border-r border-black font-semibold cursor-pointer hover:bg-cyan-100/50"
                        onClick={() =>
                          setActiveCell({
                            row: rowIdx,
                            col: 'E',
                            val: row.joinedMonth,
                            label: `Joining Month: ${row.joinedMonth}`,
                          })
                        }
                      >
                        {row.joinedMonth}
                      </td>

                      {/* Total Leave */}
                      <td
                        className={`py-2 px-4 text-center border-r border-black font-bold cursor-pointer hover:bg-cyan-100/50 ${
                          isRedTotal ? 'text-[#FF0000] font-black text-sm' : 'text-slate-900'
                        }`}
                        onClick={() =>
                          setActiveCell({
                            row: rowIdx,
                            col: 'F',
                            val: row.totalLeave,
                            label: `Total Leave Quota for ${row.employeeName}`,
                          })
                        }
                      >
                        {row.totalLeave}
                      </td>

                      {/* Leave Taken */}
                      <td
                        className={`py-2 px-4 text-center border-r border-black font-bold cursor-pointer transition-colors ${
                          isYellowTaken
                            ? 'bg-[#FED986] text-black font-black'
                            : 'hover:bg-cyan-100/50 text-slate-900'
                        }`}
                        onClick={() =>
                          setActiveCell({
                            row: rowIdx,
                            col: 'G',
                            val: row.leaveTaken,
                            label: `Total Leave Taken by ${row.employeeName}`,
                          })
                        }
                      >
                        {row.leaveTaken}
                      </td>

                      {/* Balance */}
                      <td
                        className={`py-2 px-4 text-center border-r border-black font-bold cursor-pointer hover:bg-cyan-100/50 ${
                          isNegativeBalance
                            ? 'text-rose-600 font-black'
                            : 'text-slate-900'
                        }`}
                        onClick={() =>
                          setActiveCell({
                            row: rowIdx,
                            col: 'H',
                            val: row.balance,
                            label: `Calculated Balance (${row.totalLeave} - ${row.leaveTaken} = ${row.balance})`,
                          })
                        }
                      >
                        {row.balance}
                      </td>

                      {/* Quick Edit Actions */}
                      <td className="py-2 px-3 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditClick(row)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(row.sNo)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-black flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-3 font-medium">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-500 inline-block" />
            <span>
              Leave Quota & Balance Register ({reportRows.length} Total Records)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#FED986] border border-slate-400" />
              <span>High Utilization (&ge;15 Days)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              <span>Negative Deficit Balance</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: Edit / Add Leave Record ── */}
      {(editingRow || isAddMode) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isAddMode ? 'Add Employee Leave Record' : 'Edit Leave Record'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAddMode ? 'Create new row in leave sheet' : `Updating ${editingRow?.employeeName}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingRow(null);
                  setIsAddMode(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="e.g. ECLCE2018"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Employment Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Trainee">Trainee</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Employee Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Joined Month
                </label>
                <input
                  type="text"
                  required
                  value={formData.joinedMonth}
                  onChange={(e) => setFormData({ ...formData, joinedMonth: e.target.value })}
                  placeholder="e.g. Aug-25 or Feb-26"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Total Leave Quota
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.totalLeave}
                    onChange={(e) => setFormData({ ...formData, totalLeave: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Leave Taken
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.leaveTaken}
                    onChange={(e) => setFormData({ ...formData, leaveTaken: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Live Computed Balance Preview */}
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-600">Calculated Balance:</span>
                <span className={`text-sm font-black ${(formData.totalLeave - formData.leaveTaken) < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {(formData.totalLeave - formData.leaveTaken).toFixed(1)} Days
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRow(null);
                    setIsAddMode(false);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md"
                >
                  {isAddMode ? 'Add Row' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExactLeaveBalanceReport;
