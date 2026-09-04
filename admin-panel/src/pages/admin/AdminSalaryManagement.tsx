import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Search,
  Plus,
  Edit2,
  History,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  X,
  TrendingUp,
  CreditCard,
  Building,
} from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { SalaryStructure, SalaryHistory } from '../../types/payroll';
import Loading from '../../components/Loading';

const AdminSalaryManagement: React.FC = () => {
  const navigate = useNavigate();
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit/Create Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const [formData, setFormData] = useState<{
    basicSalary: number;
    hra: number;
    da: number;
    conveyanceAllowance: number;
    medicalAllowance: number;
    otherAllowance: number;
    pf: number;
    esi: number;
    professionalTax: number;
    otherDeduction: number;
    effectiveFrom: string;
  }>({
    basicSalary: 0,
    hra: 0,
    da: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    otherAllowance: 0,
    pf: 0,
    esi: 0,
    professionalTax: 0,
    otherDeduction: 0,
    effectiveFrom: new Date().toISOString().split('T')[0],
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // History Drawer State
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<SalaryHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [selectedEmpName, setSelectedEmpName] = useState<string>('');

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const data = await payrollService.getAllSalaryStructures();
      setStructures(data);
    } catch (err: any) {
      console.error('Failed to load salary structures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  const openEditModal = (item: SalaryStructure) => {
    setEditingStructure(item);
    setFormData({
      basicSalary: item.basicSalary || 0,
      hra: item.hra || 0,
      da: item.da || 0,
      conveyanceAllowance: item.conveyanceAllowance || 0,
      medicalAllowance: item.medicalAllowance || 0,
      otherAllowance: item.otherAllowance || 0,
      pf: item.pf || 0,
      esi: item.esi || 0,
      professionalTax: item.professionalTax || 0,
      otherDeduction: item.otherDeduction || 0,
      effectiveFrom: item.effectiveFrom || new Date().toISOString().split('T')[0],
    });
    setSuccessMsg(null);
    setErrorMsg(null);
    setShowModal(true);
  };

  const openHistory = async (item: SalaryStructure) => {
    setSelectedEmpName(item.employeeName || 'Employee');
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const history = await payrollService.getSalaryHistory(item.employeeId);
      setHistoryList(history);
    } catch (err: any) {
      console.error('Failed to fetch salary history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Real-time calculation helpers
  const calculatedGross =
    Number(formData.basicSalary || 0) +
    Number(formData.hra || 0) +
    Number(formData.da || 0) +
    Number(formData.conveyanceAllowance || 0) +
    Number(formData.medicalAllowance || 0) +
    Number(formData.otherAllowance || 0);

  const calculatedDeductions =
    Number(formData.pf || 0) +
    Number(formData.esi || 0) +
    Number(formData.professionalTax || 0) +
    Number(formData.otherDeduction || 0);

  const calculatedNet = calculatedGross - calculatedDeductions;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStructure) return;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await payrollService.saveSalaryStructure({
        employeeId: editingStructure.employeeId,
        ...formData,
      });

      setSuccessMsg('Salary structure saved successfully!');
      fetchStructures();
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update salary structure.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStructures = structures.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      (item.employeeName && item.employeeName.toLowerCase().includes(query)) ||
      (item.employeeCode && item.employeeCode.toLowerCase().includes(query)) ||
      (item.department && item.department.toLowerCase().includes(query))
    );
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
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => navigate('/payroll')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Payroll Records
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <DollarSign className="h-7 w-7 text-primary-600 p-1 bg-primary-50 rounded-xl" />
            Salary Structures & Packages
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure employee compensation packages, itemized allowances, statutory deductions, and maintain salary revisions.
          </p>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee by name, ID, or department..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Configured: <span className="font-bold text-slate-800">{structures.length} Employees</span>
        </div>
      </div>

      {/* ── Salary Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20">
            <Loading fullScreen={false} message="Loading salary packages..." />
          </div>
        ) : filteredStructures.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Employees Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No staff members match your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4 text-right">Basic Salary</th>
                  <th className="py-3.5 px-4 text-right">Allowances</th>
                  <th className="py-3.5 px-4 text-right">Gross Salary</th>
                  <th className="py-3.5 px-4 text-right">Deductions</th>
                  <th className="py-3.5 px-4 text-right">Net Take-Home</th>
                  <th className="py-3.5 px-4 text-center">Effective From</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {filteredStructures.map((item) => {
                  const totalAllowances =
                    (item.hra || 0) +
                    (item.da || 0) +
                    (item.conveyanceAllowance || 0) +
                    (item.medicalAllowance || 0) +
                    (item.otherAllowance || 0);

                  return (
                    <tr key={item.employeeId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Employee Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {item.employeeName ? item.employeeName.charAt(0) : 'E'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{item.employeeName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {item.employeeCode} • {item.department || 'General'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Basic */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {formatCurrency(item.basicSalary || 0)}
                      </td>

                      {/* Allowances */}
                      <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                        +{formatCurrency(totalAllowances)}
                      </td>

                      {/* Gross */}
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                        {formatCurrency(item.grossSalary || 0)}
                      </td>

                      {/* Deductions */}
                      <td className="py-3.5 px-4 text-right font-medium text-rose-600">
                        -{formatCurrency(item.totalDeduction || 0)}
                      </td>

                      {/* Net Salary */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                        {formatCurrency(item.netSalary || 0)}
                      </td>

                      {/* Effective From */}
                      <td className="py-3.5 px-4 text-center text-[11px] text-slate-500 font-medium">
                        {item.effectiveFrom || 'Current'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openHistory(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Salary Revision History"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit Salary Structure"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Salary Structure Modal ── */}
      {showModal && editingStructure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Configure Salary Structure
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingStructure.employeeName} ({editingStructure.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 pt-4">
              {/* Earnings Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  Monthly Earnings & Allowances (₹)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Basic Salary <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={formData.basicSalary}
                      onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">HRA</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.hra}
                      onChange={(e) => setFormData({ ...formData, hra: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">DA</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.da}
                      onChange={(e) => setFormData({ ...formData, da: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Conveyance Allowance</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.conveyanceAllowance}
                      onChange={(e) => setFormData({ ...formData, conveyanceAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Medical Allowance</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.medicalAllowance}
                      onChange={(e) => setFormData({ ...formData, medicalAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Other Allowance</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.otherAllowance}
                      onChange={(e) => setFormData({ ...formData, otherAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-rose-600" />
                  Monthly Deductions (₹)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">PF</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.pf}
                      onChange={(e) => setFormData({ ...formData, pf: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">ESI</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.esi}
                      onChange={(e) => setFormData({ ...formData, esi: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Professional Tax</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.professionalTax}
                      onChange={(e) => setFormData({ ...formData, professionalTax: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Other Deduction</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.otherDeduction}
                      onChange={(e) => setFormData({ ...formData, otherDeduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Effective From Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Effective From
                </label>
                <input
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                  className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Gross Salary</p>
                  <p className="text-base font-extrabold text-emerald-400 mt-0.5">{formatCurrency(calculatedGross)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Deductions</p>
                  <p className="text-base font-extrabold text-rose-400 mt-0.5">{formatCurrency(calculatedDeductions)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Net Take-Home</p>
                  <p className="text-base font-extrabold text-white mt-0.5">{formatCurrency(calculatedNet)}</p>
                </div>
              </div>

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Salary Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Salary History Modal ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <History className="h-5 w-5 text-primary-600" />
                  Salary Revision History
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedEmpName}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 max-h-96 overflow-y-auto space-y-3">
              {historyLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading history...</div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-medium">
                  No historical salary revisions logged for this employee.
                </div>
              ) : (
                historyList.map((item, index) => (
                  <div key={item.id || index} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Effective: {item.effectiveFrom}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Basic: {formatCurrency(item.basicSalary)} • Gross: {formatCurrency(item.grossSalary)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {formatCurrency(item.netSalary)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">
                        {index === 0 ? 'Current Active' : 'Previous'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSalaryManagement;
