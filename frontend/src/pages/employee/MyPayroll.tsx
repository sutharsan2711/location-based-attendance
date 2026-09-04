import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle,
  FileText,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { EmployeeSalaryStructure, EmployeePayrollRecord } from '../../types/payroll';
import Loading from '../../components/Loading';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MyPayroll: React.FC = () => {
  const navigate = useNavigate();
  const [salaryStructure, setSalaryStructure] = useState<EmployeeSalaryStructure | null>(null);
  const [payrollHistory, setPayrollHistory] = useState<EmployeePayrollRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [salaryData, historyData] = await Promise.all([
          payrollService.getMySalary(),
          payrollService.getMyPayrollList(),
        ]);
        setSalaryStructure(salaryData);
        setPayrollHistory(historyData);
      } catch (err: any) {
        console.error('Failed to load my payroll info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) return <Loading fullScreen={false} message="Loading your salary & payslip data..." />;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-blue-600 p-1 bg-blue-50 rounded-lg" />
          My Compensation & Payslips
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your active salary package structure and download official monthly salary slips.
        </p>
      </div>

      {/* ── 3 Big Metric Cards: Gross, Deductions, Net Salary ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Salary</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {formatCurrency(salaryStructure?.grossSalary || 0)}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Total Monthly Earnings</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Deductions</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">
              {formatCurrency(salaryStructure?.totalDeduction || 0)}
            </p>
            <p className="text-[11px] text-rose-500 font-semibold mt-0.5">PF, ESI & Statutory</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-5 rounded-2xl text-white shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Net Take-Home Pay</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {formatCurrency(salaryStructure?.netSalary || 0)}
            </p>
            <p className="text-[11px] text-blue-100 font-medium mt-0.5">Monthly Disbursable</p>
          </div>
        </div>
      </div>

      {/* ── Itemized Salary Breakdown ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Active Salary Structure Breakdown
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">
            Effective: {salaryStructure?.effectiveFrom || 'Current'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Earnings */}
          <div className="p-5 space-y-3 text-xs">
            <h4 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
              Monthly Earnings (₹)
            </h4>
            <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
              <span>Basic Salary</span>
              <span className="font-semibold text-slate-800">{formatCurrency(salaryStructure?.basicSalary || 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
              <span>House Rent Allowance (HRA)</span>
              <span className="font-semibold text-slate-800">{formatCurrency(salaryStructure?.hra || 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
              <span>Dearness Allowance (DA)</span>
              <span className="font-semibold text-slate-800">{formatCurrency(salaryStructure?.da || 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
              <span>Conveyance Allowance</span>
              <span className="font-semibold text-slate-800">{formatCurrency(salaryStructure?.conveyanceAllowance || 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
              <span>Medical Allowance</span>
              <span className="font-semibold text-slate-800">{formatCurrency(salaryStructure?.medicalAllowance || 0)}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>Other Allowance</span>
              <span className="font-semibold text-slate-800">{formatCurrency(salaryStructure?.otherAllowance || 0)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="p-5 space-y-3 text-xs">
            <h4 className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-2">
              Monthly Deductions (₹)
            </h4>
            <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
              <span>Provident Fund (PF)</span>
              <span className="font-semibold text-slate-800">{formatCurrency(salaryStructure?.pf || 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
              <span>Employee State Insurance (ESI)</span>
              <span className="font-semibold text-slate-800">{formatCurrency(salaryStructure?.esi || 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
              <span>Professional Tax (PT)</span>
              <span className="font-semibold text-slate-800">{formatCurrency(salaryStructure?.professionalTax || 0)}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>Other Deductions</span>
              <span className="font-semibold text-slate-800">{formatCurrency(salaryStructure?.otherDeduction || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Monthly Payslips History ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Monthly Payslip Statement History
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Access and download official salary slips for processed payroll months
            </p>
          </div>
        </div>

        {payrollHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            No monthly payslips generated yet for your account.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payrollHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      {MONTHS[item.month - 1]} {item.year} Payslip
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Present: {item.presentDays}d • Working: {item.workingDays}d • Leaves: {item.leaveDays}d
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block">
                      {formatCurrency(item.netSalary)}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/employee/payroll/${item.id}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                  >
                    <span>View Payslip</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPayroll;
