import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import { LeaveBalanceSummary, LeaveBalanceItem, LeaveDetailItem } from '../../types/request';
import Loading from '../../components/Loading';
import {
  Download,
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';

const currentYear = new Date().getFullYear();

const LeaveBalances: React.FC = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [balanceData, setBalanceData] = useState<LeaveBalanceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Drawer for "View Details"
  const [activeDetailModal, setActiveDetailModal] = useState<LeaveBalanceItem | null>(null);

  const fetchBalances = useCallback(async (year: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestService.getMyLeaveBalances(year);
      setBalanceData(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load leave balances.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalances(selectedYear);
  }, [selectedYear, fetchBalances]);

  const handleExportStatement = () => {
    if (!balanceData) return;
    const rows = [
      ['Leave Type', 'Granted', 'Consumed', 'Balance Available'],
      ...balanceData.balances.map((b) => [b.title, b.granted, b.consumed, b.balance]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Leave_Balance_Statement_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatNumber = (val: number) => {
    if (val === 0) return '0';
    return val < 10 ? `0${val}` : `${val}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none animate-fade-in">
      {/* ── Top Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title with greytHR teal badge */}
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 bg-teal-500 rounded-sm transform rotate-45 shrink-0 shadow-sm" />
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Leave Balances</h1>
        </div>

        {/* Action Controls: Apply, Download, Year */}
        <div className="flex items-center gap-3">
          {/* Apply Button */}
          <button
            onClick={() => navigate('/employee/leaves')}
            className="px-5 py-1.5 rounded-lg border border-blue-500 bg-white hover:bg-blue-50 text-blue-600 font-semibold text-xs transition-colors shadow-sm"
          >
            Apply
          </button>

          {/* Download Statement Button */}
          <button
            onClick={handleExportStatement}
            className="h-8 w-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors shadow-sm"
            title="Download Leave Statement"
          >
            <Download className="h-4 w-4" />
          </button>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 shadow-sm cursor-pointer"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading fullScreen={false} message="Loading leave balances..." />
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        /* ── Leave Balance Cards Grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {balanceData?.balances.map((item) => {
            const hasDetails = item.granted > 0 || item.consumed > 0;
            const percentageConsumed =
              item.granted > 0
                ? Math.min(100, Math.round((item.consumed / item.granted) * 100))
                : 0;

            return (
              <div
                key={item.type}
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between min-h-[185px]"
              >
                {/* Card Top: Title & Granted Count */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-800 truncate" title={item.title}>
                    {item.title}
                  </h3>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap block">
                      Granted: {item.granted}
                    </span>
                    {item.carriedForward !== undefined && item.carriedForward > 0 && (
                      <span className="text-[10px] text-indigo-600 font-bold whitespace-nowrap block">
                        +{item.carriedForward} Carried
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Center: Big Balance Number */}
                <div className="text-center py-2">
                  <div className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
                    {formatNumber(item.balance)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">Available Balance</div>

                  {hasDetails && (
                    <button
                      onClick={() => setActiveDetailModal(item)}
                      className="text-[11px] text-blue-600 hover:underline font-semibold mt-1 inline-block"
                    >
                      View Details
                    </button>
                  )}
                </div>

                {/* Card Bottom: Consumed Progress Bar */}
                <div className="pt-2 border-t border-slate-100">
                  {item.granted > 0 || (item.carriedForward && item.carriedForward > 0) ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>
                          {item.consumed} of {item.granted + (item.carriedForward || 0)} Consumed
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentageConsumed}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-4" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── View Details Modal / Drawer ── */}
      {activeDetailModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-slide">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">{activeDetailModal.title}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Year {selectedYear} Leave Breakdown & Rollover
                </p>
              </div>
              <button
                onClick={() => setActiveDetailModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Summary Metrics Bar */}
            <div className="mt-4 grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                  New Grant
                </span>
                <span className="text-sm font-extrabold text-slate-800 font-mono">
                  {activeDetailModal.granted}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide block">
                  Carried Over
                </span>
                <span className="text-sm font-extrabold text-indigo-600 font-mono">
                  {activeDetailModal.carriedForward || 0}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                  Consumed
                </span>
                <span className="text-sm font-extrabold text-blue-600 font-mono">
                  {activeDetailModal.consumed}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                  Available
                </span>
                <span className="text-sm font-extrabold text-emerald-600 font-mono">
                  {activeDetailModal.balance}
                </span>
              </div>
            </div>

            {/* History Table */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-700 mb-2">Leave Consumption History</h4>

              {activeDetailModal.breakdown && activeDetailModal.breakdown.length > 0 ? (
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-3">Date Period</th>
                        <th className="py-2 px-3">Days</th>
                        <th className="py-2 px-3">Reason</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {activeDetailModal.breakdown.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                            {item.fromDate} {item.fromDate !== item.toDate && `to ${item.toDate}`}
                          </td>
                          <td className="py-2.5 px-3 font-bold font-mono">
                            <span className={item.isHalfDay ? 'text-indigo-600 font-extrabold' : ''}>
                              {item.days}
                            </span>
                            {item.isHalfDay && (
                              <span className="block text-[9px] font-semibold text-slate-400">
                                {item.halfDaySession === 'FIRST_HALF' ? '1st Half' : '2nd Half'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 max-w-[150px] truncate" title={item.reason}>
                            {item.reason}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                item.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  No leaves consumed yet for this category in {selectedYear}.
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setActiveDetailModal(null);
                  navigate('/employee/leaves');
                }}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Apply for {activeDetailModal.title} <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setActiveDetailModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
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

export default LeaveBalances;
