import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  Calendar,
  Search,
  Filter,
  Eye,
  FileText,
  CreditCard,
  Settings,
  Sparkles,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Download,
} from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { PayrollRecord, PayrollDashboardStats, PayrollStatus } from '../../types/payroll';
import Loading from '../../components/Loading';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AdminPayroll: React.FC = () => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [stats, setStats] = useState<PayrollDashboardStats | null>(null);
  const [payrollList, setPayrollList] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Generation Modal state
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [genSuccessMsg, setGenSuccessMsg] = useState<string | null>(null);
  const [genErrorMsg, setGenErrorMsg] = useState<string | null>(null);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const [statsData, listData] = await Promise.all([
        payrollService.getStats(selectedMonth, selectedYear),
        payrollService.getPayrollList({
          month: selectedMonth,
          year: selectedYear,
        }),
      ]);
      setStats(statsData);
      setPayrollList(listData);
    } catch (err: any) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenSuccessMsg(null);
    setGenErrorMsg(null);
    try {
      const result = await payrollService.generatePayroll(selectedMonth, selectedYear);
      setGenSuccessMsg(`Successfully generated payroll records for ${result.length} employee(s).`);
      fetchPayrollData();
      setTimeout(() => {
        setShowGenerateModal(false);
        setGenSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setGenErrorMsg(err.response?.data?.message || err.message || 'Failed to generate payroll.');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (record: PayrollRecord, nextStatus: PayrollStatus) => {
    try {
      await payrollService.updateStatus(record.id, nextStatus);
      fetchPayrollData();
    } catch (err: any) {
      alert('Failed to update payroll status.');
    }
  };

  const filteredPayroll = payrollList.filter((item) => {
    const matchesSearch =
      item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.department && item.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header & Action Bar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <DollarSign className="h-7 w-7 text-primary-600 p-1 bg-primary-50 rounded-xl" />
            Payroll & Salary Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Calculate, generate monthly payroll, review attendance breakdowns, and issue official payslips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/payroll/salary')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            Salary Structures
          </button>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary-500/20 active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            Generate Monthly Payroll
          </button>
        </div>
      </div>

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Staff</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats?.totalEmployees ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Active Employees</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payroll Generated</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{stats?.payrollGenerated ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">For {MONTHS[selectedMonth - 1]}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payroll Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{stats?.payrollPending ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting Generation</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Period</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5 truncate">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </p>
            <p className="text-[11px] text-indigo-600 font-medium mt-0.5">Processed {stats?.payrollPaid ?? 0} Paid</p>
          </div>
        </div>
      </div>

      {/* ── Filters & Period Selection ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, ID, department..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Filters: Month, Year, Status */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {MONTHS.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="ALL">All Status</option>
            <option value="GENERATED">Generated</option>
            <option value="PAID">Paid</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* ── Payroll Records Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20">
            <Loading fullScreen={false} message="Loading payroll records..." />
          </div>
        ) : filteredPayroll.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Payroll Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No payroll has been generated for {MONTHS[selectedMonth - 1]} {selectedYear} matching your criteria.
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-xl text-xs font-bold transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate {MONTHS[selectedMonth - 1]} {selectedYear} Payroll
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Attendance</th>
                  <th className="py-3.5 px-4 text-right">Gross Salary</th>
                  <th className="py-3.5 px-4 text-right">Deductions</th>
                  <th className="py-3.5 px-4 text-right">Net Salary</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {filteredPayroll.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {record.employeeName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{record.employeeName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {record.employeeCode} • {record.department || 'General'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Period */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">
                        {MONTHS[record.month - 1]} {record.year}
                      </span>
                    </td>

                    {/* Attendance summary pill */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded" title="Present Days">
                          {record.presentDays}P
                        </span>
                        {record.leaveDays > 0 && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 font-semibold rounded" title="Leave Days">
                            {record.leaveDays}L
                          </span>
                        )}
                        {record.lateDays > 0 && (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 font-semibold rounded" title="Late Days">
                            {record.lateDays} Late
                          </span>
                        )}
                        <span className="text-slate-400 text-[10px]" title="Total Working Days">
                          / {record.workingDays}d
                        </span>
                      </div>
                    </td>

                    {/* Gross */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {formatCurrency(record.grossSalary)}
                    </td>

                    {/* Deductions */}
                    <td className="py-3.5 px-4 text-right font-medium text-rose-600">
                      -{formatCurrency(record.totalDeduction)}
                    </td>

                    {/* Net Salary */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                      {formatCurrency(record.netSalary)}
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          record.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : record.status === 'GENERATED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/payroll/payslip/${record.id}`)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View Official Payslip"
                        >
                          <FileText className="h-4 w-4" />
                        </button>

                        {record.status === 'GENERATED' && (
                          <button
                            onClick={() => handleStatusChange(record, 'PAID')}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold text-[10px] transition-colors"
                            title="Mark as Disbursed / Paid"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Generate Monthly Payroll Modal ── */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Generate Monthly Payroll
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              This will calculate earnings, deductions, and attendance summaries for all active employees for:
            </p>

            <div className="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {MONTHS[selectedMonth - 1]} {selectedYear}
                </p>
                <p className="text-[11px] text-slate-400">All configured active staff</p>
              </div>
              <span className="px-2.5 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold">
                Batch Mode
              </span>
            </div>

            {genSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{genSuccessMsg}</span>
              </div>
            )}

            {genErrorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{genErrorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                disabled={generating}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {generating ? 'Processing Calculations...' : 'Confirm & Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayroll;
