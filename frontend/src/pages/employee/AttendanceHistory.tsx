import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { Attendance } from '../../types/attendance';
import { formatDate, formatTime } from '../../utils/dateUtils';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import {
  FileSpreadsheet,
  List,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';

const AttendanceHistory: React.FC = () => {
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'excel' vs 'table'
  const [viewMode, setViewMode] = useState<'excel' | 'table'>('excel');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: string; val: string }>({
    row: 1,
    col: 'A',
    val: 'Attendance Records',
  });

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

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

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Login Time', 'Logout Time', 'Working Hours', 'Distance (m)', 'Punch Status', 'Timing Status'],
      ...history.map((r) => [
        r.attendanceDate,
        r.loginTime ? formatTime(r.loginTime) : '--',
        r.logoutTime ? formatTime(r.logoutTime) : '--',
        calculateWorkingHours(r.loginTime, r.logoutTime),
        r.loginDistance !== null && r.loginDistance !== undefined ? r.loginDistance.toFixed(1) : '--',
        r.status,
        r.timingStatus || 'PRESENT',
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `My_Attendance_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = history.filter((row) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      row.attendanceDate.toLowerCase().includes(q) ||
      (row.timingStatus && row.timingStatus.toLowerCase().includes(q)) ||
      (row.status && row.status.toLowerCase().includes(q))
    );
  });

  const renderStatusBadge = (row: Attendance) => {
    if (row.timingStatus === 'LEAVE') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          ● Leave
        </span>
      );
    }
    if (row.timingStatus === 'PERMISSION') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          ● Permission
        </span>
      );
    }
    if (row.timingStatus === 'LATE') {
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
    if (row.status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          ✓ Present
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-400">
        Not Logged In
      </span>
    );
  };

  const columns = [
    {
      header: 'Date',
      render: (row: Attendance) => (
        <span className="font-bold text-slate-800 text-xs">{formatDate(row.attendanceDate)}</span>
      ),
    },
    {
      header: 'Login Time',
      render: (row: Attendance) => (
        <span className="font-mono text-xs text-slate-800 font-medium">
          {row.loginTime ? formatTime(row.loginTime) : '--'}
        </span>
      ),
    },
    {
      header: 'Logout Time',
      render: (row: Attendance) => (
        <span className="font-mono text-xs text-slate-800 font-medium">
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
      header: 'GPS Distance',
      render: (row: Attendance) => (
        <span className="text-xs text-slate-500 font-medium">
          {row.loginDistance !== null && row.loginDistance !== undefined
            ? `${row.loginDistance.toFixed(1)}m`
            : '--'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row: Attendance) => renderStatusBadge(row),
    },
  ];

  if (loading) return <Loading fullScreen message="Loading attendance history..." />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none animate-fade-in">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Attendance History & Swipe Logs
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            View your daily login records, verified GPS offset distances, and timing classifications
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
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

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Download Excel CSV
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search dates, status (Late, Present, Leave)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500 bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold font-mono">
          Showing {filteredHistory.length} records
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : viewMode === 'excel' ? (
        /* ── Live Excel Spreadsheet View ── */
        <div className="rounded-2xl border border-slate-300 bg-white shadow-xl overflow-hidden font-sans">
          {/* Excel Title Bar */}
          <div className="bg-[#107c41] text-white px-4 py-2 flex items-center justify-between">
            <span className="font-bold text-xs tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4" /> My_Attendance_Logs.xlsx
            </span>
            <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded font-mono">
              Live Spreadsheet
            </span>
          </div>

          {/* Formula Bar */}
          <div className="bg-slate-100 border-b border-slate-300 px-4 py-1.5 flex items-center gap-3 text-xs">
            <div className="h-7 w-16 bg-white border border-slate-300 rounded flex items-center justify-center font-mono font-bold text-slate-700 text-xs">
              {selectedCell.col}
              {selectedCell.row}
            </div>
            <span className="font-serif italic font-bold text-slate-400 text-xs">fx</span>
            <input
              type="text"
              readOnly
              value={selectedCell.val}
              className="flex-1 h-7 bg-white border border-slate-300 rounded px-3 text-xs font-mono text-slate-800 outline-none"
            />
          </div>

          {/* Grid Table */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse border border-slate-300 font-mono">
              <thead className="bg-[#f3f4f6] text-slate-600 sticky top-0 z-10 select-none">
                <tr className="border-b border-slate-300 text-center font-bold text-[11px]">
                  <th className="w-12 py-1.5 px-2 bg-[#e5e7eb] border-r border-slate-300 text-slate-500 font-mono text-[10px]">
                    #
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700">
                    A <span className="text-[10px] font-sans font-semibold text-slate-500 block">Date</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700">
                    B <span className="text-[10px] font-sans font-semibold text-slate-500 block">Login Time</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700">
                    C <span className="text-[10px] font-sans font-semibold text-slate-500 block">Logout Time</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700">
                    D <span className="text-[10px] font-sans font-semibold text-slate-500 block">Hours</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700">
                    E <span className="text-[10px] font-sans font-semibold text-slate-500 block">Distance</span>
                  </th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-slate-700">
                    F <span className="text-[10px] font-sans font-semibold text-slate-500 block">Status</span>
                  </th>
                  <th className="py-1.5 px-3 border-slate-300 text-slate-700">
                    G <span className="text-[10px] font-sans font-semibold text-slate-500 block">Timing / Day Status</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 bg-white">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 font-sans text-xs">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((row, idx) => {
                    const rowNum = idx + 1;
                    const loginT = row.loginTime ? formatTime(row.loginTime) : '--';
                    const logoutT = row.logoutTime ? formatTime(row.logoutTime) : '--';
                    const hrs = calculateWorkingHours(row.loginTime, row.logoutTime);
                    const dist = row.loginDistance ? `${row.loginDistance.toFixed(1)}m` : '--';

                    return (
                      <tr key={row.id || idx} className="hover:bg-blue-50/40 transition-colors cursor-cell group">
                        <td className="py-2 px-2 bg-[#f9fafb] border-r border-slate-300 text-center font-bold text-[10px] text-slate-400 group-hover:bg-slate-200">
                          {rowNum}
                        </td>
                        <td
                          onClick={() => setSelectedCell({ row: rowNum, col: 'A', val: row.attendanceDate })}
                          className={`py-2 px-3 border-r border-slate-200 font-bold ${
                            selectedCell.row === rowNum && selectedCell.col === 'A'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {row.attendanceDate}
                        </td>
                        <td
                          onClick={() => setSelectedCell({ row: rowNum, col: 'B', val: loginT })}
                          className={`py-2 px-3 border-r border-slate-200 font-bold ${
                            selectedCell.row === rowNum && selectedCell.col === 'B'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {loginT}
                        </td>
                        <td
                          onClick={() => setSelectedCell({ row: rowNum, col: 'C', val: logoutT })}
                          className={`py-2 px-3 border-r border-slate-200 font-bold ${
                            selectedCell.row === rowNum && selectedCell.col === 'C'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {logoutT}
                        </td>
                        <td
                          onClick={() => setSelectedCell({ row: rowNum, col: 'D', val: hrs })}
                          className={`py-2 px-3 border-r border-slate-200 font-bold bg-slate-50/70 ${
                            selectedCell.row === rowNum && selectedCell.col === 'D'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {hrs}
                        </td>
                        <td
                          onClick={() => setSelectedCell({ row: rowNum, col: 'E', val: dist })}
                          className={`py-2 px-3 border-r border-slate-200 text-slate-500 ${
                            selectedCell.row === rowNum && selectedCell.col === 'E'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {dist}
                        </td>
                        <td
                          onClick={() => setSelectedCell({ row: rowNum, col: 'F', val: row.status })}
                          className={`py-2 px-3 border-r border-slate-200 text-[10px] font-bold text-slate-600 ${
                            selectedCell.row === rowNum && selectedCell.col === 'F'
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/50'
                              : ''
                          }`}
                        >
                          {row.status}
                        </td>
                        <td
                          onClick={() =>
                            setSelectedCell({ row: rowNum, col: 'G', val: row.timingStatus || 'PRESENT' })
                          }
                          className={`py-2 px-3 ${
                            selectedCell.row === rowNum && selectedCell.col === 'G'
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

          {/* Excel Footer */}
          <div className="bg-slate-100 border-t border-slate-300 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-600">
            <span className="font-bold text-emerald-700">Sheet1: My_Swipes</span>
            <span>Total Rows: {filteredHistory.length}</span>
          </div>
        </div>
      ) : (
        <Card>
          <Table
            data={filteredHistory}
            columns={columns}
            keyExtractor={(row) => row.id}
            emptyMessage="You have no attendance records logged yet."
          />
        </Card>
      )}
    </div>
  );
};

export default AttendanceHistory;
