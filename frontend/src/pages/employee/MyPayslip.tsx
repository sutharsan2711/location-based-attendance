import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Printer,
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
} from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { EmployeePayslipData } from '../../types/payroll';
import Loading from '../../components/Loading';

const MyPayslip: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState<EmployeePayslipData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayslip = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await payrollService.getMyPayslip(Number(id));
        setPayslip(data);
      } catch (err: any) {
        console.error('Failed to load payslip:', err);
        setError(err.response?.data?.message || 'Access Denied: You cannot view another employee\'s payslip.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayslip();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) return <Loading fullScreen={false} message="Generating your official payslip..." />;

  if (error || !payslip) {
    return (
      <div className="py-20 text-center space-y-3">
        <h3 className="text-base font-bold text-slate-800">
          {error || 'Payslip Not Found'}
        </h3>
        <button
          onClick={() => navigate('/employee/payroll')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Return to My Payroll
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* ── Action Header (Hidden on Print) ── */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/employee/payroll')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Payroll
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 active:scale-95"
        >
          <Printer className="h-3.5 w-3.5" />
          Print / Download PDF
        </button>
      </div>

      {/* ── Official Printable Payslip ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-10 space-y-8 text-slate-800 print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
              EC
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{payslip.companyName}</h2>
              <p className="text-xs text-slate-400 font-medium">{payslip.companyAddress}</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
              Salary Slip for {payslip.monthName} {payslip.year}
            </span>
            <p className="text-[11px] text-slate-400 font-medium">Doc: PAY-{payslip.payrollId}-{payslip.month}-{payslip.year}</p>
          </div>
        </div>

        {/* Employee & Period Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Employee Name</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">{payslip.employeeName}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Employee Code</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{payslip.employeeCode}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Department</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{payslip.department || 'Operations'}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Payment Status</span>
            <span className={`font-bold mt-0.5 block ${payslip.status === 'PAID' ? 'text-emerald-600' : 'text-blue-600'}`}>
              {payslip.status}
            </span>
          </div>
        </div>

        {/* Attendance Summary */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            Attendance Summary ({payslip.monthName} {payslip.year})
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 text-center">
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Working Days</span>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">{payslip.workingDays}</p>
            </div>
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Present</span>
              <p className="text-base font-extrabold text-emerald-700 mt-0.5">{payslip.presentDays}</p>
            </div>
            <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Leaves</span>
              <p className="text-base font-extrabold text-amber-700 mt-0.5">{payslip.leaveDays}</p>
            </div>
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">Permissions</span>
              <p className="text-base font-extrabold text-indigo-700 mt-0.5">{payslip.permissionDays}</p>
            </div>
            <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Late Days</span>
              <p className="text-base font-extrabold text-rose-700 mt-0.5">{payslip.lateDays}</p>
            </div>
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Absent</span>
              <p className="text-base font-extrabold text-slate-700 mt-0.5">{payslip.absentDays}</p>
            </div>
          </div>
        </div>

        {/* Earnings vs Deductions Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Earnings */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Earnings</span>
              <span className="text-xs font-bold text-emerald-800">Amount (₹)</span>
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Basic Salary</span>
                <span className="font-semibold text-slate-800">{formatCurrency(payslip.basicSalary)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>House Rent Allowance (HRA)</span>
                <span className="font-semibold text-slate-800">{formatCurrency(payslip.hra)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Dearness Allowance (DA)</span>
                <span className="font-semibold text-slate-800">{formatCurrency(payslip.da)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Conveyance Allowance</span>
                <span className="font-semibold text-slate-800">{formatCurrency(payslip.conveyanceAllowance)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Medical Allowance</span>
                <span className="font-semibold text-slate-800">{formatCurrency(payslip.medicalAllowance)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Other Allowance</span>
                <span className="font-semibold text-slate-800">{formatCurrency(payslip.otherAllowance)}</span>
              </div>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-900">
              <span>Gross Earnings</span>
              <span className="text-emerald-600">{formatCurrency(payslip.grossSalary)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Deductions</span>
              <span className="text-xs font-bold text-rose-800">Amount (₹)</span>
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Provident Fund (PF)</span>
                <span className="font-semibold text-slate-800">{formatCurrency(payslip.pf)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Employee State Insurance (ESI)</span>
                <span className="font-semibold text-slate-800">{formatCurrency(payslip.esi)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Professional Tax (PT)</span>
                <span className="font-semibold text-slate-800">{formatCurrency(payslip.professionalTax)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Other Deductions</span>
                <span className="font-semibold text-slate-800">{formatCurrency(payslip.otherDeduction)}</span>
              </div>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-900">
              <span>Total Deductions</span>
              <span className="text-rose-600">{formatCurrency(payslip.totalDeduction)}</span>
            </div>
          </div>
        </div>

        {/* Net Take-Home Pay Banner */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 block">
              Net Disbursable Salary
            </span>
            <p className="text-xs text-slate-300 mt-0.5">
              Gross Earnings ({formatCurrency(payslip.grossSalary)}) - Deductions ({formatCurrency(payslip.totalDeduction)})
            </p>
          </div>

          <div className="text-right">
            <span className="text-3xl font-black text-emerald-400 block tracking-tight">
              {formatCurrency(payslip.netSalary)}
            </span>
          </div>
        </div>

        {/* Signoff */}
        <div className="pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>This is a computer-generated salary slip and does not require a physical signature.</p>
          <p className="text-[10px] text-slate-300 mt-1">EC Learnix Attendance & Payroll Portal</p>
        </div>
      </div>
    </div>
  );
};

export default MyPayslip;
