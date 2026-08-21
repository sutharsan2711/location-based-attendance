import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import { LeaveRequest } from '../../types/request';
import { formatDate } from '../../utils/dateUtils';
import Loading from '../../components/Loading';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const LeaveCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      try {
        const data = await requestService.getMyLeaves();
        setLeaves(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const getLeaveForDay = (day: number) => {
    const formattedDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leaves.find((l) => formattedDay >= l.fromDate && formattedDay <= l.toDate);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 select-none animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 bg-teal-500 rounded-sm transform rotate-45 shrink-0 shadow-sm" />
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Leave Calendar</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/employee/leaves')}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Apply Leave
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        {/* Month Navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 pt-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 pt-2">
          {daysArray.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="h-20 rounded-xl bg-slate-50/40" />;
            }

            const leaveMatch = getLeaveForDay(day);
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <div
                key={`day-${day}`}
                className={`h-20 rounded-xl border p-2 flex flex-col justify-between transition-all ${
                  isToday
                    ? 'border-blue-400 bg-blue-50/30'
                    : leaveMatch
                    ? 'border-indigo-200 bg-indigo-50/40'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-bold ${
                      isToday
                        ? 'h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]'
                        : 'text-slate-700'
                    }`}
                  >
                    {day}
                  </span>
                </div>

                {leaveMatch && (
                  <div
                    className="p-1 rounded bg-indigo-100 text-indigo-800 text-[9px] font-bold truncate leading-tight"
                    title={`${leaveMatch.leaveType}: ${leaveMatch.reason}`}
                  >
                    {leaveMatch.leaveType.replace('_', ' ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeaveCalendar;
