import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { Attendance } from '../../types/attendance';
import { formatDate, formatTime } from '../../utils/dateUtils';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Loading from '../../components/Loading';

const AttendanceHistory: React.FC = () => {
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
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

    fetchHistory();
  }, []);

  const columns = [
    {
      header: 'Date',
      render: (row: Attendance) => (
        <span className="font-bold text-slate-800">{formatDate(row.attendanceDate)}</span>
      ),
    },
    {
      header: 'Login Time',
      render: (row: Attendance) => (
        <span className="font-medium text-slate-700">{row.loginTime ? formatTime(row.loginTime) : '--'}</span>
      ),
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
      render: (row: Attendance) => (
        <span className="font-medium text-slate-700">{row.logoutTime ? formatTime(row.logoutTime) : '--'}</span>
      ),
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

  if (loading) return <Loading fullScreen message="Loading attendance history..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 md:text-3xl">
          My Attendance History
        </h1>
        <p className="text-sm text-slate-400">View your check-in and check-out logs and verified coordinates</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : (
        <Card>
          <Table
            data={history}
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
